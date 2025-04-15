// components/workouts/ProgramCard.tsx
import React, { useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useProgram } from '../../hooks/query/useProgramQuery';
import { useTheme } from '../../context/ThemeContext';

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
    forked_from?: string; // Added forked_from property
  };
  inFeedMode?: boolean;
  currentUser?: string;
  onProgramSelect?: (program: any) => void;
  onFork?: (programId: number) => Promise<any>;
  onToggleActive?: (programId: number) => Promise<any>; // New prop for toggling active state
  // Selection mode props
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onLongPress?: () => void;
}

const ProgramCard: React.FC<ProgramCardProps> = ({
  programId,
  program,
  inFeedMode = false,
  currentUser,
  onFork,
  onProgramSelect,
  onToggleActive, 
  selectionMode = false,
  isSelected = false,
  onSelect,
  onLongPress
}) => {
  const { t } = useLanguage();
  const { programPalette } = useTheme();
  const isOwner = currentUser === program.creator_username;

  const { data: originalProgram, isLoading, refetch } = useProgram(program?.forked_from);
  // Animation for selection mode
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Start wiggle animation when entering selection mode
  useEffect(() => {
    if (selectionMode) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(wiggleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
            easing: Easing.linear
          }),
          Animated.timing(wiggleAnim, {
            toValue: -1,
            duration: 200,
            useNativeDriver: true,
            easing: Easing.linear
          }),
          Animated.timing(wiggleAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
            easing: Easing.linear
          })
        ])
      ).start();
      
      // Also add a small "pop" scale animation when first entering selection mode
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        })
      ]).start();
    } else {
      // Stop animation when exiting selection mode
      wiggleAnim.stopAnimation();
      wiggleAnim.setValue(0);
    }
  }, [selectionMode, wiggleAnim, scaleAnim]);
  
  // Animation for selection/deselection
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: isSelected ? 0.95 : 0.98,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  }, [isSelected, scaleAnim]);

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
    if (selectionMode) {
      onSelect && onSelect();
    } else if (onProgramSelect) {
      // Use the callback if provided
      onProgramSelect(program);
    } else {
      // Fall back to direct navigation
      router.push(`/program/${programId}`);
    }
  };

  const handleFork = (e: any) => {
    e.stopPropagation();
    if (onFork) {
      onFork(program?.id);
    }
  };
  
  const handleLongPress = () => {
    onLongPress && onLongPress();
  };
  
  // New handler for toggling active state
  const handleToggleActive = (e: any) => {
    e.stopPropagation(); // Prevent the card's onPress from firing
    if (onToggleActive) {
      onToggleActive(programId);
    }
  };

  // Combine animations for wiggle effect
  const animatedStyle = {
    transform: [
      { rotate: wiggleAnim.interpolate({
          inputRange: [-1, 1],
          outputRange: ['-1deg', '1deg']
        })
      },
      { scale: scaleAnim }
    ]
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleCardPress}
        onLongPress={handleLongPress}
        delayLongPress={200}
        style={[
          styles.container,
          { backgroundColor: programPalette.background },
          isSelected && [styles.selectedContainer, { borderColor: programPalette.text }]
        ]}
      >
        {/* Selection indicator */}
        {selectionMode && (
          <View style={styles.selectionIndicator}>
            <View style={[
              styles.checkbox,
              isSelected && [styles.checkboxSelected, { backgroundColor: programPalette.background }]
            ]}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
          </View>
        )}
        
        {/* Delete button (X) that appears when in selection mode */}
        {selectionMode && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={onSelect}
          >
            <View style={styles.deleteCircle}>
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
        
        {/* Main content */}
        <View style={styles.cardContent}>
          {/* Title and badges row */}
          <View style={styles.topRow}>
            <View style={styles.titleContainer}>
              <View style={[styles.programBadge, { backgroundColor: programPalette.badge_bg }]}>
                <Text style={[styles.programBadgeText, { color: programPalette.text }]}>
                  {t('program')}
                </Text>
              </View>
              <Text style={[styles.title, { color: programPalette.text }]} numberOfLines={1}>
                {program.name}
              </Text>
            </View>
            
            {isOwner ? (
              // For owner: show touchable badge that can toggle active state
              <TouchableOpacity 
                style={[
                  styles.activeBadge,
                  program.is_active ? styles.activeBadgeActive : styles.activeBadgeInactive
                ]}
                onPress={handleToggleActive}
                activeOpacity={0.7}
              >
                <View style={styles.statusIndicator}>
                  <Ionicons 
                    name={program.is_active ? "checkmark-circle" : "ellipse-outline"} 
                    size={12} 
                    color={program.is_active ? "#10B981" : "#6B7280"} 
                    style={{marginRight: 4}} 
                  />
                </View>
                <Text style={[
                  styles.badgeText,
                  program.is_active ? styles.badgeTextActive : styles.badgeTextInactive
                ]}>
                  {program.is_active ? t('active') : t('inactive')}
                </Text>
              </TouchableOpacity>
            ) : (
              // For non-owner: show only if active, not touchable
              program.is_active && (
                <View style={styles.activeBadge}>
                  <Text style={styles.badgeText}>{t('active')}</Text>
                </View>
              )
            )}
          </View>
          
          {/* Focus area (goal) */}
          <View style={styles.focusRow}>
            <Text style={[styles.focusText, { color: programPalette.text_secondary }]}>
              {formatFocus(program.focus)}
            </Text>
          </View>
          
          {/* Info row */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: programPalette.text_secondary }]}>
                {t('level')}
              </Text>
              <Text style={[styles.infoValue, { color: programPalette.text }]}>
                {program.difficulty_level}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: programPalette.text_secondary }]}>
                {t('sessions')}
              </Text>
              <Text style={[styles.infoValue, { color: programPalette.text }]}>
                {program.sessions_per_week}x
              </Text>
            </View>
          </View>
        </View>
        
        {/* Weekly schedule visualization */}
        <View style={[styles.scheduleRow, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}>
          {WEEKDAYS.map((day, index) => {
            const hasWorkout = program.workouts?.some(w => 
              w.preferred_weekday === index
            );
            
            return (
              <View key={index} style={styles.dayItem}>
                <Text style={[styles.dayText, { color: programPalette.text_secondary }]}>
                  {day}
                </Text>
                <View style={[
                  styles.dayIndicator,
                  hasWorkout 
                    ? [styles.dayActive, { backgroundColor: programPalette.text }] 
                    : [styles.dayInactive, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]
                ]} />
              </View>
            );
          })}
        </View>
        
        {/* Actions */}
        <View style={styles.actionsRow}>
          <View style={styles.creatorInfo}>
            <Ionicons name="person" size={12} color={programPalette.text_secondary} />
            <Text style={[styles.creatorText, { color: programPalette.text_secondary }]}>
              {program.creator_username}
            </Text>
          </View>
          
          {program.forked_from && (
            <View style={[styles.forkedInfo, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
              <Ionicons name="download-outline" size={12} color={programPalette.text_secondary} />
              <Text style={[styles.forkedText, { color: programPalette.text_secondary }]}>
                {originalProgram?.creator_username}
              </Text>
            </View>
          )}
          
          {!isOwner && !selectionMode && (
            <TouchableOpacity 
              style={[styles.forkButton, { backgroundColor: programPalette.action_bg }]}
              onPress={handleFork}
            >
              <Ionicons name="download-outline" size={14} color={programPalette.highlight} />
              <Text style={[styles.forkText, { color: programPalette.highlight }]}>
                {t('fork')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative', // For the selection indicator
  },
  selectedContainer: {
    borderWidth: 2,
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
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  programBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  programBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginRight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  activeBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  activeBadgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    color: '#7e22ce',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#7e22ce',
  },
  badgeTextInactive: {
    color: '#6B7280',
  },
  focusRow: {
    marginBottom: 12,
  },
  focusText: {
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  dayItem: {
    alignItems: 'center',
  },
  dayText: {
    fontSize: 11,
    marginBottom: 4,
  },
  dayIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dayActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  dayInactive: {
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
    marginLeft: 4,
  },
  forkedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  forkedText: {
    fontSize: 11,
    marginLeft: 4,
  },
  forkButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  // Selection mode styles
  selectionIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7e22ce',
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  deleteCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#111827',
  },
});

export default ProgramCard;