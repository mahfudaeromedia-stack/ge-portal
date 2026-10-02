# Refactor Audit — R10.20

## Source-of-truth assessment

The ZIP is a static multi-page portal with 50+ HTML pages/assets, a shared JavaScript compatibility/data layer, browser-side Firebase Web SDK loading for authentication/profile and selected Firestore workflows, and Netlify Functions using Firebase Admin for managed-account operations.

The existing architecture is not a conventional bundled SPA. Moving the HTML pages into a framework or bundler would create unnecessary visual/behavioral risk, so this refactor preserves the architecture.

## Important findings

1. **Firebase is present and must be preserved.** `login.html` loads `firebase-config.js` and `firebase-client.js`; protected pages load the Firebase runtime through `assets/auth.js`. Netlify Functions use `firebase-admin`.
2. **Business data is still compatibility/localStorage-driven in many existing modules.** The existing `GE_V2_1_DATA` store must not be silently replaced with a Firestore migration. Firebase-backed initiative/access functionality already present remains intact.
3. **Root `firebase-admin` was misplaced.** It is imported only from `netlify/functions/_firebase.js`, so it was moved out of the root dependency manifest by removing the redundant root declaration. The Functions manifest remains unchanged.
4. **No `jwks-rsa` or `jose` usage was found.** They were not added and were not declared as dependencies.
5. **HTML script load order is heterogeneous and intentional.** Several versioned scripts are shared across many pages. They were not consolidated because doing so without browser-level regression testing could change initialization order or UI behavior.
6. **The site uses physical HTML routes, not SPA catch-all routing.** Existing Netlify routing only maps `/api/*` to Functions. Page URLs such as `/calendar.html` therefore remain direct static files.
7. **Firebase Web config is present in source.** It contains Web App identification fields, not the Admin service-account private key. Admin credentials remain environment-variable based in Netlify Functions.
8. **Local preview was missing as a standard npm workflow.** A dependency-free Node static server was added rather than introducing a new server dependency.

## Packaging decision

The safest packaging model is:

- repository root = static portal + zero npm runtime dependencies
- `netlify/functions` = isolated Node Functions dependency tree
- Firebase Web SDK = existing browser-side runtime loading
- Firestore/Auth = existing integrations and schemas
- Netlify = existing static publish model + Functions

This keeps deployment behavior close to the existing source while making local validation explicit.

## Verification limits

The following were statically verified in the provided source:

- JavaScript syntax for the application files.
- Existing regression test suite.
- Root `package.json` ↔ `package-lock.json` consistency.
- Local HTML asset references.
- Presence of Netlify/Firebase configuration.
- Presence of the Functions `firebase-admin` declaration.

The following could not be fully live-tested from this environment:

- credentialed Firebase Authentication/Firestore operations against the production project
- Netlify-hosted deployment
- installation of the Functions dependency tree, because the npm registry was unreachable (`EAI_AGAIN`)
- pixel-level browser screenshot comparison

Those remain deployment acceptance checks rather than reasons to alter the existing architecture.
