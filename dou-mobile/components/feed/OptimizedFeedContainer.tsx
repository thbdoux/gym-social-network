// components/feed/OptimizedFeedContainer.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Post from './Post';
import FriendRecommendationList from './FriendRecommendationList';
import { usePostsFeed } from '../../hooks/query/usePostQuery';
import { useFriends } from '../../hooks/query/useUserQuery';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext'; 
import { createThemedStyles } from '../../utils/createThemedStyles';
import { useLanguage } from '@/context/LanguageContext';
import CustomLoadingScreen from '../shared/CustomLoadingScreen';
interface OptimizedFeedContainerProps {
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

const OptimizedFeedContainer: React.FC<OptimizedFeedContainerProps> = ({
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

  // Create friend usernames set with memoization
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
    
    if (currentUser) {
      usernameSet.add(currentUser);
    }
    
    return usernameSet;
  }, [friends, currentUser]);

  // SIMPLIFIED: Simple deterministic sorting - friends first, then by creation date
  const sortedPosts = useMemo(() => {
    if (postsLoading || friendsLoading || posts.length === 0) return [];
    
    console.log('🔄 Sorting feed for', posts.length, 'posts');
    
    const validPosts = posts.filter(post => post && post.user_username);
    
    // Separate friends and non-friends posts
    const friendsPosts: any[] = [];
    const nonFriendsPosts: any[] = [];
    
    validPosts.forEach(post => {
      if (friendUsernames.has(post.user_username)) {
        friendsPosts.push(post);
      } else {
        nonFriendsPosts.push(post);
      }
    });
    
    // Sort each group by creation date (newest first)
    const sortByDate = (a: any, b: any) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    };
    
    friendsPosts.sort(sortByDate);
    nonFriendsPosts.sort(sortByDate);
    
    // Return friends posts first, then non-friends posts
    return [...friendsPosts, ...nonFriendsPosts];
  }, [posts, friendUsernames, postsLoading, friendsLoading]);

  // Create feed items with friend recommendations
  const feedItems = useMemo(() => {
    if (sortedPosts.length === 0) return [];
    
    const items: any[] = [];
    let recommendationInserted = false;
    
    sortedPosts.forEach((post, index) => {
      items.push({
        type: 'post',
        data: post,
        id: `post_${post.id}`,
      });

      // Insert friend recommendation at position 8 (deterministic)
      if (!recommendationInserted && index === 8) {
        items.push({
          type: 'friend_recommendation',
          data: { id: 'friend_rec_1' },
          id: 'friend_recommendation_1',
        });
        recommendationInserted = true;
      }
    });

    return items;
  }, [sortedPosts]);

  // Enhanced header component with memoization
  const enhancedHeaderComponent = useMemo(() => {
    return (
      <View>
        {ListHeaderComponent && (
          typeof ListHeaderComponent === 'function' 
            ? ListHeaderComponent() 
            : ListHeaderComponent
        )}
        
        <FriendRecommendationList 
          onUserAdded={() => console.log('User added as friend')}
          maxRecommendations={8}
        />
      </View>
    );
  }, [ListHeaderComponent]);

  // Memoized render function
  const renderFeedItem = useCallback(({ item }) => {
    if (item.type === 'friend_recommendation') {
      return (
        <View style={styles.recommendationContainer}>
          <FriendRecommendationList 
            onUserAdded={() => console.log('User added as friend')}
            maxRecommendations={6}
          />
        </View>
      );
    }

    const post = item.data;
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
        userData={null}
        onProgramClick={onProgramSelect}
        onWorkoutLogClick={onWorkoutLogSelect}
        onGroupWorkoutClick={onGroupWorkoutSelect}
        onForkProgram={onForkProgram}
        onProfileClick={onProfileClick}
        onNavigateToProfile={onNavigateToProfile}
        onPostClick={onPostClick}
      />
    );
  }, [
    currentUser, onLike, onReact, onUnreact, onComment, onShare, 
    onEdit, onDelete, onProgramSelect, onWorkoutLogSelect, 
    onGroupWorkoutSelect, onForkProgram, onProfileClick, 
    onNavigateToProfile, onPostClick, styles.recommendationContainer
  ]);

  // Key extractor
  const keyExtractor = useCallback((item) => item.id, []);

  // Get item layout for better performance
  const getItemLayout = useCallback((data, index) => ({
    length: 400, // Estimated item height
    offset: 400 * index,
    index,
  }), []);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      onRefresh();
    } else {
      await refetchPosts();
    }
  }, [onRefresh, refetchPosts]);

  // Loading and error states
  const isLoading = postsLoading || friendsLoading;
  const hasError = postsError || friendsError;

  if (isLoading && !refreshing) {
    return (
      <CustomLoadingScreen 
        animationType="pulse"
        text={('loading')}
        size='large'
        preloadImages={true}
        // style={{ backgroundColor: palette.layout }}
        // textColor={palette.text}
        // tintColor={palette.accent}
      />
    );
  }
  
  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorTitle, { color: palette.text }]}>Something went wrong</Text>
        <Text style={styles.errorText}>
          {postsError?.message || friendsError?.message || 'Failed to load posts'}
        </Text>
      </View>
    );
  }

  if (feedItems.length === 0) {
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

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={feedItems}
        keyExtractor={keyExtractor}
        ListHeaderComponent={enhancedHeaderComponent}
        renderItem={renderFeedItem}
        contentContainerStyle={{
          ...styles.listContainer,
          backgroundColor: palette.layout,
          ...(contentContainerStyle || {})
        }}
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
        // PERFORMANCE OPTIMIZATIONS
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={8}
        windowSize={10}
        getItemLayout={getItemLayout}
        // Enable for better memory management
        disableVirtualization={false}
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

export default OptimizedFeedContainer;