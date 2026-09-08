import React, { useState } from 'react';
import { 
  Store, 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  ChefHat, 
  AlertCircle, 
  GraduationCap, 
  KeyRound,
  Building2,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ManagerLogin({ canteens = [], onLoginSuccess, onSwitchPortal }) {
  const { loginManager, loginWithGoogle, quickDemoLogin, loading, authError, setAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCanteenId, setSelectedCanteenId] = useState(canteens[0]?.id || 1);
  const [localError, setLocalError] = useState('');

  const activeCanteen = canteens.find((c) => c.id === Number(selectedCanteenId)) || {
    id: 1,
    name: 'Central Food Court'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email || !password) {
      setLocalError('Please enter manager staff email and password.');
      return;
    }

    try {
      const res = await loginManager({ 
        email, 
        password, 
        canteenId: activeCanteen.id,
        canteenName: activeCanteen.name 
      });
      if (res.success) {
        onLoginSuccess && onLoginSuccess('canteen_staff');
      } else {
        setLocalError(res.error || 'Manager login failed. Please verify kitchen staff credentials.');
      }
    } catch (err) {
      setLocalError(err.message || 'Access restricted to authorized canteen managers.');
    }
  };

  const handleDemoFill = () => {
    setEmail('manager.central@campusbites.edu');
    setPassword('manager123');
    setSelectedCanteenId(1);
    setLocalError('');
  };

  const handleInstantDemo = () => {
    quickDemoLogin('canteen_staff', {
      canteenId: activeCanteen.id,
      canteenName: activeCanteen.name
    });
    onLoginSuccess && onLoginSuccess('canteen_staff');
  };

  const handleGoogleSignIn = async () => {
    setLocalError('');
    const res = await loginWithGoogle('canteen_staff', {
      canteenId: activeCanteen.id,
      canteenName: activeCanteen.name
    });
    if (res?.success) {
      onLoginSuccess && onLoginSuccess('canteen_staff');
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white border border-sage-200 rounded-3xl shadow-paper-elevated p-6 sm:p-8 transition-all">
        
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-sage-100 border border-sage-300 text-sage-800 text-xs font-bold">
            <ChefHat className="w-4 h-4 text-sage-700" />
            <span>Canteen Manager Portal</span>
          </div>
          <span className="text-[11px] font-semibold text-sage-600 bg-sage-50 px-2.5 py-0.5 rounded-full border border-sage-200">
            Kitchen Dispatch
          </span>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-ink-900 tracking-tight">
            Kitchen & Staff Login
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Access live order tickets, manage food preparation status, and update item availability.
          </p>
        </div>

        {/* Error Notification */}
        {(localError || authError) && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Manager Access Restriction</p>
              <p className="text-[11px] text-rose-700 mt-0.5">{localError || authError}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Canteen Outlet Assignment Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-sage-800 mb-1">
              Select Your Canteen Outlet
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-sage-600" />
              <select
                value={selectedCanteenId}
                onChange={(e) => setSelectedCanteenId(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 bg-sage-50/70 border border-sage-300 rounded-2xl text-xs font-semibold text-ink-900 focus:outline-none focus:border-sage-600 focus:bg-white transition-colors"
              >
                {canteens.length > 0 ? (
                  canteens.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.location})
                    </option>
                  ))
                ) : (
                  <>
                    <option value={1}>Central Food Court (Campus Core)</option>
                    <option value={2}>South Campus Cafe (Hostel Block C)</option>
                    <option value={3}>Green Garden Bistro (Academic Quad)</option>
                  </>
                )}
              </select>
            </div>
            <p className="text-[10px] text-sage-600 mt-1 italic">
              *Incoming kitchen queue will be synchronized to this outlet.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1">
              Staff Email / ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="email"
                required
                placeholder="manager.central@campusbites.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-oatmeal-50 border border-oatmeal-300 rounded-2xl text-xs text-ink-900 focus:outline-none focus:border-sage-600 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1">
              Kitchen Security Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-oatmeal-50 border border-oatmeal-300 rounded-2xl text-xs text-ink-900 focus:outline-none focus:border-sage-600 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-sage-600 hover:bg-sage-700 text-white rounded-2xl font-bold text-xs shadow-paper hover:shadow-paper-elevated active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Validating Manager Credentials...</span>
            ) : (
              <>
                <span>Enter Kitchen Dispatch Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 text-center">
          <hr className="border-oatmeal-300" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 text-[10px] uppercase font-bold text-ink-400 tracking-wider">
            Quick Staff Authentication
          </span>
        </div>

        {/* Google Staff Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-white border border-sage-300 hover:bg-sage-50 text-ink-800 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-paper"
        >
          <ChefHat className="w-4 h-4 text-sage-600" />
          <span>Sign In with Registered Staff Google ID</span>
        </button>

        {/* Quick Testing Actions */}
        <div className="mt-5 p-3 bg-sage-50/80 border border-sage-200 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-sage-800 uppercase tracking-wider">
              Demo Kitchen Credentials
            </span>
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-[10px] font-bold text-sage-700 hover:underline"
            >
              Fill Credentials
            </button>
          </div>
          <button
            type="button"
            onClick={handleInstantDemo}
            className="w-full py-1.5 px-3 bg-white border border-sage-300 hover:bg-sage-100 text-sage-900 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-sage-600" />
            <span>Instant Demo: Chef Vikram ({activeCanteen.name})</span>
          </button>
        </div>

        {/* Portal Switchers */}
        <div className="mt-6 pt-5 border-t border-oatmeal-200">
          <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wider text-center mb-3">
            Not a Canteen Manager?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSwitchPortal && onSwitchPortal('login-student')}
              className="p-2.5 rounded-2xl bg-oatmeal-100 hover:bg-terracotta-50 hover:border-terracotta-300 border border-oatmeal-200 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-terracotta-700 font-bold text-[11px] mb-0.5">
                <GraduationCap className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>Student Portal</span>
              </div>
              <p className="text-[10px] text-ink-500">Order Food Ahead</p>
            </button>

            <button
              type="button"
              onClick={() => onSwitchPortal && onSwitchPortal('login-admin')}
              className="p-2.5 rounded-2xl bg-oatmeal-100 hover:bg-ink-100 hover:border-ink-300 border border-oatmeal-200 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-ink-900 font-bold text-[11px] mb-0.5">
                <KeyRound className="w-3.5 h-3.5 text-terracotta-600 group-hover:scale-110 transition-transform" />
                <span>Admin Terminal</span>
              </div>
              <p className="text-[10px] text-ink-500">Campus Oversight</p>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
