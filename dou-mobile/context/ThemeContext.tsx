// context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCurrentUser } from '../hooks/query/useUserQuery';
import { ColorPalette, Personality, getColorPalette } from '../utils/colorConfig';
import { useAuth } from '../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

interface ThemeContextType {
  palette: ColorPalette;
  personality: Personality | null;
  isLoading: boolean;
  resetTheme: () => void;
}

const defaultPalette = getColorPalette('versatile'); // Default fallback

const ThemeContext = createContext<ThemeContextType>({
  palette: defaultPalette,
  personality: null,
  isLoading: true,
  resetTheme: () => {}, // Add a reset function to the context
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: user, isLoading, refetch } = useCurrentUser();
  const { isAuthenticated, user: authUser } = useAuth(); // Get user from auth context too
  const [palette, setPalette] = useState<ColorPalette>(defaultPalette);
  const [personality, setPersonality] = useState<Personality | null>(null);
  const queryClient = useQueryClient();
  
  // Track user ID changes to force theme updates
  const [lastUserId, setLastUserId] = useState<number | null>(null);

  // Function to reset theme to default
  const resetTheme = () => {
    console.log('ThemeContext: Resetting theme to default');
    setPersonality('versatile');
    setPalette(defaultPalette);
  };

  // Reset theme when auth state changes to not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('ThemeContext: User logged out, resetting theme');
      resetTheme();
      setLastUserId(null);
    }
  }, [isAuthenticated]);

  // Force refetch when auth user changes
  useEffect(() => {
    if (authUser?.id && authUser.id !== lastUserId) {
      console.log('ThemeContext: User ID changed, forcing refetch', authUser.id);
      // Store new user ID
      setLastUserId(authUser.id);
      // Force refetch from server
      refetch();
    }
  }, [authUser?.id, lastUserId, refetch]);

  // Update theme when user data changes
  useEffect(() => {
    console.log('ThemeContext: User data changed', user?.personality_type, isLoading, isAuthenticated);
    
    if (user && user.personality_type) {
      // Check if the personality type is valid
      const userPersonality = user.personality_type.toLowerCase() as Personality;
      
      // Make sure it's a valid personality type
      if (['optimizer', 'versatile', 'diplomate', 'mentor'].includes(userPersonality)) {
        console.log('ThemeContext: Setting personality to', userPersonality);
        setPersonality(userPersonality);
        setPalette(getColorPalette(userPersonality));
      } else {
        // Fallback to default
        console.log('ThemeContext: Invalid personality type, using default');
        resetTheme();
      }
    } else if (!isLoading && isAuthenticated) {
      // If user data is loaded but no personality is set (for authenticated users)
      console.log('ThemeContext: No personality set, using default');
      resetTheme();
    }
  }, [user, user?.personality_type, isLoading, isAuthenticated]);

  return (
    <ThemeContext.Provider value={{ 
      palette, 
      personality, 
      isLoading,
      resetTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);