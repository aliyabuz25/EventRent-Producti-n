import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { CircleFlag } from 'react-circle-flags';

// Əsas ölkələr - ehtiyac olduqca artırıla bilər
export const COUNTRIES = [
  { code: 'AZ', name: 'Azərbaycan', dialCode: '+994' },
  { code: 'TR', name: 'Türkiyə', dialCode: '+90' },
  { code: 'RU', name: 'Rusiya', dialCode: '+7' },
  { code: 'US', name: 'ABŞ', dialCode: '+1' },
  { code: 'GB', name: 'Böyük Britaniya', dialCode: '+44' },
  { code: 'DE', name: 'Almaniya', dialCode: '+49' },
  { code: 'AE', name: 'BƏƏ', dialCode: '+971' },
  { code: 'GE', name: 'Gürcüstan', dialCode: '+995' },
  { code: 'KZ', name: 'Qazaxıstan', dialCode: '+7' },
  { code: 'UZ', name: 'Özbəkistan', dialCode: '+998' }
];

interface PhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  theme?: 'light' | 'dark';
}

export default function PhoneInput({ value, onChange, className, theme = 'dark' }: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const defaultCountry = COUNTRIES[0];
  const selectedCountry = COUNTRIES.find(c => value.startsWith(c.dialCode)) || defaultCountry;
  const displayValue = value.startsWith(selectedCountry.dialCode) ? value.slice(selectedCountry.dialCode.length).trim() : value;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCountrySelect = (c: typeof COUNTRIES[0]) => {
    setOpen(false); setSearch('');
    onChange(`${c.dialCode}${displayValue}`);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    onChange(`${selectedCountry.dialCode}${val}`);
  };

  const filtered = COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.dialCode.includes(search));

  const isLight = theme === 'light';

  return (
    <div className={`relative flex items-stretch w-full ${className}`} ref={containerRef}>
      {/* Dropdown Toggle */}
      <button type="button" onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 flex-shrink-0 transition-colors focus:outline-none border-r ${isLight ? 'border-gray-300 hover:bg-gray-50' : 'border-white/[0.08] hover:bg-white/[0.03]'}`}>
        <div style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '50%' }}>
          <CircleFlag countryCode={selectedCountry.code.toLowerCase()} height="16" />
        </div>
        <span className={`text-sm font-semibold ${isLight ? 'text-gray-700' : 'text-white'}`}>{selectedCountry.dialCode}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isLight ? 'text-gray-500' : 'text-white/50'} ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Nömrə input */}
      <input type="tel" value={displayValue} onChange={handlePhoneChange} placeholder="50 000 00 00"
        className={`flex-1 w-full bg-transparent px-4 py-3 text-sm focus:outline-none min-w-0 ${isLight ? 'text-gray-900 placeholder:text-gray-400' : 'text-white placeholder:text-white/20'}`} />

      {/* Dropdown Panel */}
      {open && (
        <div className={`absolute top-full left-0 mt-1 w-[260px] rounded-xl shadow-xl z-50 overflow-hidden border ${isLight ? 'bg-white border-gray-200' : 'bg-[#1a1a1a] border-white/10'}`} style={{ zIndex: 99999 }}>
          <div className={`p-2 border-b ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
            <div className="relative">
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
              <input type="text" placeholder="Ölkə axtar..." value={search} onChange={e => setSearch(e.target.value)} autoFocus
                className={`w-full rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${isLight ? 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400' : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-premium-orange/50'}`} />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className={`p-3 text-center text-xs ${isLight ? 'text-gray-400' : 'text-white/40'}`}>Tapılmadı</div>
            ) : (
              filtered.map(c => (
                <button key={c.code} type="button" onClick={() => handleCountrySelect(c)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${selectedCountry.code === c.code ? (isLight ? 'bg-blue-50 text-blue-600' : 'bg-premium-orange/10 text-premium-orange') : (isLight ? 'text-gray-700 hover:bg-gray-50' : 'text-white/80 hover:bg-white/10')}`}>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '50%' }}>
                      <CircleFlag countryCode={c.code.toLowerCase()} height="16" />
                    </div>
                    <span className="font-medium text-xs">{c.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold ${selectedCountry.code === c.code ? (isLight ? 'text-blue-600' : 'text-premium-orange') : (isLight ? 'text-gray-400' : 'text-white/40')}`}>{c.dialCode}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
