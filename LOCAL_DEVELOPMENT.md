# P38 Local Development — Production-Parity Workflow

## Quick start

Prerequisites:

- Node.js 20+ for the portal/build and Netlify Functions.
- Netlify CLI for `netlify dev`. The current Netlify CLI release requires Node.js 22.13+; this is a **developer-tool prerequisite**, not a change to the portal's Node 20 Functions runtime.
- Access to the existing Firebase project for authenticated testing.
- Authorized test credentials supplied by the tester; never commit them.

Install the Netlify CLI globally (or use an already-installed compatible CLI):

```bash
npm install -g netlify-cli
```

Then from the repository root:

```bash
npm install
npm run dev
```

Netlify Dev serves the static site and proxies `/api/*` / Netlify Functions through the same `netlify.toml` configuration used for deployment. The configured local URL is:

**http://localhost:8888/**

Open `login.html` through that local origin and use the normal Firebase login. There is no local authentication bypass.

## Local Netlify Functions

`netlify.toml` keeps the existing Functions directory:

```text
netlify/functions
```

Netlify Dev detects those functions and exposes them through the local Netlify runtime. The existing frontend `/api/...` URLs remain unchanged. The `/api/*` redirect in `netlify.toml` is also retained for production parity.

Representative routes include:

- `/api/auth-session`
- `/api/auth-change-password`
- `/api/auth-reset-password`
- `/api/auth-update-self-profile`
- `/api/auth-complete-password-change`
- `/api/access-assistance-request`
- `/api/access-assistance-admin`
- existing account-management functions

P38 does not rewrite those functions.

## Environment variables

The current server-side Functions code reads:

- `FIREBASE_SERVICE_ACCOUNT_JSON`
- **or** `FIREBASE_PROJECT_ID`
- **and** `FIREBASE_CLIENT_EMAIL`
- **and** `FIREBASE_PRIVATE_KEY`
- `FIREBASE_WEB_API_KEY`

`FIREBASE_WEB_API_KEY` is used by the existing server-side username/email login compatibility function. Browser Firebase configuration remains in `assets/firebase-config.js` because the Firebase Web SDK configuration is client configuration, not a service-account credential.

Use `.env.example` only as a variable-name template. Never put real secrets into that file or source control.

Netlify Dev can use local environment values and Netlify's development context. Do not run `netlify env:get` or similar commands with output redirected into committed files.

## Netlify project linking

A linked Netlify site is useful when development environment variables are managed through Netlify. Linking is local project state and should not be committed. If the site is already linked, run `npm run dev` normally. If it is not linked, the project can still be configured with local environment variables as supported by Netlify CLI.

Do not commit a Netlify personal access token, site token, or machine-specific site state.

## Firebase / Firestore safety

This is **production-parity**, not a fake or automatically sandboxed environment.

If the configured Firebase credentials point to the production Firebase project, local authenticated reads/writes use that same project. Local development therefore does **not** mean local data isolation.

Do not run destructive integration tests automatically.

### Read-only routine checks

- Login and session/profile retrieval.
- Dashboard POV and authorization display.
- Profile rendering.
- Access summary rendering.
- Planning page loading.
- Table/status/page-identity/footer presentation.
- Function availability checks that do not mutate data.

### Potential-write actions — perform deliberately only

- Profile name update.
- Password change.
- Password lifecycle completion.
- Access Assistance request creation.
- User creation/update/status changes.
- Planning/import/CRUD actions.
- Any operation that changes Firestore data.

P38 automation does not create users, change passwords, create Access Assistance records, or perform destructive Firestore tests.

## Build and verification

```bash
npm run build
npm run verify:repo
```

`npm run build` retains the existing regression chain and adds the P38 repository-hygiene gate. No historical P31/P32/P33-P37/P27 gates were removed.

The existing dependency ownership is preserved: the root package has no runtime application dependency, while `firebase-admin` remains in `netlify/functions/package.json`.

## Deployment artifact

Generate the reproducible Netlify source/deployment artifact with:

```bash
npm run package:deploy
```

Output:

```text
artifacts/netlify-deploy/
```

The artifact is generated from the canonical repository. It is not a second source tree and is excluded from Git through `.gitignore`.

It intentionally excludes repository documentation and handoff-only startup files while retaining HTML, assets, templates, Netlify Functions, Netlify configuration, build metadata, Firebase rules/configuration, and the tests/tools required by the existing Netlify build command.

No `node_modules` directory is packaged.

## GitHub repository

The repository root is the canonical development source. Commit:

- HTML source
- `assets/`
- `netlify/functions/`
- `templates/`
- `tests/`
- `tools/`
- `netlify.toml`
- `package.json`
- `package-lock.json`
- Firebase configuration/rules
- useful documentation

Do not commit:

- `node_modules/`
- `.netlify/`
- `.env` / local environment files
- service-account JSON/private keys
- coverage/log/temp output
- generated deployment artifacts
- prior ZIP packages

The project deliberately retains many historical phase reports because they document the approved implementation history. They are repository documentation, not runtime output.

## Troubleshooting

### `netlify: command not found`

Install a compatible Netlify CLI:

```bash
npm install -g netlify-cli
```

Current Netlify CLI releases require Node.js 22.13+ for the CLI itself. The portal Functions remain configured for Node 20.

### Port 8888 already in use

Stop the other process or invoke Netlify Dev with an alternate port:

```bash
netlify dev --port 8890
```

The `netlify.toml` default remains 8888.

### `/api/...` returns 404

Confirm that `npm run dev` is running through **Netlify Dev**, not the legacy static server. The static server remains available as `npm run dev:static` for static-only checks, but it does not provide Netlify Functions.

### Authentication succeeds but Session Profile fails

Check, in this order:

1. Netlify Dev is running.
2. `/api/auth-session` is being routed to the local Function.
3. Required Firebase Admin environment variables are available to the Functions runtime.
4. The authenticated Firebase user exists in the existing project.
5. The Firestore user profile exists and is active.

Do **not** modify `auth.js`, `firebase-client.js`, or the Session Profile implementation to work around a local runtime configuration issue.

### Firebase Admin credential unavailable

Set the existing server-side environment variables from `.env.example` or through the approved Netlify development environment. Never paste the service-account private key into source files.

### Browser cannot authenticate on localhost

Verify the Firebase Authentication authorized-domain configuration permits the local development origin being used. This is a Firebase project configuration check, not a reason to add a local auth bypass.

## Manual local acceptance

Use an authorized test account and record results manually.

### Login

- [ ] `http://localhost:8888/login.html` opens.
- [ ] Existing authorized user can log in.
- [ ] Firebase Authentication succeeds.
- [ ] Session Profile loads.
- [ ] Correct Dashboard POV appears.

### Dashboard / shell

- [ ] Correct POV by Role.
- [ ] Header and Sidebar intact.
- [ ] Notifications and Sign Out remain available.

### Planning

- [ ] Planning Overview.
- [ ] Planning Workspace.
- [ ] Lounge/Tenant.
- [ ] Branch Office Planning.
- [ ] GASO.
- [ ] Planning Documents.

### Profile / Account

- [ ] Avatar → Profile opens.
- [ ] Own account information displays.
- [ ] Administrative access fields are read-only.
- [ ] Authorized Account & Access page still opens where permitted.

### Security / password

- [ ] Change Password route opens.
- [ ] Reauthentication uses the current Firebase credential flow.
- [ ] No password is displayed after submission.
- [ ] Do not execute against a production account unless intentionally performing a manual test.

### P33–P37 presentation

- [ ] P33 table presentation remains present.
- [ ] `Covered` and `Follow-up` retain semantic presentation.
- [ ] Planning Overview cards retain their four destinations.
- [ ] Footer is not clipped by the Sidebar.

### P32

- [ ] Access Assistance remains available.
- [ ] Do not create test requests unless deliberately testing the live-connected workflow.

## Production deployment

P38 does **not** deploy automatically.

Production validation remains a separate step. The same canonical repository should later be deployed through the existing Netlify configuration. Use a Netlify Deploy Preview first when production validation is authorized.

## Production-parity limitation

The local runtime reproduces Netlify's local routing/functions environment, but it does not create a second Firebase project or automatically isolate Firestore. Authentication and Firestore behavior therefore still depend on the configured Firebase project and credentials. A Firebase Emulator Suite can be evaluated later as an optional safer integration-test environment; it is not introduced by P38.
