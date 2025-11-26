import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all language files
import en from './locales/en/translation.json';
import es from './locales/es/translation.json';
import fr from './locales/fr/translation.json';
import de from './locales/de/translation.json';
import it from './locales/it/translation.json';
import pt from './locales/pt/translation.json';
import ru from './locales/ru/translation.json';
import zhCN from './locales/zh-CN/translation.json';
import zhTW from './locales/zh-TW/translation.json';
import ja from './locales/ja/translation.json';
import ko from './locales/ko/translation.json';
import ar from './locales/ar/translation.json';
import hi from './locales/hi/translation.json';
import vi from './locales/vi/translation.json';
import th from './locales/th/translation.json';
import pl from './locales/pl/translation.json';
import nl from './locales/nl/translation.json';
import tr from './locales/tr/translation.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  pt: { translation: pt },
  ru: { translation: ru },
  'zh-CN': { translation: zhCN },
  'zh-TW': { translation: zhTW },
  ja: { translation: ja },
  ko: { translation: ko },
  ar: { translation: ar },
  hi: { translation: hi },
  vi: { translation: vi },
  th: { translation: th },
  pl: { translation: pl },
  nl: { translation: nl },
  tr: { translation: tr },
};

const detectionOptions = {
  order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
  caches: ['localStorage'],
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',
    ns: ['translation'],
    detection: detectionOptions,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    },
  });

export default i18n;
