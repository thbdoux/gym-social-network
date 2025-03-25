// components/workouts/ProgramCard.tsx
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Animated, 
  Modal,
  Pressable,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

interface Program {
  id: number;
  name: string;
  description?: string;
  focus: string;
  difficulty_level: string;
  creator_username: string;
  is_active: boolean;
  sessions_per_week: number;
  estimated_completion_weeks: number;
  created_at: string;
  workouts?: any[];
  tags?: string[];
  forked_from?: number;
  is_public?: boolean;
  is_shared_with_me?: boolean;
}

interface ProgramCardProps {
  program: Program;
  currentUser?: string;
  onEdit?: (program: Program) => void;
  onDelete?: (programId: number) => void;
  onToggleActive?: (programId: number) => Promise<void>;
  onShare?: (program: Program) => void;
  onFork?: (programId: number) => Promise<void>;
  onProgramSelect?: (program: Program) => void;
  compact?: boolean;
  feedMode?: boolean;
}

const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  currentUser,
  onEdit,
  onDelete,
  onToggleActive,
  onShare,
  onFork,
  onProgramSelect,
  compact = false,
  feedMode = false,
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<boolean>(false);
  
  // Animation for expand/collapse
  const expandAnim = useRef(new Animated.Value(0)).current;
  
  if (!program) {
    return null;
  }
  
  // Permission checks
  const isCreator = program.creator_username === currentUser;
  const canEditProgram = isCreator && !feedMode;
  const canShareProgram = isCreator;
  const canDeleteProgram = isCreator && !feedMode;
  const canToggleActive = isCreator && !feedMode;
  const canForkProgram = !isCreator && (program.is_public || program.is_shared_with_me);
  
  const getFocusIcon = (focus: string) => {
    switch(focus) {
      case 'strength': return 'trophy';
      case 'hypertrophy': return 'layers';
      case 'endurance': return 'pulse';
      case 'weight_loss': return 'ribbon';
      case 'strength_hypertrophy': return 'star';
      default: return 'trending-up';
    }
  };
  
  const getDifficultyIcon = (level?: string) => {
    switch(level?.toLowerCase()) {
      case 'beginner': return '🔰';
      case 'intermediate': return '⚡';
      case 'advanced': return '💪';
      case 'expert': return '🏆';
      default: return '✓';
    }
  };

  const toggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;
    Animated.timing(expandAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false
    }).start();
    setIsExpanded(!isExpanded);
  };
  
  const handleToggleActive = async (): Promise<void> => {
    if (isToggling || !onToggleActive) return;
    
    try {
      setIsToggling(true);
      await onToggleActive(program.id);
    } catch (error) {
      console.error('Failed to toggle active state:', error);
    } finally {
      setIsToggling(false);
    }
  };

  // Calculate max height for animation
  const maxHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120] // Reduced from 200 as we're removing details
  });
  
  // Map weekdays
  const WEEKDAYS = [t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')];
  
  return (
    <View style={[
      styles.container, 
      program.is_active ? styles.containerActive : styles.containerRegular
    ]}>
      {/* Active Program Indicator */}
      {program.is_active && <View style={styles.activeIndicator} />}
      
      {/* Fork button moved to action buttons section */}
      
      {/* Main Card Content */}
      <TouchableOpacity 
        style={styles.contentContainer}
        onPress={feedMode ? () => onProgramSelect && onProgramSelect(program) : toggleExpand}
        activeOpacity={0.7}
      >
        {/* Main Content Area */}
        <View style={styles.mainContentArea}>
          {/* Title and Basic Info */}
          <View style={styles.titleAndInfoContainer}>
            <View style={styles.titleWrapper}>
              <Text style={styles.title} numberOfLines={1}>
                {program.name}
              </Text>
              
              {/* Active/Inactive Badge */}
              {program.is_active ? (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{t('active')}</Text>
                </View>
              ) : (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveBadgeText}>{t('inactive')}</Text>
                </View>
              )}
            </View>
            
            {/* Stats Row - moved below title */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="calendar-outline" size={14} style={styles.calendarIcon} />
                <Text style={styles.statValue}>{program.sessions_per_week}x</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Ionicons name="barbell-outline" size={14} style={styles.barbellIcon} />
                <Text style={styles.statValue}>{program.workouts?.length || 0}</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.levelIcon}>
                  {getDifficultyIcon(program.difficulty_level)}
                </Text>
                <Text style={styles.statValue}>{t(program.difficulty_level)}</Text>
              </View>
              
              {program.focus && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Ionicons name={getFocusIcon(program.focus)} size={14} style={styles.focusIcon} />
                    <Text style={styles.statValue}>{t(program.focus.replace(/_/g, ' '))}</Text>
                  </View>
                </>
              )}
            </View>
            
            {/* Creator Info */}
            <View style={styles.creatorRow}>
              <Ionicons name="person-outline" size={12} color="#9ca3af" />
              <Text style={styles.creatorText} numberOfLines={1}>
                {program.creator_username}
              </Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Options Menu - Always first/top */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowOptionsMenu(true)}
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
            </TouchableOpacity>
            
            {/* Fork button for non-creators - Using download icon now */}
            {canForkProgram && (
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => onFork && onFork(program.id)}
              >
                <Ionicons name="download-outline" size={18} color="#60a5fa" />
              </TouchableOpacity>
            )}
            
            {/* Show expand indicator in non-feed mode - Always last/bottom */}
            {!feedMode && (
              <TouchableOpacity 
                onPress={toggleExpand}
                style={styles.actionButton}
              >
                <Ionicons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={18} 
                  color="#9ca3af" 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Calendar section - Always visible even when not expanded */}
      <View style={styles.calendarSection}>
        <Text style={styles.sectionLabel}>{t('weekly_schedule')}</Text>
        <View style={styles.weekdaysRow}>
          {WEEKDAYS.map((day, index) => {
            const hasWorkouts = program.workouts?.some(w => w.preferred_weekday === index);
            const workoutsForDay = program.workouts?.filter(w => w.preferred_weekday === index) || [];
            
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.weekdayItem}
                onPress={() => {
                  if (workoutsForDay.length > 0 && onProgramSelect) {
                    // Clicking on a day with workouts will show workout content
                    onProgramSelect({...program, activeWeekday: index});
                  }
                }}
                disabled={!workoutsForDay.length}
              >
                <Text style={styles.weekdayLabel}>{day}</Text>
                <View 
                  style={[
                    styles.weekdayIndicator,
                    hasWorkouts ? styles.weekdayActive : styles.weekdayInactive
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      
      {/* Expandable Details Section - Only in non-feed mode */}
      {!feedMode && (
        <Animated.View style={[styles.expandedSection, { maxHeight }]}>
          <View style={styles.expandedContent}>
            {/* Workouts List */}
            {program.workouts && program.workouts.length > 0 && (
              <View style={styles.workoutsSection}>
                <Text style={styles.sectionLabel}>{t('workouts')}</Text>
                <View style={styles.workoutsList}>
                  {program.workouts.map((workout, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.workoutItem}
                      onPress={() => {
                        if (onProgramSelect) {
                          onProgramSelect({...program, activeWorkoutId: workout.id});
                        }
                      }}
                    >
                      <View style={styles.workoutIconContainer}>
                        <Ionicons name="barbell" size={16} style={styles.barbellIcon} />
                      </View>
                      <View style={styles.workoutDetails}>
                        <Text style={styles.workoutName} numberOfLines={1}>
                          {workout.name}
                        </Text>
                        <Text style={styles.workoutDay}>
                          {workout.preferred_weekday !== undefined ? 
                            WEEKDAYS[workout.preferred_weekday] : 
                            t('any_day')}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Action Buttons in Expanded View - Only when not in feed mode */}
            {canToggleActive && !feedMode && (
              <View style={styles.expandedActions}>
                <TouchableOpacity 
                  style={[
                    program.is_active ? styles.deactivateButton : styles.activateButton
                  ]}
                  onPress={handleToggleActive}
                  disabled={isToggling}
                >
                  {isToggling ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons 
                        name={program.is_active ? "toggle" : "toggle-outline"} 
                        size={16} 
                        color={program.is_active ? "#fff" : "#c084fc"} 
                      />
                      <Text 
                        style={[
                          styles.actionButtonText,
                          program.is_active ? styles.deactivateButtonText : styles.activateButtonText
                        ]}
                      >
                        {program.is_active ? t('deactivate') : t('activate')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
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
            <Text style={styles.optionsTitle}>{program.name}</Text>
            
            {/* View Details */}
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsMenu(false);
                onProgramSelect && onProgramSelect(program);
              }}
            >
              <Ionicons name="eye-outline" size={20} color="#60a5fa" />
              <Text style={styles.optionText}>{t('view_details')}</Text>
            </TouchableOpacity>
            
            {/* Edit option - only for creator and not in feed mode */}
            {canEditProgram && (
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  onEdit && onEdit(program);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#60a5fa" />
                <Text style={styles.optionText}>{t('edit_program')}</Text>
              </TouchableOpacity>
            )}
            
            {/* Share option */}
            {canShareProgram && (
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  onShare && onShare(program);
                }}
              >
                <Ionicons name="share-social-outline" size={20} color="#60a5fa" />
                <Text style={styles.optionText}>{t('share_program')}</Text>
              </TouchableOpacity>
            )}
            
            {/* Toggle active - only for creator and not in feed mode */}
            {canToggleActive && (
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  handleToggleActive();
                }}
              >
                <Ionicons 
                  name={program.is_active ? "toggle" : "toggle-outline"} 
                  size={20} 
                  color={program.is_active ? "#22c55e" : "#60a5fa"} 
                />
                <Text style={styles.optionText}>
                  {program.is_active ? t('deactivate_program') : t('activate_program')}
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Fork option for non-creators */}
            {canForkProgram && (
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  onFork && onFork(program.id);
                }}
              >
                <Ionicons name="download-outline" size={20} color="#60a5fa" />
                <Text style={styles.optionText}>{t('fork_program')}</Text>
              </TouchableOpacity>
            )}
            
            {/* Delete option - only for creator and not in feed mode */}
            {canDeleteProgram && (
              <TouchableOpacity 
                style={[styles.optionItem, styles.deleteOption]}
                onPress={() => {
                  setShowOptionsMenu(false);
                  onDelete && onDelete(program.id);
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text style={styles.deleteOptionText}>{t('delete_program')}</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(192, 132, 252, 0.1)', // Light purple background for all cards
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.5)', // Purple border for all cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
  },
  containerRegular: {
    // Styles shared by all cards now
  },
  containerActive: {
    // Styles shared by all cards now
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#c084fc',
    zIndex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  forkButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  mainContentArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleAndInfoContainer: {
    flex: 1,
    paddingRight: 16,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  activeBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  inactiveBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#22c55e',
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    marginHorizontal: 6,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#d1d5db',
    marginLeft: 4,
  },
  levelIcon: {
    fontSize: 14,
  },
  // Colorized stat icons
  calendarIcon: {
    color: '#f97316', // Orange
  },
  barbellIcon: {
    color: '#c084fc', // Purple
  },
  focusIcon: {
    color: '#60a5fa', // Blue
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  actionButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  expandedSection: {
    overflow: 'hidden',
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.3)',
  },
  calendarSection: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.3)',
  },
  workoutsSection: {
    marginBottom: 16,
  },
  workoutsList: {
    marginTop: 8,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.1)',
  },
  workoutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutDetails: {
    flex: 1,
  },
  workoutName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e5e7eb',
  },
  workoutDay: {
    fontSize: 12,
    color: '#9ca3af',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekdayItem: {
    alignItems: 'center',
  },
  weekdayLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  weekdayIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  weekdayActive: {
    backgroundColor: '#c084fc',
  },
  weekdayInactive: {
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
  },
  weekdayButton: {
    padding: 4, // Makes the touch target larger
  },
  expandedActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  deactivateButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    maxWidth: 200,
  },
  activateButton: {
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    maxWidth: 200,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  activateButtonText: {
    color: '#c084fc',
  },
  deactivateButtonText: {
    color: '#fff',
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

export default ProgramCard;