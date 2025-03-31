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
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

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
  const [currentView, setCurrentView] = useState(VIEW_TYPES.WORKOUT_HISTORY); // Set workout history as default
  const [viewSelectorVisible, setViewSelectorVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  
  // Use React Query hooks
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

  // Get view title using language context
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

  // Toggle action modal
  const toggleActionModal = () => {
    setActionModalVisible(!actionModalVisible);
  };

  // Change current view
  const changeView = (viewType) => {
    setCurrentView(viewType);
    setViewSelectorVisible(false);
  };
  
  // Handle fork program
  const handleForkProgram = async (programId) => {
    try {
      await forkProgram(programId);
      refetchPrograms();
    } catch (error) {
      console.error("Error forking program:", error);
    }
  };
  
  // Handle fork workout log
  const handleForkWorkoutLog = async (log) => {
    try {
      console.log("Forking workout log:", log.id);
      // Implement workout log forking logic here
    } catch (error) {
      console.error("Error forking workout log:", error);
    }
  };
  
  // Action handlers
  const handleCreateProgram = () => {
    // Navigation to program creation
    console.log("Create program button pressed");
    setActionModalVisible(false);
  };
  
  const handleLogWorkout = () => {
    // Navigation to log workout
    console.log("Log workout button pressed");
    setActionModalVisible(false);
  };
  
  const handleCreateTemplate = () => {
    // Navigation to template creation
    console.log("Create template button pressed");
    setActionModalVisible(false);
  };
  
  // Get action modal title
  const getActionModalTitle = () => {
    switch (currentView) {
      case VIEW_TYPES.PROGRAMS:
        return t('program_options');
      case VIEW_TYPES.WORKOUT_HISTORY:
        return t('workout_options');
      case VIEW_TYPES.TEMPLATES:
        return t('template_options');
      default:
        return t('select_action');
    }
  };

  // Get action gradient colors
  const getActionGradient = () => {
    switch (currentView) {
      case VIEW_TYPES.PROGRAMS:
        return ['#7e22ce', '#9333ea'];
      case VIEW_TYPES.WORKOUT_HISTORY:
        return ['#16a34a', '#22c55e'];
      case VIEW_TYPES.TEMPLATES:
        return ['#2563eb', '#3b82f6'];
      default:
        return ['#9333EA', '#D946EF'];
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
          
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={toggleActionModal}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => router.push('/analytics')}
            >
              <Ionicons name="stats-chart" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
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
              {currentView === VIEW_TYPES.PROGRAMS && 
                getCurrentData().map((program) => (
                  <View key={`program-${program.id}`} style={styles.cardContainer}>
                    <ProgramCard
                      programId={program.id}
                      program={program}
                      currentUser={user?.username}
                      onFork={handleForkProgram}
                    />
                  </View>
                ))
              }
              
              {currentView === VIEW_TYPES.WORKOUT_HISTORY && 
                getCurrentData().map((log) => (
                  <View key={`log-${log.id}`} style={styles.cardContainer}>
                    <WorkoutLogCard
                      logId={log.id}
                      log={log}
                      user={user?.username}
                      onFork={handleForkWorkoutLog}
                    />
                  </View>
                ))
              }
              
              {currentView === VIEW_TYPES.TEMPLATES && 
                getCurrentData().map((template, index) => (
                  <View
                    key={`template-${template.id}`}
                    style={styles.cardContainer}
                  >
                    {/* For templates, we'll use a simpler card for now */}
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[
                        styles.templateCard,
                        { backgroundColor: '#2563eb' }
                      ]}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {template.name}
                        </Text>
                      </View>
                      
                      <Text style={styles.cardSubtitle}>
                        {formatFocus(template.focus || 'general')}
                      </Text>
                      
                      <View style={styles.cardDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>{t('exercises')}</Text>
                          <Text style={styles.detailValue}>{template.exercises?.length || 0}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.cardFooter}>
                        <View style={styles.creatorInfo}>
                          <Ionicons name="person" size={12} color="rgba(255, 255, 255, 0.7)" />
                          <Text style={styles.creatorText}>{template.creator_username}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))
              }
            </View>
          )}
        </ScrollView>

        {/* Action Modal */}
        <Modal
          visible={actionModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setActionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <BlurView intensity={40} tint="dark" style={styles.modalBlur} />
              
              {/* Modal Header with Gradient */}
              <LinearGradient
                colors={getActionGradient()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalHeaderGradient}
              >
                <Text style={styles.modalTitle}>{getActionModalTitle()}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setActionModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
              
              {/* Modal Content */}
              <View style={styles.modalContent}>
                {/* Workout History View Options */}
                {currentView === VIEW_TYPES.WORKOUT_HISTORY && (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={handleLogWorkout}
                  >
                    <View style={styles.modalOptionIcon}>
                      <Ionicons name="add-circle" size={24} color="#16a34a" />
                    </View>
                    <View style={styles.modalOptionText}>
                      <Text style={styles.modalOptionTitle}>{t('log_workout')}</Text>
                      <Text style={styles.modalOptionDescription}>
                        {t('record_completed_workout')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                
                {/* Programs View Options */}
                {currentView === VIEW_TYPES.PROGRAMS && (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={handleCreateProgram}
                  >
                    <View style={styles.modalOptionIcon}>
                      <Ionicons name="add-circle" size={24} color="#7e22ce" />
                    </View>
                    <View style={styles.modalOptionText}>
                      <Text style={styles.modalOptionTitle}>{t('create_program')}</Text>
                      <Text style={styles.modalOptionDescription}>
                        {t('design_new_workout_program')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                
                {/* Templates View Options */}
                {currentView === VIEW_TYPES.TEMPLATES && (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={handleCreateTemplate}
                  >
                    <View style={styles.modalOptionIcon}>
                      <Ionicons name="add-circle" size={24} color="#2563eb" />
                    </View>
                    <View style={styles.modalOptionText}>
                      <Text style={styles.modalOptionTitle}>{t('create_template')}</Text>
                      <Text style={styles.modalOptionDescription}>
                        {t('create_new_workout_template')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// Helper function for templates view
const formatFocus = (focus) => {
  if (!focus) return '';
  return focus
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginLeft: 8,
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
  // For template cards only (since we don't have a TemplateCard component yet)
  templateCard: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  modalBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    marginBottom: 10,
  },
  modalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalOptionDescription: {
    fontSize: 13,
    color: '#D1D5DB',
  },
});