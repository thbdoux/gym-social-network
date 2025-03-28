// components/workouts/WorkoutLogCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';

interface WorkoutLogCardProps {
  logId: number;
  log: {
    id: number;
    name: string;
    date: string;
    username?: string;
    program?: number;
    program_name?: string;
    gym_name?: string;
    completed: boolean;
    mood_rating?: number;
    perceived_difficulty?: number;
    exercises?: any[];
    duration?: number;
    notes?: string;
  };
  user: string;
  inFeedMode?: boolean;
  onFork?: (log: any) => Promise<void>;
}

const WorkoutLogCard: React.FC<WorkoutLogCardProps> = ({
  logId,
  log,
  user,
  inFeedMode = false,
  onFork
}) => {
  const { t } = useLanguage();
  const { openWorkoutLogDetail } = useModal();
  const isOwner = user === log.username;

  // Format the date
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return '';
      // Check if date is in DD/MM/YYYY format
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(`${year}-${month}-${day}`).toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      // Otherwise try standard parsing
      return new Date(dateString).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString; // If parsing fails, return the original string
    }
  };

  // Get mood emoji based on rating
  const getMoodEmoji = (rating?: number): string => {
    if (!rating) return '😐';
    if (rating >= 4.5) return '😀';
    if (rating >= 3.5) return '🙂';
    if (rating >= 2.5) return '😐';
    if (rating >= 1.5) return '😕';
    return '😞';
  };

  // Get difficulty indicator based on rating
  const getDifficultyIndicator = (rating?: number): string => {
    if (!rating) return '🔥';
    if (rating >= 8) return '🔥🔥🔥';
    if (rating >= 5) return '🔥🔥';
    return '🔥';
  };

  const handleCardPress = () => {
    openWorkoutLogDetail(log);
  };

  const handleFork = (e: any) => {
    e.stopPropagation();
    if (onFork) {
      onFork(log);
    }
  };

  // Get Exercise count
  const exerciseCount = log.exercises?.length || 0;
  
  // First 3 exercise names for display
  const exerciseNames = log.exercises?.slice(0, 3).map(ex => ex.name || "Exercise") || [];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleCardPress}
      style={styles.container}
    >
      {/* Completed indicator strip */}
      {log.completed && <View style={styles.completedStrip} />}
      
      {/* Main content */}
      <View style={styles.cardContent}>
        {/* Top row with date, location and status */}
        <View style={styles.topRow}>
          <View style={styles.dateLocationContainer}>
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{formatDate(log.date)}</Text>
              <View style={[
                styles.statusDot,
                log.completed ? styles.completedDot : styles.pendingDot
              ]} />
            </View>
            
            {log.gym_name && (
              <View style={styles.gymContainer}>
                <Ionicons name="location" size={12} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.gymText}>{log.gym_name}</Text>
              </View>
            )}
          </View>
          
          {log.completed ? (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>{t('completed')}</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>{t('in_progress')}</Text>
            </View>
          )}
        </View>
        
        {/* Workout title */}
        <Text style={styles.title} numberOfLines={1}>
          {log.name}
        </Text>
        
        {/* Program name if available */}
        {log.program_name && (
          <View style={styles.programRow}>
            <Ionicons name="barbell-outline" size={12} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.programText} numberOfLines={1}>
              {log.program_name}
            </Text>
          </View>
        )}
        
        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t('exercises')}</Text>
            <Text style={styles.statValue}>{exerciseCount}</Text>
          </View>
          
          {log.duration && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('duration')}</Text>
              <Text style={styles.statValue}>{log.duration}m</Text>
            </View>
          )}
          
          {log.mood_rating && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('mood')}</Text>
              <Text style={styles.moodValue}>{getMoodEmoji(log.mood_rating)}</Text>
            </View>
          )}
          
          {log.perceived_difficulty && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('difficulty')}</Text>
              <Text style={styles.difficultyValue}>
                {getDifficultyIndicator(log.perceived_difficulty)}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Exercise bubbles */}
      {exerciseCount > 0 && (
        <View style={styles.exerciseRow}>
          {exerciseNames.map((name, index) => (
            <View key={index} style={styles.exerciseBubble}>
              <Text style={styles.exerciseName} numberOfLines={1}>
                {name}
              </Text>
            </View>
          ))}
          {exerciseCount > 3 && (
            <View style={styles.moreBubble}>
              <Text style={styles.moreText}>+{exerciseCount - 3}</Text>
            </View>
          )}
        </View>
      )}
      
      {/* Bottom actions row */}
      <View style={styles.actionsRow}>
        <View style={styles.spacer}></View>
        
        {!isOwner && (
          <TouchableOpacity 
            style={styles.forkButton}
            onPress={handleFork}
          >
            <Ionicons name="download-outline" size={14} color="#166534" />
            <Text style={styles.forkText}>{t('fork')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#16a34a', // Deeper green
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
  },
  completedStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#ffffff',
  },
  cardContent: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dateLocationContainer: {
    flex: 1,
    marginRight: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  gymContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gymText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  completedDot: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  pendingDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  completedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  completedText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  pendingText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  programRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  programText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  moodValue: {
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  difficultyValue: {
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  exerciseRow: {
    flexDirection: 'row',
    padding: 0,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  exerciseBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
    maxWidth: 120,
  },
  exerciseName: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '600',
  },
  moreBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  moreText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  spacer: {
    flex: 1,
  },
  forkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  forkText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  }
});

export default WorkoutLogCard;