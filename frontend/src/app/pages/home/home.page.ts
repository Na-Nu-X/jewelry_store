import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { SITE_CONFIG } from '../../core/config/site.config';
import { ApiService } from '../../core/services/api.service';
import { sizedImage } from '../../core/utils/format';
import { SizedImagePipe } from '../../shared/pipes/eur.pipe';
import { CardSkeletonComponent } from '../../shared/components/card-skeleton/card-skeleton.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { JewelryCardComponent } from '../../shared/components/jewelry-card/jewelry-card.component';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, JewelryCardComponent, CardSkeletonComponent, IconComponent, SizedImagePipe],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly api = inject(ApiService);
  protected readonly config = SITE_CONFIG;
  protected readonly heroImage = sizedImage(SITE_CONFIG.images.hero, 1600);
  protected readonly skeletons = Array.from({ length: 4 });

  protected readonly featured = rxResource({
    stream: () =>
      this.api.getJewelry({ featured: true, page_size: 8 }).pipe(map((page) => page.results)),
  });

  protected readonly categories = rxResource({
    stream: () => this.api.getCategories(),
  });

  protected readonly guarantees = [
    {
      icon: 'stamp',
      title: 'Overené Puncovým úradom SR',
      text: 'Každý šperk z drahého kovu nesie úradnú puncovú značku a našu registrovanú značku zodpovednosti.',
    },
    {
      icon: 'diamond',
      title: 'Certifikované diamanty',
      text: 'Kamene nad 0,30 ct dodávame s certifikátom GIA, IGI alebo HRD. Pôvod mimo konfliktných oblastí.',
    },
    {
      icon: 'sparkle',
      title: 'Doživotný servis a čistenie zadarmo',
      text: 'Ultrazvukové čistenie, leštenie a kontrola osadenia kameňov – kedykoľvek, bez poplatku.',
    },
    {
      icon: 'gift',
      title: 'Luxusné darčekové balenie',
      text: 'Šperk odovzdávame v kazete s certifikátom pravosti a ručne písaným venovaním na želanie.',
    },
  ] as const;
}
