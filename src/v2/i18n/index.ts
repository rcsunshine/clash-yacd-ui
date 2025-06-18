import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enTranslations from './locales/en';
import zhTranslations from './locales/zh';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: process.env.NODE_ENV === 'development',
    fallbackLng: 'en',
    lng: undefined, // 使用自动检测
    
    // 语言检测配置
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'v2-language',
    },
    
    interpolation: {
      escapeValue: false, // React已经做了XSS防护
    },
    
    resources: {
      en: {
        translation: enTranslations,
      },
      zh: {
        translation: zhTranslations,
      },
      'zh-CN': {
        translation: zhTranslations,
      },
    },
  });

export default i18n; 