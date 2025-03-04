import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDarkMode: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const { user } = useAuth();

  const getThemeKey = () => {
    return user ? `theme_${user.id}` : 'theme_default';
  };

  useEffect(() => {
    loadTheme();
  }, [user]); // Reload theme when user changes

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(getThemeKey());
      if (savedTheme) {
        setTheme(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(getThemeKey(), newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode: theme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 