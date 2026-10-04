import React from 'react';
import { User as UserIcon, LayoutDashboard, Package, Settings, HelpCircle, LogOut, Shield, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DbUser } from '../../pages/Profile';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

interface ProfileSidebarProps {
  user: DbUser;
  isPremium: boolean;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  ordersCount: number;
  onLogout: () => void;
}

export default function ProfileSidebar({ user, isPremium, activeTab, setActiveTab, ordersCount, onLogout }: ProfileSidebarProps) {
  const { locale } = useSiteContent();

  const labels = {
    menuOverview:    { az: 'İcmal',          en: 'Overview',         ru: 'Обзор',              tr: 'Genel Bakış' },
    menuOrders:      { az: 'Sifarişlərim',   en: 'My Orders',        ru: 'Мои заказы',         tr: 'Siparişlerim' },
    menuSettings:    { az: 'Ayarlar',        en: 'Settings',         ru: 'Настройки',          tr: 'Ayarlar' },
    menuSupport:     { az: 'Dəstək',         en: 'Support',          ru: 'Поддержка',          tr: 'Destek' },
    logout:          { az: 'Çıxış',          en: 'Logout',           ru: 'Выйти',              tr: 'Çıkış yap' },
    accountStatus:   { az: 'Hesab Statusu',  en: 'Account Status',   ru: 'Статус аккаунта',    tr: 'Hesap Durumu' },
    premiumCustomer: { az: 'Premium Müştəri',en: 'Premium Customer', ru: 'Премиум клиент',     tr: 'Premium Müşteri' },
    normalCustomer:  { az: 'Standart Müştəri',en:'Standard Customer',ru: 'Стандартный клиент', tr: 'Standart Müşteri' },
    premiumBanner:   { az: 'Siz bizim sadiq müştərimizsiniz. Bütün xidmətlərdə 5% endirim əldə edirsiniz.', en: 'You are our valued customer. You get a 5% discount on all services.', ru: 'Вы наш ценный клиент. Вы получаете скидку 5% на все услуги.', tr: 'Değerli müşterimizsiniz. Tüm hizmetlerde %5 indirim kazanıyorsunuz.' },
    normalBanner:    { az: 'Standart hesab. Premium üçün bizimlə əlaqə saxlayın.', en: 'Standard account. Contact us to upgrade to Premium.', ru: 'Стандартный аккаунт. Свяжитесь с нами для перехода на Premium.', tr: 'Standart hesap. Premium için bizimle iletişime geçin.' },
  };

  const menuItems = [
    { id: 'overview', label: t(locale, labels.menuOverview), icon: LayoutDashboard },
    { id: 'orders',   label: t(locale, labels.menuOrders),   icon: Package, count: ordersCount },
    { id: 'settings', label: t(locale, labels.menuSettings), icon: Settings },
    { id: 'support',  label: t(locale, labels.menuSupport),  icon: HelpCircle },
  ];

  const initials = (user.name || user.email || '?').split(' ').map((w: string) => w[0] || '').join('').slice(0, 2).toUpperCase();

  return (
    <aside className="lg:w-80 space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 shadow-2xl shadow-black/20 space-y-8">
        {/* Avatar + Name */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-premium-orange to-red-700 rounded-[32px] flex items-center justify-center text-white text-2xl font-black shadow-xl">
              {initials || <UserIcon className="w-10 h-10" />}
            </div>
            {isPremium && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <Star className="w-4 h-4 text-yellow-900 fill-yellow-900" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{user.name}</h3>
            <p className="text-sm text-white/50 font-medium">{user.email}</p>
            <span className={cn(
              'inline-block mt-1 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full',
              user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
              user.role === 'sales' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-white/10 text-white/40'
            )}>
              {user.role === 'admin' ? 'Admin' : user.role === 'sales' ? 'Satış' : 'Standart'}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button type="button" key={item.id} onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center justify-between px-6 py-4 rounded-2xl text-sm font-bold transition-all group',
                activeTab === item.id
                  ? 'bg-black text-white shadow-xl shadow-black/10'
                  : 'text-white/70 hover:bg-white/5 hover:text-premium-orange'
              )}>
              <div className="flex items-center gap-4">
                <item.icon className={cn('w-5 h-5', activeTab === item.id ? 'text-red-500' : 'group-hover:text-red-500')} />
                {item.label}
              </div>
              {item.count !== undefined && (
                <span className={cn('px-2 py-0.5 rounded-lg text-[10px]', activeTab === item.id ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50')}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
          <button type="button" onClick={onLogout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all mt-4">
            <LogOut className="w-5 h-5" /> {t(locale, labels.logout)}
          </button>
        </nav>
      </div>

      {/* Premium / Normal Status Card */}
      <div className={cn(
        'rounded-[40px] p-8 text-white space-y-4 shadow-2xl',
        isPremium ? 'bg-red-600 shadow-red-600/20' : 'bg-white/5 border border-white/10'
      )}>
        <div className="flex items-center gap-4">
          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', isPremium ? 'bg-white/20' : 'bg-white/10')}>
            {isPremium ? <Shield className="w-6 h-6" /> : <UserIcon className="w-6 h-6 text-white/50" />}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">{t(locale, labels.accountStatus)}</p>
            <p className={cn('text-lg font-bold', !isPremium && 'text-white/70')}>
              {isPremium ? t(locale, labels.premiumCustomer) : t(locale, labels.normalCustomer)}
            </p>
          </div>
        </div>
        <p className={cn('text-sm leading-relaxed', isPremium ? 'opacity-80' : 'text-white/40')}>
          {isPremium ? t(locale, labels.premiumBanner) : t(locale, labels.normalBanner)}
        </p>
      </div>
    </aside>
  );
}