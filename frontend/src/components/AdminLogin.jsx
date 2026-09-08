import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  KeyRound, 
  AlertCircle, 
  GraduationCap, 
  Store,
  CheckCircle2,
  Terminal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin({ onLoginSuccess, onSwitchPortal }) {
  const { loginAdmin, loginWithGoogle, quickDemoLogin, loading, authError, setAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('ADMIN-2024');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email || !password) {
      setLocalError('Please enter administrator email and password.');
      return;
    }

    try {
      const res = await loginAdmin({ email, password, adminKey });
      if (res.success) {
        onLoginSuccess && onLoginSuccess('admin');
      } else {
        setLocalError(res.error || 'Administrator verification failed.');
      }
    } catch (err) {
      setLocalError(err.message || 'Access restricted to authorized campus administrators.');
    }
  };

  const handleDemoFill = () => {
    setEmail('admin.canteen@college.edu');
    setPassword('admin123');
    setAdminKey('ADMIN-2024');
    setLocalError('');
  };

  const handleInstantDemo = () => {
    quickDemoLogin('admin');
    onLoginSuccess && onLoginSuccess('admin');
  };

  const handleGoogleSignIn = async () => {
    setLocalError('');
    const res = await loginWithGoogle('admin');
    if (res?.success) {
      onLoginSuccess && onLoginSuccess('admin');
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-ink-900 text-cream-50 border border-ink-800 rounded-3xl shadow-paper-floating p-6 sm:p-8 transition-all relative overflow-hidden">
        
        {/* Glow ambient decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-terracotta-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sage-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Badge */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800 border border-ink-700 text-terracotta-400 text-xs font-bold">
            <ShieldAlert className="w-4 h-4 text-terracotta-400" />
            <span>Master Admin Console</span>
          </div>
          <span className="text-[10px] tracking-wider uppercase font-mono px-2 py-0.5 rounded bg-ink-800 text-ink-400 border border-ink-700">
            SECURE: LEVEL 1
          </span>
        </div>

        {/* Title */}
        <div className="mb-6 relative z-10">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Campus Administration
          </h1>
          <p className="text-xs text-ink-400 mt-1">
            Global canteen management, pricing controls, menu item configuration, and system oversight.
          </p>
        </div>

        {/* Error Notification */}
        {(localError || authError) && (
          <div className="mb-5 p-3.5 bg-rose-950/70 border border-rose-800/80 rounded-2xl flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in relative z-10">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Privilege Restriction</p>
              <p className="text-[11px] text-rose-300 mt-0.5">{localError || authError}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 relative z-10">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-300 mb-1">
              Administrator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="email"
                required
                placeholder="admin.canteen@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-ink-800/80 border border-ink-700 rounded-2xl text-xs text-white placeholder:text-ink-500 focus:outline-none focus:border-terracotta-500 focus:bg-ink-800 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-300 mb-1">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-ink-800/80 border border-ink-700 rounded-2xl text-xs text-white placeholder:text-ink-500 focus:outline-none focus:border-terracotta-500 focus:bg-ink-800 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-300">
                Security Passkey
              </label>
              <span className="text-[10px] text-ink-400 font-mono">Default: ADMIN-2024</span>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-terracotta-400" />
              <input
                type="text"
                required
                placeholder="ADMIN-2024"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-ink-800/80 border border-ink-700 rounded-2xl text-xs font-mono text-terracotta-300 placeholder:text-ink-500 focus:outline-none focus:border-terracotta-500 focus:bg-ink-800 transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl font-bold text-xs shadow-paper hover:shadow-paper-elevated active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Authorizing Root Admin Session...</span>
            ) : (
              <>
                <Terminal className="w-4 h-4" />
                <span>Authorize & Unlock Admin Panel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 text-center z-10">
          <hr className="border-ink-800" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-ink-900 px-2.5 text-[10px] uppercase font-bold text-ink-400 tracking-wider">
            Alternative Authentication
          </span>
        </div>

        {/* Google Admin Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-ink-800 border border-ink-700 hover:bg-ink-750 text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-paper relative z-10"
        >
          <ShieldAlert className="w-4 h-4 text-terracotta-400" />
          <span>Authenticate via Campus Google Workspace</span>
        </button>

        {/* Quick Testing Actions */}
        <div className="mt-5 p-3 bg-ink-800/60 border border-ink-700 rounded-2xl relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-ink-300 uppercase tracking-wider">
              Faculty Admin Credentials
            </span>
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-[10px] font-bold text-terracotta-400 hover:underline"
            >
              Fill Form
            </button>
          </div>
          <button
            type="button"
            onClick={handleInstantDemo}
            className="w-full py-1.5 px-3 bg-ink-700 hover:bg-ink-650 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-terracotta-400" />
            <span>Instant Demo: Prof. Ananya Sen (Admin)</span>
          </button>
        </div>

        {/* Portal Switchers */}
        <div className="mt-6 pt-5 border-t border-ink-800 relative z-10">
          <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wider text-center mb-3">
            Access Other Role Portals
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSwitchPortal && onSwitchPortal('login-student')}
              className="p-2.5 rounded-2xl bg-ink-800/80 hover:bg-ink-700 border border-ink-700 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-cream-100 font-bold text-[11px] mb-0.5">
                <GraduationCap className="w-3.5 h-3.5 text-terracotta-400 group-hover:scale-110 transition-transform" />
                <span>Student Login</span>
              </div>
              <p className="text-[10px] text-ink-400">Meals & Ordering</p>
            </button>

            <button
              type="button"
              onClick={() => onSwitchPortal && onSwitchPortal('login-manager')}
              className="p-2.5 rounded-2xl bg-ink-800/80 hover:bg-ink-700 border border-ink-700 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-sage-300 font-bold text-[11px] mb-0.5">
                <Store className="w-3.5 h-3.5 text-sage-400 group-hover:scale-110 transition-transform" />
                <span>Canteen Staff</span>
              </div>
              <p className="text-[10px] text-ink-400">Kitchen Dispatch</p>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
