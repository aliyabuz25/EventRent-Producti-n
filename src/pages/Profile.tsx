import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lead } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import ProfileSidebar from '../sections/profile/ProfileSidebar';
import ProfileOverview from '../sections/profile/ProfileOverview';
import ProfileOrders from '../sections/profile/ProfileOrders';
import ProfileSettings from '../sections/profile/ProfileSettings';
import ProfileSupport from '../sections/profile/ProfileSupport';

const TOKEN_KEY = 'er_admin_token';

export interface DbUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'viewer';
  active: number;
  created_at: string;
}

type Tab = 'overview' | 'orders' | 'settings' | 'support';

export default function Profile() {
  const [user, setUser]           = useState<DbUser | null>(null);
  const [orders, setOrders]       = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving]   = useState(false);
  const [saveMsg, setSaveMsg]     = useState<'ok' | 'err' | null>(null);
  const navigate = useNavigate();

  const token = (() => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } })();
  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  /* load user from JWT */
  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetch('/api/auth/me', { headers: authHeaders })
      .then(r => r.ok ? r.json() : null)
      .then(u => {
        if (!u) { navigate('/login'); return; }
        setUser(u);
        setDisplayName(u.name);
      })
      .catch(() => navigate('/login'))
      .finally(() => setIsLoading(false));
  }, []);

  /* load user's orders */
  useEffect(() => {
    if (!token) return;
    fetch('/api/orders', { headers: authHeaders })
      .then(r => r.ok ? r.json() : [])
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]));
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res  = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ name: displayName }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        setDisplayName(updated.name);
        setSaveMsg('ok');
        setTimeout(() => setSaveMsg(null), 3000);
      } else {
        setSaveMsg('err');
      }
    } catch { setSaveMsg('err'); }
    finally { setIsSaving(false); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-8 h-8 border-4 border-premium-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const isPremium = user.role === 'admin' || user.role === 'sales';

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <ProfileSidebar
          user={user}
          isPremium={isPremium}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          ordersCount={orders.length}
          onLogout={handleLogout}
        />

        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {activeTab === 'overview' && (
                <ProfileOverview orders={orders} onViewAll={() => setActiveTab('orders')} />
              )}
              {activeTab === 'orders' && (
                <ProfileOrders orders={orders} />
              )}
              {activeTab === 'settings' && (
                <ProfileSettings
                  user={user}
                  displayName={displayName}
                  setDisplayName={setDisplayName}
                  isSaving={isSaving}
                  onSubmit={handleUpdateProfile}
                  saveMsg={saveMsg}
                  token={token}
                />
              )}
              {activeTab === 'support' && (
                <ProfileSupport />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}