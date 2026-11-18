import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SITE_CONFIG } from '../../../core/config/site.config';
import { BagService } from '../../../core/services/bag.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onScroll()',
    '(document:keydown.escape)': 'ui.mobileNavOpen.set(false)',
  },
})
export class NavbarComponent {
  protected readonly config = SITE_CONFIG;
  protected readonly bag = inject(BagService);
  protected readonly ui = inject(UiService);

  protected readonly scrolled = signal(false);
  protected readonly bump = signal(false);

  constructor() {
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.ui.mobileNavOpen.set(false));

    // Subtle pulse of the bag counter whenever a piece is added.
    effect((onCleanup) => {
      if (!this.bag.lastAddedAt()) return;
      untracked(() => this.bump.set(true));
      const timer = setTimeout(() => this.bump.set(false), 600);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected onScroll(): void {
    this.scrolled.set(window.scrollY > 12);
  }

  protected toggleMobileNav(): void {
    this.ui.mobileNavOpen.update((open) => !open);
  }
}
