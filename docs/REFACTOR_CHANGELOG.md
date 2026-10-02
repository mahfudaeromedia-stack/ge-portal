# Refactor & Packaging Changelog

## Scope

This pass is intentionally conservative. The existing multi-page HTML/JavaScript application remains the source of truth. No page was migrated to a framework, no Firestore schema was rewritten, and no business-data migration was introduced.

## Changes

| Source | Destination | Change | Reason | Impact | Risk |
|---|---|---|---|---|---|
| `package.json` | same | Removed the root `firebase-admin` runtime dependency; added `dev`, `preview`, and `build` scripts and Node >=20 engine metadata. | `firebase-admin` is only imported by Netlify Functions, so keeping it at the static-site root duplicated dependency ownership. | Root install is lighter; function dependency remains isolated in `netlify/functions/package.json`. | Low |
| N/A | `package-lock.json` | Added npm lockfile v3 for the dependency-free root package. | Makes root package state reproducible and explicitly consistent with `package.json`. | `npm install` at repository root has a deterministic zero-dependency tree. | Low |
| N/A | `tools/serve.mjs` | Added a dependency-free local static server for development and production preview. | Provides the requested localhost validation path without introducing a web-server package. | `npm run dev` serves port 5173; `npm run preview` serves port 4173. | Low |
| N/A | `tools/verify-package.mjs` | Added package/asset/configuration verification. | Detects broken local HTML references and packaging drift before deployment. | Used by `npm run build`. | Low |
| `README.md` | same | Updated local development, production preview, packaging, Firebase, and Netlify guidance to match the actual ZIP. | Existing README contained statements that no Firebase integration was present, while the package does contain Firebase client/auth integration. | Documentation now matches the inspected source. | Low |
| N/A | `docs/REFACTOR_CHANGELOG.md` | Added this change log. | Records changes, reasons, impacts, and risk. | Documentation only. | None |

## Deliberately not changed

- HTML page locations and filenames.
- Existing CSS/layout and visual assets.
- Existing JavaScript modules and their load order.
- `assets/data.js` and its existing local compatibility store.
- Firebase Web configuration/client adapter and existing Authentication/Firestore calls.
- Firestore collection/document/field names described by the existing schema.
- Netlify Functions source and their `firebase-admin` dependency declaration.
- Existing `netlify.toml`, `_headers`, `firestore.rules`, and `firebase.json` behavior.
- OCR assets and third-party browser libraries.
- Historical compatibility scripts `v2544-modal-fix.js` and `v2554-stability.js` were later absorbed into the canonical business runtime during the P40 clean refactor; the old standalone files are no longer part of the runtime package.

## Deletions

No application source, page, asset, Firebase collection, or Netlify Function was deleted in this pass.

The only dependency ownership change is removal of the root `firebase-admin` declaration. It remains declared where it is actually imported: `netlify/functions/package.json`.

## Dependency notes

- Root package: intentionally zero runtime/npm dependencies.
- Netlify Functions: `firebase-admin@^13.5.0` remains isolated in `netlify/functions/package.json`.
- `jwks-rsa`: not referenced by the inspected source.
- `jose`: not referenced by the inspected source.
- Node: `>=20` is retained for the Functions runtime and local tooling.

A live dependency installation of the Functions package could not be completed in this audit environment because access to `registry.npmjs.org` failed with `EAI_AGAIN`. Therefore no claim is made that the transitive `firebase-admin` tree was installed locally during this pass.

## Visual regression repair — 2026-09-18

### Root cause

The reported `Bad - Bug Tampilan` screenshots are consistent with a **missing/incomplete global visual stylesheet**, not with a broken page/component implementation:

- `assets/portal.css` contained only the generic/base rules (~3.5 KB).
- The existing HTML and `assets/portal-shell.js` still emitted the established `final-v257`, `ge-*`, `r8-*`, `r9-*`, modal, calendar, map, initiative, and form classes.
- Because those classes had no corresponding global rules, the browser fell back to native HTML rendering: oversized logos, unstyled navigation, native inputs/buttons, misplaced modal fields, and collapsed dashboard layout.
- The application source itself was therefore not recreated or rewritten; the visual contract between the existing markup and stylesheet was incomplete.

### Repair

| Source | Destination | Change | Reason | Risk |
|---|---|---|---|---|
| `assets/portal.css` | `assets/portal.css` | Restored the global visual system for the existing shell/components and responsive states; retained the existing base rules and added scoped `final-v257` shell styling plus shared component/modal/form/module styling. | Restore the existing visual behavior represented by the supplied Good screenshots without changing HTML/JS/data/business logic. | Low–Medium: CSS-only; possible visual edge cases on less frequently used legacy modules, so the source markup and behavior were intentionally left untouched. |
| `tools/verify-package.mjs` | `tools/verify-package.mjs` | Added checks for required visual-contract selectors in `portal.css`. | Prevent another packaging step from silently shipping a stylesheet that lacks the shell/component rules. | Low |

### Intentionally not changed

- Firebase project/configuration.
- Firestore collections, document IDs, fields, types, queries, or mappings.
- Authentication/data flow.
- Existing HTML page structure.
- Existing application JavaScript/business logic.
- Existing assets/images.
- Existing Netlify Function implementation.
- Framework/architecture.

### Validation

- CSS parsed with `tinycss2`: **0 parse errors / 278 top-level rules**.
- `npm run build`: **PASS**.
- `PACKAGE_VERIFY_PASS`.
- `REGRESSION_AUDIT_PASS`.

## R10.20.1 — Restore full portal stylesheet + missing Planning navigation

- **assets/portal.css** — replaced the incomplete 30 KB regression stylesheet with the supplied full portal stylesheet (~376 KB / 6,000+ lines) from the previous working baseline. This restores the existing visual contracts for legacy pages, final shell pages, modals, forms, maps, lounge modules, and responsive states. **Risk: low**, because this is restoration of the supplied existing stylesheet rather than a redesign.
- **assets/portal-shell.js** — restored the existing Service Planning navigation entries in the dynamically generated management/Branch Office sidebar, including **Lounge/Tenant Planning (`lounge-list.html`)**. No page logic, permissions, Firestore mapping, or data structures were changed. **Risk: low**; this only restores navigation to pages already present and permission-mapped in the source.
- **tools/verify-package.mjs** — added regression guards so an accidentally truncated `portal.css` or missing `Lounge/Tenant Planning` navigation cannot pass package verification.

### Intentionally unchanged

No changes were made to Firebase configuration, Firestore collections/documents/fields, authentication flow, application data, CRUD logic, or existing page markup.


## R10.20.2 — Consolidated Dashboard POV stabilization / P19A shell lock

- `assets/portal-shell.js`: centralized Role → Dashboard POV resolution; restored shared navy shell, role-specific navigation hierarchy, account menu, notification popover, period control, and no-triangle avatar interaction.
- `assets/dashboard-pov.js`: consolidated SuperAdmin, Management, GE Team/Head Office, and Branch Office Dashboard renderers using existing portal data services; unresolved roles do not fall back to Management; Branch Office context uses assigned station scope without a CGK default.
- `index.html`: dashboard content is now rendered by the dedicated shared Dashboard POV module; Firebase/Auth/data dependencies remain unchanged.
- `profile.html`: added as the valid account Profile destination used by the shared account menu.
- `assets/portal.css`: appended P19A shell integrity lock as the final cascade authority to guarantee visible dark-navy Header + Sidebar + light content geometry, plus consolidated Dashboard presentation styles.
- `tools/verify-package.mjs`: added P19 shell/POV/scope regression guards.

Preserved: Firebase SDK, Firebase Authentication, Firestore-facing client/backend integration, production data structures, role/access/scope/permission mechanisms, existing business modules, Planning functionality, and non-Dashboard page markup/logic. No production data was seeded or rewritten by this iteration.

## R10.20.2 — P22/P23/P24 Navigation, Planning Workspace, User Creation Protection
- P22: grouped role-aware navigation; Planning reduced to Overview / Workspace / Documents primary entries.
- P23: added Planning Workspace presentation entry with Lounge/Tenant, Branch Office, and GASO tabs while retaining existing source routes/data.
- P24: Planning pages use the approved portal shell and planning-scoped consistency styles; removed the Lounge-only visual theme.
- User Management: normal portal UI excludes Super Admin as a target role; server-side create/update blocks Super Admin creation/assignment and Admin access is permission-gated.
- Dashboard, Firebase/Firestore, production data, business logic, and unrelated modules intentionally preserved.

## R10.20.3 — P29 Lounge/Tenant planning and asset readiness audit
- `assets/lounge-planning-v29.js`: added focused P29 service-type resolution, defensive rendering, shared manual/CSV normalization and validation, multi-period pricing, CSV preview/CREATE-only import, duplicate blocking, price schedule detail, and responsive card behavior. **Risk: low–medium**, scoped to Lounge/Tenant Planning.
- `lounge-list.html`: aligned Add/Update entry points, added Service Type filter presentation, switched template action to CSV, and retained existing Lounge/Tenant Planning shell.
- `assets/portal.css`: added P29-scoped card/form/import styles only; P22/P23/P24 shell and Dashboard styles were not reopened.
- `templates/Template_Layanan_Lounge_Tenant_P29.csv`: added a static CSV template using the same logical contract as the P29 importer.
- `tests/p29-lounge-planning.js`: added unit/contract regression checks for service type, legacy price fallback, multi-period price resolution, overlap validation, and invalid input handling.
- `package.json`: build now includes the P29 regression test.
- `docs/P29_REPORT.md`: records the Tenant root cause, data contract, CSV/multi-price behavior, card changes, asset/facility audit, preservation and validation status.

### P29 asset decision
The package already has Service Location and Branch Office Space capabilities, but no suitable physical Asset Registry. P29 therefore did not create a new production Asset collection or large Asset Management module. Future Asset work should reuse Station → Service Location and remain independent of Agreement/Price Schedule lifecycle.

## R10.20.3 — P26 + P28 + P30 Controlled Follow-up

- **P26 Account & Access Management** — replaced the primary legacy user-management presentation with an enterprise account workspace, guided Role/Access Level/Scope/Permissions form, CSV template/import preview, legacy-user review handling, and secure Firebase-backed account operations. Existing legacy Firestore fields remain compatible.
- **P26 security** — normal account creation targets Management / Head Office / Branch Office only; Super Admin remains protected; server-side role, permission, scope, and input validation were strengthened; plaintext temporary passwords are not persisted.
- **P28 Page Identity Isolation** — added stable page identities with legacy route-keyed configuration compatibility. Journey & Touch Point and Account & Access Management now have independent identities.
- **P30 Overlay Integrity** — added a shared portal-wide overlay root that reparents blocking overlays to `document.body`, removes shell stacking-context trapping, locks background scrolling, and adds modal focus/keyboard handling. P29 Lounge/Tenant business/data logic is unchanged.
- **Necessary P22 exception** — `assets/portal-shell.js` no longer maps legacy `role = Admin` to the Super Admin Dashboard POV. This targeted correction prevents a legacy role from failing open to Super Admin and does not redesign navigation.
- **Preservation** — no production Firestore migration or production-data rewrite; package dependencies unchanged.

## R10.20.4 — P31 Authentication & Legacy User Compatibility

- Controlled authentication correction from the latest P26 + P28 + P30 package only.
- Root cause identified at the post-Firebase-auth user-profile lookup stage: `assets/firebase-client.js` was reading `users/{uid}` directly from the browser while `firestore.rules` defines user profiles as server-only (`allow read, write: if false`).
- Firebase Email/Password Authentication remains the credential authority.
- Profile/session lookup now uses the existing Netlify `auth-session` endpoint with the Firebase ID token; no new authentication system was introduced.
- `auth-session` now distinguishes missing profile from inactive account.
- Legacy/unknown authorization defaults fail closed in memory; missing permissions never imply ALL, missing access level defaults to Viewer except legitimate Super Admin compatibility, and unknown/legacy role resolves to an unresolved/limited Dashboard POV.
- `Admin` remains distinct from `Super Admin`.
- P30 is removed only from `login.html` so the reusable overlay runtime cannot participate in authentication initialization; P30 remains loaded across portal pages.
- P22/P23/P24/P29/P26/P28 implementations are preserved.
- No production Firestore documents were changed.
### R10.20.4 — P31B Login Branding & Access Assistance
- Restored the Garuda Indonesia corporate image on the login page and preserved the existing Danantara Indonesia visual.
- Removed technical Firebase/Firestore/session implementation details from visible login copy.
- Added password-free `Lupa password?` Access Assistance Request flow backed by `access-assistance-request` Netlify Function.
- Requests are persisted only after authorized Super Admin / User-Management Admin recipients are resolved; no password is accepted or stored.
- Firebase Authentication and existing session pipeline remain frozen.


## R10.20.5 — P32 Access Assistance Admin Workflow

- Reused the existing `accessAssistanceRequests` collection as the single canonical Access Assistance business object.
- Extended the existing Access Assistance submission flow to create notification references in the existing `inbox` collection, one reference per authorized recipient, without duplicating the request itself.
- Added server-authorized administrator workflow for listing, reading, processing, and resolving Access Assistance requests.
- Authorized recipients remain limited to `Super Admin` and legacy `Admin` users with the existing User Management permission; authorization is checked again server-side for every administrative action.
- Added `OPEN → IN_PROGRESS → RESOLVED` workflow with authenticated `handledBy` / `handledAt` and `resolvedBy` / `resolvedAt` metadata.
- Integrated request notifications into the existing header notification popover and the existing Admin / Pengelola → Pesan Masuk surface without adding a new top-level navigation item.
- Preserved the separation between notification `UNREAD/READ` state and request resolution state.
- No password, token, Firebase UID, service-account information, endpoint information, or Firestore implementation detail is displayed in the operational request detail.
- No password reset mechanism was added. Access Assistance remains a support workflow only.
- No Firebase Authentication, Session Profile, `auth-session`, P26, P28, P29, P30, P31, dashboard POV, lounge planning, portal shell layout, or production user document logic was changed for the workflow itself.

## R10.20.5 — P33–P37 Presentation Stabilization
- P33: added scoped shared table presentation standard with datatype-aware alignment, long-text handling, action-column protection, and responsive compatibility.
- P34: added semantic status presentation without changing stored status values; Contract `Covered` is positive and `Follow-up` is attention/warning.
- P35: extended stable route → pageId registry and isolated Portal Management page configuration by stable page identity; corrected Planning Overview and Account & Access Management visible context.
- P36: traced Planning Overview snapshot provenance and added real drill-down destinations; Contract Follow-up reuses the existing follow-up predicate as a view filter.
- P37: corrected footer/sidebar geometry while preserving the fixed shell and sidebar; footer remains in normal flow and compact.
- Authentication, Session Profile, backend/API, Firestore data, Dashboard POVs, P22, P23, P24, P29, P30, P31, and P32 remain frozen.

## R10.20.6 — P27 Profile & Account Self-Service

- Added additive current-user Profile self-service experience.
- Added safe self-edit for Employee Name only through authenticated server-side UID derivation.
- Added read-only organization, access, data-scope, module-access and account-security presentation.
- Preserved legacy account compatibility with explicit review presentation; no mass migration.
- Added Firebase Authentication reauthentication + `updatePassword()` self-service flow.
- Added authenticated password-lifecycle completion endpoint for `mustChangePassword` metadata.
- Kept existing forced-change endpoint, login pipeline, Session Profile and Authentication foundation unchanged.
- Kept email and username read-only to avoid Auth/Firestore mismatch.
- Added P27 contract/direct-code tests and included them in the build.
- Production validation remains pending; browser visual validation is deferred because local Chromium timed out.
