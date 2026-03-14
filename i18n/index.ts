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
import zh from './locales/zh.json';
import pt from './locales/pt.json';
import pl from './locales/pl.json';
import ja from './locales/ja.json';
import ro from './locales/ro.json';
import he from './locales/he.json';
import id from './locales/id.json';
import af from './locales/af.json';
import sq from './locales/sq.json';
import cs from './locales/cs.json';
import bn from './locales/bn.json';
import bo from './locales/bo.json';
import vi from './locales/vi.json';
import it from './locales/it.json';
import fi from './locales/fi.json';
import gu from './locales/gu.json';
import ha from './locales/ha.json';
import ht from './locales/ht.json';
import hu from './locales/hu.json';
import ko from './locales/ko.json';
import lt from './locales/lt.json';
import lv from './locales/lv.json';
import mi from './locales/mi.json';
import mr from './locales/mr.json';
import my from './locales/my.json';
import ne from './locales/ne.json';
import fa from './locales/fa.json';
import pa from './locales/pa.json';
import so from './locales/so.json';
import nl from './locales/nl.json';
import ar from './locales/ar.json';
import ru from './locales/ru.json';
import tl from './locales/tl.json';
import th from './locales/th.json';
import tr from './locales/tr.json';
import ug from './locales/ug.json';
import ur from './locales/ur.json';
import wo from './locales/wo.json';

const resources = {
  en, de, fr, es, hi, ta, te, kn, ml,
  zh, pt, pl, ja, ro, he, id, af, sq, cs, bn, bo,
  vi, it, fi, gu, ha, ht, hu, ko, lt, lv, mi, mr,
  my, ne, fa, pa, so, nl, ar, ru, tl, th, tr, ug, ur, wo,
};
type SupportedLanguage = keyof typeof resources;
const supportedLanguages = Object.keys(resources) as SupportedLanguage[];

export function getDeviceLanguage(): SupportedLanguage {
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
