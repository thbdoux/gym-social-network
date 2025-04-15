// components/feed/FeedContainer.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Post from './Post';
import { usePostsFeed } from '../../hooks/query/usePostQuery';
import { useFriends } from '../../hooks/query/useUserQuery';
import { useUsers } from '../../hooks/query/useUserQuery';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext'; // Import the theme hook

interface Post {
  id: number;
  content: string;
  post_type?: string;
  created_at: string;
  user_username: string;
  user_id: number;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  [key: string]: any;
}

interface FeedContainerProps {
  onLike: (postId: number) => void;
  onComment: (postId: number, content: string) => void;
  onShare: (postId: number, content: string) => void;
  onEdit?: (post: any, newContent: string) => void;
  onDelete?: (postId: number) => void;
  onProgramSelect?: (program: any) => void;
  onForkProgram?: (programId: number) => Promise<any>;
  onProfileClick?: (userId: number) => void;
  onNavigateToProfile?: (userId: number) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onPostClick?: (postId: number) => void;
  contentContainerStyle?: object;
  scrollEventThrottle?: number;
  ListHeaderComponent?: React.ReactElement | (() => React.ReactElement) | null;
}

const FeedContainer: React.FC<FeedContainerProps> = ({
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete,
  onProgramSelect,
  onForkProgram,
  onProfileClick,
  onNavigateToProfile,
  onPostClick,
  refreshing = false,
  onRefresh,
  onScroll,
  contentContainerStyle,
  scrollEventThrottle = 16,
  ListHeaderComponent,
}) => {
  const { user } = useAuth();
  const currentUser = user?.username || '';
  const { palette } = useTheme(); // Use the theme context
  
  // Use React Query hooks
  const { 
    data: posts = [], 
    isLoading: postsLoading, 
    error: postsError,
    refetch: refetchPosts
  } = usePostsFeed();
  
  const {
    data: friends = [],
    isLoading: friendsLoading,
    error: friendsError
  } = useFriends();
  
  const {
    data: allUsers = [],
    isLoading: usersLoading,
    error: usersError
  } = useUsers();
  
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);

  // Create a memoized map of user data by username for better performance
  const usersData = useMemo(() => {
    const userData: Record<string, any> = {};
    if (allUsers && allUsers.length > 0) {
      allUsers.forEach(user => {
        if (user.username) {
          userData[user.username] = user;
        }
      });
    }
    return userData;
  }, [allUsers]);
  
  // Create a set of friend usernames - fixed to prevent recreation
  const friendUsernames = useMemo(() => {
    const usernameSet = new Set<string>();
    
    if (friends && friends.length > 0) {
      friends.forEach(friend => {
        if (friend.friend?.username) {
          usernameSet.add(friend.friend.username);
        } else if (friend.username) {
          usernameSet.add(friend.username);
        }
      });
    }
    
    // Always add current user to the set
    if (currentUser) {
      usernameSet.add(currentUser);
    }
    
    return usernameSet;
  }, [friends, currentUser]);
  
  // Filter posts to only show friends' posts and current user's posts
  // Fixed to prevent infinite update loop
  useEffect(() => {
    // Skip effect if data isn't loaded yet
    if (postsLoading || friendsLoading) return;
    
    const filtered = posts.filter(post => 
      post && post.user_username && friendUsernames.has(post.user_username)
    );
    
    // Only update state if the filtered posts have actually changed
    setFilteredPosts(filtered.length > 0 ? filtered : posts);
    
  }, [posts, friendUsernames, postsLoading, friendsLoading]);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    if (onRefresh) {
      onRefresh();
    } else {
      await refetchPosts();
    }
  };

  // Determine if we're still loading
  const isLoading = postsLoading || friendsLoading || usersLoading;
  const hasError = postsError || friendsError || usersError;

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: palette.layout }]}>
        <ActivityIndicator size="large" color={palette.accent} />
        <Text style={[styles.loadingText, { color: palette.text }]}>Loading posts...</Text>
      </View>
    );
  }
  
  if (hasError) {
    return (
      <View style={[styles.errorContainer, { 
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)' 
      }]}>
        <Text style={[styles.errorTitle, { color: palette.text }]}>Something went wrong</Text>
        <Text style={styles.errorText}>
          {postsError?.message || friendsError?.message || usersError?.message || 'Failed to load posts'}
        </Text>
      </View>
    );
  }

  if (filteredPosts.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: palette.layout }]}>
        <Text style={[styles.emptyTitle, { color: palette.text }]}>No posts yet</Text>
        <Text style={[styles.emptyText, { color: palette.border }]}>
          Connect with friends or create your first post!
        </Text>
      </View>
    );
  }

  // Create a style object for content container that incorporates the theme
  const themedContentContainerStyle = {
    ...styles.listContainer,
    backgroundColor: palette.layout,
    ...(contentContainerStyle || {})
  };

  return (
    <FlatList
      data={filteredPosts}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={ListHeaderComponent}
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
          onProgramClick={onProgramSelect}
          onForkProgram={onForkProgram}
          onProfileClick={onProfileClick}
          onNavigateToProfile={onNavigateToProfile}
          onPostClick={onPostClick}
        />
      )}
      contentContainerStyle={themedContentContainerStyle}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={palette.accent}
          colors={[palette.accent]}
        />
      }
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 160,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    textAlign: 'center',
    color: '#EF4444',
    lineHeight: 20,
  },
});

export default FeedContainer;