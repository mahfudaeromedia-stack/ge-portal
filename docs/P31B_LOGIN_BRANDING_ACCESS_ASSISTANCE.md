# P31B — Login Branding & Access Assistance

## Scope

This controlled correction updates only the user-facing login presentation and adds a password-free Access Assistance Request path.

## Login

- Restored the existing Garuda Indonesia corporate image asset: `assets/garuda-indonesia.png`.
- Preserved the existing Danantara Indonesia image asset: `assets/danantara.png`.
- Removed technical implementation details from the visible login copy.
- Login remains limited to Username / Email, Password, Masuk, and Lupa password?.

## Access Assistance Request

`Lupa password?` opens a simple account-access assistance form. It does not authenticate, reset, reveal, or replace a password and never sends a password to the server.

The request is submitted to `/api/access-assistance-request`, which is backed by `netlify/functions/access-assistance-request.js` and uses the existing server-side Firebase Admin/Firestore infrastructure.

Requests are persisted only after an authorized recipient set is resolved. Recipients are existing Super Admin users plus existing legacy Admin users who have User Management permission. The stored request contains the supplied identifier, optional reason, recipient user IDs/roles, status, timestamp, and source. No password is stored.

The client displays a success message only after the backend confirms the Firestore write. Backend failure produces an error instead.

## Preservation

- Firebase Authentication flow unchanged.
- Existing Session Profile implementation unchanged.
- Production Firestore user documents unchanged.
- Firestore Security Rules unchanged.
- Admin != Super Admin unchanged.
- P26/P28/P29/P30 unchanged.
- Dashboard and portal shell unchanged.
