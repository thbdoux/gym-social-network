// app/(app)/group-workout-voting/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
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
  useVoteForProposal,
  useRemoveVote,
  useProposeWorkout
} from '../../../hooks/query/useGroupWorkoutQuery';
import { useWorkoutTemplates } from '../../../hooks/query/useWorkoutQuery';

// Components
import WorkoutCard from '../../../components/workouts/WorkoutCard';
import SelectWorkoutModal from '../group-workout/modals/SelectWorkoutModal';

export default function GroupWorkoutVotingScreen() {
  // Get group workout ID from route params
  const params = useLocalSearchParams();
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
  
  // Theme and styles
  const { groupWorkoutPalette, palette } = useTheme();
  
  const COLORS = {
    primary: groupWorkoutPalette.background,
    secondary: groupWorkoutPalette.highlight,
    tertiary: groupWorkoutPalette.border,
    background: palette.page_background,
    card: "rgba(31, 41, 55, 0.4)",
    text: {
      primary: groupWorkoutPalette.text,
      secondary: groupWorkoutPalette.text_secondary,
      tertiary: "rgba(255, 255, 255, 0.6)"
    },
    border: groupWorkoutPalette.border,
    success: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
    highlight: groupWorkoutPalette.highlight,
    gradientStart: "#f59e0b",
    gradientEnd: "#d97706"
  };
  
  // State
  const [showSelectWorkoutModal, setShowSelectWorkoutModal] = useState(false);
  
  // Hooks
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: groupWorkout, isLoading: isLoadingWorkout } = useGroupWorkout(groupWorkoutId);
  const { 
    data: proposals, 
    isLoading: isLoadingProposals, 
    refetch: refetchProposals 
  } = useGroupWorkoutProposals(groupWorkoutId);
  const { data: userWorkoutTemplates } = useWorkoutTemplates();
  
  // Mutations
  const voteForProposal = useVoteForProposal();
  const removeVote = useRemoveVote();
  const proposeWorkout = useProposeWorkout();
  
  // Computed properties
  const isLoading = isLoadingWorkout || isLoadingProposals;
  
  // Check if current user is a participant
  const isParticipant = (): boolean => {
    if (!groupWorkout || !groupWorkout.participants) return false;
    
    return groupWorkout.participants.some(
      p => p.user === user?.id && p.status === 'joined'
    ) || false;
  };
  
  // Handle voting for a proposal
  const handleVote = async (proposalId: number) => {
    try {
      await voteForProposal.mutateAsync({ 
        groupWorkoutId, 
        proposalId 
      });
      refetchProposals();
    } catch (error) {
      console.error('Failed to vote for proposal:', error);
      Alert.alert(t('error'), t('failed_to_vote'));
    }
  };
  
  // Handle removing a vote
  const handleRemoveVote = async (proposalId: number) => {
    try {
      await removeVote.mutateAsync({ 
        groupWorkoutId, 
        proposalId 
      });
      refetchProposals();
    } catch (error) {
      console.error('Failed to remove vote:', error);
      Alert.alert(t('error'), t('failed_to_remove_vote'));
    }
  };
  
  // Handle proposing a workout
  const handleProposeWorkout = async (workoutTemplateId: number) => {
    try {
      await proposeWorkout.mutateAsync({
        groupWorkoutId,
        workoutTemplateId
      });
      refetchProposals();
      setShowSelectWorkoutModal(false);
      Alert.alert(t('success'), t('workout_proposal_submitted'));
    } catch (error) {
      console.error('Failed to propose workout:', error);
      Alert.alert(t('error'), t('failed_to_submit_proposal'));
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
  
  // Treat undefined proposals as an empty array
  const proposalsList = proposals || [];
  
  // Render a proposal item
  const renderProposalItem = ({ item }) => {
    const hasVoted = item.has_voted;
    const isTopVoted = proposals && proposals.length > 0 && item.vote_count === proposals[0].vote_count;
    
    return (
      <View style={[styles.proposalItem, { borderColor: COLORS.border }]}>
        {/* Proposer info with vote badge */}
        <View style={styles.proposedByContainer}>
          <Text style={[styles.proposedByText, { color: COLORS.text.secondary }]}>
            {t('proposed_by')} {item.proposed_by_details.username}
          </Text>
          
          {/* Vote badge */}
          <View style={[styles.voteBadge, { backgroundColor: isTopVoted ? COLORS.success : COLORS.card }]}>
            <Text style={[styles.voteCount, { color: isTopVoted ? '#FFFFFF' : COLORS.text.primary }]}>
              {item.vote_count}
            </Text>
            <Text style={[styles.voteText, { color: isTopVoted ? '#FFFFFF' : COLORS.text.secondary }]}>
              {item.vote_count === 1 ? t('vote') : t('votes')}
            </Text>
            
            {isTopVoted && (
              <Ionicons name="trophy" size={16} color="#FFFFFF" />
            )}
          </View>
        </View>
        
        {/* Workout card */}
        <View style={styles.workoutCardContainer}>
          <WorkoutCard
            workoutId={item.workout_template}
            workout={item.workout_template_details}
            isTemplate={true}
            user={user?.username}
          />
        </View>
        
        {/* Vote button */}
        {(groupWorkout.is_creator || isParticipant()) && (
          <TouchableOpacity
            style={[
              styles.voteButton,
              { backgroundColor: hasVoted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' }
            ]}
            onPress={() => hasVoted ? handleRemoveVote(item.id) : handleVote(item.id)}
          >
            {hasVoted ? (
              <>
                <Ionicons name="close-circle-outline" size={18} color={COLORS.danger} />
                <Text style={[styles.voteButtonText, { color: COLORS.danger }]}>
                  {t('remove_vote')}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="thumbs-up-outline" size={18} color={COLORS.success} />
                <Text style={[styles.voteButtonText, { color: COLORS.success }]}>
                  {t('vote')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: COLORS.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: COLORS.text.primary }]}>
          {t('workout_voting')}
        </Text>
        
        {/* Propose button */}
        {(groupWorkout.is_creator || isParticipant()) && groupWorkout.status === 'scheduled' && (
          <TouchableOpacity 
            style={[styles.proposeButton, { backgroundColor: COLORS.primary }]}
            onPress={() => setShowSelectWorkoutModal(true)}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={[styles.instructionsText, { color: COLORS.text.secondary }]}>
          {t('voting_instructions')}
        </Text>
      </View>
      
      {/* Proposals list */}
      <FlatList
        data={proposals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProposalItem}
        contentContainerStyle={styles.proposalsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={50} color={COLORS.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: COLORS.text.primary }]}>
              {t('no_proposals_yet')}
            </Text>
            <Text style={[styles.emptyText, { color: COLORS.text.secondary }]}>
              {t('be_first_to_propose')}
            </Text>
            
            {(groupWorkout.is_creator || isParticipant()) && groupWorkout.status === 'scheduled' && (
              <TouchableOpacity
                style={[styles.proposeActionButton, { backgroundColor: COLORS.primary }]}
                onPress={() => setShowSelectWorkoutModal(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.proposeActionButtonText}>
                  {t('propose_workout')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
      
      {/* Select Workout Modal */}
      <SelectWorkoutModal
        visible={showSelectWorkoutModal}
        onClose={() => setShowSelectWorkoutModal(false)}
        workoutTemplates={userWorkoutTemplates || []}
        colors={COLORS}
        onSelect={handleProposeWorkout}
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
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  proposeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  instructionsContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  proposalsList: {
    padding: 16,
    paddingTop: 8,
  },
  proposalItem: {
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  proposedByContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  proposedByText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  voteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  voteCount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  voteText: {
    fontSize: 12,
    marginRight: 4,
  },
  workoutCardContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    margin: 16,
    borderRadius: 12,
  },
  voteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  proposeActionButton: {
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
  proposeActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});