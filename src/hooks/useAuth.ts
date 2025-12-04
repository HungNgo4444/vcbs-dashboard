'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAdmin: false,
  });

  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Debug logging
    console.log('Fetching profile for userId:', userId);
    console.log('Profile result:', profile);
    if (error) {
      console.error('Profile fetch error:', error);
    }

    return profile as Profile | null;
  }, [supabase]);

  useEffect(() => {
    const getUser = async () => {
      console.log('[useAuth] Getting user...');
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('[useAuth] getUser result:', { userId: user?.id, error: error?.message });

      if (user) {
        const profile = await fetchProfile(user.id);
        console.log('[useAuth] Setting state with user:', user.id);
        setState({
          user,
          profile,
          isLoading: false,
          isAdmin: profile?.role === 'admin',
        });
      } else {
        console.log('[useAuth] No user found, setting isLoading: false');
        setState({
          user: null,
          profile: null,
          isLoading: false,
          isAdmin: false,
        });
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            profile,
            isLoading: false,
            isAdmin: profile?.role === 'admin',
          });
        } else {
          setState({
            user: null,
            profile: null,
            isLoading: false,
            isAdmin: false,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    ...state,
    signIn,
    signOut,
  };
}
