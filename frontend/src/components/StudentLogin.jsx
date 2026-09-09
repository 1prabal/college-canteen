import React, { useState } from 'react';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  Store,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function StudentLogin({ onLoginSuccess, onSwitchPortal }) {
  const { loginStudent, registerStudent, loginWithGoogle, quickDemoLogin, loading, authError, setAuthError } = useAuth();
  
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    if (isRegister) {
      if (!name) {
        setLocalError('Please enter your full name.');
        return;
      }
      const res = await registerStudent({ email, password, name, collegeId });
      if (res.success) {
        onLoginSuccess && onLoginSuccess('student');
      } else {
        setLocalError(res.error || 'Failed to register student account.');
      }
    } else {
      const res = await loginStudent({ email, password });
      if (res.success) {
        onLoginSuccess && onLoginSuccess('student');
      } else {
        setLocalError(res.error || 'Login failed. Please check your credentials.');
      }
    }
  };

  const handleDemoFill = (roleType = 'student') => {
    if (roleType === 'faculty') {
      setEmail('ananya.sen@college.edu');
      setPassword('faculty123');
      setName('Prof. Ananya Sen');
      setCollegeId('FACULTY-901');
    } else {
      setEmail('rahul.sharma@college.edu');
      setPassword('student123');
      setName('Rahul Sharma');
      setCollegeId('CS2024-089');
    }
    setLocalError('');
  };

  const handleInstantDemo = (roleType = 'student') => {
    quickDemoLogin(roleType);
    onLoginSuccess && onLoginSuccess(roleType);
  };

  const handleGoogleSignIn = async () => {
    setLocalError('');
    const res = await loginWithGoogle('student');
    if (res?.success) {
      onLoginSuccess && onLoginSuccess('student');
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white border border-oatmeal-300 rounded-3xl shadow-paper-elevated p-6 sm:p-8 transition-all">
        
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta-50 border border-terracotta-200 text-terracotta-700 text-xs font-bold">
            <GraduationCap className="w-4 h-4 text-terracotta-600" />
            <span>Student & Customer Portal</span>
          </div>
          <span className="text-[11px] font-semibold text-ink-400">Campus Auth</span>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-ink-900 tracking-tight">
            {isRegister ? 'Create Student Account' : 'Student & Member Login'}
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            {isRegister 
              ? 'Join CampusBites to skip canteen queues and order meals seamlessly.' 
              : 'Sign in to order ahead, customize your food, and track live kitchen prep.'}
          </p>
        </div>

        {/* Error Notification */}
        {(localError || authError) && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Notice</p>
              <p className="text-[11px] text-rose-700 mt-0.5">{localError || authError}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-oatmeal-50 border border-oatmeal-300 rounded-2xl text-xs text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1">
                  College / Student Roll ID
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    placeholder="e.g. CS2024-089"
                    value={collegeId}
                    onChange={(e) => setCollegeId(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-oatmeal-50 border border-oatmeal-300 rounded-2xl text-xs text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1">
              Student Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="email"
                required
                placeholder="student@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-oatmeal-50 border border-oatmeal-300 rounded-2xl text-xs text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-oatmeal-50 border border-oatmeal-300 rounded-2xl text-xs text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white transition-colors"
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
              <span className="animate-pulse">Authenticating with Firebase...</span>
            ) : (
              <>
                <span>{isRegister ? 'Register & Enter Student Portal' : 'Sign In as Student'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 text-center">
          <hr className="border-oatmeal-300" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 text-[10px] uppercase font-bold text-ink-400 tracking-wider">
            Or Use Google
          </span>
        </div>

        {/* Google Student Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-white border border-oatmeal-300 hover:bg-oatmeal-50 text-ink-800 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-paper"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google Student Account</span>
        </button>

        {/* Quick Testing Actions */}
        <div className="mt-5 p-3 bg-oatmeal-100/70 border border-oatmeal-300 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-ink-500 uppercase tracking-wider">
              Quick Test Credentials
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('student')}
                className="text-[10px] font-bold text-terracotta-600 hover:underline"
              >
                Fill Student
              </button>
              <span className="text-ink-300">•</span>
              <button
                type="button"
                onClick={() => handleDemoFill('faculty')}
                className="text-[10px] font-bold text-sage-700 hover:underline"
              >
                Fill Faculty
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleInstantDemo('student')}
              className="py-1.5 px-2 bg-white border border-oatmeal-300 hover:bg-cream-50 text-ink-700 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Sparkles className="w-3 h-3 text-terracotta-500" />
              <span>Student (Rahul)</span>
            </button>
            <button
              type="button"
              onClick={() => handleInstantDemo('faculty')}
              className="py-1.5 px-2 bg-white border border-oatmeal-300 hover:bg-sage-50 text-sage-800 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Sparkles className="w-3 h-3 text-sage-600" />
              <span>Faculty (Prof. Ananya)</span>
            </button>
          </div>
        </div>

        {/* Switch to Register or Login */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setLocalError('');
            }}
            className="text-xs font-medium text-ink-600 hover:text-ink-900 transition-colors"
          >
            {isRegister ? (
              <>Already have a student account? <span className="font-bold text-terracotta-600 underline">Sign In</span></>
            ) : (
              <>New campus student? <span className="font-bold text-terracotta-600 underline">Create an Account</span></>
            )}
          </button>
        </div>

        {/* Portal Switchers */}
        <div className="mt-6 pt-5 border-t border-oatmeal-200">
          <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wider text-center mb-3">
            Looking for other staff portals?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSwitchPortal && onSwitchPortal('login-manager')}
              className="p-2.5 rounded-2xl bg-oatmeal-100 hover:bg-sage-50 hover:border-sage-300 border border-oatmeal-200 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-sage-700 font-bold text-[11px] mb-0.5">
                <Store className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>Canteen Staff</span>
              </div>
              <p className="text-[10px] text-ink-500">Kitchen & Orders</p>
            </button>

            <button
              type="button"
              onClick={() => onSwitchPortal && onSwitchPortal('login-admin')}
              className="p-2.5 rounded-2xl bg-oatmeal-100 hover:bg-ink-100 hover:border-ink-300 border border-oatmeal-200 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-ink-900 font-bold text-[11px] mb-0.5">
                <KeyRound className="w-3.5 h-3.5 text-terracotta-600 group-hover:scale-110 transition-transform" />
                <span>Admin Portal</span>
              </div>
              <p className="text-[10px] text-ink-500">System Control</p>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
