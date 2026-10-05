import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize2 } from 'lucide-react';
import { useSiteContent } from '../../content.context';

const FALLBACK_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800&auto=format&fit=crop', category: 'Tədbir' },
  { url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop', category: 'Səhnə' },
  { url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop', category: 'Korporativ' },
  { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop', category: 'Teambuilding' },
  { url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop', category: 'İşıq' },
  { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop', category: 'Texnika' },
  { url: 'https://images.unsplash.com/photo-1560472355-536de3962603?q=80&w=800&auto=format&fit=crop', category: 'Təqdimat' },
  { url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop', category: 'Konfrans' },
  { url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800&auto=format&fit=crop', category: 'Şou' },
  { url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=800&auto=format&fit=crop', category: 'Konsert' },
  { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop', category: 'Premium' },
  { url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=800&auto=format&fit=crop', category: 'Tədbir' },
];

export default function GalleryGrid() {
  const { content } = useSiteContent();
  const [selectedCategory, setSelectedCategory] = useState('Hamısı');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const IMAGES = useMemo(() => {
    const imgs = content.gallery?.images;
    return imgs && imgs.length > 0 ? imgs : FALLBACK_IMAGES;
  }, [content.gallery?.images]);

  const CATEGORIES = useMemo(() => {
    const cats = [...new Set(IMAGES.map(img => img.category))];
    return ['Hamısı', ...cats];
  }, [IMAGES]);

  const filteredImages = selectedCategory === 'Hamısı'
    ? IMAGES
    : IMAGES.filter(img => img.category === selectedCategory);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      <div className="flex flex-wrap justify-center gap-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-10 py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${
              selectedCategory === cat 
                ? 'bg-black text-white shadow-2xl shadow-black/20 scale-105' 
                : 'bg-white/5 text-white/70 hover:text-premium-orange hover:bg-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <AnimatePresence mode="popLayout">
          {filteredImages.map((img, i) => (
            <motion.div
              key={img.url}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="group relative aspect-square rounded-[60px] overflow-hidden cursor-pointer shadow-2xl hover:shadow-black/10 transition-all duration-700 border-8 border-gray-50"
              onClick={() => setSelectedImage(img.url)}
            >
              <img 
                src={img.url} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                alt={img.category}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-end p-12">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black scale-0 group-hover:scale-100 transition-transform duration-700 delay-100">
                  <Maximize2 className="w-6 h-6" />
                </div>
              </div>
              <div className="absolute top-10 left-10 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-[10px] font-bold border border-white/20 uppercase tracking-widest">
                {img.category}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-20"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-12 right-12 w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all border border-white/10"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-8 h-8" />
            </button>
            <motion.img 
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 40 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              src={selectedImage} 
              className="max-w-full max-h-full rounded-[40px] shadow-2xl border border-white/5"
              alt="Full size"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
