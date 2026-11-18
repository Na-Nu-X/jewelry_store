/**
 * White-label configuration
 * ---------------------------------------------------------------------------
 * Every brand- and business-specific detail of the storefront lives here.
 * To rebrand the site for a new client, edit this file (and optionally the
 * colour tokens in `src/styles/_variables.scss`). No component contains
 * hard-coded business data.
 *
 * NOTE: All values below are fictional placeholders for the demo brand.
 */

export interface OpeningHours {
  readonly days: string;
  readonly hours: string;
}

export interface SocialLink {
  readonly label: string;
  readonly url: string;
  readonly icon: 'instagram' | 'facebook' | 'pinterest';
}

export interface TrustMetric {
  readonly value: string;
  readonly label: string;
}

export interface Testimonial {
  readonly quote: string;
  readonly author: string;
  readonly context: string;
}

/** Indicative buyback rate in EUR per gram for a given gold purity. */
export interface BuybackRate {
  readonly id: '14k' | '18k' | '24k';
  readonly label: string;
  readonly fineness: string;
  readonly pricePerGram: number;
}

export const SITE_CONFIG = {
  brand: {
    name: 'Aurelia',
    /** Wordmark shown in the header; `accent` renders as a smaller line below. */
    wordmark: 'AURELIA',
    wordmarkAccent: 'Zlatníctvo & šperkárstvo',
    legalName: 'Aurelia Atelier s. r. o.',
    tagline: 'Šperky, ktoré pretrvajú generácie',
    description:
      'Rodinný zlatnícky ateliér v srdci Bratislavy. Ručne vyrábame zásnubné prstene, svadobné obrúčky a šperky s certifikovanými drahokamami – od prvej skice až po puncovanie.',
    foundedYear: 1998,
  },

  contact: {
    phone: '+421 2 5443 1200',
    phoneHref: 'tel:+421254431200',
    mobile: '+421 905 123 456',
    mobileHref: 'tel:+421905123456',
    email: 'atelier@aurelia-demo.sk',
    address: {
      street: 'Panská 14',
      zip: '811 01',
      city: 'Bratislava – Staré Mesto',
      country: 'Slovensko',
    },
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Pansk%C3%A1+14+Bratislava',
    parkingNote: 'Parkovanie v garáži Kapitulská, 3 minúty chôdze.',
  },

  openingHours: [
    { days: 'Pondelok – Piatok', hours: '10:00 – 18:30' },
    { days: 'Sobota', hours: '10:00 – 14:00' },
    { days: 'Nedeľa', hours: 'Zatvorené' },
  ] satisfies readonly OpeningHours[],
  openingHoursNote: 'Konzultácie mimo otváracích hodín po dohode.',

  legal: {
    ico: '51 234 567',
    dic: '2120 123 456',
    icDph: 'SK2120123456',
    registry: 'Zapísaná v OR Mestského súdu Bratislava III, oddiel Sro, vložka č. 123456/B',
    hallmark:
      'Všetky šperky z drahých kovov sú overené a označené puncovou značkou Puncového úradu SR. Naša registrovaná značka zodpovednosti: „AU“ (reg. č. 2468).',
    certification:
      'Diamanty nad 0,30 ct dodávame s nezávislým certifikátom GIA, IGI alebo HRD.',
    gdpr:
      'Osobné údaje spracúvame výhradne na vybavenie vašej objednávky alebo dopytu v súlade s nariadením GDPR a zákonom č. 18/2018 Z. z.',
  },

  social: [
    { label: 'Instagram', url: 'https://www.instagram.com/', icon: 'instagram' },
    { label: 'Facebook', url: 'https://www.facebook.com/', icon: 'facebook' },
    { label: 'Pinterest', url: 'https://www.pinterest.com/', icon: 'pinterest' },
  ] satisfies readonly SocialLink[],

  trustMetrics: [
    { value: '27', label: 'rokov zlatníckej tradície' },
    { value: '4 800+', label: 'ručne vyrobených obrúčok' },
    { value: '4,9 / 5', label: 'hodnotenie od 620 klientov' },
    { value: '100 %', label: 'šperkov overených Puncovým úradom SR' },
  ] satisfies readonly TrustMetric[],

  testimonials: [
    {
      quote:
        'Zásnubný prsteň vznikol presne podľa mojej skice. Pán zlatník mi ukázal 3D návrh, vybrali sme spolu diamant a za tri týždne bol hotový. Odpoveď bola samozrejme áno.',
      author: 'Martin K.',
      context: 'Zásnubný prsteň na mieru, Bratislava',
    },
    {
      quote:
        'Obrúčky nám ušili doslova na mieru – manželove prsty sú širšie, tak navrhli komfortný profil. Gravírovanie s dátumom svadby je nádherne jemné.',
      author: 'Zuzana a Tomáš',
      context: 'Svadobné obrúčky, 14k biele zlato',
    },
    {
      quote:
        'Starú babkinu retiazku sme dali prerobiť na prívesok pre dcéru. Ateliér pracoval s úctou k pôvodnému šperku a výsledok nás dojal.',
      author: 'Ing. Helena S.',
      context: 'Prerobenie rodinného šperku',
    },
  ] satisfies readonly Testimonial[],

  /** Indicative buyback prices shown in the gold calculator (EUR / g). */
  buyback: {
    updatedAt: '18. 11. 2026',
    rates: [
      { id: '14k', label: '14 karátov', fineness: '585/1000', pricePerGram: 58.4 },
      { id: '18k', label: '18 karátov', fineness: '750/1000', pricePerGram: 75.6 },
      { id: '24k', label: '24 karátov', fineness: '999/1000', pricePerGram: 101.2 },
    ] satisfies readonly BuybackRate[],
    note:
      'Ceny sú orientačné a menia sa podľa aktuálneho kurzu zlata na burze. Konečnú sumu určíme po odbornom overení rýdzosti v ateliéri – bezplatne a na počkanie.',
  },

  commerce: {
    currency: 'EUR',
    locale: 'sk-SK',
    freeInsuredShippingFrom: 300,
    shippingNote: 'Poistené doručenie kuriérom zadarmo, do 2–3 pracovných dní.',
    returnsNote: '30 dní na vrátenie tovaru skladom (okrem šperkov na mieru a s gravírovaním).',
    reservationHoldDays: 3,
  },

  /** Hero and editorial imagery – replace with the client's own photography. */
  images: {
    hero: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=2000&q=80',
    heroSecondary:
      'https://images.unsplash.com/photo-1598560917807-1bae44bd2be8?auto=format&fit=crop&w=1200&q=80',
    bespoke:
      'https://images.unsplash.com/photo-1631982690223-8aa4be0a2497?auto=format&fit=crop&w=1800&q=80',
    weddingBands:
      'https://images.unsplash.com/photo-1622398925373-3f91b1e275f5?auto=format&fit=crop&w=1400&q=80',
    atelier:
      'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?auto=format&fit=crop&w=1800&q=80',
    atelierDetail:
      'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?auto=format&fit=crop&w=1200&q=80',
    showroom:
      'https://images.unsplash.com/photo-1633934542430-0905ccb5f050?auto=format&fit=crop&w=1400&q=80',
    buyback:
      'https://images.unsplash.com/photo-1624365169364-0640dd10e180?auto=format&fit=crop&w=1800&q=80',
    service:
      'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1200&q=80',
  },

  navigation: [
    { label: 'Kolekcia', path: '/kolekcia' },
    { label: 'Šperky na mieru', path: '/na-mieru' },
    { label: 'Výkup & Servis', path: '/vykup-a-servis' },
    { label: 'Ateliér', path: '/atelier' },
  ],
} as const;

export type SiteConfig = typeof SITE_CONFIG;
