# P40 CLEAN FLOW AUDIT — V4
Repository: `mahfudmf-aka/GE_Portal`
Branch audited: `test-1`
GitHub writes: NONE

## Scope
This audit traces the Clean Draft from Login → app bootstrap → canonical shell → route resolution → registry → page runtime → data layer → result/error handling, then audits all 56 registry routes and the runtime families behind them.

## 1. Canonical runtime contract

### Intended single flow
1. `login.html`
2. Firebase client/authentication
3. successful authentication stores session and redirects to `app.html?page=<route>`
4. `app.html` creates only the Clean shell mounts:
   - `.e1-top`
   - `.shell > .side`
   - `.shell > .main#cleanPageOutlet`
5. `clean-shell-runtime.js` owns header, sidebar, user popup, notification popup, period control and logout UI.
6. `clean-route-adapter.js` converts legacy `.html` links to `app.html?page=<route>` and preserves query/hash.
7. `clean-page-registry.js` supplies the page HTML and page runtime list.
8. page-specific runtime loads after the HTML exists.
9. Edition 1 pages use `edition1-page-boot.js` → Firebase/Firestore → `GEStore.hydrate()` → page renderer.
10. legacy/v257 pages continue using their existing business runtime until separately migrated.
11. runtime errors are rendered into `#cleanPageOutlet` instead of leaving an unexplained blank page.

### Current blocking defect
The existing `app.html` had `.top` instead of `.e1-top` and did not load `clean-shell-runtime.js`. `edition1-canonical-shell.js` also was not loaded. Therefore the existing canonical shell had no valid mount and the old `.top/.side` CSS remained visible. The registry's `index` HTML was also empty, while `dashboard-firestore.js` requires `#dashboardRoot`.

### V4 correction
`app.html` now:
- uses `.e1-top`
- enables `e1-modern`
- loads `clean-shell-runtime.js`
- keeps `portal.css` because domain/legacy functional CSS is still used
- keeps only the existing two HTML files

No old HTML page is recreated.

## 2. Shell ownership

### One shell owner in Clean Draft
`assets/clean-shell-runtime.js`

### No shell ownership for:
- `assets/portal-shell.js`
- `assets/edition1-portal-shell-entry.js`
- `assets/edition1-portal-route-adapter.js`

Those legacy shell runtimes should be removed from the Clean registry. Their source files remain in the repository as historical/legacy assets and are not deleted.

### Why portal.css is NOT deleted in V4
`portal.css` is a mixed stylesheet. It contains:
- old shell/theme declarations
- final-v257 shell declarations
- login styles
- map styles
- Initiative/Calendar/Admin/Lounge/OCR/domain styles

Deleting the file or deleting all `.top/.side/.shell/.main/.card` declarations would break runtime pages. V4 therefore removes the dependency on the old shell visually by changing the Clean shell mount, but does NOT perform a blind CSS purge.

The next CSS-cleanup phase must remove only proven-obsolete declarations after legacy page migration is complete.

## 3. Route contract

Canonical route:
`app.html?page=<route>[&other=query]#hash`

Legacy links such as:
`inisiatif.html`
become:
`app.html?page=inisiatif`

Aliases already defined in the registry remain authoritative:
- `station-material` → `service-planning?panel=material`
- `bo-space` → `branch-office-planning?panel=space`
- `airport-systems` → `branch-office-planning?panel=systems`
- `airport-experience-map` → `airport-experience`
- `map` → `airport-experience`
- `network-stations` → `airport-experience`

The route adapter must preserve hash fragments.

Netlify 3xx redirects also preserve query parameters by default; therefore existing legacy redirects can remain without inventing duplicate route rules. citeturn3search0

## 4. Programmatic navigation

Two direct navigation cases were found inside the registry:
- Station 360 inline `location.href=...`
- `service` redirect to `index.html#service-experience`

These bypass ordinary anchor click interception.

V4 changes them to canonical Clean destinations:
- Station 360 → `window.p40CleanRoute(...)`
- service → `app.html?page=index#service-experience`

## 5. Edition 1 page flow

For these routes:
- `admin`
- `berita`
- `branch-office-planning`
- `calendar`
- `data`
- `gaso-planning`
- `inisiatif`
- `kontak`
- `lounge-list`
- `planning-documents`
- `service-planning`
- `standar`

the intended flow is:

`app.html?page=X`
→ registry HTML
→ Firebase client + Auth
→ `GEStore`
→ `edition1-business-runtime.js`
→ `edition1-page-boot.js`
→ map query route X to its historical `e1-*.html` identity
→ hydrate required collections
→ render page

The existing boot file only looked at `location.pathname`, which is `app.html`, so it could not select the E1 config. V4 fixes this with an explicit Clean-route → E1-runtime map.

## 6. Legacy/v257 page flow

These pages currently use the older runtime family:
- `data.js`
- `core-v257.js`
- `app.js`
- domain `*-v257.js`
- `overlay-v30.js`
- related compatibility/runtime files

They can render their existing HTML from the Clean registry, but the audit found remaining `location.pathname` checks in shared legacy runtime code. Examples include Touchpoint rendering and several active-navigation/planning helpers.

Therefore:
**the legacy page family is NOT certified as fully migrated to Clean query-route semantics by V4.**

V4 does not pretend that shell cleanup equals full legacy-runtime migration.

The required next migration is to introduce one shared Clean route resolver for legacy runtime checks instead of patching each page independently.

## 7. Per-page registry audit

### A. E1 canonical runtime pages
| Route | Current HTML | Runtime family | Flow |
|---|---:|---|---|
| `admin` | yes | Edition 1 | registry → E1 boot → Firestore |
| `berita` | yes | Edition 1 | registry → E1 boot → Firestore |
| `branch-office-planning` | yes | Edition 1 | registry → E1 boot → Firestore |
| `calendar` | yes | Edition 1 | registry → E1 boot → Firestore |
| `data` | yes | Edition 1 | registry → E1 boot → Firestore |
| `gaso-planning` | yes | Edition 1 | registry → E1 boot → Firestore |
| `inisiatif` | yes | Edition 1 | registry → E1 boot → Firestore |
| `kontak` | yes | Edition 1 | registry → E1 boot → Firestore |
| `lounge-list` | yes | Edition 1 | registry → E1 boot → Firestore |
| `planning-documents` | yes | Edition 1 | registry → E1 boot → Firestore |
| `service-planning` | yes | Edition 1 | registry → E1 boot → Firestore |
| `standar` | yes | Edition 1 | registry → E1 boot → Firestore |

### B. Legacy/v257 runtime pages
These retain their existing business engines; V4 only fixes the Clean shell/route envelope.

`action-scenario`, `agreement-service`, `asset-facility`, `audit-log`, `budget-cost`, `core-master`, `core-relationships`, `cost-intelligence`, `customer-experience`, `cx-import`, `improvement-intake`, `initiative-conversion`, `initiative-traceability`, `layanan`, `lounge-access`, `lounge-flights`, `lounge-procurement`, `lounge-purchase`, `lounge-visitor`, `master-data`, `planning-workspace`, `portal-management`, `post-flight`, `post-journey`, `pre-flight`, `profile`, `program-kerja`, `readiness`, `station-360`, `touchpoint`, `airport-experience`.

### C. Registry entries currently empty
Original branch contains empty HTML for:
- `core-foundation`
- `core-history`
- `core-migration`
- `core-permission`
- `core-publication`
- `core-shared`
- `index`
- `management-outcome`
- `service-capability`
- `service-locations`
- `service`

`index` is a real user-facing route and is fixed in V4 with `#dashboardRoot`.

The other empty entries are NOT deleted because their scripts/source metadata may still represent historical acceptance or future page ownership. They must not be exposed as navigation destinations until HTML/runtime ownership is defined.

`service-capability`, in particular, was removed from the V4 canonical sidebar because its registry HTML is empty.

## 8. Critical feature flow audit

### Dashboard
`app.html?page=index`
→ `#dashboardRoot`
→ `dashboard-firestore.js`
→ Firestore-backed dashboard data
→ render

This was previously impossible because the registry injected an empty string.

### Initiative
`app.html?page=inisiatif`
→ E1 HTML
→ `GEStore.hydrate(initiatives,touchpoints,documents)`
→ Initiative renderers
→ CRUD/timeline/milestone functions

### Calendar
`app.html?page=calendar`
→ E1 HTML
→ `projectEvents` + initiatives/touchpoints
→ Calendar renderer/filter/KPI/reminder functions

The existing one-way Initiative → Calendar data contract remains unchanged.

### Airport Experience
`app.html?page=airport-experience`
→ legacy network/map runtime
→ station/network/service relationships
→ map rendering

Legacy programmatic Station 360 navigation is explicitly normalized by V4.

### Station 360
`app.html?page=station-360`
→ station/network/service relationship runtime
→ detail view

### Customer Experience / OCR
`app.html?page=customer-experience`
→ CX runtime

`app.html?page=cx-import`
→ Tesseract assets
→ OCR extraction/validation/correction

The audit confirms OCR assets and engine exist, but persistence is still split from the canonical Firestore business store. This is a separate data-layer task, not a shell task.

### Lounge/Tenant
The existing P29 runtime supports multi-period pricing. V4 does not alter its data model.

## 9. CSS safety decision

DO NOT delete these structural/functional selectors globally:
- `.top`
- `.shell`
- `.side`
- `.main`
- `.hero`
- `.card`
- `.btn`
- `.panel`
- `.map`
- `.footer`
- `.back-to-top`
- form/table primitives
- login styles
- domain-specific selectors

The old-theme declarations can be removed later only when their runtime consumers are gone.

## 10. Build/test flow

Current `netlify.toml` already invokes:
`npm --prefix netlify/functions install --omit=dev --ignore-scripts && npm run test`

The repository has a root `package.json` with:
`"test": "node tests/run-build.mjs"`

Netlify's build configuration runs the configured build command and deploys the configured publish directory; the current root publish model remains compatible with this static architecture. citeturn1search5turn1search0

V4 adds a Clean-flow regression test to the test sequence.

The test must prove:
1. exactly 2 HTML files
2. canonical shell mount exists
3. Clean shell runtime is loaded
4. legacy shell runtimes are absent from registry
5. dashboard root exists
6. query-route boot mapping exists
7. hash preservation exists
8. programmatic routes are normalized
9. final-v257/domain CSS remains present

## 11. Manual deployment sequence

No GitHub writes are performed by this package.

Recommended order:
1. Upload `app.html`.
2. Upload `assets/clean-shell-runtime.js`.
3. Upload `assets/clean-route-adapter.js`.
4. Upload `assets/edition1-page-boot.js`.
5. Apply the registry edits exactly from `REGISTRY-MANUAL-EDIT.txt` OR run `apply-p40-clean-registry-v4.py` from the repository root.
6. Add `tests/clean-flow-regression.js`.
7. Apply `tests/run-build.mjs.patch`.
8. Apply `tests/clean-draft-regression.js.patch`.
9. Run `npm run test`.
10. Only after tests pass, push to the test branch and inspect the Netlify branch/deploy result.

Netlify branch deploys must be enabled in the site configuration; they are distinct from Deploy Previews. citeturn2search0turn2search1

## 12. Explicit non-changes in V4

V4 does NOT:
- delete `portal.css`
- rewrite Firebase rules
- replace Firebase authentication
- delete historical HTML/JS source files
- recreate one HTML file per page
- rewrite business CRUD logic
- change Lounge pricing schema
- change Calendar one-way semantics
- rewrite OCR persistence
- redesign the page visuals
- write anything to GitHub
- add speculative redirects
- add duplicate shell implementations

## 13. Remaining audit backlog after V4

P1 — legacy runtime query-route compatibility:
replace remaining direct `location.pathname` assumptions in legacy shared runtimes with one Clean route resolver.

P1 — CSS source cleanup:
after legacy shell migration, delete only proven-obsolete old-theme declarations from `portal.css`.

P1 — empty registry pages:
decide explicit ownership for P1/P2/P5 acceptance routes before exposing them.

P2 — CX persistence:
unify OCR/localStorage state with canonical Firestore/GEStore.

P2 — Airport Experience:
verify explicit WEST region semantics in the map filter and station data.

P2 — Calendar:
distinguish Initiative-linked activities from standalone activities without reverse-syncing Calendar activities into Initiative.

P2 — Lounge:
standardize `pricingPeriods` as canonical schema and retain `pricePerPax` only for legacy read compatibility.

P2 — template/source cleanup:
audit XLSX/CSV field parity before deleting source templates.

## Final rule
Do not call the Clean Draft fully safe merely because the shell renders.

The acceptance path is:
Login → app → canonical shell → route → page HTML → page runtime → permissions → data → interaction → result/error → navigation back to canonical route.

A page is complete only when that full path is verified.
