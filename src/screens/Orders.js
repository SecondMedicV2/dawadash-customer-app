import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Badge, Btn, Card, fulfillmentLabels, Icon, notify, SectionTitle, T, Text, TextInput } from '../ui';
import { useApp } from '../store';
import { inrPaise } from '../apiClient';
import { C, BRAND } from '../theme';
import { Header } from './Catalog';

function stageOf(order) {
  const status = String(order.status || 'ORDER_PLACED').toUpperCase();
  if (['REJECTED', 'CANCELLED', 'PAYMENT_FAILED', 'DELIVERY_FAILED', 'REFUND_PENDING', 'REFUNDED', 'RETURNED'].includes(status)) return -1;
  if (['ORDER_PLACED', 'SUBMITTED', 'REVIEW_PENDING', 'STORE_ASSIGNMENT_PENDING', 'PAYMENT_CONFIRMED', 'PAYMENT_PENDING'].includes(status)) return 1;
  if (['ACCEPTED', 'STORE_ASSIGNED', 'STORE_ACCEPTED', 'HOLD_MANUAL_DISPATCH', 'PREPARING', 'READY_FOR_HANDOFF', 'RIDER_ASSIGNMENT_PENDING', 'RIDER_ASSIGNED'].includes(status)) return 2;
  if (['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(status)) return 3;
  if (['DELIVERED', 'COMPLETED'].includes(status)) return 5;
  return 1;
}

const statusTone = (status) => {
  const st = String(status || '').toUpperCase();
  if (['DELIVERED', 'COMPLETED'].includes(st)) return 'ok';
  if (['REJECTED', 'CANCELLED', 'PAYMENT_FAILED', 'DELIVERY_FAILED', 'RETURNED'].includes(st)) return 'err';
  if (['ACCEPTED', 'STORE_ACCEPTED', 'PREPARING', 'READY_FOR_HANDOFF', 'RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(st)) return 'mint';
  return 'warn';
};

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
          {now && <Badge text="Active" tone="warn" />}
          {state === 'next' && <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600' }}>Up next</Text>}
        </View>
        {sub ? <Text style={{ fontSize: 12, color: done || now ? C.text2 : C.muted, marginTop: 2 }}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function LiveTrackingPanel({ order, fetchOrderTracking }) {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTracking = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOrderTracking(order.id);
      setTracking(data);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Unable to fetch live location.');
    } finally {
      setLoading(false);
    }
  }, [fetchOrderTracking, order.id]);

  useEffect(() => {
    void loadTracking();
    const timer = setInterval(() => { void loadTracking(); }, 20000);
    return () => clearInterval(timer);
  }, [loadTracking]);

  const loc = tracking?.latestLocation;
  const osmUrl = loc
    ? `https://www.openstreetmap.org/?mlat=${loc.latitude}&mlon=${loc.longitude}#map=16/${loc.latitude}/${loc.longitude}`
    : null;
  const osmEmbed = loc
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${loc.longitude - 0.008},${loc.latitude - 0.006},${loc.longitude + 0.008},${loc.latitude + 0.006}&layer=mapnik&marker=${loc.latitude},${loc.longitude}`
    : null;

  const callPhone = (phone, label) => {
    const clean = String(phone || '').replace(/\s+/g, '');
    if (!clean) {
      notify(label, 'Phone contact unavailable.');
      return;
    }
    Linking.openURL(`tel:${clean}`).catch(() => notify(label, clean));
  };

  return (
    <Card>
      <SectionTitle
        icon="map-marker-path"
        title="Live delivery tracking"
        right={<Btn small variant="soft" title={loading ? 'Refreshing…' : 'Refresh GPS'} icon="crosshairs-gps" onPress={loadTracking} />}
      />
      {tracking?.rider ? (
        <Text style={{ fontSize: 13, fontWeight: '700', marginBottom: 4 }}>
          {tracking.rider.fullName} · {tracking.rider.vehicleType} ({tracking.rider.vehicleNumber})
        </Text>
      ) : null}
      {error ? <Text style={{ fontSize: 12, color: C.errText, marginBottom: 6 }}>{error}</Text> : null}
      {loc ? (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <Badge
              text={loc.isStale ? `Stale GPS (${loc.ageSeconds}s old)` : `Live GPS (${loc.ageSeconds}s ago)`}
              tone={loc.isStale ? 'warn' : 'ok'}
              icon={loc.isStale ? 'alert-outline' : 'crosshairs-gps'}
            />
            <Text style={{ fontSize: 11, color: C.text2 }}>
              Updated {new Date(loc.capturedAt).toLocaleTimeString()}
              {loc.accuracyMeters !== null ? ` · ±${Math.round(loc.accuracyMeters)}m` : ''}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: C.text2 }}>
            Coordinates: {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)} · Refreshes every 20s
          </Text>
          {Platform.OS === 'web' && osmEmbed ? (
            <View style={{ height: 190, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.border }}>
              {React.createElement('iframe', {
                title: `Rider location for ${order.orderNumber}`,
                src: osmEmbed,
                style: { width: '100%', height: '100%', border: '0' },
                loading: 'lazy',
              })}
            </View>
          ) : null}
          {osmUrl ? (
            <Btn small variant="outline" title="Open Live Pin on Map" icon="open-in-new" onPress={() => Linking.openURL(osmUrl).catch(() => notify('Live coordinates', `${loc.latitude}, ${loc.longitude}`))} />
          ) : null}
        </View>
      ) : (
        <View style={{ padding: 10, borderRadius: 10, backgroundColor: C.well }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.text2 }}>
            Waiting for delivery partner GPS permission or coordinate fix.
          </Text>
          <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            No synthetic or fixed coordinates are displayed when GPS is unavailable.
          </Text>
        </View>
      )}
      <Text style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
        {tracking?.etaMinutes ? `Estimated arrival: ${tracking.etaMinutes} min` : 'ETA requires configured mapping service.'}
      </Text>
      {(tracking?.retailerLocation?.phone || tracking?.rider?.phone) ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          {tracking?.retailerLocation?.phone ? (
            <Btn small variant="soft" title="Call Pharmacy" icon="phone" onPress={() => callPhone(tracking.retailerLocation.phone, 'Pharmacy')} style={{ flex: 1 }} />
          ) : null}
          {tracking?.rider?.phone ? (
            <Btn small variant="soft" title="Call Rider" icon="phone-in-talk" onPress={() => callPhone(tracking.rider.phone, 'Delivery Partner')} style={{ flex: 1 }} />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const ISSUE_CATEGORIES = [
  ['DELAY', 'Delay'],
  ['WRONG_ITEM', 'Wrong item'],
  ['QUALITY', 'Quality'],
  ['BILLING', 'Billing'],
  ['OTHER', 'Other'],
];

function OrderCard({ order, onCancel, onRetryPayment, fetchOrderTracking, onSubmitReview, onSubmitComplaint, busyOrderId }) {
  const stage = stageOf(order);
  const pickup = order.fulfillmentMode === 'counter_pickup';
  const statusLabel = String(order.status || 'ORDER_PLACED').replaceAll('_', ' ');
  const payLabel = String(order.paymentStatus || 'PENDING').replaceAll('_', ' ');
  const busy = busyOrderId === order.id;
  const canRetry = order.paymentMode === 'online_prepaid' && ['PAYMENT_FAILED', 'PAYMENT_PENDING'].includes(order.status);
  const canCancel = ['PAYMENT_PENDING', 'PAYMENT_FAILED', 'ORDER_PLACED', 'ACCEPTED'].includes(order.status);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueCategory, setIssueCategory] = useState('DELAY');
  const [issueText, setIssueText] = useState('');
  const steps = [
    ['file-check-outline', 'Order placed', `Submitted to ${order.retailer?.pharmacyName || 'pharmacy'}${order.prescriptionRequired ? ' · Rx checked' : ''}`],
    ['package-variant-closed', 'Pharmacy verification & packing', 'Registered pharmacist review and batch packing'],
    pickup ? ['storefront-outline', 'Ready at counter', 'Collect from pharmacy counter'] : ['moped-outline', 'Out for delivery', order.rider ? `Rider: ${order.rider.fullName}` : 'Courier handover'],
    ['check-decagram-outline', 'Delivered', order.paymentMode === 'cash_on_delivery' ? 'COD settled on delivery' : 'Completed'],
  ];

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <Badge text={statusLabel} tone={statusTone(order.status)} icon="clock-outline" />
          <Badge text={`Pay: ${payLabel}`} tone={order.paymentStatus === 'PAID' || order.paymentStatus === 'COLLECTED' ? 'ok' : order.paymentStatus === 'FAILED' ? 'err' : 'soft'} />
          {!!fulfillmentLabels[order.fulfillmentMode] && <Badge text={fulfillmentLabels[order.fulfillmentMode]} tone="soft" />}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 }}>
          <Text style={{ flex: 1, fontSize: 18, fontWeight: '800' }} numberOfLines={1}>
            {order.orderNumber || `Order #${String(order.id).slice(-8).toUpperCase()}`}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: C.primaryDark }}>{inrPaise(order.totalPaise)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Icon name="clock-outline" size={13} color={C.muted} />
          <Text style={{ fontSize: 12, color: C.muted }}>
            Placed {timeAgo(order.createdAt)} · {order.retailer?.pharmacyName || 'Verified pharmacy'} · {order.paymentMode === 'cash_on_delivery' ? 'COD' : 'Prepaid'}
          </Text>
        </View>
        {stage > 0 && order.deliveryOtp && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, padding: 8, borderRadius: 10, backgroundColor: C.highlight }}>
            <Text style={{ fontSize: 12, color: C.text2, fontWeight: '600' }}>Share OTP at delivery handover</Text>
            <Badge text={`OTP ${order.deliveryOtp}`} tone="mint" />
          </View>
        )}
        {stage > 0 ? (
          <View style={s.track}><View style={[s.trackFill, { width: `${Math.min(1, stage / 4) * 100}%` }]} /></View>
        ) : (
          <Text style={{ fontSize: 12, color: C.errText, marginTop: 8 }}>
            {order.rejectionReason ? `Reason: ${order.rejectionReason}` : 'Order halted'}
          </Text>
        )}
        {(canRetry || canCancel) && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            {canRetry ? <Btn small disabled={busy} title={busy ? 'Updating…' : 'Retry payment'} icon="refresh" onPress={() => onRetryPayment(order)} style={{ flex: 1 }} /> : null}
            {canCancel ? <Btn small variant="soft" disabled={busy} title="Cancel order" icon="close-circle-outline" onPress={() => onCancel(order)} style={{ flex: 1 }} /> : null}
          </View>
        )}
      </Card>

      {!pickup && ['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(order.status) && (
        <LiveTrackingPanel order={order} fetchOrderTracking={fetchOrderTracking} />
      )}

      {stage > 0 && (
        <Card>
          <SectionTitle icon="clipboard-check-outline" title="Order progress" right={<Badge text={stage > 4 ? 'Completed' : `Step ${stage} of 4`} tone="mint" />} />
          {steps.map(([icon, title, sub], i) => (
            <Milestone key={title} icon={icon} title={title} sub={sub} last={i === steps.length - 1}
              state={i < stage - 1 ? 'done' : i === stage - 1 ? 'now' : 'next'} />
          ))}
        </Card>
      )}

      {(order.items || []).length > 0 && (
        <Card>
          <SectionTitle icon="pill" title={`Items (${order.items.length})`} />
          {order.items.map((line, index) => (
            <View key={line.id || `${line.medicineId}-${index}`} style={s.item}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600' }}>{line.medicineName}</Text>
                <Text style={{ fontSize: 11, color: C.muted }}>Qty {line.quantity} · {line.packSize}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700' }}>{inrPaise(line.lineTotalPaise)}</Text>
            </View>
          ))}
          {order.deliveryAddress && (
            <T style={{ fontSize: 12, marginTop: 8 }}>
              {pickup ? 'Pickup store: ' : 'Delivery to: '}
              {[order.deliveryAddress.addressLine, order.deliveryAddress.locality, order.deliveryAddress.pincode].filter(Boolean).join(', ')}
            </T>
          )}
        </Card>
      )}

      {(order.status === 'REFUND_PENDING' || order.status === 'REFUNDED') && (
        <Card>
          <SectionTitle
            icon="cash-refund"
            title={order.status === 'REFUNDED' ? 'Refund completed' : 'Refund initiated'}
            right={<Badge text={order.status === 'REFUNDED' ? 'REFUNDED' : 'PENDING'} tone={order.status === 'REFUNDED' ? 'ok' : 'warn'} />}
          />
          <T style={{ fontSize: 12 }}>
            {order.payment?.refundReference
              ? `Gateway reference: ${order.payment.refundReference}`
              : 'Refund request logged with payment operations.'}
          </T>
        </Card>
      )}

      {order.status === 'DELIVERED' && (
        <Card>
          <SectionTitle icon="star-outline" title="Rate your order" right={order.review ? <Badge text={`${order.review.rating}/5`} tone="ok" /> : null} />
          {order.review ? (
            <View>
              <Text style={{ fontWeight: '700', color: C.primaryDark }}>{'★'.repeat(order.review.rating)}{'☆'.repeat(5 - order.review.rating)}</Text>
              {order.review.comment ? <T style={{ marginTop: 4, fontSize: 13 }}>{order.review.comment}</T> : null}
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setRating(n)}
                    accessibilityRole="button"
                    accessibilityLabel={`Rate ${n} stars`}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: rating >= n ? C.primary : C.border,
                      backgroundColor: rating >= n ? C.mint : C.white,
                    }}
                  >
                    <Text style={{ fontWeight: '700', color: rating >= n ? C.primaryDark : C.text2 }}>{n}★</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput value={comment} onChangeText={setComment} placeholder="Share feedback about delivery or medicines (optional)" />
              <Btn
                small
                disabled={busy}
                title={busy ? 'Submitting…' : 'Submit review'}
                icon="check"
                onPress={() => onSubmitReview(order.id, { rating, comment })}
              />
            </View>
          )}
        </Card>
      )}

      {order.status !== 'PAYMENT_PENDING' && (
        <Card>
          <SectionTitle
            icon="lifebuoy"
            title="Support & issues"
            right={
              <Btn
                small
                variant="soft"
                title={issueOpen ? 'Close' : 'Report issue'}
                onPress={() => setIssueOpen((v) => !v)}
              />
            }
          />
          {Array.isArray(order.complaints) && order.complaints.length > 0 && (
            <View style={{ gap: 6, marginBottom: issueOpen ? 10 : 0 }}>
              {order.complaints.map((c) => (
                <View key={c.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700' }}>{c.category.replaceAll('_', ' ')}</Text>
                    <Text style={{ fontSize: 12, color: C.text2 }}>{c.description}</Text>
                  </View>
                  <Badge text={c.status} tone={c.status === 'RESOLVED' ? 'ok' : 'warn'} />
                </View>
              ))}
            </View>
          )}
          {issueOpen && (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {ISSUE_CATEGORIES.map(([code, label]) => (
                  <Pressable
                    key={code}
                    onPress={() => setIssueCategory(code)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: issueCategory === code ? C.primary : C.border,
                      backgroundColor: issueCategory === code ? C.mint : C.white,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: issueCategory === code ? C.primaryDark : C.text2 }}>{label}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={issueText}
                onChangeText={setIssueText}
                placeholder="Describe what went wrong (min 5 characters)"
              />
              <Btn
                small
                disabled={busy || issueText.trim().length < 5}
                title={busy ? 'Sending…' : 'Submit issue'}
                icon="send-outline"
                onPress={async () => {
                  const ok = await onSubmitComplaint(order.id, { category: issueCategory, description: issueText.trim() });
                  if (ok) {
                    setIssueText('');
                    setIssueOpen(false);
                  }
                }}
              />
            </View>
          )}
        </Card>
      )}
    </View>
  );
}

export function OrdersScreen({ navigation }) {
  const { user, orders, notifications, listOrders, setOrders, retryOrderPayment, cancelCustomerOrder, initiateRazorpayOrder, fetchOrderTracking, markNotificationRead, submitOrderReview, submitOrderComplaint, subscribeOrderStatus } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const unreadAlerts = (notifications || []).filter((n) => !n.readAt).slice(0, 3);

  const load = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const latest = await listOrders();
      if (Array.isArray(latest)) setOrders(latest);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetryPayment = async (order) => {
    setBusyOrderId(order.id);
    try {
      await retryOrderPayment(order.id);
      await initiateRazorpayOrder(order.id);
      await load();
    } catch (err) {
      notify('Payment retry', err?.message || 'Unable to restart payment.');
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleCancelOrder = async (order) => {
    setBusyOrderId(order.id);
    try {
      await cancelCustomerOrder(order.id, 'Cancelled by customer');
      await load();
    } catch (err) {
      notify('Cancellation failed', err?.message || 'Order cannot be cancelled at this stage.');
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleSubmitReview = async (orderId, payload) => {
    setBusyOrderId(orderId);
    try {
      await submitOrderReview(orderId, payload);
      notify('Thank you!', 'Your rating was recorded.');
    } catch (err) {
      notify('Review failed', err?.message || 'Unable to submit review.');
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleSubmitComplaint = async (orderId, payload) => {
    setBusyOrderId(orderId);
    try {
      await submitOrderComplaint(orderId, payload);
      notify('Support ticket opened', 'The pharmacy team has been notified.');
      return true;
    } catch (err) {
      notify('Issue failed', err?.message || 'Unable to submit issue.');
      return false;
    } finally {
      setBusyOrderId(null);
    }
  };

  useEffect(() => {
    void load();
    const unfocus = navigation.addListener('focus', () => { void load(); });
    return unfocus;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, user?.id]);

  useEffect(() => {
    if (!user || !orders.length || typeof subscribeOrderStatus !== 'function') return undefined;
    const activeOrders = orders.filter((o) => {
      const st = String(o.status || '').toUpperCase();
      return !['DELIVERED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'REFUNDED', 'RETURNED'].includes(st);
    });
    if (!activeOrders.length) return undefined;

    const unsubs = activeOrders.map((ord) =>
      subscribeOrderStatus(ord.id, (update) => {
        if (update?.status) {
          setOrders((prev) =>
            prev.map((o) => (o.id === ord.id ? { ...o, status: update.status, updatedAt: update.updatedAt } : o))
          );
        }
      })
    );

    return () => {
      unsubs.forEach((unsub) => {
        try { unsub?.(); } catch {}
      });
    };
  }, [user, orders, subscribeOrderStatus, setOrders]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={C.primary} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '800' }}>My Orders</Text>
            <Text style={{ fontSize: 13, color: C.text2 }}>Live status from verified {BRAND.brand.name} pharmacies.</Text>
          </View>
          {user ? <Btn small variant="soft" title="Refresh" icon="refresh" onPress={load} /> : null}
        </View>

        {!user && (
          <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '700' }}>Sign in to track your orders</Text>
            <T style={{ textAlign: 'center', marginTop: 4, marginBottom: 12 }}>Log in with your phone or password to view live order updates.</T>
            <Btn title="Log in" icon="login" onPress={() => navigation.navigate('Login')} />
          </Card>
        )}

        {user && unreadAlerts.length > 0 && (
          <Card>
            <SectionTitle icon="bell-ring-outline" title={`Updates (${unreadAlerts.length})`} />
            <View style={{ gap: 8 }}>
              {unreadAlerts.map((n) => (
                <View key={n.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700' }}>{n.title}</Text>
                    <Text style={{ fontSize: 12, color: C.text2 }}>{n.body}</Text>
                  </View>
                  <Btn small variant="soft" title="Read" onPress={() => void markNotificationRead(n.id)} />
                </View>
              ))}
            </View>
          </Card>
        )}

        {user && orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            busyOrderId={busyOrderId}
            fetchOrderTracking={fetchOrderTracking}
            onSubmitReview={handleSubmitReview}
            onSubmitComplaint={handleSubmitComplaint}
            onRetryPayment={handleRetryPayment}
            onCancel={handleCancelOrder}
          />
        ))}

        {user && !orders.length && (
          <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
            <View style={s.emptyIc}><Icon name="clipboard-check-outline" size={36} color={C.primaryDark} /></View>
            <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 12 }}>No orders placed yet</Text>
            <T style={{ textAlign: 'center', marginTop: 4 }}>Orders placed at nearby verified pharmacies appear here immediately.</T>
          </Card>
        )}
        <Btn title="Browse medicines" icon="magnify" onPress={() => navigation.navigate('Medicines')} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  track: { height: 6, borderRadius: 3, backgroundColor: C.input, marginTop: 12, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: C.primaryDark },
  node: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.input, alignItems: 'center', justifyContent: 'center' },
  rail: { width: 2, flex: 1, minHeight: 18, backgroundColor: C.border, marginVertical: 2 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderColor: C.well },
  emptyIc: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
});
