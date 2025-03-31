// app/(app)/workouts.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';

// Import React Query hooks
import { 
  usePrograms, 
  useToggleProgramActive,
  useForkProgram
} from '../../hooks/query/useProgramQuery';
import { 
  useLogs,
  useCreateLog
} from '../../hooks/query/useLogQuery';
import { 
  useWorkoutTemplates
} from '../../hooks/query/useWorkoutQuery';

// Import custom components
import ProgramCard from '../../components/workouts/ProgramCard';
import WorkoutLogCard from '../../components/workouts/WorkoutLogCard';

// Define constants for view types
const VIEW_TYPES = {
  PROGRAMS: 'programs',
  WORKOUT_HISTORY: 'workout_history',
  TEMPLATES: 'templates'
};

const { width, height } = Dimensions.get('window');

export default function WorkoutsScreen() {
  // Auth and language contexts
  const { user } = useAuth();
  const { t } = useLanguage();
  const { 
    openProgramDetail, 
    openWorkoutLogDetail 
  } = useModal();
  
  // State for UI
  const [currentView, setCurrentView] = useState(VIEW_TYPES.PROGRAMS);
  const [viewSelectorVisible, setViewSelectorVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use React Query hooks to fetch data
  const { 
    data: programs = [], 
    isLoading: programsLoading, 
    refetch: refetchPrograms 
  } = usePrograms();
  
  const {
    data: logs = [],
    isLoading: logsLoading,
    refetch: refetchLogs
  } = useLogs();
  
  const {
    data: templates = [],
    isLoading: templatesLoading,
    refetch: refetchTemplates
  } = useWorkoutTemplates();

  // Mutations
  const { mutateAsync: toggleProgramActive } = useToggleProgramActive();
  const { mutateAsync: forkProgram } = useForkProgram();
  const { mutateAsync: createLog } = useCreateLog();
  
  // Get data based on current view with proper filtering
  const getCurrentData = () => {
    switch (currentView) {
      case VIEW_TYPES.PROGRAMS:
        // Filter programs to only show those created by the current user
        return programs.filter(program => program.creator_username === user?.username);
      case VIEW_TYPES.WORKOUT_HISTORY:
        // Filter logs to only show those for the current user
        return logs.filter(log => log.username === user?.username);
      case VIEW_TYPES.TEMPLATES:
        // Filter templates to only show those created by the current user
        return templates.filter(template => template.creator_username === user?.username);
      default:
        return [];
    }
  };
  
  // Get loading state based on current view
  const isLoading = () => {
    switch (currentView) {
      case VIEW_TYPES.PROGRAMS:
        return programsLoading;
      case VIEW_TYPES.WORKOUT_HISTORY:
        return logsLoading;
      case VIEW_TYPES.TEMPLATES:
        return templatesLoading;
      default:
        return false;
    }
  };
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      switch (currentView) {
        case VIEW_TYPES.PROGRAMS:
          await refetchPrograms();
          break;
        case VIEW_TYPES.WORKOUT_HISTORY:
          await refetchLogs();
          break;
        case VIEW_TYPES.TEMPLATES:
          await refetchTemplates();
          break;
      }
    } catch (error) {
      console.error(`Error refreshing ${currentView}:`, error);
    } finally {
      setRefreshing(false);
    }
  }, [currentView, refetchPrograms, refetchLogs, refetchTemplates]);

  // Get view title
  const getViewTitle = () => {
    switch (currentView) {
      case VIEW_TYPES.PROGRAMS:
        return t('programs');
      case VIEW_TYPES.WORKOUT_HISTORY:
        return t('workout_history');
      case VIEW_TYPES.TEMPLATES:
        return t('templates');
      default:
        return '';
    }
  };

  // Toggle view selector
  const toggleViewSelector = () => {
    setViewSelectorVisible(!viewSelectorVisible);
  };

  // Change current view
  const changeView = (viewType) => {
    setCurrentView(viewType);
    setViewSelectorVisible(false);
  };

  // Get card color based on index
  const getCardColor = (index) => {
    // Base colors for each view type
    const colorVariations = {
      [VIEW_TYPES.PROGRAMS]: [
        '#7e22ce', // Original purple
        '#9333ea', // Lighter purple
        '#a855f7', // Another purple variation
        '#6b21a8', // Darker purple
      ],
      [VIEW_TYPES.WORKOUT_HISTORY]: [
        '#16a34a', // Original green
        '#22c55e', // Lighter green
        '#10b981', // Teal-ish green
        '#15803d', // Darker green
      ],
      [VIEW_TYPES.TEMPLATES]: [
        '#2563eb', // Original blue
        '#3b82f6', // Lighter blue
        '#0ea5e9', // Sky blue
        '#1d4ed8', // Darker blue
      ],
    };
    
    // Use the index to pick a color variation
    const colors = colorVariations[currentView];
    return colors[index % colors.length];
  };
  
  // Handle card press
  const handleCardPress = (item) => {
    switch (currentView) {
      case VIEW_TYPES.PROGRAMS:
        openProgramDetail(item);
        break;
      case VIEW_TYPES.WORKOUT_HISTORY:
        openWorkoutLogDetail(item);
        break;
      case VIEW_TYPES.TEMPLATES:
        // For templates, need to implement detail view
        console.log("Template detail view not implemented yet");
        break;
    }
  };
  
  // Handlers for action buttons
  const handleCreateProgram = () => {
    // Navigation to program creation
    console.log("Create program button pressed");
  };
  
  const handleLogWorkout = () => {
    // Navigation to log workout
    console.log("Log workout button pressed");
  };
  
  const handleCreateTemplate = () => {
    // Navigation to template creation
    console.log("Create template button pressed");
  };
  
  const handleStartWorkout = () => {
    // Start workout logic
    console.log("Start workout button pressed");
  };
  
  // Handle program forking
  const handleForkProgram = async (programId) => {
    try {
      await forkProgram(programId);
      refetchPrograms();
    } catch (error) {
      console.error("Error forking program:", error);
    }
  };
  
  // Render loading state
  if (isLoading() && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.viewSelector}
            onPress={toggleViewSelector}
          >
            <Text style={styles.viewTitle}>{getViewTitle()}</Text>
            <Ionicons 
              name={viewSelectorVisible ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statsButton}
            onPress={() => router.push('/analytics')}
          >
            <Ionicons name="stats-chart" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* View Selector Dropdown */}
        {viewSelectorVisible && (
          <View style={styles.dropdown}>
            <TouchableOpacity 
              style={[
                styles.dropdownItem, 
                currentView === VIEW_TYPES.PROGRAMS && styles.activeDropdownItem
              ]}
              onPress={() => changeView(VIEW_TYPES.PROGRAMS)}
            >
              <Text style={[
                styles.dropdownText, 
                currentView === VIEW_TYPES.PROGRAMS && styles.activeDropdownText
              ]}>
                {t('programs')}
              </Text>
              {currentView === VIEW_TYPES.PROGRAMS && (
                <Ionicons name="checkmark" size={20} color="#7e22ce" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.dropdownItem, 
                currentView === VIEW_TYPES.WORKOUT_HISTORY && styles.activeDropdownItem
              ]}
              onPress={() => changeView(VIEW_TYPES.WORKOUT_HISTORY)}
            >
              <Text style={[
                styles.dropdownText, 
                currentView === VIEW_TYPES.WORKOUT_HISTORY && styles.activeDropdownText
              ]}>
                {t('workout_history')}
              </Text>
              {currentView === VIEW_TYPES.WORKOUT_HISTORY && (
                <Ionicons name="checkmark" size={20} color="#16a34a" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.dropdownItem, 
                currentView === VIEW_TYPES.TEMPLATES && styles.activeDropdownItem
              ]}
              onPress={() => changeView(VIEW_TYPES.TEMPLATES)}
            >
              <Text style={[
                styles.dropdownText, 
                currentView === VIEW_TYPES.TEMPLATES && styles.activeDropdownText
              ]}>
                {t('templates')}
              </Text>
              {currentView === VIEW_TYPES.TEMPLATES && (
                <Ionicons name="checkmark" size={20} color="#2563eb" />
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {currentView === VIEW_TYPES.PROGRAMS && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#7e22ce' }]}
              onPress={handleCreateProgram}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>{t('create_program')}</Text>
            </TouchableOpacity>
          )}
          
          {currentView === VIEW_TYPES.WORKOUT_HISTORY && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#16a34a', flex: 1, marginRight: 8 }]}
                onPress={handleLogWorkout}
              >
                <Ionicons name="add" size={22} color="#FFFFFF" style={styles.actionButtonIcon} />
                <Text style={styles.actionButtonText}>{t('log_workout')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#16a34a', flex: 1 }]}
                onPress={handleStartWorkout}
              >
                <Ionicons name="play" size={22} color="#FFFFFF" style={styles.actionButtonIcon} />
                <Text style={styles.actionButtonText}>{t('start')}</Text>
              </TouchableOpacity>
            </>
          )}
          
          {currentView === VIEW_TYPES.TEMPLATES && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#2563eb' }]}
              onPress={handleCreateTemplate}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>{t('create_template')}</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Card List */}
        <ScrollView
          style={styles.cardStack}
          contentContainerStyle={styles.cardStackContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
            />
          }
        >
          {getCurrentData().length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons 
                name={
                  currentView === VIEW_TYPES.PROGRAMS ? "barbell-outline" :
                  currentView === VIEW_TYPES.WORKOUT_HISTORY ? "calendar-outline" :
                  "document-text-outline"
                } 
                size={60} 
                color="#4B5563" 
              />
              <Text style={styles.emptyStateTitle}>
                {currentView === VIEW_TYPES.PROGRAMS && t('no_programs')}
                {currentView === VIEW_TYPES.WORKOUT_HISTORY && t('no_workouts')}
                {currentView === VIEW_TYPES.TEMPLATES && t('no_templates')}
              </Text>
              <Text style={styles.emptyStateText}>
                {currentView === VIEW_TYPES.PROGRAMS && t('create_your_first_program')}
                {currentView === VIEW_TYPES.WORKOUT_HISTORY && t('log_your_first_workout')}
                {currentView === VIEW_TYPES.TEMPLATES && t('create_your_first_template')}
              </Text>
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              {getCurrentData().map((item, index) => (
                <View
                  key={`card-${item.id}`}
                  style={styles.cardContainer}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleCardPress(item)}
                    style={[
                      styles.card,
                      { backgroundColor: getCardColor(index) }
                    ]}
                  >
                      {/* Card Header with Title and Badge */}
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {item.name}
                        </Text>
                        
                        {/* Conditional badges */}
                        {currentView === VIEW_TYPES.PROGRAMS && item.is_active && (
                          <View style={styles.badge}>
                            <Text style={[styles.badgeText, { color: '#7e22ce' }]}>
                              {t('active')}
                            </Text>
                          </View>
                        )}
                        
                        {currentView === VIEW_TYPES.WORKOUT_HISTORY && (
                          <View style={[
                            styles.badge,
                            item.completed ? styles.completedBadge : styles.pendingBadge
                          ]}>
                            <Text style={[
                              styles.badgeText,
                              item.completed ? { color: '#16a34a' } : { color: '#FFFFFF' }
                            ]}>
                              {item.completed ? t('completed') : t('in_progress')}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      {/* Card Subtitle */}
                      <Text style={styles.cardSubtitle}>
                        {currentView === VIEW_TYPES.PROGRAMS && formatFocus(item.focus)}
                        {currentView === VIEW_TYPES.WORKOUT_HISTORY && formatDate(item.date)}
                        {currentView === VIEW_TYPES.TEMPLATES && formatFocus(item.focus)}
                      </Text>
                      
                      {/* Card Details */}
                      <View style={styles.cardDetails}>
                        <View style={styles.detailRow}>
                          {currentView === VIEW_TYPES.PROGRAMS && (
                            <>
                              <Text style={styles.detailLabel}>{t('level')}</Text>
                              <Text style={styles.detailValue}>{item.difficulty_level}</Text>
                            </>
                          )}
                          
                          {currentView === VIEW_TYPES.WORKOUT_HISTORY && (
                            <>
                              <Text style={styles.detailLabel}>{t('exercises')}</Text>
                              <Text style={styles.detailValue}>{item.exercises?.length || 0}</Text>
                            </>
                          )}
                          
                          {currentView === VIEW_TYPES.TEMPLATES && (
                            <>
                              <Text style={styles.detailLabel}>{t('exercises')}</Text>
                              <Text style={styles.detailValue}>{item.exercises?.length || 0}</Text>
                            </>
                          )}
                        </View>
                        
                        <View style={styles.detailRow}>
                          {currentView === VIEW_TYPES.PROGRAMS && (
                            <>
                              <Text style={styles.detailLabel}>{t('sessions')}</Text>
                              <Text style={styles.detailValue}>{item.sessions_per_week}x/week</Text>
                            </>
                          )}
                          
                          {currentView === VIEW_TYPES.WORKOUT_HISTORY && item.duration && (
                            <>
                              <Text style={styles.detailLabel}>{t('duration')}</Text>
                              <Text style={styles.detailValue}>{item.duration} min</Text>
                            </>
                          )}
                        </View>
                        
                        {currentView === VIEW_TYPES.WORKOUT_HISTORY && item.mood_rating && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t('mood')}</Text>
                            <Text style={styles.detailValue}>{getMoodEmoji(item.mood_rating)}</Text>
                          </View>
                        )}
                      </View>
                      
                      {/* Card Footer */}
                      <View style={styles.cardFooter}>
                        <View style={styles.creatorInfo}>
                          {currentView === VIEW_TYPES.PROGRAMS && (
                            <>
                              <Ionicons name="person" size={12} color="rgba(255, 255, 255, 0.7)" />
                              <Text style={styles.creatorText}>{item.creator_username}</Text>
                            </>
                          )}
                          
                          {currentView === VIEW_TYPES.WORKOUT_HISTORY && item.gym_name && (
                            <>
                              <Ionicons name="location" size={12} color="rgba(255, 255, 255, 0.7)" />
                              <Text style={styles.creatorText}>{item.gym_name}</Text>
                            </>
                          )}
                          
                          {currentView === VIEW_TYPES.TEMPLATES && (
                            <>
                              <Ionicons name="person" size={12} color="rgba(255, 255, 255, 0.7)" />
                              <Text style={styles.creatorText}>{item.creator_username}</Text>
                            </>
                          )}
                        </View>
                        
                        {/* Conditional fork button */}
                        {currentView === VIEW_TYPES.PROGRAMS && 
                         item.creator_username !== user?.username && (
                          <TouchableOpacity 
                            style={styles.forkButton}
                            onPress={() => handleForkProgram(item.id)}
                          >
                            <Ionicons name="download-outline" size={14} color="#7e22ce" />
                            <Text style={[styles.forkText, { color: '#7e22ce' }]}>{t('fork')}</Text>
                          </TouchableOpacity>
                        )}
                        
                        {currentView === VIEW_TYPES.WORKOUT_HISTORY && 
                         item.username !== user?.username && (
                          <TouchableOpacity 
                            style={styles.forkButton}
                            onPress={() => console.log("Fork workout log")}
                          >
                            <Ionicons name="download-outline" size={14} color="#16a34a" />
                            <Text style={[styles.forkText, { color: '#16a34a' }]}>{t('fork')}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      {/* Program specific: Schedule visualization */}
                      {currentView === VIEW_TYPES.PROGRAMS && item.workouts && (
                        <View style={styles.scheduleRow}>
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, dayIndex) => {
                            const hasWorkout = item.workouts.some(w => 
                              w.preferred_weekday === dayIndex
                            );
                            
                            return (
                              <View key={dayIndex} style={styles.dayItem}>
                                <Text style={styles.dayText}>{day}</Text>
                                <View style={[
                                  styles.dayIndicator,
                                  hasWorkout ? styles.dayActive : styles.dayInactive
                                ]} />
                              </View>
                            );
                          })}
                        </View>
                      )}
                      
                      {/* Workout history specific: Exercise bubbles */}
                      {currentView === VIEW_TYPES.WORKOUT_HISTORY && item.exercises && item.exercises.length > 0 && (
                        <View style={styles.exerciseRow}>
                          {item.exercises.slice(0, 3).map((exercise, exIndex) => (
                            <View key={exIndex} style={styles.exerciseBubble}>
                              <Text style={styles.exerciseName} numberOfLines={1}>
                                {exercise.name}
                              </Text>
                            </View>
                          ))}
                          {item.exercises.length > 3 && (
                            <View style={styles.moreBubble}>
                              <Text style={styles.moreText}>+{item.exercises.length - 3}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// Helper functions
const formatFocus = (focus) => {
  if (!focus) return '';
  return focus
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getMoodEmoji = (rating) => {
  if (!rating) return '😐';
  if (rating >= 4.5) return '😀';
  if (rating >= 3.5) return '🙂';
  if (rating >= 2.5) return '😐';
  if (rating >= 1.5) return '😕';
  return '😞';
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  viewSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  statsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  dropdown: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 8,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeDropdownItem: {
    backgroundColor: '#374151',
  },
  dropdownText: {
    fontSize: 16,
    color: '#D1D5DB',
  },
  activeDropdownText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    flex: 1,
  },
  actionButtonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardStack: {
    flex: 1,
  },
  cardStackContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  cardsContainer: {
    marginTop: 12,
  },
  cardContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    minHeight: 180,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 12,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  detailRow: {
    marginRight: 24,
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
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
  },
  forkText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
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
  },
  dayInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  exerciseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 80,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});