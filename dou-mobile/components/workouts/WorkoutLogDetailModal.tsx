// components/workouts/WorkoutLogDetailModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

interface Exercise {
  id: number;
  name: string;
  sets?: any[];
  note?: string;
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
  activeExerciseId?: number;
}

interface WorkoutLogDetailModalProps {
  visible: boolean;
  log: WorkoutLog | null;
  onClose: () => void;
  currentUser?: string;
  onEdit?: (log: WorkoutLog) => void;
  onDelete?: (log: WorkoutLog) => void;
  onFork?: (log: WorkoutLog) => Promise<void>;
  onExerciseSelect?: (exerciseId: number) => void;
}

const WorkoutLogDetailModal: React.FC<WorkoutLogDetailModalProps> = ({
  visible,
  log,
  onClose,
  currentUser,
  onEdit,
  onDelete,
  onFork,
  onExerciseSelect
}) => {
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'exercises'>('overview');
  const [activeExerciseId, setActiveExerciseId] = useState<number | null>(null);

  // Reset tab when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedTab('overview');
      setActiveExerciseId(log?.activeExerciseId !== undefined ? log.activeExerciseId : null);
    }
  }, [visible, log]);

  if (!log) return null;

  // Permission checks
  const isCreator = log.username === currentUser;
  const canEditLog = isCreator;
  const canDeleteLog = isCreator;
  const canForkLog = !isCreator;

  const formatDate = (dateString: string): string => {
    try {
      // Check if date is in DD/MM/YYYY format
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(`${year}-${month}-${day}`).toLocaleDateString(undefined, { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      // Otherwise try standard parsing
      return new Date(dateString).toLocaleDateString(undefined, { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString; // If parsing fails, return the original string
    }
  };

  const getMoodEmoji = (rating?: number): string => {
    if (!rating) return '🙂';
    if (rating >= 4.5) return '😀';
    if (rating >= 3.5) return '🙂';
    if (rating >= 2.5) return '😐';
    if (rating >= 1.5) return '😕';
    return '😞';
  };

  const getMoodText = (rating?: number): string => {
    if (!rating) return t('neutral');
    if (rating >= 4.5) return t('excellent');
    if (rating >= 3.5) return t('good');
    if (rating >= 2.5) return t('neutral');
    if (rating >= 1.5) return t('poor');
    return t('very_poor');
  };

  const getDifficultyText = (rating?: number): string => {
    if (!rating) return t('moderate');
    if (rating >= 8) return t('very_hard');
    if (rating >= 6) return t('hard');
    if (rating >= 4) return t('moderate');
    if (rating >= 2) return t('easy');
    return t('very_easy');
  };

  const getDifficultyLevel = (rating?: number): string => {
    if (!rating) return '🔥';
    if (rating >= 8) return '🔥🔥🔥';
    if (rating >= 6) return '🔥🔥';
    if (rating >= 4) return '🔥';
    return '✓';
  };

  const handleDelete = () => {
    Alert.alert(
      t('delete_log'),
      t('confirm_delete_workout_log'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(log);
              onClose();
            }
          }
        }
      ]
    );
  };

  // Overview Tab Content
  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Workout Log Stats */}
      <View style={styles.statsContainer}>
        {/* Date */}
        <View style={styles.statBox}>
          <Ionicons name="calendar-outline" size={20} color="#f97316" />
          <Text style={styles.statValueLarge}>{formatDate(log.date)}</Text>
          <Text style={styles.statLabel}>{t('date')}</Text>
        </View>

        {/* Duration if available */}
        {log.duration && (
          <View style={styles.statBox}>
            <Ionicons name="time-outline" size={20} color="#22d3ee" />
            <Text style={styles.statValue}>{log.duration}</Text>
            <Text style={styles.statLabel}>{t('minutes')}</Text>
          </View>
        )}

        {/* Exercise Count */}
        <View style={styles.statBox}>
          <Ionicons name="barbell-outline" size={20} color="#c084fc" />
          <Text style={styles.statValue}>{log.exercises?.length || log.exercise_count || 0}</Text>
          <Text style={styles.statLabel}>{t('exercises')}</Text>
        </View>
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusBadge,
          log.completed ? styles.completedBadge : styles.inProgressBadge
        ]}>
          <Ionicons 
            name={log.completed ? "checkmark-circle" : "time-outline"} 
            size={16} 
            color={log.completed ? "#22c55e" : "#f97316"} 
          />
          <Text style={[
            styles.statusText,
            log.completed ? styles.completedText : styles.inProgressText
          ]}>
            {log.completed ? t('completed') : t('in_progress')}
          </Text>
        </View>
      </View>

      {/* Workout Details */}
      <View style={styles.detailsContainer}>
        {/* Gym */}
        {log.gym_name && (
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="location-outline" size={16} color="#60a5fa" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('gym')}</Text>
              <Text style={styles.detailValue}>{log.gym_name}</Text>
              {log.gym_location && (
                <Text style={styles.detailSubValue}>{log.gym_location}</Text>
              )}
            </View>
          </View>
        )}

        {/* Program */}
        {log.program_name && (
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="clipboard-outline" size={16} color="#c084fc" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('program')}</Text>
              <Text style={styles.detailValue}>{log.program_name}</Text>
            </View>
          </View>
        )}

        {/* User */}
        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="person-outline" size={16} color="#9ca3af" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>{t('user')}</Text>
            <Text style={styles.detailValue}>{log.username}</Text>
          </View>
        </View>

        {/* Mood Rating */}
        {log.mood_rating && (
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Text style={styles.detailIcon}>{getMoodEmoji(log.mood_rating)}</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('mood')}</Text>
              <Text style={styles.detailValue}>{getMoodText(log.mood_rating)}</Text>
            </View>
          </View>
        )}

        {/* Perceived Difficulty */}
        {log.perceived_difficulty && (
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Text style={styles.detailIcon}>{getDifficultyLevel(log.perceived_difficulty)}</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('difficulty')}</Text>
              <Text style={styles.detailValue}>{getDifficultyText(log.perceived_difficulty)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Notes */}
      {log.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.sectionTitle}>{t('notes')}</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{log.notes}</Text>
          </View>
        </View>
      )}
    </View>
  );

  // Exercises Tab Content
  const renderExercisesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.exercisesListContainer}>
        <Text style={styles.sectionTitle}>{t('exercises')}</Text>
        
        {log.exercises && log.exercises.length > 0 ? (
          log.exercises.map((exercise, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.exerciseItem}
              onPress={() => onExerciseSelect && onExerciseSelect(exercise.id)}
              activeOpacity={0.7}
            >
              <View style={styles.exerciseMain}>
                <View style={styles.exerciseIconContainer}>
                  <Ionicons name="barbell" size={20} color="#c084fc" />
                </View>
                
                <View style={styles.exerciseContent}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  {exercise.sets && (
                    <View style={styles.exerciseStats}>
                      <View style={styles.exerciseStat}>
                        <Ionicons name="repeat-outline" size={14} color="#9ca3af" />
                        <Text style={styles.exerciseStatText}>
                          {exercise.sets.length} {t('sets')}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
              
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('no_exercises_recorded')}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* This TouchableWithoutFeedback handles taps on the background */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>
        
        {/* The actual modal content */}
        <View style={styles.modalContent}>
          {/* Prevent touch propagation to backdrop */}
          <TouchableWithoutFeedback>
            <View>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {log.name || log.workout_name || t('workout')}
                  </Text>
                  {log.completed && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>{t('completed')}</Text>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={onClose}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              {/* Tabs */}
              <View style={styles.tabsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.tabButton,
                    selectedTab === 'overview' && styles.activeTabButton
                  ]}
                  onPress={() => setSelectedTab('overview')}
                >
                  <Text style={[
                    styles.tabButtonText,
                    selectedTab === 'overview' && styles.activeTabButtonText
                  ]}>
                    {t('overview')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.tabButton,
                    selectedTab === 'exercises' && styles.activeTabButton
                  ]}
                  onPress={() => setSelectedTab('exercises')}
                >
                  <Text style={[
                    styles.tabButtonText,
                    selectedTab === 'exercises' && styles.activeTabButtonText
                  ]}>
                    {t('exercises')}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Content */}
              <ScrollView 
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={true}
              >
                {selectedTab === 'overview' ? renderOverviewTab() : renderExercisesTab()}
              </ScrollView>
              
              {/* Action Buttons */}
              <View style={styles.actions}>
                {canEditLog && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => {
                      onClose();
                      if (onEdit) onEdit(log);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#60a5fa" />
                    <Text style={[styles.actionButtonText, styles.editButtonText]}>
                      {t('edit')}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {canForkLog && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.forkButton]}
                    onPress={() => {
                      onClose();
                      if (onFork) onFork(log);
                    }}
                  >
                    <Ionicons name="download-outline" size={16} color="#60a5fa" />
                    <Text style={[styles.actionButtonText, styles.forkButtonText]}>
                      {t('fork')}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {canDeleteLog && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={handleDelete}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                      {t('delete')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1F2937',
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  completedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#22c55e',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.2)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#22c55e', // Use green for workout logs (vs purple for programs)
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTabButtonText: {
    color: '#22c55e', // Use green for workout logs
  },
  scrollContent: {
    maxHeight: 400,
  },
  scrollContentContainer: {
    padding: 16,
  },
  tabContent: {
    minHeight: 100,
  },
  // Overview Tab Styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  statBox: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 12,
    minWidth: 80,
    margin: 4,
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  statValueLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  completedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  inProgressBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  completedText: {
    color: '#22c55e',
  },
  inProgressText: {
    color: '#f97316',
  },
  detailsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailIcon: {
    fontSize: 18,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  detailSubValue: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  notesContainer: {
    marginBottom: 24,
  },
  notesBox: {
    padding: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 12,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#D1D5DB',
  },
  // Exercises Tab Styles
  exercisesListContainer: {
    marginBottom: 24,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  exerciseMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exerciseStats: {
    flexDirection: 'row',
  },
  exerciseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseStatText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // Action Buttons
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(75, 85, 99, 0.2)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    margin: 4,
    minWidth: 100,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  editButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  editButtonText: {
    color: '#60a5fa',
  },
  forkButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  forkButtonText: {
    color: '#60a5fa',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
});

export default WorkoutLogDetailModal;