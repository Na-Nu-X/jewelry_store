import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { rxResource, takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, skip, switchMap, tap } from 'rxjs';

import {
  CatalogOrdering,
  CatalogQuery,
  FacetOption,
  JewelryItem,
} from '../../core/models/jewelry.models';
import { ApiService, describeApiError } from '../../core/services/api.service';
import { SeoService } from '../../core/services/seo.service';
import { formatEur } from '../../core/utils/format';
import { CardSkeletonComponent } from '../../shared/components/card-skeleton/card-skeleton.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { JewelryCardComponent } from '../../shared/components/jewelry-card/jewelry-card.component';

type MultiKey = 'category' | 'metal_type' | 'primary_gemstone' | 'availability';

interface FilterState {
  category: string[];
  metal_type: string[];
  primary_gemstone: string[];
  availability: string[];
  min_price: number | null;
  max_price: number | null;
  search: string;
  ordering: CatalogOrdering;
}

interface PricePreset {
  label: string;
  min: number | null;
  max: number | null;
}

const PAGE_SIZE = 12;
const ORDERINGS: readonly { value: CatalogOrdering; label: string }[] = [
  { value: '-created_at', label: 'Najnovšie' },
  { value: 'base_price', label: 'Cena: od najnižšej' },
  { value: '-base_price', label: 'Cena: od najvyššej' },
];
const PRICE_PRESETS: readonly PricePreset[] = [
  { label: 'do 1 000 €', min: null, max: 1000 },
  { label: '1 000 – 3 000 €', min: 1000, max: 3000 },
  { label: '3 000 – 5 000 €', min: 3000, max: 5000 },
  { label: 'nad 5 000 €', min: 5000, max: null },
];

function listParam(params: ParamMap, key: string): string[] {
  return (params.get(key) ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function numberParam(params: ParamMap, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseFilters(params: ParamMap): FilterState {
  const ordering = params.get('ordering') as CatalogOrdering | null;
  return {
    category: listParam(params, 'category'),
    metal_type: listParam(params, 'metal_type'),
    primary_gemstone: listParam(params, 'primary_gemstone'),
    availability: listParam(params, 'availability'),
    min_price: numberParam(params, 'min_price'),
    max_price: numberParam(params, 'max_price'),
    search: params.get('search') ?? '',
    ordering: ORDERINGS.some((o) => o.value === ordering) ? ordering! : '-created_at',
  };
}

@Component({
  selector: 'app-collection-page',
  imports: [RouterLink, JewelryCardComponent, CardSkeletonComponent, IconComponent],
  templateUrl: './collection.page.html',
  styleUrl: './collection.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'filtersOpen.set(false)' },
})
export class CollectionPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly document = inject(DOCUMENT);

  protected readonly orderings = ORDERINGS;
  protected readonly pricePresets = PRICE_PRESETS;
  protected readonly skeletons = Array.from({ length: 8 });

  /** Single source of truth: the URL query string. */
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly filters = computed(() => parseFilters(this.queryParams()));

  protected readonly facets = rxResource({ stream: () => this.api.getFacets() });
  protected readonly categories = rxResource({ stream: () => this.api.getCategories() });

  protected readonly visibleCount = signal(PAGE_SIZE);
  protected readonly items = signal<JewelryItem[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly loaded = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtersOpen = signal(false);

  /** Local search input, debounced into the URL. */
  protected readonly searchTerm = signal(this.filters().search);

  protected readonly hasMore = computed(() => this.items().length < this.total());

  protected readonly activeCategory = computed(() => {
    const selected = this.filters().category;
    if (selected.length !== 1) return null;
    return this.categories.value()?.find((c) => c.slug === selected[0]) ?? null;
  });

  protected readonly activeFilterCount = computed(() => {
    const f = this.filters();
    return (
      f.category.length +
      f.metal_type.length +
      f.primary_gemstone.length +
      f.availability.length +
      (f.min_price !== null || f.max_price !== null ? 1 : 0) +
      (f.search ? 1 : 0)
    );
  });

  /** Chips summarising active filters, each removable. */
  protected readonly activeChips = computed(() => {
    const f = this.filters();
    const facets = this.facets.value();
    const chips: { label: string; remove: () => void }[] = [];
    const add = (key: MultiKey, options: FacetOption[] | undefined) => {
      for (const value of f[key]) {
        const label = options?.find((o) => o.value === value)?.label ?? value;
        chips.push({ label, remove: () => this.toggle(key, value) });
      }
    };
    add('category', facets?.categories);
    add('metal_type', facets?.metal_types);
    add('primary_gemstone', facets?.gemstones);
    add('availability', facets?.availability);
    if (f.min_price !== null || f.max_price !== null) {
      chips.push({ label: this.priceLabel(f.min_price, f.max_price), remove: () => this.setPrice(null, null) });
    }
    if (f.search) {
      chips.push({ label: `„${f.search}“`, remove: () => this.clearSearch() });
    }
    return chips;
  });

  private readonly request = computed<CatalogQuery>(() => {
    const f = this.filters();
    return { ...f, page_size: this.visibleCount() };
  });

  constructor() {
    // Fetch whenever the URL filters or the visible count change.
    toObservable(this.request)
      .pipe(
        debounceTime(0),
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap((query) =>
          this.api.getJewelry(query).pipe(
            catchError((err: unknown) => {
              this.error.set(describeApiError(err));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((page) => {
        this.loading.set(false);
        this.loaded.set(true);
        if (page) {
          this.items.set(page.results);
          this.total.set(page.count);
        }
      });

    // Reset pagination when filters change (not on the initial run).
    toObservable(this.filters)
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe(() => this.visibleCount.set(PAGE_SIZE));

    // Debounced search → URL.
    toObservable(this.searchTerm)
      .pipe(debounceTime(350), distinctUntilChanged(), skip(1), takeUntilDestroyed())
      .subscribe((term) => this.updateParams({ search: term.trim() || null }));

    // Keep the input in sync when the URL changes elsewhere (back button, chip removal).
    effect(() => {
      const urlSearch = this.filters().search;
      untracked(() => {
        if (urlSearch.trim() !== this.searchTerm().trim()) this.searchTerm.set(urlSearch);
      });
    });

    effect(() => {
      const category = this.activeCategory();
      this.seo.setTitle(category ? `${category.name} – kolekcia` : 'Kolekcia šperkov');
    });

    effect(() => {
      this.document.body.classList.toggle('no-scroll', this.filtersOpen());
    });
    inject(DestroyRef).onDestroy(() => this.document.body.classList.remove('no-scroll'));
  }

  protected isChecked(key: MultiKey, value: string): boolean {
    return this.filters()[key].includes(value);
  }

  protected toggle(key: MultiKey, value: string): void {
    const current = this.filters()[key];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    this.updateParams({ [key]: next.length ? next.join(',') : null });
  }

  protected isPresetActive(p: PricePreset): boolean {
    const f = this.filters();
    return f.min_price === p.min && f.max_price === p.max;
  }

  protected togglePreset(p: PricePreset): void {
    if (this.isPresetActive(p)) this.setPrice(null, null);
    else this.setPrice(p.min, p.max);
  }

  protected onPriceInput(which: 'min' | 'max', event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const value = raw === '' ? null : Math.max(0, Math.round(Number(raw)));
    const f = this.filters();
    if (which === 'min') this.setPrice(Number.isFinite(value) ? value : null, f.max_price);
    else this.setPrice(f.min_price, Number.isFinite(value) ? value : null);
  }

  protected setPrice(min: number | null, max: number | null): void {
    // Swap if the user typed them the wrong way round.
    if (min !== null && max !== null && min > max) [min, max] = [max, min];
    this.updateParams({ min_price: min, max_price: max });
  }

  protected setOrdering(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as CatalogOrdering;
    this.updateParams({ ordering: value === '-created_at' ? null : value });
  }

  protected onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
    this.updateParams({ search: null });
  }

  protected clearAll(): void {
    this.searchTerm.set('');
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  protected loadMore(): void {
    this.visibleCount.update((n) => n + PAGE_SIZE);
  }

  protected priceLabel(min: number | null, max: number | null): string {
    if (min !== null && max !== null) return `${formatEur(min)} – ${formatEur(max)}`;
    if (min !== null) return `od ${formatEur(min)}`;
    return `do ${formatEur(max)}`;
  }

  protected resultLabel(count: number): string {
    if (count === 1) return '1 šperk';
    if (count >= 2 && count <= 4) return `${count} šperky`;
    return `${count} šperkov`;
  }

  private updateParams(patch: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: patch,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
