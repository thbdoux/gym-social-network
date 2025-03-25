// components/workouts/WorkoutTimeline.tsx
import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView,
  Dimensions,
  Animated
} from 'react-native';
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
  onSelectWorkout?: (workout: any) => void;
  onSelectLog?: (log: WorkoutLog) => void;
  onLogWorkout?: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8 > 300 ? 300 : width * 0.8;
const DOT_SIZE = 10;

const WorkoutTimeline: React.FC<WorkoutTimelineProps> = ({
  logs = [],
  nextWorkout,
  logsLoading,
  plansLoading,
  activeProgram,
  onSelectWorkout,
  onSelectLog,
  onLogWorkout
}) => {
  const { t } = useLanguage();
  
  // Loading state
  if (logsLoading || plansLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
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
        {onLogWorkout && (
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={onLogWorkout}
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
  
  // Get mood emoji based on rating
  const getMoodEmoji = (rating?: number): string => {
    if (!rating) return '🙂';
    
    if (rating >= 4.5) return '😀';
    if (rating >= 3.5) return '🙂';
    if (rating >= 2.5) return '😐';
    if (rating >= 1.5) return '😕';
    return '😞';
  };
  
  // Sort logs by date - newest first (for displaying 3 most recent)
  const recentLogs = [...logs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
  
  // Get weekday name for next workout
  const getWeekdayName = (weekdayIndex?: number): string => {
    if (weekdayIndex === undefined) return t('soon');
    const weekdays = [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')];
    return weekdays[weekdayIndex];
  };

  return (
    <View style={styles.container}>
      {/* Timeline Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.timelineTitle}>{t('workout_timeline')}</Text>
        <TouchableOpacity 
          style={styles.viewAllButton} 
          onPress={() => {/* Navigate to all workout logs */}}
        >
          <Text style={styles.viewAllText}>{t('view_all')}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Timeline Content */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + 16} // Card width + margin
        decelerationRate="fast"
      >
        {/* Timeline line */}
        <View style={styles.timelineLine} />
        
        {/* Past Workouts */}
        {recentLogs.map((log, index) => {
          const dateLabel = getRelativeDateLabel(log.date);
          
          return (
            <TouchableOpacity 
              key={log.id}
              style={styles.workoutCard}
              onPress={() => onSelectLog && onSelectLog(log)}
              activeOpacity={0.7}
            >
              {/* Timeline dot */}
              <View style={styles.timelineDotContainer}>
                <View style={styles.timelineDot} />
                <Text style={styles.timelineDate}>{dateLabel}</Text>
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
                      <Text>{getMoodEmoji(log.rating || log.mood_rating)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardFooter}>
                    <View style={styles.exerciseCount}>
                      <Ionicons name="barbell-outline" size={14} color="#10B981" style={styles.footerIcon} />
                      <Text style={styles.footerText}>
                        {log.exercise_count || log.exercises?.length || 0} {t('exercises')}
                      </Text>
                    </View>
                    
                    {log.program_name && (
                      <View style={styles.programBadge}>
                        <Text style={styles.programText} numberOfLines={1}>
                          {log.program_name}
                        </Text>
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
            onPress={() => onSelectWorkout && onSelectWorkout(nextWorkout)}
            activeOpacity={0.7}
          >
            {/* Timeline dot */}
            <View style={styles.timelineDotContainer}>
              <View style={styles.upcomingDot} />
              <Text style={styles.upcomingDate}>
                {t('next')}: {getWeekdayName(nextWorkout.preferred_weekday)}
              </Text>
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
                    <Ionicons name="barbell-outline" size={14} color="#3B82F6" style={styles.footerIcon} />
                    <Text style={styles.footerText}>
                      {nextWorkout.exercises?.length || 0} {t('exercises')}
                    </Text>
                  </View>
                  
                  {activeProgram && (
                    <View style={styles.activeProgramBadge}>
                      <Text style={styles.activeProgramText} numberOfLines={1}>
                        {activeProgram.name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Add a Log Workout card at the end */}
        <TouchableOpacity 
          style={styles.addWorkoutCard}
          onPress={onLogWorkout}
          activeOpacity={0.7}
        >
          <View style={styles.addWorkoutContent}>
            <View style={styles.addIcon}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.addWorkoutText}>{t('log_workout')}</Text>
            <Text style={styles.addWorkoutSubtext}>{t('track_your_progress')}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.3)',
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewAllButton: {
    padding: 6,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  scrollContent: {
    paddingVertical: 20,
    paddingLeft: 16,
    paddingRight: 40, // Extra space at the end
    minHeight: 220,
  },
  timelineLine: {
    position: 'absolute',
    left: 23 + (CARD_WIDTH / 2) - (DOT_SIZE / 2),
    top: 60,
    bottom: 50,
    width: 2,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    zIndex: 1,
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
    margin: 16,
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
    width: CARD_WIDTH,
    marginRight: 16,
  },
  nextWorkoutCard: {
    width: CARD_WIDTH,
    marginLeft: 24, // Add space between now marker and next workout
  },
  timelineDotContainer: {
    alignItems: 'center',
    height: 40,
    marginBottom: 8,
    position: 'relative',
    zIndex: 2,
  },
  timelineDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#10B981',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#065F46',
  },
  timelineDate: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  upcomingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  upcomingDate: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    textAlign: 'center',
  },
  cardContent: {
    borderRadius: 12,
    backgroundColor: '#1F2937',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    marginLeft: 8,
  },
  upcomingBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 8,
  },
  upcomingText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
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
    maxWidth: 120,
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
    maxWidth: 120,
  },
  activeProgramText: {
    fontSize: 10,
    color: '#A78BFA',
  },
  nowMarker: {
    alignItems: 'center',
    marginHorizontal: 20,
    zIndex: 2,
  },
  nowDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.5)',
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
    fontWeight: '500',
  },
  addWorkoutCard: {
    width: CARD_WIDTH,
    marginLeft: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addWorkoutContent: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderRadius: 12,
    padding: 16,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addWorkoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  addWorkoutSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  }
});

export default WorkoutTimeline;