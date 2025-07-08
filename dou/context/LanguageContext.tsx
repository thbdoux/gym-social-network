// context/LanguageContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { userService } from '../api/services';
import translations from '../utils/translations';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  isUpdating: boolean;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'fr',
  setLanguage: () => {},
  t: (key) => key,
  isUpdating: false,
});

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('en');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Load saved language on startup
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        // First try to get language from secure storage
        const savedLanguage = await SecureStore.getItemAsync('language');
        
        if (savedLanguage) {
          setLanguageState(savedLanguage);
          return;
        }
        
        // If not in storage and user is logged in, try to get from user preferences
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          try {
            const userData = await userService.getCurrentUser();
            if (userData?.language_preference) {
              setLanguageState(userData.language_preference);
              await SecureStore.setItemAsync('language', userData.language_preference);
            }
          } catch (error) {
            console.error('Error loading user language preference:', error);
          }
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };

    loadLanguage();
  }, []);

  // Update language in both state and secure storage
  const setLanguage = async (newLanguage: string) => {
    if (newLanguage === language) return;
    
    setLanguageState(newLanguage);
    
    // Save to secure storage
    await SecureStore.setItemAsync('language', newLanguage);
    
    // If user is logged in, update backend
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        setIsUpdating(true);
        await userService.updateUser({ language_preference: newLanguage });
      }
    } catch (error) {
      console.error('Error updating user language preference:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Translation function with placeholders support
  const t = (key: string, replacements: Record<string, string | number> = {}): string => {
    let translation = translations[language]?.[key] || translations['en'][key] || key;
    
    // Replace placeholders like {name} with their values
    if (replacements && Object.keys(replacements).length > 0) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        translation = translation.replace(new RegExp(`{${placeholder}}`, 'g'), String(value));
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t,
      isUpdating 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook for components to access language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};