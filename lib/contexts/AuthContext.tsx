"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  checkSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/auth/login');
      } else if (event === 'TOKEN_REFRESHED') {
        if (!session) {
          setUser(null);
          router.push('/auth/login');
        } else {
          setUser(session.user);
        }
      } else if (event === 'SIGNED_IN') {
        setUser(session?.user || null);
        setLoading(false);
      } else if (event === 'USER_UPDATED') {
        setUser(session?.user || null);
      }
    });

    // Check session every 5 minutes
    const interval = setInterval(() => {
      checkSession();
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Session error:', error);
        setUser(null);

        // Only redirect to login if we're not already on auth pages
        if (!window.location.pathname.startsWith('/auth/')) {
          router.push('/auth/login');
        }
        return;
      }

      if (!session) {
        setUser(null);
        if (!window.location.pathname.startsWith('/auth/')) {
          router.push('/auth/login');
        }
      } else {
        // Check if token is expired
        const expiresAt = session.expires_at;
        if (expiresAt && new Date(expiresAt * 1000) < new Date()) {
          console.log('Session expired, refreshing...');
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError || !refreshedSession) {
            console.error('Failed to refresh session:', refreshError);
            setUser(null);
            router.push('/auth/login');
          } else {
            setUser(refreshedSession.user);
          }
        } else {
          setUser(session.user);
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}