import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  ShoppingCart, MessageSquare, Headphones, Package,
  TrendingUp, Clock, CheckCircle, AlertCircle,
  Home, Info, Settings, Phone, AlignJustify, ChevronRight, RefreshCw
} from 'lucide-react';

type Tab = string;

interface Props {
  token: string;
  onNavigate: (t: Tab) => void;
  isAdmin: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6', processing: '#f59e0b', quoted: '#8b5cf6',
  won: '#22c55e', lost: '#ef4444', contacted: '#06b6d4',
  open: '#f59e0b', answered: '#22c55e', closed: '#6b7280',
  normal: '#6b7280', high: '#ef4444',
};
const STATUS_LABELS: Record<string, string> = {
  new: 'Yeni', processing: 'İcrada', quoted: 'Təklif', won: 'Qazanıldı',
  lost: 'İtirildi', contacted: 'Əlaqə', open: 'Açıq', answered: 'Cavablandı',
  closed: 'Bağlı', normal: 'Normal', high: 'Yüksək', website: 'Sayt', admin: 'Admin',
};

const CHART_COLORS = ['#e30613', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

function KpiCard({ label, value, sub, color, icon: Icon, onClick }: any) {
  return (
    <div className="col-6 col-xl-3">
      <div
        className="card border-0 shadow-sm h-100"
        style={{ borderRadius: 16, cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s' }}
        onClick={onClick}
        onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)')}
        onMouseLeave={e => onClick && ((e.currentTarget as HTMLElement).style.transform = '')}
      >
        <div className="card-body p-4">
          <div className="d-flex align-items-start justify-content-between mb-3">
            <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} color={color} />
            </div>
            {onClick && <ChevronRight size={14} color="#adb5bd" />}
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#111', lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 12, color: '#6c757d', marginTop: 6, fontWeight: 600 }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: '#adb5bd', marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children, height = 220 }: any) {
  return (
    <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
      <div className="card-body p-4">
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>{title}</div>
        <div style={{ height }}>{children}</div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      {label && <div style={{ fontWeight: 700, marginBottom: 4, color: '#333' }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || '#333' }}>{p.name}: <b>{p.value}</b></div>
      ))}
    </div>
  );
};

export default function DashboardTab({ token, onNavigate, isAdmin }: Props) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const h = { Authorization: `Bearer ${token}` };

  const load = () => {
    setLoading(true);
    fetch('/api/stats', { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const contentSections = [
    { label: 'Ana Səhifə', desc: 'Hero, Metrics, CTA', tab: 'content-home', Icon: Home },
    { label: 'Haqqımızda', desc: 'Vision, Team, Values', tab: 'content-about', Icon: Info },
    { label: 'Xidmətlər', desc: 'Showcase, Kateqoriyalar', tab: 'content-services', Icon: Settings },
    { label: 'Əlaqə', desc: 'Form, CTA, Map', tab: 'content-contact', Icon: Phone },
    { label: 'Footer', desc: 'Nav, Copyright, Links', tab: 'content-footer', Icon: AlignJustify },
  ];

  if (loading) return (
    <div className="d-flex align-items-center justify-content-center py-5">
      <div className="spinner-border text-danger" style={{ width: 32, height: 32 }} />
    </div>
  );

  const kpi = stats?.kpi || {};

  // Merge time series for combo chart
  const allDays = new Set([
    ...(stats?.ordersOverTime || []).map((d: any) => d.day),
    ...(stats?.leadsOverTime || []).map((d: any) => d.day),
  ]);
  const timeData = Array.from(allDays).sort().map(day => ({
    day: typeof day === 'string' ? day.slice(5) : String(day), // MM-DD
    Sifarişlər: (stats?.ordersOverTime || []).find((d: any) => d.day === day)?.count || 0,
    Sorğular:   (stats?.leadsOverTime || []).find((d: any) => d.day === day)?.count || 0,
  }));

  const orderStatusData = (stats?.ordersByStatus || []).map((d: any) => ({
    name: STATUS_LABELS[d.status] || d.status, value: d.count, status: d.status
  }));
  const leadStatusData = (stats?.leadsByStatus || []).map((d: any) => ({
    name: STATUS_LABELS[d.status] || d.status, value: d.count
  }));
  const topProducts = (stats?.topProducts || []).slice(0, 6);
  const catData = (stats?.productsByCategory || []).slice(0, 6);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-0 fw-bold">Dashboard</h5>
          <div style={{ fontSize: 12, color: '#adb5bd', marginTop: 2 }}>Sistem statistikası və analitika</div>
        </div>
        <button onClick={load} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2" style={{ borderRadius: 10 }}>
          <RefreshCw size={13} /> Yenilə
        </button>
      </div>

      {/* KPI Row */}
      <div className="row g-3 mb-4">
        <KpiCard label="Ümumi Sifariş" value={kpi.totalOrders ?? 0} sub={`${kpi.newOrders ?? 0} yeni`} color="#e30613" icon={ShoppingCart} onClick={() => onNavigate('orders')} />
        <KpiCard label="Ümumi Sorğu" value={kpi.totalLeads ?? 0} sub={`${kpi.newLeads ?? 0} yeni`} color="#3b82f6" icon={MessageSquare} onClick={() => onNavigate('leads')} />
        <KpiCard label="Dəstək Biletləri" value={kpi.totalTickets ?? 0} sub={`${kpi.openTickets ?? 0} açıq`} color="#f59e0b" icon={Headphones} onClick={() => onNavigate('support')} />
        <KpiCard label="Aktiv Məhsullar" value={kpi.totalProducts ?? 0} color="#22c55e" icon={Package} onClick={() => onNavigate('products')} />
      </div>

      {/* Secondary KPIs */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body p-3 text-center">
              <CheckCircle size={22} color="#22c55e" className="mb-2" />
              <div style={{ fontSize: 24, fontWeight: 900 }}>{kpi.wonOrders ?? 0}</div>
              <div style={{ fontSize: 11, color: '#6c757d', fontWeight: 600 }}>Qazanılan Sifariş</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body p-3 text-center">
              <TrendingUp size={22} color="#8b5cf6" className="mb-2" />
              <div style={{ fontSize: 24, fontWeight: 900 }}>{kpi.conversionRate ?? 0}%</div>
              <div style={{ fontSize: 11, color: '#6c757d', fontWeight: 600 }}>Konversiya</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body p-3 text-center">
              <Clock size={22} color="#f59e0b" className="mb-2" />
              <div style={{ fontSize: 24, fontWeight: 900 }}>{kpi.newOrders ?? 0}</div>
              <div style={{ fontSize: 11, color: '#6c757d', fontWeight: 600 }}>Yeni Sifariş</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body p-3 text-center">
              <AlertCircle size={22} color="#ef4444" className="mb-2" />
              <div style={{ fontSize: 24, fontWeight: 900 }}>{kpi.openTickets ?? 0}</div>
              <div style={{ fontSize: 11, color: '#6c757d', fontWeight: 600 }}>Açıq Bilet</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 — Activity over time */}
      {timeData.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-12">
            <ChartCard title="Son 30 Gün — Sifariş və Sorğu Aktivliyi" height={240}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e30613" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#e30613" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#adb5bd' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#adb5bd' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Sifarişlər" stroke="#e30613" strokeWidth={2} fill="url(#gradOrders)" />
                  <Area type="monotone" dataKey="Sorğular" stroke="#3b82f6" strokeWidth={2} fill="url(#gradLeads)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Charts Row 2 — Status breakdowns */}
      <div className="row g-3 mb-4">
        {orderStatusData.length > 0 && (
          <div className="col-md-6">
            <ChartCard title="Sifarişlər Statusa Görə" height={220}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {orderStatusData.map((entry: any, i: number) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.status] || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}
        {leadStatusData.length > 0 && (
          <div className="col-md-6">
            <ChartCard title="Sorğular Statusa Görə" height={220}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadStatusData} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#adb5bd' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#adb5bd' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Sorğu" radius={[6, 6, 0, 0]}>
                    {leadStatusData.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}
      </div>

      {/* Charts Row 3 — Products */}
      <div className="row g-3 mb-4">
        {topProducts.length > 0 && (
          <div className="col-md-7">
            <ChartCard title="Ən Çox Sifariş Edilən Məhsullar" height={220}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#adb5bd' }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#555' }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Sifariş" radius={[0, 6, 6, 0]} fill="#e30613" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}
        {catData.length > 0 && (
          <div className="col-md-5">
            <ChartCard title="Məhsullar Kateqoriyaya Görə" height={220}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="count" nameKey="category">
                    {catData.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} formatter={(v: any, n: any, p: any) => [v, p.payload.category]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} formatter={(_: any, entry: any) => entry.payload.category} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}
      </div>

      {/* Content sections */}
      {isAdmin && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: 12 }}>Məzmun Bölmələri</div>
          <div className="row g-3">
            {contentSections.map((s, i) => (
              <div key={i} className="col-6 col-md-4 col-lg">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s' }}
                  onClick={() => onNavigate(s.tab)}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fff0f0'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                  <div className="card-body p-3 text-center">
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <s.Icon size={18} color="#6c757d" />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#212529', marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: '#adb5bd' }}>{s.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}