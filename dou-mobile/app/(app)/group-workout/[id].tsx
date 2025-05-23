// app/(app)/group-workout/[id].tsx - Enhanced Event Planning Style with Voting
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
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Custom hooks
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { 
  useGroupWorkout, 
  useGroupWorkoutProposals, 
  useMostVotedProposal 
} from '../../../hooks/query/useGroupWorkoutQuery';
import { useWorkoutTemplates } from '../../../hooks/query/useWorkoutQuery';
import groupWorkoutService from '../../../api/services/groupWorkoutService';

// Components
import CompactHeader from './CompactHeader';
import WorkoutCard from '../../../components/workouts/WorkoutCard';
import ActionButtons from './ActionButtons';
import EnhancedChatPreview from './EnhancedChatPreview';
import ParticipantsDisplay from './ParticipantsDisplay';

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
import SelectWorkoutModal from './modals/SelectWorkoutModal';

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
    const firstId = rawId[0];
    groupWorkoutId = typeof firstId === 'string' ? parseInt(firstId, 10) || 0 : 
                typeof firstId === 'number' ? firstId : 0;
  } else {
    groupWorkoutId = 0;
  }
  
  // Get theme context - NOW USING GROUP WORKOUT PALETTE
  const { groupWorkoutPalette, palette } = useTheme();
  
  // Create dynamic theme colors with enhanced gradient support
  const COLORS = {
    primary: groupWorkoutPalette.background,
    secondary: groupWorkoutPalette.highlight,
    tertiary: groupWorkoutPalette.border,
    background: palette.page_background,
    card: "rgba(31, 41, 55, 0.4)", // Slightly transparent for layering
    text: {
      primary: groupWorkoutPalette.text,
      secondary: groupWorkoutPalette.text_secondary,
      tertiary: "rgba(255, 255, 255, 0.6)"
    },
    border: groupWorkoutPalette.border,
    success: "#10b981", // Emerald green
    danger: "#ef4444", // Keep universal danger color
    warning: "#f59e0b", // Amber warning
    highlight: groupWorkoutPalette.highlight,
    badge_bg: groupWorkoutPalette.badge_bg,
    action_bg: groupWorkoutPalette.action_bg,
    // Gradient colors extracted from the background
    gradientStart: "#f59e0b", // amber-500
    gradientEnd: "#d97706"     // amber-600
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
  const [showSelectWorkoutModal, setShowSelectWorkoutModal] = useState(false);
  
  // Participants state
  const [invitedParticipants, setInvitedParticipants] = useState([]);
  const [confirmedParticipants, setConfirmedParticipants] = useState([]);
  
  // Hooks
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: groupWorkout, isLoading, refetch } = useGroupWorkout(groupWorkoutId);
  const { data: userWorkoutTemplates } = useWorkoutTemplates();
  
  // New: Fetch the most voted proposal
  const { data: mostVotedProposal, refetch: refetchMostVoted } = useMostVotedProposal(groupWorkoutId);
  
  // Fetch participants using the service
  useEffect(() => {
    if (groupWorkoutId) {
      fetchParticipants();
    }
  }, [groupWorkoutId]);

  const fetchParticipants = async () => {
    try {
      const participantsData = await groupWorkoutService.getGroupWorkoutParticipants(groupWorkoutId);
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
    await refetchMostVoted();
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

  // Navigate to the voting page
  const navigateToVoting = () => {
    router.push(`/group-workout-voting/${groupWorkoutId}`);
  };

  // Handle submitting a workout template as a proposal
  const handleSubmitWorkoutTemplate = async (templateId: number) => {
    try {
      await groupWorkoutService.proposeWorkout(groupWorkoutId, templateId);
      // Refresh data after the update is complete
      await refreshData();
      Alert.alert(t('success'), t('workout_proposal_submitted'));
      setShowSelectWorkoutModal(false);
    } catch (error) {
      console.error('Failed to submit workout proposal:', error);
      Alert.alert(t('error'), t('failed_to_submit_proposal'));
    }
  };

  // Set most voted workout as the official template
  const handleSelectMostVotedWorkout = async () => {
    if (!mostVotedProposal || !mostVotedProposal.workout_template) {
      Alert.alert(t('error'), t('no_most_voted_workout'));
      return;
    }

    try {
      await groupWorkoutService.updateGroupWorkout(groupWorkoutId, {
        workout_template: mostVotedProposal.workout_template
      });
      await refreshData();
      Alert.alert(t('success'), t('most_voted_workout_selected'));
    } catch (error) {
      console.error('Failed to set most voted workout:', error);
      Alert.alert(t('error'), t('failed_to_set_most_voted'));
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={[styles.loadingText, { color: "#ffffff" }]}>{t('loading')}</Text>
      </LinearGradient>
    );
  }
  
  // Render error state if group workout not found
  if (!groupWorkout) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: COLORS.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.danger} />
        <Text style={[styles.errorTitle, { color: COLORS.text.primary }]}>{t('workout_not_found')}</Text>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: COLORS.primary }]} 
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: COLORS.text.primary }]}>
            {t('back_to_workouts')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Determine what workout to display - either the most voted proposal or the official template
  const displayWorkout = mostVotedProposal?.workout_template_details || groupWorkout.workout_template_details;
  const displayWorkoutId = mostVotedProposal?.workout_template || groupWorkout.workout_template;
  const isOfficialTemplate = groupWorkout.workout_template === displayWorkoutId;
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Compact Header without Participants */}
      <CompactHeader 
        groupWorkout={groupWorkout}
        colors={COLORS}
        onBackPress={() => router.back()}
        onSharePress={() => setShowSharePostModal(true)}
        onJoinRequestsPress={() => setShowJoinRequestsModal(true)}
        onEditPress={() => setShowEditModal(true)}
        onInvitePress={() => setShowInviteModal(true)}
        isCreator={groupWorkout.is_creator}
        isParticipant={isParticipant()}
        pendingRequestsCount={pendingRequestsCount}
      />
      
      {/* Main Content - Event Planning Style */}
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Participants Display Section - Moved outside header */}
        <View style={styles.section}>
          <ParticipantsDisplay
            invitedParticipants={invitedParticipants}
            confirmedParticipants={confirmedParticipants}
            colors={COLORS}
            onParticipantsPress={() => setShowParticipants(true)}
          />
        </View>
        
        {/* Chat Preview Section */}
        {(groupWorkout.is_creator || isParticipant() || groupWorkout.privacy === 'public') && (
          <View style={styles.section}>
            <EnhancedChatPreview
              messages={groupWorkout.messages || []}
              colors={COLORS}
              onViewAllPress={navigateToChat}
              currentUserId={user?.id}
            />
          </View>
        )}
        
        {/* Workout Template Card or Empty State */}
        <View style={styles.section}>
          {/* Voting Section */}
          <View style={styles.votingHeaderContainer}>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>
              {displayWorkout ? t('choose_workout') : t('choose_workout')}
            </Text>
            
            <View style={styles.votingActionsContainer}>
              {/* Button to select most voted workout */}
              {mostVotedProposal && !isOfficialTemplate && groupWorkout.is_creator && (
                <TouchableOpacity 
                  style={styles.selectMostVotedIcon}
                  onPress={handleSelectMostVotedWorkout}
                >
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                </TouchableOpacity>
              )}
              
              {/* Button to go to voting page */}
              <TouchableOpacity 
                style={[styles.votingButton, { backgroundColor: COLORS.highlight }]}
                onPress={navigateToVoting}
              >
                <Ionicons name="thumbs-up-outline" size={16} color="#FFFFFF" />
                <Text style={styles.votingButtonText}>
                  {t('vote_for_workout')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Render the most voted proposal or the official template */}
          {displayWorkout ? (
            <View style={styles.workoutCardContainer}>
              {mostVotedProposal && !isOfficialTemplate && (
                <View style={[styles.mostVotedBadge, { backgroundColor: COLORS.success }]}>
                  <Ionicons name="trophy-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.mostVotedText}>
                    {t('most_voted')} ({mostVotedProposal.vote_count} {t('votes')})
                  </Text>
                </View>
              )}
              <WorkoutCard
                workoutId={displayWorkoutId}
                workout={displayWorkout}
                isTemplate={true}
                user={user?.username}
              />
            </View>
          ) : (
            <View style={[styles.emptyTemplateContainer, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
              <View style={styles.emptyTemplateContent}>
                <Ionicons name="barbell-outline" size={40} color={COLORS.text.tertiary} />
                <Text style={[styles.emptyTemplateTitle, { color: COLORS.text.primary }]}>
                  {t('no_workout_template')}
                </Text>
                <Text style={[styles.emptyTemplateDescription, { color: COLORS.text.secondary }]}>
                  {groupWorkout.is_creator 
                    ? t('vote_for_workout_description') 
                    : t('no_workout_template_participant')}
                </Text>
                
                {/* Allow proposing a workout if creator or participant */}
                {(groupWorkout.is_creator || isParticipant()) && groupWorkout.status === 'scheduled' && (
                  <TouchableOpacity
                    style={[styles.addTemplateButton, { backgroundColor: COLORS.primary }]}
                    onPress={() => setShowSelectWorkoutModal(true)}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.addTemplateButtonText}>
                      {t('propose_workout')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
        
        {/* Action Buttons Section */}
        {groupWorkout.status === 'scheduled' && (
          <View style={styles.section}>
            <ActionButtons
              groupWorkout={groupWorkout}
              colors={COLORS}
              onCancelPress={() => setShowConfirmCancelModal(true)}
              onCompletePress={() => setShowConfirmCompleteModal(true)}
              onLeavePress={() => setShowConfirmLeaveModal(true)}
              onJoinPress={refreshData}
              isCreator={groupWorkout.is_creator}
            />
          </View>
        )}
        
        {/* Bottom spacing for better UX */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* All Modals */}
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

      {/* Select Workout Template Modal for proposing */}
      <SelectWorkoutModal
        visible={showSelectWorkoutModal}
        onClose={() => setShowSelectWorkoutModal(false)}
        workoutTemplates={userWorkoutTemplates || []}
        colors={COLORS}
        onSelect={handleSubmitWorkoutTemplate}
        forProposal={true}
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
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 16,
  },
  workoutCardContainer: {
    marginHorizontal: 16,
    position: 'relative',
  },
  mostVotedBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  mostVotedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 20,
  },
  emptyTemplateContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTemplateContent: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTemplateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTemplateDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  addTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addTemplateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  votingHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
    marginBottom: 12,
  },
  votingActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectMostVotedIcon: {
    marginRight: 8,
    padding: 4,
  },
  votingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  votingButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  selectMostVotedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  selectMostVotedText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  }
});