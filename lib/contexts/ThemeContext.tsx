"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'dark',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  console.log('ThemeProvider: Rendering, theme:', theme, 'mounted:', mounted);

  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Apply theme whenever it changes
  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(resolved);

    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
      console.log('Theme applied:', resolved, 'classList:', root.classList.toString());
    }
  }, [theme]);

  // Load theme from localStorage on mount
  useEffect(() => {
    console.log('ThemeProvider: Loading theme from localStorage/database');
    const loadTheme = async () => {
      // Try localStorage first
      const localTheme = localStorage.getItem('theme') as Theme | null;
      console.log('ThemeProvider: localStorage theme:', localTheme);

      if (localTheme && ['light', 'dark', 'system'].includes(localTheme)) {
        console.log('ThemeProvider: Setting theme from localStorage:', localTheme);
        setThemeState(localTheme);
      } else {
        console.log('ThemeProvider: No localStorage theme, checking database');
        // Try to load from database
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('theme_preference')
              .eq('id', session.user.id)
              .single();

            if (profile?.theme_preference) {
              const dbTheme = profile.theme_preference as Theme;
              console.log('ThemeProvider: Setting theme from database:', dbTheme);
              setThemeState(dbTheme);
              localStorage.setItem('theme', dbTheme);
            }
          }
        } catch (error) {
          console.error('Error loading theme from database:', error);
        }
      }

      console.log('ThemeProvider: Setting mounted to true');
      setMounted(true);
    };

    loadTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        const resolved = getSystemTheme();
        setResolvedTheme(resolved);

        if (typeof window !== 'undefined') {
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(resolved);
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  // Set theme and persist
  const setTheme = async (newTheme: Theme) => {
    console.log('Setting theme to:', newTheme);
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    // Save to database if user is logged in
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        await supabase
          .from('profiles')
          .update({ theme_preference: newTheme })
          .eq('id', session.user.id);
      }
    } catch (error) {
      console.error('Error saving theme to database:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
