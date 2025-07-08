// components/navigation/WorkoutNavigationGuard.tsx - Simplified
import React from 'react';
import { Alert } from 'react-native';
import { useWorkout } from '../../context/WorkoutContext';
import { useLanguage } from '../../context/LanguageContext';

interface WorkoutNavigationGuardProps {
  children: React.ReactElement;
}

const WorkoutNavigationGuard: React.FC<WorkoutNavigationGuardProps> = ({ children }) => {
  const { hasActiveWorkout, navigateToWorkout } = useWorkout();
  const { t } = useLanguage();

  const handlePress = () => {
    if (hasActiveWorkout) {
      // Always navigate to existing workout if one exists
      console.log('Nav guard: Active workout exists, navigating to it');
      navigateToWorkout();
      return;
    }

    // No active workout, proceed with normal navigation
    if (children.props.onPress) {
      children.props.onPress();
    }
  };

  return React.cloneElement(children, {
    onPress: handlePress,
  });
};

export default WorkoutNavigationGuard;