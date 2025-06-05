// components/workouts/WorkoutPartnersManagerModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser, useUsers, useFriends } from '../../hooks/query/useUserQuery';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarUrl } from '../../utils/imageUtils';

interface User {
  id: number;
  username: string;
  avatar?: string;
  first_name?: string;
  last_name?: string;
  personality_type?: string;
}

interface Friend {
  id: number;
  created_at: string;
  friend: User;
}

interface WorkoutPartnersManagerModalProps {
  visible: boolean;
  onClose: () => void;
  currentPartnerIds: number[];
  onUpdatePartners: (partnerIds: number[]) => void;
  workoutName?: string;
  isCreator?: boolean;
}

type TabType = 'current' | 'add';

const WorkoutPartnersManagerModal: React.FC<WorkoutPartnersManagerModalProps> = ({
  visible,
  onClose,
  currentPartnerIds = [],
  onUpdatePartners,
  workoutName,
  isCreator = false
}) => {
  const { t } = useLanguage();
  const { palette } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // Get friends first (they'll be prioritized)
  const { data: friends = [] as Friend[], isLoading: friendsLoading } = useFriends();
  const { data: allUsers = [] as User[], isLoading: usersLoading } = useUsers();

  const isLoading = friendsLoading || usersLoading;

  // Filter users for the add tab
  useEffect(() => {
    if (activeTab !== 'add') return;

    if (!searchQuery.trim()) {
      // Show friends first when no search query, excluding current partners
      // Convert friends to User format and filter out current partners
      const availableFriends = friends
        .map(friendObj => friendObj.friend) // Extract the actual user from friend.friend
        .filter(user => !currentPartnerIds.includes(user.id));
      setFilteredUsers(availableFriends.slice(0, 10)); // Limit to 10 for performance
      return;
    }
    
    // Convert friends to User format
    const friendUsers = friends.map(friendObj => friendObj.friend);
    
    // Combine friends and all users, prioritizing friends
    const allAvailableUsers = [
      ...friendUsers,
      ...allUsers.filter(user => !friendUsers.some(friend => friend.id === user.id))
    ].filter(user => !currentPartnerIds.includes(user.id));
    
    // Filter by search query
    const query = searchQuery.toLowerCase();
    const filtered = allAvailableUsers.filter(user => {
      const username = user.username.toLowerCase();
      const displayName = user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}`.toLowerCase()
        : username;
      return displayName.includes(query) || username.includes(query);
    }).slice(0, 20); // Limit results

    setFilteredUsers(filtered);
  }, [searchQuery, friends, allUsers, currentPartnerIds, activeTab]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setActiveTab(currentPartnerIds.length > 0 ? 'current' : 'add');
      setSearchQuery('');
    }
  }, [visible, currentPartnerIds.length]);

  const handleClose = () => {
    setSearchQuery('');
    setActiveTab('current');
    onClose();
  };

  const handleAddPartner = (user: User) => {
    if (!currentPartnerIds.includes(user.id)) {
      const updatedPartners = [...currentPartnerIds, user.id];
      onUpdatePartners(updatedPartners);
    }
    setSearchQuery('');
  };

  const handleRemovePartner = (userId: number) => {
    if (!isCreator) return;
    
    Alert.alert(
      t('remove_partner'),
      t('confirm_remove_partner'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: () => {
            const updatedPartners = currentPartnerIds.filter(id => id !== userId);
            onUpdatePartners(updatedPartners);
          }
        }
      ]
    );
  };

  const handleUserPress = (userId: number) => {
    if (activeTab === 'current' && !isCreator) {
      // Navigate to user profile if not in edit mode
      handleClose();
      router.push(`/(app)/user/${userId}`);
    } else if (activeTab === 'current' && isCreator) {
      // Remove partner if creator and on current tab
      handleRemovePartner(userId);
    }
  };

  const renderTabButton = (tab: TabType, label: string, count?: number) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[
          styles.tabButton,
          isActive && { backgroundColor: palette.primary },
          { borderColor: palette.border }
        ]}
        onPress={() => setActiveTab(tab)}
      >
        <Text style={[
          styles.tabButtonText,
          { color: isActive ? '#FFFFFF' : palette.text }
        ]}>
          {label}
        </Text>
        {count !== undefined && (
          <View style={[
            styles.tabBadge,
            { backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : palette.border }
          ]}>
            <Text style={[
              styles.tabBadgeText,
              { color: isActive ? '#FFFFFF' : palette.text_secondary }
            ]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCurrentPartners = () => {
    if (currentPartnerIds.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={palette.text_secondary} />
          <Text style={[styles.emptyStateText, { color: palette.text_secondary }]}>
            {t('no_workout_partners_yet')}
          </Text>
          <TouchableOpacity
            style={[styles.emptyStateButton, { backgroundColor: `${palette.primary}20` }]}
            onPress={() => setActiveTab('add')}
          >
            <Ionicons name="add-circle" size={20} color={palette.primary} />
            <Text style={[styles.emptyStateButtonText, { color: palette.primary }]}>
              {t('add_workout_partners')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.partnersList} showsVerticalScrollIndicator={false}>
        {currentPartnerIds.map((userId) => (
          <PartnerItem
            key={userId}
            userId={userId}
            onPress={() => handleUserPress(userId)}
            showRemoveHint={isCreator}
          />
        ))}
      </ScrollView>
    );
  };

  const renderAddPartners = () => {
    return (
      <View style={styles.addPartnersContainer}>
        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: palette.card_background }]}>
          <Ionicons name="search" size={20} color={palette.text_secondary} />
          <TextInput
            style={[styles.searchInput, { color: palette.text }]}
            placeholder={t('search_users')}
            placeholderTextColor={palette.text_secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={palette.text_secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={palette.primary} />
              <Text style={[styles.loadingText, { color: palette.text_secondary }]}>
                {t('loading_users')}
              </Text>
            </View>
          ) : filteredUsers.length > 0 ? (
            <View style={styles.usersList}>
              {!searchQuery.trim() && friends.length > 0 && (
                <Text style={[styles.sectionTitle, { color: palette.text_secondary }]}>
                  {t('friends')}
                </Text>
              )}
              {filteredUsers.map((user) => (
                <UserItem
                  key={user.id}
                  user={user}
                  onPress={() => handleAddPartner(user)}
                  isFriend={friends.some(friendObj => friendObj.friend.id === user.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={palette.text_secondary} />
              <Text style={[styles.emptyStateText, { color: palette.text_secondary }]}>
                {searchQuery.trim() ? t('no_users_found') : t('no_friends_yet')}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: palette.page_background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: palette.card_background }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={palette.text} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: palette.text }]}>
              {t('workout_partners')}
            </Text>
            {workoutName && (
              <Text style={[styles.headerSubtitle, { color: palette.text_secondary }]}>
                {workoutName}
              </Text>
            )}
          </View>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: palette.card_background }]}>
          {renderTabButton('current', t('current_partners'), currentPartnerIds.length)}
          {isCreator && renderTabButton('add', t('add_partners'))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'current' ? renderCurrentPartners() : renderAddPartners()}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// Partner Item Component (for current partners)
interface PartnerItemProps {
  userId: number;
  onPress: () => void;
  showRemoveHint?: boolean;
}

const PartnerItem: React.FC<PartnerItemProps> = ({ userId, onPress, showRemoveHint = false }) => {
  const { data: user, isLoading } = useUser(userId);
  const { palette } = useTheme();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <View style={[styles.partnerItem, { backgroundColor: palette.card_background }]}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: palette.border }]} />
        <View style={styles.userInfo}>
          <View style={[styles.namePlaceholder, { backgroundColor: palette.border }]} />
          <View style={[styles.usernamePlaceholder, { backgroundColor: palette.border }]} />
        </View>
        <Ionicons name="chevron-forward" size={20} color={palette.text_secondary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.partnerItem, { backgroundColor: palette.card_background }]}>
        <View style={[styles.avatar, { backgroundColor: palette.border }]}>
          <Ionicons name="person" size={24} color={palette.text_secondary} />
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: palette.text_secondary }]}>
            {t('user_not_found')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={palette.text_secondary} />
      </View>
    );
  }

  const avatarUrl = getAvatarUrl(user.avatar);
  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user.username;

  return (
    <TouchableOpacity
      style={[styles.partnerItem, { backgroundColor: palette.card_background }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: avatarUrl }}
        style={styles.avatar}
      />
      
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: palette.text }]} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={[styles.username, { color: palette.text_secondary }]} numberOfLines={1}>
          @{user.username}
        </Text>
      </View>
      
      <Ionicons 
        name={showRemoveHint ? "remove-circle" : "chevron-forward"} 
        size={20} 
        color={showRemoveHint ? "#ef4444" : palette.text_secondary} 
      />
    </TouchableOpacity>
  );
};

// User Item Component (for adding new partners)
interface UserItemProps {
  user: User;
  onPress: () => void;
  isFriend: boolean;
}

const UserItem: React.FC<UserItemProps> = ({ user, onPress, isFriend }) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const avatarUrl = getAvatarUrl(user.avatar);
  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user.username;

  return (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: palette.card_background }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: avatarUrl }}
        style={styles.avatar}
      />
      
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={[styles.userName, { color: palette.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          {isFriend && (
            <View style={[styles.friendBadge, { backgroundColor: palette.primary }]}>
              <Text style={styles.friendBadgeText}>{t('friend')}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.username, { color: palette.text_secondary }]} numberOfLines={1}>
          @{user.username}
        </Text>
      </View>
      
      <Ionicons name="add-circle" size={24} color={palette.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerSpacer: {
    width: 32,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  // Current Partners Styles
  partnersList: {
    flex: 1,
    padding: 16,
  },
  partnerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  // Add Partners Styles
  addPartnersContainer: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
  },
  searchResults: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  usersList: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  friendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  friendBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Shared Styles
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
  },
  namePlaceholder: {
    height: 16,
    width: 120,
    borderRadius: 8,
    marginBottom: 4,
  },
  usernamePlaceholder: {
    height: 14,
    width: 80,
    borderRadius: 7,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  helperTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  helperText: {
    fontSize: 12,
    marginLeft: 6,
    fontStyle: 'italic',
  },
});

export default WorkoutPartnersManagerModal;