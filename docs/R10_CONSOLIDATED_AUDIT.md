# R10 Consolidated Runtime Audit

Baseline: project package with R1–R9 history reconciled. This revision removes the overlapping R4–R9 post-runtime patch chain from the active business runtime and replaces it with one canonical consolidation block.

## Root causes corrected
- Airport page boot could wait for `GEStore` without being able to recover if the store script did not establish the global. `waitStore()` now self-heals the canonical store dependency and fails explicitly if initialization still fails.
- Initiative markup still contained the old single Airport input and free-text PIC even though later patches attempted to replace them after render. The canonical markup now directly contains multi Station/Area and User & Access PIC fields plus the requested schedule/cost/status/output fields.
- Milestone PIC is now a direct User & Access selector. Milestone open/save handlers are explicitly bridged and assignment identity is persisted.
- Calendar / Project / Gantt controls are now structural page markup. They are not dependent on a late MutationObserver or synthetic DOMContentLoaded.
- R4–R9 overlapping business-runtime patch blocks were removed from the active runtime to stop later patches from overriding earlier behavior.
- Lounge Grid/Details has one canonical view handler; Details means the existing table/explorer, not a reduced card.

## Preserved
Firebase project/configuration, Firestore schema paths, permissions, roles/scopes, Netlify Functions, existing CRUD, historical Pxx implementation files, templates, OCR assets, map domain modules, existing business records.

## Verification
- JavaScript syntax checks: PASS.
- `npm test`: PASS.
- `npm run build`: PASS.
- Browser/Netlify Preview: must still be verified on the deployed branch; local automated PASS is not represented as browser PASS.
