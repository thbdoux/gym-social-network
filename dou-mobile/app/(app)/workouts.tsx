// app/(app)/workouts.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
  Image,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { 
  usePrograms, 
  useToggleProgramActive,
  useForkProgram
} from '../../hooks/query/useProgramQuery';
import { 
  useLogs,
  useCreateLog
} from '../../hooks/query/useLogQuery';
import { programService } from '../../api/services';
import WorkoutTimeline from '../../components/workouts/WorkoutTimeline';
import ProgramCard from '../../components/workouts/ProgramCard';
import { useQueryClient } from '@tanstack/react-query';

// Interface for workout log
interface WorkoutLog {
  id: number;
  name: string;
  workout_name?: string;
  date: string;
  rating?: number;
  exercise_count?: number;
  exercises?: any[];
  program_name?: string;
  mood_rating?: number;
  completed?: boolean;
}

// Interface for next workout
interface Workout {
  id: number;
  name: string;
  preferred_weekday?: number;
  exercises?: any[];
  estimated_duration?: number;
}

export default function WorkoutsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);
  const [showWorkoutDetailsModal, setShowWorkoutDetailsModal] = useState(false);
  const [showLogWorkoutModal, setShowLogWorkoutModal] = useState(false);
  const [nextWorkout, setNextWorkout] = useState<Workout | null>(null);
  
  // Use React Query hooks
  const { 
    data: workoutPlans = [], 
    isLoading: programsLoading, 
    refetch: refetchPrograms,
    error: programsError
  } = usePrograms();
  
  const {
    data: logs = [],
    isLoading: logsLoading,
    refetch: refetchLogs,
    error: logsError
  } = useLogs();
  
  const { mutateAsync: toggleProgramActive, isLoading: isTogglingProgram } = useToggleProgramActive();
  const { mutateAsync: createLog, isLoading: isCreatingLog } = useCreateLog();
  const { mutateAsync: forkProgram, isLoading: isForkingProgram } = useForkProgram();
  
  // Find active program
  const activeProgram = workoutPlans.find(program => program.is_active);
  
  // Calculate next workout when active program changes
  useEffect(() => {
    if (activeProgram?.workouts?.length) {
      const next = programService.getNextWorkout(activeProgram);
      setNextWorkout(next);
    } else {
      setNextWorkout(null);
    }
  }, [activeProgram]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchPrograms(),
        refetchLogs()
      ]);
      
      // Reset next workout after refresh
      if (activeProgram?.workouts?.length) {
        const next = programService.getNextWorkout(activeProgram);
        setNextWorkout(next);
      }
    } catch (error) {
      console.error('Error refreshing workout data:', error);
      Alert.alert(
        t('error'),
        t('failed_to_refresh_workout_data')
      );
    } finally {
      setRefreshing(false);
    }
  }, [refetchPrograms, refetchLogs, activeProgram, t]);

  // Handle program toggle (active/inactive)
  const handleToggleProgram = async (programId: number) => {
    try {
      await toggleProgramActive(programId);
      await refetchPrograms();
      
      // Invalidate queries to ensure data consistency
      queryClient.invalidateQueries(['programs']);
      queryClient.invalidateQueries(['logs']);
    } catch (error) {
      console.error('Error toggling program:', error);
      Alert.alert(
        t('error'),
        t('failed_to_toggle_program')
      );
    }
  };

  // Navigate to program detail view
  const navigateToProgramDetail = (programId: number) => {
    // TODO: Implement navigation to program detail screen
    Alert.alert('Coming Soon', 'Program details will be available in future updates');
  };

  // Navigate to all programs view
  const navigateToAllPrograms = () => {
    // TODO: Implement navigation to all programs screen
    Alert.alert('Coming Soon', 'Program list will be available in future updates');
  };

  // Navigate to all logs view
  const navigateToAllLogs = () => {
    // TODO: Implement navigation to all logs screen
    Alert.alert('Coming Soon', 'Workout log history will be available in future updates');
  };

  // Handle log workout
  const handleLogWorkout = () => {
    setShowLogWorkoutModal(true);
    // TODO: Implement Log Workout Modal
    Alert.alert('Coming Soon', 'Workout logging will be available in future updates');
  };

  // Handle workout selection
  const handleSelectWorkout = (workout: any) => {
    // TODO: Implement workout details view
    Alert.alert('Coming Soon', 'Workout details will be available in future updates');
  };

  // Handle log selection
  const handleSelectLog = (log: WorkoutLog) => {
    setSelectedLog(log);
    setShowWorkoutDetailsModal(true);
    // TODO: Implement workout log details modal
    Alert.alert('Coming Soon', 'Workout log details will be available in future updates');
  };

  // Handle create program
  const handleCreateProgram = () => {
    // TODO: Implement program creation
    Alert.alert('Coming Soon', 'Program creation will be available in future updates');
  };

  if (programsLoading || logsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>{t('loading_workout_data')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{t('your_fitness_journey')}</Text>
          <Text style={styles.subtitle}>
            {t('track_your_progress')}
          </Text>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={navigateToAllPrograms}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(124, 58, 237, 0.2)' }]}>
              <Ionicons name="barbell-outline" size={20} color="#A78BFA" />
            </View>
            <Text style={styles.quickActionText}>{t('programs')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={handleLogWorkout}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Ionicons name="add-outline" size={20} color="#10B981" />
            </View>
            <Text style={styles.quickActionText}>{t('log_workout')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={navigateToAllLogs}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
              <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.quickActionText}>{t('history')}</Text>
          </TouchableOpacity>
        </View>

        {/* Active Program Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('active_program')}</Text>
            {workoutPlans.length > 0 && (
              <TouchableOpacity onPress={navigateToAllPrograms}>
                <Text style={styles.sectionLink}>{t('view_all')}</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {activeProgram ? (
            <ProgramCard 
              program={activeProgram}
              currentUser={user?.username || ''}
              onToggleActive={handleToggleProgram}
              onProgramSelect={navigateToProgramDetail}
              compact={true}
            />
          ) : (
            <View style={styles.emptyStateCard}>
              <Ionicons name="barbell-outline" size={40} color="#6B7280" />
              <Text style={styles.emptyStateTitle}>{t('no_active_program')}</Text>
              <Text style={styles.emptyStateText}>
                {t('setup_program_prompt')}
              </Text>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleCreateProgram}
              >
                <Text style={styles.buttonText}>{t('create_program')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Workout Timeline Section */}
        <View style={styles.sectionContainer}>
          <WorkoutTimeline
            logs={logs}
            nextWorkout={nextWorkout}
            logsLoading={logsLoading}
            plansLoading={programsLoading}
            activeProgram={activeProgram || undefined}
            onSelectWorkout={handleSelectWorkout}
            onSelectLog={handleSelectLog}
            onLogWorkout={handleLogWorkout}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleLogWorkout}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionButtonText}>{t('log_workout')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryAction]} 
            onPress={handleCreateProgram}
          >
            <View style={[styles.actionIconContainer, styles.secondaryIconContainer]}>
              <Ionicons name="barbell" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionButtonText}>{t('create_program')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    marginTop: 10,
    color: '#9CA3AF',
  },
  headerContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionLink: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  emptyStateCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryAction: {
    backgroundColor: '#7C3AED',
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  secondaryIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});