// components/workout/ProgramCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

interface Exercise {
  id?: number;
  name: string;
  equipment?: string;
  notes?: string;
  order: number;
  sets: {
    id?: number;
    reps: number;
    weight: number;
    rest_time: number;
    order: number;
  }[];
}

interface Workout {
  id: number;
  name: string;
  description?: string;
  estimated_duration?: number;
  preferred_weekday: number;
  exercises?: Exercise[];
}

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
  workouts?: Workout[];
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
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [isForking, setIsForking] = useState<boolean>(false);
  const [forkSuccess, setForkSuccess] = useState<boolean>(false);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [expandedWorkout, setExpandedWorkout] = useState<number | null>(null);
  
  if (!program) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('unable_to_load_program')}</Text>
      </View>
    );
  }
  
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
  
  const getDifficultyLabel = (level?: string) => {
    switch(level?.toLowerCase()) {
      case 'beginner': return { text: t('beginner'), icon: '🔰' };
      case 'intermediate': return { text: t('intermediate'), icon: '⚡' };
      case 'advanced': return { text: t('advanced'), icon: '💪' };
      case 'expert': return { text: t('expert'), icon: '🏆' };
      default: return { text: level || t('all_levels'), icon: '✓' };
    }
  };
  
  // Group workouts by preferred weekday
  const WEEKDAYS = [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')];
  
  const getWorkoutsByDay = () => {
    return WEEKDAYS.map((day, index) => ({
      day,
      dayIndex: index,
      workouts: program.workouts?.filter(w => w.preferred_weekday === index) || []
    }));
  };
  
  const workoutsByDay = getWorkoutsByDay();
  
  // Toggle expanded state
  const handleToggleExpand = (): void => {
    setIsExpanded(!isExpanded);
    if (onProgramSelect && !isExpanded) {
      onProgramSelect(program);
    }
  };
  
  const handleDaySelect = (index: number): void => {
    setActiveDay(index === activeDay ? null : index);
  };
  
  const handleWorkoutExpand = (workoutId: number): void => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
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
  
  const handleFork = async (): Promise<void> => {
    if (isForking || !onFork) return;
    
    try {
      setIsForking(true);
      await onFork(program.id);
      setForkSuccess(true);
      setTimeout(() => setForkSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to fork program:', error);
    } finally {
      setIsForking(false);
    }
  };
  
  const handleDelete = (): void => {
    Alert.alert(
      t('delete_program'),
      t('confirm_delete_program_question', { name: program.name }),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('delete'),
          onPress: () => onDelete?.(program.id),
          style: 'destructive'
        }
      ]
    );
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        program.is_active ? styles.containerActive : styles.containerRegular
      ]}
      onPress={handleToggleExpand}
      activeOpacity={0.8}
    >
      {/* Status Indicator Line */}
      <View style={[styles.statusLine, program.is_active ? styles.statusLineActive : styles.statusLineRegular]} />
      
      <View style={styles.content}>
        {/* Card Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.icon, program.is_active ? styles.iconActive : styles.iconRegular]}>
              <Ionicons name="barbell" size={20} color={program.is_active ? "#c084fc" : "#9ca3af"} />
            </View>
            
            <View style={styles.titleContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {program.name}
                </Text>
                
                {program.is_active && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
                    <Text style={styles.statusText}>{t('active')}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.subtitleRow}>
                <Ionicons name="person-outline" size={12} color="#9ca3af" style={styles.subtitleIcon} />
                <Text style={styles.subtitle} numberOfLines={1}>{program.creator_username}</Text>
                
                {program.forked_from && (
                  <View style={styles.forkedBadge}>
                    <Ionicons name="download-outline" size={12} color="#c084fc" style={styles.subtitleIcon} />
                    <Text style={styles.forkedText}>{t('forked')}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          {/* Actions */}
          <View style={styles.actionsContainer}>
            {canToggleActive && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleToggleActive}
                disabled={isToggling}
              >
                {isToggling ? (
                  <ActivityIndicator size="small" color="#c084fc" />
                ) : (
                  <Ionicons 
                    name={program.is_active ? "toggle-sharp" : "toggle-outline"} 
                    size={24} 
                    color={program.is_active ? "#22c55e" : "#9ca3af"} 
                  />
                )}
              </TouchableOpacity>
            )}
            
            {canEditProgram && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => onEdit?.(program)}
              >
                <Ionicons name="create-outline" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
            
            {canShareProgram && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => onShare?.(program)}
              >
                <Ionicons name="share-social-outline" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
            
            {canDeleteProgram && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
            
            {canForkProgram && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleFork}
                disabled={isForking}
              >
                {isForking ? (
                  <ActivityIndicator size="small" color="#60a5fa" />
                ) : (
                  <Ionicons name="download-outline" size={18} color="#60a5fa" />
                )}
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
        
        {/* Description - Show only if it exists */}
        {program.description && !compact && (
          <Text style={styles.description} numberOfLines={2}>{program.description}</Text>
        )}
        
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsItem}>
            <View style={styles.statsLabel}>
              <Ionicons name="barbell-outline" size={14} color="#c084fc" style={{marginRight: 4}} />
              <Text style={styles.statsLabelText}>{t('workouts')}</Text>
            </View>
            <Text style={styles.statsValue}>{program.workouts?.length || 0}</Text>
          </View>
          
          <View style={styles.statsItem}>
            <View style={styles.statsLabel}>
              <Ionicons name="calendar-outline" size={14} color="#c084fc" style={{marginRight: 4}} />
              <Text style={styles.statsLabelText}>{t('days_per_week')}</Text>
            </View>
            <Text style={styles.statsValue}>{program.sessions_per_week}</Text>
          </View>
          
          <View style={styles.statsItem}>
            <View style={styles.statsLabel}>
              <Ionicons name={getFocusIcon(program.focus)} size={14} color="#c084fc" style={{marginRight: 4}} />
              <Text style={styles.statsLabelText}>{t('focus')}</Text>
            </View>
            <Text style={styles.statsValue} numberOfLines={1}>
              {t(program.focus?.split('_')[0] || 'general')}
            </Text>
          </View>
          
          <View style={styles.statsItem}>
            <View style={styles.statsLabel}>
              <Ionicons name="people-outline" size={14} color="#c084fc" style={{marginRight: 4}} />
              <Text style={styles.statsLabelText}>{t('level')}</Text>
            </View>
            <View style={styles.levelContainer}>
              <Text style={styles.levelText}>{getDifficultyLabel(program.difficulty_level).text}</Text>
              <Text style={styles.levelIcon}>{getDifficultyLabel(program.difficulty_level).icon}</Text>
            </View>
          </View>
        </View>
        
        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Focus Highlight */}
            <View style={styles.focusSection}>
              <View style={styles.focusIcon}>
                <Ionicons name={getFocusIcon(program.focus)} size={20} color="#c084fc" />
              </View>
              <View style={styles.focusDetails}>
                <Text style={styles.focusTitle}>{t(program.focus) || t('general_fitness')}</Text>
                <Text style={styles.focusDescription} numberOfLines={2}>
                  {t(`${program.focus}_description`) || t('general_fitness_description')}
                </Text>
              </View>
            </View>
            
            {/* Program Details */}
            <View style={styles.detailsSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bar-chart-outline" size={16} color="#c084fc" style={{marginRight: 8}} />
                <Text style={styles.sectionTitle}>{t('program_details')}</Text>
              </View>
              
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('duration')}</Text>
                  <Text style={styles.detailValue}>{program.estimated_completion_weeks} {t('weeks')}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('created')}</Text>
                  <Text style={styles.detailValue}>{new Date(program.created_at).toLocaleDateString()}</Text>
                </View>
                
                {program.tags && program.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    <Text style={styles.tagsLabel}>{t('tags')}</Text>
                    <View style={styles.tagsList}>
                      {program.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
            
            {/* Weekly Schedule Navigation */}
            <View style={styles.scheduleSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={16} color="#c084fc" style={{marginRight: 8}} />
                <Text style={styles.sectionTitle}>{t('weekly_schedule')}</Text>
              </View>
              
              <View style={styles.weekdaysGrid}>
                {WEEKDAYS.map((day, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.weekdayButton,
                      workoutsByDay[index].workouts.length > 0 ? styles.weekdayHasWorkouts : styles.weekdayEmpty,
                      activeDay === index && styles.weekdayActive
                    ]}
                    onPress={() => handleDaySelect(index)}
                    disabled={workoutsByDay[index].workouts.length === 0}
                  >
                    <Text style={[
                      styles.weekdayText,
                      workoutsByDay[index].workouts.length === 0 && styles.weekdayTextEmpty,
                      activeDay === index && styles.weekdayTextActive
                    ]}>
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Selected Day's Workouts */}
              {activeDay !== null && (
                <View style={styles.dayWorkoutsContainer}>
                  <Text style={styles.dayTitle}>
                    {WEEKDAYS[activeDay]} {t('workouts')}
                  </Text>
                  
                  {workoutsByDay[activeDay].workouts.length > 0 ? (
                    workoutsByDay[activeDay].workouts.map((workout, index) => (
                      <TouchableOpacity 
                        key={workout.id || index} 
                        style={styles.workoutItem}
                        onPress={() => handleWorkoutExpand(workout.id)}
                      >
                        <View style={styles.workoutHeader}>
                          <View style={styles.workoutIcon}>
                            <Ionicons name="barbell" size={16} color="#c084fc" />
                          </View>
                          
                          <View style={styles.workoutDetails}>
                            <Text style={styles.workoutName}>{workout.name}</Text>
                            <View style={styles.workoutSubDetails}>
                              <Text style={styles.workoutSubDetail}>
                                {workout.exercises?.length || 0} {t('exercises')}
                              </Text>
                              {workout.estimated_duration && (
                                <>
                                  <Text style={styles.workoutSeparator}>•</Text>
                                  <Text style={styles.workoutSubDetail}>{workout.estimated_duration} {t('mins')}</Text>
                                </>
                              )}
                            </View>
                          </View>
                          
                          <Ionicons 
                            name={expandedWorkout === workout.id ? "chevron-up" : "chevron-down"} 
                            size={16} 
                            color={expandedWorkout === workout.id ? "#c084fc" : "#9ca3af"} 
                          />
                        </View>
                        
                        {expandedWorkout === workout.id && workout.exercises && (
                          <View style={styles.exercisesList}>
                            {workout.exercises.map((exercise, exIndex) => (
                              <View key={exIndex} style={styles.exerciseItem}>
                                <View style={styles.exerciseNumber}>
                                  <Text style={styles.exerciseNumberText}>{exIndex + 1}</Text>
                                </View>
                                
                                <View style={styles.exerciseInfo}>
                                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                                  {exercise.equipment && (
                                    <Text style={styles.exerciseEquipment}>{exercise.equipment}</Text>
                                  )}
                                  
                                  {exercise.sets && exercise.sets.length > 0 && (
                                    <View style={styles.setsList}>
                                      {exercise.sets.map((set, setIdx) => (
                                        <View key={setIdx} style={styles.setItem}>
                                          <Text style={styles.setText}>
                                            {set.reps} {t('reps')} × {set.weight || 0} kg
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                  )}
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.restDayContainer}>
                      <Ionicons name="calendar" size={24} color="#6B7280" />
                      <Text style={styles.restDayText}>{t('rest_day')}</Text>
                    </View>
                  )}
                </View>
              )}
              
              {activeDay === null && program.workouts && program.workouts.length > 0 && (
                <Text style={styles.selectDayPrompt}>{t('select_day_to_view_workouts')}</Text>
              )}
            </View>
            
            {/* Program Description */}
            {program.description && (
              <View style={styles.descriptionSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="information-circle-outline" size={16} color="#c084fc" style={{marginRight: 8}} />
                  <Text style={styles.sectionTitle}>{t('about_this_program')}</Text>
                </View>
                <Text style={styles.fullDescription}>{program.description}</Text>
              </View>
            )}
            
            {/* Success Toast */}
            {forkSuccess && (
              <View style={styles.successToast}>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" style={{marginRight: 4}} />
                <Text style={styles.successToastText}>{t('program_forked_success')}</Text>
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
  containerActive: {
    backgroundColor: '#1F2937',
    borderColor: 'rgba(192, 132, 252, 0.5)',
  },
  statusLine: {
    height: 4,
    width: '100%',
  },
  statusLineRegular: {
    backgroundColor: '#4B5563',
  },
  statusLineActive: {
    backgroundColor: '#c084fc',
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
  iconActive: {
    backgroundColor: 'rgba(192, 132, 252, 0.3)',
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
  forkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  forkedText: {
    fontSize: 12,
    color: '#c084fc',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
  },
  expandButton: {
    padding: 6,
    borderRadius: 6,
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    color: '#D1D5DB',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  statsItem: {
    width: '48%',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.3)',
    margin: 4,
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
  levelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  levelIcon: {
    fontSize: 14,
  },
  expandedContent: {
    marginTop: 16,
  },
  focusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    marginBottom: 16,
  },
  focusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(192, 132, 252, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  focusDetails: {
    flex: 1,
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  focusDescription: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 4,
  },
  detailsSection: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    padding: 16,
    borderRadius: 12,
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
    width: '48%',
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
  tagsContainer: {
    width: '100%',
    padding: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.3)',
    margin: 4,
  },
  tagsLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(192, 132, 252, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#c084fc',
  },
  scheduleSection: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
    marginBottom: 16,
  },
  weekdaysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekdayButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    width: '13%',
    alignItems: 'center',
  },
  weekdayHasWorkouts: {
    backgroundColor: '#1F2937',
    borderColor: 'rgba(55, 65, 81, 0.7)',
  },
  weekdayEmpty: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderColor: 'rgba(55, 65, 81, 0.3)',
  },
  weekdayActive: {
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  weekdayTextEmpty: {
    color: '#6B7280',
  },
  weekdayTextActive: {
    color: '#c084fc',
  },
  dayWorkoutsContainer: {
    marginTop: 8,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  workoutItem: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.7)',
    marginBottom: 8,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  workoutIcon: {
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
  workoutDetails: {
    flex: 1,
  },
  workoutName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  workoutSubDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  workoutSubDetail: {
    fontSize: 12,
    color: '#9ca3af',
  },
  workoutSeparator: {
    fontSize: 12,
    color: '#9ca3af',
    marginHorizontal: 4,
  },
  exercisesList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.7)',
    padding: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
  },
  exerciseItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  exerciseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(55, 65, 81, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  exerciseEquipment: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  setsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  setItem: {
    backgroundColor: 'rgba(55, 65, 81, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginTop: 4,
  },
  setText: {
    fontSize: 10,
    color: '#D1D5DB',
  },
  restDayContainer: {
    backgroundColor: '#1F2937',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  restDayText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  selectDayPrompt: {
    textAlign: 'center',
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  descriptionSection: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  fullDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 8,
    padding: 12,
    position: 'absolute',
    bottom: 16,
    right: 16,
    left: 16,
  },
  successToastText: {
    fontSize: 12,
    color: '#22c55e',
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

export default ProgramCard;