import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { JewelryItem } from '../../../core/models/jewelry.models';
import { UiService } from '../../../core/services/ui.service';
import { badgeClass, metalSubtitle, sizedSrcset, sizedImage } from '../../../core/utils/format';
import { EurPipe } from '../../pipes/eur.pipe';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-jewelry-card',
  imports: [RouterLink, EurPipe, IconComponent],
  templateUrl: './jewelry-card.component.html',
  styleUrl: './jewelry-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JewelryCardComponent {
  private readonly ui = inject(UiService);

  readonly item = input.required<JewelryItem>();
  /** Set for above-the-fold cards to load eagerly. */
  readonly priority = input(false);

  protected readonly subtitle = computed(() => metalSubtitle(this.item()));
  protected readonly badgeClass = computed(() => badgeClass(this.item().badge));
  protected readonly image = computed(() => sizedImage(this.item().cover_image_url, 720));
  protected readonly srcset = computed(() =>
    sizedSrcset(this.item().cover_image_url, [480, 720, 960]),
  );
  protected readonly soldOut = computed(() => this.item().availability === 'vypredane');

  protected quickView(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.ui.openQuickView(this.item());
  }
}
