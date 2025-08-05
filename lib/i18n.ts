// lib/i18n.ts
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from '../public/locales/en/translation.json';
import roTranslation from '../public/locales/ro/translation.json';
import frTranslation from '../public/locales/fr/translation.json';
import huTranslation from '../public/locales/hu/translation.json';

const i18n = i18next.createInstance();

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ro', 'fr', 'hu'],
    resources: {
      en: { translation: enTranslation },
      ro: { translation: roTranslation },
      fr: { translation: frTranslation },
      hu: { translation: huTranslation },
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;