# Brand and tenant configuration

The Android, iOS and web app has one active launch brand: **DawaDash**. A **Second Medic** brand config is also registered (JV-governed) but not active. Brand identity is loaded from the immutable, local `brandConfigSource` at app startup. Feature logic reads brand identity, theme colors, logo assets, and disclaimer copy from this source; it has no tenant/brand switching control.

## Schema

`BrandTenantConfig` is documented with JSDoc in `src/branding/brandConfig.cjs`.

| Field | Purpose |
| --- | --- |
| `tenant.id` | Stable tenant identifier. |
| `tenant.operatingModel` | Joint-venture ownership model. |
| `tenant.brandingScope` | Scope of the active tenant branding. |
| `brand.id` | Stable brand identifier and native app slug. |
| `brand.name` | Consumer-facing app/brand name. |
| `brand.theme.statusBarStyle` | Status-bar foreground style (`light` or `dark`). |
| `brand.logo.markIcon` | Icon name for the in-app brand mark. |
| `brand.logo.markForeground` | In-app mark foreground color. |
| `brand.logo.markBackground` | In-app mark background color. |
| `brand.logo.appIcon` | iOS and general app icon asset path. |
| `brand.logo.adaptiveIconForeground` | Android adaptive foreground asset path. |
| `brand.logo.splashLogo` | Native launch/splash asset path. |
| `brand.theme.colors` | `primary`, `primaryDark`, `deep`, `mint`, `text`, `text2`, `muted`, `background`, `surface`, `border`, `well`, `ok`, `okBg`, `warn`, `warnBg`, `warnText`, `err`, `errBg`, `errText`, `teal50`, `softMint`, `highlight`, `input`, `trust`, `white`, and `black`; named palette tokens consumed by the theme and UI components. |
| `brand.disclaimers.demoSignIn` | Sign-in/demo limitation copy. |
| `brand.disclaimers.demoMode` | Demo-mode label. |
| `brand.disclaimers.demoSignInAction` | Demo sign-in action label. |
| `brand.disclaimers.demoOtpTitle` | Demo OTP screen title. |
| `brand.disclaimers.demoOtpAction` | Demo OTP action label. |
| `brand.disclaimers.demoOtpNotice` | Demo OTP behavior disclosure. |
| `brand.disclaimers.prescriptionCatalog` | Prescription catalog limitation copy. |
| `brand.disclaimers.catalog` | Catalog and stock limitation copy. |
| `brand.disclaimers.catalogBadge` | Catalog sample badge. |
| `brand.disclaimers.medicineAlternative` | Composition-alternative advisory. |
| `brand.disclaimers.cartSubtotal` | Cart price limitation copy. |
| `brand.disclaimers.cartSubtotalLabel` | Cart subtotal label. |
| `brand.disclaimers.cartDemoCatalog` | Cart demo catalog label. |
| `brand.disclaimers.cartPrescriptionOptional` | Prescription optionality label. |
| `brand.disclaimers.cartPrescriptionHint` | Cart prescription selection hint. |
| `brand.disclaimers.prescriptionSelected` | Selected prescription image status copy. |
| `brand.disclaimers.prescriptionUpload` | Prescription upload/verification limitation copy. |
| `brand.disclaimers.orderRequest` | Local order request limitation copy. |
| `brand.disclaimers.refillRecords` | Sample prescription/refill limitation copy. |
| `brand.disclaimers.refillRecordsTitle` | Refill sample-record disclosure title. |
| `brand.disclaimers.refillSamplePrescription` | Sample prescription record label. |
| `brand.disclaimers.refillRepeatPrescription` | Sample repeat prescription record label. |
| `brand.disclaimers.refillRecordDate` | Sample refill record date label. |
| `brand.disclaimers.refillSampleLabel` | Refill sample-record label. |
| `brand.disclaimers.labBooking` | Lab fulfillment and booking limitation copy. |
| `brand.disclaimers.labCatalog` | Lab catalog qualifier. |
| `brand.disclaimers.labRequestsTitle` | Lab demo request list title. |
| `brand.disclaimers.labBookingStatus` | Local lab request status label. |
| `brand.disclaimers.labRequestStatus` | Local lab request limitation copy. |
| `brand.disclaimers.orderRequests` | Order status and fulfillment limitation copy. |
| `brand.disclaimers.orderRecordLabel` | Local order record label. |
| `brand.disclaimers.orderRequestStatus` | Local order request status label. |
| `brand.disclaimers.orderReferenceStatus` | Order provider integration status. |
| `brand.disclaimers.prescriptionImage` | Prescription image capture limitation copy. |
| `governance.changeRequiresMutualAgreement` | Requires mutual JV agreement for any branding change. |
| `governance.changeTrigger` | Branding changes are deployed as deliberate configuration changes. |

`app.config.js` reads the same source for the native app name, icon assets, and splash screen. The app theme and customer-facing demo disclosures also come from this source.

## Launch configuration

The DawaDash tenant/brand is active; Second Medic is populated but only selectable at build time. Branding scope is the whole app. `EXPO_PUBLIC_BRAND_ID` is the build-time selector shared by the Expo native app config and JavaScript bundle. It defaults to `dawadash`; selecting an unconfigured ID fails the build rather than falling back. Future build variants require adding an approved complete brand config to `brandConfigs`; no user-facing, retailer-facing, runtime, co-branding, or split-label switch exists. The loaded configuration is immutable at runtime.

Brand switching is build-time only. Set `EXPO_PUBLIC_BRAND_ID` in the build environment to an ID already present in `brandConfigs`. Mutual JV approval and audit requirements are not defined; `brandChangeGovernance.requestChange()` therefore remains an unavailable workflow stub and rejects requests. No additional brand config is populated until approval requirements and assets are confirmed. This app does not generate retail collateral; external printed collateral is out of scope.

## Open Questions / unconfigured stubs

- Who exactly is “Agarwal Ji” and what is their role in the JV?
- What JV terms govern rebranding, co-branding, and ownership restructuring?
- Which JV representatives must approve a brand change, and what approval/audit evidence is required? The governance interface rejects requests; no approval or audit workflow exists.
- Are legal disclaimers and licensing details brand-specific or fixed by regulation? Approved legal copy and screen requirements are not supplied.
- What are the approved Second Medic logo artwork and brand palette? The configured mark and palette are provisional.
- What approved brand configuration, assets, and disclaimer copy should populate any future build-time brand variant?
