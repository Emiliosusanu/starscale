import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ShoppingCart from '@/components/ShoppingCart';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Layout = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user, profile } = useAuth();
  const [resolvedTheme, setResolvedTheme] = useState('dark');

  useEffect(() => {
    const stored = typeof window !== 'undefined'
      ? window.localStorage.getItem('starscale.theme')
      : null;

    const pref = profile?.theme_preference || stored || 'dark';
    if (pref === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedTheme(prefersDark ? 'dark' : 'light');
    } else {
      setResolvedTheme(pref);
    }
  }, [profile?.theme_preference]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (event) => {
      const theme = event?.detail;
      if (!theme) return;

      if (theme === 'system' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(prefersDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    window.addEventListener('starscale-theme-change', handler);
    return () => window.removeEventListener('starscale-theme-change', handler);
  }, []);

  const themeClass =
    resolvedTheme === 'light'
      ? 'theme-light'
      : resolvedTheme === 'focus'
        ? 'theme-focus'
        : 'theme-dark';

  return (
    <div className={`min-h-screen text-gray-100 flex flex-col ${themeClass}`}>
      <div className="aurora-bg"></div>
      <Header onCartClick={() => setIsCartOpen(true)} />
      <main className="flex-grow">
        <Outlet />
      </main>
      {!user && <Footer />}
      <ShoppingCart isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />
    </div>
  );
};

export default Layout;