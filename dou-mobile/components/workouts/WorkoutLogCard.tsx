// components/workouts/WorkoutLogCard.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Pressable,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext'; // Import useModal hook

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
  exercises?: any[];
  exercise_count?: number;
  mood_rating?: number;
  perceived_difficulty?: number;
  notes?: string;
  activeExerciseId?: number;
}

interface WorkoutLogCardProps {
  log: WorkoutLog;
  logId: number;
  user: string;
  onEdit?: (log: WorkoutLog) => void;
  onDelete?: (log: WorkoutLog) => void;
  onFork?: (log: WorkoutLog) => Promise<void>;
  onSelect?: (log: WorkoutLog) => void;
  inFeedMode?: boolean;
}

const WorkoutLogCard: React.FC<WorkoutLogCardProps> = ({ 
  log, 
  logId,
  user,
  onEdit, 
  onDelete, 
  onFork,
  onSelect,
  inFeedMode = false,
}) => {
  const { t } = useLanguage();
  const { openWorkoutLogDetail } = useModal(); // Get openWorkoutLogDetail from modal context
  const [showOptionsMenu, setShowOptionsMenu] = useState<boolean>(false);
  
  if (!log) {
    return null;
  }
  
  const currentUser = user;
  const isCreator = log.username === currentUser;
  const canFork = !isCreator;
  
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return '';
      // Check if date is in DD/MM/YYYY format
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(`${year}-${month}-${day}`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
      // Otherwise try standard parsing
      return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

  const getDifficultyLevel = (rating?: number): string => {
    if (!rating) return '🔥';
    if (rating >= 8) return '🔥🔥🔥';
    if (rating >= 6) return '🔥🔥';
    if (rating >= 4) return '🔥';
    return '✓';
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
  
  const handleOpenDetailModal = () => {
    // Use the global modal instead of local state
    openWorkoutLogDetail(log);
  };
  
  const exerciseCount = log.exercise_count || log.exercises?.length || 0;
  const gymName = log.gym_name || t('unknown_gym');

  return (
    <View style={[
      styles.container, 
      log.completed ? styles.containerCompleted : styles.containerRegular
    ]}>
      {/* Main Card Content */}
      <TouchableOpacity 
        style={styles.mainCard}
        onPress={handleOpenDetailModal}
        activeOpacity={0.7}
      >
        {/* Date Column */}
        <View style={styles.dateColumn}>
          <Text style={styles.dateText}>{formatDate(log.date)}</Text>
          <View style={[
            styles.statusIndicator, 
            log.completed ? styles.statusCompleted : styles.statusIncomplete
          ]} />
        </View>
        
        {/* Content Column */}
        <View style={styles.contentColumn}>
          {/* Title and Program */}
          <View style={styles.titleSection}>
            <Text style={styles.title} numberOfLines={2}>
              {log.name || log.workout_name || t('workout')}
            </Text>
            
            {/* Program and Gym Info Row */}
            <View style={styles.infoRow}>
              {log.program_name && (
                <View style={styles.infoTag}>
                  <Ionicons name="barbell-outline" size={12} color="#c084fc" style={styles.infoIcon} />
                  <Text style={styles.programText} numberOfLines={1}>
                    {log.program_name}
                  </Text>
                </View>
              )}
              
              {log.gym_name && (
                <View style={styles.infoTag}>
                  <Ionicons name="location-outline" size={12} color="#60a5fa" style={styles.infoIcon} />
                  <Text style={styles.gymText} numberOfLines={1}>
                    {log.gym_name}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Metrics Row */}
          <View style={styles.metricsRow}>
            {/* Exercise Count */}
            <View style={styles.metricItem}>
              <Ionicons name="barbell-outline" size={14} style={styles.barbellIcon} />
              <Text style={styles.metricText}>{exerciseCount}</Text>
            </View>
            
            {/* Duration */}
            {log.duration && (
              <View style={styles.metricItem}>
                <Ionicons name="time-outline" size={14} style={styles.durationIcon} />
                <Text style={styles.metricText}>{log.duration}m</Text>
              </View>
            )}
            
            {/* Mood */}
            {log.mood_rating && (
              <View style={styles.moodItem}>
                <Text style={styles.moodEmoji}>{getMoodEmoji(log.mood_rating)}</Text>
              </View>
            )}
            
            {/* Difficulty */}
            {log.perceived_difficulty && (
              <View style={[
                styles.difficultyItem,
                { opacity: Math.min(0.4 + (log.perceived_difficulty / 10) * 0.6, 1) }
              ]}>
                <Text style={styles.difficultyText}>
                  {getDifficultyLevel(log.perceived_difficulty)}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Actions Column */}
        <View style={styles.actionsColumn}>
          {/* Options Menu - Always first/top */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowOptionsMenu(true)}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
          </TouchableOpacity>
          
          {/* Fork button for non-creators - Using download icon now */}
          {canFork && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onFork && onFork(log)}
            >
              <Ionicons name="download-outline" size={18} color="#60a5fa" />
            </TouchableOpacity>
          )}
          
          {/* Detail View button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleOpenDetailModal}
          >
            <Ionicons name="eye-outline" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      
      {/* Exercise Progress Bar */}
      {exerciseCount > 0 && (
        <View style={styles.progressContainer}>
          {Array(Math.min(exerciseCount, 8)).fill(0).map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.progressSegment,
                log.completed ? styles.progressCompleted : styles.progressIncomplete,
                { width: `${100 / Math.min(exerciseCount, 8)}%` }
              ]}
            />
          ))}
        </View>
      )}
      
      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={styles.optionsMenu}>
            <Text style={styles.optionsTitle}>{log.name || log.workout_name || t('workout')}</Text>
            
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsMenu(false);
                handleOpenDetailModal();
              }}
            >
              <Ionicons name="eye-outline" size={20} color="#60a5fa" />
              <Text style={styles.optionText}>{t('view_details')}</Text>
            </TouchableOpacity>
            
            {isCreator && onEdit && (
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  onEdit(log);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#60a5fa" />
                <Text style={styles.optionText}>{t('edit_workout')}</Text>
              </TouchableOpacity>
            )}
            
            {canFork && (
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  onFork && onFork(log);
                }}
              >
                <Ionicons name="download-outline" size={20} color="#60a5fa" />
                <Text style={styles.optionText}>{t('fork_workout')}</Text>
              </TouchableOpacity>
            )}
            
            {isCreator && onDelete && (
              <TouchableOpacity 
                style={[styles.optionItem, styles.deleteOption]}
                onPress={() => {
                  setShowOptionsMenu(false);
                  handleDelete();
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text style={styles.deleteOptionText}>{t('delete_workout')}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.cancelOption}
              onPress={() => setShowOptionsMenu(false)}
            >
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Removed direct WorkoutLogDetailModal rendering */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(34, 197, 94, 0.07)', // Light green background for all cards
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)', // Green border for all cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  containerRegular: {
    // Styles shared by all cards now
  },
  containerCompleted: {
    // Styles shared by all cards now
  },
  mainCard: {
    flexDirection: 'row',
    minHeight: 80,
  },
  dateColumn: {
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(55, 65, 81, 0.2)',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#d1d5db',
    textAlign: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  statusCompleted: {
    backgroundColor: '#22c55e',
  },
  statusIncomplete: {
    backgroundColor: '#9ca3af',
  },
  contentColumn: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  titleSection: {
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 4,
  },
  programText: {
    fontSize: 10,
    color: '#c084fc',
    fontWeight: '500',
  },
  gymText: {
    fontSize: 10,
    color: '#60a5fa',
    fontWeight: '500',
  },
  infoIcon: {
    marginRight: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metricText: {
    fontSize: 12,
    color: '#d1d5db',
    marginLeft: 4,
  },
  moodItem: {
    marginRight: 12,
  },
  moodEmoji: {
    fontSize: 16,
  },
  // Colorized icons
  barbellIcon: {
    color: '#c084fc', // Purple
  },
  durationIcon: {
    color: '#22d3ee', // Cyan
  },
  locationIcon: {
    color: '#60a5fa', // Blue
  },
  difficultyIcon: {
    color: '#f87171', // Red
  },
  difficultyItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 12,
  },
  actionsColumn: {
    width: 40,
    alignItems: 'center',
    paddingVertical: 8,
    justifyContent: 'space-around',
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    height: 3,
  },
  progressSegment: {
    height: '100%',
    marginRight: 1,
  },
  progressCompleted: {
    backgroundColor: '#22c55e',
  },
  progressIncomplete: {
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  optionsMenu: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.3)',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.2)',
  },
  optionText: {
    fontSize: 15,
    marginLeft: 12,
    color: '#e5e7eb',
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  deleteOptionText: {
    fontSize: 15,
    marginLeft: 12,
    color: '#ef4444',
  },
  cancelOption: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#60a5fa',
  },
});

export default WorkoutLogCard;