import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CartModal({ cart, canteen, onUpdateQuantity, onRemoveItem, onOrderSuccess, onClose }) {
  const { currentUser } = useAuth();
  const [upiId, setUpiId] = useState('student@oksbi');
  const [paymentMethod, setPaymentMethod] = useState('gpay');
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const orderPayload = {
        canteen_id: canteen.id,
        user_id: 1, // Demo Student ID
        payment_method: `UPI (${paymentMethod.toUpperCase()}) - ${upiId}`,
        items: cart.map((i) => ({
          menu_item_id: i.id,
          quantity: i.quantity,
          unit_price: i.price,
        })),
      };

      const res = await fetch('http://localhost:8000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) throw new Error('Order creation failed');
      const data = await res.json();
      setIsProcessing(false);
      onOrderSuccess(data);
    } catch (err) {
      console.error(err);
      alert('Mock payment failed. Please ensure the backend is running.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink-900/30 backdrop-blur-xs">
      <div className="bg-cream-50 w-full sm:max-w-lg rounded-t-[32px] sm:rounded-3xl border border-oatmeal-300 shadow-paper-floating overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-200">
        
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-oatmeal-300 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-oatmeal-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink-900">Your Basket</h2>
            <p className="text-xs text-ink-500">{canteen?.name || 'Campus Dining'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-oatmeal-300 flex items-center justify-center text-ink-500 hover:text-ink-900 shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-ink-400 text-xs font-medium">
              Your basket is empty. Add fresh items from the menu.
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 bg-white border border-oatmeal-200 rounded-2xl shadow-paper"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-bold text-xs sm:text-sm text-ink-900 truncate">{item.name}</div>
                  <div className="text-xs text-ink-500 font-semibold">₹{item.price.toFixed(2)} each</div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-oatmeal-100 border border-oatmeal-200 rounded-xl p-0.5">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-ink-700 shadow-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-xs text-ink-900">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-terracotta-500 text-white flex items-center justify-center shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 text-ink-400 hover:text-terracotta-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Mock UPI Payment Simulator */}
          {cart.length > 0 && (
            <div className="mt-5 p-4 bg-white border border-oatmeal-200 rounded-2xl shadow-paper">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-ink-900">Simulate UPI Payment</span>
                <span className="text-[10px] font-semibold text-sage-700 bg-sage-50 border border-sage-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Secure Sandbox
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {['gpay', 'phonepe', 'paytm'].map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => setPaymentMethod(app)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                      paymentMethod === app
                        ? 'bg-sage-100 text-sage-800 border border-sage-300 shadow-xs'
                        : 'bg-oatmeal-100 text-ink-600 border border-oatmeal-200 hover:bg-oatmeal-200'
                    }`}
                  >
                    {app === 'gpay' ? 'Google Pay' : app === 'phonepe' ? 'PhonePe' : 'Paytm UPI'}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-xl px-3 py-2 text-xs font-medium text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white transition-all"
                  placeholder="Enter UPI VPA (e.g. mobile@upi)"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Total & Checkout Action */}
        {cart.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-oatmeal-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-ink-600">Total Payable</span>
              <span className="text-xl font-bold text-ink-900">₹{totalAmount.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-paper flex items-center justify-center gap-2 transition-all"
            >
              {isProcessing ? (
                <span className="animate-pulse">Authorizing Payment...</span>
              ) : (
                <>
                  <span>Pay ₹{totalAmount.toFixed(2)} & Place Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
