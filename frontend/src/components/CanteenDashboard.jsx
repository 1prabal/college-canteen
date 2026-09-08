import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle2, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

export default function CanteenDashboard({ canteens }) {
  const [selectedCanteenId, setSelectedCanteenId] = useState(canteens[0]?.id || 1);
  const [orders, setOrders] = useState([]);
  const [activeColumnMobile, setActiveColumnMobile] = useState('PENDING');

  useEffect(() => {
    if (canteens.length > 0 && !selectedCanteenId) {
      setSelectedCanteenId(canteens[0].id);
    }
  }, [canteens]);

  useEffect(() => {
    if (!selectedCanteenId) return;

    fetchOrders();

    const ws = new WebSocket(`ws://localhost:8000/ws/canteen/${selectedCanteenId}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_ORDER') {
          setOrders((prev) => [data.order, ...prev]);
        } else if (data.type === 'ORDER_STATUS_UPDATED') {
          setOrders((prev) =>
            prev.map((o) => (o.id === data.order_id ? { ...o, status: data.status } : o))
          );
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    };

    return () => ws.close();
  }, [selectedCanteenId]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/orders`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:8000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY');

  const renderOrderCard = (order) => (
    <div
      key={order.id}
      className="bg-white border border-oatmeal-300 rounded-2xl p-4 shadow-paper mb-3 transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm text-ink-900">#{order.order_number}</span>
        <span className="text-[10px] text-ink-500 font-semibold bg-oatmeal-100 px-2 py-0.5 rounded-full border border-oatmeal-200">
          ₹{order.total_price.toFixed(2)}
        </span>
      </div>

      <div className="space-y-1 my-3 text-xs border-t border-b border-oatmeal-100 py-2">
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between text-ink-700">
            <span>{item.quantity}x {item.menu_item?.name || 'Item'}</span>
          </div>
        ))}
      </div>

      <div className="pt-1">
        {order.status === 'PENDING' && (
          <button
            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
            className="w-full py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <ChefHat className="w-3.5 h-3.5" /> Start Prep
          </button>
        )}

        {order.status === 'PREPARING' && (
          <button
            onClick={() => handleUpdateStatus(order.id, 'READY')}
            className="w-full py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Ready
          </button>
        )}

        {order.status === 'READY' && (
          <button
            onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
            className="w-full py-2 bg-oatmeal-200 hover:bg-oatmeal-300 text-ink-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            Hand Over & Complete
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
      {/* Header and Canteen Outlet Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-oatmeal-300 p-5 rounded-3xl shadow-paper mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink-900">Kitchen Orders Board</h1>
          <p className="text-xs text-ink-500">Live Kanban dispatch updated via WebSockets</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCanteenId}
            onChange={(e) => setSelectedCanteenId(Number(e.target.value))}
            className="bg-oatmeal-100 border border-oatmeal-200 rounded-2xl px-3 py-2 text-xs font-semibold text-ink-900 focus:outline-none focus:border-terracotta-500"
          >
            {canteens.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={fetchOrders}
            className="p-2 rounded-2xl bg-white border border-oatmeal-300 hover:bg-oatmeal-100 text-ink-600 shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Column Switcher (Visible only on small screens) */}
      <div className="flex sm:hidden gap-1.5 p-1 bg-oatmeal-200/80 rounded-2xl mb-4 border border-oatmeal-300">
        <button
          onClick={() => setActiveColumnMobile('PENDING')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeColumnMobile === 'PENDING' ? 'bg-white text-ink-900 shadow-paper' : 'text-ink-500'
          }`}
        >
          Placed ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveColumnMobile('PREPARING')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeColumnMobile === 'PREPARING' ? 'bg-white text-ink-900 shadow-paper' : 'text-ink-500'
          }`}
        >
          Kitchen ({preparingOrders.length})
        </button>
        <button
          onClick={() => setActiveColumnMobile('READY')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeColumnMobile === 'READY' ? 'bg-white text-ink-900 shadow-paper' : 'text-ink-500'
          }`}
        >
          Ready ({readyOrders.length})
        </button>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Placed Orders */}
        <div className={`sm:block ${activeColumnMobile === 'PENDING' ? 'block' : 'hidden sm:block'}`}>
          <div className="bg-oatmeal-100 border border-oatmeal-300 rounded-3xl p-4 min-h-[400px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-bold text-xs text-ink-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sage-600" /> Placed Orders
              </span>
              <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-oatmeal-200">
                {pendingOrders.length}
              </span>
            </div>
            {pendingOrders.length === 0 ? (
              <div className="text-center py-12 text-ink-400 text-xs">No pending orders</div>
            ) : (
              pendingOrders.map(renderOrderCard)
            )}
          </div>
        </div>

        {/* In Kitchen */}
        <div className={`sm:block ${activeColumnMobile === 'PREPARING' ? 'block' : 'hidden sm:block'}`}>
          <div className="bg-oatmeal-100 border border-oatmeal-300 rounded-3xl p-4 min-h-[400px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-bold text-xs text-ink-900 flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-terracotta-500" /> In Preparation
              </span>
              <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-oatmeal-200">
                {preparingOrders.length}
              </span>
            </div>
            {preparingOrders.length === 0 ? (
              <div className="text-center py-12 text-ink-400 text-xs">No active cooking</div>
            ) : (
              preparingOrders.map(renderOrderCard)
            )}
          </div>
        </div>

        {/* Ready for Pickup */}
        <div className={`sm:block ${activeColumnMobile === 'READY' ? 'block' : 'hidden sm:block'}`}>
          <div className="bg-oatmeal-100 border border-oatmeal-300 rounded-3xl p-4 min-h-[400px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-bold text-xs text-ink-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sage-600" /> Ready for Pickup
              </span>
              <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-oatmeal-200">
                {readyOrders.length}
              </span>
            </div>
            {readyOrders.length === 0 ? (
              <div className="text-center py-12 text-ink-400 text-xs">No orders waiting</div>
            ) : (
              readyOrders.map(renderOrderCard)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
