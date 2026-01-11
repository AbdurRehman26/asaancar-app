import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import ur from './locales/ur.json';
import roman from './locales/roman.json';

const LANGUAGE_KEY = '@app_language';

// Language detector that uses AsyncStorage
const languageDetector = {
    type: 'languageDetector',
    async: true,
    detect: async (callback) => {
        try {
            const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
            callback(savedLanguage || 'en');
        } catch (error) {
            console.log('Error reading language from storage:', error);
            callback('en');
        }
    },
    init: () => { },
    cacheUserLanguage: async (language) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_KEY, language);
        } catch (error) {
            console.log('Error saving language to storage:', error);
        }
    },
};

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ur: { translation: ur },
            roman: { translation: roman },
        },
        fallbackLng: 'en',
        compatibilityJSON: 'v3', // Required for React Native
        interpolation: {
            escapeValue: false, // React already escapes values
        },
        react: {
            useSuspense: false, // Disable suspense for React Native
        },
    });

export const changeLanguage = async (language) => {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
};

export const getCurrentLanguage = () => i18n.language;

export const LANGUAGES = [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
    { code: 'roman', label: 'Roman Urdu', nativeLabel: 'Roman Urdu' },
];

export default i18n;
