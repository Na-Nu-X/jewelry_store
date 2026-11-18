import { Injectable, computed, effect, signal } from '@angular/core';

import { SITE_CONFIG } from '../config/site.config';
import { JewelryItem, OrderType } from '../models/jewelry.models';
import { toNumber } from '../utils/format';

export interface BagLine {
  /** Unique per slug + size + engraving, so different configurations are separate lines. */
  key: string;
  slug: string;
  sku: string;
  name: string;
  imageUrl: string;
  subtitle: string;
  unitPrice: number;
  quantity: number;
  isRing: boolean;
  ringSize: number | null;
  engraving: string;
}

export type FulfilmentMode = 'courier' | 'store';

export const FULFILMENT_TO_ORDER_TYPE: Record<FulfilmentMode, OrderType> = {
  courier: 'eshop_objednavka',
  store: 'rezervacia_predajna',
};

interface PersistedBag {
  version: 1;
  lines: BagLine[];
  mode: FulfilmentMode;
}

const STORAGE_KEY = 'aurelia.bag.v1';
const MAX_QUANTITY = 10;

/**
 * Shopping bag & in-store reservation state.
 * Pure Angular Signals, persisted to localStorage.
 */
@Injectable({ providedIn: 'root' })
export class BagService {
  private readonly _lines = signal<BagLine[]>([]);
  private readonly _mode = signal<FulfilmentMode>('courier');

  readonly lines = this._lines.asReadonly();
  readonly mode = this._mode.asReadonly();

  readonly count = computed(() => this._lines().reduce((sum, l) => sum + l.quantity, 0));
  readonly isEmpty = computed(() => this._lines().length === 0);
  readonly subtotal = computed(() =>
    this._lines().reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
  );
  readonly shipping = computed(() => 0); // insured courier is complimentary
  readonly total = computed(() => this.subtotal() + this.shipping());
  readonly orderType = computed(() => FULFILMENT_TO_ORDER_TYPE[this._mode()]);
  readonly missingRingSize = computed(() =>
    this._lines().some((l) => l.isRing && !l.ringSize),
  );

  /** Incremented on every add – lets the navbar animate the counter. */
  readonly lastAddedAt = signal(0);

  constructor() {
    this.restore();
    effect(() => {
      const state: PersistedBag = { version: 1, lines: this._lines(), mode: this._mode() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* storage unavailable (private mode) – bag still works in memory */
      }
    });
  }

  add(
    item: Pick<JewelryItem, 'slug' | 'sku' | 'name' | 'cover_image_url' | 'base_price' | 'is_ring'>,
    options: { subtitle: string; ringSize?: number | null; engraving?: string; quantity?: number },
  ): void {
    const ringSize = item.is_ring ? (options.ringSize ?? null) : null;
    const engraving = (options.engraving ?? '').trim().slice(0, 40);
    const key = [item.slug, ringSize ?? '-', engraving].join('|');
    const quantity = options.quantity ?? 1;

    this._lines.update((lines) => {
      const existing = lines.find((l) => l.key === key);
      if (existing) {
        return lines.map((l) =>
          l.key === key ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + quantity) } : l,
        );
      }
      return [
        ...lines,
        {
          key,
          slug: item.slug,
          sku: item.sku,
          name: item.name,
          imageUrl: item.cover_image_url,
          subtitle: options.subtitle,
          unitPrice: toNumber(item.base_price),
          quantity,
          isRing: item.is_ring,
          ringSize,
          engraving,
        },
      ];
    });
    this.lastAddedAt.set(Date.now());
  }

  setQuantity(key: string, quantity: number): void {
    if (quantity < 1) {
      this.remove(key);
      return;
    }
    this._lines.update((lines) =>
      lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QUANTITY, quantity) } : l)),
    );
  }

  setRingSize(key: string, ringSize: number | null): void {
    this.updateLine(key, { ringSize });
  }

  setEngraving(key: string, engraving: string): void {
    this.updateLine(key, { engraving: engraving.slice(0, 40) });
  }

  remove(key: string): void {
    this._lines.update((lines) => lines.filter((l) => l.key !== key));
  }

  setMode(mode: FulfilmentMode): void {
    this._mode.set(mode);
  }

  clear(): void {
    this._lines.set([]);
  }

  private updateLine(key: string, patch: Partial<BagLine>): void {
    this._lines.update((lines) => {
      const updated = lines.map((l) => (l.key === key ? { ...l, ...patch } : l));
      // Re-key the edited line and merge with an identical configuration, if any.
      const merged = new Map<string, BagLine>();
      for (const line of updated) {
        const newKey = [line.slug, line.ringSize ?? '-', line.engraving.trim()].join('|');
        const prev = merged.get(newKey);
        merged.set(
          newKey,
          prev
            ? { ...prev, quantity: Math.min(MAX_QUANTITY, prev.quantity + line.quantity) }
            : { ...line, key: newKey },
        );
      }
      return [...merged.values()];
    });
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<PersistedBag>;
      if (parsed.version !== 1 || !Array.isArray(parsed.lines)) return;
      this._lines.set(parsed.lines.filter((l) => typeof l?.slug === 'string'));
      if (parsed.mode === 'courier' || parsed.mode === 'store') this._mode.set(parsed.mode);
    } catch {
      /* corrupted storage – start with an empty bag */
    }
  }

  /** Free insured shipping threshold from config (for messaging). */
  readonly freeShippingFrom = SITE_CONFIG.commerce.freeInsuredShippingFrom;
}
