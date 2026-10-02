# P31 — Authentication & Legacy User Compatibility Report

## Scope

P31 is an emergency, controlled authentication correction based only on the latest **P26 + P28 + P30** package. It does not rebuild or redesign the portal.

Frozen areas remain frozen: P22 navigation, P23 planning consolidation, P24 portal UI consistency, P29 Lounge/Tenant business/data logic, P26 User Management, P28 Page Identity Isolation, P30 Overlay/Modal integrity, Dashboard POV layouts, Header, Sidebar, Planning, Lounge/Tenant, pricing, CSV, and Account Management UI.

## AUTH ROOT CAUSE

### Failing stage

The failing point was **after Firebase Authentication**, during the Firestore user-profile lookup.

Pipeline in the affected package:

`Login Form → gxAuthenticate() → GXFirebase.signInWithUsername() → signInWithEmail() → Firebase signInWithEmailAndPassword() → profile(uid) → Firestore users/{uid} read`

`assets/firebase-client.js` performed the final profile read directly from the browser.

The package's `firestore.rules` simultaneously contains:

`match /users/{uid} { allow read, write: if false; }`

Therefore a successful Firebase credential check was followed by a denied client-side profile read. The login UI already had a `PROFILE_ACCESS_DENIED` path, which is consistent with this failure mode.

### Firebase Authentication itself

The source and runtime harness confirm that the intended Email + Password path reaches `signInWithEmailAndPassword()` before the profile lookup. A live production credential test could not be performed in the execution environment because no production password/credential was supplied and browser authentication could not be completed interactively.

Accordingly, this report does **not** claim a live production Firebase credential PASS. It identifies and fixes the deterministic post-authentication defect in the package.

### P26/P28/P30 attribution

Evidence does **not** support claiming that P28 or P30 directly broke Firebase Authentication.

- **P28:** only page identity/configuration code; it is not part of the login pipeline.
- **P30:** overlay code was not required by login. It was removed from `login.html` as a defensive isolation measure; P30 remains active on portal pages.
- **P26:** introduced the server-side User Management/authentication support and the security boundary in which user profiles are handled through Netlify Functions, but the login client continued using the incompatible browser-side `users/{uid}` lookup. P31 closes that integration gap.

### portal-shell.js

The P26 change in `assets/portal-shell.js` remains:

- `Super Admin` / `superadmin` → `superadmin`
- legacy `Admin` → `unresolved`

It was **not** the cause of Firebase credential failure and was not reverted. This preserves `Admin != Super Admin`.

## AUTH FIX

### Files changed

1. `assets/firebase-client.js`
   - Keeps Firebase `signInWithEmailAndPassword()` as the primary credential check.
   - Replaces the browser-side `users/{uid}` profile read with the existing authenticated `GET /api/auth-session` path.
   - Uses the Firebase ID token only as a bearer credential for that server request; it is never logged by diagnostics.
   - Adds safe development-only authentication tracing.
   - Adds in-memory compatibility normalization for missing legacy fields.
   - Missing `accessLevel` defaults to `Viewer`, except `Super Admin` compatibility defaults to `Admin`.
   - Missing `permissions` defaults to an empty list.
   - Missing scope metadata does not create elevated access.
   - Unknown/legacy role gets `authorizationState: REVIEW_REQUIRED`.

2. `netlify/functions/auth-session.js`
   - Continues server-side Firebase Admin token verification and `users/{uid}` lookup.
   - Distinguishes `PROFILE_NOT_FOUND` from `ACCOUNT_INACTIVE`.
   - Missing status remains treated as active for legacy compatibility; only an explicit inactive value blocks the account.

3. `assets/auth.js`
   - Legacy Admin authorization now fails closed when permission/tab metadata is absent.
   - Admin no longer receives implicit ALL permissions from role alone.
   - Admin no longer receives unrestricted scope merely because its legacy role string is `Admin`.
   - Unresolved role is allowed to remain on the existing Dashboard surface so it cannot create a login/portal redirect loop; Dashboard POV remains unresolved and limited.
   - Adds safe development-only session/authorization diagnostics.

4. `login.html`
   - Adds controlled user-facing messages for missing profile/session failures.
   - Adds safe development session/redirect tracing.
   - Removes only `overlay-v30.js` from the login page; P30 remains on portal pages.
   - Login branding/layout/form structure is unchanged.

5. `tests/p31-authentication.js`
   - New P31 authentication contract/regression checks.

6. `tests/p31-auth-role-runtime.js`
   - New role → Dashboard POV runtime checks.

7. `package.json`
   - Build now includes the P31 authentication contract and role/POV tests.

8. Documentation
   - `docs/P31_AUTHENTICATION_REPORT.md`
   - `docs/REFACTOR_CHANGELOG.md`

### Production Firestore

**No production Firestore data was modified.**

No user documents, roles, scope, tabs, airports, loungeIds, permissions, or password fields were mass-edited or migrated.

### Password storage

No plaintext password storage was introduced. P26 temporary-password behavior remains server-side through Firebase Authentication and is not persisted in Firestore.

## COMPATIBILITY

| Existing account structure | Expected handling |
|---|---|
| Super Admin | Firebase authentication succeeds; role resolves to `superadmin` Dashboard POV. Existing record is not modified. |
| Management | Role resolves to `management` Dashboard POV. Access Level remains independent; `Admin` Access Level does not become Super Admin. |
| Head Office / HeadOffice | Resolves to `ge-team` Dashboard POV. Access Level remains independent. |
| Branch Office / BranchOffice | Resolves to `branch` Dashboard POV and preserves `airports[]` station scope. No CGK default is introduced. |
| Legacy `role = Admin` | Authentication is not converted to Super Admin. Dashboard POV is `unresolved`; missing permissions do not imply ALL. Account remains in a controlled limited/review state. |
| Missing `accessLevel` | In-memory default is Viewer, except Super Admin compatibility. Never escalates to Admin for ordinary roles. |
| Missing `permissions` | Empty in-memory list; never ALL. |
| Missing `tabs` | Empty in-memory list; no elevated fallback. |
| Missing `scopeType` | Safe `CUSTOM` normalization in memory; existing `airports[]`/`loungeIds[]` remain preserved. |
| Missing `organizationType` | Not required for authentication/session creation. |
| Missing `mustChangePassword` | Does not block login. |

## VALIDATION

### Authentication pipeline

- Firebase `signInWithEmailAndPassword()` path present: **PASS (static/runtime harness)**
- Firebase authentication error mapping retained: **PASS**
- Post-auth profile lookup moved to `/api/auth-session`: **PASS**
- Authenticated UID carried to server lookup: **PASS**
- Profile lookup server-side through Firebase Admin: **PASS (static contract)**
- Missing profile distinguished: **PASS**
- Inactive account distinguished: **PASS**
- Session normalization: **PASS (runtime harness)**
- Role → Dashboard POV: **PASS (runtime harness)**
- Management + Admin Access Level → Management POV: **PASS**
- Head Office + Admin Access Level → GE Team POV: **PASS**
- Branch Office + Admin Access Level → Branch POV: **PASS**
- Legacy Admin → not Super Admin: **PASS**
- Redirect loop protection for unresolved role: **PASS (static contract)**
- P30 not involved in login initialization: **PASS**
- P28 not involved in login initialization: **PASS**

### Package/build

`npm install --package-lock-only --ignore-scripts --offline`: **PASS**

`package-lock.json`: unchanged by the P31 package-script update.

`npm run build`: **PASS**

Build output:

- `PACKAGE_VERIFY_PASS`
- `REGRESSION_AUDIT_PASS`
- `P29_LOUNGE_PLANNING_PASS`
- `P31_AUTHENTICATION_CONTRACT_PASS`
- `P31_ROLE_POV_RUNTIME_PASS`

### Local preview

HTTP 200 verified for:

- `login.html`
- `index.html`
- `admin.html`
- `service-planning.html`
- `lounge-list.html`
- `planning-workspace.html`

HTTP 200 is route validation only; it is not a browser authentication PASS.

### Browser validation

**NOT CLAIMED PASS.**

The execution environment previously could not complete a usable Chromium headless session; the process hung/timed out before reliable DOM/screenshot validation. Therefore the final real-browser login test remains the user's required validation point.

## PRESERVATION CHECKS

- P29 `assets/lounge-planning-v29.js`: unchanged.
- P29 Dashboard implementation: unchanged.
- P26 User Management implementation remains present.
- P28 Page Identity implementation remains present.
- P30 Overlay implementation remains present on portal pages.
- Firebase configuration remains present; no project/credential configuration was changed.
- Firestore rules remain unchanged; user profiles remain server-only.
- No production Firestore data was touched.
- `Admin != Super Admin` remains enforced.
