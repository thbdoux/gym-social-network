// src/contexts/LanguageContext.js
import React, { createContext, useContext, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '../hooks/query/useUserQuery';
import { useUpdateLanguage } from '../hooks/query/useLanguageQuery';

// Default translations object
import translations from '../utils/translations';

// Create language context
export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const updateLanguageMutation = useUpdateLanguage();
  
  // Get language from user preferences if logged in, or from localStorage if not
  const initialLanguage = user?.language_preference || localStorage.getItem('language') || 'en';
  const [language, setLanguageState] = React.useState(initialLanguage);

  // Update language in both state and backend/localStorage
  const setLanguage = (newLanguage) => {
    if (newLanguage === language) return;
    
    setLanguageState(newLanguage);
    
    // Save to localStorage regardless of login status
    localStorage.setItem('language', newLanguage);
    
    // If user is logged in, also update backend
    if (user) {
      updateLanguageMutation.mutate(newLanguage);
    }
  };
  
  // Update language when user data changes (e.g., after login)
  useEffect(() => {
    if (user?.language_preference && user.language_preference !== language) {
      setLanguageState(user.language_preference);
      localStorage.setItem('language', user.language_preference);
    }
  }, [user]);

  // Get translations for current language with placeholder support
  const t = (key, replacements = {}) => {
    let translation = translations[language]?.[key] || translations['en'][key] || key;
    
    // Replace placeholders like {name} with their values
    if (replacements && Object.keys(replacements).length > 0) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        translation = translation.replace(new RegExp(`{${placeholder}}`, 'g'), value);
      });
    }
    
    return translation;
  };
  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t,
      isUpdating: updateLanguageMutation.isLoading
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook for components to access language context
export function useLanguage() {
  return useContext(LanguageContext);
}