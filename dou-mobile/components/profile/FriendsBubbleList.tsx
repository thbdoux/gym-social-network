// components/profile/FriendsBubbleList.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

const { width } = Dimensions.get('window');
const BUBBLE_SIZE = 54; // Smaller bubbles

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
        {/* Your Story Bubble */}
        <TouchableOpacity 
          style={styles.yourStoryContainer}
        >
          <View style={styles.yourStoryBubble}>
            <View style={styles.youAvatar} />
          </View>
          <Text style={styles.name}>Your Story</Text>
        </TouchableOpacity>

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
                  {/* Instagram-like gradient ring */}
                  <LinearGradient
                    colors={['#DE0046', '#F7A34B']}
                    style={styles.storyRing}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.innerRing}>
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
                    </View>
                  </LinearGradient>
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
    backgroundColor: '#111827', // Match the feed background
    paddingVertical: 10,
    paddingHorizontal: 8,
    // No borders or separators
  },
  scrollContent: {
    paddingRight: 10,
  },
  bubbleContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: BUBBLE_SIZE,
  },
  yourStoryContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: BUBBLE_SIZE,
    marginLeft: 4,
  },
  yourStoryBubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  youAvatar: {
    width: BUBBLE_SIZE - 6,
    height: BUBBLE_SIZE - 6,
    borderRadius: (BUBBLE_SIZE - 6) / 2,
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yourStoryPlus: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  storyRing: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2, // Space for the gradient ring
  },
  innerRing: {
    width: '100%',
    height: '100%',
    borderRadius: (BUBBLE_SIZE - 4) / 2,
    borderWidth: 2,
    borderColor: '#0F172A', // Dark border between gradient and image
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: (BUBBLE_SIZE - 8) / 2,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: (BUBBLE_SIZE - 8) / 2,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  name: {
    marginTop: 4,
    fontSize: 10, // Smaller text
    color: '#E5E7EB',
    textAlign: 'center',
    width: '100%',
  },
  viewMoreBubble: {
    alignItems: 'center',
    width: BUBBLE_SIZE,
    marginHorizontal: 8,
  },
  viewMoreCircle: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: 'rgba(55, 65, 81, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewMoreText: {
    marginTop: 4,
    fontSize: 10,
    color: '#E5E7EB',
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
    width: width - 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  emptyText: {
    color: '#E5E7EB',
    marginBottom: 8,
  },
  addFriendButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 20,
  },
  addFriendText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default FriendsBubbleList;