import React from 'react';
import { Package, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Lead } from '../../types';
import { cn } from '../../lib/utils';
import { STATUS_COLORS, STATUS_LABELS } from '../../constants';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

interface ProfileOverviewProps {
  orders: Lead[];
  onViewAll: () => void;
}

export default function ProfileOverview({ orders, onViewAll }: ProfileOverviewProps) {
  const { locale } = useSiteContent();

  const labels = {
    totalOrders:    { az: 'Ümumi Sifariş',      en: 'Total Orders',        ru: 'Всего заказов',       tr: 'Toplam Sipariş' },
    pending:        { az: 'Gözləyən',           en: 'Pending',               ru: 'Ожидающие',           tr: 'Bekleyen' },
    completed:      { az: 'Tamamlanmış',        en: 'Completed',            ru: 'Завершённые',          tr: 'Tamamlandı' },
    recentOrders:    { az: 'Son Sifarişlər',     en: 'Recent Orders',        ru: 'Последние заказы',    tr: 'Son Siparişler' },
    viewAll:        { az: 'Hamısına bax',       en: 'View All',             ru: 'Смотреть все',        tr: 'Tümünü gör' },
    order:          { az: 'Sifariş',            en: 'Order',               ru: 'Заказ',               tr: 'Sipariş' },
    noOrders:       { az: 'Hələ heç bir sifarişiniz yoxdur.', en: 'You have no orders yet.', ru: 'У вас пока нет заказов.', tr: 'Henüz siparişiniz yok.' },
    statusNew:       { az: 'Yeni',              en: 'New',                  ru: 'Новый',               tr: 'Yeni' },
    statusContacted: { az: 'Əlaqə saxlanılıb', en: 'Contacted',            ru: 'Связано',            tr: 'İletişim kuruldu' },
    statusQuoted:    { az: 'Qiymət təklifi verilib', en: 'Quoted',          ru: 'Предложение отправлено', tr: 'Teklif verildi' },
    statusWon:       { az: 'Təsdiqlənib',      en: 'Confirmed',            ru: 'Подтверждено',        tr: 'Onaylandı' },
    statusLost:      { az: 'Ləğv edilib',       en: 'Cancelled',           ru: 'Отменено',            tr: 'İptal edildi' },
  };

  const statusLabelMap: Record<string, typeof labels.statusNew> = {
    new: labels.statusNew,
    contacted: labels.statusContacted,
    quoted: labels.statusQuoted,
    won: labels.statusWon,
    lost: labels.statusLost,
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] shadow-2xl shadow-black/20">
          <Package className="w-8 h-8 text-red-500 mb-4" />
          <p className="text-3xl font-bold">{orders.length}</p>
          <p className="text-sm text-white/70 font-medium">{t(locale, labels.totalOrders)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] shadow-2xl shadow-black/20">
          <Clock className="w-8 h-8 text-blue-500 mb-4" />
          <p className="text-3xl font-bold">{orders.filter(o => o.status === 'new').length}</p>
          <p className="text-sm text-white/70 font-medium">{t(locale, labels.pending)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] shadow-2xl shadow-black/20">
          <CheckCircle2 className="w-8 h-8 text-green-500 mb-4" />
          <p className="text-3xl font-bold">{orders.filter(o => o.status === 'won').length}</p>
          <p className="text-sm text-white/70 font-medium">{t(locale, labels.completed)}</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold tracking-tight">{t(locale, labels.recentOrders)}</h3>
          <button type="button" onClick={onViewAll} className="text-red-500 font-bold text-sm hover:underline">{t(locale, labels.viewAll)}</button>
        </div>
        <div className="space-y-4">
          {orders.slice(0, 3).map(order => (
            <div key={order.id} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white/70 shadow-sm">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-white">{t(locale, labels.order)} #{String(order.id).padStart(4, '0')}</p>
                  <p className="text-xs text-white/70">{order.createdAt && !isNaN(new Date(order.createdAt).getTime()) ? format(new Date(order.createdAt), 'dd MMM yyyy') : order.created_at && !isNaN(new Date(order.created_at).getTime()) ? format(new Date(order.created_at), 'dd MMM yyyy') : '—'}</p>
                </div>
              </div>
              <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold border capitalize", STATUS_COLORS[order.status])}>
                {statusLabelMap[order.status] ? t(locale, statusLabelMap[order.status]) : order.status}
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="text-center py-10 text-white/70">{t(locale, labels.noOrders)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
