import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../types';
import CatalogHero from '../sections/catalog/CatalogHero';
import CatalogMain from '../sections/catalog/CatalogMain';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'Hamısı');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.ok ? r.json() : [])
      .then((data: any) => {
        setProducts(Array.isArray(data) ? data.filter((p: any) => p.active !== 0) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return ['Hamısı', ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                           p.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'Hamısı' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory, products]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'Hamısı') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="pb-20">
      <CatalogHero />
      <CatalogMain
        search={search}
        setSearch={setSearch}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        filteredProducts={filteredProducts}
        categories={categories}
        loading={loading}
      />
    </div>
  );
}
