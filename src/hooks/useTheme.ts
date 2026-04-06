import { useContext, useMemo } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';
import { Colors, getLiturgicalTheme } from '@/constants/colors';
import { getLiturgicalMoment } from '@/services/liturgical/LiturgicalThemeService';
import { FEATURE_FLAGS } from '@/config/featureFlags';

export const useTheme = () => {
  const context = useContext(ThemeContext);

  const liturgical = useMemo(() => {
    if (!FEATURE_FLAGS.ENABLE_LITURGICAL_THEMES) return null;
    const moment = getLiturgicalMoment();
    return {
      moment,
      theme: getLiturgicalTheme(moment.season, moment.intensity),
    };
  }, []);

  // Provide fallback when used outside ThemeProvider (e.g., during app initialization)
  if (!context) {
    return {
      isDark: false,
      colors: Colors.light,
      liturgical,
      toggleTheme: () => {},
    };
  }

  const colors = context.isDark ? Colors.dark : Colors.light;

  return {
    ...context,
    colors,
    liturgical,
  };
};
