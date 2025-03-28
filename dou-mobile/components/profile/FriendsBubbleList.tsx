// components/profile/FriendsBubbleList.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../../hooks/query/useUserQuery';
import ProfilePreviewModal from './ProfilePreviewModal';

// Type for friend data
interface Friend {
  id: number;
  username: string;
  avatar?: string;
  training_level?: string;
  personality_type?: string;
}

interface FriendResponse {
  id: number;
  friend: Friend;
}

interface FriendsBubbleListProps {
  onViewAllClick?: () => void;
}

const FriendsBubbleList: React.FC<FriendsBubbleListProps> = ({ 
  onViewAllClick
}) => {
  const [selectedUser, setSelectedUser] = useState<Friend | null>(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  // Fetch friends using the existing hook
  const { 
    data: friends = [], 
    isLoading, 
    error 
  } = useFriends({
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle friend bubble click
  const handleFriendClick = (friend: Friend) => {
    setSelectedUser(friend);
    setIsProfileModalVisible(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsProfileModalVisible(false);
    // Delay clearing user data to allow animation to complete
    setTimeout(() => setSelectedUser(null), 300);
  };

  // Get avatar source with fallback
  const getAvatarSource = (avatar?: string) => {
    if (avatar) {
      return { uri: avatar };
    }
    return require('../../assets/images/dou.svg'); // Make sure this default image exists
  };

  // Get initials for avatar fallback
  const getInitials = (name?: string): string => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load friends</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {friends.length > 0 ? (
          <>
            {friends.map((friendData: FriendResponse) => {
              const friend = friendData.friend;
              return (
                <TouchableOpacity 
                  key={friend.id} 
                  style={styles.bubbleContainer}
                  onPress={() => handleFriendClick(friend)}
                >
                  {friend.avatar ? (
                    <Image 
                      source={getAvatarSource(friend.avatar)} 
                      style={styles.avatar} 
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>{getInitials(friend.username)}</Text>
                    </View>
                  )}
                  <Text style={styles.name} numberOfLines={1}>{friend.username}</Text>
                </TouchableOpacity>
              );
            })}
            
            {/* View all button at the end */}
            <TouchableOpacity 
              style={styles.viewMoreBubble}
              onPress={onViewAllClick}
            >
              <View style={styles.viewMoreCircle}>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </View>
              <Text style={styles.viewMoreText}>View All</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No friends yet</Text>
            <TouchableOpacity 
              style={styles.addFriendButton}
              onPress={onViewAllClick}
            >
              <Text style={styles.addFriendText}>Find Friends</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Profile Preview Modal */}
      {selectedUser && (
        <ProfilePreviewModal
          isVisible={isProfileModalVisible}
          onClose={handleCloseModal}
          userId={selectedUser.id}
          initialUserData={selectedUser}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(17, 24, 39, 0.8)', // Semi-transparent background
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingRight: 20, // Extra padding for the end
  },
  bubbleContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  name: {
    marginTop: 4,
    fontSize: 12,
    color: '#E5E7EB', // Lighter color for better visibility on transparent bg
    textAlign: 'center',
    width: '100%',
  },
  viewMoreBubble: {
    alignItems: 'center',
    width: 70,
  },
  viewMoreCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewMoreText: {
    marginTop: 4,
    fontSize: 12,
    color: '#E5E7EB', // Lighter color for better visibility
    textAlign: 'center',
  },
  loadingContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
  },
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: '#E5E7EB', // Lighter color for better visibility
    marginBottom: 8,
  },
  addFriendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 20,
  },
  addFriendText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default FriendsBubbleList;