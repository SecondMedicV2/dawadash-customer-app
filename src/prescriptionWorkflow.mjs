import { PRESCRIPTION_IMAGE_MAX_BYTES, prescriptionAction, prescriptionIsCurrent, prescriptionIssueStart, requiresScheduledPrescription } from './prescriptionPolicy.mjs';

const jpegSignature = [0xff, 0xd8, 0xff];
const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2d];

async function startsWith(file, signature) {
  const bytes = new Uint8Array(await file.slice(0, signature.length).arrayBuffer());
  return signature.every((byte, index) => bytes[index] === byte);
}

// Server-only. The host supplies authenticated actors and transactional adapters.
export function createPrescriptionWorkflow(ports, now = Date.now) {
  async function prepareFile(source, file) {
    if (!(file instanceof Blob) || !file.size || !['camera', 'pdf'].includes(source)) {
      throw new Error('A camera photo or PDF is required.');
    }
    if (source === 'pdf') {
      if (file.type !== 'application/pdf' || !await startsWith(file, pdfSignature)) throw new Error('A PDF is required.');
      return file;
    }
    if (file.type === 'image/jpeg') {
      if (!await startsWith(file, jpegSignature)) throw new Error('A JPEG photo is required.');
      if (file.size <= PRESCRIPTION_IMAGE_MAX_BYTES) return file;
    }
    const jpeg = await ports.compressCameraPhoto?.(file, PRESCRIPTION_IMAGE_MAX_BYTES);
    if (!(jpeg instanceof Blob) || jpeg.type !== 'image/jpeg' || jpeg.size > PRESCRIPTION_IMAGE_MAX_BYTES ||
        !await startsWith(jpeg, jpegSignature)) {
      throw new Error('A JPEG photo of 500 KB or less is required.');
    }
    return jpeg;
  }

  return {
    async upload(customerId, { source, file }) {
      if (!customerId) throw new Error('Authentication required.');
      const prepared = await prepareFile(source, file);
      const { id } = await ports.storeForReview({ customerId, source, file: prepared });
      return { id, source };
    },

    async verification(customerId, prescriptionId) {
      if (!customerId) throw new Error('Authentication required.');
      const prescription = await ports.findOwnedPrescription(customerId, prescriptionId);
      if (!prescription) throw new Error('Prescription unavailable.');
      const time = now();
      return {
        verified: prescription.status === 'verified' && prescriptionIsCurrent(prescription, time),
        action: prescriptionAction(prescription, time),
      };
    },

    async review(actor, prescriptionId, { decision, issuedOn }) {
      if (!actor?.id || !await ports.canReview(actor, prescriptionId)) throw new Error('Review access denied.');
      if (!['verify', 'request_reupload'].includes(decision)) throw new Error('Invalid review decision.');
      const validFrom = decision === 'verify' ? prescriptionIssueStart(issuedOn) : null;
      if (decision === 'verify' && !prescriptionIsCurrent({ validFrom }, now())) {
        throw new Error('Prescription is outside the seven-day window.');
      }
      const status = decision === 'verify' ? 'verified' : 'reupload_required';
      // Commit once from pending review. The customer sees the committed state as an in-app notice.
      await ports.recordPendingReview({ prescriptionId, reviewerId: actor.id, status, validFrom });
      return { status };
    },

    async replace(customerId, orderId, { source, file }) {
      if (!customerId) throw new Error('Authentication required.');
      return ports.withOrder(orderId, async (order) => {
        if (order.customerId !== customerId || !order.prescriptionId) throw new Error('Order unavailable.');
        const current = await ports.findOwnedPrescription(customerId, order.prescriptionId);
        if (!current || !prescriptionAction(current, now())) throw new Error('Replacement unavailable.');
        const prepared = await prepareFile(source, file);
        // Store the new pending file and swap the order reference as one retry-safe operation.
        const { id } = await ports.replaceForReview({ orderId, previousId: current.id, customerId, source, file: prepared });
        return { id, source };
      });
    },

    async assign(actor, orderId, destination) {
      if (!actor?.id || !await ports.canAssign(actor, orderId)) throw new Error('Assignment access denied.');
      if (!destination?.id || !['retail_partner', 'diagnostic_coordinator'].includes(destination.kind)) {
        throw new Error('Select a destination.');
      }
      // The adapter verifies an active destination and checks that the order can still be assigned.
      await ports.assignDestination(orderId, destination);
    },

    async handoff(orderId) {
      return ports.withOrder(orderId, async (order) => {
        const required = await (ports.requiresPrescription ?? requiresScheduledPrescription)(order);
        if (typeof required !== 'boolean') throw new Error('Prescription policy unavailable.');
        let prescription;
        if (required || order.prescriptionId) {
          if (!order.prescriptionId) throw new Error('A verified prescription is required.');
          prescription = await ports.findOwnedPrescription(order.customerId, order.prescriptionId);
          if (prescription?.status !== 'verified' || !prescriptionIsCurrent(prescription, now())) {
            throw new Error('A current, verified prescription is required.');
          }
        }
        const destination = await ports.findAssignedDestination(order);
        if (!destination?.id || !['retail_partner', 'diagnostic_coordinator'].includes(destination.kind)) {
          throw new Error('Assigned destination unavailable.');
        }
        const compiled = await ports.compile(order);
        if (prescription) {
          // The adapter enforces the prescriber's dispensing directions across orders and retries.
          if (!prescriptionIsCurrent(prescription, now())) throw new Error('A current, verified prescription is required.');
          await ports.reserveDispense(prescription.id, orderId, order);
        }
        return ports.dispatch({ compiled, destination, idempotencyKey: orderId });
      });
    },
  };
}
