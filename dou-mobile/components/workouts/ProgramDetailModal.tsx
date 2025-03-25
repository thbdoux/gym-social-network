// components/workouts/ProgramDetailModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  TouchableWithoutFeedback
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
  activeWeekday?: number;
  activeWorkoutId?: number;
}

interface ProgramDetailModalProps {
  visible: boolean;
  program: Program | null;
  onClose: () => void;
  currentUser?: string;
  onEdit?: (program: Program) => void;
  onDelete?: (programId: number) => void;
  onToggleActive?: (programId: number) => Promise<void>;
  onShare?: (program: Program) => void;
  onFork?: (programId: number) => Promise<void>;
  onWorkoutSelect?: (workoutId: number) => void;
}

const ProgramDetailModal: React.FC<ProgramDetailModalProps> = ({
  visible,
  program,
  onClose,
  currentUser,
  onEdit,
  onDelete,
  onToggleActive,
  onShare,
  onFork,
  onWorkoutSelect
}) => {
  const { t } = useLanguage();
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'workouts'>('overview');
  const [activeWeekday, setActiveWeekday] = useState<number | null>(null);
  
  // Reset active weekday when tab changes
  useEffect(() => {
    if (selectedTab === 'overview') {
      setActiveWeekday(null);
    }
  }, [selectedTab]);

  // Reset tab when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedTab('overview');
      setActiveWeekday(program?.activeWeekday !== undefined ? program.activeWeekday : null);
    }
  }, [visible, program]);

  if (!program) return null;

  // Permission checks
  const isCreator = program.creator_username === currentUser;
  const canEditProgram = isCreator;
  const canShareProgram = isCreator;
  const canDeleteProgram = isCreator;
  const canToggleActive = isCreator;
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

  const handleDelete = () => {
    Alert.alert(
      t('delete_program'),
      t('confirm_delete_program'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(program.id);
              onClose();
            }
          }
        }
      ]
    );
  };

  // Map weekdays
  const WEEKDAYS = [t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')];
  
  // Get workouts for the active weekday
  const filteredWorkouts = activeWeekday !== null 
    ? program.workouts?.filter(w => w.preferred_weekday === activeWeekday)
    : program.workouts;

  // Overview Tab Content
  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Program Description */}
      {program.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>{t('description')}</Text>
          <Text style={styles.descriptionText}>{program.description}</Text>
        </View>
      )}

      {/* Program Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Ionicons name="calendar-outline" size={20} color="#f97316" />
          <Text style={styles.statValue}>{program.sessions_per_week}x</Text>
          <Text style={styles.statLabel}>{t('sessions_week')}</Text>
        </View>

        <View style={styles.statBox}>
          <Ionicons name="time-outline" size={20} color="#22d3ee" />
          <Text style={styles.statValue}>{program.estimated_completion_weeks}</Text>
          <Text style={styles.statLabel}>{t('weeks')}</Text>
        </View>

        <View style={styles.statBox}>
          <Ionicons name="barbell-outline" size={20} color="#c084fc" />
          <Text style={styles.statValue}>{program.workouts?.length || 0}</Text>
          <Text style={styles.statLabel}>{t('workouts')}</Text>
        </View>
      </View>

      {/* Program Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <Text style={styles.detailIcon}>{getDifficultyIcon(program.difficulty_level)}</Text>
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>{t('difficulty')}</Text>
            <Text style={styles.detailValue}>{t(program.difficulty_level)}</Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <Ionicons name={getFocusIcon(program.focus)} size={16} color="#60a5fa" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>{t('focus')}</Text>
            <Text style={styles.detailValue}>{t(program.focus.replace(/_/g, ' '))}</Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="person-outline" size={16} color="#9ca3af" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>{t('creator')}</Text>
            <Text style={styles.detailValue}>{program.creator_username}</Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="calendar-outline" size={16} color="#f97316" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>{t('created')}</Text>
            <Text style={styles.detailValue}>
              {new Date(program.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Tags */}
      {program.tags && program.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          <Text style={styles.sectionTitle}>{t('tags')}</Text>
          <View style={styles.tagsList}>
            {program.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  // Workouts Tab Content
  const renderWorkoutsTab = () => (
    <View style={styles.tabContent}>
      {/* Week Schedule */}
      <View style={styles.weekScheduleContainer}>
        <Text style={styles.sectionTitle}>{t('weekly_schedule')}</Text>
        <View style={styles.weekdaysRow}>
          {WEEKDAYS.map((day, index) => {
            const hasWorkouts = program.workouts?.some(w => w.preferred_weekday === index);
            return (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.weekdayItem,
                  activeWeekday === index && styles.weekdayItemActive
                ]}
                onPress={() => {
                  setActiveWeekday(activeWeekday === index ? null : index);
                }}
              >
                <Text style={[
                  styles.weekdayLabel,
                  activeWeekday === index && styles.weekdayLabelActive
                ]}>
                  {day}
                </Text>
                <View 
                  style={[
                    styles.weekdayIndicator,
                    hasWorkouts ? styles.weekdayActive : styles.weekdayInactive,
                    activeWeekday === index && styles.weekdayIndicatorActive
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Workouts List */}
      <View style={styles.workoutsListContainer}>
        <View style={styles.workoutsHeader}>
          <Text style={styles.sectionTitle}>
            {activeWeekday !== null 
              ? `${t('workouts_for')} ${WEEKDAYS[activeWeekday]}` 
              : t('all_workouts')}
          </Text>
          {activeWeekday !== null && (
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={() => setActiveWeekday(null)}
            >
              <Text style={styles.clearFilterText}>{t('show_all')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredWorkouts && filteredWorkouts.length > 0 ? (
          filteredWorkouts.map((workout, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.workoutItem}
              onPress={() => onWorkoutSelect && onWorkoutSelect(workout.id)}
              activeOpacity={0.7}
            >
              <View style={styles.workoutIconContainer}>
                <Ionicons name="barbell" size={20} color="#c084fc" />
              </View>
              
              <View style={styles.workoutContent}>
                <Text style={styles.workoutName}>{workout.name}</Text>
                <View style={styles.workoutStats}>
                  {workout.exercise_count !== undefined && (
                    <View style={styles.workoutStat}>
                      <Ionicons name="fitness-outline" size={14} color="#9ca3af" />
                      <Text style={styles.workoutStatText}>
                        {workout.exercise_count} {t('exercises')}
                      </Text>
                    </View>
                  )}
                  
                  {workout.estimated_duration && (
                    <View style={styles.workoutStat}>
                      <Ionicons name="time-outline" size={14} color="#9ca3af" />
                      <Text style={styles.workoutStatText}>
                        {workout.estimated_duration} {t('min')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            {activeWeekday !== null ? (
              <Text style={styles.emptyStateText}>
                {t('no_workouts_for_day')}
              </Text>
            ) : (
              <Text style={styles.emptyStateText}>
                {t('no_workouts_in_program')}
              </Text>
            )}
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
                  <Text style={styles.headerTitle} numberOfLines={1}>{program.name}</Text>
                  {program.is_active && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>{t('active')}</Text>
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
                    selectedTab === 'workouts' && styles.activeTabButton
                  ]}
                  onPress={() => setSelectedTab('workouts')}
                >
                  <Text style={[
                    styles.tabButtonText,
                    selectedTab === 'workouts' && styles.activeTabButtonText
                  ]}>
                    {t('workouts')}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Content */}
              <ScrollView 
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={true}
              >
                {selectedTab === 'overview' ? renderOverviewTab() : renderWorkoutsTab()}
              </ScrollView>
              
              {/* Action Buttons */}
              <View style={styles.actions}>
                {canToggleActive && (
                  <TouchableOpacity 
                    style={[
                      styles.actionButton,
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
                )}
                
                {canEditProgram && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => {
                      onClose();
                      if (onEdit) onEdit(program);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#60a5fa" />
                    <Text style={[styles.actionButtonText, styles.editButtonText]}>
                      {t('edit')}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {canShareProgram && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.shareButton]}
                    onPress={() => {
                      onClose();
                      if (onShare) onShare(program);
                    }}
                  >
                    <Ionicons name="share-social-outline" size={16} color="#f97316" />
                    <Text style={[styles.actionButtonText, styles.shareButtonText]}>
                      {t('share')}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {canForkProgram && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.forkButton]}
                    onPress={() => {
                      onClose();
                      if (onFork) onFork(program.id);
                    }}
                  >
                    <Ionicons name="download-outline" size={16} color="#60a5fa" />
                    <Text style={[styles.actionButtonText, styles.forkButtonText]}>
                      {t('fork')}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {canDeleteProgram && (
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
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  activeBadgeText: {
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
    borderBottomColor: '#c084fc',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTabButtonText: {
    color: '#c084fc',
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
  descriptionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#D1D5DB',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 12,
    minWidth: 80,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  detailsContainer: {
    marginBottom: 24,
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
  tagsContainer: {
    marginBottom: 24,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  // Workouts Tab Styles
  weekScheduleContainer: {
    marginBottom: 24,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 12,
    padding: 12,
  },
  weekdayItem: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  weekdayItemActive: {
    transform: [{ scale: 1.1 }],
  },
  weekdayLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  weekdayLabelActive: {
    color: '#c084fc',
    fontWeight: '600',
  },
  weekdayIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weekdayActive: {
    backgroundColor: '#c084fc',
  },
  weekdayInactive: {
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  weekdayIndicatorActive: {
    transform: [{ scale: 1.5 }],
  },
  workoutsListContainer: {
    marginBottom: 24,
  },
  workoutsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  clearFilterText: {
    fontSize: 12,
    color: '#60A5FA',
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 12,
    marginBottom: 12,
  },
  workoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutContent: {
    flex: 1,
  },
  workoutName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  workoutStats: {
    flexDirection: 'row',
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutStatText: {
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
  activateButton: {
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  activateButtonText: {
    color: '#c084fc',
  },
  deactivateButton: {
    backgroundColor: '#22c55e',
  },
  deactivateButtonText: {
    color: '#fff',
  },
  editButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  editButtonText: {
    color: '#60a5fa',
  },
  shareButton: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  shareButtonText: {
    color: '#f97316',
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

export default ProgramDetailModal;