import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../../types';

interface ProductGalleryProps {
  product: Product;
}

export default function ProductGallery({ product }: ProductGalleryProps) {
  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="aspect-[4/3] rounded-[3rem] overflow-hidden bg-white border-8 border-white shadow-2xl shadow-black/20"
      >
        {(product.images ?? [])[0] && (
          <img
            src={(product.images ?? [])[0]}
            alt={product.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
      </motion.div>
      <div className="grid grid-cols-4 gap-4">
        {(product.images ?? []).map((img, idx) => (
          <button key={idx} className="aspect-square rounded-2xl overflow-hidden border-4 border-white bg-white shadow-lg hover:scale-105 transition-transform">
            <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </button>
        ))}
      </div>
    </div>
  );
}
