// app/(app)/workouts.tsx
import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { usePrograms, useToggleProgramActive } from '../../hooks/query/useProgramQuery';
import { useLogs } from '../../hooks/query/useLogQuery';
import { programService } from '../../api/services';

export default function WorkoutsScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  
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
  
  // Find active program
  const activeProgram = workoutPlans.find(program => program.is_active);
  
  // Get next workout if there's an active program
  const [nextWorkout, setNextWorkout] = useState(null);
  if (activeProgram?.workouts?.length && !nextWorkout) {
    const next = programService.getNextWorkout(activeProgram);
    setNextWorkout(next);
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchPrograms(),
        refetchLogs()
      ]);
      
      // Reset next workout when refreshing
      if (activeProgram?.workouts?.length) {
        const next = programService.getNextWorkout(activeProgram);
        setNextWorkout(next);
      }
    } catch (error) {
      console.error('Error refreshing workout data:', error);
      Alert.alert('Error', 'Failed to refresh workout data');
    } finally {
      setRefreshing(false);
    }
  };

  const createProgram = () => {
    Alert.alert('Coming Soon', 'Program creation will be available in future updates');
  };

  const logWorkout = () => {
    Alert.alert('Coming Soon', 'Workout logging will be available in future updates');
  };

  if ((programsLoading || logsLoading) && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading your workout data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
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
        <View style={styles.header}>
          <Text style={styles.title}>Your Fitness Journey</Text>
          <Text style={styles.subtitle}>
            Track your progress and stay consistent with workout plans
          </Text>
        </View>

        {/* Active Program Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Program</Text>
          {activeProgram ? (
            <View style={styles.programCard}>
              <View style={styles.programBadge}>
                <Ionicons name="barbell" size={24} color="#7C3AED" />
              </View>
              <View style={styles.programInfo}>
                <Text style={styles.programName}>{activeProgram.name}</Text>
                <Text style={styles.programCreator}>
                  by {activeProgram.creator_username}
                </Text>
                <View style={styles.programStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="calendar" size={16} color="#9CA3AF" />
                    <Text style={styles.statText}>
                      {activeProgram.workouts?.length || 0} workouts
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="fitness" size={16} color="#9CA3AF" />
                    <Text style={styles.statText}>
                      {activeProgram.sessions_per_week || '-'} days/week
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateCard}>
              <Ionicons name="barbell-outline" size={40} color="#6B7280" />
              <Text style={styles.emptyStateTitle}>No Active Program</Text>
              <Text style={styles.emptyStateText}>
                Create a workout program to track your fitness journey
              </Text>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={createProgram}
              >
                <Text style={styles.buttonText}>Create Program</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Next Workout */}
        {nextWorkout && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Workout</Text>
            <TouchableOpacity style={styles.workoutCard}>
              <View style={styles.workoutStatusBar} />
              <View style={styles.workoutContent}>
                <Text style={styles.workoutName}>{nextWorkout.name}</Text>
                <Text style={styles.workoutDate}>{nextWorkout.date}</Text>
                <View style={styles.workoutDetails}>
                  <View style={styles.workoutStat}>
                    <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                    <Text style={styles.workoutStatText}>
                      {nextWorkout.estimated_duration || 60} mins
                    </Text>
                  </View>
                  <View style={styles.workoutStat}>
                    <Ionicons name="list-outline" size={16} color="#9CA3AF" />
                    <Text style={styles.workoutStatText}>
                      {nextWorkout.exercises?.length || 0} exercises
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          {logs.length > 0 ? (
            logs.slice(0, 3).map((log) => (
              <TouchableOpacity key={log.id} style={styles.workoutCard}>
                <View style={[styles.workoutStatusBar, styles.completedWorkout]} />
                <View style={styles.workoutContent}>
                  <Text style={styles.workoutName}>{log.name || log.workout_name}</Text>
                  <Text style={styles.workoutDate}>{log.date}</Text>
                  <View style={styles.workoutDetails}>
                    <View style={styles.workoutStat}>
                      <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                      <Text style={styles.workoutStatText}>
                        {log.duration || '-'} mins
                      </Text>
                    </View>
                    <View style={styles.workoutStat}>
                      <Ionicons name="list-outline" size={16} color="#9CA3AF" />
                      <Text style={styles.workoutStatText}>
                        {log.exercise_count || log.exercises?.length || 0} exercises
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyStateCard}>
              <Ionicons name="fitness-outline" size={40} color="#6B7280" />
              <Text style={styles.emptyStateTitle}>No Workout History</Text>
              <Text style={styles.emptyStateText}>
                Log your workouts to track your progress
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={logWorkout}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionButtonText}>Log Workout</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]} onPress={createProgram}>
            <View style={[styles.actionIconContainer, styles.secondaryIconContainer]}>
              <Ionicons name="barbell" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionButtonText}>Create Program</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContainer: {
    padding: 16,
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
  header: {
    marginBottom: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  programCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#374151',
  },
  programBadge: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  programCreator: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  programStats: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
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
  workoutCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  workoutStatusBar: {
    height: 4,
    backgroundColor: '#3B82F6',
  },
  completedWorkout: {
    backgroundColor: '#10B981',
  },
  workoutContent: {
    padding: 16,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  workoutDetails: {
    flexDirection: 'row',
    marginTop: 8,
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  workoutStatText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
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
  },
  secondaryAction: {
    backgroundColor: '#7C3AED',
  },
  actionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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