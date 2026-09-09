import React from 'react';
import { MapPin, ArrowRight, Clock, Store, CheckCircle2, Sparkles } from 'lucide-react';

export default function CanteenList({ 
  canteens = [], 
  canteensLoading = false, 
  canteensError = null, 
  onRetryCanteens, 
  onSelectCanteen 
}) {
  const activeCanteens = canteens.filter(c => c.is_active !== false);
  const openCount = activeCanteens.filter(c => c.is_open === true).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 sm:pb-12">
      {/* Calm Cuisine Hero Banner */}
      <div className="bg-white/80 border border-oatmeal-300 rounded-3xl p-6 sm:p-8 mb-8 shadow-paper relative overflow-hidden backdrop-blur-xs">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-oatmeal-100 text-ink-700 text-xs font-semibold mb-3 border border-oatmeal-200">
            <Clock className="w-3.5 h-3.5 text-terracotta-500" />
            <span>Mindful Campus Dining</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight leading-snug mb-2">
            Fresh Meals, Order & Collect
          </h1>
          <p className="text-ink-600 text-sm sm:text-base leading-relaxed mb-5">
            Skip long dining lines. Browse authentic campus menus, pay with UPI, and pick up your meal fresh.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-oatmeal-200 text-xs text-ink-600 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
              <span>Instant UPI Payment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
              <span>Real-time Kitchen Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
              <span>QR Pickup Pass</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-ink-900">Campus Outlets</h2>
          <p className="text-ink-500 text-xs sm:text-sm">Choose a dining location to explore the menu</p>
        </div>
        {canteensLoading ? (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white text-ink-400 border border-oatmeal-300 animate-pulse">
            Loading outlets...
          </span>
        ) : canteensError ? (
          <button
            onClick={onRetryCanteens}
            className="text-xs font-bold px-3 py-1 rounded-full bg-terracotta-50 text-terracotta-700 border border-terracotta-200 hover:bg-terracotta-100 transition-colors"
          >
            Retry
          </button>
        ) : (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white text-ink-700 border border-oatmeal-300 shadow-xs">
            {openCount} {openCount === 1 ? 'Outlet' : 'Outlets'} Open
          </span>
        )}
      </div>

      {/* Canteen Outlets Grid */}
      {canteensLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(idx => (
            <div key={idx} className="bg-white border border-oatmeal-200 rounded-3xl p-5 shadow-paper animate-pulse h-48 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-oatmeal-200" />
                  <div className="w-16 h-5 rounded-full bg-oatmeal-200" />
                </div>
                <div className="h-5 bg-oatmeal-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-oatmeal-100 rounded w-1/2" />
              </div>
              <div className="h-3 bg-oatmeal-200 rounded w-1/3 pt-3 border-t border-oatmeal-100" />
            </div>
          ))}
        </div>
      ) : canteensError ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-terracotta-200 shadow-paper">
          <Store className="w-10 h-10 text-terracotta-400 mx-auto mb-2" />
          <p className="text-ink-900 font-bold text-sm mb-1">Failed to load canteens</p>
          <p className="text-ink-500 text-xs mb-4">{canteensError}</p>
          <button
            onClick={onRetryCanteens}
            className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold rounded-xl shadow-paper"
          >
            Retry Loading Outlets
          </button>
        </div>
      ) : canteens.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-oatmeal-300 shadow-paper">
          <Store className="w-10 h-10 text-oatmeal-400 mx-auto mb-2" />
          <p className="text-ink-500 text-sm">No dining outlets found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {canteens.map((canteen) => (
            <div
              key={canteen.id}
              onClick={() => onSelectCanteen(canteen)}
              className="group bg-white border border-oatmeal-300 hover:border-oatmeal-400 rounded-3xl p-5 transition-all duration-200 shadow-paper hover:shadow-paper-elevated cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-oatmeal-100 border border-oatmeal-200 flex items-center justify-center text-terracotta-600 group-hover:bg-terracotta-500 group-hover:text-white transition-colors">
                    <Store className="w-5 h-5" />
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
                      canteen.is_open
                        ? 'bg-sage-50 text-sage-700 border border-sage-200'
                        : 'bg-oatmeal-200 text-ink-500 border border-oatmeal-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${canteen.is_open ? 'bg-sage-600' : 'bg-ink-400'}`} />
                    {canteen.is_open ? 'Open Now' : 'Closed'}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-ink-900 group-hover:text-terracotta-600 transition-colors mb-1.5">
                  {canteen.name}
                </h3>

                <div className="flex items-center gap-1.5 text-ink-500 text-xs mb-5">
                  <MapPin className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                  <span>{canteen.location}</span>
                </div>
              </div>

              <div className="pt-3.5 border-t border-oatmeal-100 flex items-center justify-between text-xs font-semibold text-terracotta-600 group-hover:text-terracotta-700">
                <span>View Menu & Order</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-ink-400 group-hover:text-terracotta-600" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
