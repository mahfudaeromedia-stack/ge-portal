# P40 — Edition 1 Firebase / Firestore Functional Rebuild

## Decision
The 12 broken Edition 1 routes are not patched in place. New replacement pages (`e1-*.html`) are provided and the production routes are redirected to them through `netlify.toml`.

## Business-data source
Edition 1 replacement pages do not load `assets/data.js` and do not load `assets/app.js` directly. They use `assets/edition1-store.js`, whose business-data source is authenticated `/api/edition1-data` backed by Firebase Admin / Firestore.

The browser keeps only an in-memory working set for rendering and form interaction. It is not persisted to localStorage and is not seeded with sample records.

## Authentication / authorization
Existing Firebase Authentication and session architecture remain the authentication boundary. The new data API verifies the Firebase ID token and reads the authenticated `users/{uid}` profile before allowing data access.

Station scope, module permissions, access level and administrative restrictions are enforced server-side. External users do not receive the full initiative collection.

## Firestore-backed domains
The replacement runtime maps Edition 1 business domains to Firestore collections including:

- initiatives
- projectEvents (Calendar / Project Tracking)
- airports
- personnel
- lounges
- loungeVisitors
- stationMaterials
- boSpaces
- serviceProcurement
- airportSystems
- gasoMaster
- gasoServiceSupport
- gasoPlanningService
- documents
- touchpointStandards
- skyPriority
- articles / announcements / faqs
- inbox
- users / auditLogs / portalManager

No collection is populated with fake seed data by page load.

## Files
Business document attachments are routed through `edition1-file` to Firebase Storage rather than browser IndexedDB.

## Runtime
The existing business function definitions are consolidated into `assets/edition1-business-runtime.js`. Its automatic DOMContentLoaded boot is suppressed; `edition1-page-boot.js` performs authentication, Firestore hydration and page-specific rendering after the real data has been retrieved.

## Routing
The following legacy routes redirect to the Firebase-backed replacements:

- standar.html
- inisiatif.html
- service-planning.html
- calendar.html
- planning-documents.html
- data.html
- admin.html
- berita.html
- kontak.html
- lounge-list.html
- branch-office-planning.html
- gaso-planning.html
- station-material.html
- bo-space.html
- airport-systems.html

## Validation
Validated before packaging:

- Node syntax check for all new runtime/API files.
- Asset-reference audit for all 12 replacement pages.
- Inline-handler contract audit against the consolidated runtime.
- Existing P22–P38 regression suite.
- P40 Firebase Edition 1 functional contract test.
- Clean local build chain: PASS.
- Netlify-like build chain with `.netlify` present before P38 hygiene test: PASS.

## Validation limitation
A credentialed browser session against the real Firebase project was not executed in this environment. No fake authentication, fake Firestore data, local SuperAdmin, or local production-data bypass was introduced to manufacture that result.
