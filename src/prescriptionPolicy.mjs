export const PRESCRIPTION_IMAGE_MAX_BYTES = 500_000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function prescriptionIssueStart(issuedOn) {
  if (typeof issuedOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(issuedOn)) return null;
  const day = Date.parse(issuedOn);
  if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== issuedOn) return null;
  return new Date(issuedOn + 'T00:00:00+05:30').toISOString();
}

export function prescriptionIsCurrent(prescription, now) {
  const start = Date.parse(prescription.validFrom);
  return Number.isFinite(start) && start <= now && now < start + SEVEN_DAYS_MS;
}

export function prescriptionAction(prescription, now) {
  if (prescription.status === 'reupload_required') return 'reupload_required';
  if (prescription.status === 'verified' && !prescriptionIsCurrent(prescription, now)) return 'expired';
  return null;
}
export function requiresScheduledPrescription(order) {
  // Classifications must come from the authoritative SKU or diagnostic service, never the customer.
  if (order.kind === 'diagnostic') return order.referralRequired;
  if (!Array.isArray(order.items) || !order.items.length) return undefined;
  let required = false;
  for (const item of order.items) {
    const schedule = item?.prescriptionSchedule;
    if (!['unrestricted', 'H', 'H1', 'X'].includes(schedule)) return undefined;
    if (schedule !== 'unrestricted') required = true;
  }
  return required;
}
