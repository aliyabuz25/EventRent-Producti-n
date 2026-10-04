import React from 'react';
import { motion } from 'motion/react';
import { Home, MapPin, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TeambuildingGridProps {
  activeTab: 'games' | 'concepts';
  filteredGames: any[];
  concepts: any[];
  verifiedGames: Set<string>;
  onGameClick: (game: any) => void;
}

export default function TeambuildingGrid({ activeTab, filteredGames, concepts, verifiedGames, onGameClick }: TeambuildingGridProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {activeTab === 'games' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredGames.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative aspect-square rounded-[40px] overflow-hidden shadow-2xl cursor-pointer"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onGameClick(game); }}
            >
              <img 
                src={game.image} 
                className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000"
                alt={game.name}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              
              <div className="absolute bottom-10 left-10 right-10 space-y-2">
                <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none break-words">
                  {game.name}
                </h3>
                <div className="flex items-center justify-between pt-4 border-t border-white/20">
                  <div className="flex items-center gap-2 text-white/60 text-[10px] font-bold uppercase tracking-widest">
                    {game.category === 'Indoor' ? <Home className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                    {game.category}
                  </div>
                  <div className="text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                    Ətraflı bax <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {verifiedGames.has(game.id) && (
                <div className="absolute top-10 right-10 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {concepts.map((concept, i) => (
            <motion.div
              key={concept.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative aspect-square rounded-[40px] overflow-hidden shadow-xl border-4 border-gray-50"
            >
              <img 
                src={concept.image} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                alt={concept.name}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-2xl font-bold text-white tracking-tight text-center px-4 uppercase">{concept.name}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
