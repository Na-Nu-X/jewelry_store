import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { SITE_CONFIG } from '../config/site.config';

/** Appends the brand name from the white-label config to every route title. */
@Injectable({ providedIn: 'root' })
export class BrandTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.setPageTitle(this.buildTitle(snapshot));
  }

  setPageTitle(pageTitle: string | undefined): void {
    const brand = `${SITE_CONFIG.brand.name} – ${SITE_CONFIG.brand.wordmarkAccent}`;
    this.title.setTitle(pageTitle ? `${pageTitle} | ${SITE_CONFIG.brand.name}` : brand);
  }
}
