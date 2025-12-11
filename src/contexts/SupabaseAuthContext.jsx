
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) return null;
    // Try to fetch profile, retry once if needed
    for (let i = 0; i < 3; i++) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) return data;

      // If error is strictly "no rows found" (PGRST116), it might mean the trigger hasn't fired yet.
      // If it's another error (e.g. 401, network), we probably shouldn't retry blindly.
      if (error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        break; 
      }

      await sleep(500 * (i + 1));
    }
    return null;
  }, []);

  const handleAuthStateChange = useCallback(async (event, newSession) => {
    // Only set loading true if we are actually changing users or initial load
    // This prevents flicker on token refreshes
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setLoading(true);
    }

    setSession(newSession);
    const currentUser = newSession?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      // Optimistic check: if we already have a profile and ID matches, don't refetch unless explicit
      if (profile?.id !== currentUser.id) {
          const userProfile = await fetchUserProfile(currentUser.id);
          setProfile(userProfile);
      }
    } else {
      setProfile(null);
    }
    
    setLoading(false);
  }, [fetchUserProfile, profile]);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        if (!mounted) return;
        if (initialSession) {
            handleAuthStateChange('INITIAL_SESSION', initialSession);
        } else {
            setLoading(false);
        }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        handleAuthStateChange(event, session);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [handleAuthStateChange]);

  const signUp = useCallback(async (email, password, options) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...options,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/store`,
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
    } else {
       toast({
        title: "Sign up successful!",
        description: "Please check your email to confirm your account.",
      });
    }
    return { error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Invalid credentials. Please try again.",
      });
    }
    return { error };
  }, [toast]);
  
  const signOut = useCallback(async () => {
    await supabase.auth.signOut({ scope: 'global' });
    setProfile(null);
    setSession(null);
    setUser(null);
    window.location.href = '/';
  }, []);

  const value = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  }), [session, user, profile, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
