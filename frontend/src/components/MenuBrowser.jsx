import React, { useState } from 'react';
import { ArrowLeft, Search, Plus, Minus, ShoppingBag, MapPin, Tag } from 'lucide-react';

export default function MenuBrowser({ canteen, menuItems, cart, onAddToCart, onBack, onOpenCart }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...new Set(menuItems.map((item) => item.category || 'General'))];

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getItemQuantityInCart = (itemId) => {
    const existing = cart.find((i) => i.id === itemId);
    return existing ? existing.quantity : 0;
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-32 sm:pb-24">
      {/* Header and Back Action */}
      <div className="mb-5">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-ink-600 hover:text-ink-900 transition-colors mb-3 text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Canteens
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white border border-oatmeal-300 p-5 rounded-3xl shadow-paper">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink-900 mb-1">{canteen.name}</h1>
            <p className="text-ink-500 text-xs flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sage-600" /> {canteen.location}
            </p>
          </div>

          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl pl-9 pr-3 py-2 text-xs sm:text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-terracotta-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Horizontal Swipeable Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-terracotta-500 text-white shadow-paper'
                : 'bg-white border border-oatmeal-300 text-ink-600 hover:text-ink-900 hover:bg-oatmeal-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-oatmeal-300 shadow-paper">
          <Tag className="w-10 h-10 text-oatmeal-400 mx-auto mb-2" />
          <p className="text-ink-500 text-sm">No dishes found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-10">
          {filteredItems.map((item) => {
            const qty = getItemQuantityInCart(item.id);

            return (
              <div
                key={item.id}
                className="bg-white border border-oatmeal-300 hover:border-oatmeal-400 rounded-3xl overflow-hidden transition-all duration-200 shadow-paper hover:shadow-paper-elevated flex flex-col justify-between"
              >
                <div>
                  {/* Food Image Container */}
                  <div className="relative h-44 w-full bg-oatmeal-100 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-400 text-xs font-medium">
                        No Image
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-bold text-ink-700 border border-oatmeal-200 shadow-xs">
                      {item.category || 'General'}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-sm sm:text-base text-ink-900 leading-snug">{item.name}</h3>
                      <span className="font-bold text-ink-900 text-sm sm:text-base whitespace-nowrap">
                        ₹{item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-4 sm:p-5 pt-0">
                  {qty === 0 ? (
                    <button
                      onClick={() => onAddToCart(item, 1)}
                      disabled={!item.is_available}
                      className={`w-full py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                        item.is_available
                          ? 'bg-terracotta-500 hover:bg-terracotta-600 text-white shadow-paper'
                          : 'bg-oatmeal-200 text-ink-400 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {item.is_available ? 'Add to Order' : 'Sold Out'}
                    </button>
                  ) : (
                    <div className="flex items-center justify-between bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-1">
                      <button
                        onClick={() => onAddToCart(item, -1)}
                        className="w-8 h-8 rounded-xl bg-white border border-oatmeal-200 hover:bg-oatmeal-50 flex items-center justify-center text-ink-700 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs text-ink-900">{qty} in cart</span>
                      <button
                        onClick={() => onAddToCart(item, 1)}
                        className="w-8 h-8 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 flex items-center justify-center text-white transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Cart Bar (Positioned above mobile nav on small screens) */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white/95 backdrop-blur-md border border-oatmeal-300 shadow-paper-floating p-3 sm:p-3.5 rounded-3xl flex items-center justify-between z-40 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-terracotta-100 text-terracotta-700 border border-terracotta-200 flex items-center justify-center font-bold text-xs">
              {totalCartCount}
            </div>
            <div>
              <div className="text-[10px] text-ink-500 font-medium">Subtotal</div>
              <div className="font-bold text-ink-900 text-sm sm:text-base">₹{totalCartPrice.toFixed(2)}</div>
            </div>
          </div>

          <button
            onClick={onOpenCart}
            className="px-4 sm:px-5 py-2 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 active:scale-95 text-white font-bold text-xs shadow-paper flex items-center gap-1.5 transition-all"
          >
            <span>Checkout</span>
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
