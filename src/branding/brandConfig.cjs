/**
 * @typedef {Object} BrandLogoConfig
 * @property {string} markIcon
 * @property {string} markForeground
 * @property {string} markBackground
 * @property {string} appIcon
 * @property {string} adaptiveIconForeground
 * @property {string} splashLogo
 *
 * @typedef {Object} BrandThemeColors
 * @property {string} primary
 * @property {string} primaryDark
 * @property {string} deep
 * @property {string} mint
 * @property {string} text
 * @property {string} text2
 * @property {string} muted
 * @property {string} background
 * @property {string} surface
 * @property {string} border
 * @property {string} well
 * @property {string} ok
 * @property {string} okBg
 * @property {string} warn
 * @property {string} warnBg
 * @property {string} warnText
 * @property {string} err
 * @property {string} errBg
 * @property {string} errText
 * @property {string} teal50
 * @property {string} softMint
 * @property {string} highlight
 * @property {string} input
 * @property {string} trust
 * @property {string} white
 * @property {string} black
 *
 * @typedef {Object} BrandDisclaimerConfig
 * @property {string} demoSignIn
 * @property {string} demoMode
 * @property {string} demoSignInAction
 * @property {string} demoOtpTitle
 * @property {string} demoOtpAction
 * @property {string} demoOtpNotice
 * @property {string} prescriptionCatalog
 * @property {string} catalog
 * @property {string} catalogBadge
 * @property {string} medicineAlternative
 * @property {string} cartSubtotal
 * @property {string} cartSubtotalLabel
 * @property {string} cartDemoCatalog
 * @property {string} cartPrescriptionOptional
 * @property {string} cartPrescriptionHint
 * @property {string} prescriptionSelected
 * @property {string} prescriptionUpload
 * @property {string} orderRequest
 * @property {string} refillRecords
 * @property {string} refillRecordsTitle
 * @property {string} refillSamplePrescription
 * @property {string} refillRepeatPrescription
 * @property {string} refillRecordDate
 * @property {string} refillSampleLabel
 * @property {string} labBooking
 * @property {string} labCatalog
 * @property {string} labRequestsTitle
 * @property {string} labBookingStatus
 * @property {string} labRequestStatus
 * @property {string} orderRequests
 * @property {string} orderRecordLabel
 * @property {string} orderRequestStatus
 * @property {string} orderReferenceStatus
 * @property {string} prescriptionImage
 *
 * @typedef {Object} BrandThemeConfig
 * @property {BrandThemeColors} colors
 * @property {'light'|'dark'} statusBarStyle
 *
 * @typedef {Object} BrandTenantConfig
 * @property {{ id: string, operatingModel: 'joint-venture', brandingScope: 'whole-app' }} tenant
 * @property {{ id: string, name: string, logo: BrandLogoConfig, theme: BrandThemeConfig, disclaimers: BrandDisclaimerConfig }} brand
 * @property {{ changeRequiresMutualAgreement: true, changeTrigger: 'approved-deployment' }} governance
 */

const palette = Object.freeze({
  primary: '#0D9488',
  primaryDark: '#00685F',
  deep: '#047857',
  mint: '#CCFBF1',
  text: '#0F172A',
  text2: '#475569',
  muted: '#64748B',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  well: '#F1F5F9',
  ok: '#10B981',
  okBg: '#ECFDF5',
  warn: '#F59E0B',
  warnBg: '#FFFBEB',
  warnText: '#B45309',
  err: '#EF4444',
  errBg: '#FEE2E2',
  errText: '#B91C1C',
  teal50: '#F0FDFA',
  softMint: '#99F6E4',
  highlight: '#F3F4FF',
  input: '#EEF0FF',
  trust: '#F1F3FF',
  white: '#FFFFFF',
  black: '#0F172A',
});

const dawaDash = Object.freeze({
  tenant: Object.freeze({
    id: 'dawadash-customer',
    operatingModel: 'pharmacy-delivery',
    brandingScope: 'whole-app',
  }),
  brand: Object.freeze({
    id: 'dawadash',
    name: 'DawaDash',
    logo: Object.freeze({
      markIcon: 'medical-bag',
      markForeground: palette.white,
      markBackground: palette.primary,
      appIcon: './assets/icon.png',
      adaptiveIconForeground: './assets/adaptive-icon.png',
      splashLogo: './assets/splash.png',
    }),
    theme: Object.freeze({ colors: palette, statusBarStyle: 'dark' }),
    disclaimers: Object.freeze({
      demoSignIn: 'DawaDash: Verified medicines and rapid delivery across Lucknow.',
      demoMode: 'Customer App',
      demoSignInAction: 'Continue with mobile number',
      demoOtpTitle: 'Verify phone number',
      demoOtpAction: 'Verify & continue',
      demoOtpNotice: 'Enter your 6-digit OTP code to continue.',
      prescriptionCatalog: 'Prescription required medicines will be verified by a registered pharmacist.',
      catalog: 'DawaDash Pharmacy Catalog. Licensed partner stock.',
      catalogBadge: 'Genuine medicines',
      medicineAlternative: 'Same salt composition, strength, and form verified by pharmacist.',
      cartSubtotal: 'Subtotal',
      cartSubtotalLabel: 'Order Subtotal',
      cartDemoCatalog: 'DawaDash Catalog',
      cartPrescriptionOptional: 'Optional',
      cartPrescriptionHint: 'Take a camera photo or choose a PDF prescription.',
      prescriptionSelected: 'Prescription selected · ready for upload.',
      prescriptionUpload: 'Your prescription is securely shared with registered pharmacists only.',
      orderRequest: 'Order placed with nearby Lucknow pharmacy partner.',
      refillRecords: 'Saved repeat prescriptions and monthly refills.',
      refillRecordsTitle: 'Prescription History',
      refillSamplePrescription: 'Active prescription',
      refillRepeatPrescription: 'Monthly auto-refill',
      refillRecordDate: 'Verified',
      refillSampleLabel: 'Prescription',
      labBooking: 'Diagnostic test booked with certified Lucknow lab partner.',
      labCatalog: 'Diagnostics Catalog',
      labRequestsTitle: 'Your Lab Bookings',
      labBookingStatus: 'Confirmed',
      labRequestStatus: 'Sample collection scheduled',
      orderRequests: 'Live Lucknow delivery orders.',
      orderRecordLabel: 'Active Orders',
      orderRequestStatus: 'Confirmed',
      orderReferenceStatus: 'In progress',
      prescriptionImage: 'Prescription securely verified by our Lucknow pharmacy team.',
    }),
  }),
  governance: Object.freeze({
    changeRequiresMutualAgreement: false,
    changeTrigger: 'approved-deployment',
  }),
});

const secondMedic = Object.freeze({
  tenant: Object.freeze({
    id: 'second-medic-jv',
    operatingModel: 'joint-venture',
    brandingScope: 'whole-app',
  }),
  brand: Object.freeze({
    id: 'second-medic',
    name: 'Second Medic',
    logo: Object.freeze({
      markIcon: 'medical-bag',
      markForeground: palette.white,
      markBackground: palette.primary,
      appIcon: './assets/icon.png',
      adaptiveIconForeground: './assets/adaptive-icon.png',
      splashLogo: './assets/splash.png',
    }),
    theme: Object.freeze({ colors: palette, statusBarStyle: 'dark' }),
    disclaimers: Object.freeze({
      demoSignIn: 'Demo only: no SMS, email, or identity verification is performed.',
      demoMode: 'Demo mode',
      demoSignInAction: 'Continue to demo sign-in',
      demoOtpTitle: 'Demo sign-in',
      demoOtpAction: 'Continue in demo',
      demoOtpNotice: 'No code is sent. Enter any 6 digits to continue locally.',
      prescriptionCatalog: 'Prescription handling is not configured in this demo.',
      catalog: 'Sample catalog only. Stock and prices are not live.',
      catalogBadge: 'Sample catalog',
      medicineAlternative: 'Same listed salt, strength, and form. Confirm any change with a pharmacist.',
      cartSubtotal: 'Sample subtotal (not a live quote)',
      cartSubtotalLabel: 'Sample subtotal',
      cartDemoCatalog: 'Demo catalog',
      cartPrescriptionOptional: 'Optional in demo',
      cartPrescriptionHint: 'Select a camera photo or PDF for this demo request.',
      prescriptionSelected: 'Selected on this device · secure upload is not configured.',
      prescriptionUpload: 'This demo does not securely upload or validate prescriptions. The backend must enforce the applicable prescription rules.',
      orderRequest: 'Placing a request saves a local sample record only. No payment is taken, no pharmacy receives it, and no delivery is arranged.',
      refillRecords: 'These sample records are not a patient’s medical history. Real prescription retrieval and refill eligibility are not connected.',
      refillRecordsTitle: 'Demo records only',
      refillSamplePrescription: 'Sample prescription',
      refillRepeatPrescription: 'Sample repeat prescription',
      refillRecordDate: 'Demo record',
      refillSampleLabel: 'Sample',
      labBooking: 'No lab partner, price, location, collection time, or appointment is configured. A local request is not a confirmed booking.',
      labCatalog: 'Sample catalog',
      labRequestsTitle: 'Your demo requests',
      labBookingStatus: 'Not confirmed',
      labRequestStatus: 'Local demo request · lab fulfillment is not connected',
      orderRequests: 'Requests shown here were not sent to a pharmacy or lab. Backend fulfillment and status updates are not configured.',
      orderRecordLabel: 'Local demo records',
      orderRequestStatus: 'Not sent',
      orderReferenceStatus: 'Provider integration required',
      prescriptionImage: 'This demo records a local selection. Secure upload and human verification require a backend connection.',
    }),
  }),
  governance: Object.freeze({
    changeRequiresMutualAgreement: true,
    changeTrigger: 'approved-deployment',
  }),
});

/** @type {BrandTenantConfig} */
const ACTIVE_BRAND_CONFIG = dawaDash;

const brandConfigs = Object.freeze({
  'dawadash': dawaDash,
  'second-medic': secondMedic,
});

/** @type {{ load: (brandId?: string) => BrandTenantConfig }} */
const brandConfigSource = Object.freeze({
  load: (brandId = process.env.EXPO_PUBLIC_BRAND_ID || ACTIVE_BRAND_CONFIG.brand.id) => {
    const config = brandConfigs[brandId];
    if (!config) throw new Error(`Unknown build-time brand "${brandId}". Add an approved brand configuration before selecting it.`);
    return config;
  },
});

const brandChangeGovernance = Object.freeze({
  async requestChange() {
    throw new Error('Brand changes require mutual JV agreement and an approved deployment. The approval workflow is not configured.');
  },
});

module.exports = { ACTIVE_BRAND_CONFIG, brandConfigSource, brandChangeGovernance };
