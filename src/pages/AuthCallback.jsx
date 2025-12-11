import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [working, setWorking] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const next = params.get('next') || '/store';
        const code = params.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession({ code });
          if (error) throw error;
          toast({ title: 'Welcome!', description: 'You are now signed in.' });
          navigate(next, { replace: true });
          return;
        }

        // Fallback: if already authenticated, just redirect
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate(next, { replace: true });
          return;
        }

        // No code and no session
        toast({ variant: 'destructive', title: 'Sign-in failed', description: 'Invalid or expired link. Please log in again.' });
        navigate('/login', { replace: true });
      } catch (e) {
        toast({ variant: 'destructive', title: 'Sign-in failed', description: e?.message || 'Please try logging in again.' });
        navigate('/login', { replace: true });
      } finally {
        setWorking(false);
      }
    };

    run();
  }, [location.search, navigate, toast]);

  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#0A0A0A]">
      <div className="flex flex-col items-center text-white">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
        <p className="mt-3 text-sm text-gray-400">Finalizing sign-in…</p>
      </div>
    </div>
  );
};

export default AuthCallback;
