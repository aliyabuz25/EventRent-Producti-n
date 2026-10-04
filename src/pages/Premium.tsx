import React, { useState, useEffect } from 'react';
import { ShieldCheck, Phone, Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function Premium() {
  const [step, setStep] = useState<'phone' | 'otp' | 'content'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let interval: any;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Düzgün telefon nömrəsi daxil edin');
      return;
    }
    setStep('otp');
    setTimer(60);
    setError(null);
    setAttempts(0);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attempts >= 3) {
      setError('Çox sayda yanlış cəhd. Bloklandınız.');
      return;
    }
    if (otp.length < 4) {
      setError('Düzgün kod daxil edin.');
      return;
    }
    setStep('content');
    setError(null);
  };

  if (step === 'content') {
    return (
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Premium Kontent</h1>
          <p className="text-gray-500">Xoş gəlmisiniz! Sizin üçün özəl hazırlanmış materiallar.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl shadow-black/5 hover:shadow-2xl transition-all group">
              <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-black/10">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-4">Eksklüziv Təklif #{i}</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Bu kontent yalnız təsdiqləmiş istifadəçilər üçün əlçatandır. Tədbir təşkilatçılığı üçün gizli məsləhətlər.
              </p>
              <button className="flex items-center gap-2 text-sm font-bold text-black group-hover:gap-3 transition-all">
                Daha çox <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-20 space-y-12">
      <header className="text-center space-y-4">
        <div className="w-16 h-16 bg-black text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-black/20">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Qorumalı Kontent</h1>
        <p className="text-gray-500">Premium materiallara daxil olmaq üçün nömrənizi daxil edin.</p>
      </header>

      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-2xl shadow-black/5">
        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Telefon Nömrəsi</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  placeholder="+994 -- --- -- --"
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-500 rounded-xl text-xs font-medium">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <button className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-black/10">
              Davam et
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="space-y-2 text-center">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Təsdiq Kodu</label>
              <div className="flex justify-center gap-2">
                <input
                  required
                  maxLength={4}
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className="w-32 text-center text-2xl font-bold tracking-[1em] py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  placeholder="----"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {timer > 0 ? `Kodun bitməsinə qalan vaxt: ${timer} san` : 'Kodun vaxtı bitdi. Yenidən göndərin.'}
              </p>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-500 rounded-xl text-xs font-medium">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <button
              disabled={timer === 0 || attempts >= 3}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-black/10 disabled:opacity-50"
            >
              Təsdiqlə
            </button>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-sm font-bold text-gray-400 hover:text-black transition-colors"
            >
              Nömrəni dəyiş
            </button>
          </form>
        )}
      </div>
    </div>
  );
}