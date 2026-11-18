import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BuybackRate, SITE_CONFIG } from '../../core/config/site.config';
import { ServiceType } from '../../core/models/jewelry.models';
import { SERVICE_OPTIONS } from '../../core/models/options';
import { ApiService, describeApiError } from '../../core/services/api.service';
import { focusFirstInvalid, validateControls } from '../../core/utils/forms';
import { PHONE_PATTERN } from '../../core/utils/validators';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { DecimalSkPipe, EurPipe, SizedImagePipe } from '../../shared/pipes/eur.pipe';

const WEIGHT_MIN = 0.5;
const WEIGHT_MAX = 500;

@Component({
  selector: 'app-buyback-service-page',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, FieldErrorComponent, EurPipe, DecimalSkPipe, SizedImagePipe],
  templateUrl: './buyback-service.page.html',
  styleUrl: './buyback-service.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuybackServicePage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ApiService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly config = SITE_CONFIG;
  protected readonly rates: readonly BuybackRate[] = SITE_CONFIG.buyback.rates;
  protected readonly serviceOptions = SERVICE_OPTIONS;
  protected readonly weightMin = WEIGHT_MIN;
  protected readonly weightMax = WEIGHT_MAX;

  /* --- Calculator ----------------------------------------------------- */
  protected readonly rateId = signal<BuybackRate['id']>('14k');
  protected readonly weight = signal(10);
  protected readonly rate = computed(() => this.rates.find((r) => r.id === this.rateId()) ?? this.rates[0]);
  protected readonly estimate = computed(() => Math.round(this.rate().pricePerGram * this.weight()));

  protected onWeight(event: Event): void {
    const n = Number.parseFloat((event.target as HTMLInputElement).value.replace(',', '.'));
    if (Number.isFinite(n)) this.weight.set(Math.min(WEIGHT_MAX, Math.max(0, n)));
  }

  protected readonly buybackSteps = [
    { title: 'Prineste zlato', text: 'Bez objednania počas otváracích hodín – zlomky, staré šperky, mince aj zubné zlato.', icon: 'store' },
    { title: 'Overíme rýdzosť', text: 'Nedeštruktívne meranie XRF spektrometrom priamo pred vami. Zadarmo a nezáväzne.', icon: 'scale' },
    { title: 'Okamžitá výplata', text: 'Po odsúhlasení ceny vyplatíme sumu v hotovosti alebo prevodom na účet.', icon: 'check' },
  ] as const;

  protected readonly services = [
    { title: 'Úprava veľkosti prsteňa', price: 'od 25 €', text: 'Zväčšenie či zmenšenie vrátane obrúčok s kameňmi, spravidla do 3 dní.', icon: 'ring' },
    { title: 'Oprava retiazok a spájkovanie', price: 'od 15 €', text: 'Laserové spájkovanie bez poškodenia kameňov, výmena zapínania.', icon: 'hammer' },
    { title: 'Čistenie a rhodiovanie', price: 'od 20 €', text: 'Ultrazvuk, leštenie a nové rhodium pre biele zlato – šperk ako nový.', icon: 'sparkle' },
    { title: 'Výmena a doosadenie kameňov', price: 'od 30 €', text: 'Kontrola kotlíkov, dotiahnutie a doplnenie chýbajúcich kameňov.', icon: 'diamond' },
    { title: 'Gravírovanie', price: 'od 10 €', text: 'Ručné aj strojové gravírovanie mien, dátumov a iniciál.', icon: 'pen' },
    { title: 'Prerobenie dedičstva', price: 'individuálne', text: 'Zo starých šperkov vytvoríme nový – s úctou k ich príbehu.', icon: 'gift' },
  ] as const;

  /* --- Inquiry form --------------------------------------------------- */
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    service_type: this.fb.control<ServiceType>('vykup_zlata', Validators.required),
    estimated_weight_grams: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(100000)]),
    note: ['', Validators.maxLength(2000)],
    client_name: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    email: ['', [Validators.required, Validators.email]],
    consent: [false, Validators.requiredTrue],
  });

  protected readonly serviceType = toSignal(this.form.controls.service_type.valueChanges, {
    initialValue: this.form.controls.service_type.value,
  });

  /** Pre-fills the form from the calculator and scrolls to it. */
  protected requestBuyback(): void {
    this.form.patchValue({
      service_type: 'vykup_zlata',
      estimated_weight_grams: this.weight(),
      note: `Orientačne ${this.rate().label} (${this.rate().fineness}), cca ${this.weight()} g.`,
    });
    this.scrollToForm();
  }

  protected requestService(): void {
    this.form.patchValue({ service_type: 'oprava_uprava' });
    this.scrollToForm();
  }

  protected submit(): void {
    this.error.set(null);
    if (!validateControls(this.form)) {
      focusFirstInvalid(this.host.nativeElement.querySelector('#dopyt-servis'));
      return;
    }
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.api
      .createServiceInquiry({
        service_type: v.service_type,
        estimated_weight_grams: v.service_type === 'vykup_zlata' ? v.estimated_weight_grams : null,
        note: v.note.trim(),
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

  private scrollToForm(): void {
    this.host.nativeElement.querySelector('#dopyt-servis')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
