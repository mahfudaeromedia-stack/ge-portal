# Ground Experience Portal — Root Map R3

Canonical runtime: `app.html?page=<route>`. Legacy/E1 physical names are compatibility references only and must not become an intermediate page.

| Menu group | Tab / Page | Canonical route | Main content / child | Connects to | Access |
|---|---|---|---|---|---|
| Dashboard | Dashboard | `index` | KPI, governance, attention, quick access | User & Access, Master Data, Airport Experience, Lounge/Tenant, Documents, Audit, Calendar | Role-specific; Super Admin sees system dashboard |
| Experience & Insight | Customer Experience | `customer-experience` | CSI/NPS, measurement, import/OCR workflow | CSI/NPS Import, findings | BO/GE Team/Management/Super Admin per `services` permission |
| Experience & Insight | Airport Experience Network | `airport-experience` | Operational map + network/station summary | Station 360 | BO/GE Team/Management/Super Admin per `services` permission |
| Experience & Insight | Station Profile / 360 | `station-360` | Station identity, organization, service/readiness context | Airport Experience, Service Capability | BO/GE Team/Super Admin per `services` permission |
| Readiness & Standards | Readiness Assessment | `readiness` | Readiness/compliance assessment | Station/standard context | BO/GE Team/Super Admin per `services` permission |
| Readiness & Standards | Capability & Standards | `service-capability` | Touch Point → Service → Capability relationships | Service Locations, Station 360 | BO/GE Team/Super Admin per `services` permission |
| Readiness & Standards | Service Standard | `standar` | People / Process / Premises, personnel readiness, SkyPriority | Standard detail/editor | GE Team/Super Admin per `services` permission |
| Improvement & Planning | Initiative & Improvement | `inisiatif` | Initiative list, filters, CRUD, timeline/update | Calendar & Project Tracking | BO/GE Team/Management/Super Admin per `initiatives` permission |
| Improvement & Planning | Improvement Opportunity | `improvement-intake` | Intake/opportunity | Initiative / Action & Scenario | BO/GE Team/Super Admin per `initiatives` permission |
| Improvement & Planning | Calendar & Project Tracking | `calendar` | Initiative-linked + standalone calendar/project activity | Initiative (one-way Initiative → Calendar) | BO/GE Team/Management/Super Admin per `initiatives` permission |
| Improvement & Planning | Planning Overview | `service-planning` | Contract & Resource Snapshot, planning master | Lounge/Tenant, Branch Office, GASO, Documents | BO/GE Team/Management/Super Admin per `planning` permission |
| Improvement & Planning | Planning Workspace | `planning-workspace` | Planning hub | Lounge/Tenant, Branch Office, GASO | planning permission |
| Improvement & Planning | Lounge / Tenant | `lounge-list` | Grid/Details list, filters, agreement + multi-period pricing | Visitor, Access, procurement/documents | planning permission |
| Improvement & Planning | Branch Office | `branch-office-planning` | BO space, airport systems, station material, procurement | Planning Overview | planning permission |
| Improvement & Planning | GASO | `gaso-planning` | GASO master/service support/planning | Planning Overview | planning permission |
| Improvement & Planning | Planning Documents | `planning-documents` | Document repository | Initiative/planning records | planning permission |
| Budget & Cost | Budget & Cost | `budget-cost` | Budget/financial | Cost Intelligence | authorized operational roles |
| Budget & Cost | Cost Intelligence | `cost-intelligence` | Cost analysis | Budget & Cost | GE Team/Super Admin |
| Data & Administration | Data Management | `data` | Airport/personnel data | Master Data | GE Team/Super Admin per `data` permission |
| Data & Administration | Master Data | `master-data` | Core network/service reference | Capability, Airport Experience | Super Admin / authorized data role |
| Data & Administration | User & Access | `admin` | Account, role, access level, scope, permission | Firebase Authentication + `users/{uid}` | Super Admin; Admin with user-management permission |
| Data & Administration | Portal Management | `portal-management` | Portal configuration + Core pages | Core Master/Relationships/Foundation/History/Shared/Migration/Permission/Publication | Super Admin only |
| Data & Administration | Audit Log | `audit-log` | Audit trail | Related modules | Super Admin |
| Information | Berita & Informasi | `berita` | Articles, announcements, FAQ | Content detail/editor | Roles with `news` permission |
| Support | Contact Support | `kontak` | Contact/inbox/support | Inbox | permitted users |
| Lounge Operation | Lounge Access | `lounge-access` | Boarding pass/eligibility workflow | Visitor/flight reference | Lounge Staff + assigned roles |
| Lounge Operation | Visitor & Report | `lounge-visitor` | Visitor verification/report | Lounge master | Lounge operational roles |

## Access model

- **Super Admin:** all canonical modules; `core-*` remains under Portal Management only.
- **Admin:** access is permission-driven; User Management requires explicit user-management permission.
- **GE Team / Head Office:** experience, standards, initiative/planning, budget/data according to assigned tabs/permissions.
- **Management:** dashboard/insight/initiative/planning/decision support according to assigned permissions.
- **Branch Office:** station-scoped experience/readiness/initiative/planning/budget according to assigned scope.
- **Lounge Staff / Lounge Luar Biasa:** lounge operation pages according to lounge/station assignment.
- **External/Collaborator:** initiative/calendar/inbox only when explicitly permitted/assigned.

## Data-direction contracts

`Initiative Timeline & Update → Calendar & Project Tracking` is one-way. Standalone Calendar/Project activity does **not** create or update Initiative.

Lounge/Tenant agreement supports `priceSchedules[]` (multiple effective price periods in one agreement). CSV is the canonical Download Template format when equivalent CSV/XLSX templates exist.

## R4 relationship additions

### Initiative → Calendar → Assignment → Budget
- Initiative is the parent work item.
- Milestone belongs to an Initiative; standalone Calendar activity may optionally link to an Initiative.
- Initiative/Milestone/Activity PIC should resolve to a portal user when an account exists; assignment creates an Inbox/notification item for that user. Due-date reminders remain a notification workflow requirement and must not be simulated only in the UI.
- Cost & Budget is the financial child/relationship layer. Budget records should carry `initiativeId` and may optionally carry `milestoneId` / `activityId`, plus budget year, cost category/account, allocation, realization/commitment, currency and source document. Initiative views may show summarized allocated/realized budget while Cost & Budget remains the financial system-of-record page.

### Lounge/Tenant agreement history
- Default list = current/effective master records only.
- `agreementAction`: new | replacement | amendment | extension.
- Replacement/amendment/extension may set `supersedesId`; prior record is retained as history and marked Superseded, not deleted.
- History can be included explicitly with the History filter.
- Price and capacity are independent effective-dated schedules (`priceSchedules[]`, `capacitySchedules[]`).
