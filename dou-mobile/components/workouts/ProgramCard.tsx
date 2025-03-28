// components/workouts/ProgramCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';

interface ProgramCardProps {
  programId: number;
  program: {
    id: number;
    name: string;
    focus: string;
    difficulty_level: string;
    creator_username: string;
    is_active?: boolean;
    sessions_per_week: number;
    estimated_completion_weeks: number;
    workouts?: any[];
    tags?: string[];
    is_public?: boolean;
  };
  inFeedMode?: boolean;
  currentUser?: string;
  onProgramSelect?: (program: any) => void;
  onFork?: (programId: number) => Promise<any>;
}

const ProgramCard: React.FC<ProgramCardProps> = ({
  programId,
  program,
  inFeedMode = false,
  currentUser,
  onFork
}) => {
  const { t } = useLanguage();
  const { openProgramDetail } = useModal();
  const isOwner = currentUser === program.creator_username;

  // Get weekdays for program schedule visualization
  const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  // Format focus text (convert snake_case to Title Case)
  const formatFocus = (focus: string) => {
    return focus
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleCardPress = () => {
    openProgramDetail(program);
  };

  const handleFork = (e: any) => {
    e.stopPropagation();
    if (onFork) {
      onFork(programId);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleCardPress}
      style={styles.container}
    >
      {/* Main content */}
      <View style={styles.cardContent}>
        {/* Title and badges row */}
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {program.name}
          </Text>
          
          {program.is_active && (
            <View style={styles.activeBadge}>
              <Text style={styles.badgeText}>{t('active')}</Text>
            </View>
          )}
        </View>
        
        {/* Focus area (goal) */}
        <View style={styles.focusRow}>
          <Text style={styles.focusText}>
            {formatFocus(program.focus)}
          </Text>
        </View>
        
        {/* Info row */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('level')}</Text>
            <Text style={styles.infoValue}>{program.difficulty_level}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('sessions')}</Text>
            <Text style={styles.infoValue}>{program.sessions_per_week}x</Text>
          </View>
        </View>
      </View>
      
      {/* Weekly schedule visualization */}
      <View style={styles.scheduleRow}>
        {WEEKDAYS.map((day, index) => {
          const hasWorkout = program.workouts?.some(w => 
            w.preferred_weekday === index
          );
          
          return (
            <View key={index} style={styles.dayItem}>
              <Text style={styles.dayText}>{day}</Text>
              <View style={[
                styles.dayIndicator,
                hasWorkout ? styles.dayActive : styles.dayInactive
              ]} />
            </View>
          );
        })}
      </View>
      
      {/* Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.creatorInfo}>
          <Ionicons name="person" size={12} color="#9CA3AF" />
          <Text style={styles.creatorText}>{program.creator_username}</Text>
        </View>
        
        {!isOwner && (
          <TouchableOpacity 
            style={styles.forkButton}
            onPress={handleFork}
          >
            <Ionicons name="download-outline" size={14} color="#FFFFFF" />
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
    backgroundColor: '#7e22ce', // Deeper, more vigorous purple
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  cardContent: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  activeBadge: {
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
  badgeText: {
    color: '#7e22ce',
    fontSize: 12,
    fontWeight: '700',
  },
  focusRow: {
    marginBottom: 12,
  },
  focusText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoItem: {
    marginRight: 16,
  },
  infoLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  dayItem: {
    alignItems: 'center',
  },
  dayText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  dayIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dayActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  dayInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
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
    color: '#7e22ce',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  workoutBubbles: {
    position: 'absolute',
    top: 25,
    left: -20,
    width: 60,
    alignItems: 'center',
  },
  workoutBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 5,
    marginTop: 2,
    maxWidth: 60,
  },
  workoutName: {
    color: '#7e22ce',
    fontSize: 8,
    fontWeight: '600',
  },
  moreBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 5,
    marginTop: 2,
  },
  moreText: {
    color: '#7e22ce',
    fontSize: 8,
    fontWeight: '600',
  }
});

export default ProgramCard;