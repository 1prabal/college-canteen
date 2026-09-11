import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChefHat, Clock, CheckCircle2, ArrowRight, RefreshCw, AlertCircle, 
  Store, Utensils, Package, DollarSign, Receipt, RotateCcw, Plus, 
  Minus, QrCode, KeyRound, X, Check, Eye, Search, Filter, Printer,
  AlertTriangle, ShieldCheck, Settings, Power, ChevronRight, Hash,
  TrendingUp, Calendar, User, Phone, Edit2, Trash2, Sliders, CheckSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CanteenDashboard({ 
  canteens = [], 
  activeSection: externalActiveSection,
  onSectionChange
}) {
  const { currentUser } = useAuth();

  // Authoritative assigned canteen: Staff cannot switch canteens arbitrarily
  // Admins/Platform admins can switch, but staff canteen is locked to currentUser.canteenId
  const isSuperAdmin = currentUser?.role === 'admin' || currentUser?.role === 'platform_admin';
  
  const [selectedCanteenId, setSelectedCanteenId] = useState(() => {
    return currentUser?.canteenId || canteens[0]?.id || 1;
  });

  // Keep selected canteen aligned with authoritative currentUser canteen for staff
  useEffect(() => {
    if (!isSuperAdmin && currentUser?.canteenId) {
      setSelectedCanteenId(currentUser.canteenId);
    }
  }, [currentUser?.canteenId, isSuperAdmin]);

  // Active section: 'orders' | 'menu' | 'inventory' | 'sales' | 'bills' | 'refunds' | 'settings'
  const [internalActiveSection, setInternalActiveSection] = useState('orders');
  const activeSection = externalActiveSection || internalActiveSection;
  const setActiveSection = (s) => {
    setInternalActiveSection(s);
    onSectionChange && onSectionChange(s);
  };

  // Orders State & Filters
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderViewMode, setOrderViewMode] = useState('board'); // 'board' (Kanban) | 'list' | 'history'
  const [historyDateFilter, setHistoryDateFilter] = useState('TODAY'); // 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'ALL'

  // Operational Dialog States
  // 1. Accept Dialog
  const [acceptModalOrder, setAcceptModalOrder] = useState(null);
  const [acceptPrepMinutes, setAcceptPrepMinutes] = useState(15);
  const [acceptCustomPrep, setAcceptCustomPrep] = useState('');
  const [acceptSubmitting, setAcceptSubmitting] = useState(false);

  // 2. Reject Dialog
  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('Item unavailable');
  const [rejectCustomReason, setRejectCustomReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // 3. Preparation Time Dialog
  const [prepModalOrder, setPrepModalOrder] = useState(null);
  const [newPrepMinutes, setNewPrepMinutes] = useState(15);
  const [prepSubmitting, setPrepSubmitting] = useState(false);

  // 4. Pickup Verification Dialog
  const [pickupModalOrder, setPickupModalOrder] = useState(null);
  const [enteredPickupCode, setEnteredPickupCode] = useState('');
  const [pickupError, setPickupError] = useState('');
  const [pickupSuccess, setPickupSuccess] = useState('');
  const [pickupSubmitting, setPickupSubmitting] = useState(false);

  // Menu Management State
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newDishModal, setNewDishModal] = useState(false);
  const [dishEditingItem, setDishEditingItem] = useState(null);
  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishCategory, setDishCategory] = useState('');
  const [dishPrepTime, setDishPrepTime] = useState(10);
  const [dishPricingType, setDishPricingType] = useState('FIXED'); // 'FIXED' | 'MRP'
  const [dishUnitInfo, setDishUnitInfo] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishImageUrl, setDishImageUrl] = useState('');

  // Category Manager Modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryRenameTarget, setCategoryRenameTarget] = useState(null);
  const [categoryRenameValue, setCategoryRenameValue] = useState('');

  // Inventory Management State
  const [inventory, setInventory] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [restockModalItem, setRestockModalItem] = useState(null);
  const [restockQty, setRestockQty] = useState(20);
  const [restockNote, setRestockNote] = useState('');

  // Sales & Analytics State
  const [salesSummary, setSalesSummary] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Bills State & Invoicing
  const [bills, setBills] = useState([]);
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [selectedBillForPrint, setSelectedBillForPrint] = useState(null);

  // Refunds State
  const [refunds, setRefunds] = useState([]);

  // Canteen Settings State
  const [canteenSettings, setCanteenSettings] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Action status message banner
  const [bannerNotice, setBannerNotice] = useState(null);

  const showNotice = (text, type = 'success') => {
    setBannerNotice({ text, type });
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // Auth headers generator
  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (currentUser?.email) {
      headers['Authorization'] = `Bearer ${currentUser.email}`;
    }
    if (currentUser?.id) {
      headers['X-User-Id'] = String(currentUser.id);
    }
    return headers;
  };

  // Fetch all canteen-isolated data
  useEffect(() => {
    if (!selectedCanteenId) return;

    fetchOrders();
    fetchMenu();
    fetchCategories();
    fetchInventory();
    fetchInventoryAlerts();
    fetchSales();
    fetchDashboardStats();
    fetchBills();
    fetchRefunds();
    fetchSettings();

    // Live WebSocket Kitchen Channel
    let ws = null;
    try {
      ws = new WebSocket(`ws://localhost:8000/ws/canteen/${selectedCanteenId}`);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_ORDER' || data.type === 'ORDER_CREATED') {
            setOrders((prev) => {
              if (prev.some((o) => o.id === data.order.id)) return prev;
              return [data.order, ...prev];
            });
            fetchDashboardStats();
            fetchInventory();
            fetchInventoryAlerts();
          } else if (data.type === 'ORDER_STATUS_UPDATED' || data.type === 'STATUS_UPDATED') {
            const updated = data.order || {};
            setOrders((prev) =>
              prev.map((o) => (o.id === (data.order_id || updated.id) ? { ...o, ...updated, status: data.status || updated.status } : o))
            );
            fetchDashboardStats();
            fetchSales();
          } else if (data.type === 'PREPARATION_TIME_UPDATED') {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === data.order_id
                  ? { ...o, estimated_preparation_minutes: data.estimated_preparation_minutes, ...(data.order || {}) }
                  : o
              )
            );
          }
        } catch (e) {
          console.warn('WS parser notice:', e);
        }
      };
    } catch (wsErr) {
      console.warn('WS connect notice:', wsErr);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [selectedCanteenId]);

  // Data fetchers
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/orders`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/menu`);
      if (res.ok) setMenuItems(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/categories`);
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/inventory`, {
        headers: getAuthHeaders()
      });
      if (res.ok) setInventory(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInventoryAlerts = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/inventory/alerts`, {
        headers: getAuthHeaders()
      });
      if (res.ok) setInventoryAlerts(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/sales`, {
        headers: getAuthHeaders()
      });
      if (res.ok) setSalesSummary(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/dashboard-stats`, {
        headers: getAuthHeaders()
      });
      if (res.ok) setDashboardStats(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBills = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/bills`, {
        headers: getAuthHeaders()
      });
      if (res.ok) setBills(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRefunds = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/refunds?canteen_id=${selectedCanteenId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) setRefunds(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/settings`, {
        headers: getAuthHeaders()
      });
      if (res.ok) setCanteenSettings(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // Dedicated Workflow Handlers
  // 1. Accept Order with Prep Time
  const handleAcceptOrder = async (e) => {
    e.preventDefault();
    if (!acceptModalOrder) return;
    setAcceptSubmitting(true);
    const finalMinutes = acceptCustomPrep ? Number(acceptCustomPrep) : Number(acceptPrepMinutes);
    try {
      const res = await fetch(`http://localhost:8000/api/orders/${acceptModalOrder.id}/accept`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estimated_preparation_minutes: finalMinutes })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to accept order');
      }
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === acceptModalOrder.id ? { ...o, ...updated } : o)));
      setAcceptModalOrder(null);
      setAcceptCustomPrep('');
      showNotice(`Order #${acceptModalOrder.order_number} ACCEPTED with ${finalMinutes}m prep time.`);
      fetchDashboardStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setAcceptSubmitting(false);
    }
  };

  // 2. Reject Order with Reason
  const handleRejectOrder = async (e) => {
    e.preventDefault();
    if (!rejectModalOrder) return;
    setRejectSubmitting(true);
    const finalReason = rejectReason === 'Other' ? rejectCustomReason : rejectReason;
    try {
      const res = await fetch(`http://localhost:8000/api/orders/${rejectModalOrder.id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: finalReason || 'Canteen unable to process' })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to reject order');
      }
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === rejectModalOrder.id ? { ...o, ...updated } : o)));
      setRejectModalOrder(null);
      setRejectCustomReason('');
      showNotice(`Order #${rejectModalOrder.order_number} REJECTED. Inventory and wallet refunded.`, 'warning');
      fetchDashboardStats();
      fetchInventory();
    } catch (err) {
      alert(err.message);
    } finally {
      setRejectSubmitting(false);
    }
  };

  // 3. Start Preparing
  const handleStartPreparing = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/orders/${orderId}/prepare`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to start preparation');
      }
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)));
      showNotice(`Order #${updated.order_number} is now PREPARING.`);
      fetchDashboardStats();
    } catch (err) {
      alert(err.message);
    }
  };

  // 4. Mark Ready for Pickup
  const handleMarkReady = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/orders/${orderId}/ready`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to mark ready');
      }
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)));
      showNotice(`Order #${updated.order_number} marked READY. Customer notified.`);
      fetchDashboardStats();
    } catch (err) {
      alert(err.message);
    }
  };

  // 5. Update Prep Time
  const handleUpdatePrepTime = async (e) => {
    e.preventDefault();
    if (!prepModalOrder) return;
    setPrepSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/api/orders/${prepModalOrder.id}/prep-time`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estimated_preparation_minutes: Number(newPrepMinutes) })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update prep time');
      }
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === prepModalOrder.id ? { ...o, ...updated } : o)));
      setPrepModalOrder(null);
      showNotice(`Prep time updated to ${newPrepMinutes}m for order #${prepModalOrder.order_number}.`);
    } catch (err) {
      alert(err.message);
    } finally {
      setPrepSubmitting(false);
    }
  };

  // 6. Verify Pickup Code
  const handleVerifyPickup = async (e) => {
    e.preventDefault();
    setPickupError('');
    setPickupSuccess('');
    if (!pickupModalOrder || !enteredPickupCode.trim()) return;

    setPickupSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/api/orders/${pickupModalOrder.id}/verify-pickup`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ pickup_code: enteredPickupCode.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Verification failed');
      }
      setPickupSuccess(`Verified! Order #${pickupModalOrder.order_number} completed.`);
      setOrders((prev) =>
        prev.map((o) => (o.id === pickupModalOrder.id ? { ...o, status: 'COMPLETED', completed_at: new Date().toISOString() } : o))
      );
      setTimeout(() => {
        setPickupModalOrder(null);
        setEnteredPickupCode('');
        setPickupSuccess('');
      }, 1400);
      showNotice(`Order #${pickupModalOrder.order_number} delivered successfully.`);
      fetchDashboardStats();
      fetchSales();
    } catch (err) {
      setPickupError(err.message);
    } finally {
      setPickupSubmitting(false);
    }
  };

  // Menu Handlers
  const handleOpenAddDish = () => {
    setDishEditingItem(null);
    setDishName('');
    setDishPrice('');
    setDishCategory(categories[0] || 'Fast Food');
    setDishPrepTime(10);
    setDishPricingType('FIXED');
    setDishUnitInfo('');
    setDishDescription('');
    setDishImageUrl('');
    setNewDishModal(true);
  };

  const handleOpenEditDish = (item) => {
    setDishEditingItem(item);
    setDishName(item.name);
    setDishPrice(String(item.price));
    setDishCategory(item.category || categories[0] || 'Fast Food');
    setDishPrepTime(item.preparation_time_minutes || 10);
    setDishPricingType(item.pricing_type || 'FIXED');
    setDishUnitInfo(item.unit_info || '');
    setDishDescription(item.description || '');
    setDishImageUrl(item.image_url || '');
    setNewDishModal(true);
  };

  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!dishName || !dishPrice) return;
    try {
      const payload = {
        canteen_id: selectedCanteenId,
        name: dishName,
        price: parseFloat(dishPrice),
        category: dishCategory || 'Fast Food',
        preparation_time_minutes: Number(dishPrepTime),
        pricing_type: dishPricingType,
        unit_info: dishUnitInfo,
        description: dishDescription,
        image_url: dishImageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        is_available: true
      };

      let res;
      if (dishEditingItem) {
        res = await fetch(`http://localhost:8000/api/menu-items/${dishEditingItem.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('http://localhost:8000/api/menu-items', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save dish');
      }

      setNewDishModal(false);
      fetchMenu();
      fetchInventory();
      showNotice(dishEditingItem ? 'Dish updated successfully.' : 'Dish created successfully.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleDishAvailability = async (item) => {
    try {
      const res = await fetch(`http://localhost:8000/api/menu-items/${item.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_available: !item.is_available })
      });
      if (res.ok) {
        fetchMenu();
        showNotice(`${item.name} is now ${!item.is_available ? 'Available' : 'Sold Out'}.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDish = async (item) => {
    if (!window.confirm(`Are you sure you want to remove "${item.name}"? If past orders exist, it will be safely deactivated.`)) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/menu-items/${item.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchMenu();
        fetchInventory();
        showNotice(`Dish removed/deactivated.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Category Handlers
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      if (res.ok) {
        setNewCategoryName('');
        fetchCategories();
        showNotice('Category added.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameCategory = async (oldName) => {
    if (!categoryRenameValue.trim()) return;
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/categories`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ old_name: oldName, new_name: categoryRenameValue.trim() })
      });
      if (res.ok) {
        setCategoryRenameTarget(null);
        setCategoryRenameValue('');
        fetchCategories();
        fetchMenu();
        showNotice('Category renamed.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (catName) => {
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/categories/${encodeURIComponent(catName)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Cannot delete category');
      }
      fetchCategories();
      showNotice('Category deleted.');
    } catch (err) {
      alert(err.message);
    }
  };

  // Inventory Restock Handler
  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockModalItem) return;
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/inventory/${restockModalItem.menu_item_id}/restock`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          quantity_change: Number(restockQty),
          note: restockNote.trim() || 'Manual kitchen restock'
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Restock failed');
      }
      setRestockModalItem(null);
      setRestockNote('');
      fetchInventory();
      fetchInventoryAlerts();
      fetchMenu();
      showNotice(`Inventory restocked for ${restockModalItem.menu_item_name}.`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Settings Save Handler
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!canteenSettings) return;
    setSettingsSaving(true);
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${selectedCanteenId}/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          is_open: canteenSettings.is_open,
          location: canteenSettings.location,
          description: canteenSettings.description
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to save settings');
      }
      showNotice('Canteen operational settings saved.');
      fetchSettings();
    } catch (err) {
      alert(err.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  // Refund Processor
  const handleProcessRefund = async (refundId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:8000/api/refunds/${refundId}/process`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
          note: `Processed by staff ${currentUser?.name || 'Staff'}`
        })
      });
      if (res.ok) {
        fetchRefunds();
        fetchOrders();
        fetchSales();
        showNotice(`Refund ${newStatus.toLowerCase()} successfully.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered Orders for Board & History
  const searchedOrders = useMemo(() => {
    if (!orderSearchQuery.trim()) return orders;
    const q = orderSearchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.order_number?.toLowerCase().includes(q) ||
        o.user_name?.toLowerCase().includes(q) ||
        o.pickup_code?.includes(q)
    );
  }, [orders, orderSearchQuery]);

  // Kanban Board Columns
  const boardColumns = useMemo(() => {
    const newQueue = searchedOrders.filter(
      (o) => o.status === 'PLACED' || o.status === 'PAYMENT_PENDING' || o.status === 'PAYMENT_CONFIRMED'
    );
    const acceptedQueue = searchedOrders.filter((o) => o.status === 'ACCEPTED');
    const preparingQueue = searchedOrders.filter((o) => o.status === 'PREPARING');
    const readyQueue = searchedOrders.filter((o) => o.status === 'READY');
    return {
      NEW: newQueue,
      ACCEPTED: acceptedQueue,
      PREPARING: preparingQueue,
      READY: readyQueue
    };
  }, [searchedOrders]);

  // Completed Orders with Date Filter
  const completedOrders = useMemo(() => {
    const completed = searchedOrders.filter((o) => o.status === 'COMPLETED');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return completed.filter((o) => {
      if (historyDateFilter === 'ALL') return true;
      const oDate = o.completed_at || o.created_at;
      if (!oDate) return true;
      const d = oDate.split('T')[0];
      if (historyDateFilter === 'TODAY') return d === todayStr;
      if (historyDateFilter === 'YESTERDAY') return d === yesterday;
      if (historyDateFilter === 'THIS_WEEK') return new Date(oDate) >= sevenDaysAgo;
      return true;
    });
  }, [searchedOrders, historyDateFilter]);

  const currentCanteenObj = canteens.find((c) => c.id === selectedCanteenId) || {
    id: selectedCanteenId,
    name: canteenSettings?.name || currentUser?.canteenName || 'Assigned Canteen'
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-24 sm:pb-12 text-ink-900 font-sans">
      {/* Dynamic Action Notification Banner */}
      {bannerNotice && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-paper-elevated flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-2 border ${
            bannerNotice.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-sage-600 text-white border-sage-700'
          }`}
        >
          {bannerNotice.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
          )}
          <span>{bannerNotice.text}</span>
        </div>
      )}

      {/* Staff Header: Authoritative Assigned Canteen */}
      <div className="bg-white border border-oatmeal-300 p-5 rounded-3xl shadow-paper mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-sage-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-sage-800 bg-sage-50 border border-sage-300 px-2.5 py-0.5 rounded-full">
              Kitchen Dispatch Terminal
            </span>
            <span className="text-[10px] font-semibold text-ink-600 bg-oatmeal-100 border border-oatmeal-200 px-2.5 py-0.5 rounded-full">
              Staff: <strong>{currentUser?.name || 'Suresh Kumar'}</strong> ({currentUser?.staffRole || 'Manager'})
            </span>
            {canteenSettings && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  canteenSettings.is_open
                    ? 'bg-sage-100 text-sage-800 border-sage-300'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {canteenSettings.is_open ? 'Counter Open' : 'Counter Closed'}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-ink-900 tracking-tight flex items-center gap-2">
            <span>{currentCanteenObj.name}</span>
            <span className="text-xs font-semibold text-ink-400 bg-oatmeal-100 px-2 py-0.5 rounded-lg border border-oatmeal-200">
              Outlet #{selectedCanteenId}
            </span>
          </h1>
          <p className="text-xs text-ink-500 mt-0.5">
            Real-time live kitchen queue, state-machine dispatching, menu control & analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Outlet Switcher - Only super admins can switch; regular staff stay isolated */}
          {isSuperAdmin && (
            <div className="flex items-center gap-1.5 bg-oatmeal-100 border border-oatmeal-300 rounded-2xl px-3 py-1.5 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-terracotta-600" />
              <select
                value={selectedCanteenId}
                onChange={(e) => setSelectedCanteenId(Number(e.target.value))}
                className="bg-transparent font-bold text-ink-800 focus:outline-none text-xs"
              >
                {canteens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => {
              fetchOrders();
              fetchSales();
              fetchInventory();
              fetchDashboardStats();
              fetchInventoryAlerts();
              showNotice('Queue refreshed.');
            }}
            className="p-2.5 rounded-2xl bg-white border border-oatmeal-300 hover:bg-oatmeal-100 text-ink-700 shadow-xs transition-colors flex items-center gap-1 text-xs font-bold"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4 text-sage-700" />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Stock Alerts Notice Bar (if any) */}
      {inventoryAlerts.length > 0 && (
        <div className="mb-6 p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Inventory Warning:</strong> {inventoryAlerts.length} item(s) are low or out of stock (
              {inventoryAlerts.map((a) => a.menu_item_name).slice(0, 3).join(', ')}
              {inventoryAlerts.length > 3 ? '...' : ''}).
            </span>
          </div>
          <button
            onClick={() => setActiveSection('inventory')}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-[11px] shrink-0"
          >
            Manage Stock
          </button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        {[
          { key: 'orders', label: 'Live Orders', icon: Clock, badge: boardColumns.NEW.length + boardColumns.ACCEPTED.length + boardColumns.PREPARING.length + boardColumns.READY.length },
          { key: 'menu', label: 'Menu Catalog', icon: Utensils, badge: menuItems.length },
          { key: 'inventory', label: 'Inventory & Alerts', icon: Package, badge: inventoryAlerts.length > 0 ? inventoryAlerts.length : undefined, badgeAlert: inventoryAlerts.length > 0 },
          { key: 'sales', label: 'Sales & Revenue', icon: TrendingUp },
          { key: 'bills', label: 'Invoices & Tax Bills', icon: Receipt, badge: bills.length },
          { key: 'refunds', label: 'Refund Requests', icon: RotateCcw, badge: refunds.filter((r) => r.status === 'REQUESTED').length, badgeAlert: refunds.filter((r) => r.status === 'REQUESTED').length > 0 },
          { key: 'settings', label: 'Canteen Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-sage-700 text-white shadow-paper'
                  : 'bg-white border border-oatmeal-300 text-ink-600 hover:bg-oatmeal-100 hover:text-ink-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    tab.badgeAlert
                      ? 'bg-terracotta-500 text-white'
                      : isActive
                      ? 'bg-white text-sage-800'
                      : 'bg-oatmeal-200 text-ink-800'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: LIVE ORDERS (KANBAN / SEARCH / PASSCODE VERIFY / HISTORY)      */}
      {/* ===================================================================== */}
      {activeSection === 'orders' && (
        <div className="space-y-6">
          {/* Top Bar: Search + Quick Stats + Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-oatmeal-300 p-4 rounded-3xl shadow-paper">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="Search by Order #, Customer Name, or Passcode..."
                className="w-full pl-10 pr-4 py-2 bg-oatmeal-50 border border-oatmeal-200 rounded-2xl text-xs text-ink-900 focus:outline-none focus:border-sage-600 focus:bg-white transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0 bg-oatmeal-100 p-1 rounded-2xl border border-oatmeal-200">
              <button
                onClick={() => setOrderViewMode('board')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  orderViewMode === 'board' ? 'bg-white text-ink-900 shadow-xs' : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                Kitchen Board
              </button>
              <button
                onClick={() => setOrderViewMode('history')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  orderViewMode === 'history' ? 'bg-white text-ink-900 shadow-xs' : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                Completed History
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          {dashboardStats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white border border-oatmeal-200 p-3.5 rounded-2xl text-center shadow-xs">
                <span className="text-[10px] font-bold uppercase text-ink-400 block mb-0.5">Incoming</span>
                <span className="text-xl font-black text-ink-800">{dashboardStats.pending_orders}</span>
              </div>
              <div className="bg-white border border-oatmeal-200 p-3.5 rounded-2xl text-center shadow-xs">
                <span className="text-[10px] font-bold uppercase text-ink-400 block mb-0.5">Cooking</span>
                <span className="text-xl font-black text-amber-600">{dashboardStats.preparing_orders}</span>
              </div>
              <div className="bg-white border border-oatmeal-200 p-3.5 rounded-2xl text-center shadow-xs">
                <span className="text-[10px] font-bold uppercase text-ink-400 block mb-0.5">Ready for Pickup</span>
                <span className="text-xl font-black text-terracotta-600">{dashboardStats.ready_orders}</span>
              </div>
              <div className="bg-white border border-oatmeal-200 p-3.5 rounded-2xl text-center shadow-xs">
                <span className="text-[10px] font-bold uppercase text-ink-400 block mb-0.5">Done Today</span>
                <span className="text-xl font-black text-sage-700">{dashboardStats.completed_today}</span>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-white border border-oatmeal-200 p-3.5 rounded-2xl text-center shadow-xs">
                <span className="text-[10px] font-bold uppercase text-ink-400 block mb-0.5">Today's Net</span>
                <span className="text-xl font-black text-ink-900">₹{dashboardStats.today_sales}</span>
              </div>
            </div>
          )}

          {/* SUB-VIEW A: KITCHEN KANBAN BOARD */}
          {orderViewMode === 'board' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              {/* Column 1: NEW / PLACED */}
              <div className="bg-oatmeal-100/70 border border-oatmeal-300 rounded-3xl p-3.5 flex flex-col gap-3 min-h-[500px]">
                <div className="flex items-center justify-between px-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-ink-400" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-ink-800">New Orders</h3>
                  </div>
                  <span className="text-xs font-black bg-white px-2 py-0.5 rounded-full border border-oatmeal-200 text-ink-700">
                    {boardColumns.NEW.length}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[75vh] pr-1">
                  {boardColumns.NEW.length === 0 ? (
                    <div className="py-12 text-center text-xs text-ink-400">No new incoming orders</div>
                  ) : (
                    boardColumns.NEW.map((order) => (
                      <OrderTicketCard
                        key={order.id}
                        order={order}
                        onAccept={() => {
                          setAcceptModalOrder(order);
                          setAcceptPrepMinutes(order.estimated_preparation_minutes || 15);
                        }}
                        onReject={() => {
                          setRejectModalOrder(order);
                          setRejectReason('Item unavailable');
                        }}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: ACCEPTED */}
              <div className="bg-oatmeal-100/70 border border-oatmeal-300 rounded-3xl p-3.5 flex flex-col gap-3 min-h-[500px]">
                <div className="flex items-center justify-between px-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-blue-900">Accepted</h3>
                  </div>
                  <span className="text-xs font-black bg-white px-2 py-0.5 rounded-full border border-oatmeal-200 text-blue-900">
                    {boardColumns.ACCEPTED.length}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[75vh] pr-1">
                  {boardColumns.ACCEPTED.length === 0 ? (
                    <div className="py-12 text-center text-xs text-ink-400">No accepted orders waiting</div>
                  ) : (
                    boardColumns.ACCEPTED.map((order) => (
                      <OrderTicketCard
                        key={order.id}
                        order={order}
                        onPrepare={() => handleStartPreparing(order.id)}
                        onAdjustPrep={() => {
                          setPrepModalOrder(order);
                          setNewPrepMinutes(order.estimated_preparation_minutes || 15);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Column 3: PREPARING */}
              <div className="bg-oatmeal-100/70 border border-oatmeal-300 rounded-3xl p-3.5 flex flex-col gap-3 min-h-[500px]">
                <div className="flex items-center justify-between px-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900">Preparing</h3>
                  </div>
                  <span className="text-xs font-black bg-white px-2 py-0.5 rounded-full border border-oatmeal-200 text-amber-900">
                    {boardColumns.PREPARING.length}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[75vh] pr-1">
                  {boardColumns.PREPARING.length === 0 ? (
                    <div className="py-12 text-center text-xs text-ink-400">No orders cooking currently</div>
                  ) : (
                    boardColumns.PREPARING.map((order) => (
                      <OrderTicketCard
                        key={order.id}
                        order={order}
                        onReady={() => handleMarkReady(order.id)}
                        onAdjustPrep={() => {
                          setPrepModalOrder(order);
                          setNewPrepMinutes(order.estimated_preparation_minutes || 15);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Column 4: READY */}
              <div className="bg-oatmeal-100/70 border border-oatmeal-300 rounded-3xl p-3.5 flex flex-col gap-3 min-h-[500px]">
                <div className="flex items-center justify-between px-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-terracotta-500 animate-pulse" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-terracotta-900">Ready for Pickup</h3>
                  </div>
                  <span className="text-xs font-black bg-white px-2 py-0.5 rounded-full border border-oatmeal-200 text-terracotta-900">
                    {boardColumns.READY.length}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[75vh] pr-1">
                  {boardColumns.READY.length === 0 ? (
                    <div className="py-12 text-center text-xs text-ink-400">No orders waiting at counter</div>
                  ) : (
                    boardColumns.READY.map((order) => (
                      <OrderTicketCard
                        key={order.id}
                        order={order}
                        onVerifyPickup={() => {
                          setPickupModalOrder(order);
                          setEnteredPickupCode('');
                          setPickupError('');
                          setPickupSuccess('');
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW B: COMPLETED ORDER HISTORY */}
          {orderViewMode === 'history' && (
            <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-bold text-ink-900">Completed Order History</h2>
                  <p className="text-xs text-ink-500">Filtered historical click & collect pickups</p>
                </div>

                <div className="flex items-center gap-1.5 bg-oatmeal-100 p-1 rounded-2xl border border-oatmeal-200 text-xs">
                  {['TODAY', 'YESTERDAY', 'THIS_WEEK', 'ALL'].map((df) => (
                    <button
                      key={df}
                      onClick={() => setHistoryDateFilter(df)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        historyDateFilter === df ? 'bg-white text-ink-900 shadow-xs' : 'text-ink-600 hover:text-ink-900'
                      }`}
                    >
                      {df.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {completedOrders.length === 0 ? (
                <div className="text-center py-16 text-ink-400 text-xs">
                  No completed orders matching the selected filter.
                </div>
              ) : (
                <div className="divide-y divide-oatmeal-100 text-xs">
                  {completedOrders.map((o) => (
                    <div key={o.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-ink-900 text-sm">#{o.order_number}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage-100 text-sage-800 border border-sage-200">
                            COLLECTED
                          </span>
                          <span className="text-[11px] text-ink-500">
                            Code: <strong className="font-mono">{o.pickup_code}</strong>
                          </span>
                        </div>
                        <p className="text-ink-600 mt-1">
                          Customer: <strong>{o.user_name || 'Student'}</strong> • {o.items?.length || 0} item(s) (
                          {o.items?.map((it) => `${it.quantity}x ${it.item_name || it.menu_item_name}`).join(', ')})
                        </p>
                        <p className="text-[10px] text-ink-400 mt-0.5">
                          Completed at: {o.completed_at ? new Date(o.completed_at).toLocaleTimeString() : 'Recorded'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-sm text-ink-900 block">
                          ₹{Number(o.total_amount || o.total_price).toFixed(2)}
                        </span>
                        <span className="text-[10px] font-semibold text-sage-700 bg-sage-50 px-2 py-0.5 rounded-md border border-sage-200">
                          {o.payment_status || 'PAID'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: MENU CATALOG & PRICING & CATEGORIES                            */}
      {/* ===================================================================== */}
      {activeSection === 'menu' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-oatmeal-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-ink-900">Menu Catalog Management</h2>
              <p className="text-xs text-ink-500">
                Configure dish pricing (Fixed or Packaged MRP), availability, prep time, and categories.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCategoryModalOpen(true)}
                className="px-3.5 py-2 bg-oatmeal-100 hover:bg-oatmeal-200 text-ink-800 font-bold text-xs rounded-2xl border border-oatmeal-300 flex items-center gap-1.5 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-ink-600" />
                <span>Categories</span>
              </button>
              <button
                onClick={handleOpenAddDish}
                className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-xs rounded-2xl shadow-paper flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Dish</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-oatmeal-50 border border-oatmeal-200 rounded-2xl flex flex-col justify-between hover:border-sage-400 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <span className="font-bold text-xs text-ink-900 leading-tight">{item.name}</span>
                    <span className="font-black text-xs text-ink-900 shrink-0">
                      {item.pricing_type === 'MRP' ? (
                        <span className="px-1.5 py-0.5 bg-oatmeal-200 text-ink-800 border border-oatmeal-300 rounded text-[10px]">
                          MRP ₹{Number(item.price).toFixed(2)}
                        </span>
                      ) : (
                        `₹${Number(item.price).toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    <span className="text-[10px] font-semibold text-ink-600 bg-white border border-oatmeal-200 px-2 py-0.5 rounded-md">
                      {item.category || 'General'}
                    </span>
                    {item.unit_info && (
                      <span className="text-[10px] text-ink-500 font-medium">{item.unit_info}</span>
                    )}
                    <span className="text-[10px] text-ink-400">{item.preparation_time_minutes}m prep</span>
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-ink-500 line-clamp-2 mb-3">{item.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-oatmeal-200 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleDishAvailability(item)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                      item.is_available
                        ? 'bg-sage-100 text-sage-800 border-sage-300 hover:bg-sage-200'
                        : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                    }`}
                  >
                    {item.is_available ? 'Available' : 'Sold Out'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditDish(item)}
                      className="p-1.5 rounded-xl bg-white border border-oatmeal-300 text-ink-600 hover:bg-oatmeal-100"
                      title="Edit Dish"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDish(item)}
                      className="p-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50"
                      title="Delete / Deactivate"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: INVENTORY MANAGEMENT & AUDITING                                */}
      {/* ===================================================================== */}
      {activeSection === 'inventory' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper space-y-6">
          <div>
            <h2 className="text-base font-bold text-ink-900">Inventory & Kitchen Stock Levels</h2>
            <p className="text-xs text-ink-500">
              Stock automatically decrements on orders and safely restores on cancellations. Restocks are logged with audit transactions.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-oatmeal-200 text-ink-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Dish / Item</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Current Stock</th>
                  <th className="pb-3">Minimum Alert Level</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Stock Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oatmeal-100">
                {inventory.map((inv) => {
                  const isOut = inv.quantity <= 0;
                  const isLow = inv.quantity > 0 && inv.quantity <= inv.minimum_stock;
                  return (
                    <tr key={inv.id} className="text-ink-800">
                      <td className="py-3.5 font-bold">{inv.menu_item_name || `Item #${inv.menu_item_id}`}</td>
                      <td className="py-3.5 text-ink-500">{inv.category || 'Kitchen'}</td>
                      <td className="py-3.5 font-black text-sm">
                        <span className={isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-ink-900'}>
                          {inv.quantity}
                        </span>
                      </td>
                      <td className="py-3.5 text-ink-500 font-medium">{inv.minimum_stock}</td>
                      <td className="py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isOut
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : isLow
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-sage-100 text-sage-800 border-sage-300'
                          }`}
                        >
                          {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'AVAILABLE'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => {
                            setRestockModalItem(inv);
                            setRestockQty(25);
                          }}
                          className="px-3 py-1 bg-oatmeal-100 hover:bg-sage-600 hover:text-white rounded-xl text-xs font-bold transition-all border border-oatmeal-300"
                        >
                          + Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: SALES & ANALYTICS                                              */}
      {/* ===================================================================== */}
      {activeSection === 'sales' && salesSummary && (
        <div className="space-y-6">
          {/* Today, Weekly, Monthly Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 shadow-paper">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block mb-1">
                Today's Net Sales
              </span>
              <div className="text-2xl font-black text-sage-700">₹{salesSummary.today?.net_sales?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-ink-500 mt-1">
                {salesSummary.today?.orders || 0} valid orders • Gross ₹{salesSummary.today?.gross_sales?.toFixed(2) || '0.00'}
              </p>
              {salesSummary.today?.refunds > 0 && (
                <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">
                  -₹{salesSummary.today.refunds.toFixed(2)} refunded
                </span>
              )}
            </div>

            <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 shadow-paper">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block mb-1">
                Past 7 Days (Weekly)
              </span>
              <div className="text-2xl font-black text-ink-900">₹{salesSummary.weekly?.net_sales?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-ink-500 mt-1">{salesSummary.weekly?.orders || 0} orders settled</p>
            </div>

            <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 shadow-paper">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block mb-1">
                Past 30 Days (Monthly)
              </span>
              <div className="text-2xl font-black text-ink-900">₹{salesSummary.monthly?.net_sales?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-ink-500 mt-1">{salesSummary.monthly?.orders || 0} orders settled</p>
            </div>
          </div>

          {/* Top Selling Items & Hourly Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Selling Items */}
            <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
              <h3 className="text-sm font-bold text-ink-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-terracotta-600" />
                <span>Top Selling Dishes</span>
              </h3>
              <div className="space-y-3 text-xs">
                {salesSummary.top_selling_items?.length === 0 ? (
                  <p className="text-ink-400 py-6 text-center">No sales registered yet.</p>
                ) : (
                  salesSummary.top_selling_items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-oatmeal-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-oatmeal-200 text-[10px] font-black flex items-center justify-center text-ink-700">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-ink-900">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-ink-900 block">{item.quantity} units</span>
                        <span className="text-[10px] text-ink-500">₹{Number(item.revenue).toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Orders By Hour Breakdown */}
            <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
              <h3 className="text-sm font-bold text-ink-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sage-600" />
                <span>Hourly Demand Pattern</span>
              </h3>
              <div className="space-y-2 text-xs">
                {salesSummary.orders_by_hour?.length === 0 ? (
                  <p className="text-ink-400 py-6 text-center">No hourly data available.</p>
                ) : (
                  salesSummary.orders_by_hour?.map((h) => (
                    <div key={h.hour} className="flex items-center gap-3">
                      <span className="w-14 font-mono text-ink-500 shrink-0">{h.hour}:00</span>
                      <div className="flex-1 bg-oatmeal-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-sage-600 h-full rounded-full"
                          style={{ width: `${Math.min(100, (h.count / 15) * 100)}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-bold text-ink-800 shrink-0">{h.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: BILLS & INVOICING                                              */}
      {/* ===================================================================== */}
      {activeSection === 'bills' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-oatmeal-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-ink-900">Tax Invoices & Receipts</h2>
              <p className="text-xs text-ink-500">
                Authoritative bills containing frozen historical price snapshots and student details.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={billSearchQuery}
                onChange={(e) => setBillSearchQuery(e.target.value)}
                placeholder="Search Bill # or Student..."
                className="w-full pl-9 pr-3 py-1.5 bg-oatmeal-50 border border-oatmeal-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="divide-y divide-oatmeal-100 text-xs">
            {bills
              .filter((b) =>
                b.bill_number?.toLowerCase().includes(billSearchQuery.toLowerCase()) ||
                b.user_name?.toLowerCase().includes(billSearchQuery.toLowerCase())
              )
              .map((b) => (
                <div key={b.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-mono font-bold text-ink-900 text-sm">#{b.bill_number}</div>
                    <div className="text-ink-500 text-[11px] mt-0.5">
                      Customer: <strong>{b.user_name || 'Student'}</strong> • Order #{b.order_number}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="font-bold text-ink-900 text-sm block">₹{Number(b.total).toFixed(2)}</span>
                      <span className="text-[10px] font-semibold text-sage-700 uppercase">{b.payment_status}</span>
                    </div>
                    <button
                      onClick={() => setSelectedBillForPrint(b)}
                      className="p-2 rounded-xl bg-oatmeal-100 hover:bg-oatmeal-200 text-ink-700 border border-oatmeal-300"
                      title="View & Print Bill"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: REFUND PROCESSING                                              */}
      {/* ===================================================================== */}
      {activeSection === 'refunds' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper space-y-4">
          <div>
            <h2 className="text-base font-bold text-ink-900">Customer Refund Queue</h2>
            <p className="text-xs text-ink-500">
              Isolated refund approvals for cancelled orders. Approvals credit the student wallet idempotently.
            </p>
          </div>

          {refunds.length === 0 ? (
            <div className="py-16 text-center text-xs text-ink-400">No refund requests recorded for this canteen.</div>
          ) : (
            <div className="space-y-3 text-xs">
              {refunds.map((ref) => (
                <div
                  key={ref.id}
                  className="p-4 bg-oatmeal-50 border border-oatmeal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-mono font-bold text-ink-900">REF #{ref.refund_reference}</div>
                    <div className="text-ink-700 mt-1">Reason: "{ref.reason}"</div>
                    <div className="text-ink-500 text-[11px] mt-0.5">
                      Order #{ref.order_id} • Amount: <strong className="text-ink-900">₹{Number(ref.amount).toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                        ref.status === 'COMPLETED'
                          ? 'bg-sage-100 text-sage-800 border-sage-300'
                          : ref.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {ref.status}
                    </span>

                    {ref.status === 'REQUESTED' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleProcessRefund(ref.id, 'COMPLETED')}
                          className="px-3 py-1.5 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs font-bold shadow-xs"
                        >
                          Approve & Refund
                        </button>
                        <button
                          onClick={() => handleProcessRefund(ref.id, 'REJECTED')}
                          className="px-3 py-1.5 bg-oatmeal-200 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 7: CANTEEN SETTINGS                                               */}
      {/* ===================================================================== */}
      {activeSection === 'settings' && canteenSettings && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper max-w-2xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-ink-900">Canteen Operational Controls</h2>
            <p className="text-xs text-ink-500">
              Configure counter open/closed status and location details. (Canteen activation is restricted to Campus Administrators).
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            {/* Open / Closed Toggle */}
            <div className="flex items-center justify-between p-4 bg-oatmeal-50 rounded-2xl border border-oatmeal-200">
              <div>
                <span className="font-bold text-ink-900 block">Accepting Live Orders</span>
                <span className="text-[11px] text-ink-500">
                  Toggle counter status to temporarily pause incoming student tickets.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCanteenSettings((prev) => ({ ...prev, is_open: !prev.is_open }))}
                className={`px-4 py-2 rounded-2xl font-bold transition-all ${
                  canteenSettings.is_open
                    ? 'bg-sage-600 text-white shadow-paper'
                    : 'bg-rose-600 text-white shadow-paper'
                }`}
              >
                {canteenSettings.is_open ? 'OPEN FOR ORDERS' : 'PAUSED / CLOSED'}
              </button>
            </div>

            <div>
              <label className="font-bold text-ink-700 block mb-1">Campus Location</label>
              <input
                type="text"
                value={canteenSettings.location || ''}
                onChange={(e) => setCanteenSettings((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full bg-oatmeal-50 border border-oatmeal-200 rounded-xl p-2.5 text-ink-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-ink-700 block mb-1">Description / Tagline</label>
              <textarea
                rows={3}
                value={canteenSettings.description || ''}
                onChange={(e) => setCanteenSettings((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full bg-oatmeal-50 border border-oatmeal-200 rounded-xl p-2.5 text-ink-900 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={settingsSaving}
              className="py-2.5 px-6 bg-sage-600 hover:bg-sage-700 text-white font-bold rounded-2xl shadow-paper flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{settingsSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: ACCEPT ORDER WITH PREP TIME                                  */}
      {/* ===================================================================== */}
      {acceptModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative">
            <button
              onClick={() => setAcceptModalOrder(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-ink-900 mb-1">Accept Order #{acceptModalOrder.order_number}</h3>
            <p className="text-xs text-ink-500 mb-4">Select or enter the estimated preparation time in minutes.</p>

            <form onSubmit={handleAcceptOrder} className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 30].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setAcceptPrepMinutes(m);
                      setAcceptCustomPrep('');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      !acceptCustomPrep && acceptPrepMinutes === m
                        ? 'bg-sage-600 text-white border-sage-700'
                        : 'bg-oatmeal-100 text-ink-700 border-oatmeal-200'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-ink-500 block mb-1">Or Custom Prep Minutes</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  placeholder="e.g. 25"
                  value={acceptCustomPrep}
                  onChange={(e) => setAcceptCustomPrep(e.target.value)}
                  className="w-full text-center text-lg font-bold py-2 bg-oatmeal-50 border border-oatmeal-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={acceptSubmitting}
                className="w-full py-2.5 bg-sage-600 hover:bg-sage-700 text-white font-bold rounded-2xl text-xs shadow-paper flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{acceptSubmitting ? 'Accepting...' : 'Confirm & Accept Order'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: REJECT ORDER WITH REASON                                     */}
      {/* ===================================================================== */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative">
            <button
              onClick={() => setRejectModalOrder(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-ink-900 mb-1">Reject Order #{rejectModalOrder.order_number}</h3>
            <p className="text-xs text-ink-500 mb-4">
              Select rejection reason. The customer will receive an immediate refund and notification.
            </p>

            <form onSubmit={handleRejectOrder} className="space-y-4 text-xs">
              <div className="space-y-2">
                {['Item unavailable', 'Kitchen busy', 'Canteen closed', 'Other'].map((r) => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rejectReason"
                      value={r}
                      checked={rejectReason === r}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="text-terracotta-600 focus:ring-terracotta-500"
                    />
                    <span className="font-semibold text-ink-800">{r}</span>
                  </label>
                ))}
              </div>

              {rejectReason === 'Other' && (
                <input
                  type="text"
                  required
                  placeholder="Specify reason..."
                  value={rejectCustomReason}
                  onChange={(e) => setRejectCustomReason(e.target.value)}
                  className="w-full bg-oatmeal-50 border border-oatmeal-200 rounded-xl p-2.5 text-xs"
                />
              )}

              <button
                type="submit"
                disabled={rejectSubmitting}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs shadow-paper flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>{rejectSubmitting ? 'Rejecting...' : 'Reject Order & Refund'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: ADJUST PREP TIME                                             */}
      {/* ===================================================================== */}
      {prepModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative">
            <button
              onClick={() => setPrepModalOrder(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-ink-900 mb-1">Adjust Prep Time</h3>
            <p className="text-xs text-ink-500 mb-4">
              Recalculates estimated ready time and notifies the student via WebSocket.
            </p>

            <form onSubmit={handleUpdatePrepTime} className="space-y-4">
              <div className="flex items-center gap-2">
                {[10, 15, 20, 30].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setNewPrepMinutes(m)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      newPrepMinutes === m ? 'bg-terracotta-500 text-white border-terracotta-600' : 'bg-oatmeal-100 text-ink-700 border-oatmeal-200'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="1"
                max="180"
                value={newPrepMinutes}
                onChange={(e) => setNewPrepMinutes(e.target.value)}
                className="w-full text-center text-2xl font-bold py-2 bg-oatmeal-50 border border-oatmeal-200 rounded-2xl text-ink-900"
              />

              <button
                type="submit"
                disabled={prepSubmitting}
                className="w-full py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl text-xs font-bold shadow-paper"
              >
                {prepSubmitting ? 'Updating...' : 'Broadcast New Estimate'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: PICKUP VERIFICATION (PASSCODE & SIMULATED QR SCANNER)        */}
      {/* ===================================================================== */}
      {pickupModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs animate-in zoom-in-95">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative">
            <button
              onClick={() => setPickupModalOrder(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-2xl bg-sage-100 text-sage-700 flex items-center justify-center mb-3">
              <KeyRound className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-ink-900 mb-1">Verify Pickup Passcode</h3>
            <p className="text-xs text-ink-500 mb-4">
              Enter the 4-digit secret code shown on student's order pass for #{pickupModalOrder.order_number}.
            </p>

            {pickupError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{pickupError}</span>
              </div>
            )}

            {pickupSuccess && (
              <div className="p-3 bg-sage-50 text-sage-800 border border-sage-200 rounded-xl text-xs mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-sage-600" />
                <span>{pickupSuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPickup} className="space-y-4">
              <input
                type="text"
                maxLength={4}
                autoFocus
                placeholder="4-Digit Code"
                value={enteredPickupCode}
                onChange={(e) => setEnteredPickupCode(e.target.value)}
                className="w-full text-center text-3xl font-mono tracking-widest font-black py-3 bg-oatmeal-100 border border-oatmeal-300 rounded-2xl text-ink-900 focus:outline-none focus:border-sage-600 focus:bg-white"
                required
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEnteredPickupCode(pickupModalOrder.pickup_code || '')}
                  className="py-2 px-3 bg-oatmeal-100 hover:bg-oatmeal-200 text-ink-600 font-bold rounded-xl text-[11px] border border-oatmeal-200"
                  title="Simulate QR Camera Scan"
                >
                  <QrCode className="w-4 h-4 inline mr-1" />
                  Scan QR
                </button>
                <button
                  type="submit"
                  disabled={pickupSubmitting}
                  className="flex-1 py-2.5 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs font-bold shadow-paper flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{pickupSubmitting ? 'Verifying...' : 'Verify & Hand Over'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: ADD / EDIT DISH                                              */}
      {/* ===================================================================== */}
      {newDishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs animate-in zoom-in-95">
          <div className="bg-white w-full max-w-md rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative">
            <button
              onClick={() => setNewDishModal(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-ink-900 mb-3">
              {dishEditingItem ? 'Edit Dish Details' : 'Add New Menu Item'}
            </h3>

            <form onSubmit={handleSaveDish} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-ink-700 block mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masala Dosa"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  className="w-full bg-oatmeal-50 border border-oatmeal-200 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink-700 block mb-1">Pricing Type</label>
                  <select
                    value={dishPricingType}
                    onChange={(e) => setDishPricingType(e.target.value)}
                    className="w-full bg-oatmeal-50 border border-oatmeal-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="FIXED">Fixed Kitchen Price</option>
                    <option value="MRP">Packaged Item (MRP)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink-700 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="80.00"
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    className="w-full bg-oatmeal-50 border border-oatmeal-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink-700 block mb-1">Category</label>
                  <select
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    className="w-full bg-oatmeal-50 border border-oatmeal-200 rounded-xl p-2.5"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink-700 block mb-1">Prep Time (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={dishPrepTime}
                    onChange={(e) => setDishPrepTime(e.target.value)}
                    className="w-full bg-oatmeal-50 border border-oatmeal-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-ink-700 block mb-1">Unit Info (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 500ml or 2 pcs"
                  value={dishUnitInfo}
                  onChange={(e) => setDishUnitInfo(e.target.value)}
                  className="w-full bg-oatmeal-50 border border-oatmeal-200 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-ink-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  placeholder="Ingredients or details..."
                  className="w-full bg-oatmeal-50 border border-oatmeal-200 rounded-xl p-2.5"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-2xl shadow-paper"
              >
                {dishEditingItem ? 'Update Dish' : 'Save New Dish'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 6: CATEGORY MANAGER                                             */}
      {/* ===================================================================== */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs animate-in zoom-in-95">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative">
            <button
              onClick={() => setCategoryModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-ink-900 mb-1">Manage Menu Categories</h3>
            <p className="text-xs text-ink-500 mb-4">Add, rename, or remove canteen menu categories.</p>

            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
              <input
                type="text"
                required
                placeholder="New Category Name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 bg-oatmeal-50 border border-oatmeal-200 rounded-xl px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-sage-600 hover:bg-sage-700 text-white font-bold rounded-xl text-xs"
              >
                Add
              </button>
            </form>

            <div className="divide-y divide-oatmeal-100 text-xs max-h-60 overflow-y-auto">
              {categories.map((c) => (
                <div key={c} className="py-2 flex items-center justify-between gap-2">
                  {categoryRenameTarget === c ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={categoryRenameValue}
                        onChange={(e) => setCategoryRenameValue(e.target.value)}
                        className="bg-white border border-oatmeal-300 rounded px-2 py-1 text-xs flex-1"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRenameCategory(c)}
                        className="px-2 py-1 bg-sage-600 text-white rounded font-bold text-[10px]"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setCategoryRenameTarget(null)}
                        className="px-2 py-1 bg-oatmeal-200 text-ink-700 rounded text-[10px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-bold text-ink-800">{c}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setCategoryRenameTarget(c);
                            setCategoryRenameValue(c);
                          }}
                          className="p-1 text-ink-500 hover:text-ink-900"
                          title="Rename"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 7: RESTOCK INVENTORY                                            */}
      {/* ===================================================================== */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs animate-in zoom-in-95">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative">
            <button
              onClick={() => setRestockModalItem(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-ink-900 mb-1">Restock Item</h3>
            <p className="text-xs text-ink-500 mb-4">{restockModalItem.menu_item_name}</p>

            <form onSubmit={handleRestock} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-ink-700 block mb-1">Quantity Change (+ to add, - to reduce)</label>
                <input
                  type="number"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full text-center text-2xl font-bold py-2 bg-oatmeal-50 border border-oatmeal-200 rounded-xl"
                />
                <p className="text-[10px] text-ink-400 mt-1">
                  Current: {restockModalItem.quantity} → Result:{' '}
                  <strong>{Math.max(0, restockModalItem.quantity + Number(restockQty))}</strong>
                </p>
              </div>

              <div>
                <label className="font-bold text-ink-700 block mb-1">Restock Note / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Daily morning delivery"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  className="w-full bg-oatmeal-50 border border-oatmeal-200 rounded-xl p-2.5"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-sage-600 hover:bg-sage-700 text-white font-bold rounded-2xl text-xs shadow-paper"
              >
                Confirm Restock Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 8: PRINT INVOICE RECEIPT                                        */}
      {/* ===================================================================== */}
      {selectedBillForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs animate-in zoom-in-95">
          <div className="bg-white w-full max-w-md rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedBillForPrint(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Printable Area */}
            <div id="printable-bill" className="p-4 bg-oatmeal-50 border border-oatmeal-200 rounded-2xl text-xs text-ink-900 font-mono space-y-3">
              <div className="text-center border-b border-dashed border-oatmeal-300 pb-3">
                <h4 className="font-black text-sm uppercase">{selectedBillForPrint.canteen_name || currentCanteenObj.name}</h4>
                <p className="text-[10px] text-ink-500">Official Campus Dining Tax Receipt</p>
                <p className="text-[10px] text-ink-400 mt-1">Invoice #{selectedBillForPrint.bill_number}</p>
                <p className="text-[10px] text-ink-400">Order #{selectedBillForPrint.order_number}</p>
              </div>

              <div className="text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-bold">{selectedBillForPrint.user_name || 'Campus Member'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date(selectedBillForPrint.generated_at || Date.now()).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span className="font-bold text-sage-800">{selectedBillForPrint.payment_status}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-oatmeal-300 py-2 space-y-1">
                {selectedBillForPrint.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.quantity}x {it.item_name || it.menu_item_name}</span>
                    <span>₹{Number(it.total_price || it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-ink-600">
                  <span>Subtotal:</span>
                  <span>₹{Number(selectedBillForPrint.subtotal).toFixed(2)}</span>
                </div>
                {selectedBillForPrint.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-₹{Number(selectedBillForPrint.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                {selectedBillForPrint.service_fee > 0 && (
                  <div className="flex justify-between text-ink-600">
                    <span>Convenience Fee:</span>
                    <span>₹{Number(selectedBillForPrint.service_fee).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-2 border-t border-oatmeal-300 text-ink-900">
                  <span>GRAND TOTAL:</span>
                  <span>₹{Number(selectedBillForPrint.total).toFixed(2)}</span>
                </div>
              </div>

              <p className="text-[10px] text-center text-ink-400 pt-2 border-t border-dashed border-oatmeal-300">
                Thank you for dining with campus click & collect!
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-sage-600 hover:bg-sage-700 text-white rounded-2xl text-xs font-bold shadow-paper flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setSelectedBillForPrint(null)}
                className="px-4 py-2.5 bg-oatmeal-100 hover:bg-oatmeal-200 text-ink-700 rounded-2xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Order Ticket Card for Kitchen Kanban Board
function OrderTicketCard({ order, onAccept, onReject, onPrepare, onReady, onVerifyPickup, onAdjustPrep }) {
  const isNew = order.status === 'PLACED' || order.status === 'PAYMENT_PENDING' || order.status === 'PAYMENT_CONFIRMED';
  const isAccepted = order.status === 'ACCEPTED';
  const isPreparing = order.status === 'PREPARING';
  const isReady = order.status === 'READY';

  // Live timer tick
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!order.estimated_ready_at || (!isAccepted && !isPreparing)) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [order.estimated_ready_at, isAccepted, isPreparing]);

  let timerDisplay = null;
  if (order.estimated_ready_at && (isAccepted || isPreparing)) {
    const readyTime = new Date(order.estimated_ready_at).getTime();
    const diffSec = Math.floor((readyTime - now) / 1000);
    if (diffSec > 0) {
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      timerDisplay = {
        delayed: false,
        text: `${mins}:${secs < 10 ? '0' : ''}${secs}`
      };
    } else {
      const delaySec = Math.abs(diffSec);
      const mins = Math.floor(delaySec / 60);
      const secs = delaySec % 60;
      timerDisplay = {
        delayed: true,
        text: `+${mins}:${secs < 10 ? '0' : ''}${secs}`
      };
    }
  }

  return (
    <div className="bg-white border border-oatmeal-200 rounded-2xl p-4 shadow-paper hover:shadow-paper-elevated transition-all flex flex-col justify-between gap-3">
      <div>
        {/* Card Header: Order # + Status / Passcode */}
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <div>
            <span className="font-mono font-black text-sm text-ink-900 block">#{order.order_number}</span>
            <span className="text-[11px] text-ink-600 font-semibold">{order.user_name || 'Customer'}</span>
          </div>
          <div className="text-right">
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                isReady
                  ? 'bg-terracotta-500 text-white border-terracotta-600 animate-pulse'
                  : isPreparing
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : isAccepted
                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                  : 'bg-oatmeal-100 text-ink-700 border-oatmeal-300'
              }`}
            >
              {order.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Order Details: Prep Time & Total Amount */}
        <div className="flex items-center justify-between text-xs py-1.5 border-t border-b border-oatmeal-100 my-2">
          <div className="flex items-center gap-1 text-ink-600">
            <Clock className="w-3.5 h-3.5 text-sage-700" />
            <span>Prep: <strong>{order.estimated_preparation_minutes || 15}m</strong></span>
          </div>
          <span className="font-bold text-ink-900">₹{Number(order.total_amount || order.total_price).toFixed(2)}</span>
        </div>

        {/* Live Kitchen Countdown Timer */}
        {timerDisplay && (
          <div className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center justify-between my-2 border ${
            timerDisplay.delayed 
              ? 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse' 
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}>
            <span className="text-[10px] uppercase font-sans font-black">
              {timerDisplay.delayed ? '⚠️ Delayed By:' : '⏱️ Cooking Time:'}
            </span>
            <span>{timerDisplay.text}</span>
          </div>
        )}

        {/* Item Breakdown */}
        <div className="space-y-1 text-xs mb-1">
          {order.items?.map((it) => (
            <div key={it.id} className="flex justify-between text-ink-800">
              <span>{it.quantity}x {it.item_name || it.menu_item_name}</span>
              <span className="font-mono text-ink-500">₹{Number(it.total_price || it.price * it.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons Based On Step */}
      <div className="space-y-1.5 pt-2 border-t border-oatmeal-100">
        {/* NEW: Accept or Reject */}
        {isNew && (
          <div className="flex gap-1.5">
            <button
              onClick={onAccept}
              className="flex-1 py-2 bg-sage-600 hover:bg-sage-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" /> Accept
            </button>
            <button
              onClick={onReject}
              className="px-2.5 py-2 bg-oatmeal-100 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-oatmeal-200"
            >
              Reject
            </button>
          </div>
        )}

        {/* ACCEPTED: Start Prep */}
        {isAccepted && (
          <button
            onClick={onPrepare}
            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs"
          >
            <ChefHat className="w-3.5 h-3.5" /> Start Cooking
          </button>
        )}

        {/* PREPARING: Mark Ready */}
        {isPreparing && (
          <button
            onClick={onReady}
            className="w-full py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Ready
          </button>
        )}

        {/* READY: Enter Passcode */}
        {isReady && (
          <button
            onClick={onVerifyPickup}
            className="w-full py-2.5 bg-sage-600 hover:bg-sage-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-paper"
          >
            <KeyRound className="w-3.5 h-3.5" /> Verify Pickup Code
          </button>
        )}

        {/* Prep Time Adjust Trigger */}
        {(isAccepted || isPreparing) && onAdjustPrep && (
          <button
            onClick={onAdjustPrep}
            className="w-full py-1 text-[10px] text-ink-500 hover:text-ink-900 font-semibold flex items-center justify-center gap-1"
          >
            <Clock className="w-3 h-3 text-ink-400" />
            <span>Adjust Prep Time</span>
          </button>
        )}
      </div>
    </div>
  );
}
