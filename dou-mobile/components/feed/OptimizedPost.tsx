// components/feed/OptimizedPost.tsx
import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles, withAlpha } from '../../utils/createThemedStyles';
import { getAvatarUrl } from '../../utils/imageUtils';
import { useFriendshipStatus, useSendFriendRequest } from '../../hooks/query/useUserQuery';
import PostContent from './PostContent';
import PostReactionButton from './PostReactionButton';

const { height, width } = Dimensions.get('window');

interface Post {
  id: number;
  content: string;
  post_type?: string;
  created_at: string;
  user_username: string;
  user_id?: number;
  user_profile_picture?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  reactions_count?: number;
  user_reaction?: string;
  shares_count?: number;
  is_share?: boolean;
  original_post_details?: any;
  image?: string;
  program_id?: number;
  program_details?: any;
  workout_log?: number;
  workout_log_details?: any;
  group_workout?: number;
  group_workout_details?: any;
  streak?: number;
  achievements?: string[];
  personality?: string;
}

interface OptimizedPostProps {
  post: Post;
  currentUser: string;
  onLike: (postId: number, isLiked: boolean) => void;
  onReact: (postId: number, reactionType: string) => void;
  onUnreact: (postId: number) => void;
  onComment: (postId: number, content: string) => void;
  onShare?: (postId: number, content: string) => void;
  onEdit?: (post: Post, newContent: string) => void;
  onDelete?: (postId: number) => void;
  onProgramClick?: (program: any) => void;
  onWorkoutLogClick?: (logId: number) => void;
  onGroupWorkoutClick?: (groupWorkoutId: number) => void;
  onForkProgram?: (programId: number) => Promise<any>;
  onProfileClick?: (userId: number) => void;
  onNavigateToProfile?: (userId: number) => void;
  onPostClick?: (postId: number) => void;
  detailMode?: boolean;
}

const OptimizedPost: React.FC<OptimizedPostProps> = memo(({
  post,
  currentUser,
  onLike,
  onReact,
  onUnreact,
  onComment,
  onShare,
  onEdit,
  onDelete,
  onProgramClick,
  onWorkoutLogClick,
  onGroupWorkoutClick,
  onForkProgram,
  onProfileClick,
  onNavigateToProfile,
  onPostClick,
  detailMode = false,
}) => {
  const { t } = useLanguage();
  const { palette, personality } = useTheme();
  const router = useRouter();
  
  // Local state for immediate UI updates (optimistic updates)
  const [liked, setLiked] = useState(post.is_liked);
  const [localLikesCount, setLocalLikesCount] = useState(post.likes_count);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.comments_count);
  const [localReactionsCount, setLocalReactionsCount] = useState(
    post.reactions_count || post.likes_count || 0
  );
  
  // Animation values - reduced complexity
  const likeScaleAnim = useRef(new Animated.Value(1)).current;
  const commentScaleAnim = useRef(new Animated.Value(1)).current;
  const shareScaleAnim = useRef(new Animated.Value(1)).current;
  
  // OPTIMIZED: Only load friendship data when needed and not for own posts
  const shouldLoadFriendshipData = !!(
    post.user_id && 
    post.user_username !== currentUser && 
    !detailMode // Don't load in feed view to save API calls
  );
  
  const { data: friendshipStatus } = useFriendshipStatus(
    post.user_id, 
    { 
      enabled: shouldLoadFriendshipData 
    }
  );
  
  const { mutateAsync: sendFriendRequest, isPending: isSendingRequest } = useSendFriendRequest();

  const styles = themedStyles(palette);

  // OPTIMIZED: Memoized date formatting
  const formattedDate = useCallback((dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      return date.toLocaleDateString();
    }
  }, []);

  // OPTIMIZED: Simple animation helper
  const animateButton = useCallback((animValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  // OPTIMIZED: Handle interactions with optimistic updates
  const handleLike = useCallback(() => {
    animateButton(likeScaleAnim);
    
    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setLocalLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    
    // API call
    onLike(post.id, liked);
  }, [liked, post.id, onLike, animateButton, likeScaleAnim]);

  const handleComment = useCallback(() => {
    animateButton(commentScaleAnim);
    
    if (detailMode) {
      // In detail mode, focus comment input
      return;
    }
    
    if (onPostClick) {
      onPostClick(post.id);
    } else {
      router.push(`/post/${post.id}`);
    }
  }, [detailMode, onPostClick, post.id, router, animateButton, commentScaleAnim]);

  const handleShare = useCallback(() => {
    animateButton(shareScaleAnim);
    
    if (post.is_share) {
      Alert.alert(t('info'), t('shared_posts_cannot_be_shared'));
      return;
    }
    
    // Simplified share - could open modal here
    if (onShare) {
      onShare(post.id, '');
    }
  }, [post.is_share, post.id, onShare, t, animateButton, shareScaleAnim]);

  const handleFollowUser = useCallback(async () => {
    if (!post.user_id || post.user_username === currentUser) return;
    
    try {
      await sendFriendRequest(post.user_id);
      Alert.alert(
        t('friend_request_sent') || 'Friend Request Sent',
        `Friend request sent to ${post.user_username}`
      );
    } catch (error) {
      Alert.alert(t('error') || 'Error', t('friend_request_error') || 'Failed to send friend request');
    }
  }, [post.user_id, post.user_username, currentUser, sendFriendRequest, t]);

  const handleUserProfileClick = useCallback((event: any) => {
    event.stopPropagation();
    
    if (post.user_id && onNavigateToProfile) {
      onNavigateToProfile(post.user_id);
    } else if (post.user_id && onProfileClick) {
      onProfileClick(post.user_id);
    }
  }, [post.user_id, onNavigateToProfile, onProfileClick]);

  const handlePostClick = useCallback(() => {
    if (detailMode) return;
    
    if (onPostClick) {
      onPostClick(post.id);
    }
  }, [detailMode, onPostClick, post.id]);

  const shouldShowFollowButton = useCallback(() => {
    return (
      post.user_username !== currentUser &&
      post.user_id &&
      friendshipStatus === 'not_friends'
    );
  }, [post.user_username, currentUser, post.user_id, friendshipStatus]);

  // OPTIMIZED: Memoized post type details
  const postTypeDetails = useCallback((type: string = 'regular') => {
    const defaultGradient = [palette.accent, palette.highlight];
    
    switch(type) {
      case 'program':
        return { icon: 'barbell', label: t('program'), gradient: defaultGradient };
      case 'workout_log':
        return { icon: 'fitness', label: t('workout_log'), gradient: defaultGradient };
      case 'group_workout':
        return { icon: 'people', label: t('group_workout'), gradient: defaultGradient };
      default:
        return { icon: 'create', label: t('regular'), gradient: defaultGradient };
    }
  }, [palette.accent, palette.highlight, t]);

  const typeDetails = postTypeDetails(post.post_type);
  const userStreak = post.streak || 0;
  const hasReacted = !!post.user_reaction;

  return (
    <TouchableOpacity 
      activeOpacity={detailMode ? 1 : 0.7}
      onPress={handlePostClick}
      disabled={detailMode}
      style={styles.postWrapper}
    >
      <View style={[
        styles.container,
        {
          backgroundColor: palette.page_background,
          borderColor: palette.border,
        }
      ]}>
        {/* Gradient line */}
        <LinearGradient
          colors={typeDetails.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientLine}
        />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.authorContainer}>
            {/* Avatar */}
            <TouchableOpacity 
              style={styles.avatarWrapper}
              onPress={handleUserProfileClick}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[palette.accent, palette.highlight]}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.avatarInner}>
                  <Image
                    source={{ uri: getAvatarUrl(post.user_profile_picture) }}
                    style={styles.avatarImage}
                  />
                </View>
              </LinearGradient>
              
              {userStreak > 0 && (
                <View style={[styles.streakBadge, { backgroundColor: palette.accent }]}>
                  <Text style={styles.streakText}>{userStreak}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <TouchableOpacity onPress={handleUserProfileClick} activeOpacity={0.7}>
                  <Text style={[styles.authorName, { color: palette.text }]}>
                    {post.user_username || ''}
                  </Text>
                </TouchableOpacity>
                
                {post.post_type && post.post_type !== 'regular' && !post.is_share && (
                  <LinearGradient
                    colors={typeDetails.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.postTypeBadge}
                  >
                    <Ionicons name={typeDetails.icon} size={12} color="#FFFFFF" />
                    <Text style={styles.postTypeBadgeText}>{typeDetails.label}</Text>
                  </LinearGradient>
                )}
                
                {post.is_share && (
                  <Text style={[styles.sharedLabel, { color: palette.text }]}>
                    {t('shared_a_post')}
                  </Text>
                )}
              </View>
              
              <Text style={[styles.postDate, { color: palette.border }]}>
                {formattedDate(post.created_at)}
              </Text>
            </View>
          </View>
          
          {/* Header Actions */}
          <View style={styles.headerActions}>
            {shouldShowFollowButton() && (
              <TouchableOpacity 
                style={[
                  styles.followButton,
                  { 
                    backgroundColor: palette.accent,
                    opacity: isSendingRequest ? 0.7 : 1
                  }
                ]}
                onPress={handleFollowUser}
                disabled={isSendingRequest}
                activeOpacity={0.7}
              >
                {isSendingRequest ? (
                  <ActivityIndicator size="small" color={palette.page_background} />
                ) : (
                  <>
                    <Ionicons name="person-add" size={14} color={palette.page_background} />
                    <Text style={[styles.followButtonText, { color: palette.page_background }]}>
                      {t('add_friend') || 'Add'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Post Content */}
        <View style={styles.content}>
          <PostContent 
            post={post}
            isEditing={false}
            editText=""
            setEditText={() => {}}
            handleSubmitEdit={() => {}}
            cancelEdit={() => {}}
            onProgramClick={onProgramClick}
            onWorkoutLogClick={onWorkoutLogClick}
            onGroupWorkoutClick={onGroupWorkoutClick}
            onForkProgram={onForkProgram}
            currentUser={currentUser}
            handleSharedProfileClick={handleUserProfileClick}
            handleOriginalPostClick={onPostClick}
          />
        </View>

        {/* Simple reactions count */}
        {localReactionsCount > 0 && (
          <View style={styles.reactionsContainer}>
            <Text style={[styles.reactionsText, { color: palette.text }]}>
              {`${localReactionsCount} ${localReactionsCount === 1 ? t('reaction') : t('reactions')}`}
            </Text>
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={[styles.actionsContainer, { borderTopColor: palette.border }]}>
          <Animated.View style={{ flex: 1, transform: [{ scale: likeScaleAnim }] }}>
            <PostReactionButton 
              postId={post.id}
              isReacted={hasReacted}
              reactionType={post.user_reaction}
              reactionsCount={localReactionsCount}
              onReact={onReact}
              onUnreact={onUnreact}
            />
          </Animated.View>
          
          <Animated.View style={{ flex: 1, transform: [{ scale: commentScaleAnim }] }}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleComment}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={20} color={palette.text_secondary} />
              <Text style={[styles.actionText, { color: palette.text_secondary }]}>
                {localCommentsCount || 0}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={{ flex: 1, transform: [{ scale: shareScaleAnim }] }}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShare}
              disabled={post.is_share}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="share-social-outline" 
                size={20} 
                color={post.is_share ? palette.text_tertiary : palette.text_secondary} 
              />
              <Text 
                style={[
                  styles.actionText,
                  { color: post.is_share ? palette.text_tertiary : palette.text_secondary }
                ]}
              >
                {post.shares_count || 0}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// Add display name for debugging
OptimizedPost.displayName = 'OptimizedPost';

const themedStyles = createThemedStyles((palette) => ({
  postWrapper: {
    marginBottom: 10,
  },
  container: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  gradientLine: {
    height: 0,
    width: '100%',
  },
  header: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  streakBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.page_background,
  },
  streakText: {
    color: palette.page_background,
    fontSize: 10,
    fontWeight: '700',
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  postTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  postTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  sharedLabel: {
    fontSize: 14,
  },
  postDate: {
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 0,
  },
  reactionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reactionsText: {
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 0.2,
    paddingVertical: 6,
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
}));

export default OptimizedPost;