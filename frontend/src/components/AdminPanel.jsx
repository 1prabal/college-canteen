import React, { useState, useEffect } from 'react';
import { 
  Store, Utensils, Plus, Users, DollarSign, Percent, 
  TrendingUp, RotateCcw, Building, ShieldCheck, Check, 
  Save, RefreshCw 
} from 'lucide-react';

export default function AdminPanel({ canteens, onRefreshCanteens }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'analytics' | 'commission' | 'canteens' | 'menu' | 'users'
  
  // Overview metrics state
  const [overview, setOverview] = useState(null);
  const [canteenAnalytics, setCanteenAnalytics] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Commission rate state
  const [commissionRate, setCommissionRate] = useState(0.05);
  const [savedNotice, setSavedNotice] = useState('');

  // Add Canteen Form state
  const [newCanteenName, setNewCanteenName] = useState('');
  const [newCanteenLocation, setNewCanteenLocation] = useState('');
  const [newCanteenDesc, setNewCanteenDesc] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');

  // Add Dish Form state
  const [selectedCanteenId, setSelectedCanteenId] = useState(canteens[0]?.id || 1);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('Fast Food');
  const [itemPrepTime, setItemPrepTime] = useState(10);
  const [itemImageUrl, setItemImageUrl] = useState('');

  useEffect(() => {
    fetchOverview();
    fetchAnalytics();
    fetchUsers();
    fetchCommissionRate();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/overview');
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
        setCommissionRate(data.commission_rate);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/canteen-analytics');
      if (res.ok) {
        const data = await res.json();
        setCanteenAnalytics(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCommissionRate = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/commission-rate');
      if (res.ok) {
        const data = await res.json();
        setCommissionRate(data.commission_rate);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCommissionRate = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/commission-rate?rate=${commissionRate}`, {
        method: 'PUT'
      });
      if (res.ok) {
        setSavedNotice('Commission rate updated successfully!');
        fetchOverview();
        fetchAnalytics();
        setTimeout(() => setSavedNotice(''), 3000);
      }
    } catch (e) {
      alert("Error saving commission rate.");
    }
  };

  const handleCreateCanteen = async (e) => {
    e.preventDefault();
    if (!newCanteenName || !newCanteenLocation) return;

    try {
      const res = await fetch('http://localhost:8000/api/canteens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCanteenName,
          location: newCanteenLocation,
          description: newCanteenDesc || 'Campus dining venue',
          owner_id: selectedOwnerId ? Number(selectedOwnerId) : null,
          is_open: true,
          is_active: true
        }),
      });

      if (!res.ok) throw new Error('Failed to create canteen');
      setNewCanteenName('');
      setNewCanteenLocation('');
      setNewCanteenDesc('');
      onRefreshCanteens();
      fetchOverview();
      fetchAnalytics();
      alert('Canteen outlet created successfully!');
    } catch (err) {
      alert('Error creating canteen outlet.');
    }
  };

  const handleCreateMenuItem = async (e) => {
    e.preventDefault();
    if (!itemName || !itemPrice) return;

    try {
      const res = await fetch('http://localhost:8000/api/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canteen_id: selectedCanteenId,
          name: itemName,
          price: parseFloat(itemPrice),
          category: itemCategory,
          preparation_time_minutes: Number(itemPrepTime),
          image_url: itemImageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
          is_available: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to add dish');
      setItemName('');
      setItemPrice('');
      setItemImageUrl('');
      alert('Dish added to menu catalog successfully!');
    } catch (err) {
      alert('Error adding menu item.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
      {/* Header Banner */}
      <div className="bg-ink-900 text-white border border-ink-800 p-6 rounded-3xl shadow-paper-floating mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800 text-terracotta-400 text-xs font-bold mb-2 border border-ink-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Campus Platform Master Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Enterprise Administration</h1>
          <p className="text-xs text-ink-400">Campus-wide multi-outlet oversight, financial ledgers, and revenue split settings</p>
        </div>

        <button
          onClick={() => { fetchOverview(); fetchAnalytics(); fetchUsers(); }}
          className="px-4 py-2 rounded-2xl bg-ink-800 hover:bg-ink-700 text-ink-300 hover:text-white border border-ink-700 text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        {[
          { key: 'overview', label: 'Platform Overview', icon: TrendingUp },
          { key: 'analytics', label: 'Canteen Financials', icon: DollarSign },
          { key: 'commission', label: 'Commission Config', icon: Percent },
          { key: 'canteens', label: 'Dining Outlets', icon: Store },
          { key: 'menu', label: 'Dish Catalog', icon: Utensils },
          { key: 'users', label: 'Campus Users', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-terracotta-500 text-white shadow-paper'
                  : 'bg-white border border-oatmeal-300 text-ink-700 hover:bg-oatmeal-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: PLATFORM OVERVIEW */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 shadow-paper">
              <span className="text-[10px] font-bold uppercase text-ink-400 block mb-1">Total Users</span>
              <div className="text-2xl font-black text-ink-900">{overview.total_users}</div>
              <span className="text-[11px] text-ink-500 mt-1 block">
                {overview.total_students} Students • {overview.total_faculty} Faculty
              </span>
            </div>

            <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 shadow-paper">
              <span className="text-[10px] font-bold uppercase text-ink-400 block mb-1">Active Outlets</span>
              <div className="text-2xl font-black text-ink-900">{overview.total_canteens}</div>
              <span className="text-[11px] text-ink-500 mt-1 block">{overview.total_canteen_staff} Staff Members</span>
            </div>

            <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 shadow-paper">
              <span className="text-[10px] font-bold uppercase text-ink-400 block mb-1">Gross Order Volume</span>
              <div className="text-2xl font-black text-ink-900">₹{Number(overview.total_transaction_value).toFixed(2)}</div>
              <span className="text-[11px] text-ink-500 mt-1 block">{overview.total_orders} total orders</span>
            </div>

            <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 shadow-paper">
              <span className="text-[10px] font-bold uppercase text-ink-400 block mb-1">Platform Earnings</span>
              <div className="text-2xl font-black text-sage-700">₹{Number(overview.total_platform_earnings).toFixed(2)}</div>
              <span className="text-[11px] text-sage-600 mt-1 block">Rate: {(overview.commission_rate * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: CANTEEN FINANCIALS BREAKDOWN */}
      {activeTab === 'analytics' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
          <h2 className="text-base font-bold text-ink-900 mb-1">Outlet Financial Reconciliation</h2>
          <p className="text-xs text-ink-500 mb-6">Real-time ledger breakdown calculating gross revenue, platform commission, and net vendor payout.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-oatmeal-200 text-ink-500 font-bold uppercase text-[10px]">
                  <th className="pb-3">Canteen Outlet</th>
                  <th className="pb-3">Owner</th>
                  <th className="pb-3 text-center">Orders</th>
                  <th className="pb-3 text-right">Gross Sales</th>
                  <th className="pb-3 text-right">Platform Fee</th>
                  <th className="pb-3 text-right">Refunds</th>
                  <th className="pb-3 text-right">Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oatmeal-100">
                {canteenAnalytics.map((c) => (
                  <tr key={c.canteen_id} className="text-ink-800">
                    <td className="py-3.5 font-bold">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-ink-400 font-normal">{c.location}</div>
                    </td>
                    <td className="py-3.5 text-ink-600">{c.owner_name}</td>
                    <td className="py-3.5 text-center font-bold">{c.total_orders}</td>
                    <td className="py-3.5 text-right font-mono font-bold text-ink-900">
                      ₹{Number(c.gross_sales).toFixed(2)}
                    </td>
                    <td className="py-3.5 text-right font-mono text-terracotta-600">
                      -₹{Number(c.platform_commission).toFixed(2)}
                    </td>
                    <td className="py-3.5 text-right font-mono text-ink-500">
                      ₹{Number(c.refunds).toFixed(2)}
                    </td>
                    <td className="py-3.5 text-right font-mono font-black text-sage-700 text-sm">
                      ₹{Number(c.net_canteen_earnings).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: CONFIGURABLE COMMISSION */}
      {activeTab === 'commission' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 sm:p-8 shadow-paper max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center border border-terracotta-200">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-900">Platform Commission Setup</h2>
              <p className="text-xs text-ink-500">Configure marketplace commission deducted on verified orders</p>
            </div>
          </div>

          {savedNotice && (
            <div className="p-3 bg-sage-50 text-sage-800 border border-sage-200 rounded-xl text-xs mb-4 flex items-center gap-2">
              <Check className="w-4 h-4 text-sage-600" />
              <span>{savedNotice}</span>
            </div>
          )}

          <div className="space-y-6 text-xs">
            <div>
              <div className="flex justify-between items-center mb-2 font-bold text-ink-800">
                <span>Commission Percentage</span>
                <span className="text-lg font-black text-terracotta-600 font-mono">
                  {(commissionRate * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.00"
                max="0.25"
                step="0.005"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-oatmeal-200 rounded-lg appearance-none cursor-pointer accent-terracotta-500"
              />
              <div className="flex justify-between text-[10px] text-ink-400 mt-1">
                <span>0% (Free Campus Service)</span>
                <span>25% (Standard Commercial)</span>
              </div>
            </div>

            <div className="p-4 bg-oatmeal-50 border border-oatmeal-200 rounded-2xl">
              <span className="text-[11px] font-bold text-ink-800 block mb-1">Example Calculation</span>
              <p className="text-[11px] text-ink-600">
                On an order of ₹100.00, platform earns <strong className="text-terracotta-600">₹{(100 * commissionRate).toFixed(2)}</strong> and canteen receives <strong className="text-sage-700">₹{(100 * (1 - commissionRate)).toFixed(2)}</strong>.
              </p>
            </div>

            <button
              onClick={handleSaveCommissionRate}
              className="w-full py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-2xl shadow-paper flex items-center justify-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" /> Save Commission Rate
            </button>
          </div>
        </div>
      )}

      {/* SECTION 4: CANTEEN OUTLETS MANAGEMENT */}
      {activeTab === 'canteens' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
            <h2 className="text-sm font-bold text-ink-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-terracotta-500" /> Onboard New Outlet
            </h2>

            <form onSubmit={handleCreateCanteen} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-ink-700 block mb-1">Outlet Name</label>
                <input
                  type="text"
                  placeholder="e.g. Science Block Cafe"
                  value={newCanteenName}
                  onChange={(e) => setNewCanteenName(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-ink-700 block mb-1">Campus Location</label>
                <input
                  type="text"
                  placeholder="e.g. Block C, 1st Floor"
                  value={newCanteenLocation}
                  onChange={(e) => setNewCanteenLocation(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-ink-700 block mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Fresh juices, healthy breakfast sandwiches..."
                  value={newCanteenDesc}
                  onChange={(e) => setNewCanteenDesc(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
                />
              </div>

              <div>
                <label className="font-semibold text-ink-700 block mb-1">Assign Canteen Owner</label>
                <select
                  value={selectedOwnerId}
                  onChange={(e) => setSelectedOwnerId(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
                >
                  <option value="">Unassigned</option>
                  {usersList.filter((u) => u.role === 'canteen_owner' || u.role === 'canteen_staff').map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.college_id})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-2xl shadow-paper flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Save Outlet
              </button>
            </form>
          </div>

          <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
            <h2 className="text-sm font-bold text-ink-900 mb-4">Configured Campus Outlets</h2>
            <div className="space-y-3 text-xs">
              {canteens.map((c) => (
                <div key={c.id} className="p-3.5 bg-oatmeal-50 border border-oatmeal-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-ink-900">{c.name}</div>
                    <div className="text-[11px] text-ink-500">{c.location}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    c.is_open ? 'bg-sage-100 text-sage-800' : 'bg-oatmeal-200 text-ink-500'
                  }`}>
                    {c.is_open ? 'Open' : 'Closed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: DISH CATALOG */}
      {activeTab === 'menu' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper max-w-lg mx-auto">
          <h2 className="text-sm font-bold text-ink-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-terracotta-500" /> Add Dish to Any Outlet Menu
          </h2>

          <form onSubmit={handleCreateMenuItem} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-ink-700 block mb-1">Target Outlet</label>
              <select
                value={selectedCanteenId}
                onChange={(e) => setSelectedCanteenId(Number(e.target.value))}
                className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
              >
                {canteens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-ink-700 block mb-1">Dish Name</label>
              <input
                type="text"
                placeholder="e.g. Avocado Toast or Dosa"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-ink-700 block mb-1">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="85.00"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-ink-700 block mb-1">Prep Time (min)</label>
                <input
                  type="number"
                  value={itemPrepTime}
                  onChange={(e) => setItemPrepTime(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-ink-700 block mb-1">Category</label>
              <select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
              >
                <option value="Fast Food">Fast Food</option>
                <option value="South Indian">South Indian</option>
                <option value="Beverages">Beverages</option>
                <option value="Meals">Meals</option>
                <option value="Snacks">Snacks</option>
                <option value="Desserts">Desserts</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-ink-700 block mb-1">Image URL (Optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={itemImageUrl}
                onChange={(e) => setItemImageUrl(e.target.value)}
                className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-2xl shadow-paper"
            >
              Add Dish to Catalog
            </button>
          </form>
        </div>
      )}

      {/* SECTION 6: CAMPUS USERS */}
      {activeTab === 'users' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
          <h2 className="text-base font-bold text-ink-900 mb-4">Registered Campus Members & Clearances</h2>
          <div className="divide-y divide-oatmeal-100 text-xs">
            {usersList.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-ink-900">{u.name}</div>
                  <div className="text-[11px] text-ink-500">{u.email || 'No email registered'} • Roll ID: {u.college_id}</div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                  u.role === 'platform_admin' || u.role === 'admin' ? 'bg-ink-900 text-white border-ink-800' :
                  u.role === 'canteen_staff' ? 'bg-sage-100 text-sage-800 border-sage-300' :
                  u.role === 'canteen_owner' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                  u.role === 'faculty' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                  'bg-terracotta-50 text-terracotta-700 border-terracotta-200'
                }`}>
                  {u.role.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
