# Ground Experience Firebase Schema

This document defines the non-destructive Firebase target for the portal. Existing collections remain authoritative and are not renamed, cleared, or replaced.

## Existing collections retained

`airportsystems`, `airports`, `auditLogs`, `documents`, `inbox`, `initiatives`, `loungeVisitors`, `lounges`, `news`, `personnel`, `skyPriority`, `stationMaterials`, `touchpoints`, `users`.

## users/{uid}

Profile/access metadata only. Authentication credentials belong to Firebase Authentication, not Firestore.

```js
{
  uid,
  username,
  email,
  name,
  employeeNo,
  role,
  status,
  unit,
  scopeType,
  airports: [],
  loungeIds: [],
  tabs: [],
  permissions: [],
  mustChangePassword,
  createdAt,
  updatedAt
}
```

External User target permissions: `initiatives`, `calendar`, `project-tracking`, `inbox`.

## initiatives/{initiativeId}

Legacy records remain valid. New fields are additive:

```js
{
  // existing initiative fields remain
  createdBy,
  visibility: 'INTERNAL',
  sharedWithUserIds: [],
  mentionedUserIds: [],
  createdAt,
  updatedAt
}
```

External access is granted only when the authenticated UID is in `sharedWithUserIds` or `mentionedUserIds`. Never retrieve all initiatives and filter them in the browser.

## inbox/{messageId}

```js
{
  type,
  actorId,
  actorName,
  recipientId,
  initiativeId,
  initiativeName,
  subject,
  message,
  createdAt,
  read,
  status
}
```

Mention notification type: `INITIATIVE_MENTION`.

## documents/{documentId}

Metadata remains in Firestore. Binary content belongs in Firebase Storage.

```js
{
  name,
  description,
  category,
  initiativeId,
  airport,
  uploadedBy,
  storagePath,
  mimeType,
  size,
  status,
  createdAt,
  updatedAt
}
```

Document access follows the accessibility of its parent initiative where `initiativeId` is present.

## projectEvents/{eventId}

New collection for Calendar / Project Tracking; it does not replace any existing collection.

```js
{
  title,
  initiativeId,
  date,
  time,
  airport,
  picUserId,
  picName,
  touchpoint,
  category,
  priority,
  reminderMinutes,
  remark,
  status,
  createdBy,
  createdAt,
  updatedAt
}
```

External users see only events whose `initiativeId` refers to an accessible initiative.

## Migration rules

1. Read existing data before writing.
2. Normalize only where necessary.
3. Add missing fields without deleting existing fields.
4. Preserve existing IDs where possible.
5. Never clear/reset/overwrite all data.
6. Keep `GEStore` as a compatibility layer until Firebase-backed flows are verified.
7. Firebase Authentication + Firestore Security Rules are the authorization boundary; UI hiding is not a security boundary.

## accessAssistanceRequests/{requestId}

Canonical Access Assistance Request. One request is shared by all authorized recipients; recipient notifications reference this document and do not duplicate the request.

```js
{
  type: 'ACCESS_ASSISTANCE',
  identifier,
  email,
  username,
  reason,
  recipientUserIds: [],
  recipientRoles: [],
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED',
  createdAt,
  handledBy: { id, name, username },
  handledAt,
  resolvedBy: { id, name, username },
  resolvedAt,
  resolutionNote,
  source: 'login',
  updatedAt
}
```

Only the server-side Access Assistance workflow reads or mutates this collection. An authenticated administrator is authorized only when the request recipient list contains that administrator and the administrator is either `Super Admin` or legacy `Admin` with the existing User Management permission.

### inbox/{messageId} — Access Assistance notification

The existing `inbox` collection is reused for notification references. A notification is created once per authorized recipient using a deterministic reference to the canonical request:

```js
{
  type: 'ACCESS_ASSISTANCE',
  recipientId,
  accessAssistanceRequestId,
  subject: 'Bantuan Akses Akun',
  message,
  createdAt,
  read: false,
  status: 'UNREAD'
}
```

`read/status` on the notification is independent from `status` on the canonical request. Opening a notification changes only that recipient's notification state to `READ`.

## P39 Asset & Facility operational domain

P39 adds a separate operational domain. It does not modify the existing Lounge/Tenant Agreement or Price Schedule model.

### geFacilities/{facilityId}

Non-Lounge Ground Experience Service Facility records:

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

Existing Lounge records remain in `lounges` and are referenced by `loungeId`; P39 does not duplicate Lounge Master records into `geFacilities`.

### geAssets/{assetId}

```js
{
  stationCode,
  facilityType,
  facilityId,
  loungeId,
  area,
  assetName,
  category,
  ownership,
  responsibleUnit,
  pic,
  trackingMode,
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

### P39 persistence / authorization boundary

The browser does not directly read or write these collections. P39 uses authenticated Netlify Functions with Firebase Admin, verifies the Firebase ID token, reads the existing `users/{uid}` profile, applies the existing role/access-level/station scope rules, and then reads or mutates the P39 collections.

No P39 seed or migration runs automatically. The collections are created only when an authorized business action creates the first record.

### P39 audit

Asset/Facility mutations append additive audit records to the existing `auditLogs` collection with:

- `targetType: 'P39_ASSET_FACILITY'`
- `targetId`
- existing actor identity fields
- action
- timestamp
- result

This does not replace the existing audit collection.
