// components/feed/FriendRecommendationList.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { createThemedStyles, withAlpha } from '../../utils/createThemedStyles';
import { getAvatarUrl } from '../../utils/imageUtils';
import { useUsers, useFriends, useSendFriendRequest } from '../../hooks/query/useUserQuery';
import { useAuth } from '../../hooks/useAuth';

interface FriendRecommendationListProps {
  onUserAdded?: (userId: number) => void;
  maxRecommendations?: number;
}

const FriendRecommendationList: React.FC<FriendRecommendationListProps> = ({
  onUserAdded,
  maxRecommendations = 8,
}) => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { palette } = useTheme();
  const { t } = useLanguage();
  const styles = themedStyles(palette);
  
  const [addingFriends, setAddingFriends] = useState<Set<number>>(new Set());
  const [addedFriends, setAddedFriends] = useState<Set<number>>(new Set());
  const [dismissedUsers, setDismissedUsers] = useState<Set<number>>(new Set());

  // Get all users and current friends
  const { data: allUsers = [], isLoading: usersLoading } = useUsers();
  const { data: friends = [], isLoading: friendsLoading } = useFriends();
  const { mutateAsync: sendFriendRequest } = useSendFriendRequest();

  // Create a set of friend user IDs for quick lookup
  const friendUserIds = useMemo(() => {
    const ids = new Set<number>();
    
    friends.forEach(friend => {
      if (friend.friend?.id) {
        ids.add(friend.friend.id);
      } else if (friend.id) {
        ids.add(friend.id);
      }
    });
    
    return ids;
  }, [friends]);

  // Filter users to get recommendations
  const recommendedUsers = useMemo(() => {
    if (!currentUser || usersLoading || friendsLoading) return [];

    const filtered = allUsers
      .filter(user => 
        user.id !== currentUser.id && // Not current user
        !friendUserIds.has(user.id) && // Not already friends
        !addedFriends.has(user.id) && // Not recently added
        !dismissedUsers.has(user.id) && // Not dismissed
        user.username // Has username
      )
      .slice(0, maxRecommendations); // Limit recommendations

    // Shuffle the array for randomness
    return filtered.sort(() => Math.random() - 0.5);
  }, [allUsers, currentUser, friendUserIds, addedFriends, dismissedUsers, usersLoading, friendsLoading, maxRecommendations]);

  const handleAddFriend = async (userId: number) => {
    try {
      setAddingFriends(prev => new Set(prev).add(userId));
      
      await sendFriendRequest(userId);
      
      // Add to added friends set to remove from recommendations
      setAddedFriends(prev => new Set(prev).add(userId));
      
      // Show success alert
      Alert.alert(
        t('success') || 'Success',
        t('friend_request_sent') || 'Friend request sent successfully!',
        [{ text: t('ok') || 'OK' }]
      );
      
      // Notify parent component
      onUserAdded?.(userId);
      
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert(
        t('error') || 'Error',
        t('friend_request_error') || 'Failed to send friend request. Please try again.',
        [{ text: t('ok') || 'OK' }]
      );
    } finally {
      setAddingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleDismissUser = (userId: number) => {
    setDismissedUsers(prev => new Set(prev).add(userId));
  };

  const handleUserPress = (userId: number) => {
    router.push(`/user/${userId}`);
  };

  // Don't render if no recommendations or still loading
  if (usersLoading || friendsLoading || recommendedUsers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="people" size={18} color={palette.accent} />
          </View>
          <Text style={styles.headerTitle}>
            {t('people_you_may_know') || 'People you may know'}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{recommendedUsers.length}</Text>
        </View>
      </View> */}
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
      >
        {recommendedUsers.map((user) => {
          const isAdding = addingFriends.has(user.id);
          const avatarUrl = getAvatarUrl(user.avatar, 80);
          
          return (
            <TouchableOpacity
              key={user.id}
              style={styles.card}
              onPress={() => handleUserPress(user.id)}
              activeOpacity={0.8}
            >
              {/* Dismiss button */}
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDismissUser(user.id);
                }}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="close" 
                  size={16} 
                  color={palette.text_tertiary} 
                />
              </TouchableOpacity>

              <View style={styles.cardContent}>
                {/* Avatar with border */}
                <View style={styles.avatarContainer}>
                  <View style={styles.avatarBorder}>
                    {user.avatar ? (
                      <Image 
                        source={{ uri: avatarUrl }} 
                        style={styles.avatarImage}
                        defaultSource={{ 
                          uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username?.[0] || 'U')}&size=80&background=random` 
                        }}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                          {user.username?.[0]?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                    )}
                  </View>
                  

                </View>
                
                {/* Username */}
                <Text style={styles.username} numberOfLines={1}>
                  {user.username}
                </Text>
        
                
                {/* Add Friend Button */}
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    isAdding && styles.addButtonDisabled
                  ]}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent card press
                    handleAddFriend(user.id);
                  }}
                  disabled={isAdding}
                  activeOpacity={0.8}
                >
                  {isAdding ? (
                    <ActivityIndicator size="small" color={palette.text} />
                  ) : (
                    <>
                      <Ionicons 
                        name="person-add" 
                        size={16} 
                        color={palette.text} 
                        style={styles.addButtonIcon}
                      />
                      <Text style={styles.addButtonText}>
                        {t('add_friend') || 'Add Friend'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const themedStyles = createThemedStyles((palette) => ({
  container: {
    backgroundColor: palette.page_background,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(palette.border, 0.08),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: withAlpha(palette.accent, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.text,
  },
  headerBadge: {
    backgroundColor: palette.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    color: palette.page_background,
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    paddingLeft: 20,
  },
  scrollContainer: {
    paddingRight: 20,
  },
  card: {
    width: 140,
    marginRight: 16,
    backgroundColor: palette.card_background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: withAlpha(palette.border, 0.12),
    position: 'relative',
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: withAlpha(palette.page_background, 0.9),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    // Subtle shadow for the dismiss button
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 4,
    position: 'relative',
  },
  avatarBorder: {
    padding: 3,
    borderRadius: 44,
    backgroundColor: withAlpha(palette.accent, 0.1),
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: palette.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: palette.page_background,
    fontSize: 28,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.success,
    borderWidth: 2,
    borderColor: palette.card_background,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.text,
    textAlign: 'center',
    marginBottom: 6,
    maxWidth: '100%',
  },
  subtitle: {
    fontSize: 12,
    color: palette.text_secondary,
    textAlign: 'center',
    marginBottom: 12,
    maxWidth: '100%',
  },
  addButton: {
    backgroundColor: withAlpha(palette.accent, 0.1),
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    minHeight: 36,
    borderWidth: 1,
    borderColor: withAlpha(palette.accent, 0.2),
  },
  addButtonDisabled: {
    backgroundColor: withAlpha(palette.text_tertiary, 0.1),
    borderColor: withAlpha(palette.text_tertiary, 0.2),
  },
  addButtonIcon: {
    marginRight: 6,
  },
  addButtonText: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: '600',
  },
}));

export default FriendRecommendationList;