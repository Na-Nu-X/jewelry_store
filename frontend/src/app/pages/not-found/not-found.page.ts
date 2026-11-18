import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, IconComponent],
  template: `
    <section class="container nf">
      <span class="nf__code num">404</span>
      <h1>Táto stránka sa stratila</h1>
      <p class="lead">Ako zatúlaná náušnica. Skúste začať od kolekcie alebo sa vráťte na úvod.</p>
      <div class="nf__actions">
        <a routerLink="/kolekcia" class="btn btn--primary">Prezrieť kolekciu <app-icon name="arrow-right" /></a>
        <a routerLink="/" class="btn btn--outline">Na úvodnú stránku</a>
      </div>
    </section>
  `,
  styles: `
    @use 'styles/mixins' as *;

    .nf {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $space-4;
      padding-block: $space-12;
      text-align: center;

      &__code {
        font-family: $font-serif;
        font-size: clamp(5rem, 14vw, 9rem);
        line-height: 1;
        color: $color-gold;
      }

      .lead {
        max-width: 460px;
      }

      &__actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: $space-3;
        margin-top: $space-4;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
