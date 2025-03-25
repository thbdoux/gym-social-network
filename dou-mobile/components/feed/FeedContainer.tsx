// components/feed/FeedContainer.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Post from './Post';
import { userService } from '../../api/services';
import { useAuth } from '../../hooks/useAuth';

interface FeedContainerProps {
  posts: any[];
  loading?: boolean;
  currentUser: string;
  onLike: (postId: number) => void;
  onComment: (postId: number, content: string) => void;
  onShare: (postId: number, content: string) => void;
  onEdit?: (post: any) => void;
  onDelete?: (postId: number) => void;
  onProgramSelect?: (program: any) => void;
  onForkProgram?: (programId: number) => Promise<any>;
}

const FeedContainer: React.FC<FeedContainerProps> = ({
  posts = [],
  loading = false,
  currentUser,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete,
  onProgramSelect,
  onForkProgram,
}) => {
  const { user } = useAuth();
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  // Fetch friends and users data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFriendsLoading(true);
        setUsersLoading(true);
        
        const [friendsList, usersData] = await Promise.all([
          userService.getFriends(),
          userService.getAllUsers(),
        ]);
        
        setFriends(friendsList || []);
        setAllUsers(usersData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setFriendsLoading(false);
        setUsersLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Create a memoized map of user data by username for better performance
  const usersData = useMemo(() => {
    const userData = {};
    if (allUsers && allUsers.length > 0) {
      allUsers.forEach(user => {
        if (user.username) {
          userData[user.username] = user;
        }
      });
    }
    return userData;
  }, [allUsers]);
  
  // Create a set of friend usernames
  const friendUsernames = useMemo(() => {
    if (!friends || friends.length === 0) return new Set();
    
    const usernameSet = new Set();
    friends.forEach(friend => {
      if (friend.friend?.username) {
        usernameSet.add(friend.friend.username);
      } else if (friend.username) {
        usernameSet.add(friend.username);
      }
    });
    
    return usernameSet;
  }, [friends]);
  
  // Filter posts to only show friends' posts and current user's posts
  useEffect(() => {
    if (posts && posts.length > 0 && !friendsLoading) {
      const friendPosts = posts.filter(post => 
        friendUsernames.has(post.user_username) || post.user_username === currentUser
      );
      setFilteredPosts(friendPosts.length > 0 ? friendPosts : posts);
    } else {
      setFilteredPosts([]);
    }
  }, [posts, friendUsernames, currentUser, friendsLoading]);

  // Determine if we're still loading
  const isLoading = loading || friendsLoading || usersLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  if (filteredPosts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No posts yet</Text>
        <Text style={styles.emptyText}>
          Connect with friends or create your first post!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredPosts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <Post
          post={item}
          currentUser={currentUser}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
          onEdit={onEdit}
          onDelete={onDelete}
          userData={usersData[item.user_username]}
        />
      )}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 8,
  },
  emptyContainer: {
    backgroundColor: '#1F2937',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    lineHeight: 20,
  },
});

export default FeedContainer;