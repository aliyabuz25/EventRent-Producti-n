import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, ArrowUpRight, X, ChevronLeft, ChevronRight, Play, Search, Youtube, Instagram, Video, Image } from 'lucide-react';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

type Reel = {
  id: string;
  title: string;
  client: string;
  date_label: string;
  location: string;
  category: string;
  tags: string[];
  media_type: 'video' | 'youtube' | 'instagram' | 'image';
  media_url: string;
  poster_url: string;
  active: boolean;
  sort_order: number;
};

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1`;
  return null;
}

function getInstagramEmbedUrl(url: string): string {
  const clean = url.replace(/\/$/, '');
  return `${clean}/embed`;
}

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]+)/);
  if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  return null;
}

function MediaCard({ reel, isHovered }: { reel: Reel; isHovered: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (reel.media_type !== 'video') return;
    if (isHovered) videoRef.current?.play().catch(() => {});
    else {
      videoRef.current?.pause();
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  }, [isHovered, reel.media_type]);

  const ytThumb = reel.media_type === 'youtube' ? getYouTubeThumbnail(reel.media_url) : null;
  const thumb = reel.poster_url || ytThumb || '';

  if (reel.media_type === 'video') {
    return (
      <>
        <video
          ref={videoRef}
          src={reel.media_url}
          poster={reel.poster_url || undefined}
          muted
          loop
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />
        {!isHovered && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
              <Play className="w-7 h-7 fill-white text-white ml-1" />
            </div>
          </div>
        )}
      </>
    );
  }

  if (reel.media_type === 'youtube' || reel.media_type === 'instagram') {
    return (
      <>
        {thumb ? (
          <img src={thumb} alt={reel.title} loading="lazy" decoding="async" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-black/60 to-black">
            {reel.media_type === 'youtube' ? <Youtube className="w-10 h-10 text-red-400/60" /> : <Instagram className="w-10 h-10 text-pink-400/60" />}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
            {reel.media_type === 'youtube'
              ? <Youtube className="w-7 h-7 text-red-400" />
              : <Play className="w-7 h-7 fill-white text-white ml-1" />}
          </div>
        </div>
      </>
    );
  }

  return (
    <img
      src={reel.media_url}
      alt={reel.title}
      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
      referrerPolicy="no-referrer"
    />
  );
}

function ViewerMedia({ reel }: { reel: Reel }) {
  if (reel.media_type === 'youtube') {
    const embed = getYouTubeEmbedUrl(reel.media_url);
    if (embed) return (
      <iframe
        src={embed}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: 'none' }}
      />
    );
  }
  if (reel.media_type === 'instagram') {
    const embed = getInstagramEmbedUrl(reel.media_url);
    return (
      <iframe
        src={embed}
        className="w-full h-full"
        scrolling="no"
        allowTransparency
        style={{ border: 'none' }}
      />
    );
  }
  if (reel.media_type === 'video') {
    return (
      <video
        src={reel.media_url}
        poster={reel.poster_url || undefined}
        autoPlay
        controls
        loop
        playsInline
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <img
      src={reel.media_url}
      alt={reel.title}
      className="w-full h-full object-contain bg-black"
      referrerPolicy="no-referrer"
    />
  );
}

function ReelsCard({ reel, index, onOpen }: { reel: Reel; index: number; onOpen: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: [0.25, 0.1, 0.25, 1] }}
      className="group space-y-6 cursor-pointer"
      onClick={onOpen}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-[85%] mx-auto">
        <div className="relative aspect-[9/16] rounded-[40px] overflow-hidden shadow-2xl border-8 border-white/5 group-hover:border-premium-orange/20 transition-all duration-700">
          <MediaCard reel={reel} isHovered={isHovered} />

          <div className="absolute top-6 left-6 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-white text-[9px] font-bold border border-white/20 uppercase tracking-widest">
            {reel.category}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6 pointer-events-none">
            <div className="space-y-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h3 className="text-lg font-black text-white tracking-tight leading-tight">{reel.title}</h3>
              {reel.client && (
                <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-bold uppercase tracking-widest">
                  {reel.client} <ArrowUpRight className="w-3 h-3" />
                </div>
              )}
              {reel.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {reel.tags.map(tag => (
                    <span key={tag} className="text-[9px] text-premium-orange/80 font-bold">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-white/50 font-bold uppercase tracking-widest px-4">
        {reel.date_label && <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {reel.date_label}</div>}
        {reel.location && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {reel.location}</div>}
      </div>
    </motion.div>
  );
}

function ReelsViewer({ reels, activeIndex, onClose, onNavigate }: {
  reels: Reel[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const reel = reels[activeIndex];
  if (!reel) return null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && activeIndex > 0) onNavigate(activeIndex - 1);
      if (e.key === 'ArrowRight' && activeIndex < reels.length - 1) onNavigate(activeIndex + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeIndex, reels.length, onClose, onNavigate]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-20"
        onClick={onClose}
      >
        <button
          className="absolute top-6 right-6 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all border border-white/10 z-20"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>

        {activeIndex > 0 && (
          <button
            className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10 z-20"
            onClick={(e) => { e.stopPropagation(); onNavigate(activeIndex - 1); }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {activeIndex < reels.length - 1 && (
          <button
            className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10 z-20"
            onClick={(e) => { e.stopPropagation(); onNavigate(activeIndex + 1); }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        <motion.div
          key={activeIndex}
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`relative h-[85vh] max-w-full rounded-[32px] overflow-hidden shadow-2xl border-4 border-white/10 ${
            reel.media_type === 'instagram' ? 'aspect-[4/5]' : 'aspect-[9/16]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <ViewerMedia reel={reel} />

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
            <div className="space-y-2">
              {reel.category && (
                <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-white text-[9px] font-bold border border-white/20 uppercase tracking-widest">
                  {reel.category}
                </div>
              )}
              <h3 className="text-xl font-black text-white tracking-tight">{reel.title}</h3>
              <div className="flex flex-wrap items-center gap-3 text-white/60 text-[10px] font-bold uppercase tracking-widest">
                {reel.client && <span>{reel.client}</span>}
                {reel.date_label && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {reel.date_label}</span>}
                {reel.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {reel.location}</span>}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Counter */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {reels.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onNavigate(i); }}
              className={`rounded-full transition-all ${i === activeIndex ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/60'}`}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function PortfolioGrid() {
  const { content, locale } = useSiteContent();
  const pf = content.portfolio;
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReel, setActiveReel] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/reels')
      .then(r => r.ok ? r.json() : [])
      .then(data => setReels(Array.isArray(data) ? data.filter((r: Reel) => r.active) : []))
      .catch(() => setReels([]))
      .finally(() => setLoading(false));
  }, []);

  const ALL_TAGS = useMemo(() => Array.from(new Set(reels.flatMap(r => r.tags))).sort(), [reels]);
  const ALL_CATEGORIES = useMemo(() => Array.from(new Set(reels.map(r => r.category).filter(Boolean))).sort(), [reels]);

  const toggleTag = (tag: string) => setSelectedTags(prev => {
    const next = new Set(prev); next.has(tag) ? next.delete(tag) : next.add(tag); return next;
  });

  const toggleCategory = (cat: string) => setSelectedCategories(prev => {
    const next = new Set(prev); next.has(cat) ? next.delete(cat) : next.add(cat); return next;
  });

  const clearAll = () => { setSelectedTags(new Set()); setSelectedCategories(new Set()); setSearch(''); };

  const filtered = useMemo(() => reels.filter(r => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || (r.title ?? '').toLowerCase().includes(q) || (r.client ?? '').toLowerCase().includes(q) || (r.location ?? '').toLowerCase().includes(q);
    const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(r.category);
    const matchesTags = selectedTags.size === 0 || [...selectedTags].every(tag => r.tags.includes(tag));
    return matchesSearch && matchesCategory && matchesTags;
  }), [reels, search, selectedTags, selectedCategories]);

  const hasFilters = selectedTags.size > 0 || selectedCategories.size > 0 || search.trim() !== '';

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <div className="w-8 h-8 rounded-full border-2 border-premium-orange border-t-transparent animate-spin" />
    </div>
  );

  if (reels.length === 0) return (
    <div className="flex flex-col items-center justify-center py-40 text-center space-y-4">
      <Video className="w-12 h-12 text-white/20" />
      <p className="text-white/40 font-bold text-lg">Hələ portfolio əlavə edilməyib</p>
      <p className="text-white/25 text-sm">Admin paneldən yeni reel əlavə edin</p>
    </div>
  );

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-10 lg:gap-16 items-start">

        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:flex flex-col gap-10 w-[280px] shrink-0 sticky top-32">

          {/* Search */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-[2px] bg-premium-orange" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">{t(locale, pf.filters.searchPlaceholder).split(',')[0]}</p>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-premium-orange transition-colors pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t(locale, pf.filters.searchPlaceholder)}
                className="w-full pl-12 pr-4 py-4 bg-[#111] border border-white/5 hover:border-white/10 rounded-2xl text-sm font-medium text-white placeholder-white/20 outline-none focus:border-premium-orange/40 focus:bg-[#151515] transition-all"
              />
            </div>
          </div>

          {/* Category */}
          {ALL_CATEGORIES.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-[2px] bg-premium-orange" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">{t(locale, pf.filters.categoryLabel)}</p>
              </div>
              <div className="flex flex-col gap-1">
                {ALL_CATEGORIES.map(cat => {
                  const active = selectedCategories.has(cat);
                  const count = reels.filter(r => r.category === cat).length;
                  return (
                    <button key={cat} onClick={() => toggleCategory(cat)} className="group flex items-center justify-between py-2.5 text-left">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${active ? 'bg-premium-orange border-premium-orange' : 'border-white/20 group-hover:border-white/40 bg-white/5'}`}>
                          {active && <X className="w-2.5 h-2.5 text-white" style={{ transform: 'rotate(45deg)' }} />}
                        </div>
                        <span className={`text-sm font-bold transition-colors ${active ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>{cat}</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-colors ${active ? 'bg-premium-orange/20 text-premium-orange' : 'bg-white/5 text-white/30 group-hover:bg-white/10'}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {ALL_TAGS.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-[2px] bg-premium-orange" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">{t(locale, pf.filters.tagsLabel)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map(tag => {
                  const active = selectedTags.has(tag);
                  return (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider transition-all border ${
                        active ? 'border-premium-orange bg-premium-orange/10 text-premium-orange shadow-[0_0_15px_rgba(227,6,19,0.15)]'
                               : 'border-white/10 bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >{tag}</button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clear */}
          <AnimatePresence>
            {hasFilters && (
              <motion.button
initial={{ opacity: 0, y: 8 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -4 }}
                onClick={clearAll}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-premium-orange/60 hover:text-premium-orange transition-colors pt-4 border-t border-white/10"
              >
                <X className="w-3.5 h-3.5" /> {t(locale, pf.filters.clearLabel)}
              </motion.button>
            )}
          </AnimatePresence>
        </aside>

        {/* RIGHT — Grid */}
        <div className="flex-1 min-w-0">

          {/* Mobile filters */}
          <div className="flex lg:hidden flex-col gap-4 mb-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t(locale, pf.filters.searchPlaceholder)}
                className="w-full pl-12 pr-4 py-3.5 bg-[#111] border border-white/10 rounded-2xl text-sm font-medium text-white placeholder-white/20 outline-none focus:border-premium-orange/40 transition-all" />
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => toggleCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-bold tracking-wide transition-all border ${selectedCategories.has(cat) ? 'bg-premium-orange border-premium-orange text-white' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/80'}`}
                >{cat}</button>
              ))}
              {ALL_TAGS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all border ${selectedTags.has(tag) ? 'text-premium-orange border-premium-orange bg-premium-orange/10' : 'text-white/40 border-white/10 bg-white/5 hover:text-white/70 hover:bg-white/10'}`}
                >{tag}</button>
              ))}
            </div>
          </div>

          {/* Result info */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
              {filtered.length} layihə
              {hasFilters && (
                <button onClick={clearAll} className="ml-3 text-premium-orange hover:text-premium-orange/70 transition-colors">× Sıfırla</button>
              )}
            </p>
            {selectedTags.size > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {[...selectedTags].map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-premium-orange/10 border border-premium-orange/30 rounded-full text-[9px] text-premium-orange font-bold">
                    {tag}
                    <button onClick={() => toggleTag(tag)}><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Grid */}
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
                {filtered.map((reel, i) => (
                  <ReelsCard
                    key={reel.id}
                    reel={reel}
                    index={i}
                    onOpen={() => setActiveReel(filtered.indexOf(reel))}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 text-center space-y-4">
                <p className="text-4xl">🔍</p>
                <p className="text-white/40 font-bold">{t(locale, pf.filters.emptyLabel)}</p>
                <button onClick={clearAll} className="text-premium-orange text-sm font-bold hover:underline">{t(locale, pf.filters.clearLabel)}</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <AnimatePresence>
        {activeReel !== null && (
          <ReelsViewer
            reels={filtered}
            activeIndex={activeReel}
            onClose={() => setActiveReel(null)}
            onNavigate={setActiveReel}
          />
        )}
      </AnimatePresence>
    </>
  );
}