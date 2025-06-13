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
  score?: number; // For sorting
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
}) => {
  const { user } = useAuth();
  const currentUser = user?.username || '';
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const { t } = useLanguage();
  
  const flatListRef = useRef<FlatList>(null);
  
  // Friend recommendation settings
  const RECOMMENDATION_PROBABILITY = 0.3; // 30% chance per 10 posts
  const MIN_POSTS_BEFORE_RECOMMENDATION = 8; // Minimum posts before first recommendation
  
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
  
  const [smartFeedPosts, setSmartFeedPosts] = useState<Post[]>([]);

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

  // Smart Feed Algorithm
  const calculatePostScore = (post: Post): number => {
    const now = new Date();
    const postDate = new Date(post.created_at);
    const hoursAgo = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
    
    let score = 0;
    
    // Friend bonus (highest priority)
    const isFriend = friendUsernames.has(post.user_username);
    if (isFriend) {
      score += 100;
    }
    
    // Recency bonus (friends get better recency bonus)
    if (hoursAgo < 24) {
      score += isFriend ? 50 : 20; // Friends get higher recency bonus
    } else if (hoursAgo < 48) {
      score += isFriend ? 30 : 10;
    } else if (hoursAgo < 168) { // 1 week
      score += isFriend ? 15 : 5;
    }
    
    // Engagement/Viral bonus (for non-friends to surface viral content)
    const engagementScore = (post.likes_count || 0) + (post.comments_count || 0) * 2; // Comments worth more
    
    if (!isFriend) {
      // Non-friends need higher engagement to compete
      if (engagementScore >= 50) score += 40; // Highly viral
      else if (engagementScore >= 20) score += 25; // Moderately viral
      else if (engagementScore >= 10) score += 15; // Somewhat viral
      else if (engagementScore >= 5) score += 8; // Mild engagement
    } else {
      // Friends get smaller engagement bonus
      if (engagementScore >= 20) score += 15;
      else if (engagementScore >= 10) score += 10;
      else if (engagementScore >= 5) score += 5;
    }
    
    // Add small random factor to avoid too predictable ordering
    score += Math.random() * 5;
    
    return score;
  };
  
  // Create smart feed with priority logic
  useEffect(() => {
    if (postsLoading || friendsLoading) return;
    
    const scoredPosts = posts
      .filter(post => post && post.user_username) // Basic validation
      .map(post => ({
        ...post,
        score: calculatePostScore(post)
      }))
      .sort((a, b) => b.score - a.score); // Sort by score descending
    
    setSmartFeedPosts(scoredPosts);
    
  }, [posts, friendUsernames, postsLoading, friendsLoading]);

  // Function to create feed items with occasional friend recommendations
  const createSmartFeedItems = useMemo(() => {
    const feedItems: FeedItem[] = [];
    
    if (smartFeedPosts.length === 0) {
      return [];
    }

    let recommendationInserted = false;
    
    smartFeedPosts.forEach((post, index) => {
      // Add the post
      feedItems.push({
        type: 'post',
        data: post,
        id: `post_${post.id}`,
        score: post.score
      });

      // Insert friend recommendation occasionally
      const shouldInsertRecommendation = 
        !recommendationInserted && 
        index >= MIN_POSTS_BEFORE_RECOMMENDATION && 
        index % 10 === 0 && // Every 10th post position
        Math.random() < RECOMMENDATION_PROBABILITY;

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
  }, [smartFeedPosts]);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (onRefresh) {
      onRefresh();
    } else {
      await refetchPosts();
    }
  };

  // Handle when a user is added as friend from recommendations
  const handleUserAdded = (userId: number) => {
    console.log('User added as friend:', userId);
    // This will help update the friends list and recompute the smart feed
  };

  // Create enhanced header component that includes friend recommendations at the top
  const enhancedHeaderComponent = useMemo(() => {
    return (
      <View>
        {/* Original header component */}
        {ListHeaderComponent && (
          typeof ListHeaderComponent === 'function' 
            ? ListHeaderComponent() 
            : ListHeaderComponent
        )}
        
        {/* Friend recommendations at the top of feed */}
        <FriendRecommendationList 
          onUserAdded={handleUserAdded}
          maxRecommendations={8}
        />
      </View>
    );
  }, [ListHeaderComponent]);

  // Render function for feed items
  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    if (item.type === 'friend_recommendation') {
      return (
        <View style={styles.recommendationContainer}>
          <FriendRecommendationList 
            onUserAdded={handleUserAdded}
            maxRecommendations={6}
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

  if (createSmartFeedItems.length === 0) {
    return (
      <View style={styles.container}>
        {enhancedHeaderComponent}
        <View style={[styles.emptyContainer, { backgroundColor: palette.page_background }]}>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>{t("no_post_yet")}</Text>
          <Text style={[styles.emptyText, { color: palette.border }]}>
            {t('no_post_yet_description')}
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
        data={createSmartFeedItems}
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