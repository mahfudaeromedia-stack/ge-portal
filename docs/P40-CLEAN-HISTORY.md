# P40 CLEAN REFACTOR — HISTORICAL REGRESSION RECORD

## Purpose
This file is the historical record for the P40 clean refactor. Historical R/P contracts, patch instructions, and compatibility-layer decisions are recorded here instead of remaining as executable regression files or patch scripts.

## Refactor rule
The production implementation is changed at its canonical source. Historical findings do not become another runtime layer. Regression checks verify the resulting canonical implementation; they do not instruct it how to behave.

## Pipeline
AUDIT → EXTRACT → MERGE → STANDARDIZE → REMOVE DUPLICATION → TEST

## Consolidated regression history
The previous executable regression set was split across the R/P files accumulated during earlier iterations. Their checks were consolidated into `tests/p40-clean-regression.js` and their filenames are retained here only as historical traceability.

Previous active regression files consolidated:
- `tests/clean-draft-regression.js`
- `tests/firebase-rules-contract.js`
- `tests/p29-lounge-planning.js`
- `tests/p31-auth-role-runtime.js`
- `tests/p31b-login-access-assistance.js`
- `tests/p32-access-assistance-runtime.js`
- `tests/r15-functional-contract.js`
- `tests/upload-template-contract.js`
- `tests/r18-consolidation-contract.js`
- `tests/r19-ui-consolidation-contract.js`
- `tests/r20-consolidated-browser-contract.js`
- `tests/r21-auth-persistence-contract.js`
- `tests/r22-runtime-contract.js`
- `tests/r23-cumulative-fix-contract.js`
- `tests/r25-root-cause-contract.js`
- `tests/r26-data-lifecycle-contract.js`
- `tests/r27-airport-marker-contract.js`
- `tests/r28-firestore-cache-contract.js`
- `tests/r29-instant-cache-contract.js`
- `tests/r30-role-scope-firestore-contract.js`
- `tests/r31-admin-firestore-contract.js`
- `tests/r31-1-partner-scope-contract.js`
- `tests/r32-pov-permission-map-contract.js`
- `tests/r38-master-save-contract.js`
- `tests/r38-1-master-table-actions-contract.js`
- `tests/r38-2-master-edit-modal-contract.js`
- `tests/r39-p1-p8-dashboard-cost-contract.js`
- `tests/r40-map-table-presentation-contract.js`
- `tests/r41-runtime-data-table-contract.js`
- `tests/r42-airport-map-presentation-contract.js`
- `tests/r43-airport-experience-foundation-contract.js`
- `tests/r44-sidebar-superadmin-contract.js`
- `tests/r45-routing-lifecycle-contract.js`
- `tests/r46-navigation-readiness-contract.js`
- `tests/r47-assessment-map-contract.js`
- `tests/r49-role-cx-contract.js`
- `tests/r50-admin-cx-contract.js`
- `tests/r51-dashboard-source-contract.js`
- `tests/r52-attention-decision-contract.js`
- `tests/r54-ground-integration-contract.js`
- `tests/r55-regression-contract.js`
- `tests/r56-checklist-bo-master-contract.js`
- `tests/r56-master-render-interaction.js`
- `tests/r57-form-management-workflow.js`
- `tests/r58-catalog-rules-access.js`
- `tests/r60-attention-ground-interaction.js`
- `tests/r62-script-loader.js`
- `tests/r70-requirement-engine.js`
- `tests/r72-planning-inbox.js`
- `tests/r72-read-persistence.js`
- `tests/r81-p8-production-deployment-contract.js`


## Runtime/source duplicates removed
These files were removed because the current canonical application no longer loads them, or their implementation had already been absorbed into the canonical runtime:

- `assets/app.js` — business implementation already consolidated into `assets/edition1-business-runtime.js`.
- `assets/edition1-portal-shell-entry.js` — obsolete duplicate shell entry; canonical app loads `assets/portal-shell.js`.
- `assets/edition1-portal-route-adapter.js` — obsolete E1 route adapter; canonical routing is owned by `app.html` + `assets/clean-route-adapter.js`.
- `assets/edition1-canonical-shell.js` — obsolete second shell implementation.
- `assets/edition1-pages.css` — obsolete E1 page stylesheet.
- `assets/e1-canonical.css` — obsolete E1 stylesheet.
- `assets/reference-id-catalog.js` — legacy secondary Master Data renderer; canonical Master Data is `assets/master-reference.js`.
- `assets/v2544-modal-fix.js` — compatibility shim already represented in canonical business runtime.
- `assets/v2554-stability.js` — compatibility/stability implementation already represented in canonical business runtime.

No Firebase collection, document, persisted business data, Netlify Function, OCR resource, or user-facing feature was deleted by this cleanup.

## Master Data boundary correction
Master Data remains responsible for the canonical reference layer. It must not become a general-purpose loader for vendor/personnel/user collections or unrelated domain data. Existing domain data remains owned by its respective page/domain.

## Delivery rule
Only canonical source files should be changed for future fixes. If a historical note is needed, add it here; do not create another runtime patch file or another regression implementation.

## Historical patch tooling removed
The following patch/diff/application artifacts were removed from the clean package because they are implementation history, not runtime source:

- `P40-route-hardening.patch`
- `PATCH-*.diff`
- `PATCH/`
- `apply-p40-*.py`
- `ROLLBACK-SCOPE.txt`
- `CHANGED-FILES.txt`
- `APPLY-ORDER.txt`
- `PATCH_MANIFEST.md`
- `P40-CLEAN-BOOTSTRAP-RECONSTRUCTED.md`

Their existence was not required by the canonical application and keeping them beside production source created a second instruction layer.

## Additional dead-source cleanup
The following standalone JS files had no runtime or registry references after canonical source consolidation and were removed:

- `assets/assessment-workspace.js`
- `assets/planning-portfolio.js`
- `assets/v257-initiative-grid-final.js`

This cleanup removed unreachable source only; no persisted data or active runtime dependency was removed.
