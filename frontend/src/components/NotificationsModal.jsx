import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NotificationsModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser?.id) {
      fetchNotifications();
    }
  }, [isOpen, currentUser?.id]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/notifications?user_id=${currentUser?.id || 1}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/notifications/${id}/read`, {
        method: 'PATCH'
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl border border-oatmeal-300 shadow-paper-floating p-6 relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-oatmeal-100 flex items-center justify-center text-ink-500 hover:text-ink-900"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-terracotta-50 text-terracotta-600 border border-terracotta-200 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-900">Notifications</h2>
            <p className="text-xs text-ink-500">Live order status and prep updates</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-xs text-ink-400">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  n.is_read ? 'bg-white border-oatmeal-200 text-ink-600' : 'bg-cream-100 border-terracotta-200 text-ink-900 shadow-xs'
                }`}
              >
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-terracotta-500" />}
                    <span>{n.title}</span>
                  </div>
                  <p className="text-[11px] text-ink-600 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[9px] text-ink-400 block mt-1.5">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {!n.is_read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="p-1 rounded-lg hover:bg-oatmeal-200 text-ink-400 hover:text-ink-900 shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
