import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../types';
import CatalogHero from '../sections/catalog/CatalogHero';
import CatalogMain from '../sections/catalog/CatalogMain';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [sortedCategories, setSortedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.ok ? r.json() : []),
      fetch('/api/categories').then(r => r.ok ? r.json() : []),
    ]).then(([data, cats]: [any, any[]]) => {
        const active = Array.isArray(data) ? data.filter((p: any) => p.active !== 0) : [];
        setProducts(active);
        // Kategorileri API sıralamasına göre al
        const productCatSet = new Set(active.map((p: any) => p.category).filter(Boolean));
        const ordered = (Array.isArray(cats) ? cats : [])
          .filter((c: any) => c.active !== 0) // yalnız aktiv kateqoriyalar
          .map((c: any) => c.name)
          .filter((n: string) => productCatSet.has(n));
        // API'da olmayan kategorileri sona ekle
        const extra = Array.from(productCatSet).filter((c: any) => !ordered.includes(c));
        const allCats = [...ordered, ...extra] as string[];
        setSortedCategories(allCats);
        if (!searchParams.get('category') && allCats.length > 0) {
          setSelectedCategory(allCats[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = sortedCategories;

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLocaleLowerCase('en-US').includes(search.toLocaleLowerCase('en-US')) ||
                           p.description.toLocaleLowerCase('en-US').includes(search.toLocaleLowerCase('en-US'));
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory, products]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat) {
      searchParams.set('category', cat);
    } else {
      searchParams.delete('category');
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
