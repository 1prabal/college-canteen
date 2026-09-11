import React, { useState, useEffect } from 'react';
import { 
  Store, Utensils, Plus, Users, DollarSign, Percent, 
  TrendingUp, RotateCcw, Building, ShieldCheck, Check, 
  Save, RefreshCw, AlertTriangle, XCircle, CheckCircle2,
  ChevronLeft, ChevronRight, FileText, ArrowRight, Clock,
  Filter, Search, Ban, Eye, Landmark, HelpCircle, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel({ canteens, onRefreshCanteens }) {
  const { currentUser } = useAuth();

  // Active navigation subtab
  // 'overview' | 'financials' | 'ledger' | 'commission' | 'canteens' | 'users' | 'refunds' | 'colleges' | 'audit' | 'menu'
  const [activeTab, setActiveTab] = useState('overview');

  // Campus / College Filter
  const [colleges, setColleges] = useState([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState(''); // '' means all campuses

  // Global loading and error states
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState({ type: '', message: '' });

  // Data states
  const [overview, setOverview] = useState(null);
  const [canteenAnalytics, setCanteenAnalytics] = useState([]);
  const [ownerAnalytics, setOwnerAnalytics] = useState([]);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [revenueInterval, setRevenueInterval] = useState('daily');

  // Ledger / Transactions state
  const [ledgerData, setLedgerData] = useState({ items: [], total: 0, page: 1, page_size: 10, total_pages: 1 });
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerTxType, setLedgerTxType] = useState('');
  const [ledgerCanteenId, setLedgerCanteenId] = useState('');

  // Commission Config state
  const [commissionConfig, setCommissionConfig] = useState(null);
  const [newCommissionRate, setNewCommissionRate] = useState(0.05);
  const [commissionReason, setCommissionReason] = useState('');

  // Users Management state
  const [usersList, setUsersList] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Canteens Management state
  const [adminCanteens, setAdminCanteens] = useState([]);
  const [newCanteenName, setNewCanteenName] = useState('');
  const [newCanteenLocation, setNewCanteenLocation] = useState('');
  const [newCanteenDesc, setNewCanteenDesc] = useState('');
  const [newCanteenCollegeId, setNewCanteenCollegeId] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');

  // Refunds Management state
  const [refundsList, setRefundsList] = useState([]);
  const [refundStatusFilter, setRefundStatusFilter] = useState('');
  const [refundDecisionModal, setRefundDecisionModal] = useState(null); // { refund, action, notes }

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);

  // Colleges Management state
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeCode, setNewCollegeCode] = useState('');
  const [newCollegeLocation, setNewCollegeLocation] = useState('');

  // Menu item add state
  const [selectedMenuCanteenId, setSelectedMenuCanteenId] = useState(canteens[0]?.id || 1);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('Fast Food');
  const [itemPrepTime, setItemPrepTime] = useState(10);
  const [itemImageUrl, setItemImageUrl] = useState('');

  // Auth Header helper
  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (currentUser?.email) {
      headers['Authorization'] = `Bearer ${currentUser.email}`;
    } else {
      headers['Authorization'] = 'Bearer admin@campusbites.edu';
    }
    if (currentUser?.id) {
      headers['X-User-Id'] = String(currentUser.id);
    }
    return headers;
  };

  const showNotice = (type, message) => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice({ type: '', message: '' }), 4000);
  };

  // Initial fetch
  useEffect(() => {
    fetchColleges();
    fetchCommissionConfig();
  }, []);

  // Fetch data when activeTab or selectedCollegeId changes
  useEffect(() => {
    fetchTabData();
  }, [activeTab, selectedCollegeId, revenueInterval, ledgerPage, ledgerTxType, ledgerCanteenId, userRoleFilter, refundStatusFilter]);

  const fetchColleges = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/colleges', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setColleges(data);
        if (data.length > 0 && !newCanteenCollegeId) {
          setNewCanteenCollegeId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching colleges:', e);
    }
  };

  const fetchTabData = () => {
    if (activeTab === 'overview') fetchOverview();
    else if (activeTab === 'financials') {
      fetchCanteenAnalytics();
      fetchOwnerAnalytics();
      fetchRevenueAnalytics();
    } else if (activeTab === 'ledger') fetchTransactions();
    else if (activeTab === 'commission') fetchCommissionConfig();
    else if (activeTab === 'canteens') fetchAdminCanteens();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'refunds') fetchRefunds();
    else if (activeTab === 'audit') fetchAuditLogs();
    else if (activeTab === 'colleges') fetchColleges();
  };

  const fetchOverview = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:8000/api/admin/overview';
      if (selectedCollegeId) url += `?college_id=${selectedCollegeId}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (e) {
      console.error('Error fetching overview:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCanteenAnalytics = async () => {
    try {
      let url = 'http://localhost:8000/api/admin/analytics/canteens';
      if (selectedCollegeId) url += `?college_id=${selectedCollegeId}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCanteenAnalytics(data);
      }
    } catch (e) {
      console.error('Error fetching canteen analytics:', e);
    }
  };

  const fetchOwnerAnalytics = async () => {
    try {
      let url = 'http://localhost:8000/api/admin/analytics/owners';
      if (selectedCollegeId) url += `?college_id=${selectedCollegeId}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOwnerAnalytics(data);
      }
    } catch (e) {
      console.error('Error fetching owner analytics:', e);
    }
  };

  const fetchRevenueAnalytics = async () => {
    try {
      let url = `http://localhost:8000/api/admin/analytics/revenue?interval=${revenueInterval}`;
      if (selectedCollegeId) url += `&college_id=${selectedCollegeId}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRevenueAnalytics(data);
      }
    } catch (e) {
      console.error('Error fetching revenue analytics:', e);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:8000/api/admin/transactions?page=${ledgerPage}&page_size=10`;
      if (selectedCollegeId) url += `&college_id=${selectedCollegeId}`;
      if (ledgerTxType) url += `&transaction_type=${ledgerTxType}`;
      if (ledgerCanteenId) url += `&canteen_id=${ledgerCanteenId}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLedgerData(data);
      }
    } catch (e) {
      console.error('Error fetching transactions:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionConfig = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/commission', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCommissionConfig(data);
        setNewCommissionRate(parseFloat(data.current_commission_rate));
      }
    } catch (e) {
      console.error('Error fetching commission:', e);
    }
  };

  const handleUpdateCommission = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/admin/commission', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          commission_rate: newCommissionRate,
          reason: commissionReason || 'Platform fee schedule revision'
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setCommissionConfig(updated);
        setCommissionReason('');
        showNotice('success', `Platform commission updated to ${(newCommissionRate * 100).toFixed(1)}%. Historical orders preserve past snapshot rates.`);
      } else {
        const err = await res.json();
        showNotice('error', err.detail || 'Failed to update commission.');
      }
    } catch (err) {
      showNotice('error', 'Network error updating commission.');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:8000/api/admin/users';
      const params = [];
      if (userRoleFilter) params.push(`role=${userRoleFilter}`);
      if (selectedCollegeId) params.push(`college_id=${selectedCollegeId}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    const nextStatus = !user.is_active;
    const reason = window.prompt(
      `Enter reason for ${nextStatus ? 'activating' : 'suspending'} account for ${user.name}:`,
      nextStatus ? 'Administrative restoration' : 'Account under administrative review'
    );
    if (!reason) return;

    try {
      const res = await fetch(`http://localhost:8000/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: nextStatus, reason })
      });
      if (res.ok) {
        showNotice('success', `User '${user.name}' marked ${nextStatus ? 'Active' : 'Suspended'}.`);
        fetchUsers();
      } else {
        const err = await res.json();
        showNotice('error', err.detail || 'Could not update user status.');
      }
    } catch (e) {
      showNotice('error', 'Error updating user status.');
    }
  };

  const fetchAdminCanteens = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:8000/api/admin/canteens';
      if (selectedCollegeId) url += `?college_id=${selectedCollegeId}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAdminCanteens(data);
      }
    } catch (e) {
      console.error('Error fetching admin canteens:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCanteenStatus = async (canteen) => {
    const nextStatus = !canteen.is_active;
    const reason = window.prompt(
      `Enter reason for ${nextStatus ? 'activating' : 'deactivating'} outlet '${canteen.name}':`,
      nextStatus ? 'Outlet re-opened for operations' : 'Temporary maintenance and sanitation'
    );
    if (!reason) return;

    try {
      const res = await fetch(`http://localhost:8000/api/admin/canteens/${canteen.id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: nextStatus, reason })
      });
      if (res.ok) {
        showNotice('success', `Canteen '${canteen.name}' ${nextStatus ? 'Activated' : 'Deactivated'}.`);
        fetchAdminCanteens();
        onRefreshCanteens && onRefreshCanteens();
      } else {
        const err = await res.json();
        showNotice('error', err.detail || 'Could not update canteen status.');
      }
    } catch (e) {
      showNotice('error', 'Error updating canteen status.');
    }
  };

  const handleCreateCanteen = async (e) => {
    e.preventDefault();
    if (!newCanteenName || !newCanteenLocation) return;

    try {
      const res = await fetch('http://localhost:8000/api/canteens', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newCanteenName,
          location: newCanteenLocation,
          description: newCanteenDesc || 'Campus dining venue',
          college_id: newCanteenCollegeId ? Number(newCanteenCollegeId) : 1,
          owner_id: selectedOwnerId ? Number(selectedOwnerId) : null,
          is_open: true,
          is_active: true
        }),
      });

      if (!res.ok) throw new Error('Failed to create canteen');
      setNewCanteenName('');
      setNewCanteenLocation('');
      setNewCanteenDesc('');
      onRefreshCanteens && onRefreshCanteens();
      fetchAdminCanteens();
      showNotice('success', 'Dining outlet created successfully!');
    } catch (err) {
      showNotice('error', 'Error creating canteen outlet.');
    }
  };

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:8000/api/admin/refunds';
      const params = [];
      if (refundStatusFilter) params.push(`status=${refundStatusFilter}`);
      if (selectedCollegeId) params.push(`college_id=${selectedCollegeId}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRefundsList(data);
      }
    } catch (e) {
      console.error('Error fetching refunds:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (refundId, action, notes) => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/refunds/${refundId}/process`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action, notes })
      });
      if (res.ok) {
        showNotice('success', `Refund #${refundId} successfully ${action === 'APPROVE' ? 'Approved & Credited' : 'Rejected'}.`);
        setRefundDecisionModal(null);
        fetchRefunds();
      } else {
        const err = await res.json();
        showNotice('error', err.detail || 'Failed to process refund.');
      }
    } catch (e) {
      showNotice('error', 'Error processing refund decision.');
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/admin/audit-logs?limit=100', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollege = async (e) => {
    e.preventDefault();
    if (!newCollegeName || !newCollegeCode || !newCollegeLocation) return;

    try {
      const res = await fetch('http://localhost:8000/api/admin/colleges', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newCollegeName,
          code: newCollegeCode.toUpperCase(),
          location: newCollegeLocation
        })
      });

      if (res.ok) {
        setNewCollegeName('');
        setNewCollegeCode('');
        setNewCollegeLocation('');
        fetchColleges();
        showNotice('success', 'New university campus added successfully!');
      } else {
        const err = await res.json();
        showNotice('error', err.detail || 'Could not register college.');
      }
    } catch (e) {
      showNotice('error', 'Error creating college campus.');
    }
  };

  const handleCreateMenuItem = async (e) => {
    e.preventDefault();
    if (!itemName || !itemPrice) return;

    try {
      const res = await fetch('http://localhost:8000/api/menu-items', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          canteen_id: selectedMenuCanteenId,
          name: itemName,
          price: parseFloat(itemPrice),
          category: itemCategory,
          preparation_time_minutes: Number(itemPrepTime),
          image_url: itemImageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
          is_available: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to add dish');
      setItemName('');
      setItemPrice('');
      setItemImageUrl('');
      showNotice('success', 'Dish added to menu catalog successfully!');
    } catch (err) {
      showNotice('error', 'Error adding menu item.');
    }
  };

  // Filtered users for search
  const displayedUsers = usersList.filter(u => {
    if (!userSearchTerm) return true;
    const term = userSearchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.college_id?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12 space-y-6">
      {/* Platform Header Banner */}
      <div className="bg-ink-900 text-white border border-ink-800 p-6 sm:p-7 rounded-3xl shadow-paper-floating flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-ink-800 text-terracotta-400 text-xs font-bold border border-ink-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Platform Administrator Console</span>
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-ink-800 text-sage-400 font-mono border border-ink-700">
              Active Admin: {currentUser?.name || 'Administrator'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Enterprise Operations & Financial Governance</h1>
          <p className="text-xs text-ink-400 mt-1">Multi-campus dining reconciliation, immutable ledger records, and campus-wide user oversight</p>
        </div>

        {/* Global College Selector & Refresh */}
        <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
          <div className="flex items-center gap-1.5 bg-ink-800 border border-ink-700 rounded-2xl px-3 py-1.5 text-xs text-ink-200">
            <Landmark className="w-3.5 h-3.5 text-terracotta-400" />
            <select
              value={selectedCollegeId}
              onChange={(e) => { setSelectedCollegeId(e.target.value); setLedgerPage(1); }}
              className="bg-transparent text-white font-bold outline-none cursor-pointer pr-1"
            >
              <option value="" className="bg-ink-900 text-white">All Campuses</option>
              {colleges.map((col) => (
                <option key={col.id} value={col.id} className="bg-ink-900 text-white">
                  {col.name} ({col.code})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => { fetchColleges(); fetchTabData(); }}
            className="px-3.5 py-2 rounded-2xl bg-ink-800 hover:bg-ink-700 text-ink-300 hover:text-white border border-ink-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Refresh current view"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice.message && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 border transition-all animate-in fade-in ${
          actionNotice.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-sage-50 text-sage-800 border-sage-200'
        }`}>
          {actionNotice.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
          )}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { key: 'overview', label: 'Platform Overview', icon: TrendingUp },
          { key: 'financials', label: 'Revenue & Financials', icon: DollarSign },
          { key: 'ledger', label: 'Audit Ledger', icon: FileText },
          { key: 'commission', label: 'Commission Config', icon: Percent },
          { key: 'canteens', label: 'Dining Outlets', icon: Store },
          { key: 'users', label: 'Campus Users', icon: Users },
          { key: 'refunds', label: 'Refund Requests', icon: RotateCcw, count: overview?.pending_refunds },
          { key: 'colleges', label: 'Campuses', icon: Landmark },
          { key: 'audit', label: 'System Audit Logs', icon: Activity },
          { key: 'menu', label: 'Dish Catalog', icon: Utensils },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-terracotta-500 text-white shadow-paper'
                  : 'bg-white border border-oatmeal-300 text-ink-700 hover:bg-oatmeal-100 hover:text-ink-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white text-terracotta-600' : 'bg-terracotta-500 text-white'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: PLATFORM OVERVIEW                                            */}
      {/* ==================================================================== */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Top-Level KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 shadow-paper flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-ink-400 block mb-1">Gross Campus Sales</span>
                <div className="text-2xl font-black text-ink-900 font-mono">
                  ₹{Number(overview.gross_sales).toFixed(2)}
                </div>
              </div>
              <div className="text-[11px] text-ink-500 mt-2 pt-2 border-t border-oatmeal-100 flex items-center justify-between">
                <span>Today: ₹{Number(overview.today_transaction_value).toFixed(2)}</span>
                <span className="font-bold text-ink-700">{overview.today_orders} orders</span>
              </div>
            </div>

            <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 shadow-paper flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-ink-400 block mb-1">Platform Commission</span>
                <div className="text-2xl font-black text-terracotta-600 font-mono">
                  ₹{Number(overview.total_commission_collected).toFixed(2)}
                </div>
              </div>
              <div className="text-[11px] text-ink-500 mt-2 pt-2 border-t border-oatmeal-100 flex items-center justify-between">
                <span>Rate: {(Number(overview.commission_rate) * 100).toFixed(1)}%</span>
                <span className="text-sage-700 font-bold">Net: ₹{Number(overview.platform_earnings).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 shadow-paper flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-ink-400 block mb-1">Vendor Net Payout</span>
                <div className="text-2xl font-black text-sage-700 font-mono">
                  ₹{Number(overview.total_canteen_net_payout).toFixed(2)}
                </div>
              </div>
              <div className="text-[11px] text-ink-500 mt-2 pt-2 border-t border-oatmeal-100 flex items-center justify-between">
                <span>Total Orders:</span>
                <span className="font-bold text-ink-700">{overview.total_orders}</span>
              </div>
            </div>

            <div className="bg-white border border-oatmeal-300 rounded-3xl p-5 shadow-paper flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-ink-400 block mb-1">Campus Community</span>
                <div className="text-2xl font-black text-ink-900">
                  {overview.total_users} Users
                </div>
              </div>
              <div className="text-[11px] text-ink-500 mt-2 pt-2 border-t border-oatmeal-100 flex items-center justify-between">
                <span>{overview.total_students} Stu / {overview.total_faculty} Fac</span>
                <span className="font-bold text-ink-700">{overview.total_canteens} Outlets</span>
              </div>
            </div>
          </div>

          {/* Secondary Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Financial Health Snapshot */}
            <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500">Financial Integrity Breakdown</h2>
                <ShieldCheck className="w-4 h-4 text-sage-600" />
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-oatmeal-100">
                  <span className="text-ink-600">Gross Processed Volume</span>
                  <span className="font-mono font-bold text-ink-900">₹{Number(overview.gross_sales).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-oatmeal-100">
                  <span className="text-ink-600">Platform Commission Split</span>
                  <span className="font-mono text-terracotta-600 font-bold">+₹{Number(overview.total_commission_collected).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-oatmeal-100">
                  <span className="text-ink-600">Payment Gateway Costs</span>
                  <span className="font-mono text-ink-500">-₹{Number(overview.total_payment_fees).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-oatmeal-100">
                  <span className="text-ink-600">Disbursed User Refunds</span>
                  <span className="font-mono text-rose-600 font-bold">-₹{Number(overview.total_refunded_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 bg-sage-50 px-3 rounded-xl">
                  <span className="font-bold text-sage-900">Platform Net Earnings</span>
                  <span className="font-mono font-black text-sage-800 text-sm">₹{Number(overview.platform_earnings).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Quick Status / Operations */}
            <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500">Platform Health & Queues</h2>
                <Activity className="w-4 h-4 text-terracotta-500" />
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-oatmeal-50 border border-oatmeal-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-terracotta-500" />
                    <span className="font-bold text-ink-800">Pending Refunds Queue</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                    overview.pending_refunds > 0 ? 'bg-terracotta-500 text-white' : 'bg-oatmeal-200 text-ink-600'
                  }`}>
                    {overview.pending_refunds}
                  </span>
                </div>

                <div className="p-3.5 bg-oatmeal-50 border border-oatmeal-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-sage-600" />
                    <span className="font-bold text-ink-800">Active Dining Outlets</span>
                  </div>
                  <span className="font-bold text-ink-900">{overview.total_canteens} Active</span>
                </div>

                <div className="p-3.5 bg-oatmeal-50 border border-oatmeal-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-ink-800">Registered Campuses</span>
                  </div>
                  <span className="font-bold text-ink-900">{overview.total_colleges || 1} Campus</span>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Shortcuts */}
            <div className="bg-ink-900 text-white border border-ink-800 rounded-3xl p-6 shadow-paper flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-terracotta-400 mb-2">Administrative Navigation</h2>
                <p className="text-xs text-ink-400 mb-4">Direct shortcuts to critical platform governance terminals</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('financials')}
                    className="w-full py-2 px-3 rounded-xl bg-ink-800 hover:bg-ink-700 text-xs font-bold flex items-center justify-between text-left transition-colors"
                  >
                    <span>Inspect Outlet Breakdown</span>
                    <ArrowRight className="w-3.5 h-3.5 text-ink-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab('ledger')}
                    className="w-full py-2 px-3 rounded-xl bg-ink-800 hover:bg-ink-700 text-xs font-bold flex items-center justify-between text-left transition-colors"
                  >
                    <span>View Immutable Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5 text-ink-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab('refunds')}
                    className="w-full py-2 px-3 rounded-xl bg-ink-800 hover:bg-ink-700 text-xs font-bold flex items-center justify-between text-left transition-colors"
                  >
                    <span>Audit Refund Requests</span>
                    <ArrowRight className="w-3.5 h-3.5 text-ink-400" />
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-ink-500 pt-3 mt-3 border-t border-ink-800">
                Logged in as Master Administrator • Full Audit Enabled
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: FINANCIALS & REVENUE                                         */}
      {/* ==================================================================== */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {/* Revenue Time-Series Section */}
          <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base font-bold text-ink-900">Revenue Time-Series Analytics</h2>
                <p className="text-xs text-ink-500">Historical trend aggregation of campus gross sales and platform fees</p>
              </div>
              <div className="inline-flex rounded-2xl bg-oatmeal-100 p-1 border border-oatmeal-200">
                {['daily', 'weekly', 'monthly'].map((intv) => (
                  <button
                    key={intv}
                    onClick={() => setRevenueInterval(intv)}
                    className={`px-3 py-1 text-xs font-bold rounded-xl capitalize transition-all ${
                      revenueInterval === intv ? 'bg-white text-ink-900 shadow-xs' : 'text-ink-500 hover:text-ink-900'
                    }`}
                  >
                    {intv}
                  </button>
                ))}
              </div>
            </div>

            {/* Time-Series Aggregation Table */}
            {revenueAnalytics && revenueAnalytics.points?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-oatmeal-200 text-ink-500 font-bold uppercase text-[10px]">
                      <th className="pb-3">Period</th>
                      <th className="pb-3 text-center">Orders</th>
                      <th className="pb-3 text-right">Gross Sales</th>
                      <th className="pb-3 text-right">Platform Fee</th>
                      <th className="pb-3 text-right">Refunds</th>
                      <th className="pb-3 text-right">Net Vendor Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-oatmeal-100">
                    {revenueAnalytics.points.map((pt, idx) => (
                      <tr key={idx} className="text-ink-800">
                        <td className="py-3 font-mono font-bold">{pt.date}</td>
                        <td className="py-3 text-center font-bold">{pt.order_count}</td>
                        <td className="py-3 text-right font-mono font-bold text-ink-900">₹{Number(pt.gross_sales).toFixed(2)}</td>
                        <td className="py-3 text-right font-mono text-terracotta-600 font-bold">+₹{Number(pt.platform_commission).toFixed(2)}</td>
                        <td className="py-3 text-right font-mono text-rose-600">-₹{Number(pt.refunds).toFixed(2)}</td>
                        <td className="py-3 text-right font-mono font-black text-sage-700">₹{Number(pt.net_canteen_earnings).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-ink-400">
                No orders recorded for this time range yet.
              </div>
            )}
          </div>

          {/* Canteen Outlet Breakdown */}
          <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
            <h2 className="text-base font-bold text-ink-900 mb-1">Outlet Financial Reconciliation</h2>
            <p className="text-xs text-ink-500 mb-6">Real-time ledger breakdown calculating gross revenue, platform commission, and net vendor payout.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-oatmeal-200 text-ink-500 font-bold uppercase text-[10px]">
                    <th className="pb-3">Canteen Outlet</th>
                    <th className="pb-3">Owner</th>
                    <th className="pb-3 text-center">Orders</th>
                    <th className="pb-3 text-right">Gross Sales</th>
                    <th className="pb-3 text-right">Platform Fee</th>
                    <th className="pb-3 text-right">Refunds</th>
                    <th className="pb-3 text-right">Net Vendor Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-oatmeal-100">
                  {canteenAnalytics.map((c) => (
                    <tr key={c.canteen_id} className="text-ink-800 hover:bg-oatmeal-50/50 transition-colors">
                      <td className="py-3.5 font-bold">
                        <div>{c.name}</div>
                        <div className="text-[10px] text-ink-400 font-normal">{c.location}</div>
                      </td>
                      <td className="py-3.5 text-ink-600">{c.owner_name || 'Unassigned'}</td>
                      <td className="py-3.5 text-center font-bold">{c.total_orders}</td>
                      <td className="py-3.5 text-right font-mono font-bold text-ink-900">
                        ₹{Number(c.gross_sales).toFixed(2)}
                      </td>
                      <td className="py-3.5 text-right font-mono text-terracotta-600">
                        -₹{Number(c.platform_commission).toFixed(2)}
                      </td>
                      <td className="py-3.5 text-right font-mono text-rose-600">
                        -₹{Number(c.refunds).toFixed(2)}
                      </td>
                      <td className="py-3.5 text-right font-mono font-black text-sage-700 text-sm">
                        ₹{Number(c.net_canteen_earnings).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Owner Earnings Breakdown */}
          <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
            <h2 className="text-base font-bold text-ink-900 mb-1">Canteen Owner Aggregate Earnings</h2>
            <p className="text-xs text-ink-500 mb-6">Multi-canteen portfolio rollup per verified business entity</p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-oatmeal-200 text-ink-500 font-bold uppercase text-[10px]">
                    <th className="pb-3">Owner Entity</th>
                    <th className="pb-3">Managed Outlets</th>
                    <th className="pb-3 text-center">Orders</th>
                    <th className="pb-3 text-right">Gross Sales</th>
                    <th className="pb-3 text-right">Platform Fee Deducted</th>
                    <th className="pb-3 text-right">Disbursed Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-oatmeal-100">
                  {ownerAnalytics.map((o) => (
                    <tr key={o.owner_id} className="text-ink-800">
                      <td className="py-3.5 font-bold">
                        <div>{o.owner_name}</div>
                        <div className="text-[10px] text-ink-400 font-normal">{o.owner_email || 'Verified Campus Vendor'}</div>
                      </td>
                      <td className="py-3.5 text-ink-600">
                        {o.canteen_names?.join(', ') || 'None'}
                      </td>
                      <td className="py-3.5 text-center font-bold">{o.total_orders}</td>
                      <td className="py-3.5 text-right font-mono font-bold text-ink-900">₹{Number(o.gross_sales).toFixed(2)}</td>
                      <td className="py-3.5 text-right font-mono text-terracotta-600">-₹{Number(o.platform_commission).toFixed(2)}</td>
                      <td className="py-3.5 text-right font-mono font-black text-sage-700 text-sm">₹{Number(o.net_earnings).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: IMMUTABLE AUDIT LEDGER                                       */}
      {/* ==================================================================== */}
      {activeTab === 'ledger' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-ink-900">Platform Financial Ledger</h2>
              <p className="text-xs text-ink-500">Immutable transaction log guaranteeing complete financial reproducibility and auditability</p>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2.5 flex-wrap text-xs">
              <select
                value={ledgerTxType}
                onChange={(e) => { setLedgerTxType(e.target.value); setLedgerPage(1); }}
                className="bg-oatmeal-100 border border-oatmeal-200 rounded-xl px-2.5 py-1.5 font-bold text-ink-700"
              >
                <option value="">All Transaction Types</option>
                <option value="CUSTOMER_PAYMENT">Customer Payments</option>
                <option value="PLATFORM_COMMISSION">Platform Commission</option>
                <option value="CANTEEN_EARNING">Canteen Earning</option>
                <option value="REFUND">Refund</option>
                <option value="WALLET_CREDIT">Wallet Credit</option>
                <option value="WALLET_DEBIT">Wallet Debit</option>
              </select>

              <select
                value={ledgerCanteenId}
                onChange={(e) => { setLedgerCanteenId(e.target.value); setLedgerPage(1); }}
                className="bg-oatmeal-100 border border-oatmeal-200 rounded-xl px-2.5 py-1.5 font-bold text-ink-700"
              >
                <option value="">All Canteens</option>
                {canteens.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-oatmeal-200 text-ink-500 font-bold uppercase text-[10px]">
                  <th className="pb-3">Reference / Idempotency</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Campus Outlet</th>
                  <th className="pb-3">Customer / Party</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oatmeal-100">
                {ledgerData.items.map((entry) => (
                  <tr key={entry.id} className="text-ink-800 hover:bg-oatmeal-50/50">
                    <td className="py-3 font-mono">
                      <div className="font-bold text-ink-900">{entry.transaction_reference}</div>
                      <div className="text-[10px] text-ink-400">{entry.idempotency_key || 'No idempotency key'}</div>
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        entry.transaction_type === 'CUSTOMER_PAYMENT' ? 'bg-emerald-100 text-emerald-800' :
                        entry.transaction_type === 'PLATFORM_COMMISSION' ? 'bg-terracotta-100 text-terracotta-800' :
                        entry.transaction_type === 'CANTEEN_EARNING' ? 'bg-sage-100 text-sage-800' :
                        entry.transaction_type === 'REFUND' ? 'bg-rose-100 text-rose-800' :
                        'bg-oatmeal-200 text-ink-700'
                      }`}>
                        {entry.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 text-ink-700 font-bold">
                      {entry.canteen_name || '-'}
                    </td>
                    <td className="py-3 text-ink-600">
                      {entry.user_name || '-'}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-ink-900">
                      ₹{Number(entry.amount).toFixed(2)}
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-[10px] font-bold text-sage-700 bg-sage-50 px-2 py-0.5 rounded-md border border-sage-200">
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-[11px] text-ink-400">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {ledgerData.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-ink-400 text-xs">
                      No financial ledger records found matching current criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-oatmeal-200 text-xs">
            <span className="text-ink-500">
              Showing page <strong>{ledgerData.page}</strong> of <strong>{ledgerData.total_pages}</strong> ({ledgerData.total} total transactions)
            </span>
            <div className="flex gap-2">
              <button
                disabled={ledgerPage <= 1}
                onClick={() => setLedgerPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-xl border border-oatmeal-300 disabled:opacity-40 hover:bg-oatmeal-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={ledgerPage >= ledgerData.total_pages}
                onClick={() => setLedgerPage(prev => prev + 1)}
                className="p-1.5 rounded-xl border border-oatmeal-300 disabled:opacity-40 hover:bg-oatmeal-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: COMMISSION RATE CONFIGURATION                                */}
      {/* ==================================================================== */}
      {activeTab === 'commission' && commissionConfig && (
        <div className="max-w-xl mx-auto bg-white border border-oatmeal-300 rounded-3xl p-6 sm:p-8 shadow-paper space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center border border-terracotta-200">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-900">Platform Commission Schedule</h2>
              <p className="text-xs text-ink-500">Configure global marketplace rate applied to verified orders</p>
            </div>
          </div>

          <form onSubmit={handleUpdateCommission} className="space-y-5 text-xs">
            <div>
              <div className="flex justify-between items-center mb-2 font-bold text-ink-800">
                <span>Proposed Commission Rate</span>
                <span className="text-2xl font-black text-terracotta-600 font-mono">
                  {(newCommissionRate * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.00"
                max="0.25"
                step="0.005"
                value={newCommissionRate}
                onChange={(e) => setNewCommissionRate(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-oatmeal-200 rounded-lg appearance-none cursor-pointer accent-terracotta-500"
              />
              <div className="flex justify-between text-[10px] text-ink-400 mt-1.5">
                <span>0% (Public Service)</span>
                <span>5% (Default Baseline)</span>
                <span>25% (Maximum Cap)</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-ink-800 block mb-1">Audit Justification / Reason</label>
              <input
                type="text"
                placeholder="e.g. Annual university platform server cost adjustment"
                value={commissionReason}
                onChange={(e) => setCommissionReason(e.target.value)}
                className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
                required
              />
            </div>

            {/* Financial Invariant Notice */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-amber-900">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <ShieldCheck className="w-4 h-4" />
                <span>Financial Snapshot Invariant</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Updating the commission schedule modifies future transactions exclusively. Historical order items, verified bills, and financial ledger rows retain their immutable snapshot values.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-2xl shadow-paper flex items-center justify-center gap-2 transition-all text-xs"
            >
              <Save className="w-4 h-4" /> Apply Verified Commission Schedule
            </button>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: DINING OUTLETS MANAGEMENT                                    */}
      {/* ==================================================================== */}
      {activeTab === 'canteens' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Onboard New Canteen */}
          <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
            <h2 className="text-sm font-bold text-ink-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-terracotta-500" /> Onboard Campus Outlet
            </h2>

            <form onSubmit={handleCreateCanteen} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-ink-700 block mb-1">Campus / University</label>
                <select
                  value={newCanteenCollegeId}
                  onChange={(e) => setNewCanteenCollegeId(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900 font-bold"
                >
                  {colleges.map(col => (
                    <option key={col.id} value={col.id}>{col.name} ({col.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-ink-700 block mb-1">Outlet Name</label>
                <input
                  type="text"
                  placeholder="e.g. Science Block Cafe"
                  value={newCanteenName}
                  onChange={(e) => setNewCanteenName(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-ink-700 block mb-1">Campus Location</label>
                <input
                  type="text"
                  placeholder="e.g. Block C, 1st Floor"
                  value={newCanteenLocation}
                  onChange={(e) => setNewCanteenLocation(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-ink-700 block mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Fresh juices, healthy breakfast sandwiches..."
                  value={newCanteenDesc}
                  onChange={(e) => setNewCanteenDesc(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-2xl shadow-paper flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Save Outlet & Register
              </button>
            </form>
          </div>

          {/* Existing Outlets List with Activation Toggle */}
          <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper space-y-4">
            <h2 className="text-sm font-bold text-ink-900">Configured Campus Outlets</h2>
            <div className="space-y-3 text-xs">
              {adminCanteens.map((c) => (
                <div key={c.id} className="p-3.5 bg-oatmeal-50 border border-oatmeal-200 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-ink-900 flex items-center gap-2">
                      <span>{c.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                        c.is_active ? 'bg-sage-100 text-sage-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {c.is_active ? 'Operational' : 'Deactivated'}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-500">{c.location} • {c.college_name || 'Campus #1'}</div>
                  </div>

                  <button
                    onClick={() => handleToggleCanteenStatus(c)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-colors ${
                      c.is_active
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-sage-50 text-sage-700 hover:bg-sage-100 border border-sage-200'
                    }`}
                  >
                    {c.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: CAMPUS USER MANAGEMENT                                       */}
      {/* ==================================================================== */}
      {activeTab === 'users' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink-900">Campus Identity & Clearances Directory</h2>
              <p className="text-xs text-ink-500">Authoritative directory of students, faculty, canteen staff, owners, and administrators</p>
            </div>

            {/* Filter and Search */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-400" />
                <input
                  type="text"
                  placeholder="Search name, ID, email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="bg-oatmeal-100 border border-oatmeal-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-ink-900"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-oatmeal-100 border border-oatmeal-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-ink-700"
              >
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="faculty">Faculty</option>
                <option value="canteen_staff">Canteen Staff</option>
                <option value="canteen_owner">Canteen Owners</option>
                <option value="platform_admin">Platform Admins</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-oatmeal-200 text-ink-500 font-bold uppercase text-[10px]">
                  <th className="pb-3">Name & Roll ID</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oatmeal-100">
                {displayedUsers.map((u) => (
                  <tr key={u.id} className="text-ink-800 hover:bg-oatmeal-50/50">
                    <td className="py-3 font-bold">
                      <div>{u.name}</div>
                      <div className="text-[10px] text-ink-400 font-normal">{u.college_id}</div>
                    </td>
                    <td className="py-3 text-ink-600 font-mono text-[11px]">{u.email || '-'}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        u.role === 'platform_admin' || u.role === 'admin' ? 'bg-ink-900 text-white' :
                        u.role === 'canteen_staff' ? 'bg-sage-100 text-sage-800' :
                        u.role === 'canteen_owner' ? 'bg-amber-100 text-amber-800' :
                        u.role === 'faculty' ? 'bg-purple-100 text-purple-800' :
                        'bg-terracotta-50 text-terracotta-700'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.is_active ? 'bg-sage-100 text-sage-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {/* Safeguard: Admin cannot deactivate themselves */}
                      {u.id !== currentUser?.id && u.email !== 'admin@campusbites.edu' ? (
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
                            u.is_active
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-sage-50 text-sage-700 hover:bg-sage-100 border border-sage-200'
                          }`}
                        >
                          {u.is_active ? 'Suspend' : 'Reactivate'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-ink-400 italic">Self (Locked)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 7: REFUND QUEUE & DECISIONS                                     */}
      {/* ==================================================================== */}
      {activeTab === 'refunds' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink-900">Platform Refund Queue</h2>
              <p className="text-xs text-ink-500">Authoritative adjudication of customer cancellation and refund claims</p>
            </div>

            <select
              value={refundStatusFilter}
              onChange={(e) => setRefundStatusFilter(e.target.value)}
              className="bg-oatmeal-100 border border-oatmeal-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-ink-700 self-start sm:self-auto"
            >
              <option value="">All Statuses</option>
              <option value="REQUESTED">Pending Decision (REQUESTED)</option>
              <option value="COMPLETED">Approved & Credited (COMPLETED)</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-oatmeal-200 text-ink-500 font-bold uppercase text-[10px]">
                  <th className="pb-3">Reference / Order</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Canteen Outlet</th>
                  <th className="pb-3">Claim Reason</th>
                  <th className="pb-3 text-right">Refund Amount</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oatmeal-100">
                {refundsList.map((rf) => (
                  <tr key={rf.id} className="text-ink-800 hover:bg-oatmeal-50/50">
                    <td className="py-3.5 font-mono">
                      <div className="font-bold text-ink-900">{rf.refund_reference}</div>
                      <div className="text-[10px] text-ink-400">Order #{rf.order_id}</div>
                    </td>
                    <td className="py-3.5 font-bold text-ink-800">{rf.user_name || `User #${rf.user_id}`}</td>
                    <td className="py-3.5 text-ink-600">{rf.canteen_name || `Canteen #${rf.canteen_id}`}</td>
                    <td className="py-3.5 text-ink-600 max-w-xs truncate">{rf.reason}</td>
                    <td className="py-3.5 text-right font-mono font-bold text-rose-600 text-sm">
                      ₹{Number(rf.amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rf.status === 'COMPLETED' ? 'bg-sage-100 text-sage-800' :
                        rf.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {rf.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      {rf.status === 'REQUESTED' || rf.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleProcessRefund(rf.id, 'APPROVE', 'Refund approved by administrator')}
                            className="px-2.5 py-1 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-bold text-[11px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const notes = window.prompt('Enter audit rejection rationale:', 'Claim ineligible based on kitchen fulfillment log');
                              if (notes) handleProcessRefund(rf.id, 'REJECT', notes);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px]"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-ink-400 italic">Decided</span>
                      )}
                    </td>
                  </tr>
                ))}
                {refundsList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-ink-400 text-xs">
                      No refund requests found in queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 8: CAMPUSES / COLLEGES DIRECTORY                                 */}
      {/* ==================================================================== */}
      {activeTab === 'colleges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add College Campus */}
          <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper">
            <h2 className="text-sm font-bold text-ink-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-terracotta-500" /> Register University Campus
            </h2>

            <form onSubmit={handleCreateCollege} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-ink-700 block mb-1">University / College Name</label>
                <input
                  type="text"
                  placeholder="e.g. KIET University"
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-ink-700 block mb-1">Campus Code</label>
                <input
                  type="text"
                  placeholder="e.g. KIET-GZB"
                  value={newCollegeCode}
                  onChange={(e) => setNewCollegeCode(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900 uppercase font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-ink-700 block mb-1">Location / City</label>
                <input
                  type="text"
                  placeholder="e.g. Ghaziabad, Delhi-NCR"
                  value={newCollegeLocation}
                  onChange={(e) => setNewCollegeLocation(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-2xl shadow-paper flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Save Campus Configuration
              </button>
            </form>
          </div>

          {/* Registered Campuses List */}
          <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper space-y-4">
            <h2 className="text-sm font-bold text-ink-900">Integrated University Campuses</h2>
            <div className="space-y-3 text-xs">
              {colleges.map((col) => (
                <div key={col.id} className="p-4 bg-oatmeal-50 border border-oatmeal-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-ink-900 text-sm flex items-center gap-2">
                      <span>{col.name}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 bg-oatmeal-200 rounded-md text-ink-600">
                        {col.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-500 mt-1">{col.location} • ID #{col.id}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage-100 text-sage-800">
                      {col.canteen_count || 0} Outlets
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 9: SYSTEM AUDIT LOGS                                            */}
      {/* ==================================================================== */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink-900">Administrative Governance Audit Trail</h2>
              <p className="text-xs text-ink-500">Chronological, tamper-evident log recording all administrative modifications</p>
            </div>
            <span className="text-xs font-mono font-bold text-ink-400">{auditLogs.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-oatmeal-200 text-ink-500 font-bold uppercase text-[10px]">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Administrator</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Target / Object</th>
                  <th className="pb-3">Context / Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oatmeal-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="text-ink-800 hover:bg-oatmeal-50/50">
                    <td className="py-3 font-mono text-[11px] text-ink-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 font-bold text-ink-900">
                      {log.admin_name}
                    </td>
                    <td className="py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-ink-100 text-ink-800 border border-ink-200 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-ink-700">{log.affected_object}</td>
                    <td className="py-3 text-ink-600 max-w-sm">{log.details || '-'}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-ink-400 text-xs">
                      No administrative audit records logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 10: DISH CATALOG MANAGEMENT                                     */}
      {/* ==================================================================== */}
      {activeTab === 'menu' && (
        <div className="bg-white border border-oatmeal-300 rounded-3xl p-6 shadow-paper max-w-lg mx-auto">
          <h2 className="text-sm font-bold text-ink-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-terracotta-500" /> Add Dish to Any Outlet Menu
          </h2>

          <form onSubmit={handleCreateMenuItem} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-ink-700 block mb-1">Target Outlet</label>
              <select
                value={selectedMenuCanteenId}
                onChange={(e) => setSelectedMenuCanteenId(Number(e.target.value))}
                className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
              >
                {canteens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-ink-700 block mb-1">Dish Name</label>
              <input
                type="text"
                placeholder="e.g. Masala Dosa or Cold Coffee"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-ink-700 block mb-1">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="85.00"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-ink-700 block mb-1">Prep Time (min)</label>
                <input
                  type="number"
                  value={itemPrepTime}
                  onChange={(e) => setItemPrepTime(e.target.value)}
                  className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-ink-700 block mb-1">Category</label>
              <select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
              >
                <option value="Fast Food">Fast Food</option>
                <option value="South Indian">South Indian</option>
                <option value="Beverages">Beverages</option>
                <option value="Meals">Meals</option>
                <option value="Snacks">Snacks</option>
                <option value="Desserts">Desserts</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-ink-700 block mb-1">Image URL (Optional)</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={itemImageUrl}
                onChange={(e) => setItemImageUrl(e.target.value)}
                className="w-full bg-oatmeal-100 border border-oatmeal-200 rounded-2xl p-2.5 text-ink-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold rounded-2xl shadow-paper"
            >
              Add Dish to Catalog
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
