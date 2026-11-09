import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Badge, Btn, Card, fulfillmentLabels, Icon, SectionTitle, T, Text } from '../ui';
import { useApp } from '../store';
import { MEDICINES, inr } from '../data';
import { BRAND, C } from '../theme';
import { Header } from './Catalog';

const STATUS_ORDER = ['pending', 'verified', 'packing', 'ready', 'out_for_delivery', 'delivered', 'completed'];

/**
 * Current milestone, 1-based (1 saved, 2 pharmacist, 3 packing, 4 delivery/pickup); 5 = all done.
 * Unknown or pending statuses mean the request is saved and waiting for the pharmacist.
 */
function stageOf(order) {
  const raw = String(order.deliveryStatus || order.status || 'pending').toLowerCase();
  const i = STATUS_ORDER.findIndex((s) => raw.includes(s));
  if (i <= 0) return 2;
  if (i <= 3) return 3;
  return i === 4 ? 4 : 5;
}

const timeAgo = (iso) => {
  if (!iso) return '';
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hours = Math.round(mins / 60);
  return hours < 24 ? `${hours} hr${hours > 1 ? 's' : ''} ago` : new Date(iso).toLocaleDateString();
};

function Milestone({ state, icon, title, sub, last }) {
  const done = state === 'done';
  const now = state === 'now';
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ alignItems: 'center' }}>
        <View style={[s.node, done && { backgroundColor: C.primaryDark }, now && { backgroundColor: C.warnBg, borderColor: C.warn, borderWidth: 2 }]}>
          <Icon name={done ? 'check' : icon} size={18} color={done ? C.white : now ? C.warnText : C.muted} />
        </View>
        {!last && <View style={[s.rail, done && { backgroundColor: C.primaryDark }]} />}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: done || now ? C.text : C.muted }}>{title}</Text>
          {now && <Badge text="Processing" tone="warn" />}
          {state === 'next' && <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600' }}>Up next</Text>}
        </View>
        {sub ? <Text style={{ fontSize: 12, color: done || now ? C.text2 : C.muted, marginTop: 2 }}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function OrderCard({ order, connected, navigation }) {
  const refill = order.kind === 'refill';
  const entries = (order.items || []).map((line) => ({ ...line, medicine: MEDICINES.find((item) => item.id === line.medicineId) }));
  const total = entries.reduce((sum, l) => sum + (l.medicine?.price || 0) * (l.quantity || 1), 0);
  const stage = stageOf(order);
  const pickup = order.fulfillmentMode === 'counter_pickup';
  const steps = [
    ['file-check-outline', 'Order request saved', `${refill ? 'Refill' : 'Medicine'} request${order.prescriptionId ? ' · prescription attached' : ''}`],
    ['medical-bag', 'Pharmacist verification', 'Prescription and dosage check by a registered pharmacist'],
    ['package-variant-closed', 'Packing at partner pharmacy', 'Sealed and labelled for your order'],
    pickup ? ['storefront-outline', 'Ready for counter pickup', 'Collect from the partner pharmacy counter'] : ['moped-outline', 'Out for delivery', `To ${fulfillmentLabels.store_delivery.toLowerCase()} address`],
  ];
  const statusText = connected ? (order.deliveryStatus || order.status || 'pending').replaceAll('_', ' ') : BRAND.brand.disclaimers.orderRequestStatus;
  return (
    <View style={{ gap: 12 }}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Badge text={statusText} tone="warn" icon="clock-outline" />
          {!!fulfillmentLabels[order.fulfillmentMode] && <Badge text={fulfillmentLabels[order.fulfillmentMode]} tone="soft" />}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 }}>
          <Text style={{ flex: 1, fontSize: 20, fontWeight: '800' }} numberOfLines={1}>
            {refill ? 'Refill' : 'Order'} #{String(order.id).replace(/^\w+-/, '').slice(-8).toUpperCase()}
          </Text>
          {total > 0 && <Text style={{ fontSize: 18, fontWeight: '800', color: C.primaryDark }}>{inr(total)}</Text>}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Icon name="clock-outline" size={13} color={C.muted} />
          <Text style={{ fontSize: 12, color: C.muted }}>
            Placed {timeAgo(order.createdAt)}{!connected ? ` · ${BRAND.brand.disclaimers.orderReferenceStatus}` : ''}
          </Text>
        </View>
        <View style={s.track}><View style={[s.trackFill, { width: `${Math.min(1, (stage - 1) / 4) * 100}%` }]} /></View>
      </Card>

      <Card>
        <SectionTitle icon="clipboard-check-outline" title="Verification steps" right={<Badge text={`${stage > 4 ? 'Completed' : `Step ${stage} of 4`}`} tone="mint" />} />
        {steps.map(([icon, title, sub], i) => (
          <Milestone key={title} icon={icon} title={title} sub={sub} last={i === steps.length - 1}
            state={i < stage - 1 ? 'done' : i === stage - 1 ? 'now' : 'next'} />
        ))}
        {['reupload_required', 'expired'].includes(order.prescriptionAction) && (
          <View style={s.alert}>
            <Text style={{ fontSize: 13, color: C.errText, fontWeight: '600' }}>{order.prescriptionAction === 'expired'
              ? 'Your prescription is outside the seven-day window. Upload a current prescription.'
              : 'Your prescription could not be verified. Please upload a new photo or PDF.'}</Text>
            <Btn title="Re-upload prescription" icon="file-upload-outline" small onPress={() => navigation.navigate('Scanner', { orderId: order.id })} style={{ marginTop: 10 }} />
          </View>
        )}
      </Card>

      {entries.length > 0 && (
        <Card>
          <SectionTitle icon="pill" title={`Items (${entries.length})`} />
          {entries.map((line, index) => (
            <View key={`${line.medicineId}-${index}`} style={s.item}>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '600' }}>• {line.medicine?.name || 'Medicine'}</Text>
              <Text style={{ fontSize: 12, color: C.text2 }}>
                Qty {line.quantity}{order.rejectedItemIds?.includes(line.id) ? ' · Rejected by store' : ''}
              </Text>
            </View>
          ))}
          {order.fulfillmentMode === 'counter_pickup' && order.pickupStore && (
            <T style={{ fontSize: 12, marginTop: 6 }}>{[order.pickupStore.name, order.pickupStore.address].filter(Boolean).join(' · ')}</T>
          )}
        </Card>
      )}
    </View>
  );
}

export function OrdersScreen({ navigation }) {
  const { orders, listOrders, setOrders, subscribeOrderStatus } = useApp();
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    let revision = 0;
    let session = 0;
    let disconnect;
    const refresh = async () => {
      const current = ++revision;
      try {
        const latest = await listOrders();
        if (current === revision && navigation.isFocused() && Array.isArray(latest)) {
          setOrders(latest);
          setConnected(true);
        }
      } catch {
        // Keep the last order list if a refresh fails.
      }
    };
    const stop = () => {
      session++;
      revision++;
      disconnect?.();
      disconnect = undefined;
    };
    const start = async () => {
      stop();
      const current = session;
      void refresh();
      try {
        const close = await subscribeOrderStatus?.(() => { if (current === session) void refresh(); });
        if (current !== session) close?.();
        else if (close) {
          disconnect = close;
          void refresh();
        }
      } catch {
        // Focus refresh still reads the last committed order state.
      }
    };
    if (navigation.isFocused()) void start();
    const unfocus = navigation.addListener('focus', start);
    const unblur = navigation.addListener('blur', stop);
    return () => { stop(); unfocus(); unblur(); };
  }, [navigation, listOrders, setOrders, subscribeOrderStatus]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '800' }}>Approvals</Text>
          <Text style={{ fontSize: 13, color: C.text2 }}>Track pharmacist approval for your orders and refills.</Text>
        </View>
        {!connected && orders.length > 0 && (
          <Card style={{ backgroundColor: C.teal50, borderColor: C.mint }}>
            <Text style={{ fontWeight: '700' }}>{BRAND.brand.disclaimers.orderRecordLabel}</Text>
            <Text style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>{BRAND.brand.disclaimers.orderRequests}</Text>
          </Card>
        )}
        {orders.map((order) => <OrderCard key={order.id} order={order} connected={connected} navigation={navigation} />)}
        {!orders.length && (
          <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
            <View style={s.emptyIc}><Icon name="clipboard-check-outline" size={36} color={C.primaryDark} /></View>
            <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 12 }}>No orders awaiting approval</Text>
            <T style={{ textAlign: 'center', marginTop: 4 }}>Medicine orders and refills you place will appear here with their verification steps.</T>
          </Card>
        )}
        <Btn title="Browse medicines" icon="magnify" onPress={() => navigation.navigate('Medicines')} />
        <Btn title="Book a lab test" icon="flask-outline" variant="soft" onPress={() => navigation.navigate('Labs')} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  track: { height: 6, borderRadius: 3, backgroundColor: C.input, marginTop: 12, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: C.primaryDark },
  node: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.input, alignItems: 'center', justifyContent: 'center' },
  rail: { width: 2, flex: 1, minHeight: 18, backgroundColor: C.border, marginVertical: 2 },
  alert: { marginTop: 12, backgroundColor: C.errBg, borderRadius: 12, padding: 12 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderColor: C.well },
  emptyIc: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
});
