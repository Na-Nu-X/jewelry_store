import { SITE_CONFIG } from '../config/site.config';

const eurWhole = new Intl.NumberFormat(SITE_CONFIG.commerce.locale, {
  style: 'currency',
  currency: SITE_CONFIG.commerce.currency,
  maximumFractionDigits: 0,
});

const eurCents = new Intl.NumberFormat(SITE_CONFIG.commerce.locale, {
  style: 'currency',
  currency: SITE_CONFIG.commerce.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const decimalFormatter = new Intl.NumberFormat(SITE_CONFIG.commerce.locale, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** "2450.00" -> "2 450 €"; "75.6" -> "75,60 €" (cents shown only when present). */
export function formatEur(value: string | number | null | undefined): string {
  const n = toNumber(value);
  return Number.isInteger(n) ? eurWhole.format(n) : eurCents.format(n);
}

/** "0.50" -> "0,50" */
export function formatDecimal(value: string | number | null | undefined): string {
  return decimalFormatter.format(toNumber(value));
}

/** Subtitle like "14k Biele zlato • Diamant 0,50 ct". */
export function metalSubtitle(item: {
  gold_purity: string;
  metal_type_display: string;
  primary_gemstone: string;
  primary_gemstone_display: string;
  carat_weight: string | null;
}): string {
  const karat = item.gold_purity.match(/^(\d+k)/i)?.[1];
  const metal = karat ? `${karat} ${item.metal_type_display}` : item.metal_type_display;
  if (item.primary_gemstone === 'bez_kamena') return metal;
  const stone = item.primary_gemstone_display.replace('Prírodný d', 'D').replace('Sladkovodná p', 'P');
  const carat = item.carat_weight ? ` ${formatDecimal(item.carat_weight)} ct` : '';
  return `${metal} • ${stone}${carat}`;
}

export function badgeClass(badge: string): string {
  switch (badge) {
    case 'bestseller':
      return 'badge--dark';
    case 'novinka':
      return 'badge--gold';
    case 'limitovana_edicia':
      return 'badge--emerald';
    default:
      return '';
  }
}

/**
 * Requests a smaller rendition from image CDNs that support it (Unsplash/imgix `w=`).
 * Other URLs are returned unchanged.
 */
export function sizedImage(url: string | null | undefined, width: number): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith('unsplash.com')) {
      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('auto', 'format');
      if (!parsed.searchParams.has('fit')) parsed.searchParams.set('fit', 'crop');
      return parsed.toString();
    }
  } catch {
    /* relative or invalid URL – leave untouched */
  }
  return url;
}

export function sizedSrcset(url: string | null | undefined, widths: number[]): string {
  if (!url) return '';
  return widths.map((w) => `${sizedImage(url, w)} ${w}w`).join(', ');
}
