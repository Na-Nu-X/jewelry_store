/** Mirrors the backend phone validation (`+421 905 123 456`, `0905/123 456`, …). */
export const PHONE_PATTERN = /^\+?[0-9 ()/-]{9,20}$/;

/** Slovak validation messages keyed by Angular validator error names. */
export function validationMessage(errors: Record<string, unknown> | null): string | null {
  if (!errors) return null;
  if (errors['required']) return 'Toto pole je povinné.';
  if (errors['requiredTrue'] || errors['required_true']) return 'Pre odoslanie je potrebný váš súhlas.';
  if (errors['email']) return 'Zadajte platnú e-mailovú adresu.';
  if (errors['pattern']) return 'Zadajte platné telefónne číslo, napr. +421 905 123 456.';
  const minLength = errors['minlength'] as { requiredLength: number } | undefined;
  if (minLength) return `Zadajte aspoň ${minLength.requiredLength} znakov.`;
  const maxLength = errors['maxlength'] as { requiredLength: number } | undefined;
  if (maxLength) return `Maximálne ${maxLength.requiredLength} znakov.`;
  const min = errors['min'] as { min: number } | undefined;
  if (min) return `Minimálna hodnota je ${min.min}.`;
  const max = errors['max'] as { max: number } | undefined;
  if (max) return `Maximálna hodnota je ${max.max}.`;
  return 'Skontrolujte, prosím, zadanú hodnotu.';
}
