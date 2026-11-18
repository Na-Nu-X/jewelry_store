import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../../core/config/site.config';
import { OrderResponse } from '../../../core/models/jewelry.models';
import { RING_SIZES } from '../../../core/models/options';
import { ApiService, describeApiError } from '../../../core/services/api.service';
import { BagService, FulfilmentMode } from '../../../core/services/bag.service';
import { UiService } from '../../../core/services/ui.service';
import { sizedImage } from '../../../core/utils/format';
import { PHONE_PATTERN } from '../../../core/utils/validators';
import { EurPipe } from '../../pipes/eur.pipe';
import { FieldErrorComponent } from '../field-error/field-error.component';
import { IconComponent } from '../icon/icon.component';

/** Slide-over shopping bag, checkout and in-store reservation. */
@Component({
  selector: 'app-bag-drawer',
  imports: [ReactiveFormsModule, RouterLink, EurPipe, IconComponent, FieldErrorComponent],
  templateUrl: './bag-drawer.component.html',
  styleUrl: './bag-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'ui.bagOpen() && ui.closeBag()',
  },
})
export class BagDrawerComponent {
  protected readonly bag = inject(BagService);
  protected readonly ui = inject(UiService);
  private readonly api = inject(ApiService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly config = SITE_CONFIG;
  protected readonly ringSizes = RING_SIZES;
  protected readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmation = signal<OrderResponse | null>(null);

  protected readonly form = this.fb.group({
    client_name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    delivery_address: [''],
    note: ['', Validators.maxLength(1000)],
    consent: [false, Validators.requiredTrue],
  });

  protected readonly isStore = computed(() => this.bag.mode() === 'store');

  constructor() {
    // Courier delivery requires an address; store pickup does not.
    effect(() => {
      const ctrl = this.form.controls.delivery_address;
      ctrl.setValidators(this.isStore() ? [] : [Validators.required, Validators.minLength(10)]);
      ctrl.updateValueAndValidity({ emitEvent: false });
    });

    // Move focus into the drawer when it opens.
    effect(() => {
      if (this.ui.bagOpen()) {
        queueMicrotask(() => this.panel()?.nativeElement.focus());
      }
    });
  }

  protected thumb(url: string): string {
    return sizedImage(url, 200);
  }

  protected setMode(mode: FulfilmentMode): void {
    this.bag.setMode(mode);
  }

  protected onRingSize(key: string, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.bag.setRingSize(key, value ? Number(value) : null);
  }

  protected onEngraving(key: string, event: Event): void {
    this.bag.setEngraving(key, (event.target as HTMLInputElement).value);
  }

  protected goToCheckout(): void {
    if (this.bag.missingRingSize()) {
      this.error.set('Pri prsteňoch, prosím, zvoľte veľkosť.');
      return;
    }
    this.error.set(null);
    this.ui.bagStep.set('checkout');
  }

  protected submit(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.api
      .createOrder({
        order_type: this.bag.orderType(),
        items: this.bag.lines().map((l) => ({
          slug: l.slug,
          quantity: l.quantity,
          ring_size: l.ringSize,
          engraving: l.engraving,
        })),
        client_name: v.client_name.trim(),
        email: v.email.trim(),
        phone: v.phone.trim(),
        delivery_address: this.isStore() ? '' : v.delivery_address.trim(),
        note: v.note.trim(),
      })
      .subscribe({
        next: (order) => {
          this.submitting.set(false);
          this.confirmation.set(order);
          this.bag.clear();
          this.form.reset();
          this.ui.bagStep.set('success');
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.error.set(describeApiError(err));
        },
      });
  }
}
