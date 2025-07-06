// app/(app)/workouts.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { programKeys } from '../../hooks/query/useProgramQuery';
// Import ThemeContext
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { createThemedStyles, withAlpha } from '../../utils/createThemedStyles';
import CustomLoadingScreen from '../../components/shared/CustomLoadingScreen';

// Import workout service
import workoutService from '../../api/services/workoutService';

// Import custom components
import ViewSelector, { VIEW_TYPES, VIEW_ORDER } from '../../components/workouts/ViewSelector';
import SwipeIndicator from '../../components/workouts/SwipeIndicator';
import AnimatedCardList from '../../components/workouts/AnimatedCardList';
import SelectionModeHeader from '../../components/workouts/SelectionModeHeader';
import WorkoutsFabMenu from '../../components/workouts/WorkoutsFabMenu'; // Import the new FAB menu
import LogWorkoutModal from '../../components/workouts/LogWorkoutModal';
import ProgramSelectionBottomSheet from '../../components/workouts/ProgramSelectionBottomSheet';
import TemplateSelectionBottomSheet from '../../components/workouts/TemplateSelectionBottomSheet';
import GroupWorkoutSelectionModal from '../../components/workouts/GroupWorkoutSelectionModal';
import DeleteConfirmationModal from '../../components/workouts/DeleteConfirmationModal';
import LogSelectionBottomSheet from '../../components/workouts/LogSelectionBottomSheet'; // New import

import WorkoutTabs from '@/components/workouts/WorkoutTabs';
// Import Wizards
import ProgramWizard, { ProgramFormData } from '../../components/workouts/ProgramWizard';
import WorkoutTemplateWizard, { WorkoutTemplateFormData } from '../../components/workouts/WorkoutTemplateWizard';
import WorkoutLogWizard, { WorkoutLogFormData } from '../../components/workouts/WorkoutLogWizard';
import GroupWorkoutWizard, { GroupWorkoutFormData } from '../../components/workouts/GroupWorkoutWizard';

// Import React Query hooks
import { 
  useProgram,
  useUserPrograms, 
  useToggleProgramActive,
  useForkProgram,
  useCreateProgram,
  useDeleteProgram
} from '../../hooks/query/useProgramQuery';
import { 
  useLogs,
  useUserLogs,
  useCreateLog,
  useDeleteLog
} from '../../hooks/query/useLogQuery';
import { 
  useWorkoutTemplates,
  useWorkoutTemplate,
  useDeleteWorkoutTemplate,
  useCreateWorkoutTemplate
} from '../../hooks/query/useWorkoutQuery';
import {
  useGroupWorkouts,
  useUserCreatedGroupWorkouts,
  useUserJoinedGroupWorkouts,
  useGroupWorkout,
  useCreateGroupWorkout,
  useUpdateGroupWorkout,
  useDeleteGroupWorkout,
  useJoinGroupWorkout,
  useLeaveGroupWorkout,
  useInviteToGroupWorkout,
} from '../../hooks/query/useGroupWorkoutQuery';

const { width } = Dimensions.get('window');

export default function WorkoutsScreen() {
  // Auth and context
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useLanguage();
  // Use the theme context
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  
  // State for UI
  const currentViewRef = useRef(VIEW_TYPES.WORKOUT_HISTORY); 
  const [currentView, setCurrentView] = useState(VIEW_TYPES.WORKOUT_HISTORY);
  
  const [viewSelectorVisible, setViewSelectorVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  
  // Wizard states
  const [programWizardVisible, setProgramWizardVisible] = useState(false);
  const [workoutTemplateWizardVisible, setWorkoutTemplateWizardVisible] = useState(false);
  const [workoutLogWizardVisible, setWorkoutLogWizardVisible] = useState(false);
  const [groupWorkoutWizardVisible, setGroupWorkoutWizardVisible] = useState(false);
  
  // Workout logging state
  const [logWorkoutModalVisible, setLogWorkoutModalVisible] = useState(false);
  const [logFromProgram, setLogFromProgram] = useState(false);
  const [logFromTemplate, setLogFromTemplate] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  
  // Group workout state
  const [fromTemplate, setFromTemplate] = useState(false);
  const [selectedGroupWorkoutId, setSelectedGroupWorkoutId] = useState<number | null>(null);
  
  // Selection modal states
  const [programSelectionModalVisible, setProgramSelectionModalVisible] = useState(false);
  const [templateSelectionModalVisible, setTemplateSelectionModalVisible] = useState(false);
  const [groupWorkoutSelectionModalVisible, setGroupWorkoutSelectionModalVisible] = useState(false);

  // New state for log selection modal
  const [logSelectionModalVisible, setLogSelectionModalVisible] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [createTemplateFromLog, setCreateTemplateFromLog] = useState(false);

  // For selected program/template data
  const { data: selectedProgram } = useProgram(selectedProgramId);
  const { data: selectedTemplate } = useWorkoutTemplate(selectedTemplateId);
  const { data: selectedGroupWorkout } = useGroupWorkout(selectedGroupWorkoutId);
  const { mutateAsync: inviteToGroupWorkout } = useInviteToGroupWorkout();
  // For active program data
  const { 
    data: activeProgram,
    refetch: refetchActiveProgram
  } = useProgram(user?.current_program?.id);
  
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
  } = useUserLogs(user?.username);
  
  const {
    data: templates = [],
    isLoading: templatesLoading,
    refetch: refetchTemplates
  } = useWorkoutTemplates();
  
  const {
    data: createdGroupWorkouts = [],
    isLoading: createdGroupWorkoutsLoading,
    refetch: refetchCreatedGroupWorkouts
  } = useUserCreatedGroupWorkouts(user?.id);
  
  const {
    data: joinedGroupWorkouts = [],
    isLoading: joinedGroupWorkoutsLoading,
    refetch: refetchJoinedGroupWorkouts
  } = useUserJoinedGroupWorkouts(user?.id);
  
  const getAllGroupWorkouts = () => {
    const workoutsMap = new Map();
    
    // First add all created workouts to the map
    createdGroupWorkouts.forEach(workout => {
      workoutsMap.set(workout.id, {
        ...workout,
        // Ensure is_creator is true even if it wasn't set properly
        is_creator: true
      });
    });
    
    // Then add joined workouts only if they don't already exist in the map
    joinedGroupWorkouts.forEach(workout => {
      // Skip if this workout is already in the map (already processed as a created workout)
      if (!workoutsMap.has(workout.id)) {
        workoutsMap.set(workout.id, {
          ...workout,
          // Ensure is_creator is false for workouts only in the joined list
          is_creator: false
        });
      }
    });
    
    // Convert the Map values back to an array
    return Array.from(workoutsMap.values());
  };

  // Animation values for swipe transitions
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  // Keep the ref in sync with the state
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  // Mutations
  const { mutateAsync: toggleProgramActive } = useToggleProgramActive();
  const { mutateAsync: forkProgram } = useForkProgram();
  const { mutateAsync: createLog } = useCreateLog();
  const { mutateAsync: createProgram } = useCreateProgram();
  const { mutateAsync: deleteProgram } = useDeleteProgram();
  const { mutateAsync: deleteLog } = useDeleteLog();
  const { mutateAsync: deleteWorkoutTemplate } = useDeleteWorkoutTemplate();
  const { mutateAsync: createWorkoutTemplate } = useCreateWorkoutTemplate();
  
  // Group workout mutations
  const { mutateAsync: createGroupWorkout } = useCreateGroupWorkout();
  const { mutateAsync: deleteGroupWorkout } = useDeleteGroupWorkout();
  const { mutateAsync: joinGroupWorkout } = useJoinGroupWorkout();
  const { mutateAsync: leaveGroupWorkout } = useLeaveGroupWorkout();

  // Get data based on current view with proper filtering
  const getCurrentData = () => {
    switch (currentView) {
      case VIEW_TYPES.PROGRAMS:
        return programs;
      case VIEW_TYPES.WORKOUT_HISTORY:
        return logs.filter(log => log.username === user?.username);
      case VIEW_TYPES.TEMPLATES:
        return templates.filter(template => template.creator_username === user?.username);
      case VIEW_TYPES.GROUP_WORKOUTS:
        return getAllGroupWorkouts();
      default:
        return [];
    }
  };

  const refetchGroupWorkouts = async () => {
    await Promise.all([
      refetchCreatedGroupWorkouts(),
      refetchJoinedGroupWorkouts()
    ]);
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
      case VIEW_TYPES.GROUP_WORKOUTS:
        return createdGroupWorkoutsLoading || joinedGroupWorkoutsLoading;
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
        case VIEW_TYPES.GROUP_WORKOUTS:
          await Promise.all([
            refetchCreatedGroupWorkouts(),
            refetchJoinedGroupWorkouts()
          ]);
          break;
      }
    } catch (error) {
      console.error(`Error refreshing ${currentView}:`, error);
    } finally {
      setRefreshing(false);
    }
  }, [currentView, refetchPrograms, refetchLogs, refetchTemplates, refetchCreatedGroupWorkouts, refetchJoinedGroupWorkouts]);

  // Toggle view selector
  const toggleViewSelector = () => {
    setViewSelectorVisible(!viewSelectorVisible);
  };

  // Function to navigate to the next view in the circular order
  const navigateToNextView = () => {
    const current = currentViewRef.current;
    const currentIndex = VIEW_ORDER.indexOf(current);
    
    // Calculate next index with wraparound (circular navigation)
    const nextIndex = (currentIndex + 1) % VIEW_ORDER.length;
    const nextView = VIEW_ORDER[nextIndex];
    
    // Animate out current view (moves left)
    Animated.timing(swipeAnim, {
      toValue: -width, // Move left when going to next
      duration: 100,
      useNativeDriver: true
    }).start(() => {
      setCurrentView(nextView);
      currentViewRef.current = nextView;
      // Reset animation values
      swipeAnim.setValue(width); // Start from right
      contentOpacity.setValue(0.5);
      
      // Animate in new view
      Animated.parallel([
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        })
      ]).start();
    });
  };

  // Function to navigate to the previous view in the circular order
  const navigateToPreviousView = () => {
    const current = currentViewRef.current;
    const currentIndex = VIEW_ORDER.indexOf(current);
    // Calculate previous index with wraparound (circular navigation)
    const prevIndex = (currentIndex - 1 + VIEW_ORDER.length) % VIEW_ORDER.length;
    const prevView = VIEW_ORDER[prevIndex];
    
    // Animate out current view (moves right)
    Animated.timing(swipeAnim, {
      toValue: width, // Move right when going to previous
      duration: 100,
      useNativeDriver: true
    }).start(() => {
      // Change view - THIS UPDATES THE STATE!
      setCurrentView(prevView);
      currentViewRef.current = prevView;
      // Reset animation values
      swipeAnim.setValue(-width); // Start from left
      contentOpacity.setValue(0.5);
      
      // Animate in new view
      Animated.parallel([
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        })
      ]).start();
    });
  };

  // Change current view
  const changeView = (viewType) => {
    if (viewType === currentViewRef.current) {
      setViewSelectorVisible(false);
      return;
    }
    
    // Get indices for animation direction
    const currentIndex = VIEW_ORDER.indexOf(currentViewRef.current);
    const targetIndex = VIEW_ORDER.indexOf(viewType);
    
    // Determine best animation direction (clockwise or counterclockwise)
    let clockwise = true;
    if (targetIndex < currentIndex) {
      if (currentIndex - targetIndex > VIEW_ORDER.length / 2) {
        clockwise = true;
      } else {
        clockwise = false;
      }
    } else {
      if (targetIndex - currentIndex > VIEW_ORDER.length / 2) {
        clockwise = false;
      } else {
        clockwise = true;
      }
    }
    
    const direction = clockwise ? -1 : 1;
    
    // Animate out current view
    Animated.timing(swipeAnim, {
      toValue: width * direction,
      duration: 100,
      useNativeDriver: true
    }).start(() => {
      // Update both the state and the ref
      setCurrentView(viewType);
      currentViewRef.current = viewType;
      
      // Reset animation values
      swipeAnim.setValue(width * -direction);
      contentOpacity.setValue(0.5);
      
      // Animate in new view
      Animated.parallel([
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        })
      ]).start();
    });
    
    setViewSelectorVisible(false);
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
  
  // Handle joining a group workout
  const handleJoinGroupWorkout = async (groupWorkoutId) => {
    try {
      await joinGroupWorkout({ id: groupWorkoutId, message: '' });
      await refetchGroupWorkouts();
    } catch (error) {
      console.error("Error joining group workout:", error);
    }
  };
  
  // Handle leaving a group workout
  const handleLeaveGroupWorkout = async (groupWorkoutId) => {
    try {
      await leaveGroupWorkout(groupWorkoutId);
      await refetchGroupWorkouts();
    } catch (error) {
      console.error("Error leaving group workout:", error);
    }
  };
  
  // Action handlers for FAB menu
  const handleCreateProgram = () => {
    setProgramWizardVisible(true);
  };

  const handleCreateTemplate = () => {
    setWorkoutTemplateWizardVisible(true);
  };

  // New handler for creating template from log
  const handleCreateTemplateFromLog = () => {
    setCreateTemplateFromLog(true);
    setLogSelectionModalVisible(true);
  };
  
  // New handler for group workouts
  const handleCreateGroupWorkout = () => {
    setFromTemplate(false);
    setSelectedTemplateId(null);
    setGroupWorkoutWizardVisible(true);
  };
  
  const handleCreateGroupWorkoutFromTemplate = () => {
    setFromTemplate(true);
    setTemplateSelectionModalVisible(true);
  };
  
  // New handler for real-time workout
  const handleStartRealtimeWorkout = () => {
    router.push('/realtime-workout?source=custom');
  };

  // Handle log selection for template creation
  const handleLogSelected = (log) => {
    setLogSelectionModalVisible(false);
    setSelectedLogId(log.id);
    
    if (createTemplateFromLog) {
      // Create template directly from the selected log
      handleCreateTemplateFromSelectedLog(log);
    }
  };

  // Handle creating template from selected log
  const handleCreateTemplateFromSelectedLog = async (log) => {
    try {
      // You might want to show a dialog to customize template name/description
      const templateName = `${log.name}`;
      const templateDescription = `${t('created_from_workout')}: ${log.name} (${log.date})`;
      
      await workoutService.createTemplateFromLog(log, templateName, templateDescription);
      
      // Reset state
      setCreateTemplateFromLog(false);
      setSelectedLogId(null);
      
      // Refresh templates and switch to templates view
      await refetchTemplates();
      
      if (currentView !== VIEW_TYPES.TEMPLATES) {
        setCurrentView(VIEW_TYPES.TEMPLATES);
      }
      
      // Show success message
      Alert.alert(
        "Success",
        "Template created successfully from workout log!",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error creating template from log:", error);
      
      // Enhanced error handling based on error type
      let errorTitle = "Error";
      let errorMessage = "Failed to create template from workout log. Please try again.";
      
      if (error.name === 'ValidationError') {
        errorTitle = "Validation Error";
        errorMessage = error.message || "The workout log data is not valid for template creation.";
      } else if (error.response?.status === 400) {
        errorTitle = "Invalid Data";
        const validationErrors = error.response.data;
        
        if (typeof validationErrors === 'object') {
          // Format validation errors for user-friendly display
          const errorDetails = Object.entries(validationErrors)
            .map(([field, errors]) => {
              const errorList = Array.isArray(errors) ? errors : [errors];
              return `${field}: ${errorList.join(', ')}`;
            })
            .join('\n');
          
          errorMessage = `Please check the following:\n\n${errorDetails}`;
        } else {
          errorMessage = validationErrors.detail || validationErrors.message || errorMessage;
        }
      } else if (error.response?.status === 401) {
        errorTitle = "Authentication Error";
        errorMessage = "You need to be logged in to create templates.";
      } else if (error.response?.status === 403) {
        errorTitle = "Permission Error";
        errorMessage = "You don't have permission to create templates.";
      } else if (error.response?.status >= 500) {
        errorTitle = "Server Error";
        errorMessage = "A server error occurred. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        errorTitle,
        errorMessage,
        [{ text: "OK" }]
      );
      
      // Reset state on error
      setCreateTemplateFromLog(false);
      setSelectedLogId(null);
    }
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

  const handleWorkoutTemplateSubmit = async (formData: WorkoutTemplateFormData) => {
    try {
      await createWorkoutTemplate(formData);
      setWorkoutTemplateWizardVisible(false);
      
      await refetchTemplates();
      
      if (currentView !== VIEW_TYPES.TEMPLATES) {
        setCurrentView(VIEW_TYPES.TEMPLATES);
      }
    } catch (error) {
      console.error("Error creating workout template:", error);
    }
  };
  
  // Handle group workout wizard submission
  const handleGroupWorkoutSubmit = async (formData: GroupWorkoutFormData) => {
    try {
      // Store invited users before creating the workout
      const invitedUsers = [...formData.invited_users];
      
      // Create the group workout
      const newWorkout = await createGroupWorkout(formData);
      
      // If there are invited users, send invitations
      if (invitedUsers && invitedUsers.length > 0) {
        await inviteToGroupWorkout({
          id: newWorkout.id,
          userIds: invitedUsers
        });
      }
      
      setGroupWorkoutWizardVisible(false);
      
      // Refetch to update UI with new workout and invitations
      await refetchCreatedGroupWorkouts();
      await refetchJoinedGroupWorkouts();
      
      if (currentView !== VIEW_TYPES.GROUP_WORKOUTS) {
        setCurrentView(VIEW_TYPES.GROUP_WORKOUTS);
      }
    } catch (error) {
      console.error("Error creating group workout:", error);
    }
  };
  
  // Handle wizard closes
  const handleProgramWizardClose = () => {
    setProgramWizardVisible(false);
  };
  
  const handleWorkoutTemplateWizardClose = () => {
    setWorkoutTemplateWizardVisible(false);
  };
  
  const handleGroupWorkoutWizardClose = () => {
    setGroupWorkoutWizardVisible(false);
    setFromTemplate(false);
    setSelectedTemplateId(null);
  };

  const handleLogWorkout = () => {
    setLogWorkoutModalVisible(true);
  };

  // Log from program option
  const handleLogFromProgram = async () => {
    try {
      // Invalidate and refetch the current user data
      await queryClient.invalidateQueries({ queryKey: ['users', 'current'] });
      await queryClient.refetchQueries({ queryKey: ['users', 'current'], type: 'active' });
      
      // Check again after refresh if there's a current program
      const currentUser = queryClient.getQueryData(['users', 'current']);
      
      if (!currentUser?.current_program?.id) {
        Alert.alert(
          "No Active Program",
          "You don't have an active program. Please activate a program first.",
          [{ text: "OK" }]
        );
        return;
      }
      
      // Store current program ID
      const currentProgramId = currentUser.current_program.id;
      setSelectedProgramId(currentProgramId);
      
      // Invalidate program queries
      await queryClient.invalidateQueries({ queryKey: programKeys.all });
      await queryClient.refetchQueries({ 
        queryKey: programKeys.detail(currentProgramId),
        type: 'active'
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      setLogWorkoutModalVisible(false);
      setProgramSelectionModalVisible(true);
    } catch (error) {
      console.error("Error refreshing user and program data:", error);
      Alert.alert(
        "Error",
        "Failed to load program data. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Log from template
  const handleLogFromTemplate = () => {
    setLogWorkoutModalVisible(false);
    setTemplateSelectionModalVisible(true);
  };
  
  // Log from scratch
  const handleLogFromScratch = () => {
    setLogWorkoutModalVisible(false);
    setLogFromProgram(false);
    setLogFromTemplate(false);
    setSelectedProgramId(null);
    setSelectedTemplateId(null);
    setWorkoutLogWizardVisible(true);
  };

  // Handle program workout selection
  const handleProgramWorkoutSelected = (workout) => {
    setProgramSelectionModalVisible(false);
    setLogFromProgram(true);
    setLogFromTemplate(false);
    setSelectedWorkoutId(workout.id);
    setWorkoutLogWizardVisible(true);
  };

  // Handle template selection
  const handleTemplateSelected = (template) => {
    setTemplateSelectionModalVisible(false);
    
    if (fromTemplate) {
      // For creating group workout from template
      setSelectedTemplateId(template.id);
      setGroupWorkoutWizardVisible(true);
    } else {
      // For logging workout from template
      setLogFromProgram(false);
      setLogFromTemplate(true);
      setSelectedTemplateId(template.id);
      setWorkoutLogWizardVisible(true);
    }
  };

  // Handle workout log wizard submit
  const handleWorkoutLogSubmit = async (formData) => {
    try {
      await createLog(formData);
      setWorkoutLogWizardVisible(false);
      setSelectedProgramId(null);
      setSelectedTemplateId(null);
      
      await refetchLogs();
      
      if (currentView !== VIEW_TYPES.WORKOUT_HISTORY) {
        setCurrentView(VIEW_TYPES.WORKOUT_HISTORY);
      }
    } catch (error) {
      console.error("Error creating workout log:", error);
    }
  };

  // Handle workout log wizard close
  const handleWorkoutLogWizardClose = () => {
    setWorkoutLogWizardVisible(false);
    setSelectedProgramId(null);
    setSelectedTemplateId(null);
    setSelectedWorkoutId(null);
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
        case VIEW_TYPES.GROUP_WORKOUTS:
          // Delete selected group workouts
          for (const groupWorkoutId of selectedItems) {
            await deleteGroupWorkout(groupWorkoutId);
          }
          await refetchGroupWorkouts();
          break;
      }
      
      // Exit selection mode and close confirmation
      setDeleteConfirmVisible(false);
      setSelectionMode(false);
      setSelectedItems([]);
    } catch (error) {
      console.error("Error deleting items:", error);
      Alert.alert(
        "Error",
        "Failed to delete items. Please try again.",
        [{ text: "OK" }]
      );
      setDeleteConfirmVisible(false);
    }
  };
  
  // Render loading state
  if (isLoading() && !refreshing) {
    return (
      <CustomLoadingScreen 
        animationType="bounce"
        text={t('loading')}
        size='large'
        preloadImages={true}
        // style={{ backgroundColor: palette.page_background }}
        // textColor={palette.text}
        // tintColor={palette.highlight}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.layout }]}>
      <StatusBar barStyle="light-content" backgroundColor={palette.accent} />
      <View style={[styles.container, { backgroundColor: palette.page_background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: palette.border }]}>
          {selectionMode ? (
            // Selection mode header
            <SelectionModeHeader
              toggleSelectionMode={toggleSelectionMode}
              confirmDelete={confirmDelete}
              selectAll={selectAll}
              deselectAll={deselectAll}
              selectedItems={selectedItems}
              totalItems={getCurrentData().length}
            />
          ) : (
            // Normal header
            <>
              <Text style={styles.screenTitle}>{t('workouts')}</Text>
{/*               
              <ViewSelector
                currentView={currentView}
                viewSelectorVisible={viewSelectorVisible}
                toggleViewSelector={toggleViewSelector}
                changeView={changeView}
              /> */}
              
              <View>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={toggleSelectionMode}
                >
                  <Ionicons name="ellipsis-horizontal" size={24} color={palette.text} />
                </TouchableOpacity>
              
              </View>
            </>
          )}
        </View>
        {!selectionMode && (
          <View style={styles.tabContainer}>
            <WorkoutTabs
              currentView={currentView}
              onChangeView={changeView}
            />
          </View>
        )}
        {/* Swipe Indicator */}
        <SwipeIndicator currentView={currentView} />
        
        
        {/* Card List with Animation & Swipe Handler */}
        <AnimatedCardList
          currentView={currentView}
          data={getCurrentData()}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          user={user}
          onNavigateToNextView={navigateToNextView}
          onNavigateToPreviousView={navigateToPreviousView}
          selectionMode={selectionMode}
          selectedItems={selectedItems}
          onItemSelect={toggleItemSelection}
          onItemLongPress={handleLongPress}
          onForkProgram={handleForkProgram}
          onToggleActiveProgram={handleToggleActiveProgram}
          onForkWorkoutLog={handleForkWorkoutLog}
          onForkTemplate={handleForkTemplate}
          onAddTemplateToProgram={handleAddTemplateToProgram}
          onJoinGroupWorkout={handleJoinGroupWorkout}
          onLeaveGroupWorkout={handleLeaveGroupWorkout}
          swipeAnim={swipeAnim}
          contentOpacity={contentOpacity}
          // Pass theme palette to AnimatedCardList
          themePalette={palette}
        />

        {/* FAB Menu */}
        <WorkoutsFabMenu
          currentView={currentView}
          onCreateProgram={handleCreateProgram}
          onCreateTemplate={handleCreateTemplate}
          onCreateTemplateFromLog={handleCreateTemplateFromLog}
          onCreateGroupWorkout={handleCreateGroupWorkout}
          onCreateGroupWorkoutFromTemplate={handleCreateGroupWorkoutFromTemplate}
          onLogWorkout={handleLogWorkout}
          onLogFromProgram={handleLogFromProgram}
          onLogFromTemplate={handleLogFromTemplate}
          onLogFromScratch={handleLogFromScratch}
          onStartRealtimeWorkout={handleStartRealtimeWorkout}
          themePalette={palette}
        />

        {/* Modals */}
        <LogWorkoutModal
          visible={logWorkoutModalVisible}
          onClose={() => setLogWorkoutModalVisible(false)}
          onLogFromProgram={handleLogFromProgram}
          onLogFromTemplate={handleLogFromTemplate}
          onLogFromScratch={handleLogFromScratch}
          themePalette={palette}
        />
        
        <ProgramSelectionBottomSheet
          visible={programSelectionModalVisible}
          onClose={() => setProgramSelectionModalVisible(false)}
          onWorkoutSelected={handleProgramWorkoutSelected}
          activeProgram={activeProgram}
          programsLoading={programsLoading}
          user={user}
          themePalette={palette}
        />
        
        <TemplateSelectionBottomSheet
          visible={templateSelectionModalVisible}
          onClose={() => {
            setTemplateSelectionModalVisible(false);
            if (fromTemplate) {
              setFromTemplate(false);
            }
          }}
          onTemplateSelected={handleTemplateSelected}
          templates={templates}
          templatesLoading={templatesLoading}
          user={user}
          themePalette={palette}
        />
        
        <GroupWorkoutSelectionModal
          visible={groupWorkoutSelectionModalVisible}
          onClose={() => setGroupWorkoutSelectionModalVisible(false)}
          onGroupWorkoutSelected={(groupWorkout) => {
            setSelectedGroupWorkoutId(groupWorkout.id);
            setGroupWorkoutSelectionModalVisible(false);
            setGroupWorkoutWizardVisible(true);
          }}
          groupWorkouts={getAllGroupWorkouts()}
          groupWorkoutsLoading={createdGroupWorkoutsLoading || joinedGroupWorkoutsLoading}
          user={user}
          themePalette={palette}
        />
        
        <DeleteConfirmationModal
          visible={deleteConfirmVisible}
          onClose={cancelDelete}
          onConfirm={handleDelete}
          selectedItems={selectedItems}
          currentView={currentView}
          themePalette={palette}
        />

        {/* New Log Selection Modal */}
        <LogSelectionBottomSheet
          visible={logSelectionModalVisible}
          onClose={() => {
            setLogSelectionModalVisible(false);
            setCreateTemplateFromLog(false);
            setSelectedLogId(null);
          }}
          onLogSelected={handleLogSelected}
          logs={logs.filter(log => log.username === user?.username)}
          logsLoading={logsLoading}
          user={user}
          themePalette={palette}
        />
        
        {/* Wizards */}
        <ProgramWizard
          program={null}
          onSubmit={handleProgramSubmit}
          onClose={handleProgramWizardClose}
          visible={programWizardVisible}
          themePalette={palette}
        />

        <WorkoutTemplateWizard
          template={null}
          onSubmit={handleWorkoutTemplateSubmit}
          onClose={handleWorkoutTemplateWizardClose}
          visible={workoutTemplateWizardVisible}
          themePalette={palette}
        />

        <WorkoutLogWizard
          logFromProgram={logFromProgram}
          logFromTemplate={logFromTemplate}
          programWorkout={selectedProgram ? selectedProgram.workouts?.find(w => w.id === selectedWorkoutId) : null}
          template={selectedTemplate}
          onSubmit={handleWorkoutLogSubmit}
          onClose={handleWorkoutLogWizardClose}
          visible={workoutLogWizardVisible}
          onProgramSelected={(programId) => setSelectedProgramId(programId)}
          onTemplateSelected={(templateId) => setSelectedTemplateId(templateId)}
          programId={selectedProgramId}
          themePalette={palette}
        />
        
        <GroupWorkoutWizard
          groupWorkout={selectedGroupWorkoutId ? selectedGroupWorkout : null}
          fromTemplate={fromTemplate}
          template={fromTemplate && selectedTemplateId ? selectedTemplate : null}
          onSubmit={handleGroupWorkoutSubmit}
          onClose={handleGroupWorkoutWizardClose}
          visible={groupWorkoutWizardVisible}
          onTemplateSelected={(templateId) => setSelectedTemplateId(templateId)}
          user={user}
        />
      </View>
    </SafeAreaView>
  );
}

const themedStyles = createThemedStyles((palette) => ({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: palette.page_background,
  },
  container: {
    flex: 1,
    backgroundColor: palette.page_background,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 0,
    borderBottomWidth: 0,
    backgroundColor: palette.layout,
  },

  headerButton: {
    width: 40,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginLeft: 8,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    opacity: 1,
  },
  inactiveTab: {
    opacity: 0.6,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    color: palette.text,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: palette.text,
  },
  inactiveTabText: {
    color: withAlpha(palette.text, 0.7),
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '25%',
    borderRadius: 1.5,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: palette.text,
    marginLeft: 8,
  },
  tabContainer: {
    paddingBottom: 4,
    backgroundColor: palette.layout,
    elevation: 3, // For Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
}));