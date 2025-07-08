// components/shared/UserSearchModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUsers, useFriends } from '../../hooks/query/useUserQuery';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarUrl } from '../../utils/imageUtils';

interface User {
  id: number;
  username: string;
  avatar?: string;
  personality_type?: string;
}

interface UserSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
  excludeUserIds?: number[];
  title?: string;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({
  visible,
  onClose,
  onSelectUser,
  excludeUserIds = [],
  title
}) => {
  const { t } = useLanguage();
  const { palette } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // Get friends first (they'll be prioritized)
  const { data: friends = [], isLoading: friendsLoading } = useFriends();
  const { data: allUsers = [], isLoading: usersLoading } = useUsers();

  const isLoading = friendsLoading || usersLoading;

  useEffect(() => {
    if (!searchQuery.trim()) {
      // Show friends first when no search query
      const availableFriends = friends.filter(user => !excludeUserIds.includes(user.id));
      setFilteredUsers(availableFriends.slice(0, 10)); // Limit to 10 for performance
      return;
    }
    
    // Combine friends and all users, prioritizing friends
    const allAvailableUsers = [
      ...friends,
      ...allUsers.filter(user => !friends.some(friend => friend.id === user.id))
    ].filter(user => !excludeUserIds.includes(user.id));
    console.log(allAvailableUsers);
    // Filter by search query
    const query = searchQuery.toLowerCase();
    const filtered = allAvailableUsers.filter(user => {
      const displayName = user?.username;
      const username = user.username.toLowerCase();
      return displayName.includes(query) || username.includes(query);
    }).slice(0, 20); // Limit results

    setFilteredUsers(filtered);
  }, [searchQuery, friends, allUsers, excludeUserIds]);

  const handleSelectUser = (user: User) => {
    onSelectUser(user);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
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
          
          <Text style={[styles.headerTitle, { color: palette.text }]}>
            {title || t('select_workout_partner')}
          </Text>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: palette.card_background }]}>
            <Ionicons name="search" size={20} color={palette.text_secondary} />
            <TextInput
              style={[styles.searchInput, { color: palette.text }]}
              placeholder={t('search_users')}
              placeholderTextColor={palette.text_secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={palette.text_secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                  key={user?.id}
                  user={user}
                  onPress={() => handleSelectUser(user)}
                  isFriend={friends.some(friend => friend.id === user.id)}
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
      </SafeAreaView>
    </Modal>
  );
};

interface UserItemProps {
  user: User;
  onPress: () => void;
  isFriend: boolean;
}

const UserItem: React.FC<UserItemProps> = ({ user, onPress, isFriend }) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const avatarUrl = getAvatarUrl(user?.friend?.avatar);
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
            {user?.friend?.username}
          </Text>
          {isFriend && (
            <View style={[styles.friendBadge, { backgroundColor: palette.primary }]}>
              <Text style={styles.friendBadgeText}>{t('friend')}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.username, { color: palette.text_secondary }]} numberOfLines={1}>
          @{user?.friend?.username}
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 32,
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
  },
  content: {
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
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  usersList: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
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
  username: {
    fontSize: 14,
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
    textAlign: 'center',
  },
});

export default UserSearchModal;