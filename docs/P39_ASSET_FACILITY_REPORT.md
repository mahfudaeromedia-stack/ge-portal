# P39 — Branch Office Asset & Facility Management

## 1. Audit decision

P39 audited the latest P38 source before introducing a new asset data source.

### Existing compatible capability found

The source already contains:

- `GECore` Station / Airport master context.
- `GEServiceLocation` Service Location hierarchy.
- Legacy Lounge Master records.
- `Station 360` aggregation of Station, Service Location, Readiness, Agreement and Customer Experience context.
- Existing `Station Material`, `Airport Systems`, `Branch Office Space`, Lounge/Tenant and Readiness modules.
- Existing Firebase Authentication + authenticated Netlify Functions.
- Existing server-side `users/{uid}` profile, role, access level and station-scope mechanism.
- Existing `auditLogs` collection.

The audit did **not** find an existing production Firestore Asset or Facility collection used by the current runtime. The existing Service Location / Core modules are primarily browser compatibility/local-storage architecture and are therefore not suitable as a shared multi-user production Asset source of truth.

### P39 decision

P39 extends the existing Station / Service Location concepts but introduces one production operational source of truth for the new domain through authenticated Netlify Functions:

- `geFacilities` — non-Lounge Ground Experience Service Facilities.
- `geAssets` — physical Ground Experience Assets.

Existing `lounges` records are referenced where available; P39 does not create a duplicate Lounge master.

No seed, mock, migration, reset, or production-data rewrite is performed by page load or deployment.

## 2. Domain separation

```text
Existing Lounge / Tenant Agreement
  = commercial / agreement / pricing domain

P39 Asset & Facility
  = physical operational domain

Station
  ↓
Existing Lounge OR P39 Service Facility
  ↓
P39 Asset
```

Asset lifecycle is independent of Agreement lifecycle.

No furniture/equipment is added to Agreement Price Schedule.

## 3. P39 data model

### `geFacilities/{facilityId}`

Minimum fields used by P39:

```js
{
  stationCode,
  name,
  facilityType,
  terminal,
  area,
  zone,
  operationalStatus,
  lifecycleStatus,
  remarks,
  createdAt,
  createdBy,
  updatedAt,
  updatedBy
}
```

`Lounge` is intentionally not created as a new `geFacilities` record. Existing Lounge Master records are used as the location reference.

### `geAssets/{assetId}`

```js
{
  stationCode,
  facilityType,
  facilityId,        // for P39 non-Lounge facilities
  loungeId,          // for an existing Lounge reference
  area,
  assetName,
  category,
  ownership,
  responsibleUnit,
  pic,
  trackingMode,      // INDIVIDUAL or QUANTITY
  assetTag,
  serialNumber,
  quantity,
  unit,
  condition,
  operationalStatus,
  acquisitionDate,
  installationDate,
  lastInspection,
  evidenceRef,
  remarks,
  lifecycleStatus,
  createdAt,
  createdBy,
  updatedAt,
  updatedBy
}
```

Individual tracking requires `assetTag`; quantity tracking does not force an individual serial identity.

## 4. Controlled taxonomy

P39 uses one JSON taxonomy source:

`assets/p39-asset-config.json`

It controls:

- Facility Types
- Ownership
- Asset Categories
- Conditions
- Operational Statuses
- Tracking Modes
- Units

The same configuration is consumed by the browser UI and server validation. Categories are not duplicated across multiple JavaScript files.

The taxonomy is intentionally additive and can later be connected to a configurable Master Data workflow if the existing portal introduces one for Asset classifications.

## 5. Authorization and scope

P39 does not change Authentication, Session Profile, Role, Access Level, Scope or Permissions architecture.

The new API:

1. verifies the existing Firebase ID token;
2. reads the existing Firestore user profile;
3. applies the existing account role/status context;
4. restricts station data to the actor's assigned `airports` when scope is not `ALL`;
5. permits mutation only for `Editor` / `Admin` Access Level, with `Super Admin` retained as the full-authority case.

`Viewer` cannot edit.

`Approver` is not automatically granted edit rights.

Branch Office users with station scope do not need to select arbitrary stations; the UI locks the permitted station when the session scope is `STATION`.

## 6. CRUD / lifecycle

Implemented:

- Add Asset
- Edit Asset
- Condition update through Asset Edit
- Operational Status update through Asset Edit
- Add Service Facility
- Edit Service Facility
- Retire Asset
- Asset detail view
- Update history from the existing `auditLogs` collection

Operational Assets are not hard-deleted by P39. Retire changes lifecycle/status while preserving the record.

## 7. Evidence / documents

P39 records an `evidenceRef` reference only.

No Firebase Storage dependency is introduced because P38 audit did not establish an active production Storage workflow for this domain. Existing document/file architecture is not replaced.

## 8. Readiness / Capability / Budget / Maintenance

P39 does not change existing Readiness formulas.

P39 does not duplicate Capability requirement definitions.

P39 does not create accounting depreciation or financial fixed-asset logic.

P39 does not create a full Maintenance Management System. Condition, Operational Status and remarks are sufficient for the initial operational scope.

Future integration points are documented rather than silently altering existing formulas or datasets.

## 9. CSV assessment

Asset CSV import is intentionally **not introduced in P39**.

The Asset model is now stable enough for a future controlled import, but a bulk import would add a second write path before the authenticated production workflow has received live acceptance testing. The recommended future pattern is the existing portal contract:

`Template → Upload → Normalize → Validate → Preview → Confirm → Result`

with the same canonical `geAssets` contract used by Manual Add/Edit.

## 10. Production-data safety

P39 tooling does not seed CGK, DPS, sample furniture, sample equipment, mock users or test assets.

No production Firestore records are migrated or rewritten by deployment.

The new collections are created lazily only when an authorized user explicitly creates a Facility or Asset.

## 11. Validation limits

Static validation can verify:

- JavaScript syntax.
- Frozen P38 file integrity.
- P39 API contract.
- P39 taxonomy consistency.
- No P39 seed/mock asset records in source.
- Page and Service Location routing presence.

Live validation against production Firebase/Firestore remains pending because the current managed device cannot install Node.js / Netlify CLI and P38 explicitly remains locked against local-runtime bypasses.

No fake local authentication or local SuperAdmin bypass was introduced.

## 12. Final repository validation

The finalized P39 source was checked without changing the locked P38 package metadata, Firebase/Auth implementation, or production-data structures.

Validated in the available execution environment:

- JavaScript syntax: PASS for the P39 browser module and Netlify Function.
- Existing P27/P29/P31/P32/P33-P37 regression contracts: PASS.
- P38 repository hygiene: PASS.
- P39 Asset/Facility contract: PASS.
- Frozen P38 baseline integrity: PASS.
- Static local HTTP preview of `asset-facility.html`: PASS.
- Static delivery of `assets/p39-asset-config.json`: PASS.

The final P39 UI also guards mutation controls in the browser for non-editor users while the Netlify Function remains the authoritative authorization boundary.

Quantity is validated server-side as a positive integer; individual tracking forces quantity to 1 and requires a unique Asset Tag within the Station.

Not validated and intentionally still pending:

- authenticated browser interaction against production Firebase;
- live production Firestore read/write;
- manual production-parity Netlify Functions execution;
- real production deployment validation;
- visual browser inspection.

These remain pending because the current corporate-managed laptop cannot install Node.js / Netlify CLI, and P39 does not bypass that restriction or introduce local authentication/data substitutes.
