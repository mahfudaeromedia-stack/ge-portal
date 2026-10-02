# P27 — Profile & Account Self-Service

Baseline: `Ground_Experience_Garuda_Indonesia_R10_20_P33_P34_P35_P36_P37_PRESENTATION_STABILIZATION.zip`

Status: **LOCAL IMPLEMENTATION + CONTRACT VALIDATION COMPLETE; PRODUCTION VALIDATION PENDING**

P27 is an additive self-service layer. The approved Authentication / Session Profile foundation was not rebuilt or refactored.

## PROFILE

### Page

- Route: `profile.html`
- Stable pageId: `profile`
- Page title: `Profile` / self-service Profile context
- Entry point: existing Header Avatar → Profile
- No new Sidebar Profile entry was added.
- No new Avatar dropdown or triangle was introduced.

### Displayed information

The page is organized into:

1. Personal Information
2. Organization
3. Account Access
4. Data Scope
5. My Access
6. Password & Account Security

Displayed fields include, where available:

- Employee Name
- Employee Number
- Email
- Username
- Unit / Department
- Organization Type
- Role
- Access Level
- Scope Type
- Account Status
- Assigned Station(s)
- Assigned Lounge(s)
- readable module-access summary
- temporary-password lifecycle state

### Editable fields

Only `Employee Name` is self-editable in P27.

The update is validated client-side and server-side, then written through `auth-update-self-profile` using the authenticated Firebase UID. Firebase Authentication `displayName` is synchronized with the profile name so the authenticated identity presentation remains consistent.

### Read-only administrative fields

The following remain read-only in self-service:

- Employee Number
- Email
- Username
- Role
- Access Level
- Scope Type
- Assigned Station(s)
- Assigned Lounge(s)
- Permissions / Module Access
- Account Status
- Organization Type
- Unit / Department

No username or email change flow was introduced because existing login resolution and Auth/Firestore synchronization would make an unsafe partial update possible.

## ACCESS SUMMARY

The Profile page separates Role from Access Level.

- `Super Admin` remains a protected Role.
- `Admin` as Access Level is displayed independently.
- Legacy `role = Admin` is displayed as `Admin (legacy)` and can enter a `Requires Review` / `Legacy Account Configuration` presentation state.
- Scope is presented as business labels such as All Area, Station, Multiple Stations, Lounge, Airport, or Custom / Review.
- Station and Lounge identifiers are rendered as business-facing values where the existing local reference data can resolve them.
- Raw `tabs[]`, raw `airports[]`, raw `permissions` JSON, and implementation-level authorization structures are not exposed as the normal Profile UI.

## LEGACY USER COMPATIBILITY

Profile rendering tolerates:

- missing `accessLevel`
- missing `organizationType`
- missing `scopeType`
- missing `assignedStations`
- missing `assignedLounges`
- legacy `airports[]`
- legacy `loungeIds[]`
- missing `permissions`
- missing `tabs[]`
- missing `mustChangePassword`
- legacy Role values

No automatic user migration occurs when Profile loads.

A legacy/incomplete profile is presented for review rather than being elevated to a privileged role.

## CHANGE PASSWORD

### Implementation

`change-password.html` uses the existing Firebase Authentication client runtime and the browser's Firebase Auth credential APIs:

`Current Password → EmailAuthProvider credential → reauthenticateWithCredential() → updatePassword()`

No second password system was introduced.

The server is used only for authenticated lifecycle metadata completion after the Firebase password update; it never receives the current password.

### Reauthentication

The current authenticated Firebase user's email is used to create an `EmailAuthProvider` credential with the entered current password. Firebase performs the credential verification.

If Firebase requires recent authentication, the user receives a recoverable reauthentication message.

### Validation and errors

The UI handles:

- empty current password
- weak/invalid new password
- minimum/maximum length
- whitespace restriction
- password equal to username/email
- confirmation mismatch
- incorrect current password
- recent-authentication requirement
- disabled account
- network failure
- too many requests
- expired user token
- general password-update failure

Password values are never rendered after submit.

### Session behavior

A successful password change does not clear the authenticated Firebase session. The Profile session is refreshed from the existing Session Profile service after success.

No Role, Access Level, Scope, Permission, or Dashboard POV change is performed.

## TEMPORARY PASSWORD LIFECYCLE

The existing P26 lifecycle remains intact:

`Admin creates user → Firebase Authentication temporary password → Firestore mustChangePassword=true → user can change password`

P27 does not store the temporary password in Firestore.

A successful P27 password change clears `mustChangePassword` through the authenticated `auth-complete-password-change` endpoint after the Firebase password update and recent-authentication verification.

### First-login enforcement decision

**Mandatory first-login enforcement was not added.**

The existing architecture already has `mustChangePassword` metadata on newly created/reset accounts, but forcing a redirect/restricted login step would require changing the hard-frozen Authentication / login pipeline. P27 therefore keeps the working login behavior intact and provides a clear self-service Change Password path plus lifecycle state presentation.

Existing users without `mustChangePassword` are not blocked.

## SECURITY

### Self-only access

Profile reads use the authenticated Firebase user through the existing `currentProfile()` service.

Profile writes do not accept a user UID, email, username, query parameter, or route parameter as the identity proof. The server derives the target profile from the verified Firebase ID token:

`users/{decoded.uid}`

### Administrative field protection

The self-service endpoint accepts only:

`fullName`

Attempts to submit Role, Access Level, Scope, Station, Lounge, Permission, Status, Employee Number, Email, or Username fields are rejected.

### Password protection

- Firebase Authentication remains the credential authority.
- Firestore never stores a current password.
- Firestore never stores a temporary password plaintext.
- Firestore never stores password history plaintext.
- Firebase ID/refresh tokens are not stored by the P27 layer.
- Passwords are not written to audit logs.

## FIRESTORE IMPACT REPORT

### Fields read

P27 server profile operations read the authenticated user's existing `users/{uid}` document, including existing compatible profile metadata such as:

- name
- username
- email
- employeeNo
- role
- accessLevel
- organizationType
- unit
- scopeType
- airports
- loungeIds
- tabs
- permissions
- status
- mustChangePassword
- existing timestamps

### Fields written

Self profile update:

- `name`
- `updatedAt`

Password lifecycle completion:

- `mustChangePassword: false`
- `updatedAt`

Audit entries are appended to the existing `auditLogs` collection for:

- `UPDATE_SELF_PROFILE`
- `COMPLETE_PASSWORD_LIFECYCLE`

No mass migration or bulk profile rewrite was performed.

## AUTHENTICATION PRESERVATION REPORT

The following approved foundation files were checksum-verified unchanged:

- `assets/auth.js`
- `assets/firebase-client.js`
- `netlify/functions/auth-session.js`
- `netlify/functions/auth-change-password.js`
- `netlify/functions/auth-reset-password.js`
- `assets/portal-shell.js`
- `netlify/functions/_firebase.js`

Also preserved unchanged:

- `assets/lounge-planning-v29.js`
- `assets/overlay-v30.js`
- `assets/access-assistance-p32.js`

No Authentication initialization, login pipeline, Session Profile service, Role resolver, Access Level resolver, Scope resolver, Permission resolver, or Dashboard POV resolver was refactored.

The existing P31/P31A contract tests continue to pass.

## REGRESSION REPORT

- Dashboard: unchanged by P27.
- Planning: unchanged by P27.
- P29 Lounge/Tenant logic: unchanged.
- P30 Overlay foundation: unchanged.
- P32 Access Assistance: unchanged.
- P33–P37 presentation layer: unchanged.
- Header / Sidebar / Footer shell implementation: unchanged.
- P26 Account & Access Management: unchanged.
- Firebase login/session foundation: unchanged.

## VALIDATION REPORT

### CODE VALIDATION

PASS

- `node --check assets/profile-p27.js`
- `node --check assets/password-p27.js`
- `node --check netlify/functions/auth-update-self-profile.js`
- `node --check netlify/functions/auth-complete-password-change.js`
- `node --check tests/p27-profile-self-service.js`

### BUILD VALIDATION

PASS

`npm run build` returned:

- `PACKAGE_VERIFY_PASS`
- `REGRESSION_AUDIT_PASS`
- `P29_LOUNGE_PLANNING_PASS`
- `P31_AUTHENTICATION_CONTRACT_PASS`
- `P31_ROLE_POV_RUNTIME_PASS`
- `P31A_SESSION_PROFILE_SERVICE_PASS`
- `P31B_LOGIN_ACCESS_ASSISTANCE_PASS`
- `P32_ACCESS_ASSISTANCE_ADMIN_PASS`
- `P32_ACCESS_ASSISTANCE_RUNTIME_PASS`
- `P33_P34_P35_P36_P37_PRESENTATION_CONTRACT_PASS`
- `P27_PROFILE_SELF_SERVICE_CONTRACT_PASS`

### AUTH CONTRACT REGRESSION

PASS

Frozen Authentication / Session Profile checks and SHA-256 checksums passed.

### PROFILE VALIDATION

PASS at contract/direct-code level.

Validated:

- stable Profile page identity
- self-only server UID derivation
- safe editable field restriction
- access summary rendering
- legacy review handling
- Role vs Access Level separation
- station/lounge scope presentation
- module permission presentation

### PASSWORD CHANGE VALIDATION

PASS at contract/direct-code level.

Validated:

- current-password reauthentication path
- Firebase `updatePassword()` path
- password validation
- Firebase error mapping
- session preservation path
- lifecycle completion endpoint
- no password persistence in Firestore

No real production credentials were used in test artifacts.

### LEGACY USER VALIDATION

PASS at direct-code level.

Representative cases include:

- legacy `role = Admin`
- missing access metadata
- missing permissions/tabs
- legacy station/lounge fields

Legacy Admin does not become Super Admin.

### SECURITY VALIDATION

PASS at static/contract level.

Verified:

- authenticated token verification
- UID derived from verified token
- no client-supplied UID for self-profile write
- only `fullName` accepted by self-profile endpoint
- administrative access fields are not accepted
- email/username remain read-only
- no plaintext password storage

### LOCAL PREVIEW

PASS for HTTP serving/static asset availability.

Local production-style preview returned HTTP 200 for:

- `profile.html`
- `change-password.html`
- `login.html`
- `index.html`
- `admin.html`
- `service-planning.html`

P27 assets also returned HTTP 200.

HTTP 200 is not treated as browser/UI PASS.

### BROWSER VISUAL VALIDATION

NOT PASS / DEFERRED.

Chromium headless was attempted against the local Profile page but timed out in the current environment before producing DOM output. No browser visual PASS is claimed.

### PRODUCTION VALIDATION

**PENDING**.

No Netlify deployment was performed for P27, in accordance with the low-credit/local-first instruction. Production acceptance remains separate from local code/build validation.

## FINAL LOCK

P27 is implemented and locally validated.

Authentication, Session Profile, login, Role/Access/Scope/Permissions, Dashboard POV, P22–P24, P29, P30, P31, P32, and P33–P37 remain frozen.

After P27, implementation stops as requested.
