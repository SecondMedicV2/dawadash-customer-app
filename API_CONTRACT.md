# DawaDash mobile feature contract

The app in this folder is an Expo / React Native mobile application targeting **Android and iOS**. Its screen patterns use familiar pharmacy-app conventions—medicine search and filters, product cards, quantity steppers, a cart, and direct refill/lab actions—without Tata 1mg branding or assets. No responsive website is being implemented.

## Feature-to-screen map

| Feature | Screen and flow |
| --- | --- |
| Medicine search and catalog browsing | **Medicines** tab: search by name, salt, or brand; filter the sample catalog; inspect product and composition details. |
| Same-composition alternatives | Medicine card: display alternatives only when form, ingredient, strength, and unit match; selecting an alternative requires an explicit confirmation. |
| Cart and order placement | **Cart** tab: adjust quantities, select a camera photo or PDF, then create a medicine order request. No payment or fulfillment is simulated. |
| Prescription upload | Cart → **Take a photo** or **Choose an image**. The current adapter records a local demo selection; secure upload and verification are not implemented. |
| Prescription refills | **Refills** tab: choose a sample saved prescription and submit a refill order request directly. Real prescription history and refill eligibility are not connected. |
| Pathology bookings | **Labs** tab: choose a sample test and submit a booking request directly. The request is local until a lab partner is integrated. |
| Order requests | **Orders** tab: view local medicine and refill requests, clearly marked as not sent. |

The sample medicine, prescription, and lab catalogs are fixtures, not live inventory, medical advice, or a patient's records.

## Data model

The API derives the customer identity from its authenticated request context; the client should not submit customer identity or retailer attribution fields.

```json
{
  "Medicine": {
    "id": "string",
    "name": "string",
    "brand": "string",
    "pack": "string",
    "ingredients": [
      { "name": "string", "strength": "number", "unit": "string" }
    ],
    "form": "string",
    "category": "string",
    "price": "number"
  },
  "Prescription": {
    "id": "string",
    "source": "camera | pdf"
  },
  "OrderRequest": {
    "id": "string",
    "kind": "medicine | refill",
    "items": [
      { "medicineId": "string", "quantity": "integer" }
    ],
    "prescriptionId": "string | null",
    "status": "string",
    "createdAt": "ISO-8601 string"
  },
  "LabTest": {
    "id": "string",
    "name": "string",
    "category": "string"
  },
  "LabBookingRequest": {
    "id": "string",
    "testId": "string",
    "status": "string",
    "createdAt": "ISO-8601 string"
  }
}
```

`price` is returned by the live catalog service, not trusted from a client order. Medicine alternatives must have the same normalized ingredient set, strengths, units, and dosage form. This matching is informational and does not replace professional or regulatory review.

## API contract

These are proposed resource shapes for the backend adapter. The app currently uses a local demo adapter, not HTTP calls; demo IDs and pending states are not confirmations.

| Method and path | Purpose |
| --- | --- |
| `GET /v1/medicines?q={query}` | Search or browse the medicine catalog. |
| `GET /v1/medicines/{medicineId}/alternatives` | Return medicines matching the exact composition and form. |
| `GET /v1/prescriptions?refillable=true` | Return customer prescriptions available for the refill UI; eligibility rules remain server-owned. |
| `POST /v1/prescriptions` | Customer-only. Multipart `source` (camera or pdf) and `file`. Return `201` with `{ id, source }` once stored for internal review. |
| `GET /v1/prescriptions/{id}/verification` | Customer-only and owner-scoped. Return `{ verified, action }` with action `reupload_required`, `expired`, or null. |
| `POST /v1/orders/{id}/prescription` | Customer-only and owner-scoped. Accept the upload fields and replace the current prescription when it is expired or marked for re-upload. The new file starts pending review. |
| `POST /v1/internal/orders/{id}/dispatch` | Internal fulfillment role only. Use the persisted order, compile after checking verification, and hand off to its assigned destination. Return success after the downstream handoff is accepted. |
| `POST /v1/orders` | Create either a medicine order or refill request. Body: `{"kind":"medicine","items":[{"medicineId":"m1","quantity":1}],"prescriptionId":null}`. A refill uses `"kind":"refill"` and the selected `prescriptionId`. |
| `GET /v1/orders` | List the customer's order requests and server-provided statuses. Include `prescriptionAction` when the current prescription on an active order requires replacement. |
| `GET /v1/lab-tests` | Return the available pathology catalog. |
| `POST /v1/lab-bookings` | Create a lab booking request. Body: `{"testId":"lab-cbc"}`. This does not imply a confirmed time or collection arrangement. |
| `GET /v1/lab-bookings` | List the customer's lab booking requests and server-provided statuses. |

Successful create operations should return the persisted resource and its authoritative status. Errors should be returned as a non-2xx response with a structured error body (for example `{"code":"...","message":"..."}`). The app's adapter boundary forwards failures rather than treating them as successful requests.

## Open Questions / unconfigured stubs

- Is a responsive website also required? None is built here.
- Is Expo / React Native the approved framework for both Android and iOS? The implementation follows the existing Expo / React Native app.
- What backend, API host, authentication/onboarding session mechanism, and secure health-data storage should be used? The current sign-in flow is a local demo and all customer service calls use a local demo adapter.
- Who fulfills medicine orders: the partner chemist or a central warehouse? Delivery, stock confirmation, service areas, and order status updates are unconfigured.
- Which payment provider and payment timing should be used? No payment is taken or represented.
- Which lab partners, tests, prices, collection locations, appointment slots, and booking statuses are valid? The current test list is sample data and booking requests remain local.
- How should each partner retailer be represented and linked to a customer? `retailerAcquisition` is an explicit unconfigured interface; no QR/referral attribution or install tracking runs.
- Should retailer staff receive a prompt/tracking tool, and does a retailer receive a commission or incentive per acquired user? Neither staff tooling nor commission logic is implemented.
- Should retention analytics be collected, and what repeat-order/refill/lab metrics and consent rules apply? `retentionAnalytics` is an explicit unconfigured interface; no events are collected.
- What live medicine catalog, product descriptions, stock, and pricing source should replace the sample fixtures?


## Prescription workflow integration

The server host binds the customer and staff API handlers. Customer identity comes from a verified bearer token. Use private, owner-scoped records with an opaque ID, source, and status of `pending_review`, `verified`, or `reupload_required`. Store the authorized reviewer ID and trusted validity start on approval. Orders reads the current action on focus and displays an in-app replacement notice. A replacement starts pending review on the original order.

`withOrder` loads the authoritative order and serializes order mutations. `replaceForReview` checks that the order is still eligible and swaps the expected reference atomically with the new record. Clean up orphaned objects on failure. `recordPendingReview` commits only from pending review. The reviewer enters the issue date printed on the document. The workflow uses midnight IST on that date and expires eligibility seven days later. Re-upload does not reset the issue date. Retention is a separate policy.

Use authoritative Schedule H, H1, and X SKU classifications and applicable Gazette amendments. The diagnostic service supplies a per-test referral flag. Unknown classification blocks dispatch. `reserveDispense` enforces the prescriber's quantities, repeat count, and intervals, and deduplicates by order ID. Preserve reservations while downstream outcomes are ambiguous. `compile` and `dispatch` must be retry-safe. Dispatch receives a trusted destination and the order ID as the idempotency key. [CDSCO Drugs Rules](https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/Drugs-Rules/)

The app compresses camera photos to JPEG and checks the output is at most 500,000 bytes before upload. It asks for a retake or PDF if it cannot meet the cap. The server checks the cap and JPEG/PDF signatures before storage and can call the optional `compressCameraPhoto` adapter for larger or non-JPEG inputs. Configure `maxUploadRequestBytes` on `createCustomerPrescriptionApi` to bound the complete multipart request, including the file and framing. Uploads are unavailable until the cap is supplied. The host enforces its own ingress limits and full file validation before storage or serving. Keep prescription contents, filenames, and URLs out of logs and handoff metadata.

The customer authentication adapter returns a verified actor with role `customer`. Client and partner HTTP adapters require HTTPS for remote service URLs. Staff, operations, and payment JSON handlers accept an `application/json` object of at most 64 KiB.

### Staff portal

Serve `staff/` and the staff API on the same origin. Provision individual staff accounts and throttle sign-in. Session cookies must be HttpOnly, Secure, and SameSite. Reviewers need scoped file and review permissions. Management needs scoped assignment permission.

| Staff endpoint | Contract |
| --- | --- |
| `POST /v1/staff/session`, `POST /v1/staff/logout` | Start or end a separate staff session. |
| `GET /v1/staff/work` | Return scoped `{ reviews: [{id}], orders: [{id, destinations: [{id, kind, label}]}] }`. |
| `GET /v1/staff/prescriptions/{id}/file` | Stream the private file to an authorized reviewer with caching disabled. |
| `POST /v1/staff/prescriptions/{id}/review` | Accept `{ decision, issuedOn }` from an authorized reviewer. |
| `POST /v1/staff/orders/{id}/assignment` | Accept `{ id, kind }` for an active eligible destination from authorized management. |

Use local Supabase Auth, Postgres and private Storage for development with synthetic data. A hosted pilot can use the Supabase Free plan and Cloudflare Pages for portal assets. Confirm production region, consent, retention, access and recovery requirements before connecting patient data. [Supabase pricing](https://supabase.com/pricing), [private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals), [Pages limits](https://developers.cloudflare.com/pages/platform/limits/)

### Prescription Open Questions

- Supply current SKU classifications and service-specific diagnostic referral rules.
- Confirm reviewer eligibility, scope and SLA, and management permissions.
- How is the destination assigned, and what compiler and downstream systems implement `compile` and `dispatch`? Supply the trusted assignment through `findAssignedDestination`.
- What storage, access, retention, consent, and data-protection requirements apply? Supply `storeForReview` and `findOwnedPrescription` after these are defined.
- Confirm the PDF limit and remaining content validation rules.
- Confirm how dispensing directions and refill linkage are recorded.
