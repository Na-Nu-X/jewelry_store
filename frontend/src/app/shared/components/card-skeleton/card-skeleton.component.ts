import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-card-skeleton',
  template: `
    <div class="skeleton media"></div>
    <div class="skeleton line short"></div>
    <div class="skeleton line"></div>
    <div class="skeleton line mid"></div>
  `,
  styles: `
    @use 'styles/mixins' as *;

    :host {
      display: flex;
      flex-direction: column;
      gap: $space-3;
    }
    .media {
      aspect-ratio: 4 / 5;
      margin-bottom: $space-2;
    }
    .line {
      height: 14px;
      width: 85%;
    }
    .short {
      width: 35%;
      height: 10px;
    }
    .mid {
      width: 50%;
    }
  `,
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSkeletonComponent {}
