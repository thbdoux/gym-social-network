// app/(app)/workout-log/[id].tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Keyboard,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Custom hooks
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import {
  useLog,
  useUpdateLog,
  useDeleteLog,
} from '../../../hooks/query/useLogQuery';

// Components
import LogExerciseManager from './LogExerciseManager';
import GymSelectionModal from '../../../components/workouts/GymSelectionModal';
import WorkoutPartnersManagerModal from '../../../components/workouts/WorkoutPartnersManagerModal';
import { AnimatedHeader } from './components/AnimatedHeader';
import { ExercisesList } from './components/ExercisesList';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';

import { useGym } from '../../../hooks/query/useGymQuery';

interface WorkoutLogDetailScreenProps {
  overrideUserId?: number;
  overrideLogId?: number;
}

// Define permission types
type PermissionLevel = 'creator' | 'partner' | 'viewer' | 'none';

export default function WorkoutLogDetailScreen({ 
  overrideUserId, 
  overrideLogId 
}: WorkoutLogDetailScreenProps = {}) {
  
  // Get theme context
  const { workoutLogPalette, palette } = useTheme();
  
  // Animation setup with dynamic header height
  const scrollY = useRef(new Animated.Value(0)).current;
  const [dynamicHeaderHeight, setDynamicHeaderHeight] = useState(230); // Default height
  
  // Create dynamic theme colors
  const COLORS = {
    primary: workoutLogPalette.background,
    secondary: workoutLogPalette.highlight,
    tertiary: workoutLogPalette.border,
    background: palette.page_background,
    card: "#1F2937",
    text: {
      primary: workoutLogPalette.text,
      secondary: workoutLogPalette.text_secondary,
      tertiary: "rgba(255, 255, 255, 0.5)"
    },
    border: workoutLogPalette.border,
    success: "#10b981",
    danger: "#ef4444"
  };
  
  const { t , language } = useLanguage();
  const { id } = useLocalSearchParams();
  const logId = typeof id === 'string' ? parseInt(id, 10) : 0;
  
  const { user } = useAuth();
  const targetUserId = overrideUserId || user?.id;

  // State for log details
  const [logName, setLogName] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logDuration, setLogDuration] = useState(0);
  const [logDifficulty, setLogDifficulty] = useState(0);
  const [logMoodRating, setLogMoodRating] = useState(5);
  const [logCompleted, setLogCompleted] = useState(false);
  const [logDate, setLogDate] = useState('');
  const [selectedGym, setSelectedGym] = useState(null);
  const [workoutPartners, setWorkoutPartners] = useState<number[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // UI state
  const [isExerciseManagerVisible, setIsExerciseManagerVisible] = useState(false);
  const [isGymSelectionVisible, setIsGymSelectionVisible] = useState(false);
  const [isPartnersManagerVisible, setIsPartnersManagerVisible] = useState(false);
  
  // Hooks
  const { data: log, isLoading, error, refetch } = useLog(logId);
  const { mutateAsync: updateLog, isPending: isUpdating } = useUpdateLog();
  const { mutateAsync: deleteLog } = useDeleteLog();
  const { data: gymData, isLoading: isGymLoading } = useGym(log?.gym || undefined);

  // Enhanced permission logic
  const getPermissionLevel = (): PermissionLevel => {
    if (!log || !user) return 'none';
    
    // Check if current user is the creator
    if (log.username === user.username) {
      return 'creator';
    }
    
    // Check if current user is a workout partner
    if (log.workout_partners && log.workout_partners.includes(user.id)) {
      return 'partner';
    }
    
    // For now, we'll allow viewing for any authenticated user
    // This is where you would add friendship check logic
    // e.g., if (isFriend(log.username, user.username)) return 'viewer';
    
    // You could add a friendship service check here:
    // if (await friendshipService.areFriends(user.id, log.user_id)) {
    //   return 'viewer';
    // }
    
    return 'viewer'; // For now, allow viewing (you might want to change this)
  };

  const permissionLevel = getPermissionLevel();
  
  // Determine if user can edit (creator only)
  const canEdit = permissionLevel === 'creator';
  
  // Determine if user can view (creator, partner, or viewer)
  const canView = permissionLevel !== 'none';
  
  // Legacy isCreator for backward compatibility
  const isCreator = permissionLevel === 'creator';
  
  // Handle header height changes
  const handleHeaderHeightChange = useCallback((height: number) => {
    setDynamicHeaderHeight(height);
  }, []);
  
  // Initialize form state when log data is loaded
  useEffect(() => {
    if (log) {
      setLogName(log.name);
      setLogNotes(log.notes || '');
      setLogDuration(log.duration || 0);
      setLogDifficulty(log.perceived_difficulty || 0);
      setLogMoodRating(log.mood_rating || 5);
      setLogCompleted(log.completed || false);
      setLogDate(log.date || '');
      setWorkoutPartners(log.workout_partners || []);
      
      // Set gym information
      if (gymData) {
        setSelectedGym({
          id: gymData.id,
          name: gymData.name,
          location: gymData.location || ''
        });
      } else if (log.gym && log.gym_name) {
        setSelectedGym({
          id: log.gym,
          name: log.gym_name,
          location: log.location || ''
        });
      } else {
        setSelectedGym(null);
      }
    }
  }, [log, gymData]);
  
  // Add keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Handle saving individual log field (only if user can edit)
  const handleSaveLogField = async (field: string, value: any) => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }
    
    try {
      const updates = { 
        [field]: value,
        exercises: log?.exercises || [],
        workout_partners: workoutPartners
      };
      
      await updateLog({
        id: logId,
        logData: updates
      });
      await refetch();
    } catch (error) {
      console.error(`Failed to update log ${field}:`, error);
      Alert.alert(t('error'), t('failed_to_update_log'));
    }
  };

  // Handle deleting the log (only if user can edit)
  const handleDeleteLog = () => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_delete'));
      return;
    }
    
    Alert.alert(
      t('delete_log'),
      t('confirm_delete_log'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLog(logId);
              router.back();
            } catch (error) {
              console.error('Failed to delete log:', error);
              Alert.alert(t('error'), t('failed_to_delete_log'));
            }
          }
        }
      ]
    );
  };

  // Handle updating workout partners (only if user can edit)
  const handleUpdatePartners = async (partners: number[]) => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }
    
    try {
      setWorkoutPartners(partners);
      const updatedData = {
        workout_partners: partners,
        exercises: log?.exercises || []
      };
      
      await updateLog({
        id: logId,
        logData: updatedData
      });
      await refetch();
    } catch (error) {
      console.error('Failed to update workout partners:', error);
      Alert.alert(t('error'), t('failed_to_update_partners'));
      setWorkoutPartners(log?.workout_partners || []);
    }
  };

  // Handle gym selection (only if user can edit)
  const handleGymSelection = async (gym: any) => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }
    
    try {
      setSelectedGym(gym);
      const gymData = gym ? {
        gym: gym.id,
        gym_name: gym.name,
        location: gym.location
      } : {
        gym: null,
        gym_name: null,
        location: 'Home'
      };
      
      const updatedData = {
        ...gymData,
        exercises: log?.exercises || [],
        workout_partners: workoutPartners
      };
      
      await updateLog({
        id: logId,
        logData: updatedData
      });
      await refetch();
    } catch (error) {
      console.error('Failed to update gym:', error);
      Alert.alert(t('error'), t('failed_to_update_gym'));
    }
  };

  // Handle exercise management completion (only if user can edit)
  const handleExerciseManagerComplete = async () => {
    setIsExerciseManagerVisible(false);
    await refetch();
  };

  // Handle clicking on workout partners section
  const handlePartnersPress = () => {
    if (canEdit || workoutPartners.length > 0) {
      setIsPartnersManagerVisible(true);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return <LoadingState colors={COLORS} t={t} />;
  }
  
  // Render error state if there's an error or no access
  if (error || !log || !canView) {
    return (
      <ErrorState 
        colors={COLORS} 
        t={t} 
        onBack={() => router.back()} 
        error={error}
      />
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Safe Area with Header Colors */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.safeAreaGradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        </SafeAreaView>
      </LinearGradient>
      
      {/* Animated Header - Updated props */}
      <AnimatedHeader
        scrollY={scrollY}
        log={log}
        colors={COLORS}
        isCreator={isCreator}
        selectedGym={selectedGym}
        workoutPartners={workoutPartners}
        logDuration={logDuration}
        logMoodRating={logMoodRating}
        onDeleteLog={handleDeleteLog}
        onPartnersPress={handlePartnersPress}
        onFieldUpdate={handleSaveLogField}
        setLogName={setLogName}
        setLogNotes={setLogNotes}
        setLogDuration={setLogDuration}
        setLogDifficulty={setLogDifficulty}
        setLogMoodRating={setLogMoodRating}
        setIsGymSelectionVisible={setIsGymSelectionVisible}
        onHeaderHeightChange={handleHeaderHeightChange}
        t={t}
        language={language}
      />
      
      {/* Main Content */}
      <Animated.ScrollView
        style={styles.contentScrollView}
        contentContainerStyle={[
          styles.contentContainer, 
          { paddingTop: dynamicHeaderHeight + 16 }
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <ExercisesList
          log={log}
          colors={COLORS}
          isCreator={isCreator}
          canEdit={canEdit} // Pass new prop for edit permission
          permissionLevel={permissionLevel} // Pass permission level
          onEditExercises={() => canEdit && setIsExerciseManagerVisible(true)}
          t={t}
        />
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
      
      {/* Modals - only show if user can edit */}
      {isExerciseManagerVisible && canEdit && (
        <LogExerciseManager
          visible={isExerciseManagerVisible}
          logId={logId}
          exercises={log.exercises || []}
          onClose={handleExerciseManagerComplete}
          colors={COLORS}
        />
      )}
      
      {canEdit && (
        <>
          <GymSelectionModal
            visible={isGymSelectionVisible}
            onClose={() => setIsGymSelectionVisible(false)}
            onSelectGym={handleGymSelection}
            selectedGym={selectedGym}
          />
          
          <WorkoutPartnersManagerModal
            visible={isPartnersManagerVisible}
            onClose={() => setIsPartnersManagerVisible(false)}
            currentPartnerIds={workoutPartners}
            onUpdatePartners={handleUpdatePartners}
            workoutName={log?.name}
            isCreator={isCreator}
          />
        </>
      )}
      
      {/* View-only partners modal for non-editors */}
      {!canEdit && (
        <WorkoutPartnersManagerModal
          visible={isPartnersManagerVisible}
          onClose={() => setIsPartnersManagerVisible(false)}
          currentPartnerIds={workoutPartners}
          onUpdatePartners={() => {}} // No-op for view-only
          workoutName={log?.name}
          isCreator={false}
          viewOnly={true} // Add this prop if supported by the modal
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeAreaGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    zIndex: 1001,
  },
  safeArea: {
    flex: 1,
  },
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
  },
  bottomPadding: {
    height: 80,
  },
});