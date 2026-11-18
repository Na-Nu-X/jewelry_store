import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast',
  imports: [IconComponent],
  template: `
    <div class="toasts" aria-live="polite" aria-atomic="false">
      @for (t of ui.toasts(); track t.id) {
        <div class="toast"><app-icon name="check" /> {{ t.message }}</div>
      }
    </div>
  `,
  styles: `
    @use 'styles/mixins' as *;

    .toasts {
      position: fixed;
      left: 50%;
      bottom: $space-5;
      z-index: $z-toast;
      display: flex;
      flex-direction: column;
      gap: $space-2;
      width: max-content;
      max-width: calc(100vw - 32px);
      transform: translateX(-50%);
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: $space-3;
      padding: $space-3 $space-5;
      font-size: 0.88rem;
      color: #fff;
      background: $color-text;
      border-radius: $radius-pill;
      box-shadow: $shadow-lift;
      animation: fade-up $duration $ease-out both;

      app-icon {
        color: $color-gold;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  protected readonly ui = inject(UiService);
}
