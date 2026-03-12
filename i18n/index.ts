import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {findBestLanguageTag} from 'react-native-localize';

import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import hi from './locales/hi.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';

const resources = {en, de, fr, es, hi, ta, te, kn, ml};
type SupportedLanguage = keyof typeof resources;
const supportedLanguages = Object.keys(resources) as SupportedLanguage[];

function getDeviceLanguage(): SupportedLanguage {
  const tag = findBestLanguageTag(supportedLanguages);
  return (tag?.languageTag as SupportedLanguage) ?? 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources: Object.fromEntries(
      Object.entries(resources).map(([lang, translations]) => [lang, {translation: translations}]),
    ),
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

export default i18n;
