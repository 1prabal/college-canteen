import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Wallet, CreditCard, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CartModal({ cart, canteen, onUpdateQuantity, onRemoveItem, onOrderSuccess, onClose }) {
  const { currentUser } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState('WALLET'); // 'WALLET' | 'UPI'
  const [upiApp, setUpiApp] = useState('gpay');
  const [upiId, setUpiId] = useState('student@oksbi');
  const [walletBalance, setWalletBalance] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (currentUser?.id) {
      fetchWallet();
    }
  }, [currentUser?.id]);

  const fetchWallet = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/wallet?user_id=${currentUser?.id || 1}`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(parseFloat(data.balance));
      }
    } catch (e) {
      console.warn("Could not fetch wallet balance:", e);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutError('');

    if (selectedMethod === 'WALLET' && walletBalance !== null && walletBalance < totalAmount) {
      setCheckoutError(`Insufficient wallet balance (₹${walletBalance.toFixed(2)}). Please switch to UPI or recharge.`);
      return;
    }

    setIsProcessing(true);

    try {
      const orderPayload = {
        canteen_id: canteen.id,
        user_id: currentUser?.id || 1,
        payment_method: selectedMethod === 'WALLET' ? 'WALLET' : `UPI (${upiApp.toUpperCase()}) - ${upiId}`,
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

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Order creation failed');
      }

      const data = await res.json();
      setIsProcessing(false);
      onOrderSuccess(data);
    } catch (err) {
      console.error(err);
      setCheckoutError(err.message || 'Payment or order placement failed. Please verify item availability.');
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
          {checkoutError && (
            <div className="p-3 bg-terracotta-50 border border-terracotta-200 text-terracotta-800 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-terracotta-600" />
              <span>{checkoutError}</span>
            </div>
          )}

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
                  <div className="text-xs text-ink-500 font-semibold">₹{Number(item.price).toFixed(2)} each</div>
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

          {/* Payment Method Selector */}
          {cart.length > 0 && (
            <div className="mt-5 p-4 bg-white border border-oatmeal-200 rounded-2xl shadow-paper">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-ink-900">Select Payment Method</span>
                <span className="text-[10px] font-semibold text-sage-700 bg-sage-50 border border-sage-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified Server Ledger
                </span>
              </div>

              {/* Toggle Buttons: Campus Wallet vs UPI */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('WALLET')}
                  className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                    selectedMethod === 'WALLET'
                      ? 'bg-sage-50 border-sage-400 ring-2 ring-sage-100 shadow-xs'
                      : 'bg-oatmeal-50 border-oatmeal-200 hover:bg-oatmeal-100 text-ink-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-ink-900 mb-1">
                    <Wallet className="w-3.5 h-3.5 text-sage-600" />
                    <span>Campus Wallet</span>
                  </div>
                  <div className="text-[11px] text-ink-500">
                    Balance: <span className="font-bold text-sage-700">₹{(walletBalance ?? 500).toFixed(2)}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('UPI')}
                  className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                    selectedMethod === 'UPI'
                      ? 'bg-terracotta-50 border-terracotta-400 ring-2 ring-terracotta-100 shadow-xs'
                      : 'bg-oatmeal-50 border-oatmeal-200 hover:bg-oatmeal-100 text-ink-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-ink-900 mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-terracotta-600" />
                    <span>UPI Sandbox</span>
                  </div>
                  <div className="text-[11px] text-ink-500">
                    GPay / PhonePe / Paytm
                  </div>
                </button>
              </div>

              {/* UPI Sub-Options */}
              {selectedMethod === 'UPI' && (
                <div className="pt-2 border-t border-oatmeal-100">
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {['gpay', 'phonepe', 'paytm'].map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setUpiApp(app)}
                        className={`py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                          upiApp === app
                            ? 'bg-terracotta-500 text-white shadow-xs'
                            : 'bg-oatmeal-100 text-ink-600 border border-oatmeal-200'
                        }`}
                      >
                        {app === 'gpay' ? 'GPay' : app === 'phonepe' ? 'PhonePe' : 'Paytm'}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-xl px-3 py-2 text-xs font-medium text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white transition-all"
                    placeholder="Enter UPI VPA"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer / Total & Checkout Action */}
        {cart.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-oatmeal-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold text-ink-600 block">Total Payable</span>
                <span className="text-[10px] text-ink-400">Server verified • Zero fee</span>
              </div>
              <span className="text-xl font-bold text-ink-900">₹{totalAmount.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-paper flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <span className="animate-pulse">Authorizing Payment & Reserving Stock...</span>
              ) : (
                <>
                  <span>Pay ₹{totalAmount.toFixed(2)} with {selectedMethod === 'WALLET' ? 'Wallet' : 'UPI'}</span>
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
