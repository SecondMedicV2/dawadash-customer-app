import { isInventoryId } from './inventoryChanges.mjs';

/** @type {(...args: unknown[]) => never} */
const unconfigured = () => { throw new Error('Delivery policy is not configured.'); };

export const unconfiguredDeliveryPolicies = Object.freeze({
  authorizeRelease: unconfigured,
  canTransitionOrder: unconfigured,
  granularPermissions: unconfigured,
  recordOverrideAudit: unconfigured,
  notifyCustomer: unconfigured,
  resolveRejectedItems: unconfigured,
  approveSubstitute: unconfigured,
  approveLocalRate: unconfigured,
  classifyRestrictedSku: unconfigured,
  administerStoreHiddenFlag: unconfigured,
  onboardStoreStaff: unconfigured,
  resolveUnavailableDelivery: unconfigured,
  resolveMasterStockRetailStore: unconfigured,
  trackDeliveryLocation: unconfigured,
  manageDeliveryStaffWork: unconfigured,
});

export const unconfiguredOrderStatusTransport = Object.freeze({ publish: unconfigured, subscribe: unconfigured });

const flagNames = ['hidden', 'notForSale', 'outOfStock'];
const orderActions = ['approve', 'delay', 'reject-item', 'dispatch', 'complete'];
const pageSize = 50;

function page(rows) {
  const items = rows.slice(0, pageSize);
  return { items, nextAfter: rows.length > pageSize ? items.at(-1).id : null };
}

export function createDeliveryOperations({ orders, repository, statusTransport = unconfiguredOrderStatusTransport,
  authorizeRelease = unconfiguredDeliveryPolicies.authorizeRelease }) {
  async function attachDeliveryUpdates(rows) {
    const updates = await repository.readUpdates(rows.map(({ id }) => id));
    const byAssignment = new Map(updates.map((update) => [JSON.stringify([update.orderId, update.storeId]), update]));
    return rows.map((order) => {
      const update = byAssignment.get(JSON.stringify([order.id, order.storeId]));
      return { ...order, deliveryStatus: update?.status ?? null, rejectedItemIds: update?.rejectedItemIds ?? [] };
    });
  }

  function storeFor(actor) {
    if (actor.role !== 'retail_store' || !isInventoryId(actor.storeId)) throw new Error('Store access denied.');
    return actor.storeId;
  }

  function requireAdmin(actor) {
    if (actor.role !== 'admin') throw new Error('Admin access denied.');
  }

  return {
    attachDeliveryUpdates,

    async listOrders(actor, after) {
      const storeId = actor.role === 'admin' ? null : storeFor(actor);
      const rows = await orders.listForOperations({ storeId, after, limit: pageSize + 1 });
      const visible = storeId === null ? rows : rows.filter((row) => row.storeId === storeId);
      return page(await attachDeliveryUpdates(visible.map(({ id, storeId, sourceId, status, fulfillmentMode, items = [] }) => ({
        id, storeId, sourceId, status, fulfillmentMode, items: items.map(({ id, medicineId }) => ({ id, medicineId })),
      }))));
    },

    async updateOrder(actor, orderId, action, input) {
      const storeId = storeFor(actor);
      if (!orderActions.includes(action)) throw new Error('Invalid delivery action.');
      const committed = await orders.withOrder(orderId, async (order, db) => {
        if (order?.id !== orderId || order.storeId !== storeId || !['medicine', 'refill'].includes(order.kind)) return null;
        if (!isInventoryId(order.customerId)) throw new Error('Order owner is unavailable.');
        const pickup = order.fulfillmentMode === 'counter_pickup';
        if (!pickup && order.fulfillmentMode !== 'store_delivery') throw new Error('Order fulfillment mode is unavailable.');
        let rejectedItemId = null;
        if (action === 'reject-item') {
          rejectedItemId = input?.itemId;
          if (!isInventoryId(rejectedItemId) || !order.items.some(({ id }) => id === rejectedItemId)) {
            throw new Error('Order item unavailable.');
          }
        }
        const releasesOrder = action === 'dispatch' || (action === 'complete' && pickup);
        if ((action === 'approve' || releasesOrder) && await repository.hasBlockedItems(db, storeId, order.items.map(({ medicineId }) => medicineId))) {
          throw new Error('Order includes a blocked store item.');
        }
        if (releasesOrder && (order.packed !== true || await authorizeRelease(order, db) !== true)) {
          throw new Error('Order release is unavailable.');
        }
        const statuses = {
          approve: 'approved', delay: 'delayed', dispatch: pickup ? 'ready_for_pickup' : 'dispatched',
          complete: pickup ? 'picked_up' : 'delivered',
        };
        const update = await repository.saveUpdate(db, orderId, storeId, statuses[action] ?? null, rejectedItemId);
        if ((action === 'approve' || releasesOrder) && update.rejectedItemIds.length) throw new Error('Order includes a rejected item.');
        return { update, customerId: order.customerId };
      });
      if (!committed) return null;
      let liveUpdateSent = true;
      try {
        await statusTransport.publish(committed.customerId, { orderId });
      } catch {
        liveUpdateSent = false;
      }
      return { ...committed.update, liveUpdateSent };
    },

    readOverride(actor, skuId) {
      return repository.readOverride(storeFor(actor), skuId);
    },

    saveOverride(actor, skuId, input) {
      const storeId = storeFor(actor);
      const fields = Object.keys(input);
      if (!fields.length || !fields.every((key) => {
        if (flagNames.includes(key)) return typeof input[key] === 'boolean';
        if (key === 'proposedRatePaise') return typeof input[key] === 'string' && /^\d+$/.test(input[key]);
        return key === 'suggestedSkuId' && isInventoryId(input[key]) && input[key] !== skuId;
      })) throw new Error('Invalid store override.');
      return repository.saveOverride(storeId, skuId, input);
    },

    readCatalogRecord(actor, skuId) {
      requireAdmin(actor);
      return repository.readCatalogRecord(skuId);
    },

    saveCatalogEdit(actor, skuId, input) {
      requireAdmin(actor);
      return repository.saveCatalogEdit(skuId, input);
    },

    async listTransactions(actor, after) {
      requireAdmin(actor);
      return page(await repository.listTransactions(after, pageSize + 1));
    },
  };
}
