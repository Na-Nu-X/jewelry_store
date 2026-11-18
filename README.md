# Aurelia – Jewelry Store & Goldsmith Atelier

A full-stack, white-label web application for a fine jewelry boutique and goldsmith atelier
(*Zlatníctvo a šperkárstvo*). The codebase is in English. All customer-facing copy, validation
messages and seeded data are in Slovak.

| Layer    | Stack |
|----------|-------|
| Backend  | Python 3, Django, Django REST Framework, django-filter, django-cors-headers, Pillow |
| Frontend | Angular (standalone components, Signals, zoneless, strict TypeScript), pure SCSS |
| Database | SQLite for local development, PostgreSQL via `DATABASE_URL` in production |

```
.
├── backend/                 Django project (config/) + `jewelry` app
│   ├── jewelry/models.py    Catalog, orders/reservations, bespoke, service, contact
│   ├── jewelry/views.py     DRF viewsets (catalog read-only, submissions write-only)
│   ├── jewelry/admin.py     Slovak admin with gallery inline & bulk actions
│   └── jewelry/management/commands/seed_data.py
└── frontend/                Angular application
    └── src/
        ├── styles/          _variables, _mixins, _typography, _theme (CSS custom properties) …
        └── app/
            ├── core/config/site.config.ts   ← white-label brand & business data
            ├── core/services/               API, BagService (Signals + localStorage), UI state
            ├── shared/components/           Navbar, Footer, JewelryCard, RingSizeGuide, BagDrawer …
            └── pages/                       home, collection, jewelry-detail, bespoke,
                                             buyback-service, atelier, not-found
```

---

## Running locally

### Prerequisites
- Python 3.11+
- Node.js 20+ and npm (the Angular CLI is installed locally with the project)

### 1. Backend (http://localhost:8000)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # optional – sensible defaults are built in
python manage.py migrate
python manage.py seed_data         # 6 categories, 21 jewelry pieces (safe to re-run)
python manage.py createsuperuser   # account for the admin panel
python manage.py runserver 8000
```

### 2. Frontend (http://localhost:4200)

```bash
cd frontend
npm install
npm start                          # = ng serve
```

The frontend calls the API at `http://localhost:8000/api`
(`frontend/src/environments/environment.ts`). If port 8000 is already taken on your machine,
start Django on another port (`runserver 8001`) and update `apiUrl` in that file.

> `frontend/.npmrc` sets `legacy-peer-deps=true`, which works around an npm peer-resolution
> error with the current Angular/Vitest dev dependencies.

### 3. Admin panel – http://localhost:8000/admin

Log in with the superuser account. Jewelers can manage:

- **Kategórie** and **Šperky**: prices, availability (*Skladom v predajni*, *Výroba na mieru 2–3 týždne*,
  *Vypredané*), badges and featured pieces (editable directly in the list), metal and stone details,
  and a photo gallery inline. Bulk actions mark pieces as in stock, sold out or featured.
- **Objednávky a rezervácie**: online orders and in-store reservations, with a readable table of
  items (ring size, engraving, line totals) and an editable status.
- **Šperky na mieru – dopyty**, **Výkup zlata a servis – dopyty** and **Kontaktné správy**, each with
  a reviewed/resolved flag.

---

## REST API (`/api/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/jewelry/` | Paginated catalog. Filters: `category`, `metal_type`, `primary_gemstone`, `availability`, `badge` (each accepts comma-separated values), `min_price`, `max_price`, `featured`, `search` (name, SKU, collection, description), `ordering` (`-created_at`, `base_price`, `-base_price`, …), `page`, `page_size` (≤ 60) |
| GET  | `/api/jewelry/<slug>/` | Full item dossier with gallery images and category |
| GET  | `/api/jewelry/facets/` | Filter options with counts and the price range for the catalog sidebar |
| GET  | `/api/categories/` | Categories with item counts |
| POST | `/api/orders/` | Online order (`eshop_objednavka`) or in-store reservation (`rezervacia_predajna`) |
| POST | `/api/bespoke/` | Custom jewelry / wedding bands inquiry |
| POST | `/api/services/` | Gold buyback or goldsmith service inquiry |
| POST | `/api/contact/` | Atelier consultation / contact message |

Order validation happens on the server. The backend looks up each item by slug, rejects sold-out
pieces, requires a ring size (44–70) for rings and a full address for courier delivery, and
**recalculates the total from database prices**, ignoring any price the client sends. Submission
endpoints are write-only and rate-limited (`API_SUBMISSION_THROTTLE`, default `20/hour`).

Example:

```bash
curl "http://localhost:8000/api/jewelry/?category=zasnubne-prstene&metal_type=biele_zlato,platina&ordering=base_price"
```

---

## White-label rebranding

1. **Business data**: edit `frontend/src/app/core/config/site.config.ts`. It holds the brand name,
   wordmark, tagline, phone numbers, e-mail, address, IČO / DIČ / IČ DPH, the Puncový úrad SR hallmark
   note, certification text, GDPR text, opening hours, social links, trust metrics, testimonials,
   atelier story, buyback rates and editorial images. No component contains hard-coded business data.
2. **Colors & fonts**: edit the `$palette` map in `frontend/src/styles/_variables.scss`. It compiles
   into CSS custom properties on `:root` (`_theme.scss`), so you can also override them at runtime.
   Fonts are set in `_theme.scss` (`--font-serif`, `--font-sans`) and loaded in `src/index.html`.
3. **Catalog**: manage products in the Django admin, or adapt `seed_data.py` for the client's demo.

All demo business details (company name, IČO, address, hallmark registration number, prices) are
**fictional placeholders**. Replace them before going live.

---

## Production notes

- Backend environment variables (see `backend/.env.example`): `DJANGO_SECRET_KEY`,
  `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS`, `DATABASE_URL=postgres://…` (install `psycopg[binary]`),
  `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`. Run `python manage.py collectstatic` for the admin assets.
- With `DEBUG=False`, the browsable API is disabled and secure cookie and proxy SSL settings turn on.
- `ng build` writes to `frontend/dist/frontend/browser`. The production environment expects the API
  on the same origin at `/api` (`environment.prod.ts`); change it if the API is hosted elsewhere.
  Configure the web server to fall back to `index.html` so deep links such as `/kolekcia/<slug>` work.

## Verification

```bash
cd backend  && python manage.py check && python manage.py test jewelry
cd frontend && npx ng build
```
