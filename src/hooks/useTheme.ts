import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';
import { Colors } from '@/constants';

export const useTheme = () => {
  const context = useContext(ThemeContext);

  // Provide fallback when used outside ThemeProvider (e.g., during app initialization)
  if (!context) {
    return {
      isDark: false,
      colors: Colors.light,
      toggleTheme: () => {}, // No-op fallback
    };
  }

  const colors = context.isDark ? Colors.dark : Colors.light;

  return {
    ...context,
    colors,
  };
};
