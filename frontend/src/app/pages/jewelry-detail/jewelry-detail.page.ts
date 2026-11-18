import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map, of } from 'rxjs';

import { SITE_CONFIG } from '../../core/config/site.config';
import { JewelryImage } from '../../core/models/jewelry.models';
import { RING_SIZES } from '../../core/models/options';
import { ApiService, describeApiError } from '../../core/services/api.service';
import { BagService } from '../../core/services/bag.service';
import { SeoService } from '../../core/services/seo.service';
import { UiService } from '../../core/services/ui.service';
import { badgeClass, metalSubtitle, sizedImage } from '../../core/utils/format';
import { CardSkeletonComponent } from '../../shared/components/card-skeleton/card-skeleton.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { JewelryCardComponent } from '../../shared/components/jewelry-card/jewelry-card.component';
import { DecimalSkPipe, EurPipe, SizedImagePipe } from '../../shared/pipes/eur.pipe';

const ENGRAVING_MAX = 40;

@Component({
  selector: 'app-jewelry-detail-page',
  imports: [
    RouterLink,
    IconComponent,
    JewelryCardComponent,
    CardSkeletonComponent,
    EurPipe,
    DecimalSkPipe,
    SizedImagePipe,
  ],
  templateUrl: './jewelry-detail.page.html',
  styleUrl: './jewelry-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class JewelryDetailPage {
  private readonly api = inject(ApiService);
  private readonly bag = inject(BagService);
  private readonly ui = inject(UiService);
  private readonly seo = inject(SeoService);
  private readonly document = inject(DOCUMENT);

  /** Bound from the `:slug` route parameter. */
  readonly slug = input.required<string>();

  protected readonly config = SITE_CONFIG;
  protected readonly ringSizes = RING_SIZES;
  protected readonly engravingMax = ENGRAVING_MAX;

  protected readonly item = rxResource({
    params: () => this.slug(),
    stream: ({ params: slug }) => this.api.getJewelryItem(slug),
  });

  protected readonly related = rxResource({
    params: () => this.item.value(),
    stream: ({ params: piece }) =>
      piece
        ? this.api
            .getJewelry({ category: [piece.category.slug], page_size: 5 })
            .pipe(map((page) => page.results.filter((r) => r.slug !== piece.slug).slice(0, 4)))
        : of([]),
  });

  protected readonly notFound = computed(() => {
    const err = this.item.error();
    return err instanceof HttpErrorResponse && err.status === 404;
  });
  protected readonly errorMessage = computed(() =>
    this.item.error() ? describeApiError(this.item.error()) : null,
  );

  protected readonly gallery = computed<JewelryImage[]>(() => {
    const piece = this.item.value();
    if (!piece) return [];
    if (piece.images.length) return piece.images;
    return [{ id: 0, image_url: piece.cover_image_url, caption: piece.name, display_order: 0 }];
  });

  protected readonly subtitle = computed(() => {
    const piece = this.item.value();
    return piece ? metalSubtitle(piece) : '';
  });
  protected readonly badgeClass = computed(() => badgeClass(this.item.value()?.badge ?? 'none'));
  protected readonly soldOut = computed(() => this.item.value()?.availability === 'vypredane');
  protected readonly isInvestment = computed(
    () => this.item.value()?.category.slug === 'investicne-zlato',
  );
  protected readonly isPreciousMetal = computed(() => this.item.value()?.metal_type !== 'striebro');

  /* Gallery & lightbox state – reset whenever the product changes. */
  protected readonly activeIndex = linkedSignal({ source: this.slug, computation: () => 0 });
  protected readonly activeImage = computed(() => this.gallery()[this.activeIndex()] ?? null);
  protected readonly lightboxOpen = signal(false);
  protected readonly zoomOrigin = signal('50% 50%');
  protected readonly zooming = signal(false);

  /* Configurator state */
  protected readonly ringSize = linkedSignal<string, number | null>({
    source: this.slug,
    computation: () => null,
  });
  protected readonly engravingEnabled = linkedSignal({ source: this.slug, computation: () => false });
  protected readonly engraving = linkedSignal({ source: this.slug, computation: () => '' });
  protected readonly sizeError = signal(false);

  constructor() {
    effect(() => {
      const piece = this.item.value();
      if (piece) {
        this.seo.setTitle(`${piece.name} – ${piece.category.name}`);
        this.seo.setDescription(`${metalSubtitle(piece)}. ${piece.description}`);
      } else if (this.notFound()) {
        this.seo.setTitle('Šperk sa nenašiel');
      }
    });

    // Apply a size chosen in the ring-size guide.
    effect(() => {
      const suggested = this.ui.suggestedRingSize();
      if (suggested === null) return;
      untracked(() => {
        const clamped = Math.min(64, Math.max(48, suggested));
        this.ringSize.set(clamped);
        this.sizeError.set(false);
        this.ui.suggestedRingSize.set(null);
      });
    });

    effect(() => {
      this.document.body.classList.toggle('no-scroll', this.lightboxOpen());
    });
    inject(DestroyRef).onDestroy(() => this.document.body.classList.remove('no-scroll'));
  }

  protected img(url: string, width: number): string {
    return sizedImage(url, width);
  }

  /* --- Gallery -------------------------------------------------------- */

  protected select(index: number): void {
    const count = this.gallery().length;
    if (!count) return;
    this.activeIndex.set((index + count) % count);
  }

  protected onZoomMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.zoomOrigin.set(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
    this.zooming.set(true);
  }

  protected openLightbox(): void {
    this.lightboxOpen.set(true);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.lightboxOpen()) return;
    if (event.key === 'Escape') this.lightboxOpen.set(false);
    if (event.key === 'ArrowRight') this.select(this.activeIndex() + 1);
    if (event.key === 'ArrowLeft') this.select(this.activeIndex() - 1);
  }

  private touchStartX = 0;

  protected onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.clientX ?? 0;
  }

  protected onTouchEnd(event: TouchEvent): void {
    const dx = (event.changedTouches[0]?.clientX ?? 0) - this.touchStartX;
    if (Math.abs(dx) > 40) this.select(this.activeIndex() + (dx < 0 ? 1 : -1));
  }

  /* --- Configurator --------------------------------------------------- */

  protected chooseSize(size: number): void {
    this.ringSize.set(size);
    this.sizeError.set(false);
  }

  protected openSizeGuide(): void {
    this.ui.openSizeGuide();
  }

  protected onEngraving(event: Event): void {
    this.engraving.set((event.target as HTMLInputElement).value.slice(0, ENGRAVING_MAX));
  }

  protected addToBag(reserve = false): void {
    const piece = this.item.value();
    if (!piece || this.soldOut()) return;
    if (piece.is_ring && !this.ringSize()) {
      this.sizeError.set(true);
      this.document.getElementById('ring-sizes')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    this.bag.add(piece, {
      subtitle: this.subtitle(),
      ringSize: this.ringSize(),
      engraving: this.engravingEnabled() ? this.engraving() : '',
    });
    if (reserve) {
      this.bag.setMode('store');
      this.ui.openBag('checkout');
    } else {
      this.ui.toast(`„${piece.name}“ bol pridaný do košíka.`);
      this.ui.openBag();
    }
  }
}
