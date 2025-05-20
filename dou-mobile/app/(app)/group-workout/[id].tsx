// app/(app)/group-workout/[id].tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

// Custom hooks
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { useGroupWorkout } from '../../../hooks/query/useGroupWorkoutQuery';
import groupWorkoutService from '../../../api/services/groupWorkoutService';

// Components
import Header from './Header';
import ParticipantsDisplay from './ParticipantsDisplay';
import WorkoutTemplate from './WorkoutTemplate';
import ActionButtons from './ActionButtons';
import ChatPreview from './ChatPreview';

// Modals
import ParticipantsModal from './modals/ParticipantsModal';
import InviteModal from './modals/InviteModal';
import JoinRequestsModal from './modals/JoinRequestsModal';
import { 
  ConfirmCancelModal, 
  ConfirmCompleteModal, 
  ConfirmLeaveModal 
} from './modals/ConfirmModals';
import SharePostModal from './modals/SharePostModal';
import EditWorkoutModal from './modals/EditWorkoutModal';

export default function GroupWorkoutDetailScreen() {
  // Get group workout ID from route params
  const params = useLocalSearchParams();
  
  // Extract ID with fallbacks
  const rawId = params.id;
  
  let groupWorkoutId: number;
  
  // Handle different types of ID that might come through
  if (typeof rawId === 'string') {
    groupWorkoutId = parseInt(rawId, 10) || 0;
  } else if (typeof rawId === 'number') {
    groupWorkoutId = rawId;
  } else if (Array.isArray(rawId) && rawId.length > 0) {
    // Sometimes params come as arrays
    const firstId = rawId[0];
    groupWorkoutId = typeof firstId === 'string' ? parseInt(firstId, 10) || 0 : 
                typeof firstId === 'number' ? firstId : 0;
  } else {
    groupWorkoutId = 0;
  }
  
  // Get theme context
  const { workoutPalette, palette } = useTheme();
  
  // Create dynamic theme colors
  const COLORS = {
    primary: workoutPalette.background,
    secondary: workoutPalette.highlight,
    tertiary: workoutPalette.border,
    background: palette.page_background,
    card: "#1F2937", // Consistent with other screens
    text: {
      primary: workoutPalette.text,
      secondary: workoutPalette.text_secondary,
      tertiary: "rgba(255, 255, 255, 0.5)"
    },
    border: workoutPalette.border,
    success: "#22c55e", // Keep universal success color
    danger: "#EF4444", // Keep universal danger color
    highlight: workoutPalette.highlight
  };
  
  // Modal visibility states
  const [showParticipants, setShowParticipants] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false);
  const [showConfirmCompleteModal, setShowConfirmCompleteModal] = useState(false);
  const [showConfirmLeaveModal, setShowConfirmLeaveModal] = useState(false);
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
  const [showSharePostModal, setShowSharePostModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Participants state
  const [invitedParticipants, setInvitedParticipants] = useState([]);
  const [confirmedParticipants, setConfirmedParticipants] = useState([]);
  
  // Hooks
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: groupWorkout, isLoading, refetch } = useGroupWorkout(groupWorkoutId);
  
  // Fetch participants using the service
  useEffect(() => {
    if (groupWorkoutId) {
      fetchParticipants();
    }
  }, [groupWorkoutId]);

  const fetchParticipants = async () => {
    try {
      // Get participants using the service
      const participantsData = await groupWorkoutService.getGroupWorkoutParticipants(groupWorkoutId);
      
      // Separate invited from confirmed participants
      const invited = participantsData.filter(p => p.status === 'invited');
      const confirmed = participantsData.filter(p => p.status === 'joined');
      
      setInvitedParticipants(invited);
      setConfirmedParticipants(confirmed);
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    }
  };

  // Make sure to refetch data when any action is taken
  const refreshData = async () => {
    await refetch();
    await fetchParticipants();
  };
  
  // Count pending join requests
  const pendingRequestsCount = groupWorkout?.join_requests?.filter(
    r => r.status === 'pending'
  ).length || 0;
  
  // Check if current user is a participant
  const isParticipant = (): boolean => {
    return confirmedParticipants.some(
      p => p.user_details.id === user?.id
    ) || false;
  };
  
  // Navigate to the chat page
  const navigateToChat = () => {
    router.push(`/group-workout-chat/${groupWorkoutId}`);
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
  
  // Render error state if group workout not found
  if (!groupWorkout) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: COLORS.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.danger} />
        <Text style={[styles.errorTitle, { color: COLORS.text.primary }]}>{t('workout_not_found')}</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: COLORS.text.primary }]}>{t('back_to_workouts')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header Component with Integrated Info Section */}
      <Header 
        groupWorkout={groupWorkout}
        colors={COLORS}
        onBackPress={() => router.back()}
        onSharePress={() => setShowSharePostModal(true)}
        onParticipantsPress={() => setShowParticipants(true)}
        onInvitePress={() => setShowInviteModal(true)}
        onJoinRequestsPress={() => setShowJoinRequestsModal(true)}
        onEditPress={() => setShowEditModal(true)}
        isCreator={groupWorkout.is_creator}
        isParticipant={isParticipant()}
        pendingRequestsCount={pendingRequestsCount}
      />
      
      {/* Main Content - Scrollable */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Participants Display - confirmed and invited side by side */}
        <ParticipantsDisplay
          invitedParticipants={invitedParticipants}
          confirmedParticipants={confirmedParticipants}
          colors={COLORS}
          onParticipantsPress={() => setShowParticipants(true)}
        />
        
        {/* Workout Template Section */}
        {groupWorkout.workout_template_details && (
          <WorkoutTemplate
            workoutTemplate={groupWorkout.workout_template_details}
            workoutTemplateId={groupWorkout.workout_template}
            colors={COLORS}
            user={user?.username}
          />
        )}
        
        {/* Action Buttons - with less prominent cancel/complete buttons */}
        {groupWorkout.status === 'scheduled' && (
          <ActionButtons
            groupWorkout={groupWorkout}
            colors={COLORS}
            onCancelPress={() => setShowConfirmCancelModal(true)}
            onCompletePress={() => setShowConfirmCompleteModal(true)}
            onLeavePress={() => setShowConfirmLeaveModal(true)}
            onJoinPress={refreshData}
            isCreator={groupWorkout.is_creator}
          />
        )}
        
        {/* Chat Preview - show recent messages */}
        {(groupWorkout.is_creator || isParticipant() || groupWorkout.privacy === 'public') && (
          <ChatPreview
            messages={groupWorkout.messages || []}
            colors={COLORS}
            onViewAllPress={navigateToChat}
            currentUserId={user?.id}
          />
        )}
      </ScrollView>
      
      {/* Modals */}
      <ParticipantsModal
        visible={showParticipants}
        onClose={() => setShowParticipants(false)}
        participants={[...confirmedParticipants, ...invitedParticipants]}
        isCreator={groupWorkout.is_creator}
        colors={COLORS}
        currentUserId={user?.id}
        onRemoveParticipant={refreshData}
        groupWorkoutId={groupWorkoutId}
      />
      
      <InviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        groupWorkoutId={groupWorkoutId}
        colors={COLORS}
        onInvite={refreshData}
        participants={[...confirmedParticipants, ...invitedParticipants]}
      />
      
      <JoinRequestsModal
        visible={showJoinRequestsModal}
        onClose={() => setShowJoinRequestsModal(false)}
        joinRequests={groupWorkout.join_requests?.filter(r => r.status === 'pending') || []}
        colors={COLORS}
        groupWorkoutId={groupWorkoutId}
        onRespond={refreshData}
      />
      
      <ConfirmCancelModal
        visible={showConfirmCancelModal}
        onClose={() => setShowConfirmCancelModal(false)}
        onConfirm={async () => {
          await refreshData();
          setShowConfirmCancelModal(false);
        }}
        colors={COLORS}
        groupWorkoutId={groupWorkoutId}
      />
      
      <ConfirmCompleteModal
        visible={showConfirmCompleteModal}
        onClose={() => setShowConfirmCompleteModal(false)}
        onConfirm={async () => {
          await refreshData();
          setShowConfirmCompleteModal(false);
        }}
        colors={COLORS}
        groupWorkoutId={groupWorkoutId}
      />
      
      <ConfirmLeaveModal
        visible={showConfirmLeaveModal}
        onClose={() => setShowConfirmLeaveModal(false)}
        onConfirm={async () => {
          await refreshData();
          setShowConfirmLeaveModal(false);
        }}
        colors={COLORS}
        groupWorkoutId={groupWorkoutId}
      />
      
      <SharePostModal
        visible={showSharePostModal}
        onClose={() => setShowSharePostModal(false)}
        groupWorkout={groupWorkout}
        colors={COLORS}
        onShare={() => setShowSharePostModal(false)}
      />
      
      <EditWorkoutModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        groupWorkout={groupWorkout}
        colors={COLORS}
        onSave={refreshData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
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
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatButtonContainer: {
    padding: 16,
    paddingTop: 8,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});