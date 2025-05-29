// app/(app)/user/[id].tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrentUser, useUser, useFriendshipStatus } from '../../../hooks/query/useUserQuery';
import { useGymDisplay } from '../../../hooks/query/useGymQuery';
import { useProgram } from '../../../hooks/query/useProgramQuery';
import { useUserLogs, useWorkoutStats } from '../../../hooks/query/useLogQuery';
import { useFriendsCount, usePostsCount, useWorkoutsCount } from '../../../hooks/query/useUserCountQuery';
import { useSendFriendRequest, useRespondToFriendRequest, useRemoveFriend } from '../../../hooks/query/useUserQuery';
import ProgramCard from '../../../components/workouts/ProgramCard';
import { getAvatarUrl } from '../../../utils/imageUtils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parse, subMonths, addMonths } from 'date-fns';
// Import ColorPalette type
import { ColorPalette, Personality, getColorPalette } from '../../../utils/colorConfig';
// Import the TrainingConsistencyChart component
import TrainingConsistencyChart from '../../../components/profile/TrainingConsistencyChart';

const screenWidth = Dimensions.get('window').width;

export default function ProfilePreviewPage() {
  // Get translation function
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const userId = typeof id === 'string' ? parseInt(id) : 0;
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [imageModalVisible, setImageModalVisible] = useState(false);
  
  // Fetch current user data for friend check - added refetch function
  const { 
    data: currentUser, 
    isLoading: currentUserLoading, 
    refetch: refetchCurrentUser 
  } = useCurrentUser();

  const {
    data: friendshipStatus = 'not_friends',
    isLoading: friendshipStatusLoading,
    refetch: refetchFriendshipStatus
  } = useFriendshipStatus(userId, {
    enabled: !!userId && !!currentUser && userId !== currentUser.id,
  });
  
  const navigateToUserFriends = () => {
    if (userId) {
      router.push(`/friends/${userId}`);
    }
  };
  
  // Fetch user data
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser
  } = useUser(userId, {
    enabled: !!userId,
    refetchOnMount: true,
    staleTime: 0,
  });
  
  // Create a custom palette based on the viewed user's personality
  const userPalette = useMemo(() => {
    if (!userData || !userData.personality_type) {
      // Default to versatile if no user data or personality type
      return getColorPalette('versatile');
    }
    
    // Check if the personality type is valid
    const personalityType = userData.personality_type.toLowerCase();
    if (['optimizer', 'versatile', 'diplomate', 'mentor'].includes(personalityType)) {
      return getColorPalette(personalityType as Personality);
    }
    
    // Fallback to versatile
    return getColorPalette('versatile');
  }, [userData]);
  
  // Get preferred gym info
  const {
    displayText: gymDisplayText,
    isLoading: gymLoading,
    gym
  } = useGymDisplay(userId, userData?.preferred_gym);
  
  // Get program data if available
  const {
    data: programData,
    isLoading: programLoading
  } = useProgram(userData?.current_program?.id, {
    enabled: !!userData?.current_program?.id
  });
  
  // Get logs for workout data
  const { data: logs, isLoading: logsLoading } = useUserLogs(userData?.username);

  // Get workout stats for chart data
  const { data: workoutStats, isLoading: statsLoading } = useWorkoutStats(userData?.username);
  
  const { data: friendsCount = 0, isLoading: friendsCountLoading } = useFriendsCount(userId);
  const { data: postsCount = 0, isLoading: postsCountLoading } = usePostsCount(userId);
  const { data: workoutsCount = 0, isLoading: workoutsCountLoading } = useWorkoutsCount(userId);

  // Friend management mutations
  const sendFriendRequest = useSendFriendRequest();
  const respondToFriendRequest = useRespondToFriendRequest();
  const removeFriend = useRemoveFriend();

  // Process logs data for the calendar
  const workoutDays = useMemo(() => {
    if (!logs) return [];
    
    return logs.map(log => {
      if (log.date) {
        try {
          // Parse French format date (DD/MM/YYYY)
          return parse(log.date, 'dd/MM/yyyy', new Date());
        } catch (error) {
          console.error("Error parsing date:", error);
          return null;
        }
      }
      return null;
    }).filter(date => date !== null);
  }, [logs]);
  
  // Process logs data for the chart by month
  const sessionData = useMemo(() => {
    if (!logs) return [];
    
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, 'MMM'),
        date,
        sessions: 0
      };
    });
    
    if (logs && logs.length > 0) {
      logs.forEach(log => {
        try {
          if (!log.date) return;
          
          // Parse French format date (DD/MM/YYYY)
          const logDate = parse(log.date, 'dd/MM/yyyy', new Date());
          
          const monthIndex = last6Months.findIndex(item => 
            format(item.date, 'MMM yyyy') === format(logDate, 'MMM yyyy')
          );
          
          if (monthIndex !== -1) {
            last6Months[monthIndex].sessions += 1;
          }
        } catch (error) {
          console.error("Error processing log date:", error, log.date);
        }
      });
    }
    
    return last6Months;
  }, [logs]);

  // Calendar functions
  const getDaysInMonth = (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  };

  const changeMonth = (direction) => {
    setCurrentMonth(prevMonth => {
      return direction === 'next' 
        ? addMonths(prevMonth, 1) 
        : subMonths(prevMonth, 1);
    });
  };

  const isWorkoutDay = (day) => {
    return workoutDays.some(date => date && isSameDay(day, date));
  };

  // Get personality-based gradient for avatar
  const getPersonalityGradient = () => {
    if (!userData || !userData.personality_type) {
      // Default gradient
      return [userPalette.highlight, userPalette.layout];
    }
    
    return [userPalette.layout, userPalette.highlight];
  };

  // Enhanced friendship action handlers that refresh both user data
  const handleSendFriendRequest = () => {
    if (!userData || !userId) return;
    
    Alert.alert(
      t('send_request_title'),
      t('send_request_message', { username: userData.username }),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('confirm'),
          onPress: () => {
            sendFriendRequest.mutate(userId, {
              onSuccess: () => {
                Alert.alert(t('request_sent'), t('request_sent_success'));
                // Refresh data including friendship status
                refetchUser();
                refetchCurrentUser();
                refetchFriendshipStatus();
              },
              onError: (error) => {
                console.error('Friend request error:', error);
                Alert.alert(t('error'), t('request_sent_error'));
              }
            });
          },
        },
      ]
    );
  };

  const handleAcceptFriendRequest = () => {
    if (!userData || !userId) return;
    
    respondToFriendRequest.mutate(
      { userId, response: 'accept' },
      {
        onSuccess: () => {
          Alert.alert(t('request_accepted'), t('now_friends', { username: userData.username }));
          // Refresh data including friendship status
          refetchUser();
          refetchCurrentUser();
          refetchFriendshipStatus();
        },
        onError: (error) => {
          console.error('Accept friend request error:', error);
          Alert.alert(t('error'), t('accept_request_error'));
        }
      }
    );
  };

  const handleRejectFriendRequest = () => {
    if (!userData || !userId) return;
    
    respondToFriendRequest.mutate(
      { userId, response: 'reject' },
      {
        onSuccess: () => {
          // Refresh data including friendship status
          refetchUser();
          refetchCurrentUser();
          refetchFriendshipStatus();
        },
        onError: (error) => {
          console.error('Reject friend request error:', error);
          Alert.alert(t('error'), t('reject_request_error'));
        }
      }
    );
  };

  const handleRemoveFriend = () => {
    if (!userData || !userId) return;
    
    Alert.alert(
      t('remove_friend_title'),
      t('remove_friend_message', { username: userData.username }),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('confirm'),
          onPress: () => {
            removeFriend.mutate(userId, {
              onSuccess: () => {
                Alert.alert(t('friend_removed'), t('friend_removed_success'));
                // Refresh data including friendship status
                refetchUser();
                refetchCurrentUser();
                refetchFriendshipStatus();
              },
              onError: (error) => {
                console.error('Remove friend error:', error);
                Alert.alert(t('error'), t('friend_removed_error'));
              }
            });
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchUser(), 
        refetchCurrentUser(),
        refetchFriendshipStatus()
      ]);
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Enhanced friendship status badge with more distinct styling
  const renderFriendshipStatus = () => {
    switch (friendshipStatus) {
      case "self":
        return null; // No need to show friendship status on own profile
      case "friends":
        return (
          <View style={[styles.friendshipBadge, { backgroundColor: `${userPalette.highlight}CC` }]}>
            <Ionicons name="people" size={16} color={userPalette.text} />
            <Text style={[styles.friendshipText, { color: userPalette.text }]}>{t('friends')}</Text>
          </View>
        );
      case "request_sent":
        return (
          <View style={[styles.friendshipBadge, styles.requestSentBadge, { backgroundColor: `${userPalette.accent}CC` }]}>
            <Ionicons name="time" size={16} color={userPalette.text} />
            <Text style={[styles.friendshipText, { color: userPalette.text }]}>{t('request_sent')}</Text>
          </View>
        );
      case "request_received":
        return (
          <View style={[styles.friendshipBadge, styles.requestReceivedBadge, { backgroundColor: `${userPalette.layout}CC` }]}>
            <Ionicons name="notifications" size={16} color={userPalette.text} />
            <Text style={[styles.friendshipText, { color: userPalette.text }]}>{t('request_received')}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  // Enhanced friendship action buttons with improved visuals
  const renderFriendshipAction = () => {
    if (currentUser?.username === userData?.username) return null;
    
    switch (friendshipStatus) {
      case "friends":
        return (
          <TouchableOpacity
            style={[styles.friendActionButton, styles.removeFriendButton, { borderColor: `${userPalette.highlight}4D` }]}
            onPress={handleRemoveFriend}
          >
            <Ionicons name="person-remove" size={20} color={userPalette.text} />
            <Text style={[styles.friendActionButtonText, { color: userPalette.text }]}>{t('remove_friend')}</Text>
          </TouchableOpacity>
        );
      case "request_sent":
        return (
          <TouchableOpacity
            style={[styles.friendActionButton, styles.pendingButton, { backgroundColor: `${userPalette.accent}80`, borderColor: `${userPalette.border}4D` }]}
            disabled={true}
          >
            <Ionicons name="time" size={20} color={userPalette.text} />
            <Text style={[styles.friendActionButtonText, { color: userPalette.text }]}>{t('pending_request')}</Text>
          </TouchableOpacity>
        );
      case "request_received":
        return (
          <View style={styles.requestActionContainer}>
            <TouchableOpacity
              style={[styles.requestActionButton, styles.acceptButton, { borderColor: `${userPalette.highlight}4D` }]}
              onPress={handleAcceptFriendRequest}
            >
              <Ionicons name="checkmark" size={20} color={userPalette.text} />
              <Text style={[styles.requestActionButtonText, { color: userPalette.text }]}>{t('accept')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.requestActionButton, styles.rejectButton, { borderColor: `${userPalette.border}4D` }]}
              onPress={handleRejectFriendRequest}
            >
              <Ionicons name="close" size={20} color={userPalette.text} />
              <Text style={[styles.requestActionButtonText, { color: userPalette.text }]}>{t('reject')}</Text>
            </TouchableOpacity>
          </View>
        );
      case "not_friends":
        return (
          <TouchableOpacity
            style={[styles.friendActionButton, styles.addFriendButton, { backgroundColor: userPalette.highlight, borderColor: `${userPalette.highlight}4D` }]}
            onPress={handleSendFriendRequest}
          >
            <Ionicons name="person-add" size={20} color={userPalette.text} />
            <Text style={[styles.friendActionButtonText, { color: userPalette.text }]}>{t('add_friend')}</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  // Combine loading states
  const isLoading = userLoading || currentUserLoading || friendshipStatusLoading ||
                 (userData?.preferred_gym && gymLoading) || 
                 (userData?.current_program?.id && programLoading) ||
                 logsLoading || statsLoading || 
                 friendsCountLoading || postsCountLoading || workoutsCountLoading;

  // Formatted gym info
  const gymInfo = gym ? `${gym.name}${gym.location ? ` - ${gym.location}` : ''}` : '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: userPalette.page_background }]}>
      <StatusBar barStyle="light-content" />

        {/* Image Modal */}
        <Modal
          visible={imageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setImageModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setImageModalVisible(false)}
              >
                <Ionicons name="close-circle" size={30} color={userPalette.text} />
              </TouchableOpacity>
              <Image
                source={{ uri: getAvatarUrl(userData?.avatar, 300) }}
                style={[styles.modalImage, { borderColor: userPalette.highlight }]}
                resizeMode="contain"
              />
            </View>
          </View>
        </Modal>
      
      {isLoading && !refreshing ? (
        <View style={[styles.loadingContainer, { backgroundColor: userPalette.page_background }]}>
          <ActivityIndicator size="large" color={userPalette.highlight} />
          <Text style={[styles.loadingText, { color: `${userPalette.text}80` }]}>{t('loading_profile')}</Text>
        </View>
      ) : userError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={40} color="#EF4444" />
          <Text style={[styles.errorText, { color: "#EF4444" }]}>{t('error')}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: userPalette.accent }]} 
            onPress={() => router.back()}
          >
            <Text style={[styles.retryButtonText, { color: userPalette.text }]}>{t('go_back')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={userPalette.highlight}
              colors={[userPalette.highlight]}
            />
          }
        >
          {/* Profile Header with Left-aligned Profile Picture */}
          <View style={styles.profileHeader}>
            <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
            
            <View style={styles.profileHeaderContent}>
              {/* Left side - Profile picture */}
              <TouchableOpacity 
                style={styles.profileImageContainer}
                onPress={() => setImageModalVisible(true)}
              >
                <LinearGradient
                  colors={getPersonalityGradient()}
                  style={styles.profileGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={[styles.profileImageInner, { backgroundColor: userPalette.page_background }]}>
                    <Image
                      source={{ uri: getAvatarUrl(userData?.avatar, 80) }}
                      style={styles.profileImage}
                    />
                  </View>
                </LinearGradient>
                <View style={[styles.onlineIndicator, { borderColor: userPalette.page_background }]}></View>
              </TouchableOpacity>
              
              {/* Right side - Profile info and stats */}
              <View style={styles.profileRightContent}>
                <View style={styles.profileInfo}>
                  <View style={styles.usernameContainer}>
                    <Text style={[styles.profileUsername, { color: userPalette.text }]}>{userData?.username || t('user')}</Text>
                    {renderFriendshipStatus()}
                  </View>
                  
                  <View style={styles.badgesContainer}>
                    {userData?.personality_type && (
                      <LinearGradient
                        colors={[userPalette.layout, userPalette.highlight]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.personalityBadge}
                      >
                        <Text style={[styles.personalityText, { color: userPalette.text }]}>
                          {t(userData.personality_type.toLowerCase())}
                        </Text>
                      </LinearGradient>
                    )}
                    
                    {userData?.preferred_gym && (
                      <LinearGradient
                        colors={[userPalette.accent, userPalette.highlight]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gymBadge}
                      >
                        <Text style={[styles.gymText, { color: userPalette.text }]}>
                          {gymInfo}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>
                </View>
              </View>
            </View>
            
            {/* Bio Section */}
            {userData?.bio && (
              <View style={styles.bioContainer}>
                <Text style={[styles.bioText, { color: `${userPalette.text}CC` }]}>
                  {userData.bio}
                </Text>
              </View>
            )}
            
            {/* Friendship action button */}
            {renderFriendshipAction()}
            
            {/* Stats row (below profile info) */}
            <View style={styles.statsRow}>
              <TouchableOpacity 
                style={[styles.statItem, { backgroundColor: `${userPalette.accent}80` }]} 
                onPress={navigateToUserFriends}
              >
                <Text style={[styles.statValue, { color: userPalette.text }]}>{friendsCount}</Text>
                <Text style={[styles.statLabel, { color: `${userPalette.text}B3` }]}>{t('friends')}</Text>
              </TouchableOpacity>

              <View style={[styles.statItem, { backgroundColor: `${userPalette.accent}80` }]}>
                <Text style={[styles.statValue, { color: userPalette.text }]}>{postsCount}</Text>
                <Text style={[styles.statLabel, { color: `${userPalette.text}B3` }]}>{t('posts')}</Text>
              </View>

              <View style={[styles.statItem, { backgroundColor: `${userPalette.accent}80` }]}>
                <Text style={[styles.statValue, { color: userPalette.text }]}>{workoutsCount}</Text>
                <Text style={[styles.statLabel, { color: `${userPalette.text}B3` }]}>{t('workouts')}</Text>
              </View>
            </View>

          </View>
          
          {/* Monthly Workout Calendar */}
          <View style={styles.calendarCard}>
            <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
            
            <View style={styles.calendarHeader}>
              <Text style={[styles.cardTitle, { color: userPalette.text }]}>{t('workout_calendar')}</Text>
              <View style={styles.monthSelectorContainer}>
                <TouchableOpacity 
                  onPress={() => changeMonth('prev')} 
                  style={[styles.monthButton, { backgroundColor: `${userPalette.accent}80` }]}
                >
                  <Ionicons name="chevron-back" size={24} color={userPalette.text} />
                </TouchableOpacity>
                <Text style={[styles.monthDisplay, { color: userPalette.text }]}>
                  {format(currentMonth, 'MMMM yyyy')}
                </Text>
                <TouchableOpacity 
                  onPress={() => changeMonth('next')} 
                  style={[styles.monthButton, { backgroundColor: `${userPalette.accent}80` }]}
                >
                  <Ionicons name="chevron-forward" size={24} color={userPalette.text} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.weekdaysHeader}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Text key={index} style={[styles.weekdayLabel, { color: `${userPalette.text}80` }]}>{day}</Text>
              ))}
            </View>
            
            <View style={styles.calendarGrid}>
              {getDaysInMonth(currentMonth).map((day, index) => {
                const isWorkout = isWorkoutDay(day);
                const isCurrent = isToday(day);
                
                return (
                  <TouchableOpacity 
                    key={index}
                    style={[
                      styles.calendarDay,
                      { backgroundColor: `${userPalette.accent}4D` },
                      isWorkout && [styles.workoutDay, { backgroundColor: `${userPalette.highlight}4D`, borderColor: `${userPalette.highlight}80` }],
                      isCurrent && [styles.currentDay, { backgroundColor: `${userPalette.highlight}4D`, borderColor: `${userPalette.highlight}B3` }]
                    ]}
                    onPress={() => {
                      if (isWorkout) {
                        Alert.alert('Workout', `${userData?.username} worked out on ${format(day, 'MMMM d, yyyy')}`);
                      }
                    }}
                  >
                    <Text 
                      style={[
                        styles.dayNumber,
                        { color: userPalette.text },
                        isWorkout && [styles.workoutDayNumber, { color: userPalette.text, fontWeight: 'bold' }],
                        isCurrent && [styles.currentDayNumber, { color: userPalette.text, fontWeight: 'bold' }]
                      ]}
                    >
                      {format(day, 'd')}
                    </Text>
                    
                    {isWorkout && (
                      <View style={[styles.workoutIndicator, { backgroundColor: userPalette.highlight }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: userPalette.highlight }]} />
                <Text style={[styles.legendText, { color: `${userPalette.text}80` }]}>{t('workout_day')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: userPalette.highlight }]} />
                <Text style={[styles.legendText, { color: `${userPalette.text}80` }]}>{t('today')}</Text>
              </View>
            </View>
          </View>
          
          {/* Training Consistency Chart - Using the new component */}
          <TrainingConsistencyChart sessionData={sessionData} palette={userPalette} />
          
          {/* Current Program */}
          <View style={styles.programContainer}>
            <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
            
            <Text style={[styles.cardTitle, { color: userPalette.text }]}>{t('current_program')}</Text>
            
            {userData?.current_program ? (
              <ProgramCard
                programId={userData.current_program.id}
                program={userData.current_program}
                currentUser={userData.username}
                themePalette={userPalette}
              />
            ) : (
              <View style={styles.emptyProgram}>
                <Ionicons name="barbell-outline" size={48} color={userPalette.border} />
                <Text style={[styles.emptyProgramText, { color: userPalette.border }]}>{t('no_active_program')}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  scrollContainer: {
    paddingHorizontal: 0,
    paddingBottom: 24,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontWeight: '500',
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
  },
  
  // Enhanced friendship styles
  friendshipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
  },
  requestSentBadge: {
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  requestReceivedBadge: {
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  friendshipText: {
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  friendActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  friendActionButtonText: {
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  addFriendButton: {
    borderWidth: 1,
  },
  removeFriendButton: {
    backgroundColor: '#EF4444', // Red
    borderWidth: 1,
  },
  pendingButton: {
    borderWidth: 1,
  },
  requestActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    gap: 12,
  },
  requestActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  requestActionButtonText: {
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
  acceptButton: {
    backgroundColor: '#10B981', // Green
    borderWidth: 1,
  },
  rejectButton: {
    backgroundColor: '#EF4444', // Red
    borderWidth: 1,
  },
  
  profileHeader: {
    position: 'relative',
    borderRadius: 0,
    padding: 16,
    marginBottom: 8,
    borderWidth: 0,
    overflow: 'hidden',
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 20,
  },
  profileGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageInner: {
    width: '100%',
    height: '100%',
    borderRadius: 42, 
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4ade80', // Green for online status
    borderWidth: 2,
  },
  profileRightContent: {
    flex: 1, // Take up remaining space
  },
  profileInfo: {
    alignItems: 'flex-start',
    marginBottom: 0,
    width: '100%',
  },
  usernameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  profileUsername: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  personalityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  personalityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gymBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gymText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Bio styles
  bioContainer: {
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'left',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '500',
    marginTop: 2,
  },
  
  // Calendar styles
  calendarCard: {
    position: 'relative',
    borderRadius: 0,
    padding: 16,
    marginVertical: 0,
    borderWidth: 0,
    overflow: 'hidden',
  },
  calendarHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  monthSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 8,
  },
  monthDisplay: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
    width: 150,
    textAlign: 'center',
  },
  monthButton: {
    padding: 5,
    borderRadius: 20,
  },
  weekdaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  weekdayLabel: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  calendarDay: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderRadius: 16,
    position: 'relative',
  },
  dayNumber: {
    fontSize: 14,
  },
  workoutDay: {
    borderWidth: 1,
  },
  workoutDayNumber: {
    fontWeight: 'bold',
  },
  currentDay: {
    borderWidth: 1,
  },
  currentDayNumber: {
    fontWeight: 'bold',
  },
  workoutIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
  
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  
  programContainer: {
    position: 'relative',
    borderRadius: 0,
    padding: 16,
    marginTop: 0,
    borderWidth: 0,
    overflow: 'hidden',
  },
  emptyProgram: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyProgramText: {
    fontSize: 16,
    marginVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  modalImage: {
    width: 300,
    height: 300,
    borderRadius: 20,
    borderWidth: 3,
  },
  closeButton: {
    position: 'absolute',
    top: -20,
    right: 20,
    zIndex: 10,
  },
});