import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Store, Utensils, CheckCircle2, X } from 'lucide-react';

export default function AdminPanel({ canteens, onRefreshCanteens }) {
  const [activeTab, setActiveTab] = useState('canteens');
  const [newCanteenName, setNewCanteenName] = useState('');
  const [newCanteenLocation, setNewCanteenLocation] = useState('');
  const [selectedCanteenId, setSelectedCanteenId] = useState(canteens[0]?.id || 1);

  // New Menu Item form state
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('Fast Food');
  const [itemImageUrl, setItemImageUrl] = useState('');

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
          is_open: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to create canteen');
      setNewCanteenName('');
      setNewCanteenLocation('');
      onRefreshCanteens();
      alert('Canteen created successfully!');
    } catch (err) {
      console.error(err);
      alert('Error creating canteen.');
    }
  };

  const handleCreateMenuItem = async (e) => {
    e.preventDefault();
    if (!itemName || !itemPrice) return;

    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemName,
          price: parseFloat(itemPrice),
          category: itemCategory,
          image_url: itemImageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
          is_available: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to add dish');
      setItemName('');
      setItemPrice('');
      setItemImageUrl('');
      alert('Dish added to menu successfully!');
    } catch (err) {
      console.error(err);
      alert('Error adding menu item.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
      {/* Title */}
      <div className="bg-white border border-oatmeal-300 p-5 rounded-3xl shadow-paper mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-ink-900">Campus Dining Control Panel</h1>
        <p className="text-xs text-ink-500">Manage dining outlets, operational statuses, and live menus</p>
      </div>

      {/* Navigation Pills */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('canteens')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'canteens'
              ? 'bg-terracotta-500 text-white shadow-paper'
              : 'bg-white border border-oatmeal-300 text-ink-600 hover:bg-oatmeal-100'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Dining Outlets</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'menu'
              ? 'bg-terracotta-500 text-white shadow-paper'
              : 'bg-white border border-oatmeal-300 text-ink-600 hover:bg-oatmeal-100'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Dish Catalog</span>
        </button>
      </div>

      {/* Canteens Management */}
      {activeTab === 'canteens' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Canteen Form */}
          <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 sm:p-6 shadow-paper">
            <h2 className="text-sm font-bold text-ink-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-terracotta-500" /> Add New Outlet
            </h2>

            <form onSubmit={handleCreateCanteen} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Outlet Name</label>
                <input
                  type="text"
                  placeholder="e.g. Science Block Cafe"
                  value={newCanteenName}
                  onChange={(e) => setNewCanteenName(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Campus Location</label>
                <input
                  type="text"
                  placeholder="e.g. Block C, 1st Floor"
                  value={newCanteenLocation}
                  onChange={(e) => setNewCanteenLocation(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-2xl shadow-paper flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Save Outlet
              </button>
            </form>
          </div>

          {/* Active Outlets List */}
          <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 sm:p-6 shadow-paper">
            <h2 className="text-sm font-bold text-ink-900 mb-4">Configured Outlets</h2>
            <div className="space-y-3">
              {canteens.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 bg-oatmeal-50 border border-oatmeal-200 rounded-2xl"
                >
                  <div>
                    <div className="font-bold text-xs text-ink-900">{c.name}</div>
                    <div className="text-[11px] text-ink-500">{c.location}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.is_open ? 'bg-sage-100 text-sage-800' : 'bg-oatmeal-200 text-ink-500'
                    }`}
                  >
                    {c.is_open ? 'Active' : 'Offline'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Item Management */}
      {activeTab === 'menu' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 sm:p-6 shadow-paper max-w-lg mx-auto">
          <h2 className="text-sm font-bold text-ink-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-terracotta-500" /> Add Dish to Menu
          </h2>

          <form onSubmit={handleCreateMenuItem} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-ink-700 mb-1">Target Canteen</label>
              <select
                value={selectedCanteenId}
                onChange={(e) => setSelectedCanteenId(Number(e.target.value))}
                className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
              >
                {canteens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-ink-700 mb-1">Dish Name</label>
              <input
                type="text"
                placeholder="e.g. Avocado Toast or Dosa"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="85.00"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Category</label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
                >
                  <option value="Fast Food">Fast Food</option>
                  <option value="South Indian">South Indian</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Meals">Meals</option>
                  <option value="Desserts">Desserts</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-ink-700 mb-1">Image URL (Optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={itemImageUrl}
                onChange={(e) => setItemImageUrl(e.target.value)}
                className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-2xl shadow-paper flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Dish
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
