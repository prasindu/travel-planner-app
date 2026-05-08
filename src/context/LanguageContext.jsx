import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Aluthin add kala
import { translations } from '../utils/translations'; // Path eka api hadapu utils folder ekata damma

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // App eka open weddi default 'en' thiyenawa
  const [language, setLanguage] = useState('en');
  const [isLoaded, setIsLoaded] = useState(false); // Language eka load wela iwarada kiyala balanna

  // 1. App eka open weddi save wela thiyena language eka load karaganna
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('lt_lang');
        if (savedLang) {
          setLanguage(savedLang);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadLanguage();
  }, []);

  // 2. Language eka wenas weddi eka AsyncStorage eke save karanna
  useEffect(() => {
    if (!isLoaded) return; // Mulinma load weddi save wena eka nawaththanna

    const saveLanguage = async () => {
      try {
        await AsyncStorage.setItem('lt_lang', language);
      } catch (error) {
        console.error('Error saving language:', error);
      }
    };
    saveLanguage();
  }, [language, isLoaded]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'si' : 'en'));
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      if (value) value = value[k];
    }
    return value || key; 
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);