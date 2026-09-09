import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Clock, CheckCircle2, ArrowRight, RefreshCw, AlertCircle, 
  Store, Utensils, Package, DollarSign, Receipt, RotateCcw, Plus, 
  Minus, QrCode, KeyRound, X, Check, Eye 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CanteenDashboard({ canteens }) {
  const { currentUser } = useAuth();
  const [selectedCanteenId, setSelectedCanteenId] = useState(() => {
    return currentUser?.canteenId || canteens[0]?.id || 1;
  });

  const [activeSection, setActiveSection] = useState('orders'); // 'orders' | 'menu' | 'inventory' | 'sales' | 'bills' | 'refunds'
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('ACTIVE'); // 'ALL' | 'ACTIVE' | 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED'
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Menu state
  const [menuItems, setMenuItems] = useState([]);
  const [newDishModal, setNewDishModal] = useState(false);
  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishCategory, setDishCategory] = useState('Fast Food');
  const [dishPrepTime, setDishPrepTime] = useState(10);
  const [dishImageUrl, setDishImageUrl] = useState('');

  // Inventory state
  const [inventory, setInventory] = useState([]);
  const [restockModalItem, setRestockModalItem] = useState(null);
  const [restockQty, setRestockQty] = useState(25);

  // Sales state
  const [salesSummary, setSalesSummary] = useState(null);

  // Bills state
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);

  // Refunds state
  const [refunds, setRefunds] = useState([]);

  // Pickup Verification Modal
  const [pickupModalOrder, setPickupModalOrder] = useState(null);
  const [enteredPickupCode, setEnteredPickupCode] = useState('');
  const [pickupError, setPickupError] = useState('');
  const [pickupSuccess, setPickupSuccess] = useState('');

  // Preparation Time Modal
  const [prepModalOrder, setPrepModalOrder] = useState(null);
  const [newPrepMinutes, setNewPrepMinutes] = useState(15);

  useEffect(() => {
    if (canteens.length > 0 && !selectedCanteenId) {
      setSelectedCanteenId(currentUser?.canteenId || canteens[0].id);
    }
  }, [canteens, currentUser]);

  useEffect(() => {
    if (!selectedCanteenId) return;

    fetchOrders();
    fetchMenu();
    fetchInventory();
    fetchSales();
    fetchBills();
    fetchRefunds();

    // Setup live canteen kitchen queue WebSocket
    const ws = new WebSocket(`ws://localhost:8000/ws/canteen/${selectedCanteenId}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_ORDER' || data.type === 'ORDER_CREATED') {
          setOrders((prev) => {
            const exists = prev.some((o) => o.id === data.order.id);
            if (exists) return prev;
            return [data.order, ...prev];
          });
        } else if (data.type === 'ORDER_STATUS_UPDATED' || data.type === 'STATUS_UPDATED') {
          setOrders((prev) =>
            prev.map((o) => (o.id === (data.order_id || data.order?.id) ? { ...o, status: data.status, ...(data.order || {}) } : o))
          );
        } else if (data.type === 'PREPARATION_TIME_UPDATED') {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === data.order_id
                ? { ...o, estimated_preparation_minutes: data.estimated_preparation_minutes, ...(data.order || {}) }
                : o
            )
          );
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    };

    return () => ws.close();
  }, [selectedCanteenId]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/orders`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/menu`);
      const data = await res.json();
      setMenuItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/inventory`);
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/sales`);
      const data = await res.json();
      setSalesSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBills = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/bills`);
      const data = await res.json();
      setBills(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRefunds = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/refunds?canteen_id=${selectedCanteenId}`);
      const data = await res.json();
      setRefunds(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus, note = '') => {
    try {
      const res = await fetch(`http://localhost:8000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          changed_by: currentUser?.id || 2,
          note 
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Status update failed');
      }
      const updatedOrder = await res.json();
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, ...updatedOrder } : o))
      );
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleUpdatePrepTime = async (e) => {
    e.preventDefault();
    if (!prepModalOrder) return;

    try {
      const res = await fetch(`http://localhost:8000/api/orders/${prepModalOrder.id}/prep-time`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimated_preparation_minutes: Number(newPrepMinutes) })
      });
      if (!res.ok) throw new Error("Failed to update prep time");
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => o.id === prepModalOrder.id ? { ...o, ...updated } : o));
      setPrepModalOrder(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerifyPickup = async (e) => {
    e.preventDefault();
    setPickupError('');
    setPickupSuccess('');
    if (!pickupModalOrder || !enteredPickupCode.trim()) return;

    try {
      const res = await fetch(`http://localhost:8000/api/orders/${pickupModalOrder.id}/verify-pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickup_code: enteredPickupCode.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid pickup code');
      }

      setPickupSuccess(`Verified! Order #${pickupModalOrder.order_number} marked COMPLETED.`);
      setOrders((prev) =>
        prev.map((o) => (o.id === pickupModalOrder.id ? { ...o, status: 'COMPLETED' } : o))
      );
      setTimeout(() => {
        setPickupModalOrder(null);
        setEnteredPickupCode('');
        setPickupSuccess('');
      }, 1500);
    } catch (err) {
      setPickupError(err.message);
    }
  };

  const handleAddDish = async (e) => {
    e.preventDefault();
    if (!dishName || !dishPrice) return;

    try {
      const res = await fetch('http://localhost:8000/api/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canteen_id: selectedCanteenId,
          name: dishName,
          price: parseFloat(dishPrice),
          category: dishCategory,
          preparation_time_minutes: Number(dishPrepTime),
          image_url: dishImageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
          is_available: true
        })
      });
      if (res.ok) {
        setNewDishModal(false);
        setDishName('');
        setDishPrice('');
        fetchMenu();
        fetchInventory();
      }
    } catch (err) {
      alert("Error adding dish");
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockModalItem) return;

    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/inventory/${restockModalItem.menu_item_id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity_change: Number(restockQty),
          note: "Manual canteen restock"
        })
      });
      if (res.ok) {
        setRestockModalItem(null);
        fetchInventory();
        fetchMenu();
      }
    } catch (err) {
      alert("Error updating inventory");
    }
  };

  const handleProcessRefund = async (refundId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:8000/api/refunds/${refundId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: `Processed by canteen staff #${currentUser?.id || 2}` })
      });
      if (res.ok) {
        fetchRefunds();
        fetchOrders();
        alert(`Refund ${newStatus.toLowerCase()} successfully.`);
      }
    } catch (err) {
      alert("Error processing refund.");
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'ALL') return true;
    if (orderFilter === 'ACTIVE') return o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'REFUNDED';
    if (orderFilter === 'PENDING') return o.status === 'PLACED' || o.status === 'PAYMENT_PENDING' || o.status === 'PAYMENT_CONFIRMED' || o.status === 'PENDING';
    if (orderFilter === 'PREPARING') return o.status === 'ACCEPTED' || o.status === 'PREPARING';
    if (orderFilter === 'READY') return o.status === 'READY';
    if (orderFilter === 'COMPLETED') return o.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
      {/* Header with Outlet Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-oatmeal-300 p-5 rounded-3xl shadow-paper mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sage-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-sage-700 bg-sage-50 border border-sage-200 px-2 py-0.5 rounded-full">
              Kitchen Dispatch Terminal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink-900">
            {canteens.find((c) => c.id === selectedCanteenId)?.name || 'Canteen'} Operations
          </h1>
          <p className="text-xs text-ink-500">Live order management, stock control, and pickup verification</p>
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
            onClick={() => { fetchOrders(); fetchSales(); fetchInventory(); }}
            className="p-2 rounded-2xl bg-white border border-oatmeal-300 hover:bg-oatmeal-100 text-ink-600 shadow-xs"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        {[
          { key: 'orders', label: 'Live Orders', icon: Clock, count: orders.filter((o) => o.status !== 'COMPLETED').length },
          { key: 'menu', label: 'Menu Catalog', icon: Utensils, count: menuItems.length },
          { key: 'inventory', label: 'Inventory', icon: Package, count: inventory.filter((i) => i.quantity <= i.minimum_stock).length },
          { key: 'sales', label: 'Sales & Revenue', icon: DollarSign },
          { key: 'bills', label: 'Invoices', icon: Receipt },
          { key: 'refunds', label: 'Refunds', icon: RotateCcw, count: refunds.filter((r) => r.status === 'REQUESTED').length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-sage-700 text-white shadow-paper'
                  : 'bg-white border border-oatmeal-300 text-ink-600 hover:bg-oatmeal-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white text-sage-800' : 'bg-terracotta-100 text-terracotta-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: LIVE ORDERS */}
      {activeSection === 'orders' && (
        <div>
          {/* Status Filter Chips */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
            {['ACTIVE', 'PENDING', 'PREPARING', 'READY', 'COMPLETED', 'ALL'].map((f) => (
              <button
                key={f}
                onClick={() => setOrderFilter(f)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                  orderFilter === f
                    ? 'bg-ink-900 text-white'
                    : 'bg-oatmeal-200/80 text-ink-600 hover:bg-oatmeal-300'
                }`}
              >
                {f.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Orders Grid */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-oatmeal-300 shadow-paper text-ink-400 text-xs">
              No orders found in this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((o) => (
                <div
                  key={o.id}
                  className="bg-white border border-oatmeal-300 rounded-3xl p-5 shadow-paper flex flex-col justify-between hover:shadow-paper-elevated transition-all"
                >
                  <div>
                    {/* Top Order Card Row */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-bold text-sm sm:text-base text-ink-900 font-mono block">
                          #{o.order_number}
                        </span>
                        <span className="text-[11px] text-ink-500 font-medium">
                          {o.user_name || 'Campus Member'}
                        </span>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase ${
                        o.status === 'READY' ? 'bg-terracotta-50 text-terracotta-700 border-terracotta-200 animate-pulse' :
                        o.status === 'COMPLETED' ? 'bg-sage-50 text-sage-700 border-sage-200' :
                        o.status === 'PREPARING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-oatmeal-100 text-ink-700 border-oatmeal-200'
                      }`}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Meta: Prep Time & Total Amount */}
                    <div className="flex items-center justify-between text-xs py-2 border-t border-b border-oatmeal-100 my-3">
                      <div className="flex items-center gap-1 text-ink-600">
                        <Clock className="w-3.5 h-3.5 text-terracotta-600" />
                        <span>Prep: <strong>{o.estimated_preparation_minutes || 15}m</strong></span>
                      </div>
                      <span className="font-bold text-ink-900 text-sm">
                        ₹{Number(o.total_amount || o.total_price).toFixed(2)}
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-1 text-xs mb-4">
                      {o.items?.map((it) => (
                        <div key={it.id} className="flex justify-between text-ink-700">
                          <span>{it.quantity}x {it.item_name || it.menu_item_name || 'Dish'}</span>
                          <span className="font-mono text-ink-500">₹{Number(it.total_price || it.price * it.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="space-y-2 pt-2 border-t border-oatmeal-100">
                    {/* Status Triggers */}
                    {(o.status === 'PLACED' || o.status === 'PAYMENT_CONFIRMED' || o.status === 'PENDING') && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(o.id, 'PREPARING')}
                          className="flex-1 py-2 bg-sage-600 hover:bg-sage-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <ChefHat className="w-3.5 h-3.5" /> Start Prep
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(o.id, 'REJECTED', 'Canteen currently out of ingredients')}
                          className="px-3 py-2 bg-oatmeal-200 hover:bg-terracotta-100 text-terracotta-700 font-bold rounded-xl text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {o.status === 'PREPARING' && (
                      <button
                        onClick={() => handleUpdateStatus(o.id, 'READY')}
                        className="w-full py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Ready for Pickup
                      </button>
                    )}

                    {o.status === 'READY' && (
                      <button
                        onClick={() => { setPickupModalOrder(o); setEnteredPickupCode(''); setPickupError(''); }}
                        className="w-full py-2.5 bg-sage-600 hover:bg-sage-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-paper"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Enter Pickup Passcode
                      </button>
                    )}

                    {/* Preparation Time Adjustment */}
                    {o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'REFUNDED' && (
                      <button
                        onClick={() => { setPrepModalOrder(o); setNewPrepMinutes(o.estimated_preparation_minutes || 15); }}
                        className="w-full py-1 text-[11px] text-ink-500 hover:text-ink-900 font-semibold flex items-center justify-center gap-1"
                      >
                        <Clock className="w-3 h-3 text-ink-400" />
                        <span>Adjust Prep Minutes</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: MENU CATALOG */}
      {activeSection === 'menu' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-ink-900">Menu Catalog</h2>
              <p className="text-xs text-ink-500">Live dishes offered at this dining location</p>
            </div>
            <button
              onClick={() => setNewDishModal(true)}
              className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-xs rounded-2xl shadow-paper flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Dish
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-oatmeal-50 border border-oatmeal-200 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-xs text-ink-900">{item.name}</span>
                    <span className="font-bold text-xs text-ink-900">
                      {item.pricing_type === 'MRP' ? (
                        <span className="px-1.5 py-0.5 bg-oatmeal-200 rounded text-[10px] font-black">MRP</span>
                      ) : (
                        `₹${Number(item.price).toFixed(2)}`
                      )}
                    </span>
                  </div>
                  {item.unit_info && (
                    <span className="text-[10px] text-ink-500 font-medium block mb-1">
                      {item.unit_info}
                    </span>
                  )}
                  {!item.is_verified && (
                    <span className="inline-block text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded mb-1">
                      Unverified / Price obscured
                    </span>
                  )}
                  <p className="text-[11px] text-ink-500 line-clamp-2 mb-3">{item.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-oatmeal-200 text-xs">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.is_available ? 'bg-sage-100 text-sage-800' : 'bg-terracotta-100 text-terracotta-800'
                  }`}>
                    {item.is_available ? 'Available' : 'Sold Out'}
                  </span>
                  <span className="text-[11px] text-ink-400">{item.preparation_time_minutes} min prep</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: INVENTORY CONTROL */}
      {activeSection === 'inventory' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
          <h2 className="text-base font-bold text-ink-900 mb-1">Kitchen Inventory & Stock Levels</h2>
          <p className="text-xs text-ink-500 mb-6">Stock updates automatically on order placement and restores on cancellation.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-oatmeal-200 text-ink-500 font-bold">
                  <th className="pb-3">Dish Name</th>
                  <th className="pb-3">Quantity In Stock</th>
                  <th className="pb-3">Min Alert Stock</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oatmeal-100">
                {inventory.map((inv) => (
                  <tr key={inv.id} className="text-ink-800">
                    <td className="py-3 font-semibold">{inv.menu_item_name || `Dish #${inv.menu_item_id}`}</td>
                    <td className="py-3 font-bold text-sm">
                      <span className={inv.quantity <= inv.minimum_stock ? 'text-terracotta-600' : 'text-ink-900'}>
                        {inv.quantity}
                      </span>
                    </td>
                    <td className="py-3 text-ink-500">{inv.minimum_stock}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.quantity === 0 ? 'bg-terracotta-100 text-terracotta-800' :
                        inv.quantity <= inv.minimum_stock ? 'bg-amber-100 text-amber-800' :
                        'bg-sage-100 text-sage-800'
                      }`}>
                        {inv.quantity === 0 ? 'Out of Stock' : inv.quantity <= inv.minimum_stock ? 'Low Stock' : 'Good'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => { setRestockModalItem(inv); setRestockQty(25); }}
                        className="px-3 py-1 bg-oatmeal-200 hover:bg-sage-600 hover:text-white rounded-xl text-xs font-bold transition-all"
                      >
                        + Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: SALES & REVENUE */}
      {activeSection === 'sales' && salesSummary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 shadow-paper">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block mb-1">Total Gross Revenue</span>
              <div className="text-2xl font-black text-ink-900">₹{Number(salesSummary.total_gross_sales).toFixed(2)}</div>
              <span className="text-xs text-ink-500 mt-1 block">Lifetime canteen sales</span>
            </div>

            <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 shadow-paper">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block mb-1">Today's Revenue</span>
              <div className="text-2xl font-black text-sage-700">₹{Number(salesSummary.today_sales).toFixed(2)}</div>
              <span className="text-xs text-ink-500 mt-1 block">{salesSummary.today_orders} orders placed today</span>
            </div>

            <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 shadow-paper">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block mb-1">Completed Orders</span>
              <div className="text-2xl font-black text-terracotta-600">{salesSummary.completed_orders}</div>
              <span className="text-xs text-ink-500 mt-1 block">{salesSummary.active_orders} currently in kitchen</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: INVOICES & BILLS */}
      {activeSection === 'bills' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
          <h2 className="text-base font-bold text-ink-900 mb-4">Generated Dining Invoices</h2>
          <div className="divide-y divide-oatmeal-100 text-xs">
            {bills.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-ink-900 font-mono">Invoice #{b.bill_number}</div>
                  <div className="text-ink-500 text-[11px]">
                    Customer: {b.user_name || 'Student'} • Order #{b.order_number}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-bold text-ink-900 block">₹{Number(b.total).toFixed(2)}</span>
                    <span className="text-[10px] uppercase text-sage-700 font-semibold">{b.payment_status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6: REFUNDS */}
      {activeSection === 'refunds' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
          <h2 className="text-base font-bold text-ink-900 mb-4">Customer Refund Requests</h2>
          {refunds.length === 0 ? (
            <div className="text-center py-12 text-ink-400 text-xs">No refund requests recorded.</div>
          ) : (
            <div className="space-y-3">
              {refunds.map((ref) => (
                <div key={ref.id} className="p-4 bg-oatmeal-50 border border-oatmeal-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-ink-900 font-mono">REF #{ref.refund_reference}</div>
                    <div className="text-xs text-ink-600 mt-0.5">Reason: "{ref.reason}"</div>
                    <div className="text-[11px] text-ink-500 font-bold">Amount: ₹{Number(ref.amount).toFixed(2)}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-oatmeal-300 uppercase">
                      {ref.status}
                    </span>
                    {ref.status === 'REQUESTED' && (
                      <button
                        onClick={() => handleProcessRefund(ref.id, 'COMPLETED')}
                        className="px-3 py-1 bg-sage-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-sage-700"
                      >
                        Approve & Credit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: VERIFY PICKUP CODE */}
      {pickupModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative animate-in zoom-in-95">
            <button
              onClick={() => setPickupModalOrder(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-ink-900 mb-1">Verify Customer Pickup Code</h3>
            <p className="text-xs text-ink-500 mb-4">
              Enter the 4-digit secret passcode shown on the student's order pass.
            </p>

            {pickupError && (
              <div className="p-3 bg-terracotta-50 text-terracotta-800 border border-terracotta-200 rounded-xl text-xs mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-terracotta-600" />
                <span>{pickupError}</span>
              </div>
            )}

            {pickupSuccess && (
              <div className="p-3 bg-sage-50 text-sage-800 border border-sage-200 rounded-xl text-xs mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-sage-600" />
                <span>{pickupSuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPickup} className="space-y-4">
              <input
                type="text"
                maxLength={4}
                autoFocus
                placeholder="4-Digit Code"
                value={enteredPickupCode}
                onChange={(e) => setEnteredPickupCode(e.target.value)}
                className="w-full text-center text-2xl font-mono tracking-widest font-black py-3 bg-oatmeal-100 border border-oatmeal-300 rounded-2xl text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
                required
              />

              <button
                type="submit"
                className="w-full py-3 bg-sage-600 hover:bg-sage-700 text-white rounded-2xl text-xs font-bold shadow-paper flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Verify & Hand Over Meal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST PREPARATION MINUTES */}
      {prepModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative">
            <button
              onClick={() => setPrepModalOrder(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-ink-900 mb-1">Adjust Preparation Estimate</h3>
            <p className="text-xs text-ink-500 mb-4">
              Updates estimated completion time on the student's phone via WebSocket.
            </p>

            <form onSubmit={handleUpdatePrepTime} className="space-y-4">
              <div className="flex items-center gap-2">
                {[10, 15, 20, 30].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setNewPrepMinutes(m)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      newPrepMinutes === m ? 'bg-terracotta-500 text-white border-terracotta-600' : 'bg-oatmeal-100 text-ink-700 border-oatmeal-200'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="1"
                max="180"
                value={newPrepMinutes}
                onChange={(e) => setNewPrepMinutes(e.target.value)}
                className="w-full text-center text-xl font-bold py-2 bg-oatmeal-100 border border-oatmeal-200 rounded-2xl text-ink-900"
              />

              <button
                type="submit"
                className="w-full py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl text-xs font-bold shadow-paper"
              >
                Broadcast New Estimate
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DISH */}
      {newDishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative">
            <button
              onClick={() => setNewDishModal(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-ink-900 mb-4">Add Menu Item</h3>
            <form onSubmit={handleAddDish} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-ink-700 block mb-1">Dish Name</label>
                <input
                  type="text"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-xl p-2"
                  placeholder="e.g. Masala Dosa"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-ink-700 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-xl p-2"
                    placeholder="80.00"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-ink-700 block mb-1">Prep Time (min)</label>
                  <input
                    type="number"
                    value={dishPrepTime}
                    onChange={(e) => setDishPrepTime(e.target.value)}
                    className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-xl p-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-ink-700 block mb-1">Category</label>
                <select
                  value={dishCategory}
                  onChange={(e) => setDishCategory(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-xl p-2"
                >
                  <option value="Fast Food">Fast Food</option>
                  <option value="South Indian">South Indian</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Meals">Meals</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Desserts">Desserts</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-terracotta-500 text-white font-bold rounded-xl shadow-paper"
              >
                Save Dish
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESTOCK ITEM */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xs rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative">
            <button
              onClick={() => setRestockModalItem(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-ink-900 mb-1">Restock Item</h3>
            <p className="text-xs text-ink-500 mb-4">{restockModalItem.menu_item_name}</p>

            <form onSubmit={handleRestock} className="space-y-4">
              <input
                type="number"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                className="w-full text-center text-2xl font-bold py-2 bg-oatmeal-100 border border-oatmeal-200 rounded-2xl"
                required
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-sage-600 text-white rounded-xl text-xs font-bold shadow-paper"
              >
                Confirm Restock
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
