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
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// Import Program Wizard
import ProgramWizard, { ProgramFormData } from '../../components/workouts/ProgramWizard';
import { useQueryClient } from '@tanstack/react-query';
import { programKeys } from '../../hooks/query/useProgramQuery';


// Import React Query hooks
import { 
  useUserPrograms, 
  useToggleProgramActive,
  useForkProgram,
  useCreateProgram,
  useDeleteProgram // Add delete program hook
} from '../../hooks/query/useProgramQuery';
import { 
  useLogs,
  useCreateLog,
  useDeleteLog // Add delete log hook
} from '../../hooks/query/useLogQuery';
import { 
  useWorkoutTemplates,
  useDeleteWorkoutTemplate // Add delete template hook
} from '../../hooks/query/useWorkoutQuery';

// Import custom components
import ProgramCard from '../../components/workouts/ProgramCard';
import WorkoutLogCard from '../../components/workouts/WorkoutLogCard';
import WorkoutCard from '../../components/workouts/WorkoutCard';

// Define constants for view types
const VIEW_TYPES = {
  PROGRAMS: 'programs',
  WORKOUT_HISTORY: 'workout_history',
  TEMPLATES: 'templates'
};

const { width, height } = Dimensions.get('window');

export default function WorkoutsScreen() {
  // Auth and language contexts
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { 
    // openProgramDetail, 
    openWorkoutLogDetail 
  } = useModal();
  
  // State for UI
  const [currentView, setCurrentView] = useState(VIEW_TYPES.WORKOUT_HISTORY); // Set workout history as default
  const [viewSelectorVisible, setViewSelectorVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  
  // State for Program Wizard
  const [programWizardVisible, setProgramWizardVisible] = useState(false);
  
  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  
  // Use React Query hooks
  const { 
    data: programs = [], 
    isLoading: programsLoading, 
    refetch: refetchPrograms 
  } = useUserPrograms();
  
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
  const { mutateAsync: createProgram } = useCreateProgram();
  const { mutateAsync: deleteProgram } = useDeleteProgram();
  const { mutateAsync: deleteLog } = useDeleteLog();
  const { mutateAsync: deleteWorkoutTemplate } = useDeleteWorkoutTemplate();
  
  // Get data based on current view with proper filtering
  const getCurrentData = () => {
    switch (currentView) {
      case VIEW_TYPES.PROGRAMS:
        return programs;
      case VIEW_TYPES.WORKOUT_HISTORY:
        return logs.filter(log => log.username === user?.username);
      case VIEW_TYPES.TEMPLATES:
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
    // Exit selection mode when changing views
    setSelectionMode(false);
    setSelectedItems([]);
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

  const handleToggleActiveProgram = async (programId) => {
    try {
      await toggleProgramActive(programId);
      // The mutation's onSuccess handler in useProgramQuery.ts will
      // invalidate queries and update the UI automatically
      await refetchPrograms();
    } catch (error) {
      console.error("Error toggling program active state:", error);
    }
  };
  
  // Handle fork workout log
  const handleForkWorkoutLog = async (log) => {
    try {
      // Implement workout log forking logic here
    } catch (error) {
      console.error("Error forking workout log:", error);
    }
  };
  
  // Handle fork template
  const handleForkTemplate = async (template) => {
    try {
      // Implementation similar to program forking
      refetchTemplates();
    } catch (error) {
      console.error("Error forking template:", error);
    }
  };
  
  // Handle adding template to program
  const handleAddTemplateToProgram = (template) => {
    try {
      // Implementation would navigate to program selection or open a modal
    } catch (error) {
      console.error("Error adding template to program:", error);
    }
  };
  
  // Action handlers
  const handleCreateProgram = () => {
    setProgramWizardVisible(true);
    setActionModalVisible(false);
  };
  
  // Handle program wizard submission
  const handleProgramSubmit = async (formData: ProgramFormData) => {
    try {
      await createProgram(formData);
      setProgramWizardVisible(false);
      
      await refetchPrograms();
      
      if (currentView !== VIEW_TYPES.PROGRAMS) {
        setCurrentView(VIEW_TYPES.PROGRAMS);
      }
    } catch (error) {
      console.error("Error creating program:", error);
    }
  };
  
  // Handle program wizard close
  const handleProgramWizardClose = () => {
    setProgramWizardVisible(false);
  };
  
  const handleLogWorkout = () => {
    // Navigation to log workout
    setActionModalVisible(false);
  };
  
  const handleCreateTemplate = () => {
    // Navigation to template creation
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
  
  // Selection mode handlers
  const toggleSelectionMode = () => {
    if (selectionMode) {
      // Exit selection mode
      setSelectionMode(false);
      setSelectedItems([]);
    } else {
      // Enter selection mode
      setSelectionMode(true);
    }
  };
  
  const handleLongPress = (itemId: number) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedItems([itemId]);
    }
  };
  
  const toggleItemSelection = (itemId: number) => {
    if (selectedItems.includes(itemId)) {
      // Deselect item
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      // Select item
      setSelectedItems([...selectedItems, itemId]);
    }
  };
  
  const selectAll = () => {
    const allIds = getCurrentData().map(item => item.id);
    setSelectedItems(allIds);
  };
  
  const deselectAll = () => {
    setSelectedItems([]);
  };
  
  // Delete handlers
  const confirmDelete = () => {
    setDeleteConfirmVisible(true);
  };
  
  const cancelDelete = () => {
    setDeleteConfirmVisible(false);
  };
  
  const handleDelete = async () => {
    try {
      switch (currentView) {
        case VIEW_TYPES.PROGRAMS:
          // Delete selected programs
          for (const programId of selectedItems) {
            await deleteProgram(programId);
          }
          await refetchPrograms();
          break;
        case VIEW_TYPES.WORKOUT_HISTORY:
          // Delete selected logs
          for (const logId of selectedItems) {
            await deleteLog(logId);
          }
          await refetchLogs();
          break;
        case VIEW_TYPES.TEMPLATES:
          // Delete selected templates
          for (const templateId of selectedItems) {
            await deleteWorkoutTemplate(templateId);
          }
          await refetchTemplates();
          break;
      }
      
      // Exit selection mode and close confirmation
      setDeleteConfirmVisible(false);
      setSelectionMode(false);
      setSelectedItems([]);
    } catch (error) {
      console.error("Error deleting items:", error);
      Alert.alert(
        t('error'),
        t('delete_error'),
        [{ text: t('ok') }]
      );
      setDeleteConfirmVisible(false);
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
          {selectionMode ? (
            // Selection mode header
            <View style={styles.selectionHeader}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={toggleSelectionMode}
              >
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <Text style={styles.selectionCount}>
                {selectedItems.length} {t('selected')}
              </Text>
              
              <View style={styles.selectionActions}>
                {selectedItems.length > 0 && (
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={confirmDelete}
                  >
                    <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                
                {selectedItems.length === 0 ? (
                  <TouchableOpacity 
                    style={styles.selectAllButton}
                    onPress={selectAll}
                  >
                    <Text style={styles.selectAllText}>{t('select_all')}</Text>
                  </TouchableOpacity>
                ) : selectedItems.length < getCurrentData().length ? (
                  <TouchableOpacity 
                    style={styles.selectAllButton}
                    onPress={selectAll}
                  >
                    <Text style={styles.selectAllText}>{t('select_all')}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.selectAllButton}
                    onPress={deselectAll}
                  >
                    <Text style={styles.selectAllText}>{t('deselect_all')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            // Normal header
            <>
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
                  onPress={toggleSelectionMode}
                >
                  <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
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
            </>
          )}
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
                      onToggleActive={handleToggleActiveProgram}
                      selectionMode={selectionMode}
                      isSelected={selectedItems.includes(program.id)}
                      onSelect={() => toggleItemSelection(program.id)}
                      onLongPress={() => handleLongPress(program.id)}
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
                      selectionMode={selectionMode}
                      isSelected={selectedItems.includes(log.id)}
                      onSelect={() => toggleItemSelection(log.id)}
                      onLongPress={() => handleLongPress(log.id)}
                    />
                  </View>
                ))
              }
              
              {currentView === VIEW_TYPES.TEMPLATES && 
                getCurrentData().map((template) => (
                  <View key={`template-${template.id}`} style={styles.cardContainer}>
                    <WorkoutCard
                      workoutId={template.id}
                      workout={template}
                      isTemplate={true}
                      user={user?.username}
                      onFork={handleForkTemplate}
                      onAddToProgram={handleAddTemplateToProgram}
                      selectionMode={selectionMode}
                      isSelected={selectedItems.includes(template.id)}
                      onSelect={() => toggleItemSelection(template.id)}
                      onLongPress={() => handleLongPress(template.id)}
                    />
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
        
        {/* Program Wizard Modal */}
        <ProgramWizard
          program={null}  // No existing program, creating new
          onSubmit={handleProgramSubmit}
          onClose={handleProgramWizardClose}
          visible={programWizardVisible}
        />
        
        {/* Delete Confirmation Modal */}
        <Modal
          visible={deleteConfirmVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelDelete}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <BlurView intensity={40} tint="dark" style={styles.modalBlur} />
              
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalHeaderGradient}
              >
                <Text style={styles.modalTitle}>{t('confirm_delete')}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={cancelDelete}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
              
              <View style={styles.modalContent}>
                <Text style={styles.deleteConfirmText}>
                  {t('delete_confirm_message', { 
                    count: selectedItems.length,
                    type: currentView === VIEW_TYPES.PROGRAMS 
                      ? selectedItems.length === 1 ? t('program') : t('programs')
                      : currentView === VIEW_TYPES.WORKOUT_HISTORY
                      ? selectedItems.length === 1 ? t('workout_log') : t('workout_logs')
                      : selectedItems.length === 1 ? t('template') : t('templates')
                  })}
                </Text>
                
                <View style={styles.deleteButtons}>
                  <TouchableOpacity 
                    style={styles.cancelDeleteButton}
                    onPress={cancelDelete}
                  >
                    <Text style={styles.cancelDeleteText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.confirmDeleteButton}
                    onPress={handleDelete}
                  >
                    <Text style={styles.confirmDeleteText}>{t('delete')}</Text>
                  </TouchableOpacity>
                </View>
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
    maxWidth: '60%',
  },
  viewTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
    flexShrink: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 130,
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
  // Selection mode styles
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  selectionCount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  selectAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectAllText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  // Delete confirmation styles
  deleteConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  deleteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelDeleteButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelDeleteText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});