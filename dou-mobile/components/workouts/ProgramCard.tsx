// components/workouts/ProgramCard.tsx
import React, { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Easing,
  Modal
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
  disableNavigation?: boolean;
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
  onLongPress,
  disableNavigation = false
}) => {
  const { t } = useLanguage();
  const { programPalette } = useTheme();
  const isOwner = currentUser === program.creator_username;
  const [showForkModal, setShowForkModal] = useState(false);
  const [forkedProgramId, setForkedProgramId] = useState<number | null>(null);

  const { data: originalProgram, isLoading, refetch } = useProgram(program?.forked_from);
  // Animation for selection mode
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Animation for modal
  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  
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
  const WEEKDAYS = [t('mon'),t('tue'),t('wed'),t('thu'),t('fri'),t('sat'),t('sun')];
  
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
    } else if (disableNavigation) {
      // If navigation is disabled, do nothing or trigger onSelect if provided
      onSelect && onSelect();
    } else if (onProgramSelect) {
      // Use the callback if provided
      onProgramSelect(program);
    } else {
      // Fall back to direct navigation
      router.push(`/program/${programId}`);
    }
  };

  const handleFork = async (e: any) => {
    e.stopPropagation();
    if (onFork) {
      try {
        // Fork the program and get the result
        const forkedProgram = await onFork(program?.id);
        setForkedProgramId(forkedProgram?.id || programId);
        
        // Show success modal with animation
        setShowForkModal(true);
        
        // Start modal animation
        modalScaleAnim.setValue(0.7);
        modalOpacityAnim.setValue(0);
        
        Animated.parallel([
          Animated.spring(modalScaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true
          }),
          Animated.timing(modalOpacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          })
        ]).start();
      } catch (error) {
        console.error('Error forking program:', error);
      }
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
  
  // Navigate to forked program
  const goToProgram = () => {
    setShowForkModal(false);
    if (forkedProgramId) {
      router.push(`/program/${forkedProgramId}`);
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
  
  // Modal animation style
  const modalAnimatedStyle = {
    opacity: modalOpacityAnim,
    transform: [
      { scale: modalScaleAnim }
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
              // For non-owner: show bookmark button
              !selectionMode && (
                <TouchableOpacity 
                  style={styles.bookmarkButton}
                  onPress={handleFork}
                >
                  <Ionicons 
                    name="bookmark-outline" 
                    size={22} 
                    color={programPalette.text} 
                  />
                </TouchableOpacity>
              )
            )}
          </View>
          
          {/* Focus area (goal) */}
          <View style={styles.focusRow}>
            <Text style={[styles.focusText, { color: programPalette.text_secondary }]}>
              {formatFocus(program.focus)}
            </Text>
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
          {program.forked_from && (
            <View style={[styles.forkedInfo, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
              <Ionicons name="download-outline" size={12} color={programPalette.text_secondary} />
              <Text style={[styles.forkedText, { color: programPalette.text_secondary }]}>
                {originalProgram?.creator_username}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Success Modal */}
      <Modal
        visible={showForkModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowForkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
            <View style={styles.modalContent}>
              <View style={styles.successIconContainer}>
                <Ionicons name="bookmark" size={40} color="#7e22ce" />
              </View>
              <Text style={styles.modalTitle}>Program Saved!</Text>
              <Text style={styles.modalDescription}>
                The program has been added to your collection.
              </Text>
              <TouchableOpacity
                style={styles.goToProgramButton}
                onPress={goToProgram}
              >
                <Text style={styles.goToProgramText}>Go to Program</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowForkModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
    marginBottom: 0,
  },
  focusText: {
    fontSize: 16,
    fontWeight: '600',
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  forkedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  forkedText: {
    fontSize: 11,
    marginLeft: 4,
  },
  bookmarkButton: {
    padding: 6,
    borderRadius: 20,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(126, 34, 206, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  goToProgramButton: {
    backgroundColor: '#7e22ce',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  goToProgramText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
});

export default ProgramCard;