// app/(app)/log/[id].tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  TextInput,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Custom hooks
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import {
  useLog,
  useUpdateLog,
  useDeleteLog,
} from '../../../hooks/query/useLogQuery';

// Shared components
import LogExerciseManager from './LogExerciseManager';
import GymSelectionModal from '../../../components/workouts/GymSelectionModal';
import { formatRestTime, getDifficultyIndicator } from './../workout/formatters';

import { useGym } from '../../../hooks/query/useGymQuery';

export default function WorkoutLogDetailScreen() {
  // Get log ID from route params
  const { id } = useLocalSearchParams();
  const logId = typeof id === 'string' ? parseInt(id, 10) : 0;
  
  // Get theme context
  const { workoutLogPalette, palette } = useTheme();
  
  // Create dynamic theme colors
  const COLORS = {
    primary: workoutLogPalette.background,
    secondary: workoutLogPalette.highlight,
    tertiary: workoutLogPalette.border,
    background: palette.page_background,
    card: "#1F2937",
    text: {
      primary: workoutLogPalette.text,
      secondary: workoutLogPalette.text_secondary,
      tertiary: "rgba(255, 255, 255, 0.5)"
    },
    border: workoutLogPalette.border,
    success: "#10b981",
    danger: "#ef4444"
  };
  
  // State for log details
  const [logName, setLogName] = useState('');
  const [logDescription, setLogDescription] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logDuration, setLogDuration] = useState(0);
  const [logDifficulty, setLogDifficulty] = useState(0);
  const [logMoodRating, setLogMoodRating] = useState(5);
  const [logCompleted, setLogCompleted] = useState(false);
  const [logDate, setLogDate] = useState('');
  const [selectedGym, setSelectedGym] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // UI state
  const [isExerciseManagerVisible, setIsExerciseManagerVisible] = useState(false);
  const [isGymSelectionVisible, setIsGymSelectionVisible] = useState(false);
  
  // Hooks
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: log, isLoading, refetch } = useLog(logId);
  const { mutateAsync: updateLog } = useUpdateLog();
  const { mutateAsync: deleteLog } = useDeleteLog();
  const { data: gymData, isLoading: isGymLoading } = useGym(log?.gym || undefined);
  
  // Initialize form state when log data is loaded
  useEffect(() => {
    if (log) {
      setLogName(log.name);
      setLogNotes(log.notes || '');
      setLogDuration(log.duration || 0);
      setLogDifficulty(log.perceived_difficulty || 0);
      setLogMoodRating(log.mood_rating || 5);
      setLogCompleted(log.completed || false);
      setLogDate(log.date || '');
      
      // Set gym information
      if (gymData) {
        setSelectedGym({
          id: gymData.id,
          name: gymData.name,
          location: gymData.location || ''
        });
      } else if (log.gym && log.gym_name) {
        // Fallback to log data while gym is loading or if gym query fails
        setSelectedGym({
          id: log.gym,
          name: log.gym_name,
          location: log.location || ''
        });
      } else {
        setSelectedGym(null);
      }
    }
  }, [log, gymData]); // Add gymData to dependencies
  
  // Add keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Check if current user is the log creator
  const isCreator = log?.username === user?.username;
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Get mood emoji
  const getMoodEmoji = (rating?: number): string => {
    if (!rating) return '😐';
    if (rating <= 2) return '😞';
    if (rating <= 4) return '😐';
    if (rating <= 6) return '🙂';
    if (rating <= 8) return '😊';
    return '😄';
  };
  
  // Handle options menu
  const handleOptionsMenu = () => {
    Alert.alert(
      t('workout_options'),
      t('select_an_option'),
      [
        {
          text: t('edit'),
          onPress: () => handleEditLogInfo()
        },
        {
          text: t('gym'),
          onPress: () => setIsGymSelectionVisible(true)
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: handleDeleteLog
        },
        {
          text: t('cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  // Handle editing log info
  const handleEditLogInfo = () => {
    Alert.alert(
      t('edit_log_info'),
      t('select_field_to_edit'),
      [
        {
          text: t('name'),
          onPress: () => handleEditLogName()
        },
        {
          text: t('notes'),
          onPress: () => handleEditLogNotes()
        },
        {
          text: t('duration'),
          onPress: () => handleEditLogDuration()
        },
        {
          text: t('difficulty'),
          onPress: () => handleEditLogDifficulty()
        },
        {
          text: t('mood_rating'),
          onPress: () => handleEditMoodRating()
        },
        {
          text: t('cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  // Handle editing log name
  const handleEditLogName = () => {
    Alert.prompt(
      t('edit_name'),
      t('enter_new_log_name'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('save'),
          onPress: (name) => {
            if (name && name.trim() !== '') {
              setLogName(name);
              handleSaveLogField('name', name);
            }
          }
        }
      ],
      'plain-text',
      logName
    );
  };

  // Handle editing log notes
  const handleEditLogNotes = () => {
    Alert.prompt(
      t('edit_notes'),
      t('enter_workout_notes'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('save'),
          onPress: (notes) => {
            setLogNotes(notes || '');
            handleSaveLogField('notes', notes || '');
          }
        }
      ],
      'plain-text',
      logNotes
    );
  };

  // Handle editing log duration
  const handleEditLogDuration = () => {
    Alert.prompt(
      t('edit_duration'),
      t('enter_duration_in_minutes'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('save'),
          onPress: (durationText) => {
            const duration = parseInt(durationText || '0', 10);
            setLogDuration(duration);
            handleSaveLogField('duration', duration);
          }
        }
      ],
      'plain-text',
      logDuration.toString(),
      'numeric'
    );
  };

  // Handle editing log difficulty
  const handleEditLogDifficulty = () => {
    Alert.alert(
      t('edit_difficulty'),
      t('select_difficulty_level'),
      [
        {
          text: t('beginner'),
          onPress: () => {
            setLogDifficulty(0);
            handleSaveLogField('perceived_difficulty',0);
          }
        },
        {
          text: t('intermediate'),
          onPress: () => {
            setLogDifficulty(1);
            handleSaveLogField('perceived_difficulty', 1);
          }
        },
        {
          text: t('advanced'),
          onPress: () => {
            setLogDifficulty(2);
            handleSaveLogField('perceived_difficulty', 2);
          }
        },
        {
          text: t('cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  // Handle editing mood rating
  const handleEditMoodRating = () => {
    Alert.alert(
      t('mood_rating'),
      t('how_did_you_feel_during_workout'),
      [
        {
          text: '😞 1-2',
          onPress: () => {
            setLogMoodRating(2);
            handleSaveLogField('mood_rating', 2);
          }
        },
        {
          text: '😐 3-4',
          onPress: () => {
            setLogMoodRating(4);
            handleSaveLogField('mood_rating', 4);
          }
        },
        {
          text: '🙂 5-6',
          onPress: () => {
            setLogMoodRating(6);
            handleSaveLogField('mood_rating', 6);
          }
        },
        {
          text: '😊 7-8',
          onPress: () => {
            setLogMoodRating(8);
            handleSaveLogField('mood_rating', 8);
          }
        },
        {
          text: '😄 9-10',
          onPress: () => {
            setLogMoodRating(10);
            handleSaveLogField('mood_rating', 10);
          }
        },
        {
          text: t('cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  // Handle saving individual log field
  const handleSaveLogField = async (field, value) => {
    try {
      // Create updates with just the field being changed
      const updates = { 
        [field]: value,
        // Explicitly include exercises to ensure they're not lost
        exercises: log.exercises || []
      };
      console.log(updates);
      
      await updateLog({
        id: logId,
        logData: updates
      });
      await refetch();
    } catch (error) {
      console.error(`Failed to update log ${field}:`, error);
      Alert.alert(t('error'), t('failed_to_update_log'));
    }
  };

  
  // Handle deleting the log
  const handleDeleteLog = () => {
    Alert.alert(
      t('delete_log'),
      t('confirm_delete_log'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLog(logId);
              router.back();
            } catch (error) {
              console.error('Failed to delete log:', error);
              Alert.alert(t('error'), t('failed_to_delete_log'));
            }
          }
        }
      ]
    );
  };

  // Handle gym selection
  const handleGymSelection = async (gym) => {
    try {
      setSelectedGym(gym);
      const gymData = gym ? {
        gym: gym.id,
        gym_name: gym.name,
        location: gym.location
      } : {
        gym: null,
        gym_name: null,
        location: 'Home'
      };
      
      // Include exercises to ensure they're not lost during update
      const updatedData = {
        ...gymData,
        exercises: log.exercises || []
      };
      
      await updateLog({
        id: logId,
        logData: updatedData
      });
      await refetch();
    } catch (error) {
      console.error('Failed to update gym:', error);
      Alert.alert(t('error'), t('failed_to_update_gym'));
    }
  };

  // Handle exercise management completion
  const handleExerciseManagerComplete = async () => {
    setIsExerciseManagerVisible(false);
    await refetch();
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: COLORS.text.primary }]}>{t('loading')}</Text>
      </View>
    );
  }
  
  // Render error state if log not found
  if (!log) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: COLORS.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.danger} />
        <Text style={[styles.errorTitle, { color: COLORS.text.primary }]}>
          {t('log_not_found')}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: COLORS.text.primary }]}>{t('back_to_logs')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        {/* Top Row: Back button, Title, Options */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {log.name}
            </Text>
            {logCompleted && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} style={styles.completedIcon} />
            )}
          </View>
          
          {isCreator && (
            <TouchableOpacity 
              style={styles.optionsButton}
              onPress={handleOptionsMenu}
            >
              <Ionicons name="ellipsis-vertical" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Creator info row */}
        <View style={styles.creatorRow}>
          <View style={styles.creatorInfo}>
            <Ionicons name="person" size={14} color={COLORS.text.secondary} />
            <Text style={styles.creatorText}>{log.username}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Text style={styles.typeBadgeText}>
              {t('workout_log')}
            </Text>
          </View>
        </View>
        
        {/* Date Row */}
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.text.secondary} />
          <Text style={styles.dateText}>{log.date}</Text>
        </View>
        
        {/* Workout Info Row */}
        <View style={styles.workoutInfoRow}>
          
          {/* Duration */}
          {logDuration > 0 && (
            <View style={styles.workoutInfoItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.text.secondary} />
              <Text style={styles.infoText}>
                {logDuration} {t('min')}
              </Text>
            </View>
          )}
          
          {/* Difficulty */}
          <View style={styles.workoutInfoItem}>
            <Text style={styles.infoIcon}>
              {getDifficultyIndicator(log.perceived_difficulty)}
            </Text>
          </View>
          
          {/* Mood */}
          
          {/* Gym/Location */}
          <View style={styles.workoutInfoItem}>
            <Ionicons 
              name={selectedGym ? "fitness" : "home"} 
              size={14} 
              color={COLORS.text.secondary} 
              />
            <Text style={styles.infoText}>
              {selectedGym ? `${selectedGym.name} - ${selectedGym.location}` : t('home')}
            </Text>
          </View>
          {logMoodRating > 0 && (
            <View style={styles.workoutInfoItem}>
              <Text style={styles.infoIcon}>
                {getMoodEmoji(logMoodRating)}
              </Text>
              <Text style={styles.infoText}>
                {t('mood')}: {logMoodRating}/10
              </Text>
            </View>
          )}
        </View>
        
        {/* Notes - only if available */}
        {log.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>{t('notes')}:</Text>
            <Text style={styles.notesText} numberOfLines={2}>
              {log.notes}
            </Text>
          </View>
        )}
      </LinearGradient>
      
      {/* Main Content */}
      <ScrollView style={styles.contentContainer}>
        <View style={styles.exercisesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>{t('exercises')}</Text>
            <View style={styles.exerciseControls}>
              <Text style={[styles.exerciseCount, { color: COLORS.text.secondary }]}>
                {log.exercises?.length || 0} {t('total')}
              </Text>
              
              {isCreator && (
                <TouchableOpacity 
                  style={styles.editExercisesButton}
                  onPress={() => setIsExerciseManagerVisible(true)}
                >
                  <Ionicons name="create-outline" size={16} color={COLORS.secondary} />
                  <Text style={[styles.editExercisesText, { color: COLORS.secondary }]}>
                    {t('edit')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Render exercises list or empty state */}
          {log.exercises && log.exercises.length > 0 ? (
            <View style={styles.exercisesList}>
              {log.exercises.map((exercise, index) => {
                // Find paired exercise name if this is a superset
                const pairedExerciseName = exercise.is_superset && exercise.superset_with !== null
                  ? log.exercises.find(ex => ex.order === exercise.superset_with)?.name
                  : null;
                
                return (
                  <View 
                    key={`exercise-${exercise.id || index}`}
                    style={[
                      styles.exerciseCard, 
                      exercise.is_superset && styles.supersetCard,
                      { backgroundColor: COLORS.card }
                    ]}
                  >
                    {/* Exercise Header */}
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseHeaderLeft}>
                        {/* Exercise index badge */}
                        <View style={styles.exerciseIndexBadge}>
                          <Text style={styles.exerciseIndexText}>{index + 1}</Text>
                        </View>
                        
                        <View style={styles.exerciseTitleContainer}>
                          <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                          
                          {/* Superset info */}
                          {exercise.is_superset && pairedExerciseName && (
                            <View style={styles.supersetInfo}>
                              <Ionicons name="git-branch-outline" size={14} color="#0ea5e9" />
                              <Text style={styles.supersetInfoText}>
                                {t('paired_with')}: {pairedExerciseName}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      {/* Set count badge */}
                      <View style={styles.setCountBadge}>
                        <Text style={styles.setCountText}>
                          {exercise.sets.length} {exercise.sets.length === 1 ? t('set') : t('sets')}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Exercise Sets Table */}
                    <View style={styles.setsTable}>
                      {/* Table Header */}
                      <View style={styles.setsTableHeader}>
                        <Text style={styles.setColumnHeader}>{t('set')}</Text>
                        <Text style={styles.setColumnHeader}>{t('reps')}</Text>
                        <Text style={styles.setColumnHeader}>{t('weight')}</Text>
                        <Text style={styles.setColumnHeader}>{t('rest')}</Text>
                      </View>
                      
                      {/* Table Rows */}
                      {exercise.sets.map((set, setIndex) => (
                        <View 
                          key={`set-${setIndex}`}
                          style={[
                            styles.setRow,
                            setIndex % 2 === 1 && { backgroundColor: 'rgba(0, 0, 0, 0.2)' }
                          ]}
                        >
                          <Text style={styles.setCell}>{setIndex + 1}</Text>
                          <Text style={styles.setCell}>{set.reps || '-'}</Text>
                          <Text style={styles.setCell}>{set.weight ? `${set.weight}kg` : '-'}</Text>
                          <Text style={styles.setCell}>{formatRestTime(set.rest_time)}</Text>
                        </View>
                      ))}
                    </View>
                    
                    {/* Exercise Notes */}
                    {exercise.notes && (
                      <View style={styles.exerciseNotesContainer}>
                        <Text style={styles.exerciseNotesLabel}>{t('notes')}:</Text>
                        <Text style={styles.exerciseNotesText}>{exercise.notes}</Text>
                      </View>
                    )}
                    
                    {/* Superset Rest Time */}
                    {exercise.is_superset && exercise.superset_rest_time && (
                      <View style={styles.supersetRestContainer}>
                        <Text style={styles.supersetRestLabel}>{t('superset_rest')}:</Text>
                        <Text style={styles.supersetRestValue}>
                          {formatRestTime(exercise.superset_rest_time)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: COLORS.card }]}>
              <Ionicons name="barbell-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={[styles.emptyStateText, { color: COLORS.text.tertiary }]}>
                {t('no_exercises')}
              </Text>
              {isCreator && (
                <TouchableOpacity
                  style={[styles.emptyStateAddButton, { backgroundColor: `rgba(16, 185, 129, 0.1)` }]}
                  onPress={() => setIsExerciseManagerVisible(true)}
                >
                  <Ionicons name="add-circle" size={20} color={COLORS.success} />
                  <Text style={[styles.emptyStateAddText, { color: COLORS.success }]}>
                    {t('add_exercises')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        
        {/* Tags Section (if any) */}
        {log.tags && log.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>{t('tags')}</Text>
            <View style={styles.tagsContainer}>
              {log.tags.map((tag, index) => (
                <View 
                  key={`tag-${index}`} 
                  style={[styles.tag, { backgroundColor: `rgba(66, 153, 225, 0.2)` }]}
                >
                  <Text style={[styles.tagText, { color: COLORS.text.secondary }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Source Information */}
        {log.source_type && log.source_type !== 'none' && (
          <View style={styles.sourceSection}>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>{t('source')}</Text>
            <View style={[styles.sourceContainer, { backgroundColor: COLORS.card }]}>
              <Ionicons 
                name={log.source_type === 'program' ? "list-outline" : "document-outline"} 
                size={20} 
                color={COLORS.text.secondary} 
              />
              <Text style={[styles.sourceText, { color: COLORS.text.secondary }]}>
                {t(`from_${log.source_type}`)}
              </Text>
            </View>
          </View>
        )}
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Log Exercise Manager Modal */}
      {isExerciseManagerVisible && (
        <LogExerciseManager
          visible={isExerciseManagerVisible}
          logId={logId}
          exercises={log.exercises || []}
          onClose={handleExerciseManagerComplete}
          colors={COLORS}
        />
      )}
      
      {/* Gym Selection Modal */}
      <GymSelectionModal
        visible={isGymSelectionVisible}
        onClose={() => setIsGymSelectionVisible(false)}
        onSelectGym={handleGymSelection}
        selectedGym={selectedGym}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    padding: 12,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 5,
  },
  completedIcon: {
    marginLeft: 6,
  },
  optionsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  creatorRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  creatorText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 15,
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '500',
  },
  workoutInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 10,
  },
  workoutInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  infoIcon: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  descriptionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  notesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  exercisesSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  exerciseControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseCount: {
    fontSize: 14,
    marginRight: 12,
  },
  editExercisesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(66, 153, 225, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editExercisesText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  exercisesList: {
    marginBottom: 16,
  },
  exerciseCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  supersetCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  exerciseIndexText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  exerciseTitleContainer: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  supersetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  supersetInfoText: {
    fontSize: 12,
    color: '#0ea5e9',
    marginLeft: 4,
  },
  setCountBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  setCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  setsTable: {
    padding: 12,
  },
  setsTableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  setColumnHeader: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderRadius: 4,
  },
  setCell: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  exerciseNotesContainer: {
    margin: 12,
    marginTop: 4,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  exerciseNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  exerciseNotesText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  supersetRestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    padding: 8,
    margin: 12,
    marginTop: 0,
    borderRadius: 8,
  },
  supersetRestLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 4,
  },
  supersetRestValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyStateAddText: {
    fontSize: 14,
    marginLeft: 8,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
  },
  sourceSection: {
    marginBottom: 16,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  sourceText: {
    fontSize: 14,
    marginLeft: 8,
  },
  bottomPadding: {
    height: 80,
  },
});