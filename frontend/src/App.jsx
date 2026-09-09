import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CanteenList from './components/CanteenList';
import MenuBrowser from './components/MenuBrowser';
import CartModal from './components/CartModal';
import OrderTracker from './components/OrderTracker';
import CanteenDashboard from './components/CanteenDashboard';
import AdminPanel from './components/AdminPanel';
import StudentLogin from './components/StudentLogin';
import ManagerLogin from './components/ManagerLogin';
import AdminLogin from './components/AdminLogin';
import AuthPortalModal from './components/AuthPortalModal';
import WalletModal from './components/WalletModal';
import NotificationsModal from './components/NotificationsModal';
import StudentDashboard from './components/StudentDashboard';
import StudentOrdersHistory from './components/StudentOrdersHistory';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  GraduationCap, 
  ChefHat, 
  KeyRound, 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  CheckCircle2,
  Lock,
  AlertTriangle
} from 'lucide-react';

function AppContent() {
  const { currentUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('campusbites_auth_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.role === 'canteen_staff') return 'kitchen';
        if (u.role === 'admin') return 'admin';
      }
    } catch (e) {}
    return 'dashboard';
  });

  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  
  // Local storage persisted cart
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('campusbites_student_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Local storage persisted active order
  const [activeOrder, setActiveOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('campusbites_active_order');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Dynamic API state with real loading and error tracking
  const [canteensLoading, setCanteensLoading] = useState(true);
  const [canteensError, setCanteensError] = useState(null);

  const [walletBalance, setWalletBalance] = useState(null); // null indicates pending fetch
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const [cartConflictModal, setCartConflictModal] = useState(null); // { item, delta, newCanteen }

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('campusbites_student_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to persist cart:', e);
    }
  }, [cart]);

  // Sync activeOrder to localStorage
  useEffect(() => {
    try {
      if (activeOrder) {
        localStorage.setItem('campusbites_active_order', JSON.stringify(activeOrder));
      } else {
        localStorage.removeItem('campusbites_active_order');
      }
    } catch (e) {
      console.error('Failed to persist active order:', e);
    }
  }, [activeOrder]);

  // Parallel dashboard data fetch on mount and user identity change
  useEffect(() => {
    fetchAllData();
  }, [currentUser?.id, currentUser?.isAuthenticated]);

  const fetchAllData = async () => {
    await Promise.allSettled([
      fetchCanteens(),
      fetchWalletBalance(),
      fetchUnreadNotifications()
    ]);
  };

  const fetchCanteens = async () => {
    setCanteensLoading(true);
    setCanteensError(null);
    try {
      const res = await fetch('http://localhost:8000/api/canteens');
      if (!res.ok) throw new Error('Failed to retrieve canteens');
      const data = await res.json();
      setCanteens(data);
    } catch (err) {
      console.error('Failed to fetch canteens:', err);
      setCanteensError('Unable to load canteens');
    } finally {
      setCanteensLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    if (!currentUser?.isAuthenticated || !currentUser?.id) {
      setWalletBalance(null);
      setWalletLoading(false);
      return;
    }
    setWalletLoading(true);
    setWalletError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/wallet?user_id=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(parseFloat(data.balance ?? 0));
      } else {
        setWalletError('Unable to load balance');
      }
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
      setWalletError('Network error');
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchUnreadNotifications = async () => {
    if (!currentUser?.isAuthenticated || !currentUser?.id) {
      setUnreadCount(0);
      setNotificationsLoading(false);
      return;
    }
    setNotificationsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/notifications?user_id=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        const unread = data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleSelectCanteen = async (canteen) => {
    setSelectedCanteen(canteen);
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${canteen.id}/menu`);
      const data = await res.json();
      setMenuItems(data);
      setActiveTab('menu');
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    }
  };

  const handleAddToCart = (item, delta) => {
    // Single-canteen cart restriction check
    if (cart.length > 0 && delta > 0) {
      const currentCanteenId = cart[0].canteen_id;
      const targetCanteenId = item.canteen_id || selectedCanteen?.id;
      if (currentCanteenId && targetCanteenId && currentCanteenId !== targetCanteenId) {
        const currentCanteenName = canteens.find(c => c.id === currentCanteenId)?.name || 'another canteen';
        const targetCanteenName = canteens.find(c => c.id === targetCanteenId)?.name || selectedCanteen?.name || 'this canteen';
        setCartConflictModal({
          item,
          delta,
          currentCanteenName,
          targetCanteenName,
          targetCanteenId
        });
        return;
      }
    }

    applyCartChange(item, delta);
  };

  const applyCartChange = (item, delta) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((i) => i.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + delta;
        if (newQty <= 0) {
          updated.splice(existingIndex, 1);
        } else {
          updated[existingIndex].quantity = newQty;
        }
        return updated;
      } else if (delta > 0) {
        const itemWithCanteen = {
          ...item,
          canteen_id: item.canteen_id || selectedCanteen?.id,
          quantity: delta
        };
        return [...prevCart, itemWithCanteen];
      }
      return prevCart;
    });
  };

  const handleConfirmCartClear = () => {
    if (cartConflictModal) {
      setCart([{
        ...cartConflictModal.item,
        canteen_id: cartConflictModal.item.canteen_id || selectedCanteen?.id,
        quantity: cartConflictModal.delta
      }]);
      setCartConflictModal(null);
    }
  };

  const handleUpdateQuantity = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const qty = item.quantity + delta;
            return qty > 0 ? { ...item, quantity: qty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveItem = (itemId) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleOrderSuccess = (newOrder) => {
    setActiveOrder(newOrder);
    setCart([]);
    setActiveTab('tracker');
    fetchWalletBalance();
    fetchUnreadNotifications();
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Role permissions check
  const canAccessStaff = currentUser?.isAuthenticated && (currentUser?.role === 'canteen_staff' || currentUser?.role === 'admin');
  const canAccessAdmin = currentUser?.isAuthenticated && currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-cream-100 text-ink-900 flex flex-col selection:bg-terracotta-500 selection:text-white pb-14 sm:pb-0">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={totalCartCount}
        activeOrderId={activeOrder?.id}
        onOpenPortalModal={() => setIsPortalModalOpen(true)}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        walletBalance={walletBalance}
        walletLoading={walletLoading}
        unreadCount={unreadCount}
      />

      {/* Cart Conflict Modal for Single Canteen Enforcement */}
      {cartConflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-terracotta-200 shadow-paper-elevated text-center">
            <div className="w-12 h-12 rounded-2xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-ink-900 mb-1">Replace Cart Items?</h3>
            <p className="text-xs text-ink-600 mb-4 leading-relaxed">
              Your cart currently contains dishes from <strong className="text-ink-900">{cartConflictModal.currentCanteenName}</strong>. 
              Orders can only be placed with one canteen at a time.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCartConflictModal(null)}
                className="flex-1 py-2 rounded-xl border border-oatmeal-300 text-xs font-semibold text-ink-700 hover:bg-oatmeal-100 transition-colors"
              >
                Keep Current Cart
              </button>
              <button
                onClick={handleConfirmCartClear}
                className="flex-1 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-xs font-bold text-white shadow-paper transition-all"
              >
                Clear & Add Dish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campus Wallet Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        onBalanceUpdated={(newBal) => setWalletBalance(newBal)}
      />

      {/* Notifications Inbox Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => {
          setIsNotificationsOpen(false);
          fetchUnreadNotifications();
        }}
        onNotificationsRead={() => setUnreadCount(0)}
      />

      <AuthPortalModal
        isOpen={isPortalModalOpen}
        onClose={() => setIsPortalModalOpen(false)}
        onSelectPortal={(tab) => setActiveTab(tab)}
      />

      <main className="flex-1">
        {/* --- 1. Student / Member Login Page --- */}
        {activeTab === 'login-student' && (
          <StudentLogin
            onLoginSuccess={() => setActiveTab('dashboard')}
            onSwitchPortal={(portal) => setActiveTab(portal)}
          />
        )}

        {/* --- 2. Canteen Manager Login Page --- */}
        {activeTab === 'login-manager' && (
          <ManagerLogin
            canteens={canteens}
            onLoginSuccess={() => setActiveTab('kitchen')}
            onSwitchPortal={(portal) => setActiveTab(portal)}
          />
        )}

        {/* --- 3. Campus Administrator Login Page --- */}
        {activeTab === 'login-admin' && (
          <AdminLogin
            onLoginSuccess={() => setActiveTab('admin')}
            onSwitchPortal={(portal) => setActiveTab(portal)}
          />
        )}

        {/* --- 4. Role Gateway / Portal Hub --- */}
        {activeTab === 'portal-hub' && (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center max-w-xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-oatmeal-200 text-ink-700 text-xs font-bold mb-3 border border-oatmeal-300">
                <Layers className="w-3.5 h-3.5 text-terracotta-600" />
                <span>Isolated Campus Authentication</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
                Select Your Campus Portal
              </h1>
              <p className="text-xs sm:text-sm text-ink-500 mt-2">
                Every stakeholder has a distinct login page, security clearance, and dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Student Portal Card */}
              <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper flex flex-col justify-between hover:shadow-paper-elevated transition-all">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-terracotta-50 border border-terracotta-200 text-terracotta-600 flex items-center justify-center mb-4">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-ink-900 mb-1">Student & Customer</h2>
                  <p className="text-xs text-ink-500 leading-relaxed mb-4">
                    Browse menu items across all dining outlets, place click-and-collect orders, and track preparation stages.
                  </p>
                  <ul className="text-[11px] text-ink-600 space-y-1.5 mb-6">
                    <li className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-terracotta-500" />
                      <span>Student roll ID / Email auth</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-terracotta-500" />
                      <span>Google Student sign-in</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => setActiveTab('login-student')}
                  className="w-full py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl font-bold text-xs shadow-paper flex items-center justify-center gap-2 transition-all"
                >
                  <span>Open Student Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Manager Portal Card */}
              <div className="bg-white border border-sage-200 rounded-3xl p-6 shadow-paper flex flex-col justify-between hover:shadow-paper-elevated transition-all">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-sage-50 border border-sage-200 text-sage-700 flex items-center justify-center mb-4">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-ink-900 mb-1">Canteen Manager</h2>
                  <p className="text-xs text-ink-500 leading-relaxed mb-4">
                    Access live order queues for your kitchen, update item availability, and dispatch ready orders.
                  </p>
                  <ul className="text-[11px] text-ink-600 space-y-1.5 mb-6">
                    <li className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
                      <span>Outlet assignment selector</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
                      <span>Kitchen staff clearance check</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => setActiveTab('login-manager')}
                  className="w-full py-2.5 bg-sage-600 hover:bg-sage-700 text-white rounded-2xl font-bold text-xs shadow-paper flex items-center justify-center gap-2 transition-all"
                >
                  <span>Open Manager Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Admin Portal Card */}
              <div className="bg-ink-900 text-cream-50 border border-ink-800 rounded-3xl p-6 shadow-paper flex flex-col justify-between hover:shadow-paper-floating transition-all">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-ink-800 border border-ink-700 text-terracotta-400 flex items-center justify-center mb-4">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-white mb-1">Campus Administrator</h2>
                  <p className="text-xs text-ink-400 leading-relaxed mb-4">
                    Master management panel for onboarding canteens, managing menu pricing, and platform administration.
                  </p>
                  <ul className="text-[11px] text-ink-300 space-y-1.5 mb-6">
                    <li className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-terracotta-400" />
                      <span>Master Security Passkey verification</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-terracotta-400" />
                      <span>Root administrative privileges</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => setActiveTab('login-admin')}
                  className="w-full py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl font-bold text-xs shadow-paper flex items-center justify-center gap-2 transition-all"
                >
                  <span>Open Admin Terminal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Student Dashboard (Home) --- */}
        {activeTab === 'dashboard' && (
          currentUser?.role === 'canteen_staff' ? (
            <CanteenDashboard canteens={canteens} />
          ) : (
            <StudentDashboard
              canteens={canteens}
              canteensLoading={canteensLoading}
              canteensError={canteensError}
              onRetryCanteens={fetchCanteens}
              onSelectCanteen={handleSelectCanteen}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenWallet={() => {
                if (!currentUser?.isAuthenticated) {
                  setActiveTab('login-student');
                } else {
                  setIsWalletOpen(true);
                }
              }}
              onOpenNotifications={() => {
                if (!currentUser?.isAuthenticated) {
                  setActiveTab('login-student');
                } else {
                  setIsNotificationsOpen(true);
                }
              }}
              walletBalance={walletBalance}
              walletLoading={walletLoading}
              walletError={walletError}
              onRetryWallet={fetchWalletBalance}
              unreadCount={unreadCount}
              notificationsLoading={notificationsLoading}
              cartCount={totalCartCount}
              activeOrder={activeOrder}
              onRefreshDashboard={fetchAllData}
            />
          )
        )}

        {/* --- Canteen Browsing & Orders --- */}
        {activeTab === 'canteens' && (
          <CanteenList 
            canteens={canteens}
            canteensLoading={canteensLoading}
            canteensError={canteensError}
            onRetryCanteens={fetchCanteens}
            onSelectCanteen={handleSelectCanteen} 
          />
        )}

        {activeTab === 'menu' && selectedCanteen && (
          <MenuBrowser
            canteen={selectedCanteen}
            menuItems={menuItems}
            cart={cart}
            onAddToCart={handleAddToCart}
            onBack={() => setActiveTab('canteens')}
            onOpenCart={() => setActiveTab('cart')}
          />
        )}

        {/* --- Student Orders & Tax Bill History --- */}
        {activeTab === 'orders-history' && (
          <StudentOrdersHistory
            onSelectOrder={(canteen) => handleSelectCanteen(canteen)}
            onOpenTracker={(order) => {
              setActiveOrder(order);
              setActiveTab('tracker');
            }}
          />
        )}

        {activeTab === 'cart' && (
          <CartModal
            cart={cart}
            canteen={selectedCanteen}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onOrderSuccess={handleOrderSuccess}
            onClose={() => setActiveTab(selectedCanteen ? 'menu' : 'canteens')}
          />
        )}

        {activeTab === 'tracker' && (
          <OrderTracker 
            initialOrder={activeOrder} 
            onBackToMenu={() => setActiveTab('canteens')} 
          />
        )}

        {/* --- Protected: Staff Kitchen Dashboard --- */}
        {(activeTab === 'kitchen' || (activeTab === 'dashboard' && currentUser?.role === 'canteen_staff')) && (
          canAccessStaff ? (
            <CanteenDashboard canteens={canteens} />
          ) : (
            <div className="max-w-md mx-auto my-16 p-8 bg-white border border-sage-300 rounded-3xl text-center shadow-paper">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-sage-50 text-sage-600 flex items-center justify-center">
                <ChefHat className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-ink-900 mb-2">Staff Authorization Required</h2>
              <p className="text-xs text-ink-500 mb-6">
                You must be authenticated as a Canteen Manager or Staff to view live preparation queues.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab('login-manager')}
                  className="w-full py-2.5 bg-sage-600 hover:bg-sage-700 text-white rounded-2xl text-xs font-bold shadow-paper flex items-center justify-center gap-2"
                >
                  <ChefHat className="w-4 h-4" />
                  <span>Go to Canteen Manager Login</span>
                </button>
                <button
                  onClick={() => setActiveTab('canteens')}
                  className="text-xs text-ink-500 hover:text-ink-800 py-1"
                >
                  Return to Student Menu
                </button>
              </div>
            </div>
          )
        )}

        {/* --- Protected: Admin Panel --- */}
        {activeTab === 'admin' && (
          canAccessAdmin ? (
            <AdminPanel canteens={canteens} onRefreshCanteens={fetchCanteens} />
          ) : (
            <div className="max-w-md mx-auto my-16 p-8 bg-ink-900 text-white border border-ink-800 rounded-3xl text-center shadow-paper-floating">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-ink-800 text-terracotta-400 flex items-center justify-center border border-ink-700">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white mb-2">Administrator Access Required</h2>
              <p className="text-xs text-ink-400 mb-6">
                Administrative privileges are required to manage dining outlets, configure global menus, and adjust pricing.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab('login-admin')}
                  className="w-full py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl text-xs font-bold shadow-paper flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Go to Administrator Login Terminal</span>
                </button>
                <button
                  onClick={() => setActiveTab('canteens')}
                  className="text-xs text-ink-400 hover:text-white py-1"
                >
                  Return to Campus Dining
                </button>
              </div>
            </div>
          )
        )}
      </main>

      <footer className="border-t border-oatmeal-300 bg-white/70 py-6 text-center text-xs text-ink-400 backdrop-blur-xs">
        CampusBites &copy; {new Date().getFullYear()} College Canteen Click & Collect. Mindfully prepared for campus life.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
