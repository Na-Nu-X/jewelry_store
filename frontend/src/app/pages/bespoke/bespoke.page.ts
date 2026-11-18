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

import { SITE_CONFIG } from '../../core/config/site.config';
import { BespokeJewelryType, Gemstone, MetalType } from '../../core/models/jewelry.models';
import {
  BESPOKE_TYPE_OPTIONS,
  BUDGET_OPTIONS,
  GEMSTONE_OPTIONS,
  METAL_OPTIONS,
} from '../../core/models/options';
import { ApiService, describeApiError } from '../../core/services/api.service';
import { UiService } from '../../core/services/ui.service';
import { focusFirstInvalid, validateControls } from '../../core/utils/forms';
import { PHONE_PATTERN } from '../../core/utils/validators';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SizedImagePipe } from '../../shared/pipes/eur.pipe';

const STEPS = ['Typ šperku', 'Materiál', 'Predstava', 'Kontakt'] as const;

@Component({
  selector: 'app-bespoke-page',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, FieldErrorComponent, SizedImagePipe],
  templateUrl: './bespoke.page.html',
  styleUrl: './bespoke.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BespokePage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ApiService);
  protected readonly ui = inject(UiService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly config = SITE_CONFIG;
  protected readonly steps = STEPS;
  protected readonly typeOptions = BESPOKE_TYPE_OPTIONS;
  protected readonly metalOptions = METAL_OPTIONS;
  protected readonly gemstoneOptions = GEMSTONE_OPTIONS;
  protected readonly budgetOptions = BUDGET_OPTIONS;

  protected readonly process = [
    {
      title: 'Konzultácia & 3D návrh',
      text: 'Pri káve v ateliéri si vypočujeme váš príbeh. Do týždňa pripravíme skicu a fotorealistický 3D návrh.',
      meta: '1. týždeň',
      icon: 'pen',
    },
    {
      title: 'Výber zlata a drahokamov',
      text: 'Vyberiete si rýdzosť a farbu zlata a osobne si prezriete certifikované diamanty či farebné kamene.',
      meta: 'Osobne v ateliéri',
      icon: 'diamond',
    },
    {
      title: 'Ručná zlatnícka výroba',
      text: 'Šperk vzniká v našej dielni – odlievanie, kovanie, osadenie kameňov a ručné leštenie do zrkadlového lesku.',
      meta: '2–3 týždne',
      icon: 'hammer',
    },
    {
      title: 'Puncovanie a odovzdanie',
      text: 'Šperk overí Puncový úrad SR. Odovzdáme vám ho v luxusnej kazete spolu s certifikátom a zárukou.',
      meta: 'Doživotný servis',
      icon: 'stamp',
    },
  ] as const;

  protected readonly step = signal(0);
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    type: this.fb.group({
      jewelry_type: this.fb.control<BespokeJewelryType | ''>('', Validators.required),
    }),
    material: this.fb.group({
      preferred_metal: this.fb.control<MetalType | ''>(''),
      gemstone_preference: this.fb.control<Gemstone | ''>(''),
      ring_sizes: ['', Validators.maxLength(60)],
      engraving_text: ['', Validators.maxLength(120)],
    }),
    vision: this.fb.group({
      estimated_budget: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(15), Validators.maxLength(3000)]],
    }),
    contact: this.fb.group({
      client_name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
      email: ['', [Validators.required, Validators.email]],
      consent: [false, Validators.requiredTrue],
    }),
  });

  private readonly jewelryType = toSignal(this.form.controls.type.controls.jewelry_type.valueChanges, {
    initialValue: this.form.controls.type.controls.jewelry_type.value,
  });
  protected readonly isRingType = computed(() =>
    ['zasnubny_prsten', 'svadobne_obrucky'].includes(this.jewelryType()),
  );
  protected readonly isBands = computed(() => this.jewelryType() === 'svadobne_obrucky');

  private readonly groups = [
    this.form.controls.type,
    this.form.controls.material,
    this.form.controls.vision,
    this.form.controls.contact,
  ];

  protected next(): void {
    if (!validateControls(this.groups[this.step()])) {
      focusFirstInvalid(this.host.nativeElement.querySelector('.form-card'));
      return;
    }
    this.step.update((s) => Math.min(s + 1, STEPS.length - 1));
    this.scrollToForm();
  }

  protected back(): void {
    this.step.update((s) => Math.max(0, s - 1));
    this.scrollToForm();
  }

  protected goTo(index: number): void {
    // Only allow jumping back, or forward to steps whose predecessors are valid.
    if (index <= this.step() || this.groups.slice(0, index).every((g) => g.valid)) {
      this.step.set(index);
    }
  }

  protected selectType(value: BespokeJewelryType): void {
    this.form.controls.type.controls.jewelry_type.setValue(value);
  }

  protected submit(): void {
    this.error.set(null);
    if (!validateControls(...this.groups)) {
      const firstInvalid = this.groups.findIndex((g) => g.invalid);
      this.step.set(firstInvalid);
      return;
    }
    const { type, material, vision, contact } = this.form.getRawValue();
    this.submitting.set(true);
    this.api
      .createBespokeRequest({
        jewelry_type: type.jewelry_type as BespokeJewelryType,
        preferred_metal: material.preferred_metal,
        gemstone_preference: material.gemstone_preference,
        ring_sizes: this.isRingType() ? material.ring_sizes.trim() : '',
        engraving_text: material.engraving_text.trim(),
        estimated_budget: vision.estimated_budget,
        description: vision.description.trim(),
        client_name: contact.client_name.trim(),
        phone: contact.phone.trim(),
        email: contact.email.trim(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
          this.scrollToForm();
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.error.set(describeApiError(err));
        },
      });
  }

  protected restart(): void {
    this.form.reset();
    this.step.set(0);
    this.submitted.set(false);
  }

  private scrollToForm(): void {
    this.host.nativeElement
      .querySelector('#dopyt')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
