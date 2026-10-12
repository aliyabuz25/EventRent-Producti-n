import React, { useState } from 'react';
import { Save, Shield, Eye, EyeOff, Check } from 'lucide-react';
import { DbUser } from '../../pages/Profile';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';
import { apiFetch } from '../../lib/apiFetch';

interface ProfileSettingsProps {
  user: DbUser;
  displayName: string;
  setDisplayName: (name: string) => void;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  saveMsg?: 'ok' | 'err' | null;
}

export default function ProfileSettings({ user, displayName, setDisplayName, isSaving, onSubmit, saveMsg = null }: ProfileSettingsProps) {
  const { locale } = useSiteContent();
  const [curPass, setCurPass]     = useState('');
  const [newPass, setNewPass]     = useState('');
  const [showCur, setShowCur]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [passMsg, setPassMsg]     = useState<{ type: 'ok'|'err'; text: string } | null>(null);
  const [passSaving, setPassSaving] = useState(false);

  const L = {
    accountSettings: { az: 'Hesab Ayarları',       en: 'Account Settings',  ru: 'Настройки аккаунта', tr: 'Hesap Ayarları' },
    fullName:        { az: 'Ad Soyad',              en: 'Full Name',         ru: 'Имя Фамилия',        tr: 'Ad Soyad' },
    namePlaceholder: { az: 'Adınızı daxil edin',    en: 'Enter your name',   ru: 'Введите ваше имя',   tr: 'Adınızı girin' },
    email:           { az: 'Email',                 en: 'Email',             ru: 'Email',              tr: 'E-posta' },
    saving:          { az: 'Saxlanılır...',          en: 'Saving...',         ru: 'Сохранение...',      tr: 'Kaydediliyor...' },
    savedOk:         { az: 'Saxlandı ✓',            en: 'Saved ✓',           ru: 'Сохранено ✓',        tr: 'Kaydedildi ✓' },
    savedErr:        { az: 'Xəta baş verdi',         en: 'Error saving',      ru: 'Ошибка сохранения',  tr: 'Kaydetme hatası' },
    save:            { az: 'Yadda saxla',            en: 'Save',              ru: 'Сохранить',          tr: 'Kaydet' },
    security:        { az: 'Təhlükəsizlik',          en: 'Security',          ru: 'Безопасность',       tr: 'Güvenlik' },
    curPass:         { az: 'Mövcud şifrə',           en: 'Current Password',  ru: 'Текущий пароль',     tr: 'Mevcut şifre' },
    newPass:         { az: 'Yeni şifrə',             en: 'New Password',      ru: 'Новый пароль',       tr: 'Yeni şifre' },
    updatePass:      { az: 'Şifrəni Yenilə',         en: 'Update Password',   ru: 'Обновить пароль',    tr: 'Şifreyi Güncelle' },
    passOk:          { az: 'Şifrə yeniləndi ✓',     en: 'Password updated ✓',ru: 'Пароль обновлён ✓',  tr: 'Şifre güncellendi ✓' },
    passErr:         { az: 'Xəta baş verdi',          en: 'Error',            ru: 'Ошибка',             tr: 'Hata' },
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    setPassSaving(true);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: curPass, new_password: newPass }),
      });
      const data = await res.json();
      if (res.ok) {
        setPassMsg({ type: 'ok', text: t(locale, L.passOk) });
        setCurPass(''); setNewPass('');
      } else {
        setPassMsg({ type: 'err', text: data.error || t(locale, L.passErr) });
      }
    } catch { setPassMsg({ type: 'err', text: t(locale, L.passErr) }); }
    finally { setPassSaving(false); }
  };

  const saveMsgText = saveMsg === 'ok' ? t(locale, L.savedOk) : saveMsg === 'err' ? t(locale, L.savedErr) : null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-[40px] p-10 shadow-2xl shadow-black/20 space-y-10">
      <h2 className="text-3xl font-bold tracking-tighter">{t(locale, L.accountSettings)}</h2>

      {/* Profile form */}
      <form onSubmit={onSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">{t(locale, L.fullName)}</label>
            <input
              type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:outline-none focus:bg-white/10 focus:border-premium-orange transition-all placeholder:text-white/50"
              placeholder={t(locale, L.namePlaceholder)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">{t(locale, L.email)}</label>
            <input type="email" value={user.email} disabled
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white/40 cursor-not-allowed opacity-50" />
          </div>
        </div>

        {saveMsgText && (
          <p className={`text-sm font-bold ${saveMsg === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{saveMsgText}</p>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={isSaving}
            onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--x', `${e.clientX-r.left}px`); e.currentTarget.style.setProperty('--y', `${e.clientY-r.top}px`); }}
            onMouseLeave={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--x', `${e.clientX-r.left}px`); e.currentTarget.style.setProperty('--y', `${e.clientY-r.top}px`); }}
            className="group relative overflow-hidden cursor-pointer flex items-center gap-3 bg-white text-black px-10 py-4 rounded-[24px] font-black hover:text-white transition-colors duration-500 disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-premium-orange pointer-events-none z-0 [clip-path:circle(0px_at_var(--x,50%)_var(--y,50%))] group-hover:[clip-path:circle(150%_at_var(--x,50%)_var(--y,50%))] transition-[clip-path] duration-500 ease-out" />
            <span className="relative z-10 flex items-center gap-2">
              <Save className="w-5 h-5" />
              {isSaving ? t(locale, L.saving) : t(locale, L.save)}
            </span>
          </button>
        </div>
      </form>

      {/* Change Password */}
      <div className="pt-10 border-t border-white/10 space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-3"><Shield className="w-5 h-5 text-white/40" /> {t(locale, L.security)}</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1">{t(locale, L.curPass)}</label>
              <div className="relative">
                <input type={showCur ? 'text' : 'password'} required value={curPass} onChange={e => setCurPass(e.target.value)}
                  className="w-full px-6 py-4 pr-12 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:outline-none focus:border-premium-orange/50 transition-all"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowCur(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1">{t(locale, L.newPass)}</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} required minLength={6} value={newPass} onChange={e => setNewPass(e.target.value)}
                  className="w-full px-6 py-4 pr-12 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:outline-none focus:border-premium-orange/50 transition-all"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          {passMsg && (
            <p className={`text-sm font-bold flex items-center gap-2 ${passMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
              {passMsg.type === 'ok' && <Check className="w-4 h-4" />} {passMsg.text}
            </p>
          )}
          <button type="submit" disabled={passSaving}
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-2xl transition-all flex items-center gap-2 disabled:opacity-50">
            <Shield className="w-4 h-4" />
            {passSaving ? t(locale, L.saving) : t(locale, L.updatePass)}
          </button>
        </form>
      </div>
    </div>
  );
}