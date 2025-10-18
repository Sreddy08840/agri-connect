import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from '../locales/en.json';
import kn from '../locales/kn.json';
import hi from '../locales/hi.json';

const resources = {
  en: {
    translation: en
  },
  kn: {
    translation: kn
  },
  hi: {
    translation: hi
  }
};

const LANGUAGE_STORAGE_KEY = '@agri_connect_language';

// Get saved language from AsyncStorage
const getStoredLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage;
  } catch (error) {
    console.error('Error reading language from storage:', error);
    return null;
  }
};

// Save language to AsyncStorage
const saveLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language to storage:', error);
  }
};

// Detect device language
const getDeviceLanguage = () => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const languageCode = locales[0].languageCode;
    // Map device language to supported languages
    if (languageCode === 'kn' || languageCode === 'hi') {
      return languageCode;
    }
  }
  return 'en'; // Default to English
};

// Initialize i18n
const initI18n = async () => {
  const savedLanguage = await getStoredLanguage();
  const deviceLanguage = getDeviceLanguage();
  const initialLanguage = savedLanguage || deviceLanguage;

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      compatibilityJSON: 'v3',
      interpolation: {
        escapeValue: false, // not needed for react native
      },
    });

  // Save language change to AsyncStorage
  i18n.on('languageChanged', (lng) => {
    saveLanguage(lng);
  });
};

initI18n();

export default i18n;
