# R10.20 Root-Cause-First Audit — Final Report

## Root causes found

1. **Authentication was localStorage-based**, not Firebase Authentication.
2. **User passwords were stored in plaintext** in `assets/data.js` and the old account editor.
3. **The login page contained default credentials**.
4. **Browser-supplied role/session data was trusted for account-management UI**.
5. **There was no temporary-password lifecycle** (`mustChangePassword` did not exist).
6. **There was no server-side user-create compensation** when a profile write failed after Auth creation.
7. **There was no server-side password-reset workflow**.
8. **User edits were local-only**, so Firebase Auth/profile state could diverge.
9. **Audit records were local-only for account management** and lacked the required security-sensitive action taxonomy.
10. **Firebase/Netlify integration prerequisites were undocumented in executable form**.

## Fixes implemented

- Firebase Authentication is now the password authority.
- Netlify Functions provide server-side login, session verification, create-user, update-user, reset-password, change-password, and user-list workflows.
- Admin/Super Admin can explicitly enter:
  - Temporary Password
  - Confirm Temporary Password
- Admin cannot create/promote a Super Admin.
- Password validation is server-side.
- `mustChangePassword=true` is written on create/reset.
- First login is forced to `change-password.html`.
- Successful password change sets `mustChangePassword=false`.
- Temporary/password values are not stored in Firestore, audit logs, API success payloads, or source data.
- Auth creation is compensated by deleting the Auth user if the Firestore profile/index transaction fails.
- Username uniqueness uses `usernameIndex/{normalizedUsername}`.
- User profile + username index are created in a Firestore transaction.
- User update rolls Firebase Auth status/display-name back if the Firestore transaction fails.
- Audit actions include:
  - `CREATE_USER`
  - `RESET_PASSWORD`
  - `DISABLE_USER`
  - `ENABLE_USER`
  - `CHANGE_ROLE`
  - `CHANGE_SCOPE`
  - `CHANGE_PASSWORD`
- Session verification refreshes the browser profile from the server so browser role tampering is not authoritative for privileged operations.
- Netlify `/api/*` routing was added.
- Firebase-only Firestore rules were added for the server-managed user/audit collections.
- Plaintext demo passwords were removed from source data.
- Regression tests and data-shape tests were added.

## Required deployment configuration

Set these Netlify environment variables:

- `FIREBASE_WEB_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

or the equivalent three-field service-account variables documented in `README.md`.

Enable Firebase Authentication → Email/Password.

Do not commit service-account credentials.

## Requested user/password result

| Check | Result |
|---|---|
| Admin can create user | PASS — server workflow implemented |
| Super Admin can create user | PASS — server workflow implemented |
| Temporary password input | PASS |
| Password validation | PASS |
| `mustChangePassword` | PASS |
| Forced password change | PASS |
| Password never stored in Firestore | PASS — code path |
| Password never logged | PASS — code path |
| Reset password | PASS — server workflow implemented |
| Role escalation protection | PASS — server-side |
| Auth → Firestore atomicity/compensation | PASS — Auth rollback on profile/index failure |
| Duplicate username protection | PASS |
| Duplicate email protection | PASS |
| Disable/enable account | PASS |
| Audit action taxonomy | PASS |
| Static JavaScript syntax | PASS |
| Data bootstrap shape | PASS |
| Duplicate initial data IDs | PASS |

## Regression tests executed

- `node tests/regression-audit.js` → `REGRESSION_AUDIT_PASS`
- `node --check` on all JavaScript files → `ALL_JS_SYNTAX_PASS`
- `assets/data.js` bootstrapped in Node VM → `DATA_BOOTSTRAP_PASS`
- Duplicate-ID scan for core data arrays → `DATA_DUPLICATE_ID_PASS`
- Static asset reference scan → one dynamic template expression in `cx-import.html` (`${u}`), not a missing physical asset.

## Important production gate

The package now has the Firebase user-management implementation, but a live Firebase project was not available inside the uploaded ZIP, so a real credentialed Firebase Authentication/Firestore integration test could not be honestly executed.

The portal's broader business dataset is still the existing `localStorage` architecture. This audit did **not** silently migrate business data to Firestore because that would risk changing existing collections, document IDs, schemas, and production data. A full multi-user server-authorized business-data migration remains a separate migration project.

Therefore the correct final deployment state is:

**Code-ready for GitHub → Netlify + Firebase after environment configuration, with live Firebase acceptance testing required before production.**
