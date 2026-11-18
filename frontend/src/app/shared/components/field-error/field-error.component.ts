import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { validationMessage } from '../../../core/utils/validators';

/**
 * Displays a Slovak validation message for a reactive-form control once it has been touched.
 * Listens to the control's unified `events` stream so it works with zoneless change detection.
 */
@Component({
  selector: 'app-field-error',
  template: `
    @if (message(); as msg) {
      <span class="field__error" role="alert">{{ msg }}</span>
    }
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl>();
  /** Overrides the message for the `required` error (e.g. consent checkboxes). */
  readonly requiredMessage = input<string | null>(null);

  private readonly tick = signal(0);

  protected readonly message = computed(() => {
    this.tick();
    const ctrl = this.control();
    if (!ctrl.touched || !ctrl.invalid) return null;
    const custom = this.requiredMessage();
    return custom && ctrl.hasError('required') ? custom : validationMessage(ctrl.errors);
  });

  constructor() {
    effect((onCleanup) => {
      const sub = this.control().events.subscribe(() => this.tick.update((n) => n + 1));
      onCleanup(() => sub.unsubscribe());
    });
  }
}
