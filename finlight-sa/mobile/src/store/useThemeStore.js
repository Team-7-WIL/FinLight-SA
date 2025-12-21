import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../config/theme';

const useThemeStore = create((set, get) => ({
  isDark: false,
  theme: lightTheme,

  initTheme: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        const isDark = savedTheme === 'dark';
        set({
          isDark,
          theme: isDark ? darkTheme : lightTheme,
        });
      } else {
        // Default to light theme
        set({
          isDark: false,
          theme: lightTheme,
        });
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  },

  toggleTheme: async () => {
    const newIsDark = !get().isDark;
    const newTheme = newIsDark ? darkTheme : lightTheme;
    
    await AsyncStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    
    set({
      isDark: newIsDark,
      theme: newTheme,
    });
  },

  setTheme: async (isDark) => {
    const newTheme = isDark ? darkTheme : lightTheme;
    
    await AsyncStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    set({
      isDark,
      theme: newTheme,
    });
  },
}));

export default useThemeStore;