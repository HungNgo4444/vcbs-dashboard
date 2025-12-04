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
    // Use getSession() instead of getUser() - it reads from local storage, no network call
    // This prevents hanging when session is stale
    const initAuth = async () => {
      console.log('[useAuth] Initializing auth with getSession()...');

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('[useAuth] getSession result:', {
          hasSession: !!session,
          userId: session?.user?.id,
          error: error?.message
        });

        if (error) {
          console.error('[useAuth] Session error:', error);
          setState({ user: null, profile: null, isLoading: false, isAdmin: false });
          return;
        }

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            profile,
            isLoading: false,
            isAdmin: profile?.role === 'admin',
          });
        } else {
          setState({ user: null, profile: null, isLoading: false, isAdmin: false });
        }
      } catch (err) {
        console.error('[useAuth] Error initializing auth:', err);
        setState({ user: null, profile: null, isLoading: false, isAdmin: false });
      }
    };

    initAuth();

    // IMPORTANT: Do NOT use async in onAuthStateChange callback!
    // This is a known Supabase bug that causes hanging.
    // See: https://github.com/supabase/supabase/issues/35754
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[useAuth] Auth state changed:', event);

        if (session?.user) {
          // Use .then() instead of await to avoid async callback
          fetchProfile(session.user.id).then((profile) => {
            setState({
              user: session.user,
              profile,
              isLoading: false,
              isAdmin: profile?.role === 'admin',
            });
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
