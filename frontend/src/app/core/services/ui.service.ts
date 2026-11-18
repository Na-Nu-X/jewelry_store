import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { JewelryItem } from '../models/jewelry.models';

export type BagStep = 'bag' | 'checkout' | 'success';

export interface Toast {
  id: number;
  message: string;
}

/** Global UI overlays: bag drawer, ring-size guide, quick view, toasts. */
@Injectable({ providedIn: 'root' })
export class UiService {
  private readonly document = inject(DOCUMENT);

  readonly bagOpen = signal(false);
  readonly bagStep = signal<BagStep>('bag');
  readonly sizeGuideOpen = signal(false);
  readonly quickViewItem = signal<JewelryItem | null>(null);
  readonly mobileNavOpen = signal(false);
  readonly toasts = signal<Toast[]>([]);

  /** Size picked inside the guide – consumed by the product configurator. */
  readonly suggestedRingSize = signal<number | null>(null);

  private readonly anyOverlayOpen = computed(
    () =>
      this.bagOpen() || this.sizeGuideOpen() || !!this.quickViewItem() || this.mobileNavOpen(),
  );

  constructor() {
    effect(() => {
      this.document.body.classList.toggle('no-scroll', this.anyOverlayOpen());
    });
  }

  openBag(step: BagStep = 'bag'): void {
    this.mobileNavOpen.set(false);
    this.quickViewItem.set(null);
    this.bagStep.set(step);
    this.bagOpen.set(true);
  }

  closeBag(): void {
    this.bagOpen.set(false);
    if (this.bagStep() === 'success') this.bagStep.set('bag');
  }

  openSizeGuide(): void {
    this.sizeGuideOpen.set(true);
  }

  closeSizeGuide(): void {
    this.sizeGuideOpen.set(false);
  }

  openQuickView(item: JewelryItem): void {
    this.quickViewItem.set(item);
  }

  closeQuickView(): void {
    this.quickViewItem.set(null);
  }

  toast(message: string): void {
    const id = Date.now() + Math.random();
    this.toasts.update((list) => [...list, { id, message }]);
    setTimeout(() => this.toasts.update((list) => list.filter((t) => t.id !== id)), 3800);
  }
}
