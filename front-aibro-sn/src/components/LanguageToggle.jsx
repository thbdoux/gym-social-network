// src/components/LanguageToggle.js
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Replace these paths with actual flag image paths in your project
const FLAGS = {
  en: '/images/flags/en.png',
  fr: '/images/flags/fr.png'
};

const LanguageToggle = () => {
  const { language, setLanguage, t, isUpdating } = useLanguage();
  
  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'fr' : 'en';
    setLanguage(newLanguage);
  };
  
  return (
    <button 
      onClick={toggleLanguage}
      disabled={isUpdating}
      className="flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors duration-200"
      title={language === 'en' ? t('french') : t('english')}
    >
      <img 
        src={FLAGS[language]} 
        alt={language === 'en' ? 'English' : 'Français'} 
        className="w-6 h-4 object-cover"
      />
      <span className="text-sm">{language === 'en' ? 'EN' : 'FR'}</span>
      {isUpdating && (
        <span className="animate-spin ml-1">⟳</span>
      )}
    </button>
  );
};

export default LanguageToggle;