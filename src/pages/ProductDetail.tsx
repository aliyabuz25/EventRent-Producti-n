import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TechnicalQuestionsModal from '../components/TechnicalQuestionsModal';
import { Product } from '../types';
import ProductGallery from '../sections/product/ProductGallery';
import ProductInfo from '../sections/product/ProductInfo';
import ProductRelated from '../sections/product/ProductRelated';
import { useCart } from '../hooks/useCart';
import { useSiteContent } from '../content.context';
import { t } from '../content';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const { addItem } = useCart();
  const { content, locale } = useSiteContent();
  const c = content.product;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!id) return;

    setIsLoading(true);
    fetch(`/api/products/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(async (data: Product | null) => {
        if (!data) { setIsLoading(false); return; }
        setProduct(data);
        if (data.relatedProducts?.length) {
          const all: Product[] = await fetch('/api/products').then(r => r.ok ? r.json() : []).catch(() => []);
          setRelatedProducts(Array.isArray(all) ? all.filter(p => data.relatedProducts.includes(p.id)) : []);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-8 h-8 border-4 border-premium-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">{t(locale, c.notFound)}</h2>
        <Link to="/catalog" className="text-premium-orange underline mt-4 block">{t(locale, c.backToCatalog)}</Link>
      </div>
    );
  }

  const handleAddToCart = (answers: Record<string, string>) => {
    addItem({
      productId: product.id,
      quantity: 1,
      technicalAnswers: answers,
      name: product.name,
      category: product.category,
      image: product.images?.[0] || '',
    });
    setIsModalOpen(false);
    navigate('/cart');
  };

  return (
    <div className="space-y-12 pb-20">
      <Link to="/catalog" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-premium-orange transition-colors group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> {t(locale, c.backToCatalog)}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <ProductGallery product={product} />
        <ProductInfo product={product} onOpenModal={() => setIsModalOpen(true)} />
      </div>

      <ProductRelated relatedProducts={relatedProducts} />

      <TechnicalQuestionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleAddToCart}
        productName={product.name}
        category={product.category}
      />
    </div>
  );
}