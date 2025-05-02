// app/(app)/group-workout/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Image,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Custom hooks
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { 
  useGroupWorkout,
  useJoinGroupWorkout,
  useLeaveGroupWorkout,
  useCancelGroupWorkout,
  useCompleteGroupWorkout,
  useSendGroupWorkoutMessage,
  useInviteToGroupWorkout,
  useRespondToJoinRequest,
  useRemoveParticipant
} from '../../../hooks/query/useGroupWorkoutQuery';
import { useUsers } from '../../../hooks/query/useUserQuery';
// import { useCreateGroupWorkoutPost } from '../../../hooks/query/usePostQuery';

// Custom components
import WorkoutCard from '../../../components/workouts/WorkoutCard';
import { getAvatarUrl } from '../../../utils/imageUtils';

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
  
  // State
  const [messageInput, setMessageInput] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showConfirmCompleteModal, setShowConfirmCompleteModal] = useState(false);
  const [showConfirmLeaveModal, setShowConfirmLeaveModal] = useState(false);
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
  const [showSharePostModal, setShowSharePostModal] = useState(false);
  const [sharePostText, setSharePostText] = useState('');
  
  // Refs
  const messagesListRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Hooks
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: groupWorkout, isLoading, refetch } = useGroupWorkout(groupWorkoutId);
  const { data: users = [] } = useUsers();
  const { mutateAsync: joinGroupWorkout, isLoading: isJoining } = useJoinGroupWorkout();
  const { mutateAsync: leaveGroupWorkout, isLoading: isLeaving } = useLeaveGroupWorkout();
  const { mutateAsync: cancelGroupWorkout, isLoading: isCancelling } = useCancelGroupWorkout();
  const { mutateAsync: completeGroupWorkout, isLoading: isCompleting } = useCompleteGroupWorkout();
  const { mutateAsync: sendMessage, isLoading: isSendingMessage } = useSendGroupWorkoutMessage();
  const { mutateAsync: inviteToGroupWorkout, isLoading: isInviting } = useInviteToGroupWorkout();
  const { mutateAsync: respondToJoinRequest, isLoading: isRespondingToRequest } = useRespondToJoinRequest();
  const { mutateAsync: removeParticipant, isLoading: isRemovingParticipant } = useRemoveParticipant();
//   const { mutateAsync: createGroupWorkoutPost, isLoading: isCreatingPost } = useCreateGroupWorkoutPost();
  
  // Calculate countdown
  const getCountdown = (scheduledTime: string): { days: number, hours: number, minutes: number, text: string } => {
    const now = new Date();
    const workoutDate = new Date(scheduledTime);
    const diffTime = workoutDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    let text = '';
    if (diffTime < 0) {
      // Past event
      text = t('workout_passed');
    } else if (diffDays > 0) {
      text = diffDays === 1 ? 
        t('tomorrow_at', { time: workoutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }) :
        t('days_left', { count: diffDays });
    } else if (diffHours > 0) {
      text = t('hours_left', { count: diffHours });
    } else if (diffMinutes > 0) {
      text = t('minutes_left', { count: diffMinutes });
    } else {
      text = t('starting_now');
    }
    
    return { days: diffDays, hours: diffHours, minutes: diffMinutes, text };
  };
  
  // Format date
  const formatDate = (date: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(date).toLocaleDateString(undefined, options);
  };
  
  // Format message time
  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get status badge color
  const getStatusColor = (status: string): { bg: string, text: string } => {
    switch (status) {
      case 'scheduled':
        return { bg: '#10B981', text: '#FFFFFF' }; // Green
      case 'in_progress':
        return { bg: '#3B82F6', text: '#FFFFFF' }; // Blue
      case 'completed':
        return { bg: '#6B7280', text: '#FFFFFF' }; // Gray
      case 'cancelled':
        return { bg: '#EF4444', text: '#FFFFFF' }; // Red
      default:
        return { bg: '#6B7280', text: '#FFFFFF' }; // Default gray
    }
  };
  
  // Get privacy badge color
  const getPrivacyColor = (privacy: string): { bg: string, text: string } => {
    switch (privacy) {
      case 'public':
        return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10B981' }; // Green
      case 'upon-request':
        return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3B82F6' }; // Blue
      case 'private':
        return { bg: 'rgba(107, 114, 128, 0.2)', text: '#6B7280' }; // Gray
      default:
        return { bg: 'rgba(107, 114, 128, 0.2)', text: '#6B7280' }; // Default gray
    }
  };
  
  // Filter users for invite modal
  const filteredUsers = users.filter(u => {
    // Don't show users who are already participants or the current user
    const isAlreadyParticipant = groupWorkout?.participants?.some(
      p => p.user_details.id === u.id
    );
    const isCurrentUser = u.id === user?.id;
    
    if (isAlreadyParticipant || isCurrentUser) return false;
    
    // Apply search filter
    if (searchQuery) {
      return u.username.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return true;
  });
  
  // Toggle user selection in invite modal
  const toggleUserSelection = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    try {
      await sendMessage({
        id: groupWorkoutId,
        content: messageInput
      });
      setMessageInput('');
      refetch();
      
      // Scroll to bottom after message sent
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd();
      }, 300);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert(t('error'), t('failed_to_send_message'));
    }
  };
  
  // Handle joining a group workout
  const handleJoin = async () => {
    try {
      if (groupWorkout?.privacy === 'upon-request') {
        await joinGroupWorkout({ 
          id: groupWorkoutId,
          message: joinMessage 
        });
        setJoinMessage('');
      } else {
        await joinGroupWorkout({ id: groupWorkoutId });
      }
      refetch();
    } catch (error) {
      console.error('Failed to join group workout:', error);
      Alert.alert(t('error'), t('failed_to_join_workout'));
    }
  };
  
  // Handle leaving a group workout
  const handleLeave = async () => {
    try {
      await leaveGroupWorkout(groupWorkoutId);
      setShowConfirmLeaveModal(false);
      refetch();
    } catch (error) {
      console.error('Failed to leave group workout:', error);
      Alert.alert(t('error'), t('failed_to_leave_workout'));
    }
  };
  
  // Handle cancelling a group workout
  const handleCancel = async () => {
    try {
      await cancelGroupWorkout(groupWorkoutId);
      setShowConfirmCancelModal(false);
      refetch();
    } catch (error) {
      console.error('Failed to cancel group workout:', error);
      Alert.alert(t('error'), t('failed_to_cancel_workout'));
    }
  };
  
  // Handle completing a group workout
  const handleComplete = async () => {
    try {
      await completeGroupWorkout(groupWorkoutId);
      setShowConfirmCompleteModal(false);
      refetch();
    } catch (error) {
      console.error('Failed to complete group workout:', error);
      Alert.alert(t('error'), t('failed_to_complete_workout'));
    }
  };
  
  // Handle inviting users
  const handleInviteUsers = async () => {
    if (selectedUsers.length === 0) {
      setShowInviteModal(false);
      return;
    }
    
    try {
      await inviteToGroupWorkout({
        id: groupWorkoutId,
        userIds: selectedUsers
      });
      setSelectedUsers([]);
      setShowInviteModal(false);
      refetch();
    } catch (error) {
      console.error('Failed to invite users:', error);
      Alert.alert(t('error'), t('failed_to_invite_users'));
    }
  };
  
  // Handle responding to join requests
  const handleRespondToRequest = async (requestId: number, response: 'approve' | 'reject') => {
    try {
      await respondToJoinRequest({
        id: groupWorkoutId,
        requestId,
        response
      });
      refetch();
    } catch (error) {
      console.error('Failed to respond to join request:', error);
      Alert.alert(t('error'), t('failed_to_respond_to_request'));
    }
  };
  
  // Handle removing a participant
  const handleRemoveParticipant = async (userId: number) => {
    try {
      await removeParticipant({
        id: groupWorkoutId,
        userId
      });
      refetch();
    } catch (error) {
      console.error('Failed to remove participant:', error);
      Alert.alert(t('error'), t('failed_to_remove_participant'));
    }
  };
  
  // Handle sharing post
  const handleSharePost = async () => {
    try {
    //   await createGroupWorkoutPost({
    //     groupWorkoutId,
    //     content: sharePostText
    //   });
      setSharePostText('');
      setShowSharePostModal(false);
      Alert.alert(t('success'), t('post_shared_successfully'));
    } catch (error) {
      console.error('Failed to share post:', error);
      Alert.alert(t('error'), t('failed_to_share_post'));
    }
  };
  
  // Check if current user is a participant
  const isParticipant = (): boolean => {
    return groupWorkout?.participants?.some(
      p => p.user_details.id === user?.id && p.status === 'joined'
    ) || false;
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (groupWorkout?.messages?.length) {
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [groupWorkout?.messages]);
  
  // Count pending join requests
  const pendingRequestsCount = groupWorkout?.join_requests?.filter(
    r => r.status === 'pending'
  ).length || 0;
  
  // Countdown data
  const countdown = groupWorkout ? getCountdown(groupWorkout.scheduled_time) : { days: 0, hours: 0, minutes: 0, text: '' };
  
  // Status colors
  const statusColors = groupWorkout ? getStatusColor(groupWorkout.status) : { bg: '#6B7280', text: '#FFFFFF' };
  const privacyColors = groupWorkout ? getPrivacyColor(groupWorkout.privacy) : { bg: 'rgba(107, 114, 128, 0.2)', text: '#6B7280' };
  
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
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerControls}>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              {/* Share Post Button */}
              <TouchableOpacity 
                style={[styles.headerAction, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}
                onPress={() => setShowSharePostModal(true)}
              >
                <Ionicons name="share-social-outline" size={22} color={COLORS.text.primary} />
              </TouchableOpacity>
              
              {/* Only show join requests button for the creator */}
              {groupWorkout.is_creator && pendingRequestsCount > 0 && (
                <TouchableOpacity 
                  style={[styles.headerAction, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}
                  onPress={() => setShowJoinRequestsModal(true)}
                >
                  <View style={styles.badgeContainer}>
                    <Ionicons name="person-add-outline" size={22} color={COLORS.text.primary} />
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>{pendingRequestsCount}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              
              {/* Invite Button - only for creator or participants */}
              {(groupWorkout.is_creator || isParticipant()) && (
                <TouchableOpacity 
                  style={[styles.headerAction, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}
                  onPress={() => setShowInviteModal(true)}
                >
                  <Ionicons name="person-add" size={22} color={COLORS.text.primary} />
                </TouchableOpacity>
              )}
              
              {/* Participants Button */}
              <TouchableOpacity 
                style={[styles.headerAction, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}
                onPress={() => setShowParticipants(true)}
              >
                <Ionicons name="people" size={22} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Title and Status */}
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: COLORS.text.primary }]} numberOfLines={2}>
              {groupWorkout.title}
            </Text>
            
            <View style={styles.headerBadges}>
              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                  {t(groupWorkout.status)}
                </Text>
              </View>
              
              {/* Privacy Badge */}
              <View style={[styles.privacyBadge, { backgroundColor: privacyColors.bg }]}>
                <Text style={[styles.privacyBadgeText, { color: privacyColors.text }]}>
                  {t(groupWorkout.privacy)}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Countdown */}
          {groupWorkout.status === 'scheduled' && (
            <View style={styles.countdownContainer}>
              <Text style={[styles.countdownText, { color: COLORS.text.primary }]}>
                <Ionicons name="time-outline" size={16} /> {countdown.text}
              </Text>
            </View>
          )}
          
          {/* Creator Info */}
          <View style={styles.creatorContainer}>
            <Text style={[styles.creatorText, { color: COLORS.text.secondary }]}>
              {t('created_by')} {groupWorkout.creator_details.username}
            </Text>
          </View>
        </LinearGradient>
      </View>
      
      {/* Main Content */}
      <View style={styles.contentContainer}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          {/* Top Info Section */}
          <View style={[styles.infoSection, { backgroundColor: 'rgba(31, 41, 55, 0.7)' }]}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.text.primary} />
              <Text style={[styles.infoText, { color: COLORS.text.primary }]}>
                {formatDate(groupWorkout.scheduled_time)}
              </Text>
            </View>
            
            {groupWorkout.gym_details && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={COLORS.text.primary} />
                <Text style={[styles.infoText, { color: COLORS.text.primary }]}>
                  {groupWorkout.gym_details.name} - {groupWorkout.gym_details.location}
                </Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={20} color={COLORS.text.primary} />
              <Text style={[styles.infoText, { color: COLORS.text.primary }]}>
                {t('participants')}: {groupWorkout.participants_count}
                {groupWorkout.max_participants > 0 ? '/' + groupWorkout.max_participants : ''}
              </Text>
            </View>
            
            {groupWorkout.description && (
              <View style={styles.descriptionContainer}>
                <Text style={[styles.descriptionLabel, { color: COLORS.text.secondary }]}>
                  {t('description')}
                </Text>
                <Text style={[styles.descriptionText, { color: COLORS.text.primary }]}>
                  {groupWorkout.description}
                </Text>
              </View>
            )}
          </View>
          
          {/* Workout Template Section */}
          {groupWorkout.workout_template_details && (
            <View style={styles.templateSection}>
              <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>
                {t('workout_plan')}
              </Text>
              
              <WorkoutCard
                workoutId={groupWorkout.workout_template}
                workout={groupWorkout.workout_template_details}
                isTemplate={true}
                user={user?.username}
              />
            </View>
          )}
          
          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            {/* Different buttons based on user status and workout status */}
            {groupWorkout.status === 'scheduled' && (
              <View style={styles.actionButtonsContainer}>
                {/* Creator Actions */}
                {groupWorkout.is_creator && (
                  <View style={styles.creatorActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: COLORS.danger }]}
                      onPress={() => setShowConfirmCancelModal(true)}
                    >
                      <Text style={styles.actionButtonText}>{t('cancel_workout')}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: COLORS.success }]}
                      onPress={() => setShowConfirmCompleteModal(true)}
                    >
                      <Text style={styles.actionButtonText}>{t('complete_workout')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Participant Actions */}
                {!groupWorkout.is_creator && (
                  <View style={styles.participantActions}>
                    {groupWorkout.current_user_status === 'joined' && (
                      <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: COLORS.danger }]}
                        onPress={() => setShowConfirmLeaveModal(true)}
                      >
                        <Text style={styles.actionButtonText}>{t('leave_workout')}</Text>
                      </TouchableOpacity>
                    )}
                    
                    {groupWorkout.current_user_status === 'invited' && (
                      <View style={styles.inviteResponseButtons}>
                        <TouchableOpacity 
                          style={[styles.actionButton, { backgroundColor: COLORS.danger }]}
                          onPress={() => handleLeave()}
                        >
                          <Text style={styles.actionButtonText}>{t('decline')}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.actionButton, { backgroundColor: COLORS.success }]}
                          onPress={() => handleJoin()}
                        >
                          <Text style={styles.actionButtonText}>{t('accept')}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {groupWorkout.current_user_status === 'not_participating' && (
                      <>
                        {groupWorkout.privacy === 'public' && !groupWorkout.is_full && (
                          <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: COLORS.success }]}
                            onPress={() => handleJoin()}
                            disabled={isJoining}
                          >
                            {isJoining ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <Text style={styles.actionButtonText}>{t('join_workout')}</Text>
                            )}
                          </TouchableOpacity>
                        )}
                        
                        {groupWorkout.privacy === 'upon-request' && !groupWorkout.is_full && (
                          <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
                            onPress={() => {
                              Alert.prompt(
                                t('request_to_join'),
                                t('join_request_message'),
                                [
                                  { text: t('cancel'), style: 'cancel' },
                                  { 
                                    text: t('send'),
                                    onPress: (message) => {
                                      setJoinMessage(message || '');
                                      handleJoin();
                                    }
                                  }
                                ]
                              );
                            }}
                            disabled={isJoining}
                          >
                            {isJoining ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <Text style={styles.actionButtonText}>{t('request_to_join')}</Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                    
                    {groupWorkout.current_user_status === 'request_pending' && (
                      <View style={[styles.pendingRequestBadge, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                        <Text style={{ color: '#3B82F6' }}>{t('join_request_pending')}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
          
          {/* Group Chat Section */}
          <View style={styles.chatSection}>
            <View style={styles.chatHeader}>
              <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>
                {t('group_chat')}
              </Text>
            </View>
            
            {/* Messages */}
            <View style={[styles.messagesContainer, { backgroundColor: 'rgba(31, 41, 55, 0.3)' }]}>
              {groupWorkout.messages && groupWorkout.messages.length > 0 ? (
                <FlatList
                  ref={messagesListRef}
                  data={groupWorkout.messages}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <View style={[
                      styles.messageContainer,
                      item.user === user?.id ? styles.myMessage : styles.otherMessage
                    ]}>
                      {item.user !== user?.id && (
                        <Image
                          source={{ uri: getAvatarUrl(item.user_details.avatar) }}
                          style={styles.messageAvatar}
                        />
                      )}
                      
                      <View style={[
                        styles.messageBubble,
                        item.user === user?.id ? 
                          [styles.myMessageBubble, { backgroundColor: '#10B981' }] : 
                          [styles.otherMessageBubble, { backgroundColor: '#3B82F6' }]
                      ]}>
                        {item.user !== user?.id && (
                          <Text style={styles.messageSender}>
                            {item.user_details.username}
                          </Text>
                        )}
                        
                        <Text style={styles.messageText}>
                          {item.content}
                        </Text>
                        
                        <Text style={styles.messageTime}>
                          {formatMessageTime(item.created_at)}
                        </Text>
                      </View>
                    </View>
                  )}
                  contentContainerStyle={styles.messagesList}
                />
              ) : (
                <View style={styles.noMessagesContainer}>
                  <Text style={[styles.noMessagesText, { color: COLORS.text.secondary }]}>
                    {t('no_messages_yet')}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Message Input */}
            {(groupWorkout.status === 'scheduled' || groupWorkout.status === 'in_progress') && 
             (groupWorkout.is_creator || isParticipant()) && (
              <View style={styles.messageInputContainer}>
                <TextInput
                  style={[styles.messageInput, { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: COLORS.text.primary }]}
                  placeholder={t('type_message')}
                  placeholderTextColor={COLORS.text.tertiary}
                  value={messageInput}
                  onChangeText={setMessageInput}
                  returnKeyType="send"
                  onSubmitEditing={handleSendMessage}
                />
                
                <TouchableOpacity 
                  style={[styles.sendButton, { backgroundColor: messageInput.trim() ? COLORS.success : 'rgba(107, 114, 128, 0.2)' }]}
                  onPress={handleSendMessage}
                  disabled={!messageInput.trim() || isSendingMessage}
                >
                  {isSendingMessage ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="send" size={18} color={messageInput.trim() ? '#FFFFFF' : '#6B7280'} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
      
      {/* Participants Modal */}
      <Modal
        visible={showParticipants}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowParticipants(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.text.primary }]}>
                {t('participants')} ({groupWorkout.participants_count})
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowParticipants(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={groupWorkout.participants}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={[styles.participantItem, { borderBottomColor: 'rgba(75, 85, 99, 0.2)' }]}>
                  <View style={styles.participantInfo}>
                    <Image
                      source={{ uri: getAvatarUrl(item.user_details.avatar) }}
                      style={styles.participantAvatar}
                    />
                    
                    <View style={styles.participantDetails}>
                      <Text style={[styles.participantName, { color: COLORS.text.primary }]}>
                        {item.user_details.username}
                      </Text>
                      
                      <Text style={[styles.participantStatus, { color: COLORS.text.secondary }]}>
                        {item.status === 'joined' ? t('participating') : t(item.status)}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Remove button - only for creator and only for other participants */}
                  {groupWorkout.is_creator && item.user_details.id !== user?.id && item.status === 'joined' && (
                    <TouchableOpacity
                      style={[styles.removeButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}
                      onPress={() => {
                        Alert.alert(
                          t('remove_participant'),
                          t('confirm_remove_participant', { username: item.user_details.username }),
                          [
                            { text: t('cancel'), style: 'cancel' },
                            { 
                              text: t('remove'), 
                              style: 'destructive',
                              onPress: () => handleRemoveParticipant(item.user_details.id)
                            }
                          ]
                        );
                      }}
                    >
                      <Text style={{ color: '#EF4444' }}>{t('remove')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
      
      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowInviteModal(false);
          setSelectedUsers([]);
          setSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.text.primary }]}>
                {t('invite_users')}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowInviteModal(false);
                  setSelectedUsers([]);
                  setSearchQuery('');
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.searchContainer, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <Ionicons name="search" size={20} color={COLORS.text.tertiary} />
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: COLORS.text.primary }]}
                placeholder={t('search_users')}
                placeholderTextColor={COLORS.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
            
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.userItem,
                    { borderBottomColor: 'rgba(75, 85, 99, 0.2)' },
                    selectedUsers.includes(item.id) && { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                  ]}
                  onPress={() => toggleUserSelection(item.id)}
                >
                  <View style={styles.userInfo}>
                    <Image
                      source={{ uri: getAvatarUrl(item.avatar) }}
                      style={styles.userAvatar}
                    />
                    
                    <Text style={[styles.userName, { color: COLORS.text.primary }]}>
                      {item.username}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.checkbox,
                    selectedUsers.includes(item.id) && [styles.checkboxSelected, { backgroundColor: COLORS.success }]
                  ]}>
                    {selectedUsers.includes(item.id) && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Text style={[styles.emptyListText, { color: COLORS.text.secondary }]}>
                    {searchQuery.length > 0 ? t('no_users_found') : t('no_users_to_invite')}
                  </Text>
                </View>
              }
            />
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}
                onPress={() => {
                  setShowInviteModal(false);
                  setSelectedUsers([]);
                  setSearchQuery('');
                }}
              >
                <Text style={{ color: '#EF4444' }}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.inviteButton,
                  selectedUsers.length > 0 ? 
                    { backgroundColor: COLORS.success } : 
                    { backgroundColor: 'rgba(107, 114, 128, 0.2)' }
                ]}
                onPress={handleInviteUsers}
                disabled={selectedUsers.length === 0 || isInviting}
              >
                {isInviting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ 
                    color: selectedUsers.length > 0 ? '#FFFFFF' : '#6B7280',
                    fontWeight: 'bold'
                  }}>
                    {t('invite_selected', { count: selectedUsers.length })}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Join Requests Modal */}
      <Modal
        visible={showJoinRequestsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowJoinRequestsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.text.primary }]}>
                {t('join_requests')} ({pendingRequestsCount})
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowJoinRequestsModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={groupWorkout.join_requests.filter(r => r.status === 'pending')}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={[styles.requestItem, { borderBottomColor: 'rgba(75, 85, 99, 0.2)' }]}>
                  <View style={styles.requestInfo}>
                    <Image
                      source={{ uri: getAvatarUrl(item.user_details.avatar) }}
                      style={styles.requestAvatar}
                    />
                    
                    <View style={styles.requestDetails}>
                      <Text style={[styles.requestName, { color: COLORS.text.primary }]}>
                        {item.user_details.username}
                      </Text>
                      
                      {item.message && (
                        <Text style={[styles.requestMessage, { color: COLORS.text.secondary }]}>
                          "{item.message}"
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.rejectButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}
                      onPress={() => handleRespondToRequest(item.id, 'reject')}
                      disabled={isRespondingToRequest}
                    >
                      <Text style={{ color: '#EF4444' }}>{t('reject')}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.approveButton, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}
                      onPress={() => handleRespondToRequest(item.id, 'approve')}
                      disabled={isRespondingToRequest}
                    >
                      <Text style={{ color: '#10B981' }}>{t('approve')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Text style={[styles.emptyListText, { color: COLORS.text.secondary }]}>
                    {t('no_pending_requests')}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
      
      {/* Confirm Complete Modal */}
      <Modal
        visible={showConfirmCompleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmModalContent, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
            <Text style={[styles.confirmTitle, { color: COLORS.text.primary }]}>
              {t('complete_workout')}
            </Text>
            
            <Text style={[styles.confirmText, { color: COLORS.text.secondary }]}>
              {t('complete_workout_confirmation')}
            </Text>
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: 'rgba(107, 114, 128, 0.2)' }]}
                onPress={() => setShowConfirmCompleteModal(false)}
              >
                <Text style={{ color: COLORS.text.primary }}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: COLORS.success }]}
                onPress={handleComplete}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{t('complete')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Confirm Leave Modal */}
      <Modal
        visible={showConfirmLeaveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmLeaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmModalContent, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
            <Text style={[styles.confirmTitle, { color: COLORS.text.primary }]}>
              {t('leave_workout')}
            </Text>
            
            <Text style={[styles.confirmText, { color: COLORS.text.secondary }]}>
              {t('leave_workout_confirmation')}
            </Text>
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: 'rgba(107, 114, 128, 0.2)' }]}
                onPress={() => setShowConfirmLeaveModal(false)}
              >
                <Text style={{ color: COLORS.text.primary }}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: COLORS.danger }]}
                onPress={handleLeave}
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{t('leave')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Confirm Cancel Modal */}
      <Modal
        visible={showConfirmCancelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmModalContent, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
            <Text style={[styles.confirmTitle, { color: COLORS.text.primary }]}>
              {t('cancel_workout')}
            </Text>
            
            <Text style={[styles.confirmText, { color: COLORS.text.secondary }]}>
              {t('cancel_workout_confirmation')}
            </Text>
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: 'rgba(107, 114, 128, 0.2)' }]}
                onPress={() => setShowConfirmCancelModal(false)}
              >
                <Text style={{ color: COLORS.text.primary }}>{t('no')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: COLORS.danger }]}
                onPress={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{t('yes_cancel')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Share Post Modal */}
      <Modal
        visible={showSharePostModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSharePostModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.text.primary }]}>
                {t('share_workout')}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowSharePostModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sharePostContainer}>
              <TextInput
                style={[styles.sharePostInput, { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: COLORS.text.primary }]}
                placeholder={t('share_post_placeholder')}
                placeholderTextColor={COLORS.text.tertiary}
                value={sharePostText}
                onChangeText={setSharePostText}
                multiline
                numberOfLines={4}
              />
              
              <View style={styles.sharePreview}>
                <Text style={[styles.sharePreviewLabel, { color: COLORS.text.secondary }]}>
                  {t('sharing')}:
                </Text>
                <Text style={[styles.sharePreviewText, { color: COLORS.text.primary }]}>
                  {groupWorkout.title} - {formatDate(groupWorkout.scheduled_time)}
                </Text>
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}
                onPress={() => {
                  setShowSharePostModal(false);
                  setSharePostText('');
                }}
              >
                <Text style={{ color: '#EF4444' }}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.shareButton, { backgroundColor: COLORS.highlight }]}
                onPress={handleSharePost}
                // disabled={isCreatingPost}
              >
                {/* {isCreatingPost ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{t('share')}</Text>
                )} */}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Header
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  headerGradient: {
    padding: 16,
    paddingBottom: 12,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginLeft: 8,
  },
  badgeContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  headerBadges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  privacyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  privacyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  countdownContainer: {
    marginBottom: 8,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: '600',
  },
  creatorContainer: {
    marginBottom: 4,
  },
  creatorText: {
    fontSize: 14,
  },
  
  // Content
  contentContainer: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  infoSection: {
    margin: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 10,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  templateSection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionsSection: {
    padding: 16,
    paddingTop: 0,
  },
  actionButtonsContainer: {
    marginBottom: 16,
  },
  creatorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  participantActions: {
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 120,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  inviteResponseButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  pendingRequestBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  // Chat Section
  chatSection: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  messagesContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
  },
  myMessageBubble: {
    borderTopRightRadius: 4,
  },
  otherMessageBubble: {
    borderTopLeftRadius: 4,
  },
  messageSender: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 4,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  noMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noMessagesText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  messageInput: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(75, 85, 99, 0.2)',
  },
  
  // Participant List Styles
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  participantStatus: {
    fontSize: 14,
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  
  // Invite Users Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    marginTop: 0,
    marginBottom: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  clearSearchButton: {
    padding: 4,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(107, 114, 128, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: 'transparent',
  },
  emptyListContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyListText: {
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Join Requests Styles
  requestItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  requestInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  requestDetails: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  requestMessage: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  rejectButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  approveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  
  // Confirm Modal Styles
  confirmModalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  },
  
  // Share Post Modal Styles
  sharePostContainer: {
    padding: 16,
  },
  sharePostInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  sharePreview: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
  },
  sharePreviewLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  sharePreviewText: {
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});