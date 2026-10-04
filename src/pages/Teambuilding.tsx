import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/utils';
import TeambuildingGrid from '../sections/teambuilding/TeambuildingGrid';
import TeambuildingDetailView from '../sections/teambuilding/TeambuildingDetailView';
import { useToast } from '../components/Toast';
import { ExternalLink, Copy, CheckCheck } from 'lucide-react';

export default function Teambuilding() {
  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get('type');
  const toast = useToast();

  const [games, setGames] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'games' | 'concepts'>('games');

  // Detail state
  const [showDetail, setShowDetail] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<any | null>(null);
  const [sending, setSending] = useState(false);
  const [orderExtraData, setOrderExtraData] = useState({ name: '', phone: '', company: '', location: '', participants: '', date: '' });
  const [trackingNo, setTrackingNo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/tb/games').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/tb/concepts').then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([g, c]) => {
      setGames(Array.isArray(g) ? g.filter((x: any) => x.active) : []);
      setConcepts(Array.isArray(c) ? c.filter((x: any) => x.active) : []);
    }).catch(() => {}).finally(() => setDataLoading(false));
  }, []);

  useEffect(() => {
    if (typeFilter) setActiveTab('games');
  }, [typeFilter]);

  const filteredGames = typeFilter
    ? games.filter(g => (g.category ?? '').toLowerCase() === typeFilter.toLowerCase())
    : games;

  const handleGameClick = (game: any) => {
    setSelectedGame(game);
    setSelectedConcept(null);
    setOrderExtraData({ name: '', phone: '', company: '', location: '', participants: '', date: '' });
    setShowDetail(true);
  };

  const handleBackToList = () => {
    setShowDetail(false);
    setTimeout(() => {
      setSelectedGame(null);
      setSelectedConcept(null);
    }, 300);
  };

  const handleOrder = async () => {
    if (!selectedGame) return;
    setSending(true);
    try {
      const res = await fetch('/api/tb/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orderExtraData.name,
          phone: orderExtraData.phone,
          company: orderExtraData.company,
          game_id: selectedGame.id,
          game_name: selectedGame.name,
          concept_id: selectedConcept?.id || '',
          concept_name: selectedConcept?.name || '',
          location: orderExtraData.location,
          participants: orderExtraData.participants,
          date: orderExtraData.date,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setTrackingNo(data.app?.order_no || null);
      toast.success('Müraciətiniz qəbul edildi!');
      handleBackToList();
    } catch {
      toast.error('Sifariş zamanı xəta baş verdi.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pb-20">

      {/* Tracking banner */}
      <AnimatePresence>
        {trackingNo && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-[#0e0e0e] border border-premium-orange/30 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-2xl shadow-premium-orange/10">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">Sifariş nömrəniz</p>
                <p className="text-white font-black text-sm">{trackingNo}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/track/${trackingNo}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/50 hover:text-white"
                title="Linki kopyala"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <Link
                to={`/track/${trackingNo}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-premium-orange hover:bg-premium-orange/90 text-white font-black text-xs rounded-xl transition-all whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" /> İzlə
              </Link>
              <button onClick={() => setTrackingNo(null)} className="p-1 text-white/20 hover:text-white/60 transition-colors text-lg leading-none">&times;</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {showDetail && selectedGame ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <TeambuildingDetailView
              selectedGame={selectedGame}
              selectedConcept={selectedConcept}
              setSelectedConcept={setSelectedConcept}
              orderExtraData={orderExtraData}
              setOrderExtraData={setOrderExtraData}
              handleOrder={handleOrder}
              setStep={handleBackToList}
              concepts={concepts}
              sending={sending}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-20"
          >
            {/* Hero */}
            <div className="relative -mt-[72px] pt-32 pb-12 md:pt-40 md:pb-16 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-card overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
                <div className="absolute top-0 left-1/4 w-[40vw] h-[50%]"
                  style={{ background: 'radial-gradient(ellipse, rgba(227,6,19,0.06) 0%, transparent 70%)' }} />
              </div>
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-5 h-px bg-premium-orange" />
                  <span className="text-[9px] tracking-[0.35em] uppercase font-inter text-white/60">Team Building</span>
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-none mb-8">
                  Komanda<br />
                  <span className="text-white/50 italic">Tədbirləri.</span>
                </h1>
                <p className="text-lg md:text-xl text-white/70 max-w-2xl font-light leading-relaxed">
                  Komandanızı gücləndirən yaradıcı və interaktiv etkinlik həlləri.
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setActiveTab('games')}
                  className={cn(
                    'px-12 py-5 rounded-full font-bold text-sm uppercase tracking-widest transition-all',
                    activeTab === 'games' ? 'bg-white text-black shadow-2xl' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                  )}
                >
                  Oyunlar
                </button>
                <button
                  onClick={() => setActiveTab('concepts')}
                  className={cn(
                    'px-12 py-5 rounded-full font-bold text-sm uppercase tracking-widest transition-all',
                    activeTab === 'concepts' ? 'bg-white text-black shadow-2xl' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                  )}
                >
                  Konsepsiya
                </button>
              </div>
            </div>

            {/* Grid */}
            {dataLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-premium-orange border-t-transparent animate-spin" />
              </div>
            ) : (
              <TeambuildingGrid
                activeTab={activeTab}
                filteredGames={filteredGames}
                concepts={concepts}
                verifiedGames={new Set()}
                onGameClick={handleGameClick}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}