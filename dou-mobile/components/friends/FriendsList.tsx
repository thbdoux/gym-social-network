// components/friends/FriendsList.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import UserItem from './UserItem';
import EmptyState from './EmptyState';

interface User {
  id: number;
  username: string;
  avatar?: string;
  training_level?: string;
  personality_type?: string;
}

interface FriendData {
  id: number;
  friend: User;
}

interface FriendsListProps {
  friends: FriendData[];
  loading: boolean;
  searchQuery: string;
  onNavigateToProfile: (userId: number) => void;
  onFriendAction: (action: string, userId: number) => void;
  onDiscoverPress: () => void;
  removeFriendMutation: any;
}

export default function FriendsList({
  friends,
  loading,
  searchQuery,
  onNavigateToProfile,
  onFriendAction,
  onDiscoverPress,
  removeFriendMutation,
}: FriendsListProps) {
  const { palette } = useTheme();
  const { t } = useLanguage();

  const renderFriendItem = ({ item }: { item: FriendData }) => {
    const isLoading = 
      removeFriendMutation.isLoading && 
      removeFriendMutation.variables === item.friend.id;

    return (
      <UserItem
        user={item.friend}
        onPress={() => onNavigateToProfile(item.friend.id)}
        showProfileNavigation={true}
        rightComponent={
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onFriendAction('remove', item.friend.id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={palette.text} />
            ) : (
              <Ionicons name="person-remove" size={18} color={palette.text} />
            )}
          </TouchableOpacity>
        }
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.highlight} />
        <Text style={[styles.loadingText, { color: `${palette.text}80` }]}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={friends}
        keyExtractor={(item) => `friend-${item.id}`}
        renderItem={renderFriendItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="people" size={48} color={`${palette.text}4D`} />}
            message={searchQuery ? t('no_friends_match_search') : t('no_friends')}
            action={
              !searchQuery
                ? {
                    label: t('find_friends'),
                    onPress: onDiscoverPress,
                  }
                : undefined
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
});