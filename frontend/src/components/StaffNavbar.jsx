import React, { useState } from 'react';
import { 
  ChefHat, 
  Clock, 
  Utensils, 
  Package, 
  TrendingUp, 
  Receipt, 
  RotateCcw, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Store,
  RefreshCw,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function StaffNavbar({
  activeSection = 'orders',
  onSelectSection,
  canteenName,
  canteenId
}) {
  const { currentUser, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { key: 'orders', label: 'Kitchen Queue', icon: Clock },
    { key: 'menu', label: 'Menu Catalog', icon: Utensils },
    { key: 'inventory', label: 'Inventory', icon: Package },
    { key: 'sales', label: 'Sales & Revenue', icon: TrendingUp },
    { key: 'bills', label: 'Bills & Invoices', icon: Receipt },
    { key: 'refunds', label: 'Refunds', icon: RotateCcw },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (key) => {
    onSelectSection && onSelectSection(key);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setShowProfileDropdown(false);
    setMobileMenuOpen(false);
    logout();
  };

  const displayName = currentUser?.name || 'Staff Member';
  const displayCanteen = canteenName || currentUser?.canteenName || `Canteen #${canteenId || 1}`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sage-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Outlet Identity & Staff Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sage-600 flex items-center justify-center text-white shadow-paper">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-ink-900">
                  {displayCanteen}
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage-100 text-sage-800 border border-sage-300 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-sage-600" />
                  <span>Staff Terminal</span>
                </span>
              </div>
              <p className="text-[11px] text-ink-500 hidden sm:block">
                Assigned Staff Dispatch • Outlet #{canteenId || 1}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-sage-600 text-white shadow-paper'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-sage-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Section: Staff Profile & Mobile Toggle */}
          <div className="flex items-center gap-2">
            {/* Staff Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 p-1 rounded-2xl bg-sage-50 border border-sage-200 hover:border-sage-300 transition-all text-left"
              >
                <img
                  src={currentUser?.photoURL || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=120&q=80'}
                  alt={displayName}
                  className="w-8 h-8 rounded-xl object-cover border border-sage-300"
                />
                <div className="hidden sm:flex flex-col pr-1">
                  <span className="text-xs font-bold text-ink-900 leading-tight">
                    {displayName.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-bold text-sage-700 uppercase tracking-wider">
                    {currentUser?.staffRole || 'Canteen Staff'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-ink-400 mr-1" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-sage-200 rounded-3xl shadow-paper-elevated p-2.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-oatmeal-200 mb-2">
                    <div className="font-bold text-xs text-ink-900 truncate">{displayName}</div>
                    <div className="text-[11px] text-ink-500 truncate">{currentUser?.email}</div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sage-100 text-sage-800 text-[10px] font-bold border border-sage-300">
                      <Store className="w-3 h-3 text-sage-700" />
                      <span>{displayCanteen}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-terracotta-600 hover:bg-terracotta-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out from Kitchen</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-2xl bg-sage-50 text-ink-700 border border-sage-200"
              aria-label="Toggle Staff Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-sage-200 bg-white px-4 py-3 space-y-1 shadow-paper animate-in slide-in-from-top-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sage-800 px-3 py-1">
              Kitchen Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                    isActive
                      ? 'bg-sage-600 text-white font-bold'
                      : 'text-ink-700 hover:bg-sage-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="pt-2 border-t border-oatmeal-200 mt-2">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-terracotta-600 hover:bg-terracotta-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out from Staff Terminal</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Staff Mobile Bottom Bar (Kitchen Queue, Menu, Inventory, Sales, Profile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white/95 backdrop-blur-xl border-t border-sage-200 px-2 py-1.5 flex items-center justify-around shadow-paper-floating">
        <button
          onClick={() => onSelectSection && onSelectSection('orders')}
          className={`flex flex-col items-center gap-1 p-1.5 min-w-[50px] rounded-xl transition-all ${
            activeSection === 'orders' ? 'text-sage-700 font-bold' : 'text-ink-500'
          }`}
        >
          <Clock className={`w-4 h-4 ${activeSection === 'orders' ? 'text-sage-600' : 'text-ink-400'}`} />
          <span className="text-[9px]">Orders</span>
        </button>

        <button
          onClick={() => onSelectSection && onSelectSection('menu')}
          className={`flex flex-col items-center gap-1 p-1.5 min-w-[50px] rounded-xl transition-all ${
            activeSection === 'menu' ? 'text-sage-700 font-bold' : 'text-ink-500'
          }`}
        >
          <Utensils className={`w-4 h-4 ${activeSection === 'menu' ? 'text-sage-600' : 'text-ink-400'}`} />
          <span className="text-[9px]">Menu</span>
        </button>

        <button
          onClick={() => onSelectSection && onSelectSection('inventory')}
          className={`flex flex-col items-center gap-1 p-1.5 min-w-[50px] rounded-xl transition-all ${
            activeSection === 'inventory' ? 'text-sage-700 font-bold' : 'text-ink-500'
          }`}
        >
          <Package className={`w-4 h-4 ${activeSection === 'inventory' ? 'text-sage-600' : 'text-ink-400'}`} />
          <span className="text-[9px]">Stock</span>
        </button>

        <button
          onClick={() => onSelectSection && onSelectSection('sales')}
          className={`flex flex-col items-center gap-1 p-1.5 min-w-[50px] rounded-xl transition-all ${
            activeSection === 'sales' ? 'text-sage-700 font-bold' : 'text-ink-500'
          }`}
        >
          <TrendingUp className={`w-4 h-4 ${activeSection === 'sales' ? 'text-sage-600' : 'text-ink-400'}`} />
          <span className="text-[9px]">Sales</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 p-1.5 min-w-[50px] rounded-xl transition-all text-terracotta-600 hover:text-terracotta-800"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[9px] font-bold">Logout</span>
        </button>
      </nav>
    </>
  );
}