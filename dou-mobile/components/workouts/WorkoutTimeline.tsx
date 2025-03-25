// components/workout/WorkoutTimeline.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

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

interface Workout {
  id: number;
  name: string;
  preferred_weekday?: number;
  exercises?: any[];
  estimated_duration?: number;
}

interface Program {
  id: number;
  name: string;
  is_active: boolean;
  workouts?: any[];
}

interface WorkoutTimelineProps {
  logs: WorkoutLog[];
  nextWorkout?: Workout | null;
  logsLoading: boolean;
  plansLoading: boolean;
  activeProgram?: Program | null;
  setSelectedWorkout?: (workout: any) => void;
  setShowWorkoutModal?: (show: boolean) => void;
  setSelectedLog?: (log: WorkoutLog | null) => void;
  setShowLogForm?: (show: boolean) => void;
  handleViewNextWorkout?: () => void;
}

const WorkoutTimeline: React.FC<WorkoutTimelineProps> = ({
  logs = [],
  nextWorkout,
  logsLoading,
  plansLoading,
  activeProgram,
  setSelectedWorkout,
  setShowWorkoutModal,
  setSelectedLog,
  setShowLogForm,
  handleViewNextWorkout
}) => {
  const { t } = useLanguage();
  
  // Loading state
  if (logsLoading || plansLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>{t('loading_posts')}</Text>
      </View>
    );
  }
  
  // Empty state - no workouts or logs
  if (!nextWorkout && logs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="fitness-outline" size={48} color="#6B7280" />
        <Text style={styles.emptyTitle}>{t('no_workout_history')}</Text>
        <Text style={styles.emptyText}>
          {t('start_your_fitness_journey')}
        </Text>
        {setShowLogForm && (
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => {
              if (setSelectedLog) setSelectedLog(null);
              setShowLogForm(true);
            }}
          >
            <Text style={styles.emptyButtonText}>{t('get_started')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
  
  // Format date for better display and get relative date label
  const getRelativeDateLabel = (dateString: string): string => {
    try {
      // Handle different date formats
      let logDate;
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          // Day/Month/Year format
          logDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          logDate = new Date(dateString);
        }
      } else {
        logDate = new Date(dateString);
      }
      
      const today = new Date();
      
      // Reset time parts to compare dates properly
      today.setHours(0, 0, 0, 0);
      logDate.setHours(0, 0, 0, 0);
      
      // Simple difference in days calculation
      const diffMs = today.getTime() - logDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      
      let dateLabel = t('today');
      if (diffDays === 1) dateLabel = t('yesterday');
      else if (diffDays > 1) dateLabel = `${diffDays} ${t('days_ago')}`;
      else if (diffDays === -1) dateLabel = t('tomorrow');
      else if (diffDays < -1) dateLabel = `${t('in')} ${Math.abs(diffDays)} ${t('days')}`;
      
      return dateLabel;
    } catch (e) {
      return dateString;
    }
  };
  
  // Get mood emoji
  const getMoodEmoji = (rating?: number): string => {
    if (!rating) return '🙂';
    if (rating >= 8) return '😀';
    if (rating >= 6) return '🙂';
    if (rating >= 4) return '😐';
    if (rating >= 2) return '☹️';
    return '😫';
  };
  
  // Sort logs by date - oldest first
  const sortedLogs = [...logs].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  }).slice(0, 3);
  
  // Get weekday name for next workout
  const getWeekdayName = (weekdayIndex?: number): string => {
    if (weekdayIndex === undefined) return t('soon');
    const weekdays = [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')];
    return weekdays[weekdayIndex];
  };

  return (
    <View style={styles.container}>
      {/* Timeline Header */}
      <Text style={styles.timelineTitle}>{t('workout_history')}</Text>
      
      {/* Timeline Content */}
      <ScrollView 
        horizontal={true} 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Previous Workouts */}
        {sortedLogs.map((log) => {
          const dateLabel = getRelativeDateLabel(log.date);
          
          return (
            <TouchableOpacity 
              key={log.id}
              style={styles.workoutCard}
              onPress={() => {
                if (setSelectedLog) {
                  setSelectedLog(log);
                }
              }}
            >
              {/* Timeline dot */}
              <View style={styles.timelineDotContainer}>
                <View style={styles.timelineDot} />
                <Text style={styles.timelineDate}>{dateLabel}</Text>
                <View style={styles.timelineConnector} />
              </View>
              
              {/* Workout Card */}
              <View style={styles.cardContent}>
                {/* Status Line */}
                <View style={styles.completedStatusLine} />
                
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {log.name || log.workout_name || t('workout')}
                    </Text>
                    <View style={styles.moodBadge}>
                      <Text>{getMoodEmoji(log.mood_rating)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardFooter}>
                    <View style={styles.exerciseCount}>
                      <Ionicons name="trending-up" size={16} color="#10B981" style={styles.footerIcon} />
                      <Text style={styles.footerText}>
                        {log.exercise_count || log.exercises?.length || 0} {t('exercises')}
                      </Text>
                    </View>
                    
                    {log.program_name && (
                      <View style={styles.programBadge}>
                        <Text style={styles.programText}>{log.program_name}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        
        {/* Current Marker */}
        <View style={styles.nowMarker}>
          <View style={styles.nowDot}>
            <View style={styles.nowInnerDot} />
          </View>
          <View style={styles.nowLabel}>
            <Ionicons name="time-outline" size={12} color="#F59E0B" />
            <Text style={styles.nowText}>{t('now')}</Text>
          </View>
        </View>
        
        {/* Next Workout */}
        {nextWorkout && (
          <TouchableOpacity 
            style={styles.nextWorkoutCard}
            onPress={handleViewNextWorkout}
          >
            {/* Timeline dot */}
            <View style={styles.timelineDotContainer}>
              <View style={styles.upcomingDot} />
              <Text style={styles.upcomingDate}>
                {t('coming_up_on')} {getWeekdayName(nextWorkout.preferred_weekday)}
              </Text>
              <View style={styles.upcomingConnector} />
            </View>
            
            {/* Workout Card */}
            <View style={styles.cardContent}>
              {/* Status Line */}
              <View style={styles.upcomingStatusLine} />
              
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {nextWorkout.name}
                  </Text>
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingText}>{t('upcoming')}</Text>
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <View style={styles.exerciseCount}>
                    <Ionicons name="trending-up" size={16} color="#3B82F6" style={styles.footerIcon} />
                    <Text style={styles.footerText}>
                      {nextWorkout.exercises?.length || 0} {t('exercises')}
                    </Text>
                  </View>
                  
                  {activeProgram && (
                    <View style={styles.activeProgramBadge}>
                      <Text style={styles.activeProgramText}>{activeProgram.name}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#111827',
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 16,
    paddingRight: 80, // Extra space at the end
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#9CA3AF',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  workoutCard: {
    width: 250,
    marginRight: 16,
  },
  nextWorkoutCard: {
    width: 250,
    marginLeft: 24, // Add space between now marker and next workout
  },
  timelineDotContainer: {
    alignItems: 'center',
    height: 50,
    marginBottom: 8,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginBottom: 8,
  },
  timelineDate: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    marginBottom: 4,
  },
  timelineConnector: {
    width: 2,
    height: 16, 
    backgroundColor: '#065F46',
  },
  upcomingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    marginBottom: 8,
  },
  upcomingDate: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  upcomingConnector: {
    width: 2,
    height: 16,
    backgroundColor: '#1E40AF',
  },
  cardContent: {
    borderRadius: 12,
    backgroundColor: '#1F2937',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  completedStatusLine: {
    height: 4,
    width: '100%', 
    backgroundColor: '#10B981',
  },
  upcomingStatusLine: {
    height: 4,
    width: '100%', 
    backgroundColor: '#3B82F6',
  },
  cardBody: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  moodBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  upcomingBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  upcomingText: {
    fontSize: 10,
    color: '#3B82F6',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    marginRight: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  programBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  programText: {
    fontSize: 10,
    color: '#A78BFA',
  },
  activeProgramBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeProgramText: {
    fontSize: 10,
    color: '#A78BFA',
  },
  nowMarker: {
    alignItems: 'center',
    marginHorizontal: 24,
  },
  nowDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nowInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  nowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nowText: {
    fontSize: 12,
    color: '#F59E0B',
    marginLeft: 4,
  },
});

export default WorkoutTimeline;