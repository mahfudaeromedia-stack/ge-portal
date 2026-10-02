# P33–P37 Presentation Stabilization Report

## Scope
Presentation-only stabilization from the approved P32 package. Authentication, Session Profile, backend functions, Firestore business/data logic, dashboards, P22–P32 workflows remain frozen.

## P33 — Portal Table & Data Presentation Standard
- Added scoped `.gx-table-standard` presentation primitives; no broad `table`, `td`, or `th` replacement was introduced.
- Representative table routes are opt-in through `assets/p33-p37-presentation.js`.
- Existing table sorting/pagination implementation is reused; sortable headers retain keyboard interaction and active direction indicators.
- Datatype presentation is classified from actual column labels: text, number, currency, date, status, document, action.
- Long document/text cells retain the complete DOM value and receive a native title for inspection rather than silent truncation.
- Action columns retain minimum usable width and do not hide existing actions.
- Existing empty-state renderers are preserved; no fake rows are created.
- Existing horizontal scrolling remains available where a table genuinely requires it.

Representative routes audited: Planning Overview, Lounge/Tenant, Branch Office Planning, GASO Planning, Planning Documents, Account & Access Management, Customer Experience, Readiness, Budget/Cost, Station Material, Airport Systems, Branch Office Space, Agreement/Document, Network, Initiative/Improvement tables.

## P34 — Semantic Status System
Actual status vocabulary was inspected from the portal source rather than inferred from English labels alone. Examples include `Valid`, `Covered`, `Follow-up`, `Active`, `Inactive`, `Completed`, `Pending`, `Pending Verification`, `Review`, `REVIEW`, `OK`, `On Progress`, `Draft`, `Proposed`, `Approved`, `Closed`, `Expired`, `Critical`, `Overdue`, `Not Available`, `Failed`, `Rejected`, `Cancelled`, `Not Compliant`, `Not Assessed`, `Unavailable`, `Archived`, `Superseded`, `Future`, `Legacy Imported`, `Effective`, `Paid`, `Verified`, `Published`, and Access Assistance states `OPEN`, `IN_PROGRESS`, `RESOLVED`.

Semantic families:
- Positive/healthy → green
- Attention/warning → amber
- Critical/negative → red
- Process/information → blue
- Neutral/unknown → gray

Contract-specific presentation:
- `Covered` → positive/green.
- `Follow-up` → attention/amber.
- Stored `documentStatus` values are unchanged, including `Valid` and existing non-valid/blank document-status values.
- Derived contract presentation continues to use the existing `geContractNeedsFollowup()` predicate.

Status text remains visible; color is not the sole carrier of meaning.

## P35 — Navigation / Tab / Page Identity Consistency
A stable route → pageId registry was extended in `assets/page-identity-v28.js` and exposed through `assets/p33-p37-presentation.js`.

Key mappings:
- `service-planning.html` → `planning-overview`
- `planning-workspace.html` → `planning-workspace`
- `planning-documents.html` → `planning-documents`
- `lounge-list.html` → `lounge-tenant-planning`
- `touchpoint.html` → `journey-touchpoint`
- `admin.html` → `account-access-management`

Portal Management saves page title/description by stable pageId. A legacy route-key configuration remains readable only as a same-route fallback; it is not used as a cross-page fallback.

Corrected visible context includes Planning Overview and Account & Access Management. Planning Workspace keeps its parent identity while its three existing tabs remain explicit.

## P36 — Information Card & Drill-down Integrity
Planning Overview snapshot provenance was traced in the existing `renderPlanningOverview()` implementation:

| Card | Source of displayed number | Business meaning | Destination | Context |
|---|---|---|---|---|
| Lounge Provider | `data.lounges.length` | Existing Lounge/Tenant master records | `lounge-list.html` | Existing Lounge/Tenant workspace |
| Contract Follow-up | `data.lounges.filter(geContractNeedsFollowup).length` | Lounge/contract records requiring existing follow-up predicate | `lounge-list.html?planningCard=contract-followup` | Reuses `geContractNeedsFollowup()` as a view filter |
| Airport / BO | `data.airports.length` | Airport master records used by network context | `network-stations.html?planningCard=airport-bo` | Airport Experience Network |
| Planning Master | `stationMaterials + boSpaces + airportSystems` | Aggregate planning master records | `service-planning.html#planning-master` | Existing planning module cards |

Cards receive pointer, hover, focus, keyboard activation, and pressed feedback only where a real destination exists. No dummy links or fake modals are used.

## P37 — Footer Layout Integrity
Root cause: the approved R10.3 shell uses a fixed sidebar while the footer is a sibling of `.shell`; without a footer-specific horizontal offset, footer text begins at viewport x=0 and can sit underneath the sidebar.

Correction:
- Footer remains in normal document flow.
- Footer content receives the same sidebar-aware horizontal geometry as main content.
- Collapsed sidebar uses the collapsed sidebar width.
- Mobile removes the desktop offset because the sidebar becomes an off-canvas navigation surface.
- Footer padding and typography are compact; no artificial fixed height is used.
- Shell minimum height is adjusted only to let a short page naturally reach the compact footer.
- Header and sidebar design are not modified.

## Preservation
No changes to:
- Firebase Authentication
- Session Profile / `auth-session`
- Firestore production data or collections
- Dashboard POV logic/layout
- P22, P23, P24
- P29 business/data logic
- P30 overlay implementation
- P31 authentication correction
- P32 Access Assistance workflow
- Netlify Functions/backend API
- `assets/app.js`, `assets/data.js`, and core business modules

## Deployment-only verification
Real Netlify browser verification remains required for the final visual/interaction acceptance. No production PASS is claimed from local HTTP checks.
