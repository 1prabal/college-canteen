import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, CheckCircle2, ChefHat, PackageCheck, AlertCircle } from 'lucide-react';

export default function OrderTracker({ initialOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const [wsStatus, setWsStatus] = useState('connecting');

  useEffect(() => {
    if (!order?.id) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/order/${order.id}`);

    ws.onopen = () => setWsStatus('connected');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ORDER_STATUS_UPDATED') {
          setOrder((prev) => ({ ...prev, status: data.status }));
        }
      } catch (err) {
        console.error('Failed to parse WS payload', err);
      }
    };

    ws.onclose = () => setWsStatus('disconnected');
    ws.onerror = () => setWsStatus('error');

    return () => ws.close();
  }, [order?.id]);

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-oatmeal-300 rounded-3xl text-center shadow-paper">
        <Clock className="w-10 h-10 text-oatmeal-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-ink-900 mb-1">No Active Order</h2>
        <p className="text-xs text-ink-500">Pick delicious items from a campus canteen to start your order.</p>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING', label: 'Order Placed', icon: Clock, desc: 'Sent to kitchen' },
    { key: 'PREPARING', label: 'In Kitchen', icon: ChefHat, desc: 'Fresh preparation' },
    { key: 'READY', label: 'Ready for Pickup', icon: PackageCheck, desc: 'Show QR at counter' },
  ];

  const getStepIndex = (status) => {
    if (status === 'PREPARING') return 1;
    if (status === 'READY') return 2;
    if (status === 'COMPLETED') return 3;
    return 0;
  };

  const currentIndex = getStepIndex(order.status);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
      {/* Tactile Paper Order Ticket */}
      <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 sm:p-8 shadow-paper-elevated relative overflow-hidden">
        
        {/* Ticket Header */}
        <div className="flex items-center justify-between border-b border-oatmeal-200 pb-5 mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Campus Pickup Pass</span>
            <h1 className="text-2xl font-black text-ink-900 tracking-tight">#{order.order_number}</h1>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-sage-50 text-sage-700 border border-sage-200">
            <span className="w-2 h-2 rounded-full bg-sage-600 animate-pulse" />
            <span>{wsStatus === 'connected' ? 'Live Kitchen Sync' : 'Reconnecting...'}</span>
          </div>
        </div>

        {/* Step Progress Stepper */}
        <div className="relative mb-8">
          <div className="absolute top-5 left-6 right-6 h-0.5 bg-oatmeal-200 -z-0" />
          <div
            className="absolute top-5 left-6 h-0.5 bg-sage-600 transition-all duration-500 -z-0"
            style={{ width: `${(currentIndex / 2) * 80}%` }}
          />

          <div className="flex justify-between relative z-10">
            {steps.map((step, idx) => {
              const isDone = currentIndex >= idx;
              const isCurrent = currentIndex === idx;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex flex-col items-center text-center max-w-[90px]">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                      isDone
                        ? 'bg-sage-600 text-white shadow-paper'
                        : 'bg-oatmeal-100 border border-oatmeal-200 text-ink-400'
                    } ${isCurrent ? 'ring-4 ring-sage-100' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-bold mt-2 ${isDone ? 'text-ink-900' : 'text-ink-400'}`}>
                    {step.label}
                  </span>
                  <span className="text-[10px] text-ink-500 mt-0.5 hidden sm:inline">{step.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* QR Code Pass Container */}
        <div className="bg-cream-100 border border-oatmeal-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-5 mb-6 shadow-xs">
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-600">Scan at Counter</span>
            <h3 className="font-bold text-sm text-ink-900 mt-0.5">Collect When Status is "Ready"</h3>
            <p className="text-xs text-ink-500 mt-1">Present this QR code to the canteen staff to collect your meal.</p>
          </div>

          <div className="p-3 bg-white border border-oatmeal-200 rounded-2xl shadow-xs shrink-0">
            <QRCodeSVG value={`ORDER-${order.order_number}-${order.id}`} size={110} />
          </div>
        </div>

        {/* Order Breakdown */}
        <div className="border-t border-oatmeal-200 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3">Order Summary</h4>
          <div className="space-y-2 text-xs">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-ink-700">
                <span>{item.quantity}x {item.menu_item?.name || `Item #${item.menu_item_id}`}</span>
                <span className="font-bold text-ink-900">₹{(item.quantity * item.unit_price).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center text-sm font-bold text-ink-900 pt-3 border-t border-oatmeal-100">
              <span>Total Paid</span>
              <span>₹{order.total_price.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
