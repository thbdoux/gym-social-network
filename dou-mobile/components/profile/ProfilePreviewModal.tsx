import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser, useFriends } from '../../hooks/query/useUserQuery';

// Types
interface UserData {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  training_level?: string;
  personality_type?: string;
  workout_count?: number;
  current_streak?: number;
  friend_count?: number;
  posts?: any[];
  preferred_gym?: number;
  preferred_gym_details?: {
    name: string;
    location: string;
  };
  current_program?: any;
}

interface Post {
  id: number;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  image?: string;
  post_type: string;
  workout_log_details?: any;
  program_details?: any;
}

interface ProfilePreviewModalProps {
  isVisible: boolean;
  onClose: () => void;
  userId: number;
  initialUserData?: UserData;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

const ProfilePreviewModal: React.FC<ProfilePreviewModalProps> = ({
  isVisible,
  onClose,
  userId,
  initialUserData,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'activity'>('overview');

  // Fetch user data
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useUser(userId, {
    enabled: isVisible && !!userId,
    initialData: initialUserData?.id === userId ? initialUserData : undefined,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Fetch friends data
  const {
    data: friends = [],
    isLoading: friendsLoading,
  } = useFriends({
    enabled: isVisible && !!userId && activeTab === 'overview',
  });

  // Combine loading states
  const isLoading = userLoading || (activeTab === 'overview' && friendsLoading);

  // Format text utilities
  const formatText = (text?: string): string => {
    if (!text) return '';
    return text
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get initials for avatar fallback
  const getInitials = (name?: string): string => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  // Get gym display text
  const getGymDisplay = (user?: UserData): string => {
    if (user?.preferred_gym_details && user?.preferred_gym_details?.name) {
      const gym = user.preferred_gym_details;
      return `${gym.name} - ${gym.location}`;
    }
    return 'No gym selected';
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header with close button */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          ) : userError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={40} color="#EF4444" />
              <Text style={styles.errorText}>Error loading profile</Text>
              <TouchableOpacity style={styles.retryButton} onPress={onClose}>
                <Text style={styles.retryButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.scrollView}>
              {/* Profile Header */}
              <View style={styles.profileHeader}>
                {userData?.avatar ? (
                  <Image
                    source={{ uri: userData.avatar }}
                    style={styles.profileAvatar}
                  />
                ) : (
                  <View style={styles.profileAvatarPlaceholder}>
                    <Text style={styles.profileAvatarText}>
                      {getInitials(userData?.username)}
                    </Text>
                  </View>
                )}

                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{userData?.username || 'User'}</Text>
                  <Text style={styles.profileEmail}>{userData?.email || ''}</Text>

                  <View style={styles.locationContainer}>
                    <Ionicons name="location" size={14} color="#9CA3AF" />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {getGymDisplay(userData)}
                    </Text>
                  </View>

                  <View style={styles.badgesContainer}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {formatText(userData?.training_level) || 'Beginner'}
                      </Text>
                    </View>
                    {userData?.personality_type && (
                      <View style={[styles.badge, styles.personalityBadge]}>
                        <Text style={styles.badgeText}>
                          {formatText(userData?.personality_type)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Stats Summary */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userData?.workout_count || 0}</Text>
                  <Text style={styles.statLabel}>Workouts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userData?.posts?.length || 0}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userData?.friend_count || 0}</Text>
                  <Text style={styles.statLabel}>Friends</Text>
                </View>
              </View>

              {/* Bio if available */}
              {userData?.bio && (
                <View style={styles.bioContainer}>
                  <Text style={styles.bioText}>{userData.bio}</Text>
                </View>
              )}

              {/* Tabs Navigation */}
              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === 'overview' && styles.activeTabButton,
                  ]}
                  onPress={() => setActiveTab('overview')}
                >
                  <Ionicons
                    name="grid-outline"
                    size={20}
                    color={activeTab === 'overview' ? '#3B82F6' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === 'overview' && styles.activeTabButtonText,
                    ]}
                  >
                    Overview
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === 'stats' && styles.activeTabButton,
                  ]}
                  onPress={() => setActiveTab('stats')}
                >
                  <Ionicons
                    name="stats-chart"
                    size={20}
                    color={activeTab === 'stats' ? '#3B82F6' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === 'stats' && styles.activeTabButtonText,
                    ]}
                  >
                    Stats
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === 'activity' && styles.activeTabButton,
                  ]}
                  onPress={() => setActiveTab('activity')}
                >
                  <Ionicons
                    name="pulse"
                    size={20}
                    color={activeTab === 'activity' ? '#3B82F6' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === 'activity' && styles.activeTabButtonText,
                    ]}
                  >
                    Activity
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab Content */}
              <View style={styles.tabContent}>
                {activeTab === 'overview' && (
                  <OverviewTab
                    userData={userData}
                    friends={friends}
                  />
                )}

                {activeTab === 'stats' && (
                  <StatsTab
                    userData={userData}
                  />
                )}

                {activeTab === 'activity' && (
                  <ActivityTab
                    userData={userData}
                  />
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ userData?: UserData; friends: any[] }> = ({ userData, friends }) => {
  const formatText = (text?: string): string => {
    if (!text) return '';
    return text
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <View style={styles.tabContentContainer}>
      {/* Current Program */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="barbell" size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Current Program</Text>
        </View>

        {userData?.current_program ? (
          <View style={styles.programCard}>
            <Text style={styles.programName}>{userData.current_program.name}</Text>
            <Text style={styles.programDescription} numberOfLines={2}>
              {userData.current_program.description || 'No description available'}
            </Text>
            <View style={styles.programMeta}>
              <View style={styles.programMetaItem}>
                <Ionicons name="calendar" size={14} color="#9CA3AF" />
                <Text style={styles.programMetaText}>
                  {userData.current_program.duration || 0} weeks
                </Text>
              </View>
              <View style={styles.programMetaItem}>
                <Ionicons name="fitness" size={14} color="#9CA3AF" />
                <Text style={styles.programMetaText}>
                  {userData.current_program.difficulty || 'Beginner'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="barbell-outline" size={40} color="#6B7280" />
            <Text style={styles.emptyStateText}>No active program</Text>
          </View>
        )}
      </View>

      {/* Friends */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="people" size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Friends</Text>
        </View>

        {friends.length > 0 ? (
          <View style={styles.friendsGrid}>
            {friends.slice(0, 6).map((friendData) => {
              const friend = friendData.friend || friendData;

              return (
                <View key={friend.id} style={styles.friendItem}>
                  {friend.avatar ? (
                    <Image
                      source={{ uri: friend.avatar }}
                      style={styles.friendAvatar}
                    />
                  ) : (
                    <View style={styles.friendAvatarPlaceholder}>
                      <Text style={styles.friendAvatarText}>
                        {friend.username?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.friendName} numberOfLines={1}>
                    {friend.username}
                  </Text>
                  <Text style={styles.friendLevel} numberOfLines={1}>
                    {formatText(friend.training_level || 'beginner')}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="people-outline" size={40} color="#6B7280" />
            <Text style={styles.emptyStateText}>No friends yet</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Stats Tab Component
const StatsTab: React.FC<{ userData?: UserData }> = ({ userData }) => {
  return (
    <View style={styles.tabContentContainer}>
      {/* Workout Stats */}
      <View style={styles.statsGridContainer}>
        <View style={styles.statCard}>
          <Ionicons name="barbell" size={24} color="#3B82F6" />
          <Text style={styles.statCardValue}>{userData?.workout_count || 0}</Text>
          <Text style={styles.statCardLabel}>Workouts</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color="#10B981" />
          <Text style={styles.statCardValue}>{userData?.current_streak || 0}</Text>
          <Text style={styles.statCardLabel}>Streak</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="heart" size={24} color="#EF4444" />
          <Text style={styles.statCardValue}>{userData?.friend_count || 0}</Text>
          <Text style={styles.statCardLabel}>Friends</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="chatbubbles" size={24} color="#F59E0B" />
          <Text style={styles.statCardValue}>{userData?.posts?.length || 0}</Text>
          <Text style={styles.statCardLabel}>Posts</Text>
        </View>
      </View>

      {/* Training History */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy" size={20} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Training History</Text>
        </View>

        <View style={styles.trainingHistoryList}>
          <View style={styles.trainingHistoryItem}>
            <Text style={styles.trainingHistoryLabel}>Current Streak</Text>
            <View style={styles.trainingHistoryValue}>
              <Ionicons name="calendar" size={16} color="#3B82F6" />
              <Text style={[styles.trainingHistoryValueText, { color: '#3B82F6' }]}>
                {userData?.current_streak || 0} days
              </Text>
            </View>
          </View>

          <View style={styles.trainingHistoryItem}>
            <Text style={styles.trainingHistoryLabel}>Weekly Average</Text>
            <View style={styles.trainingHistoryValue}>
              <Ionicons name="trending-up" size={16} color="#10B981" />
              <Text style={[styles.trainingHistoryValueText, { color: '#10B981' }]}>
                {userData?.workout_count ? Math.round((userData.workout_count / 30) * 7) : 0} workouts
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// Activity Tab Component
const ActivityTab: React.FC<{ userData?: UserData }> = ({ userData }) => {
  // Mock data for recent posts if not available
  const posts: Post[] = userData?.posts || [];

  return (
    <View style={styles.tabContentContainer}>
      <Text style={styles.activityTitle}>Recent Activity</Text>

      {posts.length > 0 ? (
        posts.slice(0, 3).map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.postHeaderLeft}>
                {userData?.avatar ? (
                  <Image
                    source={{ uri: userData.avatar }}
                    style={styles.postAvatar}
                  />
                ) : (
                  <View style={styles.postAvatarPlaceholder}>
                    <Text style={styles.postAvatarText}>
                      {userData?.username?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={styles.postUsername}>{userData?.username}</Text>
                  <Text style={styles.postDate}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              {post.post_type !== 'regular' && (
                <View style={styles.postTypeBadge}>
                  <Text style={styles.postTypeBadgeText}>
                    {post.post_type === 'workout_log' ? 'Workout' : post.post_type}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            {post.image && (
              <Image
                source={{ uri: post.image }}
                style={styles.postImage}
              />
            )}

            <View style={styles.postFooter}>
              <View style={styles.postStat}>
                <Ionicons name="heart" size={16} color="#EF4444" />
                <Text style={styles.postStatText}>{post.likes_count || 0}</Text>
              </View>
              <View style={styles.postStat}>
                <Ionicons name="chatbubble" size={16} color="#9CA3AF" />
                <Text style={styles.postStatText}>{post.comments_count || 0}</Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="document-text-outline" size={40} color="#6B7280" />
          <Text style={styles.emptyStateText}>No posts yet</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#111827',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: Platform.OS === 'ios' ? 50 : 10,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  profileHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#3B82F6',
  },
  profileAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  badge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  personalityBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  badgeText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
    marginHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  bioContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bioText: {
    fontSize: 16,
    color: '#D1D5DB',
    lineHeight: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTabButton: {
    borderColor: '#3B82F6',
  },
  tabButtonText: {
    color: '#9CA3AF',
    marginLeft: 8,
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#3B82F6',
  },
  tabContent: {
    flex: 1,
  },
  tabContentContainer: {
    padding: 16,
  },
  sectionContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  programCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  programName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  programDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  programMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  programMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    color: '#6B7280',
    marginTop: 8,
  },
  friendsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  friendItem: {
    width: '32%',
    alignItems: 'center',
    marginBottom: 16,
  },
  friendAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  friendAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  friendAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  friendName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  friendLevel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  statsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  statCardLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  trainingHistoryList: {
    marginTop: 8,
  },
  trainingHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  trainingHistoryLabel: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  trainingHistoryValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainingHistoryValueText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  postCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  postAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  postUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  postTypeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postTypeBadgeText: {
    fontSize: 12,
    color: '#3B82F6',
  },
  postContent: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 12,
    lineHeight: 24,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  postStatText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 4,
  },
});

export default ProfilePreviewModal;