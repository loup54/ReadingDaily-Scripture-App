import { NativeModules, Platform } from 'react-native';
import { DailyReadings } from '@/types/reading.types';
import { getLiturgicalMoment } from '@/services/liturgical/LiturgicalThemeService';
import { getLiturgicalTheme } from '@/constants/colors';

const APP_GROUP = 'group.com.readingdaily.scripture';
const STORAGE_KEY = 'todayReading';
const EXCERPT_LENGTH = 300;

function excerpt(content: string): string {
  if (content.length <= EXCERPT_LENGTH) return content;
  return content.slice(0, EXCERPT_LENGTH).trimEnd() + '…';
}

/**
 * Mirrors today's reading + liturgical theme into the platform widget's shared
 * storage (iOS: App Group via ExtensionStorage; Android: plain SharedPreferences
 * via the native WidgetDataModule, since Android widgets run in the same app
 * process/sandbox and don't need an App Group equivalent) so neither widget
 * needs Firestore/JS access of its own. Best-effort — never throws into the caller.
 */
export async function updateWidgetData(readings: DailyReadings): Promise<void> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

  const moment = getLiturgicalMoment(readings.date);
  const theme = getLiturgicalTheme(moment.season, moment.intensity);

  const payload = {
    date: readings.date.toISOString(),
    seasonLabel: moment.label,
    accent: theme.accent,
    labelColor: theme.labelColor,
    backgroundGradientTop: theme.backgroundGradient[0],
    backgroundGradientBottom: theme.backgroundGradient[1],
    firstReadingTitle: readings.firstReading.title,
    firstReadingReference: readings.firstReading.reference,
    firstReadingExcerpt: excerpt(readings.firstReading.content),
  };

  if (Platform.OS === 'ios') {
    const { ExtensionStorage } = await import('@bacons/apple-targets');
    const storage = new ExtensionStorage(APP_GROUP);
    storage.set(STORAGE_KEY, JSON.stringify(payload));
    ExtensionStorage.reloadWidget();
  } else {
    const { WidgetDataModule } = NativeModules;
    WidgetDataModule.set(STORAGE_KEY, JSON.stringify(payload));
    WidgetDataModule.reloadWidget();
  }
}
