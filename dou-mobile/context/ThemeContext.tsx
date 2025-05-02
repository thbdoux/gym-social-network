// context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useCurrentUser } from '../hooks/query/useUserQuery';
import { 
  ColorPalette, 
  Personality, 
  getColorPalette,
  WorkoutPalette,
  ProgramPalette,
  WorkoutLogPalette,
  ProgramWorkoutPalette,
  getWorkoutPalette,
  getProgramPalette,
  getWorkoutLogPalette,
  getProgramWorkoutPalette
} from '../utils/colorConfig';
import { useAuth } from '../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

interface ThemeContextType {
  palette: ColorPalette;
  workoutPalette: WorkoutPalette;
  programPalette: ProgramPalette;
  workoutLogPalette: WorkoutLogPalette;
  programWorkoutPalette: ProgramWorkoutPalette;
  personality: Personality | null;
  isLoading: boolean;
  resetTheme: () => void;
}

const defaultPalette = getColorPalette('versatile'); // Default fallback
const defaultWorkoutPalette = getWorkoutPalette('versatile');
const defaultProgramPalette = getProgramPalette('versatile');
const defaultWorkoutLogPalette = getWorkoutLogPalette('versatile');
const defaultProgramWorkoutPalette = getProgramWorkoutPalette('versatile');

const ThemeContext = createContext<ThemeContextType>({
  palette: defaultPalette,
  workoutPalette: defaultWorkoutPalette,
  programPalette: defaultProgramPalette,
  workoutLogPalette: defaultWorkoutLogPalette,
  programWorkoutPalette: defaultProgramWorkoutPalette,
  personality: null,
  isLoading: true,
  resetTheme: () => {}, // Add a reset function to the context
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: user, isLoading, refetch } = useCurrentUser();
  const { isAuthenticated, user: authUser } = useAuth(); // Get user from auth context too
  const [palette, setPalette] = useState<ColorPalette>(defaultPalette);
  const [workoutPalette, setWorkoutPalette] = useState<WorkoutPalette>(defaultWorkoutPalette);
  const [programPalette, setProgramPalette] = useState<ProgramPalette>(defaultProgramPalette);
  const [workoutLogPalette, setWorkoutLogPalette] = useState<WorkoutLogPalette>(defaultWorkoutLogPalette);
  const [programWorkoutPalette, setProgramWorkoutPalette] = useState<ProgramWorkoutPalette>(defaultProgramWorkoutPalette);
  const [personality, setPersonality] = useState<Personality | null>(null);
  const queryClient = useQueryClient();
  
  // Track user ID changes to force theme updates
  const [lastUserId, setLastUserId] = useState<number | null>(null);
  // Use ref to prevent multiple refetches
  const isRefetchingRef = useRef(false);

  // Function to reset theme to default - use useCallback to memoize
  const resetTheme = useCallback(() => {
    console.log('ThemeContext: Resetting theme to default');
    setPersonality('versatile');
    setPalette(defaultPalette);
    setWorkoutPalette(defaultWorkoutPalette);
    setProgramPalette(defaultProgramPalette);
    setWorkoutLogPalette(defaultWorkoutLogPalette);
    setProgramWorkoutPalette(defaultProgramWorkoutPalette);
  }, []);

  // Reset theme when auth state changes to not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      resetTheme();
      setLastUserId(null);
    }
  }, [isAuthenticated, resetTheme]);

  // Force refetch when auth user changes - with safety mechanism to prevent loops
  useEffect(() => {
    if (authUser?.id && 
        authUser.id !== lastUserId && 
        !isRefetchingRef.current) {
      
      // Set the flag before any async operations
      isRefetchingRef.current = true;
      
      // Update last user ID immediately to prevent re-runs
      setLastUserId(authUser.id);
      
      // Use setTimeout to ensure state updates before refetch
      setTimeout(() => {
        refetch().finally(() => {
          // Reset flag when done
          isRefetchingRef.current = false;
        });
      }, 0);
    }
  }, [authUser?.id, lastUserId, refetch]);

  // Update theme when user data changes - simplified dependencies
  useEffect(() => {
    if (user && user.personality_type) {
      // Check if the personality type is valid
      const userPersonality = user.personality_type.toLowerCase() as Personality;
      
      // Make sure it's a valid personality type
      if (['optimizer', 'versatile', 'diplomate', 'mentor'].includes(userPersonality)) {
        setPersonality(userPersonality);
        setPalette(getColorPalette(userPersonality));
        setWorkoutPalette(getWorkoutPalette(userPersonality));
        setProgramPalette(getProgramPalette(userPersonality));
        setWorkoutLogPalette(getWorkoutLogPalette(userPersonality));
        setProgramWorkoutPalette(getProgramWorkoutPalette(userPersonality));
      } else {
        resetTheme();
      }
    } else if (!isLoading && isAuthenticated) {
      resetTheme();
    }
  }, [user, isLoading, isAuthenticated, resetTheme]); // Simplified dependency array

  return (
    <ThemeContext.Provider value={{ 
      palette, 
      workoutPalette,
      programPalette,
      workoutLogPalette,
      programWorkoutPalette,
      personality, 
      isLoading,
      resetTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);