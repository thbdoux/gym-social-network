// components/feed/FeedContainer.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from 'react-native';
import Post from './Post';
import FriendRecommendationList from './FriendRecommendationList';
import { usePostsFeed } from '../../hooks/query/usePostQuery';
import { useFriends } from '../../hooks/query/useUserQuery';
import { useUsers } from '../../hooks/query/useUserQuery';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext'; 
import { createThemedStyles, withAlpha } from '../../utils/createThemedStyles';
import { FEED_VIEW_TYPES, FEED_VIEW_ORDER } from './FeedViewSelector';
import { useLanguage } from '@/context/LanguageContext';

const { width: screenWidth } = Dimensions.get('window');

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

interface FeedItem {
  type: 'post' | 'friend_recommendation';
  data: Post | { id: string };
  id: string;
}

interface FeedContainerProps {
  onLike: (postId: number, isLiked: boolean) => void;
  onReact: (postId: number, reactionType: string) => void;
  onUnreact: (postId: number) => void;
  onComment: (postId: number, content: string) => void;
  onShare: (postId: number, content: string) => void;
  onEdit?: (post: any, newContent: string) => void;
  onDelete?: (postId: number) => void;
  onProgramSelect?: (program: any) => void;
  onWorkoutLogSelect?: (workoutLog: any) => void;
  onGroupWorkoutSelect?: (groupWorkoutId: number) => void;
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
  filterMode?: string; // Prop for view filtering
  onViewChange?: (newView: string) => void; // New prop for handling view changes
}

const FeedContainer: React.FC<FeedContainerProps> = ({
  onLike,
  onReact,
  onUnreact,
  onComment,
  onShare,
  onEdit,
  onDelete,
  onProgramSelect,
  onWorkoutLogSelect,
  onGroupWorkoutSelect,
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
  filterMode = FEED_VIEW_TYPES.FRIENDS, // Default to friends view
  onViewChange, // New prop
}) => {
  const { user } = useAuth();
  const currentUser = user?.username || '';
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const { t } = useLanguage();
  
  const flatListRef = useRef<FlatList>(null);
  
  // Friend recommendation settings
  const RECOMMENDATION_PROBABILITY = 0.5; // 8% chance per post (roughly 1 in 12-13 posts)
  const MIN_POSTS_BEFORE_RECOMMENDATION = 3; // Minimum posts before first recommendation
  const [recommendationShown, setRecommendationShown] = useState(false);
  
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

  // Get current view index for navigation
  const getCurrentViewIndex = () => {
    return FEED_VIEW_ORDER.findIndex(view => view === filterMode);
  };

  // Handle view change with animation
  const handleViewChange = (newView: string) => {
    if (newView !== filterMode && onViewChange) {
      onViewChange(newView);
    }
  };

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
  
  // Create a set of friend usernames
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
  
  // Filter posts based on selected view mode
  useEffect(() => {
    // Skip effect if data isn't loaded yet
    if (postsLoading || friendsLoading) return;
    
    let filtered;
    
    if (filterMode === FEED_VIEW_TYPES.FRIENDS) {
      // Friends view: only show posts from friends
      filtered = posts.filter(post => 
        post && post.user_username && friendUsernames.has(post.user_username)
      );
    } else {
      // Discover view: show all posts
      filtered = posts.filter(post => 
        post && post.user_username && !friendUsernames.has(post.user_username)
      );
    }
    
    // Only update state if the filtered posts have actually changed
    setFilteredPosts(filtered.length > 0 ? filtered : []);
    
  }, [posts, friendUsernames, postsLoading, friendsLoading, filterMode]);

  // Function to randomly insert friend recommendations in friends view
  const createFeedItemsWithRecommendations = useMemo(() => {
    const feedItems: FeedItem[] = [];
    
    if (filterMode !== FEED_VIEW_TYPES.FRIENDS || filteredPosts.length === 0) {
      // For discover view or no posts, just return posts as feed items
      return filteredPosts.map(post => ({
        type: 'post' as const,
        data: post,
        id: `post_${post.id}`,
      }));
    }

    let recommendationInserted = false;
    
    filteredPosts.forEach((post, index) => {
      // Add the post
      feedItems.push({
        type: 'post',
        data: post,
        id: `post_${post.id}`,
      });

      // Check if we should insert a recommendation after this post
      const shouldInsertRecommendation = 
        !recommendationInserted && // Haven't inserted one yet
        index >= MIN_POSTS_BEFORE_RECOMMENDATION && // Minimum posts threshold
        Math.random() < RECOMMENDATION_PROBABILITY; // Random chance

      if (shouldInsertRecommendation) {
        feedItems.push({
          type: 'friend_recommendation',
          data: { id: 'friend_rec_1' },
          id: 'friend_recommendation_1',
        });
        recommendationInserted = true;
      }
    });

    return feedItems;
  }, [filteredPosts, filterMode]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setRecommendationShown(false); // Reset recommendation state on refresh
    if (onRefresh) {
      onRefresh();
    } else {
      await refetchPosts();
    }
  };

  // Handle when a user is added as friend from recommendations
  const handleUserAdded = (userId: number) => {
    // Optionally trigger a refresh of friends data or posts
    // This will help update the recommendations list and potentially move posts between views
    console.log('User added as friend:', userId);
  };

  // Create enhanced header component that includes friend recommendations for discover view only
  const enhancedHeaderComponent = useMemo(() => {
    return (
      <View>
        {/* Original header component */}
        {ListHeaderComponent && (
          typeof ListHeaderComponent === 'function' 
            ? ListHeaderComponent() 
            : ListHeaderComponent
        )}
        
        {/* Friend recommendations - only show in discover view header */}
        {filterMode === FEED_VIEW_TYPES.DISCOVER && (
          <FriendRecommendationList 
            onUserAdded={handleUserAdded}
            maxRecommendations={8}
          />
        )}
      </View>
    );
  }, [ListHeaderComponent, filterMode]);

  // Render function for feed items
  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    if (item.type === 'friend_recommendation') {
      return (
        <View style={styles.recommendationContainer}>
          <FriendRecommendationList 
            onUserAdded={handleUserAdded}
            maxRecommendations={6} // Slightly fewer for inline display
          />
        </View>
      );
    }

    // Render regular post
    const post = item.data as Post;
    return (
      <Post
        post={post}
        currentUser={currentUser}
        onLike={onLike}
        onReact={onReact}
        onUnreact={onUnreact}
        onComment={onComment}
        onShare={onShare}
        onEdit={onEdit}
        onDelete={onDelete}
        userData={usersData[post.user_username]}
        onProgramClick={onProgramSelect}
        onWorkoutLogClick={onWorkoutLogSelect}
        onGroupWorkoutClick={onGroupWorkoutSelect}
        onForkProgram={onForkProgram}
        onProfileClick={onProfileClick}
        onNavigateToProfile={onNavigateToProfile}
        onPostClick={onPostClick}
      />
    );
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

  if (createFeedItemsWithRecommendations.length === 0) {
    return (
      <View style={styles.container}>
        {/* Still render the enhanced header component even when no posts are available */}
        {enhancedHeaderComponent}
        <View style={[styles.emptyContainer, { backgroundColor: palette.page_background }]}>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>{t("no_post_yet")}</Text>
          <Text style={[styles.emptyText, { color: palette.border }]}>
            {filterMode === FEED_VIEW_TYPES.FRIENDS 
              ? t('no_post_yet_description')
              : t('no_post_yet_description_2')}
          </Text>
        </View>
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
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={createFeedItemsWithRecommendations}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={enhancedHeaderComponent}
        renderItem={renderFeedItem}
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
    </View>
  );
};

const themedStyles = createThemedStyles((palette) => ({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 160,
  },
  recommendationContainer: {
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: palette.page_background,
  },
  loadingText: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    marginTop: 0,
    backgroundColor: palette.page_background,
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
    backgroundColor: palette.page_background,
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
}));

export default FeedContainer;