import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import TechnicalQuestionsModal from './TechnicalQuestionsModal';
import TiltCard from './TiltCard';
import { useCart } from '../hooks/useCart';
import { useSiteContent } from '../content.context';
import { t } from '../content';

export default function ProductCard({ product }: { product: Product }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { content, locale } = useSiteContent();

  const handleAddToCart = (answers: Record<string, string>) => {
    addItem({ productId: product.id, quantity: 1, technicalAnswers: answers, name: product.name, category: product.category, image: product.images?.[0] || '' });
    setIsModalOpen(false);
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        onClick={() => navigate(`/product/${product.id}`)}
        className="group cursor-pointer"
      >
        <TiltCard>
          <div className="relative bg-white rounded-[3rem] overflow-hidden border border-gray-100 transition-all duration-500 shadow-xl group-hover:shadow-2xl">
            <div className="block relative aspect-square overflow-hidden border-8 border-gray-50 rounded-[3rem] m-4 shadow-sm group-hover:border-white transition-all duration-500">
              <img
                src={product.images?.[0] ?? ''}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <span className="glass px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white">
                  {product.category}
                </span>
              </div>

              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h3 className="text-xl font-black leading-tight mb-2 group-hover:text-premium-red transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-300 line-clamp-2 font-medium leading-relaxed opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  {product.description}
                </p>
              </div>
            </div>

            <div className="p-6 flex items-center justify-between gap-4 bg-white">
              <div className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-widest hover:text-premium-red transition-colors">
                {t(locale, content.product.details)} <ArrowRight className="w-4 h-4" />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
                className="flex items-center justify-center w-12 h-12 bg-black text-white rounded-2xl hover:bg-premium-red hover:scale-110 transition-all active:scale-95 shadow-xl shadow-black/10"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </TiltCard>
      </motion.div>

      <TechnicalQuestionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleAddToCart}
        productName={product.name}
        category={product.category}
      />
    </>
  );
}
