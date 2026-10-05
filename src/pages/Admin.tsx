import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
  LayoutDashboard, MessageSquare, Package, Users,
  TrendingUp, Clock, FileText, ExternalLink, Home, Info, Settings, Phone, AlignJustify,
  ChevronRight, LogOut, Menu, ShoppingCart, Mail, UserCog, Eye, EyeOff, ImageIcon, Database,
  Search, X as XIcon,
} from 'lucide-react';
import { Lead } from '../types';
import { ToastProvider } from '../components/Toast';

// Lazy load heavy admin tabs — only loaded when tab is first opened
const AdminLeads = lazy(() => import('../sections/admin/LeadsTab'));
const AdminProducts = lazy(() => import('../sections/admin/ProductsTab'));
const AdminTeambuilding = lazy(() => import('../sections/admin/TeambuildingTab'));
const AdminOrders = lazy(() => import('../sections/admin/OrdersTab'));
const AdminSmtp = lazy(() => import('../sections/admin/SmtpTab'));
const AdminUsers = lazy(() => import('../sections/admin/UsersTab'));
const AdminMedia = lazy(() => import('../sections/admin/MediaTab'));
const AdminSupport = lazy(() => import('../sections/admin/SupportTab'));
const AdminContent = lazy(() => import('../components/ContentStudio'));
const DashboardTab = lazy(() => import('../sections/admin/DashboardTab'));
const AdminReels = lazy(() => import('./admin/AdminReels'));
const AdminWhatsApp = lazy(() => import('./admin/AdminWhatsApp'));
const AdminCatering = lazy(() => import('../sections/admin/CateringTab'));
const AdminSetup = lazy(() => import('../components/AdminSetup'));
const DatabaseTab = lazy(() => import('../sections/admin/DatabaseTab'));

// Bootstrap loaded lazily too — only affects admin
import('bootstrap/dist/css/bootstrap.min.css');

type Tab = 'dashboard' | 'orders' | 'leads' | 'products' | 'teambuilding' | 'support'
  | 'content-home' | 'content-about' | 'content-services'
  | 'content-contact' | 'content-footer' | 'content-catering' | 'content-portfolio'
  | 'content-cart' | 'content-product' | 'content-catalog' | 'content-notfound' | 'content-gallery'
  | 'content-eventgarden' | 'content-tv' | 'content-teambuilding-page'
  | 'smtp' | 'users' | 'media' | 'reels' | 'whatsapp' | 'catering' | 'database';

type ContentSection = 'home' | 'about' | 'services' | 'contact' | 'footer' | 'catering' | 'portfolio' | 'cart' | 'product' | 'catalog' | 'notfound' | 'gallery' | 'eventgarden' | 'tv' | 'teambuilding-page';

interface NavItemDef {
  id: Tab;
  label: string;
  Icon: React.FC<{ size?: number; className?: string; color?: string }>;
  badge?: number;
}

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  active: number;
}

const CONTENT_TABS: { id: Tab; section: ContentSection; label: string }[] = [
  { id: 'content-home',      section: 'home',      label: 'Ana Səhifə' },
  { id: 'content-about',     section: 'about',     label: 'Haqqımızda' },
  { id: 'content-services',  section: 'services',  label: 'Xidmətlər' },
  { id: 'content-contact',   section: 'contact',   label: 'Əlaqə' },
  { id: 'content-footer',    section: 'footer',    label: 'Footer' },
  { id: 'content-catering',  section: 'catering',  label: 'Ketrinq Mətn' },
  { id: 'content-portfolio', section: 'portfolio', label: 'Portfolio Mətn' },
  { id: 'content-cart',      section: 'cart',      label: 'Səbət' },
  { id: 'content-product',   section: 'product',   label: 'Məhsul Səhifəsi' },
  { id: 'content-catalog',   section: 'catalog',   label: 'Kataloq' },
  { id: 'content-notfound',  section: 'notfound',  label: '404 Səhifəsi' },
  { id: 'content-gallery',          section: 'gallery',          label: 'Qalereya' },
  { id: 'content-eventgarden',      section: 'eventgarden',      label: 'Event Garden' },
  { id: 'content-tv',               section: 'tv',               label: 'TV & Yayım' },
  { id: 'content-teambuilding-page',section: 'teambuilding-page',label: 'Timbildinq Səhifəsi' },
];

const TOKEN_KEY = 'er_admin_token';

function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
function setToken(t: string) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

/* ══════════════════════════════════════════
   Login Screen
══════════════════════════════════════════ */
function LoginScreen({ onLogin }: { onLogin: (token: string, user: AuthUser) => void }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Giriş uğursuz oldu.'); return; }
      onLogin(data.token, data.user);
    } catch { setError('Serverə qoşulma alınmadı.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>
        {/* Logo */}
        <div className="text-center mb-4">
          
          <h5 className="fw-bold mb-0" style={{ letterSpacing: '-0.04em' }}>
            <span style={{ color: '#212529' }}>event</span><span style={{ color: '#e30613' }}>rent</span>
          </h5>
          <div style={{ fontSize: 12, color: '#6c757d' }}>Admin Paneli</div>
        </div>

        <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 18 }}>
          {error && (
            <div className="alert alert-danger py-2 px-3 mb-3" style={{ borderRadius: 10, fontSize: 13 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Email</label>
              <input
                type="email" required
                className="form-control"
                style={{ borderRadius: 10 }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@eventrent.az"
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Parol</label>
              <div className="d-flex gap-2">
                <input
                  type={showPass ? 'text' : 'password'} required
                  className="form-control"
                  style={{ borderRadius: 10 }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button type="button" className="btn btn-outline-secondary d-flex align-items-center" style={{ borderRadius: 10 }} onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn btn-danger fw-semibold w-100" style={{ borderRadius: 10 }}>
              {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
              {loading ? 'Giriş edilir...' : 'Daxil ol'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main Admin
══════════════════════════════════════════ */
export default function Admin() {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [token, setTokenState]  = useState<string>(() => { try { return localStorage.getItem('er_admin_token') || ''; } catch { return ''; } });
  const [loading, setLoading]   = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [tab, setTab]           = useState<Tab>('dashboard');
  const [sideOpen, setSide]     = useState(true);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.setProperty('cursor', 'auto', 'important');
    return () => { document.body.style.cursor = ''; };
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) { setSearchOpen(false); setSearchQ(''); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }
      if (e.key === 'Escape') { setSearchOpen(false); setSearchQ(''); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  /* Auto-login from stored token + setup check */
  useEffect(() => {
    const stored = getToken();
    // First check if setup is needed
    fetch('/api/setup/status')
      .then(r => r.ok ? r.json() : { needsSetup: false })
      .then(data => {
        if (data.needsSetup) { setNeedsSetup(true); setLoading(false); return; }
        if (!stored) { setLoading(false); return; }
        return fetch('/api/auth/me', { headers: { Authorization: `Bearer ${stored}` } })
          .then(r => r.ok ? r.json() : null)
          .then(u => { if (u) { setUser(u); setTokenState(stored); } else clearToken(); });
      })
      .catch(() => { if (stored) clearToken(); })
      .finally(() => setLoading(false));
  }, []);

  /* Load leads */
  useEffect(() => {
    const stored = getToken();
    if (!stored) return;
    fetch('/api/leads', { headers: { Authorization: `Bearer ${stored}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setLeads)
      .catch(() => {});
  }, [token]);

  const handleLogin = (t: string, u: AuthUser) => {
    setToken(t); setTokenState(t); setUser(u);
  };

  const handleLogout = () => {
    clearToken(); setTokenState(''); setUser(null);
  };

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  if (loading) return (
    <ToastProvider>
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="spinner-border text-danger" style={{ width: 36, height: 36 }} />
      </div>
    </ToastProvider>
  );

  if (needsSetup) return (
    <ToastProvider>
      <Suspense fallback={<div className="d-flex align-items-center justify-content-center vh-100 bg-dark"><div className="spinner-border text-danger" /></div>}>
        <AdminSetup onComplete={(t) => {
          setToken(t); setTokenState(t); setNeedsSetup(false);
          fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } })
            .then(r => r.ok ? r.json() : null)
            .then(u => { if (u) setUser(u); });
        }} />
      </Suspense>
    </ToastProvider>
  );

  if (!user) return <ToastProvider><LoginScreen onLogin={handleLogin} /></ToastProvider>;

  const isAdmin = user.role === 'admin';
  const newLeads = leads.filter(l => l.status === 'new').length;
  const contentSection = CONTENT_TABS.find(c => c.id === tab)?.section;

  const DATA_NAV: NavItemDef[] = [
    { id: 'dashboard',        label: 'Dashboard',    Icon: LayoutDashboard },
    { id: 'orders',           label: 'Sifarişlər',   Icon: ShoppingCart },
    { id: 'leads',            label: 'Sorğular',     Icon: MessageSquare, badge: newLeads || undefined },
    { id: 'products',         label: 'Məhsullar',    Icon: Package },
    { id: 'teambuilding',     label: 'Teambuilding', Icon: Users },
    { id: 'support',          label: 'Dəstək',       Icon: MessageSquare },
    { id: 'catering'          as Tab, label: 'Ketrinq',   Icon: AlignJustify },
    { id: 'reels'             as Tab, label: 'Portfolio', Icon: ImageIcon },
    { id: 'whatsapp'          as Tab, label: 'WhatsApp',  Icon: MessageSquare },
  ];
  const SYSTEM_NAV: NavItemDef[] = [
    { id: 'media'    as Tab, label: 'Media',          Icon: ImageIcon },
    { id: 'smtp'     as Tab, label: 'SMTP',            Icon: Mail },
    { id: 'users'    as Tab, label: 'İstifadəçilər',  Icon: UserCog },
    { id: 'database' as Tab, label: 'Verilənlər Bazası', Icon: Database },
  ];
  const NAV_ITEMS = [...DATA_NAV, ...SYSTEM_NAV];



  const activeItem = NAV_ITEMS.find(n => n.id === tab);

  const ALL_SEARCHABLE = [
    { label: 'Dashboard', tab: 'dashboard' as Tab, icon: LayoutDashboard, desc: 'Statistika, son sorğular' },
    { label: 'Sifarişlər', tab: 'orders' as Tab, icon: ShoppingCart, desc: 'Müştəri sifarişlərini idarə et' },
    { label: 'Sorğular', tab: 'leads' as Tab, icon: MessageSquare, desc: 'Gələn sorğular, leads' },
    { label: 'Məhsullar', tab: 'products' as Tab, icon: Package, desc: 'Kataloq məhsulları, CRUD' },
    { label: 'Teambuilding', tab: 'teambuilding' as Tab, icon: Users, desc: 'Oyunlar, konsepsiyalar' },
    { label: 'Dəstək', tab: 'support' as Tab, icon: MessageSquare, desc: 'Support ticketlər, cavab ver' },
    { label: 'Portfolio / Reels', tab: 'reels' as Tab, icon: ImageIcon, desc: 'YouTube, Instagram, video, şəkil əlavə et' },
    { label: 'WhatsApp', tab: 'whatsapp' as Tab, icon: MessageSquare, desc: 'Baileys bağlantısı, OTP, başvurular, mesaj logları' },
    { label: 'Ana Səhifə Məzmunu', tab: 'content-home' as Tab, icon: Home, desc: 'Hero, metrics, CTA, clients, team, navbar' },
    { label: 'Haqqımızda Məzmunu', tab: 'content-about' as Tab, icon: Info, desc: 'Vision, mission, team, values, approach' },
    { label: 'Xidmətlər Məzmunu', tab: 'content-services' as Tab, icon: Settings, desc: 'Showcase, grid, kateqoriyalar' },
    { label: 'Əlaqə Məzmunu', tab: 'content-contact' as Tab, icon: Phone, desc: 'Hero, form, CTA, map' },
    { label: 'Footer Məzmunu', tab: 'content-footer' as Tab, icon: AlignJustify, desc: 'Nav linklər, copyright, WhatsApp' },
    { label: 'Media', tab: 'media' as Tab, icon: ImageIcon, desc: 'Fayl yükləmə, şəkil kitabxanası' },
    { label: 'SMTP', tab: 'smtp' as Tab, icon: Mail, desc: 'Email konfiqurasiyası, test göndər' },
    { label: 'İstifadəçilər', tab: 'users' as Tab, icon: UserCog, desc: 'Hesab idarəetmə, rol, aktiv/deaktiv' },
  ];

  const searchResults = searchQ.trim().length > 0
    ? ALL_SEARCHABLE.filter(item =>
        [item.label, item.desc].join(' ').toLowerCase().includes(searchQ.toLowerCase())
      )
    : [];

  return (
    <ToastProvider>
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, system-ui, sans-serif', background: '#f4f5f7', cursor: 'auto' }}>

      {/* SIDEBAR */}
      <aside style={{
        width: sideOpen ? 224 : 60,
        minWidth: sideOpen ? 224 : 60,
        background: '#fff',
        borderRight: '1px solid #e9ecef',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.22s ease, min-width 0.22s ease',
        overflow: 'hidden',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '16px 14px', borderBottom: '1px solid #f1f3f5', display: 'flex', alignItems: 'center', gap: 10, minHeight: 60 }}>
          {sideOpen && <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.04em', whiteSpace: 'nowrap', overflow: 'hidden', lineHeight: 1 }}>
              <span style={{ color: '#212529' }}>event</span><span style={{ color: '#e30613' }}>rent</span>
            </div>}
          {!sideOpen && <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.04em', lineHeight: 1 }}>
              <span style={{ color: '#e30613' }}>e</span>
            </div>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
          {sideOpen && <SectionLabel>Əsas</SectionLabel>}
          {DATA_NAV.map(item => <NavBtn key={item.id} item={item} active={tab === item.id} open={sideOpen} onClick={() => setTab(item.id)} />)}

          <>
              {sideOpen && <SectionLabel>Məzmun</SectionLabel>}
              {!sideOpen && <div style={{ height: 6 }} />}
              {CONTENT_TABS.map(ct => (
                <NavBtn key={ct.id} item={{ id: ct.id, label: ct.label, Icon: FileText }} active={tab === ct.id} open={sideOpen} onClick={() => setTab(ct.id)} />
              ))}

              {sideOpen && <SectionLabel>Sistem</SectionLabel>}
              {!sideOpen && <div style={{ height: 6 }} />}
              {SYSTEM_NAV.map(item => <NavBtn key={item.id} item={item} active={tab === item.id} open={sideOpen} onClick={() => setTab(item.id)} />)}
            </>
        </nav>

        {/* User */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid #f1f3f5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff0f0', border: '1px solid #ffd6d6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#e30613', fontWeight: 900, fontSize: 12 }}>{(user.name || user.email || '?')[0].toUpperCase()}</span>
          </div>
          {sideOpen && (
            <>
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#212529', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: 10, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user.role}</div>
              </div>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#adb5bd', display: 'flex' }} title="Çıxış">
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ height: 54, background: '#fff', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0 }}>
          <button onClick={() => setSide(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 8, color: '#6c757d', display: 'flex' }}>
            <Menu size={18} />
          </button>
          <div style={{ width: 1, height: 18, background: '#e9ecef' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {activeItem && <activeItem.Icon size={14} color="#6c757d" />}
            <span style={{ fontWeight: 600, fontSize: 14, color: '#212529' }}>{activeItem?.label}</span>
          </div>
          <div style={{ flex: 1 }} />

          {/* Global Search */}
          <div ref={searchRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f4f5f7', border: '1px solid #e9ecef', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: '#6c757d', fontWeight: 500, minWidth: 180 }}
            >
              <Search size={13} />
              <span>Axtar...</span>
              <span style={{ marginLeft: 'auto', background: '#e9ecef', borderRadius: 5, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>⌘K</span>
            </button>

            {searchOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 340, background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e9ecef', zIndex: 999, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #f1f3f5' }}>
                  <Search size={14} color="#adb5bd" />
                  <input
                    ref={searchInputRef}
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    placeholder="Tab, bölmə, funksiya axtar..."
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#212529', background: 'transparent' }}
                    autoFocus
                  />
                  {searchQ && <button onClick={() => setSearchQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#adb5bd', display: 'flex' }}><XIcon size={14} /></button>}
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {searchQ.trim() === '' ? (
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.2em', padding: '10px 14px 6px' }}>Bütün bölmələr</div>
                      {ALL_SEARCHABLE.filter(i => isAdmin || !['content-home','content-about','content-services','content-contact','content-footer','media','smtp','users'].includes(i.tab)).map(item => (
                        <button key={item.tab} onClick={() => { setTab(item.tab); setSearchOpen(false); setSearchQ(''); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8f9fa'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <item.icon size={14} color="#6c757d" />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#212529' }}>{item.label}</div>
                            <div style={{ fontSize: 11, color: '#adb5bd' }}>{item.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding: '24px 14px', textAlign: 'center', color: '#adb5bd', fontSize: 13 }}>
                      <Search size={28} style={{ marginBottom: 8, opacity: 0.3 }} /><br/>Nəticə tapılmadı
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.2em', padding: '10px 14px 6px' }}>{searchResults.length} nəticə</div>
                      {searchResults.map(item => (
                        <button key={item.tab} onClick={() => { setTab(item.tab); setSearchOpen(false); setSearchQ(''); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8f9fa'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <item.icon size={14} color="#e30613" />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#212529' }}>{item.label}</div>
                            <div style={{ fontSize: 11, color: '#adb5bd' }}>{item.desc}</div>
                          </div>
                          <ChevronRight size={12} color="#dee2e6" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ fontSize: 11, borderRadius: 8, fontWeight: 600 }}>
            <ExternalLink size={12} /> Sayt
          </a>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#999', fontSize: 14 }}>Yüklənir...</div>}>
            {tab === 'dashboard'        && <DashboardTab token={token} onNavigate={(t) => setTab(t as Tab)} isAdmin={isAdmin} />}
            {tab === 'orders'           && <AdminOrders token={token} />}
            {tab === 'leads'            && <AdminLeads leads={leads} products={[]} token={token} onReload={() => fetch('/api/leads', { headers: authHeaders }).then(r => r.json()).then(setLeads).catch(() => {})} />}
            {tab === 'products'         && <AdminProducts token={token} />}
            {tab === 'teambuilding'     && <AdminTeambuilding token={token} />}
            {tab === 'support'          && <AdminSupport token={token} />}
            {tab === 'catering'         && <AdminCatering token={token} />}
            {tab === 'reels'            && <AdminReels />}
            {tab === 'whatsapp'         && <AdminWhatsApp />}
            {tab === 'media'    && isAdmin && <AdminMedia token={token} />}
            {tab === 'smtp'     && isAdmin && <AdminSmtp token={token} />}
            {tab === 'database' && isAdmin && <DatabaseTab token={token} />}
            {tab === 'users'   && isAdmin && <AdminUsers token={token} currentUserId={user.id} />}
            {contentSection   && !!token  && <AdminContent section={contentSection} />}
          </Suspense>
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}

/* ── helpers ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 9, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.3em', padding: '10px 8px 4px' }}>{children}</div>;
}

function NavBtn({ item, active, open, onClick }: { item: NavItemDef; active: boolean; open: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title={!open ? item.label : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 9,
        padding: open ? '7px 10px' : '7px', borderRadius: 9, border: 'none',
        background: active ? '#fff0f0' : hover ? '#f8f9fa' : 'transparent',
        color: active ? '#e30613' : '#495057',
        fontWeight: active ? 700 : 500, fontSize: 13,
        cursor: 'pointer', transition: 'all 0.12s', marginBottom: 1,
        justifyContent: open ? 'flex-start' : 'center',
        whiteSpace: 'nowrap', overflow: 'hidden',
      }}
    >
      <item.Icon size={15} />
      {open && <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>{item.label}</span>}
      {open && item.badge ? <span style={{ background: '#e30613', color: '#fff', fontSize: 9, borderRadius: 20, padding: '1px 6px', fontWeight: 700 }}>{item.badge}</span> : null}
    </button>
  );
}

/* ── placeholder to maintain closing brace balance ── */
function _unused() {
  return null;
}