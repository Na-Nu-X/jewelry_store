import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../core/config/site.config';
import { ContactTopic } from '../../core/models/jewelry.models';
import { ApiService, describeApiError } from '../../core/services/api.service';
import { focusFirstInvalid, validateControls } from '../../core/utils/forms';
import { PHONE_PATTERN } from '../../core/utils/validators';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SizedImagePipe } from '../../shared/pipes/eur.pipe';

@Component({
  selector: 'app-atelier-page',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, FieldErrorComponent, SizedImagePipe],
  templateUrl: './atelier.page.html',
  styleUrl: './atelier.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtelierPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ApiService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly config = SITE_CONFIG;
  protected readonly yearsActive = new Date().getFullYear() - SITE_CONFIG.brand.foundedYear;
  /** Earliest bookable date: tomorrow (ISO yyyy-mm-dd). */
  protected readonly minDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  protected readonly topics: readonly { value: ContactTopic; label: string }[] = [
    { value: 'konzultacia', label: 'Osobná konzultácia v ateliéri' },
    { value: 'otazka', label: 'Otázka k šperku' },
    { value: 'ine', label: 'Iné' },
  ];

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    topic: this.fb.control<ContactTopic>('konzultacia'),
    preferred_date: [''],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(3000)]],
    client_name: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', Validators.pattern(PHONE_PATTERN)],
    email: ['', [Validators.required, Validators.email]],
    consent: [false, Validators.requiredTrue],
  });

  protected submit(): void {
    this.error.set(null);
    if (!validateControls(this.form)) {
      focusFirstInvalid(this.host.nativeElement.querySelector('#kontakt'));
      return;
    }
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.api
      .createContactMessage({
        topic: v.topic,
        preferred_date: v.preferred_date || null,
        message: v.message.trim(),
        client_name: v.client_name.trim(),
        phone: v.phone.trim(),
        email: v.email.trim(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.error.set(describeApiError(err));
        },
      });
  }

  protected restart(): void {
    this.form.reset();
    this.submitted.set(false);
  }
}
