/** API contracts mirroring the Django REST Framework serializers. */

export type MetalType = 'zlte_zlato' | 'biele_zlato' | 'ruzove_zlato' | 'platina' | 'striebro';
export type Gemstone =
  | 'diamant'
  | 'lab_diamant'
  | 'zafir'
  | 'smaragd'
  | 'rubin'
  | 'perla'
  | 'bez_kamena';
export type Availability = 'skladom' | 'na_objednavku' | 'vypredane';
export type Badge = 'bestseller' | 'novinka' | 'limitovana_edicia' | 'none';

export interface CategoryBrief {
  id: number;
  name: string;
  slug: string;
}

export interface Category extends CategoryBrief {
  description: string;
  cover_image_url: string;
  display_order: number;
  item_count: number;
}

export interface JewelryImage {
  id: number;
  image_url: string;
  caption: string;
  display_order: number;
}

export interface JewelryItem {
  id: number;
  slug: string;
  sku: string;
  name: string;
  collection_name: string;
  category: CategoryBrief;
  /** Decimal serialized as string, e.g. "2450.00". */
  base_price: string;
  metal_type: MetalType;
  metal_type_display: string;
  gold_purity: string;
  primary_gemstone: Gemstone;
  primary_gemstone_display: string;
  carat_weight: string | null;
  availability: Availability;
  availability_display: string;
  badge: Badge;
  badge_display: string;
  cover_image_url: string;
  is_featured: boolean;
  is_ring: boolean;
  created_at: string;
}

export interface JewelryItemDetail extends JewelryItem {
  diamond_grade: string | null;
  weight_grams: string;
  description: string;
  images: JewelryImage[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export interface Facets {
  categories: FacetOption[];
  metal_types: FacetOption[];
  gemstones: FacetOption[];
  availability: FacetOption[];
  price_range: { min: string | number; max: string | number };
}

export type CatalogOrdering = '-created_at' | 'base_price' | '-base_price';

export interface CatalogQuery {
  category?: string[];
  metal_type?: string[];
  primary_gemstone?: string[];
  availability?: string[];
  min_price?: number | null;
  max_price?: number | null;
  search?: string;
  featured?: boolean;
  ordering?: CatalogOrdering;
  page?: number;
  page_size?: number;
}

/* --- Submissions ---------------------------------------------------------- */

export type OrderType = 'eshop_objednavka' | 'rezervacia_predajna';

export interface OrderLinePayload {
  slug: string;
  quantity: number;
  ring_size: number | null;
  engraving: string;
}

export interface OrderPayload {
  order_type: OrderType;
  items: OrderLinePayload[];
  client_name: string;
  email: string;
  phone: string;
  delivery_address: string;
  note: string;
}

export interface OrderResponse extends Omit<OrderPayload, 'items'> {
  id: number;
  total_price: string;
  status: string;
  created_at: string;
}

export type BespokeJewelryType =
  | 'zasnubny_prsten'
  | 'svadobne_obrucky'
  | 'privesok_nausnice'
  | 'iny_sperk';

export interface BespokePayload {
  jewelry_type: BespokeJewelryType;
  preferred_metal: MetalType | '';
  gemstone_preference: Gemstone | '';
  ring_sizes: string;
  engraving_text: string;
  estimated_budget: string;
  description: string;
  client_name: string;
  phone: string;
  email: string;
}

export type ServiceType = 'vykup_zlata' | 'oprava_uprava' | 'cistenie_rhodiovanie';

export interface ServicePayload {
  service_type: ServiceType;
  estimated_weight_grams: number | null;
  note: string;
  client_name: string;
  phone: string;
  email: string;
}

export type ContactTopic = 'konzultacia' | 'otazka' | 'ine';

export interface ContactPayload {
  topic: ContactTopic;
  preferred_date: string | null;
  message: string;
  client_name: string;
  phone: string;
  email: string;
}

/** DRF validation error body: field -> messages (or nested). */
export type ApiValidationErrors = Record<string, unknown>;
