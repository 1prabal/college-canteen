import React, { useState, useEffect } from 'react';
import { 
  Store, Clock, Wallet, Bell, ShoppingBag, ArrowRight, 
  MapPin, CheckCircle2, Sparkles, AlertCircle, Eye, Utensils
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard({
  canteens = [],
  canteensLoading = false,
  canteensError = null,
  onRetryCanteens,
  onSelectCanteen,
  onNavigateTab,
  onOpenWallet,
  onOpenNotifications,
  walletBalance = null,
  walletLoading = false,
  walletError = null,
  onRetryWallet,
  unreadCount = 0,
  notificationsLoading = false,
  cartCount = 0,
  activeOrder = null,
  onRefreshDashboard
}) {
  const { currentUser } = useAuth();
  const [latestActiveOrder, setLatestActiveOrder] = useState(activeOrder);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const isAuthenticated = currentUser?.isAuthenticated === true;
  const isFaculty = currentUser?.role === 'faculty';

  // Format user display name
  const displayName = isAuthenticated && currentUser?.name
    ? currentUser.name
    : null;

  // Active canteens count: total open outlets
  const activeCanteensList = canteens.filter(c => c.is_active !== false);
  const openCount = activeCanteensList.filter(c => c.is_open === true).length;

  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      fetchActiveOrder();
    } else {
      setLatestActiveOrder(null);
    }
  }, [currentUser?.id, currentUser?.isAuthenticated, activeOrder]);

  const fetchActiveOrder = async () => {
    if (!currentUser?.id) return;
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/users/${currentUser.id}/orders`);
      if (res.ok) {
        const orders = await res.json();
        const active = orders.find(o => 
          ['PLACED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)
        );
        setLatestActiveOrder(active || null);
      } else {
        setOrdersError('Could not sync orders');
      }
    } catch (e) {
      setOrdersError('Failed to load active orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-32 sm:pb-24 animate-in fade-in duration-200">
      
      {/* 1. Welcome Hero Section */}
      <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 sm:p-8 mb-8 shadow-paper relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-oatmeal-100 text-ink-700 text-xs font-semibold mb-3 border border-oatmeal-200">
            <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
            <span>
              {!isAuthenticated
                ? 'Campus Dining Gateway'
                : isFaculty
                ? 'Campus Faculty Dining'
                : 'Student Click & Collect'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-ink-900 tracking-tight mb-2">
            {displayName ? (
              <>{getGreeting()}, {displayName} 👋</>
            ) : (
              <>Welcome to Campus Dining 👋</>
            )}
          </h1>
          <p className="text-sm sm:text-base text-ink-600 leading-relaxed mb-6 max-w-xl">
            {isAuthenticated ? (
              <>Order your favorite food without waiting in line. Track preparation in real time and pick up with your secure 4-digit code.</>
            ) : (
              <>Browse live campus cafe menus, check active kitchen wait times, or sign in to order food and access your student/faculty wallet.</>
            )}
          </p>

          {/* Quick Metrics & Actions Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-oatmeal-200 text-xs">
            {/* Action: Browse Canteens */}
            <button
              onClick={() => onNavigateTab('canteens')}
              className="p-3 bg-oatmeal-50 hover:bg-oatmeal-100 border border-oatmeal-200 rounded-2xl text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <Store className="w-4 h-4 text-terracotta-600" />
                <ArrowRight className="w-3.5 h-3.5 text-ink-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="font-bold text-ink-900 block text-xs">Canteens</span>
              {canteensLoading ? (
                <span className="text-[11px] text-ink-400 animate-pulse">Loading outlets...</span>
              ) : canteensError ? (
                <span className="text-[11px] text-terracotta-600 flex items-center gap-1">
                  Failed <span onClick={(e) => { e.stopPropagation(); onRetryCanteens && onRetryCanteens(); }} className="underline font-bold">Retry</span>
                </span>
              ) : (
                <span className="text-[11px] text-ink-500 font-medium">
                  {openCount} {openCount === 1 ? 'Outlet' : 'Outlets'} Open
                </span>
              )}
            </button>

            {/* Action: My Orders */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  onNavigateTab('login-student');
                } else {
                  onNavigateTab('orders-history');
                }
              }}
              className="p-3 bg-oatmeal-50 hover:bg-oatmeal-100 border border-oatmeal-200 rounded-2xl text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <Clock className="w-4 h-4 text-sage-600" />
                <ArrowRight className="w-3.5 h-3.5 text-ink-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="font-bold text-ink-900 block text-xs">My Orders</span>
              <span className="text-[11px] text-ink-500">
                {!isAuthenticated ? 'Sign In to View' : 'History & Tax Bills'}
              </span>
            </button>

            {/* Action: Wallet */}
            <button
              onClick={onOpenWallet}
              className="p-3 bg-sage-50/70 hover:bg-sage-100/70 border border-sage-200 rounded-2xl text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <Wallet className="w-4 h-4 text-sage-700" />
                <span className="font-bold text-sage-800 text-[10px] uppercase">
                  {!isAuthenticated ? 'Auth' : 'Recharge'}
                </span>
              </div>
              <span className="font-bold text-ink-900 block text-xs">Wallet</span>
              {!isAuthenticated ? (
                <span className="text-[11px] text-ink-500 font-semibold">Sign In</span>
              ) : walletLoading ? (
                <span className="text-[11px] text-sage-700 animate-pulse font-medium">Loading...</span>
              ) : walletError ? (
                <span className="text-[11px] text-terracotta-600 flex items-center gap-1 font-semibold">
                  Error <span onClick={(e) => { e.stopPropagation(); onRetryWallet && onRetryWallet(); }} className="underline">Retry</span>
                </span>
              ) : (
                <span className="text-[11px] font-mono font-extrabold text-sage-800">
                  ₹{Number(walletBalance ?? 0).toFixed(2)}
                </span>
              )}
            </button>

            {/* Action: Notifications */}
            <button
              onClick={onOpenNotifications}
              className="p-3 bg-oatmeal-50 hover:bg-oatmeal-100 border border-oatmeal-200 rounded-2xl text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <Bell className="w-4 h-4 text-amber-600" />
                {unreadCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-terracotta-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="font-bold text-ink-900 block text-xs">Alerts</span>
              {!isAuthenticated ? (
                <span className="text-[11px] text-ink-500 font-semibold">Sign In</span>
              ) : notificationsLoading ? (
                <span className="text-[11px] text-ink-400 animate-pulse font-medium">Checking...</span>
              ) : (
                <span className="text-[11px] text-ink-500">
                  {unreadCount ? `${unreadCount} unread` : 'Inbox clear'}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Decorative corner accent */}
        <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-oatmeal-100/50 pointer-events-none" />
      </div>

      {/* 2. Current Active Order Card (If any) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-ink-900">Current Order Status</h2>
          {latestActiveOrder && (
            <button
              onClick={() => onNavigateTab('tracker')}
              className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1"
            >
              <span>Live Tracker</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loadingOrders ? (
          <div className="bg-white border border-oatmeal-200 rounded-3xl p-6 shadow-paper animate-pulse flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-oatmeal-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-oatmeal-200 rounded w-1/4" />
              <div className="h-2.5 bg-oatmeal-100 rounded w-1/2" />
            </div>
          </div>
        ) : ordersError ? (
          <div className="bg-white border border-terracotta-200 rounded-3xl p-5 shadow-paper flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-terracotta-700">
              <AlertCircle className="w-4 h-4" />
              <span>{ordersError}</span>
            </div>
            <button
              onClick={fetchActiveOrder}
              className="px-3 py-1 bg-terracotta-50 text-terracotta-700 hover:bg-terracotta-100 rounded-lg text-xs font-bold"
            >
              Retry
            </button>
          </div>
        ) : latestActiveOrder ? (
          <div className="bg-white border border-terracotta-200 rounded-3xl p-5 sm:p-6 shadow-paper hover:shadow-paper-elevated transition-all ring-1 ring-terracotta-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-oatmeal-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-extrabold text-sm text-ink-900">
                    #{latestActiveOrder.order_number}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    latestActiveOrder.status === 'READY'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                      : latestActiveOrder.status === 'PREPARING'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-sage-50 text-sage-700 border border-sage-200'
                  }`}>
                    {latestActiveOrder.status === 'READY' ? '🔔 Ready for Pickup' : latestActiveOrder.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-ink-600">
                  Outlet: <strong className="text-ink-900">{latestActiveOrder.canteen_name || 'Campus Canteen'}</strong>
                  {latestActiveOrder.items && latestActiveOrder.items.length > 0 && (
                    <span className="ml-2 text-ink-500">
                      • {latestActiveOrder.items.map(i => `${i.quantity}x ${i.item_name || i.menu_item_name}`).join(', ')}
                    </span>
                  )}
                  {latestActiveOrder.total_amount != null && (
                    <span className="ml-2 font-mono font-bold text-ink-800">
                      (₹{Number(latestActiveOrder.total_amount).toFixed(2)})
                    </span>
                  )}
                </p>
              </div>

              {/* Pickup PIN & Estimated Time */}
              <div className="flex items-center gap-3">
                {latestActiveOrder.pickup_code && (
                  <div className="bg-terracotta-50 border border-terracotta-200 rounded-2xl px-3.5 py-1.5 text-center">
                    <span className="text-[10px] text-terracotta-700 font-bold block uppercase tracking-wider">Pickup PIN</span>
                    <span className="font-mono font-black text-lg text-terracotta-800 tracking-wider">
                      {latestActiveOrder.pickup_code}
                    </span>
                  </div>
                )}
                {latestActiveOrder.estimated_ready_at && (
                  <div className="bg-oatmeal-100 border border-oatmeal-200 rounded-2xl px-3 py-1.5 text-center">
                    <span className="text-[10px] text-ink-500 font-bold block uppercase">Ready Approx</span>
                    <span className="text-xs font-bold text-ink-900">
                      {new Date(latestActiveOrder.estimated_ready_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Progress Bar */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-ink-500 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-terracotta-500" />
                <span>
                  {latestActiveOrder.status === 'READY'
                    ? 'Your meal is boxed and waiting at the collection counter.'
                    : latestActiveOrder.status === 'PREPARING'
                    ? 'The chefs are assembling your order.'
                    : 'Order confirmed and queued in kitchen.'}
                </span>
              </div>

              <button
                onClick={() => onNavigateTab('tracker')}
                className="py-2 px-4 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-xs shadow-paper flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Order & QR Pass</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 border border-oatmeal-300 rounded-3xl p-6 text-center shadow-paper">
            <div className="w-10 h-10 rounded-2xl bg-oatmeal-100 flex items-center justify-center text-ink-400 mx-auto mb-2">
              <Utensils className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-ink-600">
              Your active orders will appear here.
            </p>
            <p className="text-[11px] text-ink-400 mt-0.5 mb-3">
              Select an outlet below to order delicious campus food.
            </p>
            <button
              onClick={() => onNavigateTab('canteens')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold rounded-xl shadow-paper"
            >
              <span>Explore Menus</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3. Campus Dining Outlets Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink-900">Campus Dining Outlets</h2>
            <p className="text-xs text-ink-500">Real campus kiosks and cafes with live kitchen menus</p>
          </div>
          {canteensLoading ? (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-ink-400 border border-oatmeal-300 animate-pulse">
              Loading...
            </span>
          ) : canteensError ? (
            <button
              onClick={onRetryCanteens}
              className="text-xs font-bold px-3 py-1 rounded-full bg-terracotta-50 text-terracotta-700 border border-terracotta-200 hover:bg-terracotta-100 transition-colors"
            >
              Retry
            </button>
          ) : (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-ink-700 border border-oatmeal-300 shadow-xs">
              {canteens.length} Outlets Available
            </span>
          )}
        </div>

        {/* Loading skeleton or error state for Outlets Grid */}
        {canteensLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="bg-white border border-oatmeal-200 rounded-3xl p-5 shadow-paper animate-pulse h-48 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-oatmeal-200" />
                    <div className="w-12 h-4 rounded-full bg-oatmeal-200" />
                  </div>
                  <div className="h-4 bg-oatmeal-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-oatmeal-100 rounded w-full mb-1" />
                  <div className="h-3 bg-oatmeal-100 rounded w-2/3" />
                </div>
                <div className="h-3 bg-oatmeal-200 rounded w-1/2 pt-2 border-t border-oatmeal-100" />
              </div>
            ))}
          </div>
        ) : canteensError ? (
          <div className="bg-white border border-terracotta-200 rounded-3xl p-8 text-center shadow-paper">
            <AlertCircle className="w-8 h-8 text-terracotta-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-ink-900 mb-1">Failed to load dining outlets</p>
            <p className="text-xs text-ink-500 mb-4">{canteensError}</p>
            <button
              onClick={onRetryCanteens}
              className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold rounded-xl shadow-paper"
            >
              Retry Loading Outlets
            </button>
          </div>
        ) : canteens.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-oatmeal-300 shadow-paper">
            <Store className="w-10 h-10 text-oatmeal-400 mx-auto mb-2" />
            <p className="text-ink-600 text-sm font-semibold">No dining outlets found.</p>
            <p className="text-ink-400 text-xs mt-1">Please check back during campus dining hours.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {canteens.map((canteen) => (
              <div
                key={canteen.id}
                onClick={() => onSelectCanteen(canteen)}
                className="group bg-white border border-oatmeal-300 hover:border-oatmeal-400 rounded-3xl p-5 transition-all duration-200 shadow-paper hover:shadow-paper-elevated cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-oatmeal-100 border border-oatmeal-200 flex items-center justify-center text-terracotta-600 group-hover:bg-terracotta-500 group-hover:text-white transition-colors">
                      <Store className="w-5 h-5" />
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        canteen.is_open
                          ? 'bg-sage-50 text-sage-700 border border-sage-200'
                          : 'bg-oatmeal-200 text-ink-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${canteen.is_open ? 'bg-sage-600' : 'bg-ink-400'}`} />
                      {canteen.is_open ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-ink-900 group-hover:text-terracotta-600 transition-colors mb-1">
                    {canteen.name}
                  </h3>

                  <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed mb-3">
                    {canteen.description || 'Authentic campus outlet serving fresh meals and beverages.'}
                  </p>

                  <div className="flex items-center gap-1.5 text-ink-500 text-[11px] mb-4">
                    <MapPin className="w-3.5 h-3.5 text-sage-600 shrink-0" />
                    <span className="truncate">{canteen.location}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-oatmeal-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-ink-400 text-[11px]">
                    <span>{canteen.available_items_count || 15}+ dishes</span>
                    <span>•</span>
                    <span>~{canteen.avg_prep_time || 10}m</span>
                  </div>

                  <span className="font-bold text-terracotta-600 group-hover:text-terracotta-700 flex items-center gap-1">
                    Menu
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
