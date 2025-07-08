// components/workouts/WorkoutsFabMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { router } from 'expo-router';
import { VIEW_TYPES } from './ViewSelector';
import { useTheme } from '../../context/ThemeContext';

interface FabMenuItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  action: () => void;
}

interface WorkoutsFabMenuProps {
  currentView: string;
  onCreateProgram: () => void;
  onCreateTemplate: () => void;
  onCreateTemplateFromLog: () => void; // New prop for creating template from log
  onCreateGroupWorkout: () => void;
  onCreateGroupWorkoutFromTemplate: () => void;
  onLogWorkout: () => void;
  onLogFromProgram: () => void;
  onLogFromTemplate: () => void;
  onLogFromScratch: () => void;
  onStartRealtimeWorkout: () => void;
}

const WorkoutsFabMenu: React.FC<WorkoutsFabMenuProps> = ({ 
  currentView,
  onCreateProgram,
  onCreateTemplate,
  onCreateTemplateFromLog, // New prop
  onCreateGroupWorkout,
  onCreateGroupWorkoutFromTemplate,
  onLogWorkout,
  onLogFromProgram,
  onLogFromTemplate,
  onLogFromScratch,
  onStartRealtimeWorkout,
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const { workoutPalette, workoutLogPalette, programPalette, groupWorkoutPalette, palette } = useTheme();
  // Animation values
  const animation = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  // Get menu items based on current view
  const getMenuItems = (): FabMenuItem[] => {
    switch (currentView) {
      case VIEW_TYPES.PROGRAMS:
        return [
          {
            id: 'create_program',
            label: t('create_program'),
            icon: 'add-circle',
            color: programPalette.background,
            action: onCreateProgram
          }
        ];
      case VIEW_TYPES.WORKOUT_HISTORY:
        return [
          {
            id: 'realtime_workout',
            label: t('realtime_workout'),
            icon: 'stopwatch-outline',
            color: workoutLogPalette.background,
            action: onStartRealtimeWorkout
          },
          {
            id: 'log_from_program',
            label: t('from_program'),
            icon: 'albums-outline',
            color: workoutLogPalette.background,
            action: onLogFromProgram
          },
          {
            id: 'log_from_template',
            label: t('from_template'),
            icon: 'document-text-outline',
            color: workoutLogPalette.background,
            action: onLogFromTemplate
          },
          {
            id: 'log_from_scratch',
            label: t('from_scratch'),
            icon: 'create-outline',
            color: workoutLogPalette.background,
            action: onLogFromScratch
          }
        ];
      case VIEW_TYPES.TEMPLATES:
        return [
          {
            id: 'create_template_from_log',
            label: t('from_workout_log'),
            icon: 'barbell',
            color: workoutPalette.background,
            action: onCreateTemplateFromLog
          },
          {
            id: 'create_template',
            label: t('create_template'),
            icon: 'add-circle',
            color: workoutPalette.background,
            action: onCreateTemplate
          }
        ];
      case VIEW_TYPES.GROUP_WORKOUTS:
        return [
          {
            id: 'create_group_workout',
            label: t('create_group_workout'),
            icon: 'add-circle',
            color: groupWorkoutPalette.background,
            action: onCreateGroupWorkout
          },
          // {
          //   id: 'create_from_template',
          //   label: t('from_template'),
          //   icon: 'document-text-outline',
          //   color: '#f97316',
          //   action: onCreateGroupWorkoutFromTemplate
          // }
        ];
      default:
        return [];
    }
  };
  
  const menuItems = getMenuItems();
  
  useEffect(() => {
    if (isOpen) {
      // Animate menu opening
      Animated.parallel([
        Animated.timing(animation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.bezier(0.2, 1, 0.2, 1),
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate menu closing
      Animated.parallel([
        Animated.timing(animation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.bezier(0.2, 1, 0.2, 1),
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const handleItemPress = (item: FabMenuItem) => {
    setIsOpen(false);
    item.action();
  };
  
  // Main FAB rotation animation
  const fabRotate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  // Get fab color based on current view
  const getFabColor = () => {
    switch (currentView) {
      case VIEW_TYPES.PROGRAMS:
        return programPalette.background;
      case VIEW_TYPES.WORKOUT_HISTORY:
        return workoutLogPalette.background;
      case VIEW_TYPES.TEMPLATES:
        return workoutPalette.background;
      case VIEW_TYPES.GROUP_WORKOUTS:
        return groupWorkoutPalette.background;
      default:
        return palette.highlight;
    }
  };
  
  return (
    <>
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: backdropOpacity },
          { display: isOpen ? 'flex' : 'none' },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
        onTouchStart={() => setIsOpen(false)}
      />
      
      {/* Menu Items */}
      <View style={styles.fabMenuContainer} pointerEvents="box-none">
        {menuItems.map((item, index) => {
          // Calculate animations for each menu item
          const offsetDistance = 80 + (index * 60);
          
          const itemAnimation = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -offsetDistance],
          });
          
          const itemOpacity = animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
          });
          
          const itemScale = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          });
          
          return (
            <Animated.View
              key={item.id}
              style={[
                styles.fabMenuItem,
                {
                  transform: [
                    { translateY: itemAnimation },
                    { scale: itemScale }
                  ],
                  opacity: itemOpacity,
                }
              ]}
              pointerEvents={isOpen ? 'auto' : 'none'}
            >
              <TouchableOpacity
                style={[styles.fabItemButton, { backgroundColor: item.color }]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.8}
              >
                <Ionicons name={item.icon as any} size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.fabItemLabelContainer}>
                <Text style={styles.fabItemLabel}>{item.label}</Text>
              </View>
            </Animated.View>
          );
        })}
        
        {/* Main FAB Button */}
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: getFabColor() }]}
          onPress={toggleMenu}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ rotate: fabRotate }] }}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1,
  },
  fabMenuContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 2,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabMenuItem: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  fabItemButton: {
    width: 50,
    height: 50,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabItemLabelContainer: {
    position: 'absolute',
    right: 54,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1F2937',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default WorkoutsFabMenu;