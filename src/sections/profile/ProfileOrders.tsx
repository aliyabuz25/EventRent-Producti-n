import React from 'react';
import { Clock, Package, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Lead } from '../../types';
import { cn } from '../../lib/utils';

import { STATUS_COLORS } from '../../constants';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

interface ProfileOrdersProps {
  orders: Lead[];
}

export default function ProfileOrders({ orders }: ProfileOrdersProps) {
  const { locale } = useSiteContent();

  const labels = {
    myOrders:        { az: 'Sifarişlərim',          en: 'My Orders',            ru: 'Мои заказы',            tr: 'Siparişlerim' },
    orderId:         { az: 'ID:',                  en: 'ID:',                  ru: 'ID:',                   tr: 'ID:' },
    product:         { az: 'Məhsul',               en: 'Product',              ru: 'Товар',                 tr: 'Ürün' },
    quantity:        { az: 'ədəd',                en: 'pcs',                  ru: 'шт.',                   tr: 'adet' },
    location:        { az: 'Məkan',                en: 'Location',             ru: 'Место',                 tr: 'Yer' },
    date:            { az: 'Tarix',                en: 'Date',                 ru: 'Дата',                   tr: 'Tarih' },
    notSpecified:    { az: 'Qeyd edilməyib',        en: 'Not specified',        ru: 'Не указано',            tr: 'Belirtilmemiş' },
    noOrders:        { az: 'Hələ heç bir sifarişiniz yoxdur.', en: 'You have no orders yet.', ru: 'У вас пока нет заказов.', tr: 'Henüz siparişiniz yok.' },
    statusNew:       { az: 'Yeni',                 en: 'New',                  ru: 'Новый',                 tr: 'Yeni' },
    statusContacted: { az: 'Əlaqə saxlanılıb',    en: 'Contacted',            ru: 'Связано',              tr: 'İletişim kuruldu' },
    statusQuoted:    { az: 'Qiymət təklifi verilib', en: 'Quoted',            ru: 'Предложение отправлено', tr: 'Teklif verildi' },
    statusWon:       { az: 'Təsdiqlənib',          en: 'Confirmed',            ru: 'Подтверждено',          tr: 'Onaylandı' },
    statusLost:      { az: 'Ləğv edilib',           en: 'Cancelled',           ru: 'Отменено',              tr: 'İptal edildi' },
  };

  const statusLabelMap: Record<string, typeof labels.statusNew> = {
    new: labels.statusNew,
    contacted: labels.statusContacted,
    quoted: labels.statusQuoted,
    won: labels.statusWon,
    lost: labels.statusLost,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tighter">{t(locale, labels.myOrders)}</h2>
      <div className="grid gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white/5 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl shadow-black/20 group">
            <div className="p-8 space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{t(locale, labels.orderId)} #{String(order.id).padStart(4, '0')}</p>
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <Clock className="w-4 h-4" />
                    {(order.createdAt || order.created_at) && !isNaN(new Date(order.createdAt || order.created_at!).getTime()) ? format(new Date(order.createdAt || order.created_at!), 'dd MMMM yyyy, HH:mm') : '—'}
                  </div>
                </div>
                <div className={cn("px-6 py-2 rounded-2xl text-xs font-bold border", STATUS_COLORS[order.status])}>
                  {statusLabelMap[order.status] ? t(locale, statusLabelMap[order.status]) : order.status}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
{(order.items ?? []).map((item, idx) => {
                   return (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-3xl border border-white/10">
                       <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                         {item.image ? (
                           <img src={item.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                         ) : (
                           <Package className="w-6 h-6 text-white/50" />
                         )}
                       </div>
                       <div className="min-w-0">
                         <p className="text-xs font-bold text-white truncate">{item.name || t(locale, labels.product)}</p>
                         <p className="text-[10px] text-white/70">{item.quantity} {t(locale, labels.quantity)}</p>
                       </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-8 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/70">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{t(locale, labels.location)}</p>
                    <p className="text-sm text-white font-bold">{order.location || t(locale, labels.notSpecified)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/70">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{t(locale, labels.date)}</p>
                    <p className="text-sm text-white font-bold">
                      {order.eventDate && !isNaN(new Date(order.eventDate).getTime()) ? format(new Date(order.eventDate), 'dd MMMM yyyy') : t(locale, labels.notSpecified)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="bg-white/5 border border-white/10 rounded-[40px] p-20 text-center space-y-6 shadow-2xl shadow-black/20">
            <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto text-white/60">
              <Package className="w-10 h-10" />
            </div>
            <p className="text-xl text-white/70 font-light">{t(locale, labels.noOrders)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
