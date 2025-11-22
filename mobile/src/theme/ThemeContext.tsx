import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, ThemeColors } from './colors';

type Mode = 'light' | 'dark';

type ThemeContextValue = {
  mode: Mode;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'polyfield.theme.mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = Appearance.getColorScheme() as Mode | null;
  const [mode, setModeState] = useState<Mode>(system ?? 'light');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') setModeState(saved);
      } catch {}
    })();
  }, []);

  const setMode = async (m: Mode) => {
    setModeState(m);
    try { await AsyncStorage.setItem(STORAGE_KEY, m); } catch {}
  };

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    setMode,
    toggleMode: () => setMode(mode === 'light' ? 'dark' : 'light'),
    colors: colors[mode],
  }), [mode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
}
