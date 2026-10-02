# Ground Experience Portal — R15 Execution Report

Baseline: consolidated P40 + R14 changed files. Existing working functions were retained; changes were made in the canonical runtime/store/CSS rather than adding replacement pages.

## Corrected in R15
- Firestore browser fallback now reads authoritative account data from root `/users`, not `portalData/users/records`.
- Initiative PIC account labels now show the user's name only.
- Gantt workspace restores six reference filters: Journey Scope, Touch Point, Station, PIC, Event Type, Initiative.
- Touch Point query context remains active when entering Gantt from Initiative.
- Gantt project/deadline sorting and project-column resize remain retained from the canonical R13 implementation.
- Gantt bars remain clickable and now expose PIC in hover/title context.
- Module Permission checkboxes are forced to compact native checkbox dimensions (17px) instead of inheriting large form-control sizing.
- Successful Firestore hydration status auto-clears after confirmation rather than remaining as page content.
- Existing Airport Experience mouse-wheel zoom/pointer pan canonical implementation retained.
- Existing Lounge searchable select implementation and Grid/Details canonical switch retained.

## Verification
- `node --check assets/edition1-business-runtime.js`: PASS
- `node --check assets/edition1-store.js`: PASS
- `npm test`: PASS
- `npm test -- --netlify`: PASS
- Added `tests/r15-functional-contract.js` to prevent regression of root `/users`, PIC labels, Gantt filters/click/hover, and compact permission checkboxes.

## Important
Automated build/static contract tests pass. Firebase content and pointer interactions still require deploy-preview browser verification against the real authenticated Firebase project because the build environment does not contain the user's live authenticated browser session.
