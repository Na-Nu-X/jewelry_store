import { AbstractControl } from '@angular/forms';

/** Marks the controls as touched and returns whether they are all valid. */
export function validateControls(...controls: AbstractControl[]): boolean {
  controls.forEach((c) => c.markAllAsTouched());
  return controls.every((c) => c.valid);
}

/** Scrolls the first invalid field into view and focuses it. */
export function focusFirstInvalid(root: HTMLElement | null | undefined): void {
  const el = root?.querySelector<HTMLElement>('.ng-invalid:not(form):not(fieldset):not([formgroupname])');
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el?.focus({ preventScroll: true });
}
