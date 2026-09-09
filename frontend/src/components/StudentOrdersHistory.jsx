import React, { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle2, AlertCircle, RotateCcw, Receipt, 
  ArrowRight, Search, Eye, Filter, Store, Printer, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function StudentOrdersHistory({ onSelectOrder, onOpenTracker }) {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'cancelled' | 'refunded'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bill viewing modal
  const [selectedBillOrder, setSelectedBillOrder] = useState(null);
  const [billData, setBillData] = useState(null);
  const [billLoading, setBillLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [currentUser?.id]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = currentUser?.id || 1;
      const res = await fetch(`http://localhost:8000/api/users/${userId}/orders`);
      if (!res.ok) throw new Error('Could not retrieve orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load your order history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBill = async (order) => {
    setSelectedBillOrder(order);
    setBillLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/bills/${order.id}`);
      if (res.ok) {
        const data = await res.json();
        setBillData(data);
      } else {
        alert('Official bill is currently generating. Please try again shortly.');
      }
    } catch (e) {
      console.error(e);
      alert('Error fetching bill details.');
    } finally {
      setBillLoading(false);
    }
  };

  const filterOrdersByTab = () => {
    return orders.filter((order) => {
      const status = (order.status || '').toUpperCase();
      const matchesSearch = 
        (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.canteen_name || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'active') {
        return ['PLACED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY'].includes(status);
      } else if (activeTab === 'completed') {
        return status === 'COMPLETED';
      } else if (activeTab === 'cancelled') {
        return ['CANCELLED', 'REJECTED'].includes(status);
      } else if (activeTab === 'refunded') {
        return ['REFUND_REQUESTED', 'REFUNDED'].includes(status);
      }
      return true;
    });
  };

  const filteredOrders = filterOrdersByTab();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'READY':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
            Ready for Pickup!
          </span>
        );
      case 'PREPARING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Kitchen Preparing
          </span>
        );
      case 'ACCEPTED':
      case 'PAYMENT_CONFIRMED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sage-50 text-sage-700 border border-sage-200">
            Accepted & Queued
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-oatmeal-100 text-ink-700 border border-oatmeal-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-sage-600" />
            Picked Up
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Refund Credited
          </span>
        );
      case 'REFUND_REQUESTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Refund Under Review
          </span>
        );
      case 'REJECTED':
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-oatmeal-200 text-ink-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">My Campus Orders</h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            Review past meals, check live status, and print tax receipts.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-ink-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search order # or canteen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-oatmeal-300 rounded-2xl pl-9 pr-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-terracotta-500 shadow-xs"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-oatmeal-200 pb-3 mb-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'active', label: 'Active Orders' },
          { id: 'completed', label: 'Completed' },
          { id: 'refunded', label: 'Refunded' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => {
          const count = orders.filter((o) => {
            const s = (o.status || '').toUpperCase();
            if (tab.id === 'active') return ['PLACED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY'].includes(s);
            if (tab.id === 'completed') return s === 'COMPLETED';
            if (tab.id === 'refunded') return ['REFUND_REQUESTED', 'REFUNDED'].includes(s);
            if (tab.id === 'cancelled') return ['CANCELLED', 'REJECTED'].includes(s);
            return false;
          }).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-ink-900 text-white shadow-paper'
                  : 'bg-white border border-oatmeal-300 text-ink-600 hover:text-ink-900 hover:bg-oatmeal-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-oatmeal-200 text-ink-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16 bg-white border border-oatmeal-300 rounded-3xl shadow-paper">
          <div className="w-8 h-8 border-3 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-ink-500 font-semibold">Loading orders from campus server...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="text-center py-12 bg-rose-50 border border-rose-200 rounded-3xl p-6 text-rose-800">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-600" />
          <p className="text-xs font-bold">{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-3 px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredOrders.length === 0 && (
        <div className="text-center py-16 bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
          <div className="w-12 h-12 rounded-2xl bg-oatmeal-100 flex items-center justify-center text-ink-400 mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-ink-900 mb-1">No Orders Found</h3>
          <p className="text-xs text-ink-500 max-w-sm mx-auto">
            {activeTab === 'active'
              ? 'You have no orders currently being prepared in the kitchen.'
              : `No orders categorized under "${activeTab}".`}
          </p>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isReady = order.status === 'READY';
            const isActive = ['PLACED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY'].includes(order.status);

            return (
              <div
                key={order.id}
                className={`bg-white border rounded-3xl p-5 sm:p-6 transition-all shadow-paper hover:shadow-paper-elevated ${
                  isReady ? 'border-amber-300 ring-2 ring-amber-100' : 'border-oatmeal-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-oatmeal-200">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-extrabold text-sm text-ink-900">
                        #{order.order_number}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-500">
                      <span className="font-bold text-ink-800">{order.canteen_name || 'Canteen Outlet'}</span>
                      <span>•</span>
                      <span>{new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-ink-400 font-bold block uppercase">Total Paid</span>
                    <span className="font-mono font-extrabold text-base text-ink-900">
                      ₹{Number(order.total_amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="py-3.5 text-xs text-ink-700">
                  <div className="font-semibold text-ink-500 text-[11px] uppercase mb-1.5">Dishes:</div>
                  <div className="flex flex-wrap gap-2">
                    {order.items?.map((it, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-xl bg-oatmeal-100 border border-oatmeal-200 font-medium">
                        <strong className="text-ink-900">{it.quantity}x</strong> {it.item_name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-oatmeal-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {order.pickup_code && (
                      <span className="px-3 py-1 rounded-xl bg-terracotta-50 text-terracotta-800 border border-terracotta-200 font-mono font-black text-xs">
                        PIN: {order.pickup_code}
                      </span>
                    )}
                    {order.estimated_ready_at && isActive && (
                      <span className="text-[11px] text-ink-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-terracotta-500" />
                        Ready approx {new Date(order.estimated_ready_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenBill(order)}
                      className="px-3 py-1.5 rounded-xl border border-oatmeal-300 text-ink-700 hover:bg-oatmeal-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Tax Bill</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onSelectOrder) onSelectOrder(order);
                        if (onOpenTracker) onOpenTracker(order);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold shadow-paper flex items-center gap-1.5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Track Live' : 'View Pass'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Official Tax Bill Modal */}
      {selectedBillOrder && billData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative animate-in zoom-in-95">
            <button
              onClick={() => { setSelectedBillOrder(null); setBillData(null); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Bill Header */}
            <div className="text-center pb-4 mb-4 border-b border-dashed border-oatmeal-300">
              <div className="w-10 h-10 rounded-2xl bg-terracotta-50 text-terracotta-600 border border-terracotta-200 flex items-center justify-center mx-auto mb-2">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-ink-900 tracking-tight">CAMPUS CANTEEN RECEIPT</h3>
              <p className="text-xs font-bold text-terracotta-600">{billData.canteen_name || 'Dining Outlet'}</p>
              <p className="text-[10px] text-ink-400 mt-0.5">Official Tax Invoice • Ref #{billData.bill_number}</p>
            </div>

            {/* Customer & Order Metadata */}
            <div className="flex justify-between text-xs mb-3 text-ink-700">
              <div>
                <span className="text-[10px] text-ink-400 block font-bold">CUSTOMER</span>
                <span className="font-bold text-ink-900">{billData.user_name || 'Student'}</span>
                <span className="text-[10px] text-ink-500 block">{billData.user_college_id}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-ink-400 block font-bold">ORDER ID</span>
                <span className="font-bold text-ink-900 font-mono">#{billData.order_number}</span>
                <span className="text-[10px] text-ink-500 block">
                  {new Date(billData.generated_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border-t border-b border-dashed border-oatmeal-300 py-2.5 mb-4 text-xs">
              <div className="flex justify-between font-bold text-ink-400 text-[10px] mb-1.5 uppercase">
                <span>Item</span>
                <div className="flex gap-3">
                  <span>Qty</span>
                  <span>Price</span>
                  <span>Total</span>
                </div>
              </div>
              {billData.items?.map((it) => (
                <div key={it.id} className="flex justify-between py-1 text-ink-800">
                  <span className="truncate max-w-[150px]">{it.item_name}</span>
                  <div className="flex gap-3 font-mono text-[11px]">
                    <span className="w-5 text-center">{it.quantity}</span>
                    <span className="w-10 text-right">₹{Number(it.unit_price).toFixed(2)}</span>
                    <span className="w-12 text-right font-bold">₹{Number(it.total_price).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal & Total */}
            <div className="space-y-1 text-xs mb-5 text-ink-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">₹{Number(billData.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax / Service Fee</span>
                <span className="font-mono">₹{Number(billData.service_fee || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-ink-900 pt-1.5 border-t border-oatmeal-200">
                <span>Total Paid</span>
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
                onClick={() => { setSelectedBillOrder(null); setBillData(null); }}
                className="px-4 py-2.5 bg-oatmeal-200 hover:bg-oatmeal-300 text-ink-800 rounded-2xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
