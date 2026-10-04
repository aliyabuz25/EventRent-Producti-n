import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (msg: string) => void;
  error:   (msg: string) => void;
  info:    (msg: string) => void;
}

const ToastCtx = createContext<ToastContextValue>({ success: () => {}, error: () => {}, info: () => {} });

export function useToast() { return useContext(ToastCtx); }

let _id = 0;

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  info:    AlertCircle,
};

const COLORS = {
  success: { icon: '#22c55e', bar: '#22c55e' },
  error:   { icon: '#ef4444', bar: '#ef4444' },
  info:    { icon: '#3b82f6', bar: '#3b82f6' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((type: ToastType, message: string) => {
    const id = ++_id;
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);

  const remove = (id: number) => setToasts(p => p.filter(t => t.id !== id));

  const ctx: ToastContextValue = {
    success: msg => add('success', msg),
    error:   msg => add('error',   msg),
    info:    msg => add('info',    msg),
  };

  return (
    <ToastCtx.Provider value={ctx}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map(t => {
            const Icon = ICONS[t.type];
            const color = COLORS[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                className="relative bg-white rounded-2xl shadow-2xl shadow-black/10 pointer-events-all overflow-hidden"
                style={{ minWidth: 280, maxWidth: 400 }}
              >
                {/* Progress bar */}
                <motion.div
                  className="absolute bottom-0 left-0 h-[3px] rounded-full"
                  style={{ background: color.bar, originX: 0 }}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 3, ease: 'linear' }}
                />

                <div className="flex items-center gap-3 px-5 py-4">
                  <Icon className="w-5 h-5 shrink-0" style={{ color: color.icon }} />
                  <span className="flex-1 text-sm font-bold text-gray-800">{t.message}</span>
                  <button
                    onClick={() => remove(t.id)}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}