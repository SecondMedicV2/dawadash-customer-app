import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Badge, Btn, Card, fulfillmentLabels, H, Icon, T } from '../ui';
import { useApp } from '../store';
import { MEDICINES } from '../data';
import { BRAND, C } from '../theme';
import { Header } from './Catalog';

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
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <H>{connected ? 'Orders' : 'Order requests'}</H>
        {!connected && <Card style={{ backgroundColor: C.teal50 }}>
          <Text style={{ fontWeight: '700' }}>{BRAND.brand.disclaimers.orderRecordLabel}</Text>
          <T style={{ fontSize: 12, marginTop: 4 }}>{BRAND.brand.disclaimers.orderRequests}</T>
        </Card>}
        {orders.map((order) => {
          const refill = order.kind === 'refill';
          const entries = (order.items || []).map((line) => ({
            ...line,
            medicine: MEDICINES.find((item) => item.id === line.medicineId),
          }));
          return (
            <Card key={order.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name={refill ? 'autorenew' : 'pill'} />
                  <Text style={{ fontWeight: '700' }}>{refill ? 'Refill request' : 'Medicine order'}</Text>
                </View>
                <Badge text={connected
                  ? (order.deliveryStatus || order.status || 'pending').replaceAll('_', ' ')
                  : BRAND.brand.disclaimers.orderRequestStatus} tone="warn" />
              </View>
              <T style={{ fontSize: 12, marginTop: 6 }}>
                Reference {order.id}{!connected ? ` · ${BRAND.brand.disclaimers.orderReferenceStatus}` : ''}
              </T>
              {!!fulfillmentLabels[order.fulfillmentMode] && <T>{fulfillmentLabels[order.fulfillmentMode]}</T>}
              {order.fulfillmentMode === 'counter_pickup' && order.pickupStore && (
                <T>{[order.pickupStore.name, order.pickupStore.address].filter(Boolean).join(' · ')}</T>
              )}
              {['reupload_required', 'expired'].includes(order.prescriptionAction) && (
                <View style={{ gap: 8, marginTop: 8 }}>
                  <T>{order.prescriptionAction === 'expired'
                    ? 'Your prescription is outside the seven-day window. Upload a current prescription.'
                    : 'Your prescription could not be verified. Please upload a new photo or PDF.'}</T>
                  <Btn title="Re-upload prescription" onPress={() => navigation.navigate('Scanner', { orderId: order.id })} />
                </View>
              )}
              {entries.map((line, index) => (
                <Text key={`${line.medicineId}-${index}`} style={{ marginTop: 6, color: C.text2 }}>
                  {line.medicine?.name || 'Medicine'} · quantity {line.quantity}
                  {order.rejectedItemIds?.includes(line.id) ? ' · Rejected by store' : ''}
                </Text>
              ))}
            </Card>
          );
        })}
        {!orders.length && (
          <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
            <Icon name="clipboard-list-outline" size={40} color={C.muted} />
            <H style={{ fontSize: 16, marginTop: 8 }}>No order requests yet</H>
            <T style={{ textAlign: 'center', marginTop: 4 }}>Medicine orders and refills you request will appear here.</T>
          </Card>
        )}
        <Btn title="Browse medicines" icon="magnify" onPress={() => navigation.navigate('Medicines')} />
        <Btn title="Book a lab test" icon="flask-outline" variant="secondary" onPress={() => navigation.navigate('Labs')} />
      </ScrollView>
    </View>
  );
}
