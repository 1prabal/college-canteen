import React from 'react';
import { 
  GraduationCap, 
  ChefHat, 
  KeyRound, 
  ArrowRight, 
  ShieldCheck, 
  ArrowLeft,
  Building2 
} from 'lucide-react';

export default function LoginTypeSelection({ collegeName = 'KIET University', onSelectLoginType, onBack }) {
  const loginOptions = [
    {
      id: 'student',
      title: 'Student / Faculty',
      subtitle: 'Order ahead, pay with wallet/UPI, collect with QR code',
      icon: GraduationCap,
      color: 'terracotta',
      borderClass: 'hover:border-terracotta-400',
      badgeClass: 'bg-terracotta-50 border-terracotta-200 text-terracotta-700',
      iconBg: 'bg-terracotta-50 text-terracotta-600',
      actionText: 'Open Student / Faculty Login'
    },
    {
      id: 'canteen',
      title: 'Canteen Login',
      subtitle: 'Kitchen Queue, orders, live preparation, and inventory',
      icon: ChefHat,
      color: 'sage',
      borderClass: 'hover:border-sage-400',
      badgeClass: 'bg-sage-50 border-sage-200 text-sage-800',
      iconBg: 'bg-sage-50 text-sage-700',
      actionText: 'Open Canteen Staff Login'
    },
    {
      id: 'admin',
      title: 'App Admin Login',
      subtitle: 'Campus-wide outlet management, commission, and system logs',
      icon: KeyRound,
      color: 'ink',
      borderClass: 'hover:border-ink-600',
      badgeClass: 'bg-ink-100 border-ink-300 text-ink-900',
      iconBg: 'bg-ink-100 text-ink-900',
      actionText: 'Open Admin Terminal'
    }
  ];

  return (
    <div className="min-h-[84vh] flex items-center justify-center px-4 py-10 bg-cream-100">
      <div className="w-full max-w-2xl bg-white border border-oatmeal-300 rounded-3xl shadow-paper-elevated p-6 sm:p-10 transition-all">
        
        {/* Back and College Badge */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change College</span>
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-oatmeal-100 border border-oatmeal-300 text-ink-700 text-xs font-bold">
            <Building2 className="w-3.5 h-3.5 text-terracotta-600" />
            <span>{collegeName}</span>
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-ink-900 tracking-tight">
            Choose Your Login Type
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-2 max-w-md mx-auto">
            Select your account type to proceed to the secure campus authentication portal.
          </p>
        </div>

        {/* 3 Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {loginOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <div
                key={opt.id}
                onClick={() => onSelectLoginType && onSelectLoginType(opt.id)}
                className={`group cursor-pointer bg-white border border-oatmeal-300 ${opt.borderClass} p-5 rounded-3xl shadow-paper hover:shadow-paper-elevated transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className={`w-11 h-11 rounded-2xl ${opt.iconBg} border border-oatmeal-200 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-ink-900 mb-1">
                    {opt.title}
                  </h3>
                  <p className="text-[11px] text-ink-500 leading-relaxed">
                    {opt.subtitle}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-oatmeal-100 flex items-center justify-between text-xs font-bold text-ink-700 group-hover:text-terracotta-600">
                  <span>Login</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Informational Security Notice */}
        <div className="p-3 bg-oatmeal-100 border border-oatmeal-300 rounded-2xl flex items-center gap-2.5 text-xs text-ink-600">
          <ShieldCheck className="w-4 h-4 text-sage-600 shrink-0" />
          <span>
            Selecting a role type does not grant permissions. Real access is determined securely by the backend authentication server.
          </span>
        </div>

      </div>
    </div>
  );
}
