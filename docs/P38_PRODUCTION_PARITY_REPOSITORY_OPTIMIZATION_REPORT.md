# P38 — Production-Parity Local Development + Repository / Deployment Optimization

## Scope

P38 is tooling and repository hygiene only. The approved portal UI, business logic, Firebase/Firestore data model, Authentication foundation, Netlify Function business logic, and P22–P37 implementations remain frozen.

## P38A — Local development

The project now uses **Netlify Dev** as the local development runtime rather than the dependency-free static server as the primary `npm run dev` command. Netlify Dev is configured as a static site server with the existing `netlify/functions` directory and the existing `/api/*` redirect model.

- `npm run dev` → `netlify dev`
- Default local URL → `http://localhost:8888/`
- `npm run dev:static` remains available for static-only checks.
- No fake authentication, hardcoded role, test user, mock session, or Firebase bypass was added.
- Existing `/api/...` frontend paths remain unchanged.

Netlify's documented local development model provides local handling for redirects, headers, environment variables, and Netlify Functions.

## Environment audit

Server-side variables actually referenced by the current Functions source:

- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_WEB_API_KEY`

The existing `.env.example` was retained and remains values-only-free. Browser Firebase Web SDK configuration remains in `assets/firebase-config.js`; it is not a service-account secret.

No real secret was added.

## P38B — Repository audit

Baseline from the supplied P27 package:

- 194 files
- approximately 18 MB unpacked
- approximately 17 MB in `assets/`
- 14 documentation files
- 10 test files
- 19 template files
- 14 Netlify files including the Functions dependency manifest

No uncertain runtime source files were deleted. This is deliberate: P38 optimizes **deployment and generated artifact boundaries**, not source-file count for its own sake.

### Classification

| Category | Treatment |
|---|---|
| Required runtime source | Kept |
| Required Netlify Functions | Kept |
| Required configuration | Kept |
| Build metadata | Kept |
| Tests | Kept in canonical repository and deployment build source because `npm run build` executes them |
| Documentation | Kept in canonical repository; excluded from deployment artifact |
| Generated output | Excluded via `.gitignore` |
| Temporary/local state | Excluded via `.gitignore` |
| Historical reports | Kept as repository history; not runtime output |
| Duplicate/obsolete source | No safe deletions identified |
| Local-only state | Excluded via `.gitignore` |
| Delivery artifacts | Generated under `artifacts/`; excluded from Git |

## Git hygiene

`.gitignore` now also excludes common coverage/log/temp/OS/editor artifacts and generated `artifacts/` output while preserving `.env.example`.

No prior ZIP packages were present inside the supplied source package, and none are added.

## Deployment artifact

`npm run package:deploy` generates:

`artifacts/netlify-deploy/`

from the canonical source. It is not a separately maintained application source. It excludes repository-only documentation and handoff startup files while retaining the files needed for Netlify's existing build/deploy model.

No `node_modules` is packaged.

## Why the repository file count was not aggressively reduced

The baseline contains many physical HTML pages, modular JavaScript files, required browser libraries/assets, templates, tests, and historical documentation. Reference/duplicate auditing did not establish a safe set of runtime files that could be deleted or merged without risking behavior. P38 therefore avoids arbitrary file deletion and instead separates canonical development source from deployment output.

## Preservation

Critical frozen P27 files were compared byte-for-byte with the supplied P27 baseline. The following were unchanged:

- `assets/auth.js`
- `assets/firebase-client.js`
- `assets/portal-shell.js`
- `assets/dashboard-pov.js`
- `assets/lounge-planning-v29.js`
- `assets/overlay-v30.js`
- `assets/access-assistance-p32.js`
- `assets/profile-p27.js`
- `assets/password-p27.js`
- existing Authentication Functions
- `netlify/functions/_firebase.js`
- `firestore.rules`

No production Firestore data was accessed or modified by the P38 tooling.

## Validation limitation

This environment does not have Netlify CLI installed, and an attempt to obtain it with `npx` timed out. Therefore the actual Netlify Dev process and live local Function invocation could not be executed in this environment. P38 config/contract validation was performed locally; Netlify Dev browser/function runtime validation remains a manual step on a machine with a compatible Netlify CLI and approved Firebase environment variables.

Production deployment was not performed.
