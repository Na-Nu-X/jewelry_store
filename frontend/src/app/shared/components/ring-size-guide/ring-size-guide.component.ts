import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { UiService } from '../../../core/services/ui.service';
import { DecimalSkPipe } from '../../pipes/eur.pipe';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

type MeasureMode = 'diameter' | 'circumference';

export interface RingSizeRow {
  eu: number;
  diameter: number;
  circumference: number;
  us: number;
}

export const EU_MIN = 48;
export const EU_MAX = 66;

/** EU/SK ring size equals the inner circumference in millimetres. */
export function ringSizeFromCircumference(circumference: number): number {
  return Math.min(EU_MAX, Math.max(EU_MIN, Math.round(circumference)));
}

function usSize(circumference: number): number {
  return Math.round(((circumference - 36.5) / 2.55) * 4) / 4;
}

const ROWS: readonly RingSizeRow[] = Array.from({ length: EU_MAX - EU_MIN + 1 }, (_, i) => {
  const eu = EU_MIN + i;
  return { eu, circumference: eu, diameter: eu / Math.PI, us: usSize(eu) };
});

/**
 * Interactive ring-size converter & guide.
 * Rendered as a modal (via UiService) or inline on content pages.
 */
@Component({
  selector: 'app-ring-size-guide',
  imports: [IconComponent, DecimalSkPipe, NgTemplateOutlet],
  templateUrl: './ring-size-guide.component.html',
  styleUrl: './ring-size-guide.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-inline]': "mode() === 'inline'",
    '(document:keydown.escape)': "mode() === 'modal' && closed.emit()",
  },
})
export class RingSizeGuideComponent {
  private readonly ui = inject(UiService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly mode = input<'modal' | 'inline'>('modal');
  readonly closed = output<void>();

  protected readonly rows = ROWS;
  protected readonly measureMode = signal<MeasureMode>('diameter');
  /** Value in mm for the active measuring mode. */
  protected readonly value = signal(17.2);

  protected readonly circumference = computed(() =>
    this.measureMode() === 'diameter' ? this.value() * Math.PI : this.value(),
  );
  protected readonly diameter = computed(() => this.circumference() / Math.PI);
  protected readonly euSize = computed(() => ringSizeFromCircumference(this.circumference()));
  protected readonly outOfRange = computed(() => {
    const c = this.circumference();
    return c < EU_MIN - 0.5 || c > EU_MAX + 0.5;
  });
  protected readonly sliderBounds = computed(() =>
    this.measureMode() === 'diameter'
      ? { min: 14, max: 22, step: 0.1 }
      : { min: 44, max: 70, step: 0.5 },
  );

  constructor() {
    afterNextRender(() => {
      if (this.mode() === 'modal') {
        this.host.nativeElement.querySelector<HTMLElement>('.modal')?.focus();
      }
    });
  }

  protected setMode(mode: MeasureMode): void {
    if (mode === this.measureMode()) return;
    // Keep the same physical measurement when switching units.
    const c = this.circumference();
    this.measureMode.set(mode);
    this.value.set(round(mode === 'diameter' ? c / Math.PI : c, mode === 'diameter' ? 1 : 0.5));
  }

  protected onInput(event: Event): void {
    const n = Number.parseFloat((event.target as HTMLInputElement).value.replace(',', '.'));
    if (Number.isFinite(n)) this.value.set(n);
  }

  protected selectRow(row: RingSizeRow): void {
    this.value.set(
      this.measureMode() === 'diameter' ? round(row.diameter, 0.1) : row.circumference,
    );
  }

  protected useSize(): void {
    this.ui.suggestedRingSize.set(this.euSize());
    this.ui.toast(`Veľkosť ${this.euSize()} bola zvolená.`);
    this.closed.emit();
  }
}

function round(value: number, step: number): number {
  return Math.round(value / step) * step;
}
