# P22 / P23 / P24 Implementation Report

Baseline: `Ground_Experience_Garuda_Indonesia_R10_20_DASHBOARD_CONSOLIDATED_P19_FINAL` only.

## P22 Navigation
- Replaced the role-neutral flat planning-heavy navigation with grouped role-aware domains.
- SuperAdmin: full grouped portal access including User & Access, Portal Management, Audit Log.
- Management: monitoring/decision navigation without technical administration.
- GE Team / Head Office: broader network/readiness/improvement/planning/data navigation.
- Branch Office: My Station, Customer Experience, Tasks & Actions, Planning, Budget, Documents/Support.
- Planning is now represented by three primary sidebar entries: Planning Overview, Planning Workspace, Planning Documents.
- Underlying routes such as `lounge-list.html`, `branch-office-planning.html`, `gaso-planning.html`, `station-material.html`, `bo-space.html`, and `airport-systems.html` remain retained for backward compatibility and existing links.
- Actions remain page-level/contextual; they are not promoted to permanent sidebar destinations.

## P23 Planning
- `service-planning.html` remains the dedicated Planning Overview.
- New `planning-workspace.html` provides the consolidated presentation entry.
- Workspace tabs route to the existing Lounge/Tenant, Branch Office, and GASO pages; the underlying data/CRUD code is not merged.
- `planning-documents.html` remains a separate primary destination.
- Legacy planning routes remain in place.

## P24 UI
- Planning pages now use the approved portal shell via the existing `portal-shell.js`.
- Added only planning-scoped tab/workspace styles.
- Removed the Lounge-only theme classes from `lounge-list.html`; no replacement lounge/GASO/BO theme was introduced.
- Active, hover, focus and selected states are explicit on Planning tabs.

## User Management Security
- Normal Create User target roles exclude Super Admin.
- Server-side create rejects `role=Super Admin` for every normal portal user-management request.
- Server-side update rejects assigning Super Admin and protects existing Super Admin profiles from normal User Management editing.
- SuperAdmin retains ordinary user creation; Admin creation is gated by an explicit User Management permission (or legacy `admin`/`ALL` tab grant when permissions are not present).
- New supported target roles include Management and Head Office, while existing role values are not migrated.

## Preservation
Dashboard implementation, Firebase client, Firestore data model, production records, unrelated module content, and Netlify Function architecture were not rebuilt or migrated. Changes are limited to navigation, Planning presentation, and the explicitly authorized User Management security rule.

## Validation status
- Development preview: local `tools/serve.mjs` on port 5173 returned HTTP 200 for Dashboard and all Planning routes checked.
- Production preview: `npm run preview` on port 4173 returned HTTP 200 for Dashboard and all Planning routes checked.
- Production build: `npm run build` passed `PACKAGE_VERIFY_PASS` and `REGRESSION_AUDIT_PASS`.
- Package integrity: final ZIP passed `unzip -t`.
- Navigation matrix: Node-level contract tests confirmed the four required role POV mappings and three primary Planning entries; legacy Lounge/Branch/GASO entries are absent from generated sidebar navigation.
- Access-level matrix: Node-level tests confirmed Management remains view-only for Planning edits, while Head Office/Branch Office Editor and Approver contexts can expose Planning edit actions subject to the permission layer.
- User-creation security: isolated Node handler tests confirmed Super Admin creation is rejected, Admin without User Management permission is rejected, authorized Admin normal-user creation succeeds, and Super Admin role assignment/update is rejected.
- Browser visual/E2E automation was attempted with the available Chromium/Playwright runtime, but the execution environment returned `ERR_BLOCKED_BY_ADMINISTRATOR` for local file/HTTP navigation. Therefore no claim is made of live browser-click validation against Firebase production data; no production credentials or data were modified during validation.
