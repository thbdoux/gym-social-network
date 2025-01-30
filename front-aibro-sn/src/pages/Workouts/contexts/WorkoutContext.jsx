import React, { createContext, useContext, useEffect } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

const WorkoutContext = createContext(null);

export const WorkoutProvider = ({ children }) => {
  const [workoutPlans, setWorkoutPlans] = useLocalStorage('workout-plans', []);
  const [currentPlan, setCurrentPlan] = useLocalStorage('current-plan', null);
  const [draftWorkout, setDraftWorkout] = useLocalStorage('draft-workout', null);
  
  // Clear draft when unmounting
  useEffect(() => {
    return () => {
      if (!draftWorkout) localStorage.removeItem('draft-workout');
    };
  }, [draftWorkout]);

  return (
    <WorkoutContext.Provider value={{
      workoutPlans,
      setWorkoutPlans,
      currentPlan,
      setCurrentPlan,
      draftWorkout,
      setDraftWorkout,
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);