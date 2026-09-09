import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Clock, CheckCircle2, ChefHat, PackageCheck, AlertCircle, 
  Receipt, Printer, X, ShieldCheck, ArrowRight, RotateCcw 
} from 'lucide-react';

export default function OrderTracker({ initialOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [billData, setBillData] = useState(null);
  const [billLoading, setBillLoading] = useState(false);

  // Refund request state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundNotice, setRefundNotice] = useState('');

  useEffect(() => {
    if (initialOrder) setOrder(initialOrder);
  }, [initialOrder]);

  useEffect(() => {
    if (!order?.id) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/order/${order.id}`);

    ws.onopen = () => setWsStatus('connected');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ORDER_STATUS_UPDATED') {
          setOrder((prev) => ({ 
            ...prev, 
            status: data.status,
            ...(data.order || {})
          }));
        } else if (data.type === 'PREPARATION_TIME_UPDATED') {
          setOrder((prev) => ({
            ...prev,
            estimated_preparation_minutes: data.estimated_preparation_minutes,
            estimated_ready_at: data.estimated_ready_at,
            ...(data.order || {})
          }));
        }
      } catch (err) {
        console.error('Failed to parse WS payload', err);
      }
    };

    ws.onclose = () => setWsStatus('disconnected');
    ws.onerror = () => setWsStatus('error');

    return () => ws.close();
  }, [order?.id]);

  const fetchBill = async () => {
    if (!order?.id) return;
    setBillLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/bills/${order.id}`);
      if (res.ok) {
        const data = await res.json();
        setBillData(data);
        setBillModalOpen(true);
      } else {
        alert("Bill is currently being generated. Please check in a moment.");
      }
    } catch (e) {
      console.error(e);
      alert("Could not load bill details.");
    } finally {
      setBillLoading(false);
    }
  };

  const handleRequestRefund = async (e) => {
    e.preventDefault();
    if (!refundReason.trim()) return;
    setRefundSubmitting(true);
    setRefundNotice('');
    try {
      const res = await fetch('http://localhost:8000/api/refunds/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          reason: refundReason
        })
      });
      if (res.ok) {
        setRefundNotice('Refund request successfully submitted. Canteen administration will review it.');
        setOrder((prev) => ({ ...prev, status: 'REFUND_REQUESTED' }));
        setTimeout(() => setRefundModalOpen(false), 2000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setRefundNotice(errData.detail || 'Failed to submit refund request.');
      }
    } catch (err) {
      setRefundNotice('Network error submitting refund request.');
    } finally {
      setRefundSubmitting(false);
    }
  };

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
    { key: 'PLACED', label: 'Order Placed', icon: Clock, desc: 'Sent to kitchen' },
    { key: 'PREPARING', label: 'In Kitchen', icon: ChefHat, desc: 'Fresh preparation' },
    { key: 'READY', label: 'Ready for Pickup', icon: PackageCheck, desc: 'Show code at counter' },
    { key: 'COMPLETED', label: 'Collected', icon: CheckCircle2, desc: 'Meal delivered' },
  ];

  const getStepIndex = (status) => {
    if (status === 'COMPLETED') return 3;
    if (status === 'READY') return 2;
    if (status === 'PREPARING' || status === 'ACCEPTED') return 1;
    return 0;
  };

  const currentIndex = getStepIndex(order.status);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
      {/* Paper Order Pass */}
      <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 sm:p-8 shadow-paper-elevated relative overflow-hidden">
        
        {/* Pass Header */}
        <div className="flex items-center justify-between border-b border-oatmeal-200 pb-5 mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Campus Pickup Pass</span>
            <h1 className="text-2xl font-black text-ink-900 tracking-tight">#{order.order_number}</h1>
            <p className="text-xs text-ink-500 mt-0.5">{order.canteen_name || 'Campus Canteen'}</p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-sage-50 text-sage-700 border border-sage-200">
              <span className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-sage-600 animate-pulse' : 'bg-oatmeal-400'}`} />
              <span>{wsStatus === 'connected' ? 'Live Kitchen Sync' : 'Connecting...'}</span>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-oatmeal-100 text-ink-700 border border-oatmeal-200">
              {order.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Preparation Time Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-oatmeal-100 border border-oatmeal-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-terracotta-600 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-ink-900">
                Estimated Preparation: {order.estimated_preparation_minutes || 15} min
              </div>
              <div className="text-[10px] text-ink-500">
                {order.status === 'READY' 
                  ? 'Your meal is waiting at the pickup counter!' 
                  : order.status === 'COMPLETED'
                  ? 'Order has been successfully collected.'
                  : 'Live updates from kitchen staff'}
              </div>
            </div>
          </div>

          <button
            onClick={fetchBill}
            disabled={billLoading}
            className="px-3 py-1.5 rounded-xl bg-white border border-oatmeal-300 hover:bg-oatmeal-50 text-ink-800 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Receipt className="w-3.5 h-3.5 text-sage-600" />
            <span>{billLoading ? 'Loading...' : 'View Bill'}</span>
          </button>
        </div>

        {/* Step Progress Stepper */}
        <div className="relative mb-8">
          <div className="absolute top-5 left-6 right-6 h-0.5 bg-oatmeal-200 -z-0" />
          <div
            className="absolute top-5 left-6 h-0.5 bg-sage-600 transition-all duration-500 -z-0"
            style={{ width: `${(currentIndex / 3) * 85}%` }}
          />

          <div className="flex justify-between relative z-10">
            {steps.map((step, idx) => {
              const isDone = currentIndex >= idx;
              const isCurrent = currentIndex === idx;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex flex-col items-center text-center max-w-[80px]">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                      isDone
                        ? 'bg-sage-600 text-white shadow-paper'
                        : 'bg-oatmeal-100 border border-oatmeal-200 text-ink-400'
                    } ${isCurrent ? 'ring-4 ring-sage-100' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[11px] font-bold mt-2 ${isDone ? 'text-ink-900' : 'text-ink-400'}`}>
                    {step.label}
                  </span>
                  <span className="text-[9px] text-ink-500 mt-0.5 hidden sm:inline">{step.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Secure Pickup Pass Container (QR + 4-Digit Secret Code) */}
        <div className="bg-cream-100 border border-oatmeal-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-5 mb-6 shadow-xs">
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-600">Verification Pass</span>
            <div className="text-xs text-ink-600 mt-0.5">Show this 4-digit code or QR code at counter:</div>
            
            {/* 4-Digit Pickup Code Badge */}
            <div className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-white border border-oatmeal-300 rounded-2xl shadow-paper">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">Pickup Code:</span>
              <span className="text-2xl font-black text-terracotta-600 tracking-widest font-mono">
                {order.pickup_code || '----'}
              </span>
            </div>
            
            <p className="text-[10px] text-ink-400 mt-2">
              The kitchen verifies this code before handing over your meal to prevent unauthorized pickups.
            </p>
          </div>

          <div className="p-3 bg-white border border-oatmeal-200 rounded-2xl shadow-xs shrink-0">
            <QRCodeSVG value={`ORDER-${order.order_number}-${order.pickup_code}`} size={110} />
          </div>
        </div>

        {/* Order Breakdown */}
        <div className="border-t border-oatmeal-200 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3">Order Summary</h4>
          <div className="space-y-2 text-xs">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-ink-700">
                <span>{item.quantity}x {item.item_name || item.menu_item?.name || 'Dish'}</span>
                <span className="font-bold text-ink-900">
                  ₹{Number(item.total_price || item.unit_price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center text-sm font-bold text-ink-900 pt-3 border-t border-oatmeal-100">
              <span>Total Paid</span>
              <span>₹{Number(order.total_amount || order.total_price).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Bar: Request Refund if needed */}
        {order.status !== 'COMPLETED' && order.status !== 'REFUNDED' && order.status !== 'REFUND_REQUESTED' && (
          <div className="mt-6 pt-4 border-t border-oatmeal-100 flex justify-end">
            <button
              onClick={() => setRefundModalOpen(true)}
              className="text-xs text-ink-500 hover:text-terracotta-600 font-semibold flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Need to cancel or request refund?</span>
            </button>
          </div>
        )}
      </div>

      {/* Bill & Tax Receipt Modal */}
      {billModalOpen && billData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setBillModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Bill Receipt Header */}
            <div className="text-center pb-4 border-b border-dashed border-oatmeal-300 mb-4">
              <h2 className="text-lg font-black text-ink-900 tracking-tight">CAMPUS DINING INVOICE</h2>
              <p className="text-xs text-ink-600 font-semibold">{billData.canteen_name || 'Central Dining Outlets'}</p>
              <div className="text-[10px] text-ink-400 mt-1 font-mono">Invoice #{billData.bill_number}</div>
            </div>

            {/* Bill Meta */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-4 text-ink-700">
              <div>
                <span className="text-[10px] text-ink-400 block font-bold">CUSTOMER</span>
                <span className="font-bold text-ink-900">{billData.user_name || 'Student'}</span>
                <span className="text-[10px] text-ink-500 block">{billData.user_college_id}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-ink-400 block font-bold">ORDER ID</span>
                <span className="font-bold text-ink-900 font-mono">#{billData.order_number}</span>
                <span className="text-[10px] text-ink-500 block">
                  {new Date(billData.generated_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="border-t border-b border-dashed border-oatmeal-300 py-3 mb-4 text-xs">
              <div className="flex justify-between font-bold text-ink-500 text-[10px] mb-2 uppercase">
                <span>Item</span>
                <div className="flex gap-4">
                  <span>Qty</span>
                  <span>Price</span>
                  <span>Total</span>
                </div>
              </div>

              {billData.items?.map((it) => (
                <div key={it.id} className="flex justify-between py-1 text-ink-800">
                  <span className="truncate max-w-[170px]">{it.item_name}</span>
                  <div className="flex gap-4 font-mono">
                    <span className="w-6 text-center">{it.quantity}</span>
                    <span className="w-12 text-right">₹{Number(it.unit_price).toFixed(2)}</span>
                    <span className="w-12 text-right font-bold">₹{Number(it.total_price).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal & Totals */}
            <div className="space-y-1.5 text-xs mb-6 text-ink-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">₹{Number(billData.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Fee / Tax</span>
                <span className="font-mono">₹{Number(billData.service_fee || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-ink-900 pt-2 border-t border-oatmeal-200">
                <span>Total Amount Paid</span>
                <span className="font-mono text-terracotta-600">₹{Number(billData.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-sage-700 font-semibold pt-1">
                <span>Payment Status</span>
                <span className="uppercase">{billData.payment_status}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-ink-900 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-paper"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>
              <button
                onClick={() => setBillModalOpen(false)}
                className="px-4 py-2.5 bg-oatmeal-200 hover:bg-oatmeal-300 text-ink-800 rounded-2xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Request Modal */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative">
            <button
              onClick={() => setRefundModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-ink-900 mb-1">Request Order Refund</h3>
            <p className="text-xs text-ink-500 mb-4">
              Enter your cancellation or refund reason for Order #{order.order_number}.
            </p>

            {refundNotice && (
              <div className="p-3 bg-sage-50 text-sage-800 border border-sage-200 rounded-xl text-xs mb-3">
                {refundNotice}
              </div>
            )}

            <form onSubmit={handleRequestRefund} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-ink-700 block mb-1">Reason for Refund</label>
                <textarea
                  rows="3"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Canteen delayed, accidental duplicate order, class schedule conflict..."
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-xl p-2 text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={refundSubmitting}
                className="w-full py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-xl shadow-paper flex items-center justify-center gap-1.5"
              >
                {refundSubmitting ? 'Submitting Request...' : 'Confirm Refund Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
