# LaU — Multi-Module Social App

A Salvadoran university student social platform with a Vue 3/Ionic frontend and Laravel API backend.

## Repository Structure

This workspace contains **two independent modules**:

| Module | Path | Framework | Purpose |
|--------|------|-----------|---------|
| **Frontend** | `./` (this directory) | Vue 3 + Ionic 8 + Vite | Mobile (Android/iOS via Capacitor) + web (Firebase Hosting) |
| **Backend** | `../LaUapi/` (XAMPP htdocs) | Laravel 12 + Sanctum | REST API at `https://api.lauapp.es` |

Both are git repos with separate histories and deployment pipelines.

## Frontend Setup

- **Entry**: `src/main.js` → `index.html`
- **Router**: `src/router/index.js` (auth guards: `requiresAuth`, `requiresGuest`)
- **Services**: `src/services/` (one module per API domain; `api.js` owns the axios instance & token interceptor)
- **Styles**: Tailwind CSS + Ionic tokens
- **Build**: `npm run build` → `dist/` (Firebase Hosting rewrite to `/index.html`)
- **Dev**: `npm run dev` (Vite on `:5173`, proxies `/uploads` → backend)
- **Mobile**: `npm run android` (Ionic + Capacitor)
- **Tests**: `vitest` (unit) + `cypress` (E2E)

### Commands

```bash
npm run dev              # vite dev server, :5173
npm run build            # → dist/
npm run test:unit        # vitest watch mode
npx vitest run           # unit tests (single run)
npm run test:e2e         # cypress; needs `npm run dev` running first
npm run android          # ionic build && cap sync && cap open android
npx vue-tsc --noEmit     # closest thing to a type check
```

### Layout

| Path | Purpose |
|---|---|
| `src/main.js` | bootstrap + Pusher/Laravel Echo setup |
| `src/router/index.js` | all routes + auth guard (`meta.requiresAuth` / `requiresGuest`) |
| `src/services/` | one module per API domain; `api.js` owns the axios instance and the bearer-token interceptor |
| `src/views/` | route components |
| `src/components/` | shared UI |
| `src/utils/` | composables (`useDarkMode`, `useGlassMode`, `useSyncQueue`, …) |

`@` aliases to `./src`.

### Environment

- **Dev** (`.env.development`): API at `http://localhost:8000` (for local testing)
- **Prod** (`.env.production`): API at `https://api.lauapp.es` (inlined into bundle)

### Auth Flow

1. User logs in → POST `/auth/login` → Sanctum token
2. Token stored: `localStorage` (30d `rememberMe`) or `sessionStorage` (24h)
3. All requests: Bearer header via axios interceptor
4. Real-time: Laravel Echo + Pusher (`dbc4b830fe504dac7663` hardcoded in `src/main.js`)

## Frontend Conventions

- Options API and Composition API both appear; match the file you're editing.
- Comments and user-facing strings are in Spanish. Keep them Spanish.
- Much debug logging is commented out rather than deleted — leave it alone.
- API responses are unwrapped as `res.data?.data || res.data`.
- File uploads use POST + FormData with `_method: PUT` (Laravel spoofing), never a real PUT.
- Tokens live in localStorage (rememberMe, 30d) or sessionStorage (24h); always read via `AuthService`, never touch storage keys directly.
- No linter is configured. Don't add one, or reformat files wholesale, without asking.

## Backend Setup

- **Framework**: Laravel 12 (Sanctum tokens, Eloquent, database sessions)
- **Database**: MySQL (19 models covering users, posts, comments, followers, notifications, tasks, etc.)
- **Entry**: `routes/api.php` (public routes + `auth:sanctum` protected group)
- **Auth**: Sanctum tokens (not cookies) + OAuth2 support (Google, Microsoft)
- **Real-time**: Pusher broadcaster for chat & notifications
- **Uploads**: `/storage/app/public` (symlinked to `/public/uploads`)
- **Mail**: Gmail (configured for transactional emails)

### Environment

- `.env.example` contains **exposed secrets** (Pusher, Firebase, Make.com webhook)
- Regenerate before deploying: API key, JWT secret, OAuth credentials
- **CORS**: currently set to `*` in development; lock down origins in production

## API Communication

**Base URL**: `https://api.lauapp.es/api`

**Public Routes**:
- `POST /auth/login`, `POST /auth/register`, `POST /auth/social-login`
- `GET /posts`, `GET /universidades`, `GET /music/search`

**Protected Routes** (Bearer token required):
- `POST /posts`, `DELETE /posts/{id}`
- `GET /users`, `POST /users/{id}/follow`
- `POST /posts/{id}/comments`, `POST /posts/{id}/like`

**Response Format**:
```json
{ "success": true, "data": {...}, "message": "..." }
```

## ⚠️ Security

Everything in frontend `src/`, `public/`, `index.html` and `.env.*` ships to the browser.
Never put a secret there — `VITE_*` vars are inlined into the bundle.

### Exposed Secrets (Action Required)

1. **Pusher key** (`src/main.js:37`): hardcoded, but only publishable-key (safe)
2. **Google OAuth secret** (`src/services/oauthServices.js`): migrate to PKCE, remove hardcoded secret
3. **Backend `.env` example**: contains Mail password, Make.com webhook, Firebase project ID—never commit real `.env`
4. **Frontend `.env.production`**: API URL is public (intentional; it's a public endpoint)

### Safe Practices

- **Never** put secrets in `VITE_*` env vars (inlined into bundle)
- **Never** commit `.env` files (only `.env.example`)
- **Always** validate at system boundaries (user input, external APIs)
- **Do** use Sanctum tokens; do not store them directly in localStorage without HTTPOnly consideration
- **Do** regenerate all secrets on deploy to production
- CI credentials belong in GitHub Secrets.

## Deployment

### Frontend

- Merge to `master` → GitHub Actions → Firebase Hosting (`lauapp-81f4d`)
- Build output: `dist/` (SPA, all routes rewritten to `index.html`)

### Backend

- Self-hosted at `https://api.lauapp.es`
- Manual deploy or CI/CD (not configured in this snapshot)
- Database migrations: run via Artisan before each release

## Running Locally

**Frontend**:
```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # dist/
npm run test:unit      # vitest watch
npm run test:e2e       # cypress (requires dev server)
```

**Backend**:
```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve     # http://localhost:8000/api
```

Or use the npm dev script in the backend to run both simultaneously.

## Known Issues & Gotchas

- Pusher key should be rotatable (consider environment-based config)
- Google OAuth secret hardcoded; migrate to PKCE
- The 401 response interceptor in `src/services/api.js` is an empty stub.
- Tests are unmodified scaffolding; CI runs the build only, never tests.
- `AuthService.getUserPosts` is defined twice in `auth.js`; the second (`/users/{id}/posts`) wins.
