import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

const WorkoutContext = createContext(null);

export const WorkoutProvider = ({ children }) => {
  const [workoutPlans, setWorkoutPlans] = useLocalStorage('workout-plans', []);
  const [currentPlan, setCurrentPlan] = useLocalStorage('current-plan', null);
  const [draftWorkout, setDraftWorkout] = useLocalStorage('draft-workout', null);
  const [selectedWorkouts, setSelectedWorkouts] = useLocalStorage('selected-workouts', []);

  // Clear draft and selections when unmounting
  React.useEffect(() => {
    return () => {
      if (!draftWorkout) localStorage.removeItem('draft-workout');
      if (!selectedWorkouts.length) localStorage.removeItem('selected-workouts');
    };
  }, [draftWorkout, selectedWorkouts]);

  const value = {
    workoutPlans,
    setWorkoutPlans,
    currentPlan,
    setCurrentPlan,
    draftWorkout,
    setDraftWorkout,
    selectedWorkouts,
    setSelectedWorkouts,
    clearSelectedWorkouts: () => setSelectedWorkouts([])
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === null) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

export default WorkoutContext;