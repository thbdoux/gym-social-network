// app/(app)/profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { userService, postService } from '../../api/services';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      const [userData, userFriends, userPosts] = await Promise.all([
        userService.getCurrentUser(),
        userService.getFriends(),
        user?.id ? userService.getUserById(user.id).then(data => data.posts || []) : [],
      ]);
      
      setProfile(userData);
      setFriends(userFriends || []);
      setPosts(userPosts || []);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {profile?.avatar ? (
            <Image
              source={{ uri: profile.avatar }}
              style={styles.profileAvatar}
            />
          ) : (
            <View style={styles.profileAvatarPlaceholder}>
              <Text style={styles.profileAvatarText}>
                {getInitials(profile?.username)}
              </Text>
            </View>
          )}
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.username || 'User'}</Text>
            <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
            
            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{posts.length || 0}</Text>
                <Text style={styles.profileStatLabel}>Posts</Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{friends.length || 0}</Text>
                <Text style={styles.profileStatLabel}>Friends</Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>
                  {profile?.training_level || 'Beginner'}
                </Text>
                <Text style={styles.profileStatLabel}>Level</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs Navigation */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'posts' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons
              name="grid-outline"
              size={20}
              color={activeTab === 'posts' ? '#3B82F6' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'posts' && styles.activeTabButtonText,
              ]}
            >
              Posts
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'friends' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('friends')}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={activeTab === 'friends' ? '#3B82F6' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'friends' && styles.activeTabButtonText,
              ]}
            >
              Friends
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'settings' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('settings')}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={activeTab === 'settings' ? '#3B82F6' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'settings' && styles.activeTabButtonText,
              ]}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts Tab Content */}
        {activeTab === 'posts' && (
          <View style={styles.tabContent}>
            {posts.length > 0 ? (
              <View style={styles.postsGrid}>
                {posts.map((post) => (
                  <TouchableOpacity key={post.id} style={styles.postCard}>
                    {post.image ? (
                      <Image
                        source={{ uri: post.image }}
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.postPlaceholder}>
                        <Ionicons name="document-text-outline" size={24} color="#6B7280" />
                      </View>
                    )}
                    <View style={styles.postInfo}>
                      <Text style={styles.postCaption} numberOfLines={2}>
                        {post.content || 'No caption'}
                      </Text>
                      <View style={styles.postStats}>
                        <View style={styles.postStat}>
                          <Ionicons name="heart" size={14} color="#EF4444" />
                          <Text style={styles.postStatValue}>{post.likes_count || 0}</Text>
                        </View>
                        <View style={styles.postStat}>
                          <Ionicons name="chatbubble" size={14} color="#9CA3AF" />
                          <Text style={styles.postStatValue}>{post.comments_count || 0}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#6B7280" />
                <Text style={styles.emptyStateTitle}>No Posts Yet</Text>
                <Text style={styles.emptyStateText}>
                  Share your fitness journey with friends
                </Text>
                <TouchableOpacity style={styles.emptyStateButton}>
                  <Text style={styles.emptyStateButtonText}>Create Post</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Friends Tab Content */}
        {activeTab === 'friends' && (
          <View style={styles.tabContent}>
            {friends.length > 0 ? (
              <View style={styles.friendsList}>
                {friends.map((friend) => (
                  <TouchableOpacity key={friend.id} style={styles.friendCard}>
                    {friend.avatar ? (
                      <Image
                        source={{ uri: friend.avatar }}
                        style={styles.friendAvatar}
                      />
                    ) : (
                      <View style={styles.friendAvatarPlaceholder}>
                        <Text style={styles.friendAvatarText}>
                          {getInitials(friend.username)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{friend.username}</Text>
                      <Text style={styles.friendMeta}>
                        {friend.training_level || 'Fitness Enthusiast'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#6B7280" />
                <Text style={styles.emptyStateTitle}>No Friends Yet</Text>
                <Text style={styles.emptyStateText}>
                  Connect with other fitness enthusiasts
                </Text>
                <TouchableOpacity style={styles.emptyStateButton}>
                  <Text style={styles.emptyStateButtonText}>Find Friends</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Settings Tab Content */}
        {activeTab === 'settings' && (
          <View style={styles.tabContent}>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Account</Text>
              
              <TouchableOpacity style={styles.settingsItem}>
                <View style={styles.settingsItemIcon}>
                  <Ionicons name="person-outline" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemTitle}>Edit Profile</Text>
                  <Text style={styles.settingsItemDescription}>
                    Update your personal information
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingsItem}>
                <View style={[styles.settingsItemIcon, {backgroundColor: '#7C3AED'}]}>
                  <Ionicons name="star-outline" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemTitle}>Upgrade to Premium</Text>
                  <Text style={styles.settingsItemDescription}>
                    Get access to advanced features
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Preferences</Text>
              
              <TouchableOpacity style={styles.settingsItem}>
                <View style={[styles.settingsItemIcon, {backgroundColor: '#10B981'}]}>
                  <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemTitle}>Notifications</Text>
                  <Text style={styles.settingsItemDescription}>
                    Manage your notification settings
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingsItem}>
                <View style={[styles.settingsItemIcon, {backgroundColor: '#F59E0B'}]}>
                  <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemTitle}>Language</Text>
                  <Text style={styles.settingsItemDescription}>
                    Change app language
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Other</Text>
              
              <TouchableOpacity style={styles.settingsItem}>
                <View style={[styles.settingsItemIcon, {backgroundColor: '#6B7280'}]}>
                  <Ionicons name="help-circle-outline" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemTitle}>Help & Support</Text>
                  <Text style={styles.settingsItemDescription}>
                    Get help and contact support
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingsItem} onPress={handleLogout}>
                <View style={[styles.settingsItemIcon, {backgroundColor: '#EF4444'}]}>
                  <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemTitle}>Logout</Text>
                  <Text style={styles.settingsItemDescription}>
                    Sign out of your account
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.appInfo}>
              <Text style={styles.appVersion}>Version 1.0.0</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    marginTop: 10,
    color: '#9CA3AF',
  },
  profileHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#1F2937',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  profileStat: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  profileStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#374151',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  tabButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTabButtonText: {
    color: '#3B82F6',
  },
  tabContent: {
    flex: 1,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  postCard: {
    width: '48%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  postImage: {
    width: '100%',
    height: 150,
  },
  postPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postInfo: {
    padding: 12,
  },
  postCaption: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 8,
  },
  postStats: {
    flexDirection: 'row',
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  postStatValue: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  friendsList: {
    
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  friendAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  friendAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  friendMeta: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
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
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    paddingLeft: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingsItemDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  appVersion: {
    fontSize: 14,
    color: '#6B7280',
  },
});