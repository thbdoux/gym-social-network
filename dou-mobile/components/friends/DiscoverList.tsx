// components/friends/DiscoverList.tsx
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

interface DiscoverListProps {
  users: User[];
  loading: boolean;
  searchQuery: string;
  onNavigateToProfile: (userId: number) => void;
  onFriendAction: (action: string, userId: number) => void;
  sendFriendRequestMutation: any;
}

export default function DiscoverList({
  users,
  loading,
  searchQuery,
  onNavigateToProfile,
  onFriendAction,
  sendFriendRequestMutation,
}: DiscoverListProps) {
  const { palette } = useTheme();
  const { t } = useLanguage();

  const renderDiscoverItem = ({ item }: { item: User }) => {
    const isLoading = 
      sendFriendRequestMutation.isLoading && 
      sendFriendRequestMutation.variables === item.id;

    return (
      <UserItem
        user={item}
        onPress={() => onNavigateToProfile(item.id)}
        showProfileNavigation={true}
        rightComponent={
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: '#10B981' }]}
            onPress={() => onFriendAction('send', item.id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={palette.text} />
            ) : (
              <>
                <Ionicons name="person-add" size={16} color={palette.text} />
                <Text style={[styles.addButtonText, { color: palette.text }]}>{t('add_friend')}</Text>
              </>
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
        data={users}
        keyExtractor={(item) => `discover-${item.id}`}
        renderItem={renderDiscoverItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="search" size={48} color={`${palette.text}4D`} />}
            message={searchQuery ? t('no_users_match_search') : t('no_recommendations')}
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
  addButton: {
    flexDirection: 'row',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  addButtonText: {
    marginLeft: 4,
    fontWeight: '500',
  },
});