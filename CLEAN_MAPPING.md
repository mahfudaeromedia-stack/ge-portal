# P40 CLEAN DRAFT 01 — Canonical Page Mapping

- Physical HTML source audited: 74
- Canonical portal HTML in draft: 2 (`login.html`, `app.html`)
- Logical page definitions in registry: 56
- E1 files are treated as corrected implementations of the same logical page, not new pages.
- Airport Experience merges network-stations + map; airport-experience-map was redirect-only.
- station-material / bo-space / airport-systems are child panels of their canonical planning parents.

## Canonical routes

- `action-scenario` ← action-scenario.html
- `admin` ← e1-admin.html
- `agreement-service` ← agreement-service.html
- `airport-experience` ← network-stations.html, map.html
- `asset-facility` ← asset-facility.html
- `audit-log` ← audit-log.html
- `berita` ← e1-berita.html
- `branch-office-planning` ← e1-branch-office-planning.html
- `budget-cost` ← budget-cost.html
- `calendar` ← e1-calendar.html
- `change-password` ← change-password.html
- `core-foundation` ← core-foundation.html
- `core-history` ← core-history.html
- `core-master` ← core-master.html
- `core-migration` ← core-migration.html
- `core-permission` ← core-permission.html
- `core-publication` ← core-publication.html
- `core-relationships` ← core-relationships.html
- `core-shared` ← core-shared.html
- `cost-intelligence` ← cost-intelligence.html
- `customer-experience` ← customer-experience.html
- `cx-import` ← cx-import.html
- `data` ← e1-data.html
- `gaso-planning` ← e1-gaso-planning.html
- `improvement-intake` ← improvement-intake.html
- `index` ← index.html
- `inisiatif` ← e1-inisiatif.html
- `initiative-conversion` ← initiative-conversion.html
- `initiative-traceability` ← initiative-traceability.html
- `kontak` ← e1-kontak.html
- `layanan` ← layanan.html
- `lounge-access` ← lounge-access.html
- `lounge-flights` ← lounge-flights.html
- `lounge-list` ← e1-lounge-list.html
- `lounge-procurement` ← lounge-procurement.html
- `lounge-purchase` ← lounge-purchase.html
- `lounge-visitor` ← lounge-visitor.html
- `management-outcome` ← management-outcome.html
- `master-data` ← master-data.html
- `planning-documents` ← e1-planning-documents.html
- `planning-workspace` ← planning-workspace.html
- `portal-management` ← portal-management.html
- `post-flight` ← post-flight.html
- `post-journey` ← post-journey.html
- `pre-flight` ← pre-flight.html
- `pre-journey` ← pre-journey.html
- `profile` ← profile.html
- `program-kerja` ← program-kerja.html
- `readiness` ← readiness.html
- `service` ← service.html
- `service-capability` ← service-capability.html
- `service-locations` ← service-locations.html
- `service-planning` ← e1-service-planning.html
- `standar` ← e1-standar.html
- `station-360` ← station-360.html
- `touchpoint` ← touchpoint.html

## Locked decisions
- `core-*`: Super Admin-only children under Portal Management.
- Initiative Timeline updates feed Calendar & Project Tracking one-way; standalone calendar/project activities do not write back to Initiative.
- CSV is canonical downloadable template when CSV/XLSX duplicates exist. Source files are audited separately and retained unless proven obsolete.
- Lounge/Tenant pricing supports multiple effective price periods per agreement. The P29 CSV already contains Price Period fields and is retained.

## Verification status
This is the first executable structural clean draft. It consolidates HTML/shell routing without intentionally deleting business runtimes. Real Firebase credentialed login, OCR, map interaction, CRUD, modal behavior, and every page action still require regression execution before any “AMAN” claim.