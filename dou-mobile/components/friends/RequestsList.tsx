// components/friends/RequestsList.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
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

interface FriendRequest {
  id: number;
  from_user: User;
  to_user: User;
  status: string;
}

interface RequestsListProps {
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  loading: boolean;
  searchQuery: string;
  onNavigateToProfile: (userId: number) => void;
  onFriendAction: (action: string, userId: number) => void;
  onDiscoverPress: () => void;
  respondToFriendRequestMutation: any;
}

export default function RequestsList({
  receivedRequests,
  sentRequests,
  loading,
  searchQuery,
  onNavigateToProfile,
  onFriendAction,
  onDiscoverPress,
  respondToFriendRequestMutation,
}: RequestsListProps) {
  const { palette } = useTheme();
  const { t } = useLanguage();

  const renderReceivedRequest = ({ item }: { item: FriendRequest }) => {
    const user = item.from_user;
    const isLoading = 
      respondToFriendRequestMutation.isLoading && 
      respondToFriendRequestMutation.variables?.userId === user.id;

    return (
      <UserItem
        user={user}
        onPress={() => onNavigateToProfile(user.id)}
        showProfileNavigation={true}
        rightComponent={
          <View style={styles.requestButtonsContainer}>
            <TouchableOpacity
              style={[styles.acceptButton, { backgroundColor: '#10B981' }]}
              onPress={() => onFriendAction('accept', user.id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={palette.text} />
              ) : (
                <Ionicons name="checkmark" size={18} color={palette.text} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.rejectButton, { backgroundColor: '#EF4444' }]}
              onPress={() => onFriendAction('reject', user.id)}
              disabled={isLoading}
            >
              <Ionicons name="close" size={18} color={palette.text} />
            </TouchableOpacity>
          </View>
        }
      />
    );
  };

  const renderSentRequest = ({ item }: { item: FriendRequest }) => {
    const user = item.to_user;
    const isLoading = 
      respondToFriendRequestMutation.isLoading && 
      respondToFriendRequestMutation.variables?.userId === user.id;

    return (
      <UserItem
        user={user}
        onPress={() => onNavigateToProfile(user.id)}
        showProfileNavigation={true}
        rightComponent={
          <View style={styles.pendingContainer}>
            <Text style={[styles.pendingText, { color: palette.highlight }]}>{t('pending')}</Text>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: '#EF4444' }]}
              onPress={() => onFriendAction('cancel', user.id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={palette.text} />
              ) : (
                <Ionicons name="close" size={18} color={palette.text} />
              )}
            </TouchableOpacity>
          </View>
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

  const hasRequests = receivedRequests.length > 0 || sentRequests.length > 0;

  if (!hasRequests) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<Ionicons name="time" size={48} color={`${palette.text}4D`} />}
          message={searchQuery ? t('no_requests_match_search') : t('no_friend_requests')}
          action={
            !searchQuery
              ? {
                  label: t('find_friends'),
                  onPress: onDiscoverPress,
                }
              : undefined
          }
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {receivedRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>{t('received_requests')}</Text>
          <FlatList
            data={receivedRequests}
            keyExtractor={(item) => `received-${item.id}`}
            renderItem={renderReceivedRequest}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}
      
      {sentRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>{t('sent_requests')}</Text>
          <FlatList
            data={sentRequests}
            keyExtractor={(item) => `sent-${item.id}`}
            renderItem={renderSentRequest}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  listContent: {
    flexGrow: 1,
  },
  requestButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  pendingText: {
    fontSize: 14,
    marginRight: 8,
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});