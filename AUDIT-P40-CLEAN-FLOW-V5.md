# P40 Clean Flow Audit V5

## 1. What was wrong in the two screenshots

The mounted Clean shell was visible, but `app.html?page=index` was blank. The current registry `index` entry was empty and loaded `dashboard-firestore.js`, which is a Super Admin/governance dashboard implementation, not the Management Dashboard shown in the supplied reference.

The supplied reference dashboard already exists in the historical `index.html` implementation: it renders Management Dashboard, Airport Experience Network, Initiative & Improvement, Cost Intelligence, Budget & Financial, and the related cards/panels. V5 reuses that implementation rather than rebuilding the business dashboard from scratch.

## 2. V5 runtime ownership

`app.html` is the only Clean shell owner.

Flow for `page=index`:

`/app.html?page=index`
→ Clean route resolver
→ Clean reference shell
→ `#dashboardRoot`
→ Firebase config/client
→ Auth
→ GEStore
→ existing business engines needed by the reference dashboard
→ `clean-dashboard-management.js`
→ Firestore hydration
→ Management Dashboard render

The index route deliberately does not execute the registry's `dashboard-firestore.js`, so it cannot overwrite the Management Dashboard with the unrelated Super Admin dashboard.

Other routes continue through `clean-page-registry.js`, with legacy shell runtimes removed by the registry transformer.

## 3. Visual alignment

The shell now uses the existing final-v257/R9 visual system already present in `portal.css`:
- navy fixed header
- Garuda + Danantara horizontal lockup
- centered portal title
- period selector
- notification
- help
- SA user control
- navy sidebar
- white dashboard surface
- reference dashboard cards/panels

`e1-canonical.css` is not loaded by `app.html` because its shell geometry conflicts with the supplied final reference shell.

`portal.css` is NOT deleted because it contains the final dashboard/page visual layer and functional page CSS.

## 4. Collapse behavior

Sidebar bottom control:
- label: `Collapse`
- expanded state: full labels
- collapsed state: icon rail
- second click: expand again
- state persists using `GE_CLEAN_SIDEBAR_COLLAPSED`

The existing final-v257/R9 collapsed-state CSS is reused.

## 5. SA user control

The triangle is no longer a separate header control.

The user control is one button containing:
- SA avatar
- chevron

Clicking the same control opens/closes Profile / Sign Out.

## 6. Navigation

The visible navigation is aligned to the supplied reference:
- Dashboard Manajemen
- Pengalaman & Insight
  - Journey & Experience
  - Import CSI & NPS
  - Journey & Touch Point
  - Jaringan Pengalaman Bandara
  - Profil Station / 360
- Perbaikan & Implementasi
  - Initiative & Improvement
  - Improvement Opportunity
  - Planning & Scenario
  - Calendar & Project Tracking
- Perencanaan & Strategi
  - Planning Workspace
  - Lounge / Tenant Planning
  - Cost Intelligence
  - Budget & Financial

Additional Data/Admin/Support routes remain available lower in the navigation; they are not deleted.

## 7. Route safety

The existing Clean route adapter remains responsible for converting legacy `.html` links to `app.html?page=...` and preserving hash fragments.

The registry transformer also fixes programmatic Station 360 navigation, because click interception cannot catch `location.href` assignments.

## 8. Files

### Upload / replace
- `app.html`
- `assets/clean-shell-runtime.js`
- `assets/clean-shell.css`
- `assets/clean-dashboard-management.js`
- `assets/clean-route-adapter.js`
- `assets/edition1-page-boot.js`

### Transform existing
- `assets/clean-page-registry.js`

### Tests
- `tests/clean-flow-regression.js`
- `tests/run-build.mjs`
- `tests/clean-draft-regression.js`

## 9. Verification performed on a local Clean Draft copy

The V5 registry transformer was executed.

Result:
- 56 routes
- 0 legacy shell references
- 2 HTML files
- V5 clean-flow regression: PASS

The JavaScript files were also checked with Node syntax validation.

This is a local source/package verification only; it is not a Netlify deployment claim.
