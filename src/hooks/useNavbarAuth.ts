import { useEffect, useState } from 'react';
import { apiFetch, TOKEN_KEY } from '../lib/apiFetch';

export interface NavUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function useNavbarAuth() {
  const [user, setUser] = useState<NavUser | null>(null);

  const fetchMe = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setUser(null); return; }
    try {
      const r = await apiFetch('/api/auth/me');
      setUser(r.ok ? await r.json() : null);
    } catch { setUser(null); }
  };

  useEffect(() => { fetchMe(); }, []);

  useEffect(() => {
    const onStorage = () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) { setUser(null); return; }
      fetchMe();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('auth-changed', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth-changed', onStorage);
    };
  }, []);

  return user;
}