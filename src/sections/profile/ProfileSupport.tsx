import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Clock, CheckCircle2, X, ChevronDown, ChevronUp, Send, AlertCircle } from 'lucide-react';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

const TOKEN_KEY = 'er_admin_token';

interface Ticket {
  id: number; subject: string; message: string; status: string;
  priority: string; reply: string; replied_at: string; created_at: string;
}

const STATUS_BG: Record<string, string> = {
  open:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  answered: 'bg-green-500/10 text-green-400 border-green-500/20',
  closed:   'bg-white/5 text-white/40 border-white/10',
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  open:     <Clock className="w-3.5 h-3.5" />,
  answered: <CheckCircle2 className="w-3.5 h-3.5" />,
  closed:   <X className="w-3.5 h-3.5" />,
};

export default function ProfileSupport() {
  const { locale } = useSiteContent();
  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ subject: '', message: '', priority: 'normal' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  const token = (() => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } })();
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const L = {
    title:       { az: 'Dəstək Mərkəzi',        en: 'Support Center',         ru: 'Центр поддержки',     tr: 'Destek Merkezi' },
    subtitle:    { az: 'Sorğularınızı izləyin və yeni sorğu yaradın.', en: 'Track your requests and create new tickets.', ru: 'Отслеживайте запросы и создавайте новые.', tr: 'Taleplerinizi takip edin ve yeni oluşturun.' },
    newTicket:   { az: 'Yeni Sorğu',             en: 'New Ticket',             ru: 'Новый запрос',        tr: 'Yeni Talep' },
    subject:     { az: 'Mövzu',                  en: 'Subject',                ru: 'Тема',                tr: 'Konu' },
    message:     { az: 'Mesaj',                  en: 'Message',                ru: 'Сообщение',           tr: 'Mesaj' },
    priority:    { az: 'Prioritet',              en: 'Priority',               ru: 'Приоритет',           tr: 'Öncelik' },
    low:         { az: 'Aşağı',                  en: 'Low',                    ru: 'Низкий',              tr: 'Düşük' },
    normal:      { az: 'Normal',                 en: 'Normal',                 ru: 'Обычный',             tr: 'Normal' },
    high:        { az: 'Yüksək',                 en: 'High',                   ru: 'Высокий',             tr: 'Yüksek' },
    send:        { az: 'Göndər',                 en: 'Send',                   ru: 'Отправить',           tr: 'Gönder' },
    sending:     { az: 'Göndərilir...',           en: 'Sending...',             ru: 'Отправка...',         tr: 'Gönderiliyor...' },
    cancel:      { az: 'Ləğv et',                en: 'Cancel',                 ru: 'Отмена',              tr: 'İptal' },
    successMsg:  { az: 'Sorğunuz göndərildi. Tezliklə cavablandırılacaq.', en: 'Your ticket was sent. We will reply soon.', ru: 'Запрос отправлен. Ответим скоро.', tr: 'Talebiniz gönderildi. Yakında yanıtlanacak.' },
    noTickets:   { az: 'Hələ sorğu yoxdur.',     en: 'No tickets yet.',        ru: 'Запросов пока нет.',  tr: 'Henüz talep yok.' },
    adminReply:  { az: 'Cavab:',                 en: 'Reply:',                 ru: 'Ответ:',              tr: 'Yanıt:' },
    statusOpen:  { az: 'Açıq',                   en: 'Open',                   ru: 'Открыт',              tr: 'Açık' },
    statusAnswered:{ az: 'Cavablandı',            en: 'Answered',               ru: 'Отвечен',             tr: 'Yanıtlandı' },
    statusClosed:{ az: 'Bağlı',                  en: 'Closed',                 ru: 'Закрыт',              tr: 'Kapalı' },
    yourMsg:     { az: 'Mesajınız:',             en: 'Your message:',          ru: 'Ваше сообщение:',     tr: 'Mesajınız:' },
  };

  const statusLabel = (s: string) => ({ open: t(locale, L.statusOpen), answered: t(locale, L.statusAnswered), closed: t(locale, L.statusClosed) }[s] || s);

  const loadTickets = async () => {
    if (!token) { setLoading(false); return; }
    const r = await fetch('/api/support/my', { headers: h });
    setTickets(r.ok ? await r.json() : []);
    setLoading(false);
  };

  useEffect(() => { loadTickets(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const endpoint = token ? '/api/support' : '/api/support/guest';
      const res = await fetch(endpoint, { method: 'POST', headers: h, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Xəta baş verdi.'); return; }
      setSuccess(true);
      setForm({ subject: '', message: '', priority: 'normal' });
      setShowForm(false);
      await loadTickets();
      setTimeout(() => setSuccess(false), 4000);
    } catch { setError('Serverə qoşulma alınmadı.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl shadow-black/20 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tighter">{t(locale, L.title)}</h2>
          <p className="text-white/50 text-sm mt-1">{t(locale, L.subtitle)}</p>
        </div>
        <button onClick={() => { setShowForm(v => !v); setError(null); }}
          className="flex items-center gap-2 bg-premium-orange hover:bg-premium-orange/90 text-white font-black text-[11px] uppercase tracking-widest px-5 py-3 rounded-2xl transition-all active:scale-95 flex-shrink-0">
          <Plus className="w-4 h-4" /> {t(locale, L.newTicket)}
        </button>
      </div>

      {/* Success */}
      {success && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl p-4 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> {t(locale, L.successMsg)}
        </div>
      )}

      {/* New ticket form */}
      {showForm && (
        <div className="bg-white/[0.04] border border-white/10 rounded-[28px] p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">{t(locale, L.subject)}</label>
              <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-premium-orange/50 transition-all"
                placeholder={t(locale, L.subject)} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">{t(locale, L.message)}</label>
              <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-premium-orange/50 transition-all resize-none"
                placeholder={t(locale, L.message)} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">{t(locale, L.priority)}</label>
              <div className="flex gap-2">
                {(['low','normal','high'] as const).map(p => (
                  <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border ${form.priority === p ? (p === 'high' ? 'bg-red-500/20 border-red-500/40 text-red-400' : p === 'normal' ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/10 border-white/20 text-white/60') : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'}`}>
                    {t(locale, L[p])}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all">{t(locale, L.cancel)}</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-premium-orange hover:bg-premium-orange/90 text-white font-black py-3 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                <Send className="w-4 h-4" /> {submitting ? t(locale, L.sending) : t(locale, L.send)}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets list */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-premium-orange border-t-transparent rounded-full animate-spin" /></div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-10 text-white/30">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t(locale, L.noTickets)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-white/[0.03] border border-white/[0.07] rounded-[24px] overflow-hidden">
              <div className="flex items-start gap-4 p-5 cursor-pointer" onClick={() => setExpanded(expanded === ticket.id ? null : ticket.id)}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ticket.status === 'answered' ? 'bg-green-500/10 text-green-400' : ticket.status === 'closed' ? 'bg-white/5 text-white/30' : 'bg-yellow-500/10 text-yellow-400'}`}>
                  {STATUS_ICON[ticket.status] || <MessageSquare className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{ticket.subject}</span>
                    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_BG[ticket.status] || 'bg-white/5 text-white/40 border-white/10'}`}>
                      {STATUS_ICON[ticket.status]} {statusLabel(ticket.status)}
                    </span>
                    {ticket.priority === 'high' && <span className="text-[9px] font-black uppercase tracking-widest text-red-400">● Yüksək</span>}
                  </div>
                  <div className="text-[11px] text-white/30 mt-1">#{String(ticket.id).padStart(4,'0')} · {ticket.created_at}</div>
                </div>
                {expanded === ticket.id ? <ChevronUp className="w-4 h-4 text-white/30 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />}
              </div>

              {expanded === ticket.id && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} className="px-5 pb-5 pt-4 space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">{t(locale, L.yourMsg)}</p>
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 text-sm text-white/70 leading-relaxed">{ticket.message}</div>
                  </div>
                  {ticket.reply && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-green-400/60 mb-2">{t(locale, L.adminReply)}</p>
                      <div className="bg-green-500/[0.06] border border-green-500/20 rounded-2xl p-4 text-sm text-white/80 leading-relaxed">{ticket.reply}</div>
                      {ticket.replied_at && <p className="text-[10px] text-white/20 mt-1">{ticket.replied_at}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}