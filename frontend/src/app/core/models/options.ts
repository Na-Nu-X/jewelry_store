import { BespokeJewelryType, Gemstone, MetalType, ServiceType } from './jewelry.models';

/** Slovak labels for enums used in forms (mirror Django `TextChoices`). */
export const METAL_OPTIONS: readonly { value: MetalType; label: string }[] = [
  { value: 'zlte_zlato', label: 'Žlté zlato' },
  { value: 'biele_zlato', label: 'Biele zlato' },
  { value: 'ruzove_zlato', label: 'Ružové zlato' },
  { value: 'platina', label: 'Platina 950' },
  { value: 'striebro', label: 'Striebro 925' },
];

export const GEMSTONE_OPTIONS: readonly { value: Gemstone; label: string }[] = [
  { value: 'diamant', label: 'Prírodný diamant' },
  { value: 'lab_diamant', label: 'Lab-grown diamant' },
  { value: 'zafir', label: 'Zafír' },
  { value: 'smaragd', label: 'Smaragd' },
  { value: 'rubin', label: 'Rubín' },
  { value: 'perla', label: 'Sladkovodná perla' },
  { value: 'bez_kamena', label: 'Bez kameňa' },
];

export const BESPOKE_TYPE_OPTIONS: readonly {
  value: BespokeJewelryType;
  label: string;
  description: string;
}[] = [
  { value: 'zasnubny_prsten', label: 'Zásnubný prsteň', description: 'Solitér, halo či vintage – s kameňom podľa vás' },
  { value: 'svadobne_obrucky', label: 'Svadobné obrúčky', description: 'Pár obrúčok s gravírovaním a komfortným profilom' },
  { value: 'privesok_nausnice', label: 'Prívesok / Náušnice', description: 'Osobný symbol, iniciály či rodinný kameň' },
  { value: 'iny_sperk', label: 'Iný šperk', description: 'Prerobenie dedičstva, pánsky prsteň, brošňa…' },
];

export const SERVICE_OPTIONS: readonly { value: ServiceType; label: string; description: string }[] = [
  { value: 'vykup_zlata', label: 'Výkup zlomkového zlata', description: 'Bezplatné overenie rýdzosti a výplata na počkanie' },
  { value: 'oprava_uprava', label: 'Oprava alebo úprava veľkosti', description: 'Zväčšenie, zmenšenie, spájkovanie, výmena kameňa' },
  { value: 'cistenie_rhodiovanie', label: 'Čistenie a rhodiovanie', description: 'Ultrazvukové čistenie, leštenie a nové rhodium' },
];

export const BUDGET_OPTIONS: readonly string[] = [
  'do 1 000 €',
  '1 000 – 2 500 €',
  '2 500 – 5 000 €',
  '5 000 – 10 000 €',
  'nad 10 000 €',
  'Zatiaľ neviem',
];

/** EU/SK ring sizes offered in the product configurator. */
export const RING_SIZES: readonly number[] = Array.from({ length: 17 }, (_, i) => 48 + i); // 48–64
