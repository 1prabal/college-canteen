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
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  GraduationCap, 
  ChefHat, 
  KeyRound, 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  CheckCircle2,
  Lock
} from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('canteens');
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);

  const { currentUser, logout } = useAuth();

  useEffect(() => {
    fetchCanteens();
  }, []);

  const fetchCanteens = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/canteens');
      const data = await res.json();
      setCanteens(data);
    } catch (err) {
      console.error('Failed to fetch canteens:', err);
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
        return [...prevCart, { ...item, quantity: delta }];
      }
      return prevCart;
    });
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
            onLoginSuccess={() => setActiveTab('canteens')}
            onSwitchPortal={(portal) => setActiveTab(portal)}
          />
        )}

        {/* --- 2. Canteen Manager Login Page --- */}
        {activeTab === 'login-manager' && (
          <ManagerLogin
            canteens={canteens}
            onLoginSuccess={() => setActiveTab('dashboard')}
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

        {/* --- Canteen Browsing & Orders --- */}
        {activeTab === 'canteens' && (
          <CanteenList canteens={canteens} onSelectCanteen={handleSelectCanteen} />
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
          <OrderTracker initialOrder={activeOrder} />
        )}

        {/* --- Protected: Staff Dashboard --- */}
        {activeTab === 'dashboard' && (
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
