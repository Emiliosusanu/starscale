import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ShoppingCart from '@/components/ShoppingCart';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { playClickSound } from '@/utils/buttonSound';

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const selector = 'button, [role="button"], a, input[type="button"], input[type="submit"]';

    const handlePointerDown = (event) => {
      try {
        if (event.button !== undefined && event.button !== 0) return;
        const target = event.target;
        if (!target || typeof target.closest !== 'function') return;
        const el = target.closest(selector);
        if (!el) return;
        if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return;
        playClickSound();
      } catch {}
    };

    const handleKeyDown = (event) => {
      try {
        const key = event.key;
        if (key !== 'Enter' && key !== ' ') return;
        const target = event.target;
        if (!target || typeof target.closest !== 'function') return;
        const el = target.closest(selector);
        if (!el) return;
        if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return;
        playClickSound();
      } catch {}
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
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