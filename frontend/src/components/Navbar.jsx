import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Utensils, 
  LayoutDashboard, 
  Clock, 
  Sparkles, 
  LogIn, 
  LogOut, 
  Lock, 
  ChevronDown, 
  Store,
  GraduationCap,
  ChefHat,
  KeyRound,
  Layers,
  Wallet,
  Bell,
  Receipt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  cartCount, 
  activeOrderId, 
  onOpenPortalModal,
  onOpenWallet,
  onOpenNotifications,
  walletBalance = null,
  walletLoading = false,
  unreadCount = 0
}) {
  const { currentUser, logout, switchRole, loading } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showLoginMenu, setShowLoginMenu] = useState(false);

  const isStaff = currentUser?.isAuthenticated && currentUser?.role === 'canteen_staff';
  const isAdmin = currentUser?.isAuthenticated && currentUser?.role === 'admin';
  const isStudentOrFaculty = !isStaff && !isAdmin;

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-md border-b border-oatmeal-300/80 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => setActiveTab(isStudentOrFaculty ? 'dashboard' : 'canteens')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-terracotta-500 flex items-center justify-center text-white shadow-paper group-hover:bg-terracotta-600 transition-colors">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-ink-900">
                CampusBites
              </span>
              <span className="hidden md:inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-oatmeal-200 text-ink-600 border border-oatmeal-300">
                Calm Campus Dining
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden sm:flex items-center gap-1.5">
            {isStudentOrFaculty ? (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'dashboard'
                      ? 'bg-oatmeal-200 text-ink-900 shadow-paper'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-oatmeal-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-terracotta-600" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => setActiveTab('canteens')}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'canteens' || activeTab === 'menu'
                      ? 'bg-oatmeal-200 text-ink-900 shadow-paper'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-oatmeal-100'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-sage-600" />
                  <span>Canteens</span>
                </button>

                <button
                  onClick={() => setActiveTab('orders-history')}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'orders-history'
                      ? 'bg-oatmeal-200 text-ink-900 shadow-paper'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-oatmeal-100'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5 text-ink-600" />
                  <span>My Orders</span>
                </button>
              </>
            ) : isStaff ? (
              <>
                <button
                  onClick={() => setActiveTab('kitchen')}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'kitchen' || activeTab === 'dashboard'
                      ? 'bg-sage-100 text-sage-900 shadow-paper border border-sage-200'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-oatmeal-100'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5 text-sage-600" />
                  <span>Kitchen Queue</span>
                </button>

                <button
                  onClick={() => setActiveTab('canteens')}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'canteens'
                      ? 'bg-oatmeal-200 text-ink-900 shadow-paper'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-oatmeal-100'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-sage-600" />
                  <span>View Canteens</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'admin'
                      ? 'bg-ink-800 text-white shadow-paper'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-oatmeal-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-terracotta-400" />
                  <span>Admin Terminal</span>
                </button>

                <button
                  onClick={() => setActiveTab('kitchen')}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'kitchen' || activeTab === 'dashboard'
                      ? 'bg-sage-100 text-sage-900 shadow-paper border border-sage-200'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-oatmeal-100'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5 text-sage-600" />
                  <span>Kitchen Queue</span>
                </button>

                <button
                  onClick={() => setActiveTab('canteens')}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'canteens'
                      ? 'bg-oatmeal-200 text-ink-900 shadow-paper'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-oatmeal-100'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-sage-600" />
                  <span>Canteens</span>
                </button>
              </>
            )}

            {/* Live Order Indicator (if user has active order) */}
            {activeOrderId && (
              <button
                onClick={() => setActiveTab('tracker')}
                className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'tracker'
                    ? 'bg-terracotta-50 text-terracotta-700 border border-terracotta-200 shadow-paper'
                    : 'text-terracotta-600 hover:bg-terracotta-50/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-terracotta-600 animate-pulse" />
                <span>Live Order</span>
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500 animate-ping" />
              </button>
            )}

            {/* Wallet Button */}
            {onOpenWallet && (
              <button
                onClick={onOpenWallet}
                className="px-2.5 py-1.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5 text-sage-800 bg-sage-50 hover:bg-sage-100 border border-sage-200 shadow-xs"
                title="Campus Wallet"
              >
                <Wallet className="w-3.5 h-3.5 text-sage-600" />
                <span className="font-bold">
                  {walletLoading ? '...' : walletBalance !== null ? `₹${Number(walletBalance).toFixed(2)}` : 'Wallet'}
                </span>
              </button>
            )}

            {/* Notifications Button */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative p-1.5 rounded-2xl text-ink-600 hover:text-ink-900 hover:bg-oatmeal-100 transition-all"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-terracotta-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Portals Switcher Button */}
            <button
              onClick={() => onOpenPortalModal ? onOpenPortalModal() : setActiveTab('portal-hub')}
              className={`px-2.5 py-1.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1 text-ink-600 hover:text-ink-900 hover:bg-oatmeal-100 ${
                activeTab === 'portal-hub' ? 'bg-oatmeal-200 text-ink-900 font-bold' : ''
              }`}
              title="Switch Login Portals"
            >
              <Layers className="w-3.5 h-3.5 text-terracotta-500" />
              <span className="hidden md:inline">Portals</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setActiveTab('cart')}
              className="ml-1 relative px-3 py-1.5 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 active:scale-95 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-paper"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-white text-terracotta-600 text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </nav>

          {/* User Profile / Portal Login Dropdown */}
          <div className="relative">
            {currentUser?.isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center gap-2 p-1 rounded-2xl bg-white border border-oatmeal-300 shadow-paper hover:border-oatmeal-400 transition-all"
                >
                  <img
                    src={currentUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-xl object-cover border border-oatmeal-200"
                  />
                  <div className="hidden sm:flex flex-col text-left pr-1">
                    <span className="text-xs font-bold text-ink-900 leading-tight">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      currentUser.role === 'admin' ? 'text-terracotta-600' :
                      currentUser.role === 'canteen_staff' ? 'text-sage-700' : 'text-ink-500'
                    }`}>
                      {currentUser.role === 'canteen_staff' ? 'Manager' : currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-400 mr-1" />
                </button>

                {/* Dropdown Menu */}
                {showRoleDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-cream-50 border border-oatmeal-300 rounded-3xl shadow-paper-elevated p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-oatmeal-200 mb-1">
                      <div className="font-bold text-xs text-ink-900 truncate">{currentUser.name}</div>
                      <div className="text-[11px] text-ink-500 truncate">{currentUser.email || 'Campus Member'}</div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border uppercase tracking-wider ${
                          currentUser.role === 'admin'
                            ? 'bg-ink-900 text-white border-ink-800'
                            : currentUser.role === 'canteen_staff'
                            ? 'bg-sage-100 text-sage-800 border-sage-300'
                            : 'bg-terracotta-50 text-terracotta-700 border-terracotta-200'
                        }`}>
                          {currentUser.role.replace('_', ' ')}
                        </span>
                        {currentUser.canteenName && (
                          <span className="text-[10px] text-sage-700 font-medium truncate max-w-[120px]">
                            {currentUser.canteenName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Wallet and Notifications in Dropdown */}
                    <div className="py-1 border-b border-oatmeal-200">
                      {onOpenWallet && (
                        <button
                          onClick={() => { onOpenWallet(); setShowRoleDropdown(false); }}
                          className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium text-ink-700 hover:bg-sage-50 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Wallet className="w-3.5 h-3.5 text-sage-600" />
                            <span>Campus Wallet</span>
                          </div>
                          <span className="font-bold text-sage-800 text-[11px]">
                            {walletLoading ? '...' : walletBalance !== null ? `₹${Number(walletBalance).toFixed(2)}` : '—'}
                          </span>
                        </button>
                      )}
                      {onOpenNotifications && (
                        <button
                          onClick={() => { onOpenNotifications(); setShowRoleDropdown(false); }}
                          className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium text-ink-700 hover:bg-oatmeal-100 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Bell className="w-3.5 h-3.5 text-terracotta-600" />
                            <span>Notifications</span>
                          </div>
                          {unreadCount > 0 && (
                            <span className="bg-terracotta-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Customer navigation if student/faculty */}
                    {isStudentOrFaculty && (
                      <div className="py-1 border-b border-oatmeal-200">
                        <button
                          onClick={() => { setActiveTab('dashboard'); setShowRoleDropdown(false); }}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                            activeTab === 'dashboard' ? 'bg-terracotta-50 text-terracotta-800 font-bold' : 'text-ink-700 hover:bg-oatmeal-100'
                          }`}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-terracotta-600" />
                          <span>Student Dashboard</span>
                        </button>
                        <button
                          onClick={() => { setActiveTab('orders-history'); setShowRoleDropdown(false); }}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                            activeTab === 'orders-history' ? 'bg-terracotta-50 text-terracotta-800 font-bold' : 'text-ink-700 hover:bg-oatmeal-100'
                          }`}
                        >
                          <Receipt className="w-3.5 h-3.5 text-sage-600" />
                          <span>My Orders & Tax Bills</span>
                        </button>
                      </div>
                    )}

                    {/* Dedicated Portal Navigators */}
                    <div className="py-1">
                      <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-ink-400 block mb-1">
                        Open Login Portal
                      </span>
                      
                      <button
                        onClick={() => { setActiveTab('login-student'); setShowRoleDropdown(false); }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between ${
                          currentUser.role === 'student' ? 'bg-terracotta-50 text-terracotta-800 font-bold' : 'text-ink-700 hover:bg-oatmeal-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-3.5 h-3.5 text-terracotta-600" />
                          <span>Student Portal</span>
                        </div>
                        {currentUser.role === 'student' && <span className="w-1.5 h-1.5 rounded-full bg-terracotta-600" />}
                      </button>

                      <button
                        onClick={() => { setActiveTab('login-manager'); setShowRoleDropdown(false); }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between ${
                          currentUser.role === 'canteen_staff' ? 'bg-sage-100 text-sage-800 font-bold' : 'text-ink-700 hover:bg-oatmeal-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ChefHat className="w-3.5 h-3.5 text-sage-600" />
                          <span>Canteen Manager</span>
                        </div>
                        {currentUser.role === 'canteen_staff' && <span className="w-1.5 h-1.5 rounded-full bg-sage-600" />}
                      </button>

                      <button
                        onClick={() => { setActiveTab('login-admin'); setShowRoleDropdown(false); }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between ${
                          currentUser.role === 'admin' ? 'bg-ink-100 text-ink-900 font-bold' : 'text-ink-700 hover:bg-oatmeal-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-3.5 h-3.5 text-terracotta-600" />
                          <span>Admin Console</span>
                        </div>
                        {currentUser.role === 'admin' && <span className="w-1.5 h-1.5 rounded-full bg-ink-900" />}
                      </button>
                    </div>

                    <div className="pt-1 border-t border-oatmeal-200 mt-1">
                      <button
                        onClick={() => { logout(); setShowRoleDropdown(false); }}
                        className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium text-terracotta-600 hover:bg-terracotta-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowLoginMenu(!showLoginMenu)}
                  className="px-3 py-1.5 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-paper"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>

                {showLoginMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-cream-50 border border-oatmeal-300 rounded-3xl shadow-paper-elevated p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                      Select Login Portal
                    </div>
                    <button
                      onClick={() => { setActiveTab('login-student'); setShowLoginMenu(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-ink-800 hover:bg-terracotta-50 hover:text-terracotta-700 flex items-center gap-2 transition-colors"
                    >
                      <GraduationCap className="w-4 h-4 text-terracotta-600" />
                      <div>
                        <div className="font-bold">Student Login</div>
                        <div className="text-[10px] text-ink-500">Order & Track Food</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('login-manager'); setShowLoginMenu(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-ink-800 hover:bg-sage-50 hover:text-sage-800 flex items-center gap-2 transition-colors"
                    >
                      <ChefHat className="w-4 h-4 text-sage-600" />
                      <div>
                        <div className="font-bold">Canteen Staff</div>
                        <div className="text-[10px] text-ink-500">Kitchen & Dispatch</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('login-admin'); setShowLoginMenu(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-ink-800 hover:bg-ink-100 hover:text-ink-900 flex items-center gap-2 transition-colors"
                    >
                      <KeyRound className="w-4 h-4 text-terracotta-600" />
                      <div>
                        <div className="font-bold">Campus Admin</div>
                        <div className="text-[10px] text-ink-500">System Management</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-cream-50/95 backdrop-blur-xl border-t border-oatmeal-300 px-2 py-2 flex items-center justify-around shadow-paper-floating">
        {isStaff ? (
          <>
            <button
              onClick={() => setActiveTab('kitchen')}
              className={`flex flex-col items-center gap-1 p-1.5 min-w-[50px] rounded-xl transition-all ${
                activeTab === 'kitchen' || activeTab === 'dashboard'
                  ? 'text-sage-700 font-bold'
                  : 'text-ink-500'
              }`}
            >
              <ChefHat className="w-4 h-4 text-sage-600" />
              <span className="text-[9px]">Kitchen</span>
            </button>
            <button
              onClick={() => setActiveTab('canteens')}
              className={`flex flex-col items-center gap-1 p-1.5 min-w-[50px] rounded-xl transition-all ${
                activeTab === 'canteens' ? 'text-terracotta-600 font-bold' : 'text-ink-500'
              }`}
            >
              <Store className="w-4 h-4" />
              <span className="text-[9px]">Canteens</span>
            </button>
            <button
              onClick={() => setActiveTab('portal-hub')}
              className={`flex flex-col items-center gap-1 p-1.5 min-w-[50px] rounded-xl transition-all ${
                activeTab === 'portal-hub' ? 'text-terracotta-600 font-bold' : 'text-ink-500'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="text-[9px]">Portals</span>
            </button>
          </>
        ) : isAdmin ? (
          <>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center gap-1 p-1.5 min-w-[50px] rounded-xl transition-all ${
                activeTab === 'admin' ? 'text-terracotta-600 font-bold' : 'text-ink-500'
              }`}
            >
              <Sparkles className="w-4 h-4 text-terracotta-500" />
              <span className="text-[9px]">Admin</span>
            </button>
            <button
              onClick={() => setActiveTab('kitchen')}
              className={`flex flex-col items-center gap-1 p-1.5 min-w-[50px] rounded-xl transition-all ${
                activeTab === 'kitchen' || activeTab === 'dashboard' ? 'text-sage-700 font-bold' : 'text-ink-500'
              }`}
            >
              <ChefHat className="w-4 h-4 text-sage-600" />
              <span className="text-[9px]">Kitchen</span>
            </button>
            <button
              onClick={() => setActiveTab('canteens')}
              className={`flex flex-col items-center gap-1 p-1.5 min-w-[50px] rounded-xl transition-all ${
                activeTab === 'canteens' ? 'text-terracotta-600 font-bold' : 'text-ink-500'
              }`}
            >
              <Store className="w-4 h-4" />
              <span className="text-[9px]">Canteens</span>
            </button>
            <button
              onClick={() => setActiveTab('portal-hub')}
              className={`flex flex-col items-center gap-1 p-1.5 min-w-[50px] rounded-xl transition-all ${
                activeTab === 'portal-hub' ? 'text-terracotta-600 font-bold' : 'text-ink-500'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="text-[9px]">Portals</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center gap-1 p-1.5 min-w-[48px] rounded-xl transition-all ${
                activeTab === 'dashboard'
                  ? 'text-terracotta-600 font-bold'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-terracotta-500' : 'text-ink-500'}`} />
              <span className="text-[9px]">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('canteens')}
              className={`flex flex-col items-center gap-1 p-1.5 min-w-[48px] rounded-xl transition-all ${
                activeTab === 'canteens' || activeTab === 'menu'
                  ? 'text-terracotta-600 font-bold'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              <Store className={`w-4 h-4 ${activeTab === 'canteens' || activeTab === 'menu' ? 'text-terracotta-500' : 'text-ink-500'}`} />
              <span className="text-[9px]">Canteens</span>
            </button>

            <button
              onClick={() => setActiveTab('orders-history')}
              className={`flex flex-col items-center gap-1 p-1.5 min-w-[48px] rounded-xl transition-all ${
                activeTab === 'orders-history'
                  ? 'text-terracotta-600 font-bold'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              <Receipt className={`w-4 h-4 ${activeTab === 'orders-history' ? 'text-terracotta-500' : 'text-ink-500'}`} />
              <span className="text-[9px]">Orders</span>
            </button>

            {activeOrderId && (
              <button
                onClick={() => setActiveTab('tracker')}
                className={`flex flex-col items-center gap-1 p-1.5 min-w-[48px] rounded-xl relative transition-all ${
                  activeTab === 'tracker'
                    ? 'text-terracotta-600 font-bold'
                    : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                <Clock className={`w-4 h-4 ${activeTab === 'tracker' ? 'text-terracotta-500 animate-pulse' : 'text-ink-500'}`} />
                <span className="text-[9px]">Live</span>
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500 absolute top-1 right-2 animate-ping" />
              </button>
            )}

            {onOpenWallet && (
              <button
                onClick={onOpenWallet}
                className="flex flex-col items-center gap-1 p-1.5 min-w-[48px] rounded-xl transition-all text-sage-700 hover:text-sage-900"
              >
                <Wallet className="w-4 h-4 text-sage-600" />
                <span className="text-[9px] font-bold">
                  {walletLoading ? '...' : walletBalance !== null ? `₹${Number(walletBalance).toFixed(2)}` : 'Wallet'}
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('cart')}
              className={`flex flex-col items-center gap-1 p-1.5 min-w-[48px] rounded-xl relative transition-all ${
                activeTab === 'cart'
                  ? 'text-terracotta-600 font-bold'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              <div className="relative">
                <ShoppingBag className={`w-4 h-4 ${activeTab === 'cart' ? 'text-terracotta-500' : 'text-ink-500'}`} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-terracotta-500 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[9px]">Cart</span>
            </button>
          </>
        )}
      </nav>
    </>
  );
}
