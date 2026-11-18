import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { UiService } from './core/services/ui.service';
import { BagDrawerComponent } from './shared/components/bag-drawer/bag-drawer.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { QuickViewComponent } from './shared/components/quick-view/quick-view.component';
import { RingSizeGuideComponent } from './shared/components/ring-size-guide/ring-size-guide.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    BagDrawerComponent,
    RingSizeGuideComponent,
    QuickViewComponent,
    ToastComponent,
  ],
  template: `
    <a class="skip-link" href="#main">Preskočiť na obsah</a>
    <app-navbar />
    <main id="main" tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />

    <app-bag-drawer />
    @if (ui.sizeGuideOpen()) {
      <app-ring-size-guide mode="modal" (closed)="ui.closeSizeGuide()" />
    }
    @if (ui.quickViewItem(); as item) {
      <app-quick-view [item]="item" />
    }
    <app-toast />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    main {
      flex: 1;
      outline: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly ui = inject(UiService);
}
