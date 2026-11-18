import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { SITE_CONFIG } from '../config/site.config';

export function brandedTitle(pageTitle?: string): string {
  return pageTitle
    ? `${pageTitle} | ${SITE_CONFIG.brand.name}`
    : `${SITE_CONFIG.brand.name} – ${SITE_CONFIG.brand.wordmarkAccent}`;
}

/** Sets dynamic page titles and meta descriptions (e.g. for product pages). */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  setTitle(pageTitle?: string): void {
    this.title.setTitle(brandedTitle(pageTitle));
  }

  setDescription(description: string): void {
    this.meta.updateTag({ name: 'description', content: description.slice(0, 300) });
  }
}
