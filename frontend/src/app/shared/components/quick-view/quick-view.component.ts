import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { JewelryItem } from '../../../core/models/jewelry.models';
import { BagService } from '../../../core/services/bag.service';
import { UiService } from '../../../core/services/ui.service';
import { badgeClass, metalSubtitle, sizedImage } from '../../../core/utils/format';
import { DecimalSkPipe, EurPipe } from '../../pipes/eur.pipe';
import { IconComponent } from '../icon/icon.component';

/** Lightweight preview of a piece opened from a jewelry card. */
@Component({
  selector: 'app-quick-view',
  imports: [RouterLink, EurPipe, DecimalSkPipe, IconComponent],
  templateUrl: './quick-view.component.html',
  styleUrl: './quick-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'close()' },
})
export class QuickViewComponent {
  private readonly ui = inject(UiService);
  private readonly bag = inject(BagService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly item = input.required<JewelryItem>();

  protected readonly subtitle = computed(() => metalSubtitle(this.item()));
  protected readonly badgeClass = computed(() => badgeClass(this.item().badge));
  protected readonly image = computed(() => sizedImage(this.item().cover_image_url, 1000));
  protected readonly soldOut = computed(() => this.item().availability === 'vypredane');

  constructor() {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('.modal')?.focus());
  }

  protected close(): void {
    this.ui.closeQuickView();
  }

  /** Rings need a size – send the customer to the full configurator. */
  protected primaryAction(): void {
    const piece = this.item();
    if (piece.is_ring) {
      this.close();
      void this.router.navigate(['/kolekcia', piece.slug]);
      return;
    }
    this.bag.add(piece, { subtitle: this.subtitle() });
    this.ui.toast(`„${piece.name}“ bol pridaný do košíka.`);
    this.ui.openBag();
  }
}
