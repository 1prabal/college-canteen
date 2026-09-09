import React, { useState } from 'react';
import { X, Clock, Plus, Minus, ShoppingBag, AlertTriangle, Sparkles, Check, Tag } from 'lucide-react';

export default function ItemDetailModal({
  item,
  canteen,
  onClose,
  onAddToCart,
  currentQuantityInCart = 0,
  siblingVariants = []
}) {
  const [selectedVariant, setSelectedVariant] = useState(item);
  const [quantity, setQuantity] = useState(1);

  if (!item) return null;

  const currentItem = selectedVariant || item;
  const isAvailable = currentItem.is_available !== false;
  const isVerified = currentItem.is_verified !== false;
  const isMRP = currentItem.pricing_type === 'MRP';

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAdd = () => {
    if (!isAvailable || !isVerified) return;
    onAddToCart(currentItem, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-cream-50 w-full sm:max-w-lg rounded-t-[32px] sm:rounded-3xl border border-oatmeal-300 shadow-paper-floating overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-200">
        
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-oatmeal-300 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Modal Header Image */}
        <div className="relative h-52 sm:h-60 w-full bg-oatmeal-200 overflow-hidden">
          {currentItem.image_url ? (
            <img
              src={currentItem.image_url}
              alt={currentItem.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-ink-400">
              <Tag className="w-10 h-10 mb-1" />
              <span className="text-xs font-semibold">Campus Dining</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-black/20" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-ink-800 flex items-center justify-center shadow-paper backdrop-blur-xs transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Canteen & Category Badges */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-ink-900 shadow-xs backdrop-blur-xs">
              {currentItem.category || 'General'}
            </span>
            {canteen?.name && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-ink-900/80 text-white shadow-xs backdrop-blur-xs">
                {canteen.name}
              </span>
            )}
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div>
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 className="text-xl font-bold text-ink-900 leading-tight">
                {currentItem.name}
              </h2>
              <div className="text-right shrink-0">
                {isMRP ? (
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-extrabold text-[10px] uppercase border border-teal-200">
                      MRP
                    </span>
                    <span className="text-lg font-black text-ink-900 font-mono">
                      ₹{Number(currentItem.price).toFixed(2)}
                    </span>
                  </div>
                ) : !isVerified ? (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                    Price at Counter
                  </span>
                ) : (
                  <span className="text-xl font-black text-ink-900 font-mono">
                    ₹{Number(currentItem.price).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {currentItem.unit_info && (
              <div className="inline-block px-2.5 py-0.5 bg-oatmeal-200 text-ink-700 text-xs font-semibold rounded-md mb-2">
                Unit: {currentItem.unit_info}
              </div>
            )}

            <p className="text-xs sm:text-sm text-ink-600 leading-relaxed mt-1">
              {currentItem.description || 'Authentic campus favorite freshly prepared upon ordering.'}
            </p>
          </div>

          {/* Preparation Time & Status Meta */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-white border border-oatmeal-200 rounded-2xl text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-oatmeal-100 flex items-center justify-center text-terracotta-600 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-ink-400 font-bold block uppercase">Prep Time</span>
                <span className="font-bold text-ink-900">{currentItem.preparation_time_minutes || 10} minutes</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                !isVerified ? 'bg-amber-100 text-amber-700' :
                isAvailable ? 'bg-sage-100 text-sage-700' : 'bg-rose-100 text-rose-700'
              }`}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-ink-400 font-bold block uppercase">Availability</span>
                <span className={`font-bold ${
                  !isVerified ? 'text-amber-700' :
                  isAvailable ? 'text-sage-700' : 'text-rose-700'
                }`}>
                  {!isVerified ? 'Pending Verification' : isAvailable ? 'In Stock' : 'Sold Out'}
                </span>
              </div>
            </div>
          </div>

          {/* Sibling Variants Selector (e.g. Half Kg vs Full Kg cakes) */}
          {siblingVariants && siblingVariants.length > 1 && (
            <div className="p-3.5 bg-white border border-oatmeal-200 rounded-2xl">
              <label className="text-xs font-bold text-ink-900 block mb-2">
                Select Option / Size:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {siblingVariants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                      selectedVariant.id === variant.id
                        ? 'border-terracotta-500 bg-terracotta-50/50 ring-2 ring-terracotta-200 text-ink-900'
                        : 'border-oatmeal-200 bg-oatmeal-50 hover:bg-oatmeal-100 text-ink-600'
                    }`}
                  >
                    <span className="font-bold truncate">{variant.unit_info || variant.name}</span>
                    <span className="font-mono font-bold text-terracotta-600 mt-1">
                      ₹{Number(variant.price).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Unverified Warning Notice */}
          {!isVerified && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block">Manual Price Verification Required</span>
                This item's chalkboard price is partially obscured on the photo board. Please check with the canteen counter before placing an order.
              </div>
            </div>
          )}

          {/* Already In Cart Notice */}
          {currentQuantityInCart > 0 && (
            <div className="p-2.5 bg-sage-50 border border-sage-200 rounded-xl text-xs text-sage-800 flex items-center justify-between">
              <span>Currently in your basket:</span>
              <span className="font-bold">{currentQuantityInCart} pcs</span>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-5 sm:p-6 border-t border-oatmeal-200 bg-white flex items-center gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center bg-oatmeal-100 border border-oatmeal-300 rounded-2xl p-1">
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1 || !isAvailable || !isVerified}
              className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-ink-700 hover:bg-oatmeal-200 disabled:opacity-40 transition-colors shadow-xs"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-9 text-center font-bold text-sm text-ink-900 font-mono">
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              disabled={!isAvailable || !isVerified}
              className="w-8 h-8 rounded-xl bg-terracotta-500 text-white flex items-center justify-center hover:bg-terracotta-600 disabled:opacity-40 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Basket Action */}
          <button
            onClick={handleAdd}
            disabled={!isAvailable || !isVerified}
            className="flex-1 py-3 px-4 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-paper flex items-center justify-between transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>
                {!isVerified ? 'Price Unverified' : !isAvailable ? 'Sold Out' : 'Add to Basket'}
              </span>
            </div>
            {isVerified && isAvailable && (
              <span className="font-mono font-extrabold text-white">
                ₹{(Number(currentItem.price) * quantity).toFixed(2)}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
