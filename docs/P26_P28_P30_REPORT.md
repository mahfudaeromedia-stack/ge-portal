# P26 + P28 + P30 Controlled Development Report

Baseline: `Ground_Experience_Garuda_Indonesia_R10_20_P29_FINAL.zip`

Status: implementation complete from the latest P29 package only.

## P26 — User & Role / Account & Access Management

### User Management workspace

`admin.html` now presents Account & Access Management as the primary user-management workspace. The page contains:

- Total Users / Active / Inactive / Requires Review summary
- Search
- Role filter
- Access Level filter
- Status filter
- Scope filter
- Unit / Department filter
- enterprise user table
- Add User
- Import CSV
- Download Template

The legacy explanatory role-card area is no longer the primary presentation. Legacy users remain readable and are marked for review where their organizational role/access model is incomplete.

### Authorization model

The UI and secure endpoints keep these concepts separate:

- Role: Management, Head Office, Branch Office for normal account creation
- Super Admin: protected existing role, never a normal create/update target
- Access Level: Viewer / Editor / Approver / Admin
- Scope: ALL / STATION / MULTI_STATION
- Permissions: module-level capabilities

The existing `tabs[]`, `airports[]`, and `loungeIds[]` fields remain compatibility fields. New user-facing labels use Module Permissions and Assigned Station(s)/Lounge(s).

### Legacy Admin

The existing `role = Admin` value is treated as a legacy organizational-role value, not as Super Admin. The portal Dashboard POV resolver no longer maps legacy Admin to the Super Admin POV. A legacy user opened for editing must explicitly select one of the supported organizational roles instead of silently defaulting to Management.

This is a deliberate P26 security/identity correction; it does not mass-migrate existing user documents.

### Add / Edit User

The guided form contains:

- Employee Name
- Employee Number
- Email
- Username
- Temporary Password for create
- Unit / Department
- Organization Type
- Role
- Access Level
- Status
- Scope Type
- Assigned Station(s), conditional on scope
- optional Assigned Lounge(s)
- Module Permissions
- Advanced Permission Override

New accounts use Management / Head Office / Branch Office as the normal organizational Role set. Super Admin is absent from the creation form.

Scope behavior:

- ALL: no station assignment required
- STATION: exactly one assigned station
- MULTI_STATION: at least one assigned station

The existing `airports[]` field is reused for Assigned Station(s), avoiding a second parallel station field.

### Firebase Authentication / Firestore

Authentication credentials continue to belong to Firebase Authentication. Temporary passwords are sent to the secure Netlify Function and are not stored in the Firestore profile or audit record.

Firestore continues to store user profile/access metadata. No production collection or field migration was performed.

### Password self-service readiness

The existing `mustChangePassword` flow remains compatible with the account-management work. The P26 UI does not create a second password store.

### Reset Password

Where the secure endpoint exists, Reset Password is provided through a P30-safe modal. The endpoint requires User Management permission, respects scope, blocks protected Super Admin targets, and marks the account for password change.

### CSV user import

Flow:

`Upload → Parse → Normalize → Validate → Preview → Confirm → Create Valid Accounts → Result`

The import is CREATE-only. Existing accounts are not overwritten.

Canonical CSV columns:

1. Employee Name
2. Employee Number
3. Email
4. Username
5. Temporary Password
6. Role
7. Access Level
8. Unit / Department
9. Organization Type
10. Scope Type
11. Assigned Stations
12. Assigned Lounges
13. Status

Multi-value station/lounge values use `;` as the separator.

The template includes instruction comment rows; the importer explicitly ignores comment rows beginning with `#`.

Validation includes required identity fields, email, username, password length/format, supported Role, Access Level, Scope, required station assignment, duplicate email/username, unsupported role, and Super Admin attempts.

Invalid rows are not sent to the server. The secure endpoint revalidates the request, so frontend manipulation is not a security boundary.

Partial account-creation failures are reported per row. The existing server-side Firebase Authentication / Firestore compensation logic remains the account-creation mechanism.

## P28 — Page Identity Isolation

### Audit result

The current P29 package did not contain a single explicit Firestore page-title identifier shared by both Journey & Touch Point and Account & Access Management. Instead, the portal's page-management foundation was route-keyed and lacked a stable page identity registry. Generic hero selectors also meant page-specific content identity was not represented explicitly.

Therefore the confirmed collision was treated as an identity-resolution weakness rather than solved by adding another Firestore collection.

### Stable identity registry

`assets/page-identity-v28.js` adds independent stable identities, including:

- `touchpoint.html → journey-touchpoint`
- `admin.html → account-access-management`
- `standar.html → service-standard`
- `service-planning.html → planning-overview`
- `lounge-list.html → lounge-tenant-planning`
- `calendar.html → calendar-project-tracking`

The page-management layer can read legacy route-keyed configuration but writes/uses the stable page identity for new page-specific configuration.

No production page configuration records are mass-deleted or migrated.

### Isolation behavior

Editing one page resolves through its own `pageId`; it does not reuse another page's pageId. Missing configuration falls back to that page's own registry metadata rather than another page's title.

The page registry is also available to validation as `GX_PAGE_IDENTITY_V28`.

## P30 — Overlay / Modal / Layer Integrity

### Root cause

The audited portal contains several modal systems with very high z-index values. The confirmed Lounge/Tenant defect was consistent with an overlay remaining inside the portal content/shell stacking context: a child z-index cannot escape an ancestor stacking context when the ancestor is below the fixed Header/Sidebar layers.

Existing CSS already contained multiple modal z-index patches, which made isolated z-index increases an unreliable solution.

### Shared solution

`assets/overlay-v30.js` establishes a reusable overlay-root rule:

- blocking overlays are promoted to `document.body`
- the overlay receives a fixed viewport root
- the root uses a dedicated top layer
- modal content receives its own higher layer
- ancestor clipping/stacking contexts no longer contain the blocking modal
- long-form modal content scrolls internally
- the page body is locked while a blocking overlay is open
- focus is moved into the dialog on open and restored on close where possible
- Tab focus is kept inside the active blocking dialog
- Escape closes non-destructive overlays where appropriate
- destructive/critical overlays are not auto-confirmed by Escape

The approved Header and Sidebar dimensions, positions, and navigation are not changed to accomplish this.

### Lounge/Tenant modal

The P29 Add/Edit Lounge/Tenant modal is covered by the same overlay rule. No P29 data or business logic was changed.

### User Management modals

P26 Add User, Edit User, Import CSV, CSV Preview/result, and Reset Password use the same P30 overlay layer. The Add/Edit form uses a scrollable modal body with stable actions outside that scrolling region.

### Portal-wide coverage

All 60 HTML pages that load the portal shell now load the shared P30 overlay module. This includes the previously affected Lounge/Tenant route and the User Management page.

## Preservation

### Unchanged business/data implementation

- `assets/lounge-planning-v29.js` is unchanged from P29.
- P29 Lounge/Tenant service-type resolution is preserved.
- P29 single-price compatibility is preserved.
- P29 multi-period pricing is preserved.
- P29 CSV contract is preserved.
- P29 invalid-data handling is preserved.
- No production Firestore writes were performed during this implementation/validation.

### P22 / P23 / P24

The approved navigation architecture, Planning Workspace structure, Dashboard layouts, and P24 visual language were not redesigned or restructured.

One necessary P26 exception exists in `assets/portal-shell.js`: its local `dashboardPOV()` resolver previously mapped legacy `Admin` to the Super Admin POV. That mapping was removed so `role = Admin` cannot fail open to Super Admin. This is a targeted authorization/identity correction required by P26, not a navigation redesign.

`planning-workspace.html` was only extended with the shared P30 overlay script reference; its P23 structure and behavior were not changed.

### Firebase / backend

- Firebase SDK architecture unchanged.
- Firebase Authentication remains the credential authority.
- Firestore remains the profile/data authority.
- Existing collections and identifiers are retained.
- No destructive migration occurred.
- Netlify Functions remain the secure privileged-account boundary.
- Backend changes are limited to P26 account-management validation, permission/scope enforcement, role protection, access metadata, listing scope, and secure reset-password authorization.

### Package dependencies

`package.json` and `package-lock.json` are unchanged from the P29 baseline. `npm install --package-lock-only --ignore-scripts --offline` completed successfully.

## Validation

### Code validation

PASS:

- JavaScript syntax checks for P26/P28/P30 modules
- JavaScript syntax checks for modified Netlify Functions
- Role → Dashboard POV isolation test
- P26 Form ↔ CSV contract static test
- P26/P28/P30 static contract test
- P29 lounge-planning regression test
- Existing regression audit
- package verification

### Build validation

PASS:

```text
PACKAGE_VERIFY_PASS
REGRESSION_AUDIT_PASS
P29_LOUNGE_PLANNING_PASS
```

### Runtime validation

Development preview returned HTTP 200 for:

- `admin.html`
- `index.html`
- `service-planning.html`
- `planning-workspace.html`
- `lounge-list.html`
- `branch-office-planning.html`
- `gaso-planning.html`
- `planning-documents.html`

Local production-style preview returned HTTP 200 for the principal same routes.

HTTP 200 is treated only as route availability, not UI proof.

### User Management validation

Static/isolated validation confirms:

- Super Admin creation → blocked
- Admin without User Management permission → blocked
- legacy Admin target role creation → blocked
- valid Management create request reaches the secure creation path
- existing Super Admin update → blocked
- protected role is not a normal Add User option
- legacy Admin does not map to Super Admin POV
- legacy user data remains renderable through defensive defaults
- CSV Super Admin attempts are invalid
- duplicate email/username checks occur before import commit and are rechecked server-side

### Page identity validation

PASS for registry uniqueness and required identities:

- Journey & Touch Point → `journey-touchpoint`
- Account & Access Management → `account-access-management`

No shared pageId exists between registered pages.

### Modal / overlay validation

Code-level validation confirms:

- overlay reparenting to `document.body`
- viewport-fixed positioning
- layer above shell
- internal modal scrolling
- body scroll lock
- focus entry/restoration
- keyboard focus containment
- P26 modal coverage
- P29 Lounge/Tenant modal coverage

### Browser visual validation

NOT CLAIMED as PASS.

Chromium is installed in the environment, but the headless browser attempt timed out/hung before a usable DOM/screenshot validation result was produced. Therefore no browser-level visual click-through or pixel-level modal inspection is reported as successful.

No production credentials or production Firebase data were used during this validation attempt.
