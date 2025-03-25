// components/workout/WorkoutLogCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

interface Set {
  id?: number;
  reps: number;
  weight: number;
  rest_time: number;
  order: number;
  notes?: string;
}

interface Exercise {
  id?: number;
  name: string;
  equipment?: string;
  notes?: string;
  order: number;
  sets: Set[];
}

interface WorkoutLog {
  id: number;
  name: string;
  workout_name?: string;
  date: string;
  duration?: number;
  completed: boolean;
  username?: string;
  gym_name?: string;
  gym_location?: string;
  gym?: number;
  program_name?: string;
  exercises?: Exercise[];
  exercise_count?: number;
  mood_rating?: number;
  perceived_difficulty?: number;
  notes?: string;
}

interface WorkoutLogCardProps {
  log: WorkoutLog;
  currentUser?: string;
  onEdit?: (log: WorkoutLog) => void;
  onDelete?: (log: WorkoutLog) => void;
  onFork?: (log: WorkoutLog) => void;
  onSelect?: (log: WorkoutLog) => void;
  compact?: boolean;
}

const WorkoutLogCard: React.FC<WorkoutLogCardProps> = ({ 
  log, 
  currentUser,
  onEdit, 
  onDelete, 
  onFork,
  onSelect,
  compact = false,
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  
  if (!log) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('unable_to_load_workout_log')}</Text>
      </View>
    );
  }
  
  const isCreator = log.username === currentUser;
  const canFork = !isCreator;
  
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return t('no_date');
      // Check if date is in DD/MM/YYYY format
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(`${year}-${month}-${day}`).toLocaleDateString();
      }
      // Otherwise try standard parsing
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString; // If parsing fails, return the original string
    }
  };
  
  const getMoodEmoji = (rating?: number): string | null => {
    if (!rating) return null;
    if (rating >= 8) return '😀';
    if (rating >= 6) return '🙂';
    if (rating >= 4) return '😐';
    if (rating >= 2) return '☹️';
    return '😫';
  };

  const getDifficultyLevel = (rating?: number) => {
    if (!rating) return { label: '🔥', color: styles.difficultyDefault };
    if (rating >= 8) return { label: '🔥🔥🔥', color: styles.difficultyHigh };
    if (rating >= 6) return { label: '🔥🔥', color: styles.difficultyMedium };
    if (rating >= 4) return { label: '🔥', color: styles.difficultyLow };
    return { label: '✓', color: styles.difficultyVeryLow };
  };
  
  // Toggle expanded state
  const handleToggleExpand = (): void => {
    setIsExpanded(!isExpanded);
    if (onSelect && !isExpanded) {
      onSelect(log);
    }
  };
  
  const handleExerciseExpand = (exerciseId: number | undefined): void => {
    if (!exerciseId) return;
    setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
  };
  
  const handleDelete = (): void => {
    Alert.alert(
      t('delete_log'),
      t('confirm_delete_workout_log'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('delete'),
          onPress: () => onDelete?.(log),
          style: 'destructive'
        }
      ]
    );
  };
  
  const exerciseCount = log.exercise_count || log.exercises?.length || 0;
  const gymName = log.gym_name || t('unknown_gym');

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        log.completed ? styles.containerCompleted : styles.containerRegular
      ]}
      onPress={handleToggleExpand}
      activeOpacity={0.8}
    >
      {/* Status Indicator Line */}
      <View style={[styles.statusLine, log.completed ? styles.statusLineCompleted : styles.statusLineRegular]} />
      
      <View style={styles.content}>
        {/* Card Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.icon, log.completed ? styles.iconCompleted : styles.iconRegular]}>
              <Ionicons name="barbell" size={20} color={log.completed ? "#22c55e" : "#9ca3af"} />
            </View>
            
            <View style={styles.titleContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {log.name || log.workout_name || t('workout')}
                </Text>
                
                {log.completed && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
                    <Text style={styles.statusText}>{t('completed')}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.subtitleRow}>
                <Ionicons name="calendar-outline" size={12} color="#9ca3af" style={styles.subtitleIcon} />
                <Text style={styles.subtitle} numberOfLines={1}>{formatDate(log.date)}</Text>
                
                {log.program_name && (
                  <View style={styles.programBadge}>
                    <Ionicons name="barbell-outline" size={12} color="#c084fc" style={styles.subtitleIcon} />
                    <Text style={styles.programText} numberOfLines={1}>{log.program_name}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          {/* Actions */}
          <View style={styles.actionsContainer}>
            {isCreator && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => onEdit?.(log)}
                >
                  <Ionicons name="create-outline" size={18} color="#9ca3af" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            )}
            
            {canFork && onFork && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => onFork?.(log)}
              >
                <Ionicons name="download-outline" size={18} color="#60a5fa" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.expandButton} onPress={handleToggleExpand}>
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={18} 
                color={isExpanded ? "#c084fc" : "#9ca3af"} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsItem}>
            <View style={styles.statsLabel}>
              <Ionicons name="location-outline" size={14} color="#60a5fa" style={{marginRight: 4}} />
              <Text style={styles.statsLabelText}>{t('location')}</Text>
            </View>
            <Text style={styles.statsValue} numberOfLines={1}>{gymName}</Text>
          </View>
          
          <View style={styles.statsItem}>
            <View style={styles.statsLabel}>
              <Ionicons name="flame-outline" size={14} color="#f87171" style={{marginRight: 4}} />
              <Text style={styles.statsLabelText}>{t('difficulty')}</Text>
            </View>
            <View style={[styles.difficultyContainer, getDifficultyLevel(log.perceived_difficulty).color]}>
              <Text style={styles.difficultyText}>
                {getDifficultyLevel(log.perceived_difficulty).label} {log.perceived_difficulty || '-'}/10
              </Text>
            </View>
          </View>
          
          {log.mood_rating ? (
            <View style={styles.statsItem}>
              <View style={styles.statsLabel}>
                <Ionicons name="heart-outline" size={14} color="#ec4899" style={{marginRight: 4}} />
                <Text style={styles.statsLabelText}>{t('mood')}</Text>
              </View>
              <View style={styles.moodContainer}>
                <Text style={styles.moodEmoji}>{getMoodEmoji(log.mood_rating)}</Text>
                <Text style={styles.moodRating}>{log.mood_rating}/10</Text>
              </View>
            </View>
          ) : (
            <View style={styles.statsItem}>
              <View style={styles.statsLabel}>
                <Ionicons name="time-outline" size={14} color="#14b8a6" style={{marginRight: 4}} />
                <Text style={styles.statsLabelText}>{t('duration')}</Text>
              </View>
              <Text style={styles.statsValue}>{log.duration || '-'} {t('mins')}</Text>
            </View>
          )}
        </View>
        
        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Workout Details */}
            <View style={styles.detailsSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bar-chart-outline" size={16} color="#c084fc" style={{marginRight: 8}} />
                <Text style={styles.sectionTitle}>{t('workout_details')}</Text>
              </View>
              
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('duration')}</Text>
                  <Text style={styles.detailValue}>{log.duration || '-'} {t('mins')}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('exercises')}</Text>
                  <Text style={styles.detailValue}>{exerciseCount}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('location')}</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{gymName}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('difficulty')}</Text>
                  <Text style={styles.detailValue}>{log.perceived_difficulty || '-'}/10</Text>
                </View>
              </View>
              
              {log.program_name && (
                <View style={styles.programContainer}>
                  <Ionicons name="barbell-outline" size={16} color="#22c55e" style={{marginRight: 8}} />
                  <Text style={styles.programInfo}>
                    {t('part_of_program')}{" "}
                    <Text style={styles.programName}>{log.program_name}</Text>
                  </Text>
                </View>
              )}
            </View>
            
            {/* Exercises List */}
            {log.exercises && log.exercises.length > 0 && (
              <View style={styles.exercisesSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="barbell-outline" size={16} color="#c084fc" style={{marginRight: 8}} />
                  <Text style={styles.sectionTitle}>{t('exercises')}</Text>
                </View>
                
                {log.exercises.map((exercise, index) => (
                  <TouchableOpacity 
                    key={exercise.id || index} 
                    style={styles.exerciseItem}
                    onPress={() => handleExerciseExpand(exercise.id)}
                  >
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseIcon}>
                        <Ionicons name="barbell" size={16} color="#c084fc" />
                      </View>
                      
                      <View style={styles.exerciseDetails}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <View style={styles.exerciseSubDetails}>
                          <Text style={styles.exerciseSubDetail}>
                            {exercise.sets?.length || 0} {t('sets')}
                          </Text>
                          {exercise.equipment && (
                            <>
                              <Text style={styles.exerciseSeparator}>•</Text>
                              <Text style={styles.exerciseSubDetail}>{exercise.equipment}</Text>
                            </>
                          )}
                        </View>
                      </View>
                      
                      <Ionicons 
                        name={expandedExercise === exercise.id ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color={expandedExercise === exercise.id ? "#c084fc" : "#9ca3af"} 
                      />
                    </View>
                    
                    {expandedExercise === exercise.id && exercise.sets && (
                      <View style={styles.setsList}>
                        <View style={styles.setsHeader}>
                          <Text style={styles.setsHeaderItem}>{t('set')}</Text>
                          <Text style={styles.setsHeaderItem}>{t('weight')}</Text>
                          <Text style={styles.setsHeaderItem}>{t('reps')}</Text>
                          <Text style={[styles.setsHeaderItem, styles.setsHeaderNotes]}>{t('notes')}</Text>
                        </View>
                        
                        {exercise.sets.map((set, setIdx) => (
                          <View key={setIdx} style={styles.setItem}>
                            <Text style={styles.setNumber}>{setIdx + 1}</Text>
                            <Text style={styles.setValue}>{set.weight || 0} kg</Text>
                            <Text style={styles.setValue}>{set.reps || 0}</Text>
                            <Text style={styles.setNotes} numberOfLines={1}>{set.notes || '—'}</Text>
                          </View>
                        ))}
                        
                        <View style={styles.setsSummary}>
                          <Text style={styles.setSummaryItem}>
                            {t('total_volume')}: {' '}
                            <Text style={styles.setSummaryValue}>
                              {exercise.sets.reduce((total, set) => total + (set.weight || 0) * (set.reps || 0), 0)} kg
                            </Text>
                          </Text>
                          
                          <Text style={styles.setSummaryItem}>
                            {t('best_set')}: {' '}
                            <Text style={styles.setSummaryValue}>
                              {exercise.sets.reduce((best, set) => Math.max(best, (set.weight || 0)), 0)} kg
                            </Text>
                          </Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* Workout Notes */}
            {log.notes && (
              <View style={styles.notesSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="information-circle-outline" size={16} color="#c084fc" style={{marginRight: 8}} />
                  <Text style={styles.sectionTitle}>{t('workout_notes')}</Text>
                </View>
                <Text style={styles.notesText}>{log.notes}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  containerRegular: {
    backgroundColor: '#1F2937',
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  containerCompleted: {
    backgroundColor: '#1F2937',
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  statusLine: {
    height: 4,
    width: '100%',
  },
  statusLineRegular: {
    backgroundColor: '#4B5563',
  },
  statusLineCompleted: {
    backgroundColor: '#22c55e',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconRegular: {
    backgroundColor: 'rgba(75, 85, 99, 0.3)',
  },
  iconCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#22c55e',
    marginLeft: 2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  subtitleIcon: {
    marginRight: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  programBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  programText: {
    fontSize: 12,
    color: '#c084fc',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
  },
  expandButton: {
    padding: 6,
    borderRadius: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: 16,
  },
  statsItem: {
    flex: 1,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.3)',
    marginRight: 8,
  },
  statsLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statsLabelText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  difficultyContainer: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  difficultyDefault: {
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
  },
  difficultyHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  difficultyMedium: {
    backgroundColor: 'rgba(249, 115, 22, 0.3)',
  },
  difficultyLow: {
    backgroundColor: 'rgba(234, 179, 8, 0.3)',
  },
  difficultyVeryLow: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  difficultyText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodRating: {
    fontSize: 12,
    color: '#FFFFFF',
    backgroundColor: 'rgba(236, 72, 153, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  expandedContent: {
    marginTop: 16,
  },
  detailsSection: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    padding: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.3)',
    margin: 4,
  },
  detailLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  programContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginTop: 12,
  },
  programInfo: {
    fontSize: 12,
    color: '#A7F3D0',
    flex: 1,
  },
  programName: {
    fontWeight: '600',
  },
  exercisesSection: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
    marginBottom: 16,
  },
  exerciseItem: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.7)',
    marginBottom: 8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  exerciseIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  exerciseSubDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  exerciseSubDetail: {
    fontSize: 12,
    color: '#9ca3af',
  },
  exerciseSeparator: {
    fontSize: 12,
    color: '#9ca3af',
    marginHorizontal: 4,
  },
  setsList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.7)',
    padding: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  setsHeaderItem: {
    flex: 1,
    fontSize: 10,
    color: '#9ca3af',
  },
  setsHeaderNotes: {
    flex: 2,
  },
  setItem: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: 'rgba(55, 65, 81, 0.4)',
    borderRadius: 6,
    marginBottom: 4,
  },
  setNumber: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  setValue: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },
  setNotes: {
    flex: 2,
    fontSize: 12,
    color: '#9ca3af',
  },
  setsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.7)',
  },
  setSummaryItem: {
    fontSize: 10,
    color: '#9ca3af',
  },
  setSummaryValue: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: '500',
  },
  notesSection: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  notesText: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 20,
  },
  errorContainer: {
    marginVertical: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
  },
});

export default WorkoutLogCard;