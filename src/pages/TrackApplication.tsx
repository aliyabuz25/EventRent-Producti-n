import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, Loader2, XCircle, ArrowLeft, Hash, Calendar, Gamepad2 } from 'lucide-react';

type Status = 'new' | 'in_progress' | 'done' | 'cancelled';

interface Application {
  id: string;
  order_no: string;
  name: string;
  game_name: string;
  status: Status;
  created_at: string;
}

const STATUS_CONFIG: Record<Status, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  step: number;
}> = {
  new: {
    label: 'Qəbul edildi',
    icon: <Clock className="w-6 h-6" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    step: 1,
  },
  in_progress: {
    label: 'İşlənir',
    icon: <Loader2 className="w-6 h-6 animate-spin" />,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    step: 2,
  },
  done: {
    label: 'Tamamlandı',
    icon: <CheckCircle2 className="w-6 h-6" />,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    step: 3,
  },
  cancelled: {
    label: 'Ləğv edildi',
    icon: <XCircle className="w-6 h-6" />,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    step: 0,
  },
};

const STEPS = [
  { label: 'Qəbul edildi', key: 'new' },
  { label: 'İşlənir', key: 'in_progress' },
  { label: 'Tamamlandı', key: 'done' },
];

export default function TrackApplication() {
  const { order_no } = useParams<{ order_no: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!order_no) return;
    fetch(`/api/tb/track/${encodeURIComponent(order_no)}`)
      .then(r => r.ok ? r.json() : r.json().catch(() => ({ error: `HTTP ${r.status}` })))
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setApp(data);
      })
      .catch(() => setError('Serverə qoşulma alınmadı.'))
      .finally(() => setLoading(false));
  }, [order_no]);

  const cfg = app ? STATUS_CONFIG[app.status] || STATUS_CONFIG.new : null;

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Back */}
        <Link to="/teambuilding" className="flex items-center gap-2 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Team Building
        </Link>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 space-y-8">

          {/* Header */}
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/40">Sifariş İzləmə</p>
            <h1 className="text-2xl font-black tracking-tight text-white">{order_no}</h1>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-premium-orange animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <XCircle className="w-10 h-10 text-red-400" />
              <p className="text-white/60 font-bold text-sm">{error}</p>
              <p className="text-white/30 text-xs">Sifariş nömrəsini yoxlayın.</p>
            </div>
          )}

          {app && cfg && (
            <>
              {/* Status badge */}
              <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
                <span className={cfg.color}>{cfg.icon}</span>
                <div>
                  <p className={`font-black text-sm ${cfg.color}`}>{cfg.label}</p>
                  <p className="text-white/30 text-[10px] font-bold mt-0.5">Cari status</p>
                </div>
              </div>

              {/* Progress steps (only if not cancelled) */}
              {app.status !== 'cancelled' && (
                <div className="relative flex items-center justify-between">
                  {/* connector line */}
                  <div className="absolute left-0 right-0 top-4 h-px bg-white/10 z-0" />
                  <div
                    className="absolute left-0 top-4 h-px bg-premium-orange z-0 transition-all duration-700"
                    style={{ width: cfg.step === 1 ? '0%' : cfg.step === 2 ? '50%' : '100%' }}
                  />
                  {STEPS.map((s, i) => {
                    const active = cfg.step > i;
                    const current = cfg.step === i + 1;
                    return (
                      <div key={s.key} className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                          active
                            ? 'bg-premium-orange border-premium-orange'
                            : current
                            ? 'bg-premium-orange/20 border-premium-orange'
                            : 'bg-brand-bg border-white/20'
                        }`}>
                          {active
                            ? <CheckCircle2 className="w-4 h-4 text-white" />
                            : <div className={`w-2 h-2 rounded-full ${current ? 'bg-premium-orange' : 'bg-white/20'}`} />
                          }
                        </div>
                        <p className={`text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${active || current ? 'text-white/70' : 'text-white/20'}`}>
                          {s.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Info */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                {[
                  { Icon: Hash, label: 'Ad', value: app.name },
                  { Icon: Gamepad2, label: 'Oyun', value: app.game_name },
                  { Icon: Calendar, label: 'Tarix', value: (() => { try { return new Date(app.created_at).toLocaleDateString('az-AZ', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return new Date(app.created_at).toLocaleDateString(); } })() },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-white/40" />
                    </div>
                    <div>
                      <p className="text-[9px] text-white/30 font-black uppercase tracking-wider">{label}</p>
                      <p className="text-sm text-white font-bold">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[10px] text-white/20 font-bold">
          Suallarınız üçün: <a href="/contact" className="text-premium-orange/60 hover:text-premium-orange transition-colors">bizimlə əlaqə saxlayın</a>
        </p>
      </motion.div>
    </div>
  );
}