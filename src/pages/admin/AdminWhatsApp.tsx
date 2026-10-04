import React, { useEffect, useState, useRef } from 'react';
import { QrCode, Wifi, WifiOff, RefreshCw, Send, Trash2, MessageCircle, Clock, Phone, CheckCircle2, XCircle, Users } from 'lucide-react';
import QRCode from 'qrcode';

const TOKEN_KEY = 'er_admin_token';
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` });

type WaStatus = 'disconnected' | 'qr' | 'connecting' | 'connected';

type Log = {
  id: number;
  phone: string;
  message: string;
  direction: 'out' | 'in';
  created_at: string;
};

type Application = {
  id: string;
  order_no: string;
  name: string;
  phone: string;
  company: string;
  game_id: string;
  game_name: string;
  extra: { location?: string; participants?: string; date?: string; concept_name?: string };
  status: 'new' | 'in_progress' | 'done' | 'cancelled';
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  done: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};
const STATUS_LABELS: Record<string, string> = {
  new: 'Yeni',
  in_progress: 'İşlənir',
  done: 'Tamamlandı',
  cancelled: 'Ləğv edildi',
};

function QRCanvas({ qrString }: { qrString: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current && qrString) {
      QRCode.toCanvas(canvasRef.current, qrString, {
        width: 240,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      }).catch(() => {});
    }
  }, [qrString]);
  return <canvas ref={canvasRef} className="rounded-2xl shadow-2xl" />;
}

export default function AdminWhatsApp() {
  const [tab, setTab] = useState<'connection' | 'logs' | 'applications' | 'send'>('connection');
  const [status, setStatus] = useState<WaStatus>('disconnected');
  const [qr, setQr] = useState<string | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [sendPhone, setSendPhone] = useState('');
  const [sendMsg, setSendMsg] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [ownerPhone, setOwnerPhone] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/wa/status', { headers: auth() });
      const data = await res.json();
      setStatus(data.status);
      setQr(data.qr || null);
    } catch {}
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/wa/logs', { headers: auth() });
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch {}
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/tb/applications', { headers: auth() });
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    fetchApplications();
    // Poll status every 3s when QR waiting
    pollRef.current = setInterval(() => {
      fetchStatus();
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (tab === 'logs') fetchLogs();
    if (tab === 'applications') fetchApplications();
  }, [tab]);

  const handleReconnect = async () => {
    setStatus('connecting');
    setQr(null);
    await fetch('/api/wa/reconnect', { method: 'POST', headers: auth() });
    setTimeout(fetchStatus, 2000);
  };

  const handleDisconnect = async () => {
    await fetch('/api/wa/disconnect', { method: 'POST', headers: auth() });
    setStatus('disconnected');
    setQr(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendLoading(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/wa/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify({ phone: sendPhone, message: sendMsg }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendResult('✓ Mesaj göndərildi');
        setSendMsg('');
        fetchLogs();
      } else {
        setSendResult('✗ ' + (data.error || 'Xəta'));
      }
    } catch {
      setSendResult('✗ Serverə qoşulma alınmadı');
    } finally {
      setSendLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Bütün logları silmək istəyirsiniz?')) return;
    await fetch('/api/wa/logs', { method: 'DELETE', headers: auth() });
    setLogs([]);
  };

  const handleAppStatus = async (id: string, status: string) => {
    await fetch(`/api/tb/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ status }),
    });
    fetchApplications();
  };

  const handleDeleteApp = async (id: string) => {
    if (!confirm('Başvurunu silmək istəyirsiniz?')) return;
    await fetch(`/api/tb/applications/${id}`, { method: 'DELETE', headers: auth() });
    fetchApplications();
  };

  const handleSendToApp = async (app: Application) => {
    const msg = `Salam ${app.name}! EventRent komandası olaraq sizinlə əlaqə saxlayırıq. Teambuilding başvurunuz (${app.game_name}) haqqında ətraflı məlumat vermək istərdik.`;
    await fetch('/api/wa/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ phone: app.phone, message: msg }),
    });
    alert('Mesaj göndərildi!');
    fetchLogs();
  };

  const statusConfig = {
    connected: { icon: <Wifi className="w-5 h-5" />, label: 'Qoşuldu', cls: 'text-green-400 bg-green-500/10 border-green-500/20' },
    qr: { icon: <QrCode className="w-5 h-5" />, label: 'QR Gözlənilir', cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    connecting: { icon: <RefreshCw className="w-5 h-5 animate-spin" />, label: 'Qoşulur...', cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    disconnected: { icon: <WifiOff className="w-5 h-5" />, label: 'Qoşulmayıb', cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
  };

  const sc = statusConfig[status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">WhatsApp</h2>
          <p className="text-gray-500 text-sm mt-1">Baileys inteqrasiyası — OTP, bildiriş, mesaj logları</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold ${sc.cls}`}>
          {sc.icon} {sc.label}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {(['connection', 'applications', 'logs', 'send'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 -mb-px ${
              tab === t ? 'text-gray-900 border-premium-orange' : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            {t === 'connection' ? 'Bağlantı' : t === 'applications' ? `Başvurular (${applications.filter(a => a.status === 'new').length})` : t === 'logs' ? 'Mesaj Logları' : 'Mesaj Göndər'}
          </button>
        ))}
      </div>

      {/* CONNECTION TAB */}
      {tab === 'connection' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR / Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-600">WhatsApp Bağlantısı</h3>

            {status === 'qr' && qr ? (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-2xl">
                  <QRCanvas qrString={qr} />
                </div>
                <p className="text-gray-500 text-xs text-center font-bold">
                  WhatsApp → Qoşulmuş cihazlar → Cihaz əlavə et → QR skan et
                </p>
                <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> QR yenilənir...
                </div>
              </div>
            ) : status === 'connected' ? (
              <div className="flex flex-col items-center gap-6 py-8">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </div>
                <div className="text-center">
                  <p className="text-gray-900 font-black text-lg">WhatsApp Aktiv</p>
                  <p className="text-gray-500 text-sm mt-1">Mesajlar göndərilə bilər</p>
                </div>
                <button onClick={handleDisconnect}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl border border-red-500/20 transition-all text-sm">
                  <XCircle className="w-4 h-4" /> Bağlantını kəs
                </button>
              </div>
            ) : status === 'connecting' ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <RefreshCw className="w-12 h-12 text-blue-400 animate-spin" />
                <p className="text-gray-500 font-bold">Qoşulur...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 py-8">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                  <WifiOff className="w-10 h-10 text-red-400" />
                </div>
                <p className="text-gray-500 text-sm font-bold text-center">WhatsApp qoşulmayıb</p>
                <button onClick={handleReconnect}
                  className="flex items-center gap-2 px-6 py-3 bg-premium-orange hover:bg-premium-orange/90 text-gray-900 font-black rounded-xl transition-all shadow-lg shadow-premium-orange/20">
                  <QrCode className="w-4 h-4" /> QR Al / Yenidən Qoş
                </button>
              </div>
            )}

            {(status === 'disconnected' || status === 'qr') && (
              <button onClick={fetchStatus}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 font-bold rounded-xl border border-gray-200 transition-all text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> Statusu yenilə
              </button>
            )}
          </div>

          {/* Owner Phone Setting */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-600">Sahibə Bildiriş Nömrəsi</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              Yeni başvuru gəldikdə bu nömrəyə WhatsApp bildirişi göndəriləcək.<br />
              Serverdə <code className="text-premium-orange text-[10px] bg-premium-orange/10 px-1.5 py-0.5 rounded">OWNER_WA_PHONE</code> env dəyişəni olaraq təyin edin.
            </p>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Whatsapp Nömrəsi (env ilə təyin edin)</label>
              <div className="flex gap-3">
                <input
                  type="tel"
                  value={ownerPhone}
                  onChange={e => setOwnerPhone(e.target.value)}
                  placeholder="+994XXXXXXXXX"
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-premium-orange/40 transition-all"
                />
                <button
                  onClick={async () => {
                    if (!sendMsg.trim()) { setSendMsg('Test mesajı — EventRent WhatsApp aktiv!'); }
                    await fetch('/api/wa/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', ...auth() },
                      body: JSON.stringify({ phone: ownerPhone, message: '✅ Test mesajı — EventRent WhatsApp aktiv!' }),
                    });
                    alert('Test mesajı göndərildi!');
                  }}
                  disabled={!ownerPhone || status !== 'connected'}
                  className="px-4 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold rounded-xl border border-green-500/20 transition-all text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Test
                </button>
              </div>
              <p className="text-[10px] text-gray-400">Format: 994XXXXXXXXX (ölkə kodu ilə, + işarəsiz)</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
              {[
                { label: 'Ümumi Log', val: logs.length },
                { label: 'Başvurular', val: applications.length },
                { label: 'Yeni Başvurular', val: applications.filter(a => a.status === 'new').length },
              ].map(({ label, val }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-gray-900">{val}</p>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* APPLICATIONS TAB */}
      {tab === 'applications' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{applications.length} başvuru</p>
            <button onClick={fetchApplications} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-900 text-xs font-bold transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Yenilə
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Users className="w-10 h-10 text-gray-300" />
              <p className="text-gray-400 font-bold">Hələ başvuru yoxdur</p>
            </div>
          ) : (
            applications.map(app => (
              <div key={app.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-premium-orange font-black text-xs bg-premium-orange/10 px-2 py-0.5 rounded border border-premium-orange/20">
                        {app.order_no}
                      </span>
                      <p className="text-gray-900 font-black">{app.name}</p>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${STATUS_COLORS[app.status] || STATUS_COLORS.new}`}>
                        {STATUS_LABELS[app.status] || app.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-bold">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {app.phone}</span>
                      {app.company && <span>{app.company}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {(() => { try { return new Date(app.created_at).toLocaleString('az-AZ'); } catch { return new Date(app.created_at).toLocaleString(); } })()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => handleSendToApp(app)} disabled={status !== 'connected'}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl border border-green-500/20 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      <MessageCircle className="w-3.5 h-3.5" /> WA Mesaj
                    </button>
                    <button onClick={() => handleDeleteApp(app.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {[
                    { label: 'Oyun', val: app.game_name },
                    { label: 'Konsepsiya', val: app.extra?.concept_name },
                    { label: 'Məkan', val: app.extra?.location },
                    { label: 'İştirakçı', val: app.extra?.participants },
                    { label: 'Tarix', val: app.extra?.date },
                  ].filter(i => i.val).map(({ label, val }) => (
                    <div key={label} className="bg-gray-50 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">{label}</p>
                      <p className="text-white/80 font-bold mt-0.5">{val}</p>
                    </div>
                  ))}
                </div>

                {/* Status changer */}
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <button key={key} onClick={() => handleAppStatus(app.id, key)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${
                        app.status === key
                          ? STATUS_COLORS[key]
                          : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* LOGS TAB */}
      {tab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{logs.length} mesaj</p>
            <div className="flex gap-2">
              <button onClick={fetchLogs} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-900 text-xs font-bold transition-colors px-3 py-2 bg-gray-50 rounded-xl">
                <RefreshCw className="w-3.5 h-3.5" /> Yenilə
              </button>
              <button onClick={handleClearLogs} className="flex items-center gap-1.5 text-red-400/60 hover:text-red-400 text-xs font-bold transition-colors px-3 py-2 bg-red-500/5 hover:bg-red-500/10 rounded-xl border border-red-500/10">
                <Trash2 className="w-3.5 h-3.5" /> Sil
              </button>
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <MessageCircle className="w-10 h-10 text-gray-300" />
              <p className="text-gray-400 font-bold">Log yoxdur</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className={`flex gap-4 p-4 rounded-xl border ${log.direction === 'out' ? 'bg-blue-500/5 border-blue-500/10' : 'bg-green-500/5 border-green-500/10'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${log.direction === 'out' ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
                    <Send className={`w-3.5 h-3.5 ${log.direction === 'out' ? 'text-blue-400' : 'text-green-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-black text-gray-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {log.phone}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${log.direction === 'out' ? 'text-blue-400 bg-blue-500/10' : 'text-green-400 bg-green-500/10'}`}>
                        {log.direction === 'out' ? 'Göndərildi' : 'Alındı'}
                      </span>
                      <span className="text-[9px] text-gray-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {(() => { try { return new Date(log.created_at).toLocaleString('az-AZ'); } catch { return new Date(log.created_at).toLocaleString(); } })()}</span>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEND TAB */}
      {tab === 'send' && (
        <div className="max-w-lg space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-600">Birbaşa Mesaj Göndər</h3>

            {status !== 'connected' && (
              <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm font-bold">
                <WifiOff className="w-4 h-4 shrink-0" />
                WhatsApp qoşulmayıb. Əvvəlcə Bağlantı tabından QR skan edin.
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Telefon</label>
                <input type="tel" value={sendPhone} onChange={e => setSendPhone(e.target.value)}
                  placeholder="+994XXXXXXXXX"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-premium-orange/40 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Mesaj</label>
                <textarea rows={5} value={sendMsg} onChange={e => setSendMsg(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-premium-orange/40 transition-all resize-none" />
              </div>

              {sendResult && (
                <p className={`text-sm font-bold px-4 py-3 rounded-xl border ${sendResult.startsWith('✓') ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {sendResult}
                </p>
              )}

              <button type="submit" disabled={sendLoading || status !== 'connected' || !sendPhone || !sendMsg}
                className="w-full flex items-center justify-center gap-2 py-3 bg-premium-orange hover:bg-premium-orange/90 text-gray-900 font-black rounded-xl transition-all shadow-lg shadow-premium-orange/20 disabled:opacity-50 disabled:cursor-not-allowed">
                {sendLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sendLoading ? 'Göndərilir...' : 'Göndər'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}