import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.locale);

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('appLanguage');
        if (savedLanguage && savedLanguage !== 'undefined') {
          i18n.locale = savedLanguage;
          setCurrentLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading saved language:', error);
      }
    };
    loadSavedLanguage();
  }, []);

  const changeLanguage = async (languageCode) => {
    try {
      i18n.locale = languageCode;
      setCurrentLanguage(languageCode);
      await AsyncStorage.setItem('appLanguage', languageCode);
    } catch (error) {
      console.error('Error saving language:', error);
      throw error;
    }
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t: (key, options) => i18n.t(key, options),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
