import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Initialize theme immediately to avoid flash
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      return saved || 'dark'; // Default to dark theme
    }
    return 'dark';
  });

  useEffect(() => {
    // Set theme on document immediately
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Also set body background for immediate effect
    document.body.style.backgroundColor = theme === 'dark' ? '#0a0a0a' : '#ffffff';
    document.body.style.color = theme === 'dark' ? '#ffffff' : '#0f172a';
    
    if (import.meta.env.DEV) {
      console.log('[ThemeProvider] Theme set to:', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
