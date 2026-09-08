import React from 'react';
import { 
  GraduationCap, 
  Store, 
  KeyRound, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  ChefHat, 
  Layers,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPortalModal({ isOpen, onClose, onSelectPortal }) {
  const { currentUser, logout, quickDemoLogin } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-2xl bg-cream-50 border border-oatmeal-300 rounded-4xl shadow-paper-floating p-6 sm:p-8 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-oatmeal-200 text-ink-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-lg mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-oatmeal-200 text-ink-700 text-xs font-bold mb-3 border border-oatmeal-300">
            <Layers className="w-3.5 h-3.5 text-terracotta-600" />
            <span>CampusBites Multi-Role Access</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-ink-900 tracking-tight">
            Choose Your Login Portal
          </h2>
          <p className="text-xs sm:text-sm text-ink-500 mt-1.5">
            Every user group has a dedicated authentication workflow tailored to their campus role.
          </p>
        </div>

        {/* 3 Portal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
          
          {/* Card 1: Student */}
          <div 
            onClick={() => { onSelectPortal('login-student'); onClose(); }}
            className="group cursor-pointer bg-white border border-oatmeal-300 hover:border-terracotta-400 p-5 rounded-3xl shadow-paper hover:shadow-paper-elevated transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-terracotta-50 border border-terracotta-200 text-terracotta-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-ink-900 mb-1">Student & Member</h3>
              <p className="text-[11px] text-ink-500 leading-relaxed">
                Browse menus, order ahead with QR pickup, and avoid dining queues.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-oatmeal-100 flex items-center justify-between text-xs font-bold text-terracotta-600">
              <span>Student Login</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Canteen Manager */}
          <div 
            onClick={() => { onSelectPortal('login-manager'); onClose(); }}
            className="group cursor-pointer bg-white border border-oatmeal-300 hover:border-sage-400 p-5 rounded-3xl shadow-paper hover:shadow-paper-elevated transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-sage-50 border border-sage-200 text-sage-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ChefHat className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-ink-900 mb-1">Canteen Manager</h3>
              <p className="text-[11px] text-ink-500 leading-relaxed">
                Manage live kitchen queues, advance order prep states, and stock.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-oatmeal-100 flex items-center justify-between text-xs font-bold text-sage-700">
              <span>Manager Login</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Admin */}
          <div 
            onClick={() => { onSelectPortal('login-admin'); onClose(); }}
            className="group cursor-pointer bg-white border border-oatmeal-300 hover:border-ink-600 p-5 rounded-3xl shadow-paper hover:shadow-paper-elevated transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-ink-100 border border-ink-300 text-ink-900 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <KeyRound className="w-5 h-5 text-terracotta-600" />
              </div>
              <h3 className="font-bold text-sm text-ink-900 mb-1">Campus Admin</h3>
              <p className="text-[11px] text-ink-500 leading-relaxed">
                Add canteen outlets, edit menus & pricing, view platform reports.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-oatmeal-100 flex items-center justify-between text-xs font-bold text-ink-900">
              <span>Admin Login</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>

        {/* Current status footer */}
        {currentUser?.isAuthenticated && (
          <div className="p-3 bg-oatmeal-200/60 rounded-2xl flex items-center justify-between text-xs text-ink-700">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Currently logged in as <strong>{currentUser.name}</strong> ({currentUser.role.replace('_', ' ')})</span>
            </div>
            <button
              onClick={() => { logout(); onClose(); }}
              className="text-xs font-bold text-terracotta-600 hover:underline"
            >
              Sign Out First
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
