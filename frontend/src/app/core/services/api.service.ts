import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  BespokePayload,
  CatalogQuery,
  Category,
  ContactPayload,
  Facets,
  JewelryItem,
  JewelryItemDetail,
  OrderPayload,
  OrderResponse,
  Paginated,
  ServicePayload,
} from '../models/jewelry.models';

/** Thin typed wrapper around the Django REST API. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

  private categories$?: Observable<Category[]>;
  private facets$?: Observable<Facets>;

  getCategories(): Observable<Category[]> {
    this.categories$ ??= this.http
      .get<Category[]>(`${this.baseUrl}/categories/`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.categories$;
  }

  getFacets(): Observable<Facets> {
    this.facets$ ??= this.http
      .get<Facets>(`${this.baseUrl}/jewelry/facets/`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.facets$;
  }

  getJewelry(query: CatalogQuery = {}): Observable<Paginated<JewelryItem>> {
    return this.http.get<Paginated<JewelryItem>>(`${this.baseUrl}/jewelry/`, {
      params: this.toParams(query),
    });
  }

  getJewelryItem(slug: string): Observable<JewelryItemDetail> {
    return this.http.get<JewelryItemDetail>(
      `${this.baseUrl}/jewelry/${encodeURIComponent(slug)}/`,
    );
  }

  createOrder(payload: OrderPayload): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.baseUrl}/orders/`, payload);
  }

  createBespokeRequest(payload: BespokePayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/bespoke/`, payload);
  }

  createServiceInquiry(payload: ServicePayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/services/`, payload);
  }

  createContactMessage(payload: ContactPayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/contact/`, payload);
  }

  private toParams(query: CatalogQuery): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        if (value.length) params = params.set(key, value.join(','));
      } else {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}

/**
 * Turns an HTTP error into a short Slovak message for the UI.
 * Field-level DRF errors are flattened into a single readable sentence.
 */
export function describeApiError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Nastala neočakávaná chyba. Skúste to, prosím, znova.';
  }
  if (error.status === 0) {
    return 'Nepodarilo sa spojiť so serverom. Skontrolujte pripojenie a skúste to znova.';
  }
  if (error.status === 429) {
    return 'Odoslali ste príliš veľa požiadaviek. Skúste to, prosím, o chvíľu.';
  }
  if (error.status === 400 && error.error && typeof error.error === 'object') {
    const messages = flattenMessages(error.error);
    if (messages.length) return messages.join(' ');
  }
  if (error.status === 404) {
    return 'Hľadaná položka neexistuje.';
  }
  return 'Na serveri nastala chyba. Ospravedlňujeme sa – skúste to neskôr alebo nám zavolajte.';
}

function flattenMessages(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(flattenMessages);
  if (value && typeof value === 'object') return Object.values(value).flatMap(flattenMessages);
  return [];
}
