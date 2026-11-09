import React, { createContext, useContext, useMemo, useState } from 'react';
import { MEDICINES } from './data';
import { customerServices } from './services';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children, services = customerServices }) {
  const [user, setUser] = useState(null); // {phone,name}
  const [pendingPhone, setPendingPhone] = useState('');
  const [cart, setCart] = useState({}); // id -> qty
  const [prescription, setPrescription] = useState(null);
  const [orders, setOrders] = useState([]);
  const [labBookings, setLabBookings] = useState([]);

  const value = useMemo(() => {
    const lines = Object.entries(cart).flatMap(([id, qty]) => {
      const medicine = MEDICINES.find((item) => item.id === id);
      return medicine ? [{ ...medicine, qty }] : [];
    });
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    return {
      user, setUser, pendingPhone, setPendingPhone, cart, lines, subtotal,
      count: lines.reduce((s, l) => s + l.qty, 0),
      setQty: (id, q) => setCart((c) => { const n = { ...c }; if (q <= 0) delete n[id]; else n[id] = q; return n; }),
      prescription, setPrescription, orders, setOrders, labBookings,
      attachPrescription: async (input) => {
        const saved = await services.uploadPrescription(input);
        const selected = { ...saved, source: input.source };
        setPrescription(selected);
        return selected;
      },
      listOrders: services.listOrders,
      subscribeOrderStatus: services.subscribeOrderStatus,
      replaceOrderPrescription: async (orderId, input) => {
        const saved = await services.replaceOrderPrescription(orderId, input);
        setOrders((current) => current.map((order) => order.id === orderId
          ? { ...order, prescriptionId: saved.id, prescriptionAction: null }
          : order));
      },
      placeOrder: async (input) => {
        const created = await services.createOrder(input);
        setOrders((current) => [created, ...current]);
        if (input.kind === 'medicine') {
          setCart({});
          setPrescription((current) => current?.id === input.prescriptionId ? null : current);
        }
        return created;
      },
      placeLabBooking: async (testId) => {
        const created = await services.createLabBooking({ testId });
        setLabBookings((current) => [created, ...current]);
        return created;
      },
      logout: () => { setUser(null); setCart({}); setOrders([]); setLabBookings([]); setPrescription(null); },
    };
  }, [user, pendingPhone, cart, prescription, orders, labBookings, services]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
