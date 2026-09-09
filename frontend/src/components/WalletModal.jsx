import React, { useState, useEffect } from 'react';
import { Wallet, Plus, X, ArrowDownLeft, ArrowUpRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function WalletModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [rechargeAmt, setRechargeAmt] = useState(200);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser?.id) {
      fetchWalletData();
    }
  }, [isOpen, currentUser?.id]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        fetch(`http://localhost:8000/api/wallet?user_id=${currentUser?.id || 1}`),
        fetch(`http://localhost:8000/api/wallet/transactions?user_id=${currentUser?.id || 1}`)
      ]);

      if (walletRes.ok) {
        const wData = await walletRes.json();
        setBalance(parseFloat(wData.balance));
      }
      if (txRes.ok) {
        const tData = await txRes.json();
        setTransactions(tData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (rechargeAmt <= 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/wallet/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id || 1,
          amount: Number(rechargeAmt),
          payment_method: 'UPI (SANDBOX)'
        })
      });
      if (res.ok) {
        fetchWalletData();
      }
    } catch (e) {
      alert("Error recharging wallet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900 shadow-xs"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-sage-50 text-sage-700 border border-sage-200 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-900">Campus Dining Wallet</h2>
            <p className="text-xs text-ink-500">Atomic ledger-backed campus credit for quick checkout</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-cream-100 border border-oatmeal-300 rounded-2xl p-5 mb-5 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Available Balance</span>
              <div className="text-3xl font-black text-ink-900 font-mono mt-0.5">
                ₹{balance.toFixed(2)}
              </div>
              <span className="text-[11px] text-sage-700 font-semibold flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Immutable transaction log active
              </span>
            </div>
            <button
              onClick={fetchWalletData}
              className="p-2 rounded-xl bg-white border border-oatmeal-200 text-ink-600 hover:bg-oatmeal-50"
              title="Refresh Balance"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Quick Recharge Bar */}
          <div className="mt-4 pt-3 border-t border-oatmeal-200">
            <span className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-2">
              Fast 1-Click Top-Up (Sandbox)
            </span>
            <div className="flex items-center gap-2">
              {[100, 200, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setRechargeAmt(amt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    rechargeAmt === amt
                      ? 'bg-sage-600 text-white border-sage-700 shadow-xs'
                      : 'bg-white text-ink-700 border-oatmeal-300 hover:bg-oatmeal-50'
                  }`}
                >
                  +₹{amt}
                </button>
              ))}
              <button
                onClick={handleRecharge}
                disabled={isSubmitting}
                className="ml-auto px-4 py-1.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-xs shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Top-Up...' : 'Recharge'}
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Transaction History */}
        <div className="flex-1 overflow-y-auto min-h-[180px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">
            Transaction Ledger ({transactions.length})
          </h3>

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-xs text-ink-400">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-oatmeal-100 text-xs">
              {transactions.map((tx) => {
                const isDebit = tx.amount < 0 || tx.transaction_type === 'ORDER_PAYMENT';
                return (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        isDebit ? 'bg-terracotta-50 text-terracotta-600' : 'bg-sage-50 text-sage-600'
                      }`}>
                        {isDebit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="font-bold text-ink-900">{tx.description || tx.transaction_type}</div>
                        <div className="text-[10px] text-ink-400 font-mono">
                          {tx.transaction_reference} • {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`font-bold font-mono ${isDebit ? 'text-terracotta-600' : 'text-sage-700'}`}>
                        {isDebit ? '-' : '+'}₹{Math.abs(Number(tx.amount)).toFixed(2)}
                      </span>
                      <div className="text-[10px] text-ink-400">
                        Bal: ₹{Number(tx.balance_after).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
