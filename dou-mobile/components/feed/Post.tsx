// components/feed/Post.tsx - Enhanced with always-visible comment section in detail mode
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert, 
  Modal,
  Animated,
  Dimensions,
  TextInput,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles, withAlpha } from '../../utils/createThemedStyles';
import { getAvatarUrl } from '../../utils/imageUtils';
import { usePostLikers, usePostComments, usePostReactions } from '../../hooks/query/usePostQuery';
import { useFriendshipStatus, useSendFriendRequest } from '../../hooks/query/useUserQuery';
import CommentSection from './CommentSection';
import PostContent from './PostContent';
import PostReactionButton from './PostReactionButton';

// Get screen dimensions for positioning
const { height, width } = Dimensions.get('window');

interface Author {
  id: number;
  username: string;
  profile_picture?: string;
}

interface Post {
  id: number;
  content: string;
  post_type?: string;
  created_at: string;
  author: Author;
  likes_count: number;
  comments_count: number;
  comments?: any[];
  is_liked: boolean;
  reactions?: any[];
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
  user_username: string;
  user_id?: number;
  user_profile_picture?: string;
  streak?: number;
  achievements?: string[];
  stats?: {
    totalWorkouts?: number;
    thisWeek?: number;
    streak?: number;
  };
  personality?: string;
}

interface PostProps {
  post: Post;
  currentUser: string;
  onLike: (postId: number, isLiked: boolean) => void;
  onReact: (postId: number, reactionType: string) => void;
  onUnreact: (postId: number) => void;
  onComment: (postId: number, content: string) => void;
  onShare?: (postId: number, content: string) => void;
  onEdit?: (post: Post, newContent: string) => void;
  onDelete?: (postId: number) => void;
  userData?: any;
  onProgramClick?: (program: any) => void;
  onWorkoutLogClick?: (logId: number) => void;
  onForkProgram?: (programId: number) => Promise<any>;
  onProfileClick?: (userId: number) => void;
  onNavigateToProfile?: (userId: number) => void;
  onGroupWorkoutClick?: (groupWorkoutId: number) => void;
  detailMode?: boolean; 
  onPostClick?: (postId: number) => void;
  showCommentsByDefault?: boolean; // New prop to control default comment visibility
}

const Post: React.FC<PostProps> = ({
  post,
  currentUser,
  onLike,
  onReact,
  onUnreact,
  onComment,
  onShare,
  onEdit,
  onDelete,
  userData,
  onProgramClick,
  onWorkoutLogClick,
  onGroupWorkoutClick,
  onForkProgram,
  onProfileClick,
  onNavigateToProfile,
  detailMode = false,
  onPostClick,
  showCommentsByDefault = false
}) => {
  const { t } = useLanguage();
  const { palette, personality } = useTheme();
  const router = useRouter();
  
  // Comment input visibility - show by default if showCommentsByDefault is true
  const [showCommentInput, setShowCommentInput] = useState(showCommentsByDefault);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareText, setShareText] = useState('');
  
  // Use local states for immediate UI updates
  const [liked, setLiked] = useState(post.is_liked);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.comments_count);
  const [localReactionsCount, setLocalReactionsCount] = useState(post.reactions_count || post.likes_count || 0);
  
  // Animation values for smooth transitions
  const reactionsOpacityAnim = useRef(new Animated.Value(localReactionsCount > 0 ? 1 : 0)).current;
  const reactionsScaleAnim = useRef(new Animated.Value(localReactionsCount > 0 ? 1 : 0)).current;
  const likeScaleAnim = useRef(new Animated.Value(1)).current;
  const commentScaleAnim = useRef(new Animated.Value(1)).current;
  const shareScaleAnim = useRef(new Animated.Value(1)).current;
  const commentSectionOpacity = useRef(new Animated.Value(showCommentsByDefault ? 1 : 0)).current;
  
  // Fetch likers
  const { data: likers = [], isLoading: isLoadingLikers } = usePostLikers(post.id);

  // Fetch comments
  const { data: comments = [] } = usePostComments(post.id);
  
  // Fetch reactions
  const { data: reactions = [] } = usePostReactions(post.id);

  const { data: friendshipStatus } = useFriendshipStatus(
    post.user_id, 
    { 
      enabled: !!post.user_id && post.user_username !== currentUser 
    }
  );
  const { mutateAsync: sendFriendRequest, isPending: isSendingRequest } = useSendFriendRequest();

  // Create themed styles
  const styles = themedStyles(palette);

  // Update local states when post props change
  useEffect(() => {
    setLiked(post.is_liked);
    setLocalCommentsCount(post.comments_count);
    
    const newReactionsCount = post.reactions_count || post.likes_count || 0;
    const hadReactions = localReactionsCount > 0;
    const hasReactions = newReactionsCount > 0;
    
    setLocalReactionsCount(newReactionsCount);
    
    // Animate reactions counter appearance/disappearance
    if (!hadReactions && hasReactions) {
      // Reactions just appeared
      Animated.parallel([
        Animated.spring(reactionsScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(reactionsOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else if (hadReactions && !hasReactions) {
      // Reactions just disappeared
      Animated.parallel([
        Animated.timing(reactionsScaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(reactionsOpacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
    
  }, [post.is_liked, post.comments_count, post.reactions_count, post.likes_count]);

  // Show comment section by default in detail mode
  useEffect(() => {
    if (showCommentsByDefault && !showCommentInput) {
      setShowCommentInput(true);
      Animated.timing(commentSectionOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showCommentsByDefault]);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);

  // Animation references for post click
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Format date to display relative time for recent dates
  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
      return `${diffHours} ${t(diffHours === 1 ? 'hour_ago' : 'hours_ago')}`;
    } else if (diffDays < 7) {
      return `${diffDays} ${t(diffDays === 1 ? 'day_ago' : 'days_ago')}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleFollowUser = async () => {
    if (!post.user_id || post.user_username === currentUser) return;
    
    try {
      await sendFriendRequest(post.user_id);
      
      // Show success message
      Alert.alert(
        t('friend_request_sent') || 'Friend Request Sent',
        t('friend_request_sent_message') || `Friend request sent to ${post.user_username}`
      );
      
      // Navigate to user profile
      if (onNavigateToProfile) {
        onNavigateToProfile(post.user_id);
      } else if (onProfileClick) {
        onProfileClick(post.user_id);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert(
        t('error') || 'Error',
        t('friend_request_error') || 'Failed to send friend request. Please try again.'
      );
    }
  };
  const shouldShowFollowButton = () => {
    // Don't show for current user's own posts
    if (post.user_username === currentUser) return false;
    
    // Don't show if no user ID
    if (!post.user_id) return false;
    
    // Only show if not friends and no pending request
    return friendshipStatus === 'not_friends';
  };

  const handleReactionsClick = () => {
    if (localReactionsCount > 0) {
      router.push(`/post/${post.id}/reactions`);
    }
  };
  
  // Animation functions for button hover effects
  const animateButtonPress = (animValue) => {
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
  };
  
  // Get post type details including colors for gradient
  const getPostTypeDetails = (type: string = 'regular') => {
    const defaultGradient = [palette.accent, palette.highlight];
    
    switch(type) {
      case 'program':
        return {
          icon: 'barbell',
          label: t('program'),
          colors: { 
            bg: 'rgba(124, 58, 237, 0.2)',
            text: palette.text,
            border: palette.border,
            gradient: defaultGradient
          }
        };
      case 'workout_log':
        return {
          icon: 'fitness',
          label: t('workout_log'),
          colors: { 
            bg: 'rgba(16, 185, 129, 0.2)',
            text: palette.text,
            border: palette.border,
            gradient: defaultGradient
          }
        };
      case 'group_workout':
        return {
          icon: 'people',
          label: t('group_workout'),
          colors: { 
            bg: 'rgba(249, 115, 22, 0.2)',
            text: palette.text,
            border: palette.border,
            gradient: defaultGradient
          }
        };
      default:
        return {
          icon: 'create',
          label: t('regular'),
          colors: { 
            bg: 'rgba(59, 130, 246, 0.2)',
            text: palette.text,
            border: palette.border,
            gradient: defaultGradient
          }
        };
    }
  };

  // Get avatar gradient colors based on user personality
  const getPersonalityGradient = () => {
    const postPersonality = post.personality || personality || 'versatile';
    return [palette.accent, palette.highlight];
  };
  
  // Function to show post options alert
  const showPostOptions = () => {
    const isCurrentUserPost = post.user_username === currentUser;
    
    const buttons = [];
    
    buttons.push({
      text: t('view_profile'),
      onPress: () => {
        if (post.user_id && onNavigateToProfile) {
          onNavigateToProfile(post.user_id);
        } else if (post.user_id && onProfileClick) {
          onProfileClick(post.user_id);
        }
      }
    });
    
    if (isCurrentUserPost) {
      buttons.push({
        text: t('edit_post'),
        onPress: handleStartEditing
      });
      
      buttons.push({
        text: t('delete_post'),
        style: 'destructive',
        onPress: () => handleDeleteConfirmation()
      });
    }
    
    buttons.push({
      text: t('cancel'),
      style: 'cancel'
    });
    
    Alert.alert(t('post_options'), '', buttons);
  };
  
  const handleShare = () => {
    animateButtonPress(shareScaleAnim);
    
    if (post.is_share) {
      Alert.alert(t('info'), t('shared_posts_cannot_be_shared'));
      return;
    }
    setIsShareModalOpen(true);
  };
  
  const submitShare = () => {
    if (onShare) {
      onShare(post.id, shareText);
    }
    setShareText('');
    setIsShareModalOpen(false);
  };

  // Handle clicking on the post content area
  const handlePostClick = () => {
    if (detailMode) {
      // In detail mode, don't do anything on post click
      return;
    }
    
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      if (onPostClick) {
        onPostClick(post.id);
      }
    });
  };

  // Handle clicking on username or profile picture
  const handleUserProfileClick = (event) => {
    event.stopPropagation();
    
    if (post.user_id && onNavigateToProfile) {
      onNavigateToProfile(post.user_id);
    } else if (post.user_id && onProfileClick) {
      onProfileClick(post.user_id);
    }
  };

  // Handle clicking on a liker's profile
  const handleLikerProfileClick = (userId: number) => {
    if (onNavigateToProfile) {
      onNavigateToProfile(userId);
    } else if (onProfileClick) {
      onProfileClick(userId);
    }
  };

  // Handle clicking on original post in a shared post
  const handleOriginalPostClick = (originalPostId: number) => {
    if (onPostClick) {
      onPostClick(originalPostId);
    }
  };
  
  const handleDeleteConfirmation = () => {
    Alert.alert(
      t('delete_post'),
      t('confirm_delete_post'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(post.id);
            }
          }
        }
      ]
    );
  };

  const handleStartEditing = () => {
    setEditText(post.content);
    setIsEditing(true);
  };
  
  const handleSubmitEdit = () => {
    if (onEdit && editText.trim() !== '') {
      onEdit(post, editText);
    }
    setIsEditing(false);
  };

  const handleSharedProfileClick = (event) => {
    event.stopPropagation();
    if (post.original_post_details?.user_id && onNavigateToProfile) {
      onNavigateToProfile(post.original_post_details.user_id);
    } else if (post.original_post_details?.user_id && onProfileClick) {
      onProfileClick(post.original_post_details.user_id);
    }
  };

  // Enhanced comment button handling
  const handleCommentPress = () => {
    animateButtonPress(commentScaleAnim);
    
    if (detailMode) {
      // In detail mode, toggle comment input visibility if not shown by default
      if (!showCommentsByDefault) {
        const newShowState = !showCommentInput;
        setShowCommentInput(newShowState);
        
        Animated.timing(commentSectionOpacity, {
          toValue: newShowState ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
      // If comments are shown by default, do nothing or scroll to comment input
    } else {
      // In feed, navigate to post detail page
      if (onPostClick) {
        onPostClick(post.id);
      } else {
        // Fallback navigation
        router.push(`/post/${post.id}`);
      }
    }
  };

  // Handle reacting to a post
  const handleReact = (postId: number, reactionType: string) => {
    onReact(postId, reactionType);
  };
  
  // Handle unreacting to a post
  const handleUnreact = (postId: number) => {
    onUnreact(postId);
  };

  const handleLike = () => {
    animateButtonPress(likeScaleAnim);
    setLiked(!liked);
    onLike(post.id, liked);
  };

  // Get user streak to display on avatar
  const userStreak = post.streak || post.stats?.streak || 0;
  
  // Get personality-based gradient for avatar
  const avatarGradientColors = getPersonalityGradient();
  
  // Determine what type of post this is
  const effectivePostType = (post.is_share && post.original_post_details?.post_type) 
    ? post.original_post_details.post_type 
    : post.post_type || 'regular';
  
  const postTypeDetails = getPostTypeDetails(effectivePostType);

  // Check if the user has reacted to the post
  const hasReacted = !!post.user_reaction;

  // Helper to get top reactions display
  const getTopReactions = () => {
    if (!reactions || reactions.length === 0) return [];
    
    const reactionCounts = {};
    reactions.forEach(reaction => {
      const type = reaction.reaction_type;
      reactionCounts[type] = (reactionCounts[type] || 0) + 1;
    });
    
    return Object.entries(reactionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
  };

  const topReactions = getTopReactions();

  // Get emoji for reaction type
  const getReactionEmoji = (type) => {
    switch(type) {
      case 'like': return '👍';
      case 'love': return '❤️';
      case 'laugh': return '😂';
      case 'wow': return '😮';
      case 'sad': return '😢';
      case 'angry': return '😡';
      default: return '👍';
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={detailMode ? 1 : 0.7}
      onPress={handlePostClick}
      disabled={detailMode || isEditing}
      style={styles.postWrapper}
    >
      <Animated.View 
        style={[
          styles.container,
          {
            backgroundColor: palette.page_background,
            borderColor: palette.border,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim
          }
        ]}
      >
        {/* Gradient top line */}
        <LinearGradient
          colors={postTypeDetails.colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientLine}
        />
        
        {/* UPDATED Post Header with Follow Button */}
        <View style={styles.header}>
          <View style={styles.authorContainer}>
            {/* User Avatar with Activity Ring */}
            <TouchableOpacity 
              style={styles.avatarWrapper}
              onPress={handleUserProfileClick}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={avatarGradientColors}
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
              
              {/* Streak indicator */}
              {userStreak > 0 && (
                <View style={[styles.streakBadge, { backgroundColor: palette.accent }]}>
                  <Text style={styles.streakText}>{userStreak}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <TouchableOpacity 
                  onPress={handleUserProfileClick}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.authorName, { color: palette.text }]}>
                    {post.user_username || ''}
                  </Text>
                </TouchableOpacity>
                
                {/* Post Type Badge */}
                {post.post_type && post.post_type !== 'regular' && !post.is_share && (
                  <LinearGradient
                    colors={postTypeDetails.colors.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.postTypeBadge}
                  >
                    <Ionicons name={postTypeDetails.icon} size={12} color="#FFFFFF" />
                    <Text style={styles.postTypeBadgeText}>{postTypeDetails.label}</Text>
                  </LinearGradient>
                )}
                
                {post.is_share && (
                  <Text style={[styles.sharedLabel, { color: palette.text }]}>
                    {t('shared_a_post')}
                  </Text>
                )}
              </View>
              
              <Text style={[styles.postDate, { color: palette.border }]}>
                {formatDate(post.created_at)}
              </Text>
            </View>
          </View>
          
          {/* NEW: Header Actions Container */}
          <View style={styles.headerActions}>
            {/* Follow Button */}
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
                      {t('add_friend') || 'Add friend'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            {/* Menu Button */}
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={showPostOptions}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={withAlpha(palette.text, 0.6)} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Post Content */}
        <View style={styles.content}>
          <PostContent 
            post={post}
            isEditing={isEditing}
            editText={editText}
            setEditText={setEditText}
            handleSubmitEdit={handleSubmitEdit}
            cancelEdit={() => setIsEditing(false)}
            onProgramClick={onProgramClick}
            onWorkoutLogClick={onWorkoutLogClick}
            onGroupWorkoutClick={onGroupWorkoutClick}
            onForkProgram={onForkProgram}
            currentUser={currentUser}
            handleSharedProfileClick={handleSharedProfileClick}
            handleOriginalPostClick={handleOriginalPostClick}
          />
        </View>

        {/* Reactions and Likers Preview with smooth animation */}
        <View style={styles.likersContainer}>
          <Animated.View 
            style={[
              styles.likersContent,
              {
                opacity: reactionsOpacityAnim,
                transform: [{ scale: reactionsScaleAnim }]
              }
            ]}
          >
            {localReactionsCount > 0 ? (
              <View style={styles.likersInnerContent}>
                {/* Show reaction icons */}
                {topReactions.length > 0 && (
                  <View style={styles.reactionsIconsContainer}>
                    {topReactions.map((reactionType, index) => (
                      <View 
                        key={`reaction-${reactionType}`}
                        style={[
                          styles.reactionIconWrapper,
                          { marginLeft: index > 0 ? -8 : 0 }
                        ]}
                      >
                        <Text style={styles.reactionIcon}>
                          {getReactionEmoji(reactionType)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                
                {/* Show liker avatars if no reactions */}
                {topReactions.length === 0 && likers.length > 0 && (
                  <View style={styles.likersAvatarsContainer}>
                    {likers.slice(0, 3).map((liker, index) => (
                      <TouchableOpacity
                        key={liker.id}
                        onPress={() => handleLikerProfileClick(liker.id)}
                        style={[
                          styles.likerAvatarWrapper,
                          { marginLeft: index > 0 ? -12 : 0 }
                        ]}
                      >
                        <Image
                          source={{ uri: getAvatarUrl(liker.avatar) }}
                          style={styles.likerAvatar}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                <TouchableOpacity 
      onPress={handleReactionsClick}
      activeOpacity={localReactionsCount > 0 ? 0.7 : 1}
      disabled={localReactionsCount === 0}
    >
      <Text style={[
        styles.likersText, 
        { 
          color: palette.text,
          textDecorationLine: localReactionsCount > 0 ? 'underline' : 'none',
          textDecorationColor: palette.text
        }
      ]}>
        {`${localReactionsCount} ${localReactionsCount === 1 ? t('reaction') : t('reactions')}`}
      </Text>
    </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={[styles.placeholderText, { color: palette.text_tertiary }]}>
                  {t('be_the_first_to_react') || 'Be the first to react'}
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
        
        {/* Action Buttons */}
        <View style={[styles.actionsContainer, { borderTopColor: palette.border }]}>
          {/* Reaction Button */}
          <Animated.View style={{ flex: 1, transform: [{ scale: likeScaleAnim }] }}>
            <PostReactionButton 
              postId={post.id}
              isReacted={hasReacted}
              reactionType={post.user_reaction}
              reactionsCount={localReactionsCount}
              onReact={handleReact}
              onUnreact={handleUnreact}
            />
          </Animated.View>
          
          {/* Comment Button with Animation */}
          <Animated.View style={{ flex: 1, transform: [{ scale: commentScaleAnim }] }}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleCommentPress}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={20} color={palette.text_secondary} />
              <Text style={[styles.actionText, { color: palette.text_secondary }]}>
                {localCommentsCount || 0}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Share Button with Animation */}
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
        
        {/* Comments Section - Show based on showCommentInput state */}
        {showCommentInput && (
          <Animated.View style={{ opacity: commentSectionOpacity }}>
            <CommentSection 
              postId={post.id}
              comments={comments}
              userData={userData}
              onNavigateToProfile={onNavigateToProfile}
              onProfileClick={onProfileClick}
            />
          </Animated.View>
        )}
        
        {/* Share Modal */}
        <Modal
          visible={isShareModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsShareModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.shareModalContent, { 
              backgroundColor: palette.page_background,
              borderColor: palette.border
            }]}>
              <View style={[styles.shareModalHeader, { 
                borderBottomColor: palette.border 
              }]}>
                <Text style={[styles.shareModalTitle, { color: palette.text }]}>
                  {t('share_post')}
                </Text>
                <TouchableOpacity onPress={() => setIsShareModalOpen(false)}>
                  <Ionicons name="close" size={24} color={palette.text} />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={[styles.shareInput, { 
                  backgroundColor: palette.input_background,
                  borderColor: palette.border,
                  color: palette.text 
                }]}
                placeholder={t('add_your_thoughts')}
                placeholderTextColor={palette.text_tertiary}
                multiline
                value={shareText}
                onChangeText={setShareText}
              />
              
              <View style={[styles.sharedPostPreview, { 
                backgroundColor: palette.card_background,
                borderColor: palette.border 
              }]}>
                <Text style={[styles.sharedLabel, { color: palette.text_secondary }]}>
                  {`${t('original_post_by')} ${post.user_username || ''}`}
                </Text>
                <Text style={[styles.sharedPreviewText, { color: palette.text }]} numberOfLines={2}>
                  {post.content || ''}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.shareButton, { backgroundColor: palette.accent }]}
                onPress={submitShare}
              >
                <Text style={[styles.shareButtonText, { color: palette.page_background }]}>
                  {t('share')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Themed styles
const themedStyles = createThemedStyles((palette) => ({
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
    marginRight: 8,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  postWrapper: {
    marginBottom: 10,
    position: 'relative',
  },
  container: {
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    // borderWidth: 1,
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
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 0,
  },
  
  // Enhanced likers section with consistent spacing
  likersContainer: {
    height: 20, // Fixed height to prevent layout jumping
    paddingHorizontal: 16,
    paddingBottom:8,
    justifyContent: 'center',
  },
  likersContent: {
    flex: 1,
    justifyContent: 'center',
  },
  likersInnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  likersAvatarsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  reactionsIconsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  reactionIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: withAlpha(palette.card_background, 0.8),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  reactionIcon: {
    fontSize: 14,
  },
  likerAvatarWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    zIndex: 1,
  },
  likerAvatar: {
    width: '100%',
    height: '100%',
  },
  likersText: {
    fontSize: 12,
  },
  
  // Action buttons
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
  
  // Share modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  shareModalContent: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  shareInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 16,
    borderWidth: 1,
  },
  sharedPostPreview: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sharedPreviewText: {
    fontSize: 14,
  },
  shareButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}));

export default Post;