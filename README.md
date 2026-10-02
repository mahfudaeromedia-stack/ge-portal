# Ground Experience Portal R10.20 — Refactored Package

This repository preserves the existing Ground Experience Portal as a **static multi-page application**. The refactor is packaging/maintenance focused: page filenames, HTML structure, CSS, assets, data compatibility layer, Firebase integration, business logic, and Netlify Functions are intentionally preserved.

## Architecture

- **Frontend:** physical `.html` pages + existing JavaScript/CSS/assets.
- **Browser Firebase:** existing `assets/firebase-config.js` + `assets/firebase-client.js` integration.
- **Authentication:** Firebase Authentication remains the password authority for managed accounts.
- **Server-side account operations:** Netlify Functions under `netlify/functions/`, using `firebase-admin`.
- **Existing business-data compatibility:** `GE_V2_1_DATA`/existing modules remain in place. This package does **not** introduce an automatic migration of the business dataset to Firestore.
- **Deployment:** Netlify publishes the repository root and exposes `netlify/functions`.

## Requirements

- Node.js **20+** for local tooling and Netlify Functions.
- Internet access for Firebase, external browser libraries, and other existing cloud integrations.

The portal is not intended to operate fully offline; local preview is a validation environment.

## Local development

From the repository root:

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

The development server is dependency-free and serves the existing files directly. This avoids introducing a framework or bundler that could change page behavior.

## Production build / validation

```bash
npm run build
```

Because the frontend is a static multi-page application, there is no frontend compilation step. The build command performs package/configuration checks and the existing regression suite instead.

Expected final lines include:

```text
PACKAGE_VERIFY_PASS
REGRESSION_AUDIT_PASS
```

## Local production preview

```bash
npm run preview
```

Open `http://127.0.0.1:4173/`.

This serves the same repository files that Netlify publishes, so the local production-preview check does not depend on a different bundler output.

## Netlify deployment

Existing deployment model is retained:

- **Base directory:** repository root
- **Build command:** `npm run build`
- **Publish directory:** `.`
- **Functions directory:** `netlify/functions`
- **SPA catch-all:** not used; physical `.html` pages remain direct routes
- **API route:** `/api/*` is routed to `/.netlify/functions/:splat`

`netlify.toml` remains the deployment source of truth.

For a safe rollout, use a Netlify Deploy Preview first, test the important flows, then promote to production. Previous successful Netlify deploys remain the rollback point because this package does not run database migrations during deployment.

## Firebase / Firestore

Do not create a new Firebase project or rewrite existing collections as part of this refactor.

The existing browser integration is retained:

- `assets/firebase-config.js`
- `assets/firebase-client.js`
- `assets/auth.js`

The existing server-side account implementation is retained in `netlify/functions/`.

The existing Firestore schema is documented in `firebase-schema.md`. Existing collection names, document IDs, fields, and compatibility mappings must remain authoritative.

### Required Netlify environment variables

Configure secrets in **Netlify → Project configuration → Environment variables**, never in GitHub:

- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `FIREBASE_WEB_API_KEY`

Alternatively, the Functions adapter accepts:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Enable **Firebase Authentication → Email/Password** in the target Firebase project.

### Security notes

Never commit:

- Firebase Admin service-account private keys
- service-account JSON containing private keys
- external API secrets/tokens
- passwords
- private access tokens

The Firebase Web App configuration may contain public Web SDK identifiers; these are not a substitute for Firestore Security Rules or Authentication authorization.

## Validation checklist

Before production:

1. `npm install`
2. `npm run build`
3. `npm run dev` and compare the main pages with the existing site.
4. `npm run preview` and repeat the comparison against the production-style static server.
5. Test login/logout, refresh, direct URLs, and **Open link in new tab**.
6. Test role/menu access and station/lounges scope.
7. Test Firebase Authentication and profile loading with real deployment credentials.
8. Test Firestore-backed initiative/access flows without changing existing records.
9. Test Dashboard, Initiative, Calendar, Project Tracking, Gantt, OCR, forms, search/filter/sort, and responsive layouts where applicable.
10. Check browser console for production-only errors and missing assets.
11. Deploy a Netlify Preview and repeat the important flows.

## Dependency ownership

The repository root intentionally has **no npm runtime dependencies**. `firebase-admin` is used only by the Netlify Functions and remains declared in `netlify/functions/package.json`.

No `jwks-rsa` or `jose` dependency is used by the inspected source.

The Functions dependency installation is separate from the static frontend package. If npm cannot reach the registry, the Functions dependency tree cannot be installed locally; this does not change the source declaration or Netlify's dependency-installation requirement.

## Files and documentation

- `docs/REFACTOR_AUDIT.md` — findings, preservation decisions, and validation limits.
- `docs/REFACTOR_CHANGELOG.md` — file/dependency changes with reason, impact, and risk.
- `docs/DEPLOYMENT_AND_DATA_COMPATIBILITY.md` — existing deployment/data compatibility gate.
- `docs/FINAL_AUDIT_REPORT.md` — prior R10.20 authentication/security audit record.
- `firebase-schema.md` — existing Firebase target/schema notes.

## Important preservation rule

This package intentionally does **not** perform a framework migration, visual redesign, database migration, bulk data rewrite, or broad JavaScript rewrite. If a future change could alter UI, data shape, or behavior, treat it as a separate migration and regression-testing project.


## R10.20.2 — P22 / P23 / P24 checkpoint implementation

This package is based only on `Ground_Experience_Garuda_Indonesia_R10_20_DASHBOARD_CONSOLIDATED_P19_FINAL`. The approved Dashboard POVs and global shell visual system remain frozen except for the explicitly authorized navigation organization.

- **P22:** role-aware grouped navigation; major planning destinations are Overview, Workspace, and Documents.
- **P23:** `planning-workspace.html` consolidates Lounge / Tenant, Branch Office, and GASO presentation while retaining legacy routes and underlying data/CRUD.
- **P24:** planning pages use the approved portal shell and scoped consistency styles; no Lounge/GASO/BO-specific theme was introduced.
- **User Management security:** normal portal Create/Edit User cannot target Super Admin; server-side create/update validation protects the role, and Admin User Management access is permission-gated.

See `docs/P22_P23_P24_REPORT.md` for the detailed change, preservation, security, and validation report.

## R10.20.3 — P29 Lounge / Tenant Planning checkpoint

P29 is implemented from the frozen P22/P23/P24 package and does not reopen those approved changes.

- Lounge/Tenant service type now resolves from the audited Lounge Master mapping; `Tenant` is not hardcoded as `Lounge`.
- Service Type filter supports All / Lounge / Tenant while preserving existing supported Snack Box records under All.
- Add, Update, CSV Import and CSV Template use one logical Lounge/Tenant data contract.
- Optional `priceSchedules[]` supports multiple price-effective periods inside one Agreement while preserving legacy `pricePerPax` / `currency` fallback.
- CSV import uses Parse → Normalize → Validate → Preview → Confirm → CREATE-only Import and blocks invalid/duplicate rows before write.
- Invalid data is rendered/handled safely without automatic production-data repair.
- Lounge/Tenant cards use the approved portal language with a 3-column desktop target, 2-column narrow layout, and 1-column mobile layout.
- Asset audit found reusable Service Location and Branch Office Space capability but no suitable physical Asset Registry; no new production Asset schema was created in P29.

See `docs/P29_REPORT.md` for the detailed audit, contract, multi-price model, asset/facility assessment, preservation and validation report.

## P26 + P28 + P30 checkpoint

The latest controlled phase extends the approved P29 package with:

- **P26** — Account & Access Management workspace, guided Role / Access Level / Scope / Permissions model, secure Add/Edit/Reset flows, and CREATE-only CSV account import.
- **P28** — stable page identity isolation for independently editable page content, with legacy route-keyed configuration compatibility.
- **P30** — reusable portal-wide modal/overlay layer integrity, including body-level overlay roots, internal scrolling, background scroll control, and focus handling.

P22, P23, P24 and P29 business/data logic remain preserved. No destructive Firestore migration is performed.

## P31 Authentication Correction

P31 is an emergency authentication compatibility correction based on the latest P26 + P28 + P30 package. Firebase Email/Password Authentication remains the credential authority. The browser no longer reads `users/{uid}` directly for post-authentication profile/session construction; it uses the existing authenticated Netlify `auth-session` endpoint, matching the server-only Firestore user-profile rule. Legacy fields are normalized in memory with fail-closed defaults. Legacy `Admin` remains distinct from `Super Admin` and resolves to an unresolved/limited Dashboard POV when its organizational role cannot be safely mapped. No production Firestore data is migrated or modified. Browser authentication PASS is not claimed until the user's real browser test succeeds.
