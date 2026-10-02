# User Import Canonical Format

User import is designed for privileged administrators only.

## Canonical columns

```text
Username
Email
Full Name
Role
Station
Temporary Password
Status
```

Optional aliases accepted by the importer can be mapped explicitly, but the canonical names above are the contract.

## Rules

- Only Admin and Super Admin may run the import.
- `Temporary Password` is required for each row in the secure import flow.
- Passwords are sent only to the server-side Firebase Authentication workflow.
- The uploaded file must remain in the administrator's local browser flow and must not be uploaded to public storage.
- Do not put passwords into application logs, audit records, Firestore profiles, or exported audit files.
- Each successful user profile has `mustChangePassword: true`.
- `Username` is normalized to lowercase and must be unique.
- `Email` must be unique in Firebase Authentication.
- Admin cannot import a `Super Admin` row.
- A row that fails validation must not be reported as successfully created.
- The import operation must use the same compensation logic as single-user creation.

If a future business rule allows blank passwords, generate a cryptographically secure temporary credential in the privileged browser/server workflow and expose it only once to the authorized administrator; never persist it.
