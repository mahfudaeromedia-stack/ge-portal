# P31A — Session Profile Service Correction

## Scope

Emergency post-authentication correction only. P26, P28, P30, P29, P24, P23 and P22 remain frozen.

## Confirmed failure

The browser confirms Firebase Email/Password Authentication accepts the credentials. The failure occurs when the client calls the post-authentication Session Profile endpoint:

`GET /api/auth-session` → `/.netlify/functions/auth-session`

The client maps a non-JSON/network/service response to the message shown by the browser.

## Root cause

The Session Profile implementation depends on `firebase-admin`, declared only in `netlify/functions/package.json`. The project root `package.json` does not declare it, and the Netlify build command was only `npm run build`. Netlify documentation states that function dependencies should be provided from the site base-directory `package.json`; nested function folders are not recursively dependency-installed automatically. Therefore the deployed `auth-session` function could be present while its `require('./_firebase')` dependency chain could not reliably resolve `firebase-admin`, causing the session endpoint to be unavailable after Firebase Authentication succeeded.

This is a deployment/runtime dependency packaging defect, not a Firebase credential defect, Firestore data defect, role-model defect, P28 defect, or P30 overlay defect.

## Fix

`netlify.toml` build command now explicitly installs the existing function dependency manifest before the normal verification/build command:

```text
npm --prefix netlify/functions install --omit=dev --ignore-scripts && npm run build
```

No new authentication service was created. `auth-session.js` continues to use Firebase Admin to verify the already-authenticated Firebase ID token and read the existing `users/{uid}` document server-side.

## Preservation

- Firebase Authentication: unchanged.
- Production Firestore data: unchanged.
- Firestore users read rule: unchanged/server-only.
- Admin ≠ SuperAdmin: unchanged.
- P26 User Management: unchanged.
- P28 Page Identity: unchanged.
- P30 Overlay: unchanged.
- P29 Lounge/Tenant logic: unchanged.
- Dashboard layouts: unchanged.

## Validation

- `P31A_SESSION_PROFILE_SERVICE_PASS`: passed.
- Syntax checks for affected JavaScript: passed.
- Full production build in this execution environment is not claimed because package installation requires network access and the environment previously timed out on npm installation.
- Real-browser authentication/session validation remains the final validation after deployment.

## External technical basis

Netlify's current Functions documentation states that function dependencies should be specified in the top-level/base-directory `package.json`, and its CLI guidance states that dependencies placed in individual function folders require an explicit deployment-time installation step.
