# P29 — Lounge / Tenant Planning, Agreement Pricing, Input Consistency & Branch Office Asset Readiness

## Baseline and change control

P29 was implemented from the latest approved package:
`Ground_Experience_Garuda_Indonesia_R10_20_P22_P23_P24_FINAL`.

P22, P23 and P24 remain frozen. No Dashboard redesign, navigation redesign, Planning reconsolidation, Firebase replacement, Firestore migration, production-data rewrite, or User & Role redevelopment was performed.

## 1. Tenant display defect — root cause and correction

### Audit finding

The existing Lounge Master data in `assets/data.js` contains 49 default Lounge records. All 49 use `serviceCategory: "Lounge"`; none of those baseline records contain `serviceType`.

The existing Add flow introduced both `serviceCategory` and `serviceType`, while the existing Update flow wrote `serviceCategory`. The card renderer in `assets/app.js` used `x.type || x.category || 'Lounge'` and therefore did not read either of the actual Lounge Master fields. This was the root cause of the Tenant → Lounge presentation defect.

### Canonical mapping

For the existing Lounge Master domain, `serviceCategory` is the audited canonical stored field because it is the field present on the existing records and is consumed by the existing data normalization/rendering paths. `serviceType` is retained as an additive compatibility mirror for the P29 manual/CSV contract.

P29 now resolves service type as follows:

1. Valid `serviceCategory` is authoritative.
2. If `serviceCategory` is absent, a valid `serviceType` can be used for backward/additive compatibility.
3. If both valid fields conflict, the record is rendered as **Requires Review** rather than silently choosing one.
4. Invalid/missing service type is rendered safely and does not crash the card grid.

Manual Add/Update normalizes the selected value into both fields with the same value, preventing the two fields from becoming conflicting sources of truth through the new input paths.

### Affected files

- `assets/app.js` — existing Lounge Master behavior audited; P29 overrides are kept in a separate focused module.
- `lounge-list.html` — Lounge/Tenant Add/Update and filter UI entry points aligned.
- `assets/lounge-planning-v29.js` — canonical type resolution, normalized input contract, card/table rendering, CSV workflow.

## 2. Lounge / Tenant filter

The Lounge/Tenant Workspace now provides a scoped Service Type filter:

- All
- Lounge
- Tenant

Existing `Snack Box` records, if present, remain visible under All so the older supported service type is not silently removed. Filtering is performed on the resolved real record value; no duplicate Firestore/local records are created for filtering.

## 3. Existing Lounge/Tenant data field audit

| Field | Audited meaning/use | P29 treatment |
|---|---|---|
| `airport` | Station/Airport context; may contain multiple IATA codes such as `HND/NRT` | Preserved; normalized as uppercase station value for new input |
| `region` | Existing region classification | Preserved |
| `name` | Existing Lounge/Tenant provider/service name | Canonical provider/service display |
| `serviceCategory` | Existing stored service-type/category field; present on all 49 baseline Lounge records | Canonical service-type mapping |
| `serviceType` | Additive field already introduced by earlier Add/CSV flows | Kept as compatibility mirror; conflicts are flagged |
| `pic` | Person-in-charge where present in newer records | Preserved and included in shared input contract |
| `startDate` / `endDate` | Existing agreement/cooperation period | Remains Agreement Period; not repurposed for price periods |
| `startDisplay` / `endDisplay` | Existing display derivatives | Preserved; P29 safely formats validated dates and does not rewrite legacy values during rendering |
| `pricePerPax` | Existing legacy single-price amount | Preserved as backward-compatible fallback |
| `currency` | Existing legacy price currency | Preserved; P29 validates currency before formatting |
| `priceDisplay` | Existing display representation of legacy price | Preserved for legacy compatibility; P29 derives safe display for new normalized records |
| `documentNumber` | Existing agreement/document identity suitable for repeated CSV price-period grouping | Preserved; used as CSV multi-period grouping identity |
| `documentType` | Existing agreement/document type | Preserved |
| `documentStatus` | Existing document/legal status; baseline includes values beyond a fixed three-value enum | Preserved as free status text with common suggestions rather than destructively constraining legacy values |
| `remarks` | Existing free-text operational/legal note | Preserved |
| `documentName` / `documentKey` | Existing attachment metadata | Preserved; no new document architecture |

### Storage/source audit

The audited Lounge Master is exposed through `GEStore`/`data.lounges` in `assets/data.js` and `assets/app.js`. The package does not contain a direct Firestore collection implementation for the Lounge Master itself. `assets/agreement-v257.js` and `assets/service-location-v257.js` bootstrap separate relational compatibility views from the legacy Lounge Master; these were not migrated or destructively merged in P29.

## 4. Data contract

The P29 logical contract is:

```text
Manual Add
     ↓
collectForm()
     ↓
Normalize + Validate
     ↓
Normalized Lounge/Tenant model
     ↓
GEStore save()

Manual Update
     ↓
collectForm()
     ↓
Normalize + Validate
     ↓
Normalized Lounge/Tenant model
     ↓
existing record update

CSV/XLSX
     ↓
Parse
     ↓
Header mapping
     ↓
Normalize + Validate
     ↓
Preview
     ↓
Confirm
     ↓
CREATE-only normalized model
     ↓
GEStore save()
```

The same logical fields are used by Form and CSV:

`Region → Station → Nama Layanan / Provider → Jenis Layanan → PIC → Agreement Start/End → single-price fallback → Nomor Dokumen → Jenis Dokumen → Status Dokumen → Remarks → optional Price Schedule fields`.

No separate CSV-only business model was introduced.

## 5. CSV Template / Import

### Template columns

1. Region
2. Station
3. Nama Layanan / Provider
4. Jenis Layanan
5. PIC
6. Mata Uang
7. Harga Per Pax
8. Tanggal Mulai
9. Tanggal Berakhir
10. Nomor Dokumen
11. Jenis Dokumen
12. Status Dokumen
13. Remarks
14. Price Period Effective From
15. Price Period Effective To
16. Price Period Price
17. Price Period Currency
18. Price Basis
19. Price Period Note

The template contains instructions for required fields, allowed Service Types, date format, currency, single-price use, multi-price repeated Agreement Number behavior, and CREATE-only duplicate handling.

A static template is also shipped at:
`templates/Template_Layanan_Lounge_Tenant_P29.csv`.

The in-page **Download CSV Template** action generates the same logical column contract rather than maintaining a second schema.

### Import behavior

- Supported file readers remain the existing CSV/XLSX readers.
- Header aliases map to the same P29 logical fields.
- Data is normalized before any write.
- Validation occurs before commit.
- Preview shows Row, Station, Type, Provider, Agreement Number, Agreement Period, Price/Price Period, Validation Status, and Validation Message.
- Summary reports Total, Valid, Warnings, and Invalid.
- Invalid rows are not written.
- Existing-record duplicates are detected before commit.
- Duplicate import rows are detected within the uploaded file.
- Import mode is **CREATE-only**; no automatic production update/overwrite path was introduced.
- A successful bulk import reuses the existing `auditLogs` store for non-sensitive import metadata.

## 6. Multi-period Agreement pricing

### Model

P29 adds an optional additive field:

`priceSchedules[]`

with:

- `effectiveFrom`
- `effectiveTo`
- `price`
- `currency`
- `priceBasis`
- `priceNote`

This is additive and is not mass-applied to legacy records.

### Agreement vs Price Period

`startDate/endDate` remain the Agreement Period.

`priceSchedules[].effectiveFrom/effectiveTo` are Price Effective Periods.

Price period expiry therefore does not change the Agreement end date.

### Current price resolution

The applicable price is resolved by date containment (`effectiveFrom <= asOf <= effectiveTo`). The last schedule item, highest price, or array position is not treated as the current price.

If schedules exist but no period is applicable to the requested date, the UI displays `Not Available`. If schedules are malformed or overlap, the UI displays `Requires Review` rather than selecting an arbitrary price.

### Legacy fallback

If `priceSchedules[]` is absent, P29 falls back to the existing:

- `pricePerPax`
- `currency`
- `priceDisplay`

No destructive conversion of legacy single-price records is performed.

### Validation

P29 validates:

- effectiveFrom
- effectiveTo
- effectiveTo >= effectiveFrom
- numeric non-negative price
- currency recognized by the browser's Intl currency implementation
- overlap between periods
- schedule containment within Agreement Start/End where those Agreement dates exist

## 7. Card UI

P29 keeps the P24 portal visual language and only scopes changes to Lounge/Tenant cards.

### Desktop / responsive

- Wide desktop: 3 columns.
- Desktop/laptop: 3 columns where space permits.
- Tablet/narrow: 2 columns.
- Mobile: 1 column.

The existing 12-record pagination is preserved.

### Information hierarchy

Cards prioritize:

1. Airport / Station
2. Service Type
3. Provider / Service Name
4. Agreement Status
5. Agreement Period
6. Current Price
7. Price Schedule indicator
8. Actions

Long provider/service names wrap safely. Card rendering is defensive and one malformed record does not replace the entire grid with an exception.

The full schedule is available through **View Price Schedule** when schedules exist; cards do not display the entire schedule.

## 8. Defensive rendering and input safety

P29 guards:

- missing/invalid serviceType
- conflicting serviceCategory/serviceType
- unknown station
- invalid dates
- invalid currency
- non-numeric prices
- incomplete price schedules
- overlapping price schedules
- null/undefined/empty values
- malformed legacy records

Existing malformed data is rendered safely and flagged where appropriate. Rendering does not rewrite or repair production records.

## 9. Branch Office / Facility / Asset audit

### Existing compatible capability found

The package already contains a useful **Service Location** capability:

- `assets/service-location-v257.js`
- storage key `GE_V257_LOCATION_P22`
- `GECore.masters.serviceLocations`
- explicit `station_service_location` relationships
- explicit `location_touchpoint` relationships
- `service-locations.html`

The existing bootstrap explicitly creates a Service Location for legacy Lounge Master records when a Lounge is explicitly identified at a known Station. This establishes a compatible conceptual relationship:

`Station → Service Location (Lounge)`.

The package also has **Branch Office Space** capability:

- `bo-space.html`
- `data.boSpaces`
- existing Branch Office Planning rendering and import/update flow.

This is a premises/space domain, not a physical Asset Registry.

There is also a Portal Management Asset Library in `assets/app.js`, but it is an attachment/file library backed by `GEFiles`/IndexedDB metadata, not a company physical-asset domain.

### Physical asset capability status

No suitable existing physical Asset Registry was found. No existing `data.assets` collection/field, dedicated physical asset page, or asset lifecycle model was found in the audited package.

Therefore P29 does **not** create a new production Asset collection or a large Asset Management module.

### Recommended future domain owner

The recommended future domain owner is Branch Office / Station Operations, with GE Team / Head Office as network oversight. The model should remain independent from Agreement pricing.

Conceptual relationship:

`Branch Office / Station → Facility / Service Location → Asset`

A Lounge is one possible Service Location; it is not the only possible asset location.

### Recommended future Asset model

Only as a future design target:

- assetId
- assetName
- assetCategory
- station reference
- facility/location reference
- lounge reference where applicable
- ownership
- quantity/unit
- condition
- operationalStatus
- acquisition/installation date
- lastInspection
- evidence/document reference
- remarks

Ownership should be independently represented (e.g. Garuda, Airport/Landlord, Tenant, Partner, Vendor, Other). Service Type must not determine ownership.

### Lifecycle / readiness / budget

Asset lifecycle should remain independent of Agreement lifecycle. An asset can survive an Agreement change.

Existing Readiness/Capability models should be referenced rather than duplicated. P29 did not alter existing readiness formulas.

Future replacement/acquisition links should reference Budget & Cost rather than duplicating financial data inside an Asset record. P29 did not add financial logic.

### What P29 implemented for assets

No new physical Asset schema was written. The existing Service Location and Branch Office Space capabilities were documented as the reusable foundation for a future Station → Facility → Asset relationship.

A dedicated Asset phase remains appropriate for lifecycle, condition, maintenance, evidence, replacement workflow, individual-vs-quantity tracking, permissions, and readiness/budget integrations.

## 10. Preservation

P29 did not:

- change production Firestore collections/documents/fields
- migrate or rewrite production records
- modify Firebase Authentication
- modify Netlify Functions
- redesign Dashboards
- reopen P22 navigation
- reopen P23 Planning consolidation
- reopen P24 visual system
- redesign User & Role Management

The only persisted data-shape extension is the **optional** `priceSchedules[]` field on records explicitly created/updated/imported through P29. Existing records are not mass-migrated.

## 11. Validation

### Static / unit validation

- `node --check assets/lounge-planning-v29.js` — PASS
- P29 service-type resolution tests — PASS
- Legacy single-price resolution — PASS
- 3-period current-price resolution — PASS
- Historical/future period handling — PASS
- Overlap detection — PASS
- Form normalization to `serviceCategory` + `serviceType` — PASS
- Invalid Station + non-numeric price rejection — PASS
- `npm run build` — PASS
  - `PACKAGE_VERIFY_PASS`
  - `REGRESSION_AUDIT_PASS`
  - `P29_LOUNGE_PLANNING_PASS`

### Local development preview

HTTP 200 verified for:

- `index.html`
- `lounge-list.html`
- `planning-workspace.html`
- `branch-office-planning.html`
- `gaso-planning.html`
- `planning-documents.html`
- `admin.html`
- `assets/lounge-planning-v29.js`
- `templates/Template_Layanan_Lounge_Tenant_P29.csv`

### Local production preview

HTTP 200 verified for the same principal portal/planning routes.

### Browser visual validation

A Chromium headless attempt was made against the local Lounge/Tenant page, but the environment did not complete the browser run before timeout. Therefore **no browser click-through/visual validation is claimed** for P29.

No production credentials or production Firestore data were touched during validation.
