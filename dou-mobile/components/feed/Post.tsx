// components/feed/Post.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  TextInput, 
  Alert, 
  Modal,
  Animated,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext'; // Import theme hook
import WorkoutLogCard from '../workouts/WorkoutLogCard';
import ProgramCard from '../workouts/ProgramCard';
import GroupWorkoutCard from '../workouts/GroupWorkoutCard';
import { getAvatarUrl } from '../../utils/imageUtils'; // Import getAvatarUrl
import { usePostLikers } from '../../hooks/query/usePostQuery';

import { useUser } from '../../hooks/query/useUserQuery';
import { useGroupWorkout } from '../../hooks/query/useGroupWorkoutQuery';

// Get screen dimensions for bottom sheet
const { height, width } = Dimensions.get('window');

interface Author {
  id: number;
  username: string;
  profile_picture?: string;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  author?: Author;
  user_username?: string;
  user_profile_picture?: string;
}

interface LikerUser {
  id: number;
  username: string;
  avatar?: string;
}

interface Post {
  id: number;
  content: string;
  post_type?: string;
  created_at: string;
  author: Author;
  likes_count: number;
  comments_count: number;
  comments?: Comment[];
  is_liked: boolean;
  shares_count?: number;
  is_share?: boolean;
  original_post_details?: any;
  image?: string;
  program_id?: number;
  program_details?: any;
  workout_log?: number;
  workout_log_details?: any;
  group_workout?: number;  // Add this line
  group_workout_details?: any;  // Add this line
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
}

const Post: React.FC<PostProps> = ({
  post,
  currentUser,
  onLike,
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
  detailMode,
  onPostClick  
}) => {
  const { t } = useLanguage();
  const { palette, personality } = useTheme(); // Use theme context
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareText, setShareText] = useState('');
  
  // Use local states for immediate UI updates
  const [liked, setLiked] = useState(post.is_liked);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.comments_count);
  const [localComments, setLocalComments] = useState(post.comments || []);
  
  // New state for likers
  const { data: likers = [], isLoading: isLoadingLikers } = usePostLikers(post.id);

  // Update local states when post props change
  useEffect(() => {
    setLiked(post.is_liked);
    setLocalCommentsCount(post.comments_count);
    setLocalComments(post.comments || []);
  }, [post.is_liked, post.comments_count, post.comments]);
  
  // New state for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);

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
  
  // Get post type details including colors for gradient
  const getPostTypeDetails = (type: string = 'regular') => {
    // Base gradient colors on the theme palette accent and highlight
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
    // Use the post personality or fallback to the current user's personality
    const postPersonality = post.personality || personality || 'versatile';
    
    // Use the theme palette colors for gradients
    return [palette.accent, palette.highlight];
  };
  
  // Function to show post options alert
  const showPostOptions = () => {
    const isCurrentUserPost = post.user_username === currentUser;
    
    // Create buttons array based on whether the current user owns the post
    const buttons = [];
    
    // Add "View Profile" for all posts
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
    
    // Add Edit and Delete options only for the post owner
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
    
    // Add Cancel button
    buttons.push({
      text: t('cancel'),
      style: 'cancel'
    });
    
    Alert.alert(
      t('post_options'),
      '',
      buttons
    );
  };
  
  const handleShare = () => {
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
    // Animate the touch feedback
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
      // Only navigate if we're not in detail mode and a handler is provided
      if (!detailMode && onPostClick) {
        onPostClick(post.id);
      }
    });
  };

  // Handle clicking on username or profile picture
  const handleUserProfileClick = (event) => {
    // Stop event propagation to prevent triggering the post click
    event.stopPropagation();
    
    if (post.user_id && onNavigateToProfile) {
      onNavigateToProfile(post.user_id);
    } else if (post.user_id && onProfileClick) {
      // Fallback to modal if navigation isn't provided
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

  const handleOriginalPostClick = (originalPostId: number) => {
    if (onPostClick) {
      onPostClick(originalPostId);
    }
  };
  
  // Separate confirmation for delete
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

  // Start editing post
  const handleStartEditing = () => {
    setEditText(post.content);
    setIsEditing(true);
  };
  
  // Submit edited post
  const handleSubmitEdit = () => {
    if (onEdit && editText.trim() !== '') {
      onEdit(post, editText);
    }
    setIsEditing(false);
  };

  // Updated to handle like/unlike (dislike) properly
  const handleLike = () => {
    // Toggle the liked state locally for immediate UI feedback
    setLiked(!liked);
    
    // Call the onLike function with the post ID and current liked status
    // so the backend knows whether to like or unlike
    onLike(post.id, liked);
  };
  
  // Handle comment submission with local state updates
  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      // Call the parent handler
      onComment(post.id, commentText);
      
      // Optimistically update local state for immediate UI feedback
      const newComment = {
        id: Date.now(), // Temporary ID until API response
        content: commentText,
        created_at: new Date().toISOString(),
        user_username: currentUser,
        user_profile_picture: userData?.avatar
      };
      
      setLocalComments([...localComments, newComment]);
      setLocalCommentsCount(localCommentsCount + 1);
      
      // Clear the input
      setCommentText('');
    }
  };
  
  // Determine what type of post this is
  const effectivePostType = (post.is_share && post.original_post_details?.post_type) 
    ? post.original_post_details.post_type 
    : post.post_type || 'regular';
  
  const postTypeDetails = getPostTypeDetails(effectivePostType);
  
  const SharedPostContent = ({ 
    post, 
    onOriginalPostClick,
    onProgramClick,
    onWorkoutLogClick,
    onForkProgram,
    currentUser,
  }) => {
    // Get post type details for the original post
    const originalPost = post.original_post_details;
  
    // Get post type details for the original post
    const originalPostTypeDetails = getPostTypeDetails(originalPost.post_type); 

    // Handle clicking on the username or avatar in a shared post
    const handleSharedProfileClick = (event) => {
      event.stopPropagation();
      if (originalPost.user_id && onNavigateToProfile) {
        onNavigateToProfile(originalPost.user_id);
      } else if (originalPost.user_id && onProfileClick) {
        onProfileClick(originalPost.user_id);
      }
    };
    const handleOriginalAuthorClick = (event) => {
    event.stopPropagation();
    if (originalPost.user_id && onNavigateToProfile) {
      onNavigateToProfile(originalPost.user_id);
    } else if (originalPost.user_id && onProfileClick) {
      onProfileClick(originalPost.user_id);
    }
  };
  
    // Add a handler for clicking on the shared post content
    const handleOriginalPostClick = () => {
      if (onOriginalPostClick && originalPost.id) {
        onOriginalPostClick(originalPost.id);
      }
    };
    
    // Add a new handler for clicking on sharer profile
    const handleSharerProfileClick = (event) => {
      event.stopPropagation();
      if (post.user_id && onNavigateToProfile) {
        onNavigateToProfile(post.user_id);
      } else if (post.user_id && onProfileClick) {
        onProfileClick(post.user_id);
      }
    };
    
    return (
      <TouchableOpacity 
        style={[styles.sharedPostContainer, { borderColor: palette.border }]}
        onPress={handleOriginalPostClick}
        activeOpacity={0.7}
      >
        <View style={styles.sharedPostHeader}>
          {/* Use avatar image instead of text */}
          <TouchableOpacity 
            style={styles.sharedPostAvatar}
            onPress={handleSharedProfileClick}
            activeOpacity={0.7}
          >
            <Image 
              source={{ uri: getAvatarUrl(originalPost.user_profile_picture) }}
              style={styles.sharedPostAvatarImage}
            />
          </TouchableOpacity>
          
          <View style={styles.sharedPostUserInfo}>
            <View style={styles.sharedPostAuthorRow}>
              <TouchableOpacity onPress={handleSharedProfileClick} activeOpacity={0.7}>
                <Text style={[styles.sharedPostUsername, { color: palette.text }]}>
                  {originalPost.user_username}
                </Text>
              </TouchableOpacity>
              
              {/* Add the post type badge here for the original post */}
              {originalPost.post_type && originalPost.post_type !== 'regular' && (
                <LinearGradient
                  colors={originalPostTypeDetails.colors.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.postTypeBadge}
                >
                  <Ionicons name={originalPostTypeDetails.icon} size={12} color="#FFFFFF" />
                  <Text style={styles.postTypeBadgeText}>{originalPostTypeDetails.label}</Text>
                </LinearGradient>
              )}
            </View>
            
            <Text style={[styles.sharedPostDate, { color: palette.border }]}>
              {formatDate(originalPost.created_at)}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.sharedPostContent, { color: palette.text }]}>
          {originalPost.content}
        </Text>
        
        {originalPost.post_type === 'workout_log' && originalPost.workout_log_details && (
          <WorkoutLogCard
            user={currentUser}
            logId={originalPost.workout_log_details?.id}
            log={originalPost.workout_log_details}
            inFeedMode={true}
            onWorkoutLogClick={onWorkoutLogClick}
          />
        )}
        
        {originalPost.post_type === 'program' && originalPost.program_details && (
          <ProgramCard 
            programId={originalPost.program_id || originalPost.program}
            program={originalPost.program_details}
            inFeedMode={true}
            currentUser={currentUser}
            onProgramSelect={onProgramClick}
            onFork={onForkProgram}
          />
        )}
        
        {originalPost.image && (
          <Image
            source={{ uri: originalPost.image }}
            style={styles.sharedPostImage}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>
    );
  };
  
  const Comments = () => (
    <View style={styles.commentsContainer}>
      {(localComments && localComments.length > 0) ? (
        localComments.map(comment => (
          <View key={comment.id} style={styles.commentItem}>
            <TouchableOpacity 
              style={styles.commentAvatar}
              onPress={(e) => {
                e.stopPropagation();
                if (comment.author?.id && onNavigateToProfile) {
                  onNavigateToProfile(comment.author.id);
                } else if (comment.author?.id && onProfileClick) {
                  onProfileClick(comment.author.id);
                }
              }}
            >
              {/* Use getAvatarUrl to display profile picture */}
              <Image 
                source={{ uri: getAvatarUrl(comment.user_profile_picture || comment.author?.profile_picture) }}
                style={styles.commentAvatarImage}
              />
            </TouchableOpacity>
            
            <View style={[styles.commentBubble, { backgroundColor: 'rgba(31, 41, 55, 0.8)' }]}>
              <View style={styles.commentHeader}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    if (comment.author?.id && onNavigateToProfile) {
                      onNavigateToProfile(comment.author.id);
                    } else if (comment.author?.id && onProfileClick) {
                      onProfileClick(comment.author.id);
                    }
                  }}
                >
                  <Text style={[styles.commentUsername, { color: palette.text }]}>
                    {comment.user_username}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.commentDate, { color: palette.border }]}>
                  {formatDate(comment.created_at)}
                </Text>
              </View>
              <Text style={[styles.commentContent, { color: palette.text }]}>
                {comment.content}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={[styles.noCommentsText, { color: palette.border }]}>
          {t('no_comments')}
        </Text>
      )}
    </View>
  );

  // Get user streak to display on avatar
  const userStreak = post.streak || post.stats?.streak || 0;
  // Mock badges based on user activity
  const mockBadges = [
    { id: 1, name: t('20day_streak'), icon: "flame", color: [palette.accent, palette.highlight] },
    { id: 2, name: t('power_lifter'), icon: "barbell", color: [palette.accent, palette.highlight] },
    { id: 3, name: t('early_bird'), icon: "sunny", color: [palette.accent, palette.highlight] },
    { id: 4, name: t('yoga_master'), icon: "body", color: [palette.accent, palette.highlight] },
    { id: 5, name: t('weekend_warrior'), icon: "trophy", color: [palette.accent, palette.highlight] },
    { id: 6, name: t('community_coach'), icon: "people", color: [palette.accent, palette.highlight] },
  ];
  
  // Determine which badges to show (either from post or mocked)
  const badgesToShow = post.achievements && post.achievements.length > 0 
    ? post.achievements.map(name => {
        const foundBadge = mockBadges.find(b => b.name === name);
        return foundBadge || { 
          id: Math.random(), 
          name, 
          icon: "trophy", 
          color: [palette.accent, palette.highlight] 
        };
      })
    : [mockBadges[0], mockBadges[Math.floor(Math.random() * (mockBadges.length - 1)) + 1]];
  
  // Get personality-based gradient for avatar
  const avatarGradientColors = getPersonalityGradient();
  
  // Check if post is workout related
  const isWorkoutRelated = post.post_type === 'workout_log' || post.post_type === 'program';
  
  // Create themed background style
  const containerBackgroundStyle = {
    backgroundColor: palette.page_background,
    borderColor: palette.border,
  };

  return (
    <TouchableOpacity 
      activeOpacity={detailMode ? 1 : 0.7}
      onPress={handlePostClick}
      disabled={detailMode || isEditing}
      style={styles.postWrapper}
    >
      <View style={[styles.container, containerBackgroundStyle]}>
        {/* Blur effect background */}
        <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
        
        {/* Glow effect for premium posts */}
        <View style={[styles.glowEffect, { backgroundColor: palette.page_background }]} />
        
        {/* Gradient top line */}
        <LinearGradient
          colors={postTypeDetails.colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientLine}
        />
        
        {/* Post Header */}
        <View style={styles.header}>
          <View style={styles.authorContainer}>
            {/* User Avatar with Activity Ring - Now clickable */}
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
                {/* Username is now clickable */}
                <TouchableOpacity 
                  onPress={handleUserProfileClick}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.authorName, { color: palette.text }]}>
                    {post.user_username}
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
                  <Text style={[styles.sharedLabel, { color: palette.border }]}>
                    {t('shared_a_post')}
                  </Text>
                )}
              </View>
              
              <Text style={[styles.postDate, { color: palette.border }]}>
                @{post.user_username} • {formatDate(post.created_at)}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={showPostOptions}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={palette.border} />
          </TouchableOpacity>
        </View>
        
        {/* Post Content */}
        <View style={styles.content}>
          {isEditing ? (
            // Edit Mode UI
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.editInput, { 
                  backgroundColor: 'rgba(31, 41, 55, 0.6)',
                  borderColor: palette.accent,
                  color: palette.text 
                }]}
                value={editText}
                onChangeText={setEditText}
                multiline
                placeholder={t('edit_your_post')}
                placeholderTextColor={palette.border}
              />
              <View style={styles.editButtons}>
                <TouchableOpacity 
                  style={[styles.editButton, styles.cancelButton, { borderColor: palette.border }]}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={[styles.editButtonText, { color: palette.text }]}>
                    {t('cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.editButton, styles.saveButton, { backgroundColor: palette.accent }]}
                  onPress={handleSubmitEdit}
                >
                  <Text style={styles.editButtonText}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Normal Content View
            <>
              {post.content && <Text style={[styles.postText, { color: palette.text }]}>
                {post.content}
              </Text>}
              
              {/* Program Card - Always visible now */}
              {post.post_type === 'program' && post.program_details && (
                <View style={styles.programCardContainer}>
                  <ProgramCard
                    programId={post.program_id}
                    program={post.program_details}
                    onProgramSelect={onProgramClick}
                    currentUser={currentUser}
                    inFeedMode={true}
                    onFork={onForkProgram}
                  />
                </View>
              )}
              
              {/* Workout Log */}
              {post.post_type === 'workout_log' && post.workout_log_details && (
                <View style={styles.workoutLogContainer}>
                  <WorkoutLogCard 
                    user={currentUser}
                    logId={post.workout_log}
                    log={post.workout_log_details}
                    inFeedMode={true}
                    onWorkoutLogClick={onWorkoutLogClick}
                  />
                </View>
              )}

              {/* Group Workout */}
              {post.post_type === 'group_workout' && post.group_workout_details && (
                <View style={styles.groupWorkoutContainer}>
                  <GroupWorkoutCard 
                    groupWorkoutId={post.group_workout_details?.id}
                    groupWorkout={post.group_workout_details}
                    onParticipatePress={onGroupWorkoutClick}
                  />
                </View>
              )}
              
              {/* Shared Post */}
              {post.is_share && post.original_post_details && (
                <SharedPostContent 
                  post={post} 
                  onOriginalPostClick={handleOriginalPostClick}
                  onProgramClick={onProgramClick}
                  onWorkoutLogClick={onWorkoutLogClick}
                  onForkProgram={onForkProgram}
                  currentUser={currentUser}
                />
              )}
              
              {/* Regular Image */}
              {!post.is_share && post.image && (
                <Image
                  source={{ uri: post.image }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              )}
            </>
          )}
        </View>

        {/* Likers Preview - New section */}
        {post.likes_count > 0 && (
          <View style={styles.likersContainer}>
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
            <Text style={[styles.likersText, { color: palette.text }]}>
              {post.likes_count} {post.likes_count === 1 ? t('has_liked') : t('have_liked')}
            </Text>
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={[styles.actionsContainer, { borderTopColor: palette.border }]}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLike}
          >
            <Ionicons 
              name={liked ? "heart" : "heart-outline"} 
              size={20} 
              color={liked ? "#F87171" : palette.border} 
            />
            <Text 
              style={[
                styles.actionText, 
                { color: palette.border },
                liked && styles.likedText
              ]}
            >
              {post.likes_count || 0}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowCommentInput(!showCommentInput)}
          >
            <Ionicons name="chatbubble-outline" size={20} color={palette.border} />
            <Text style={[styles.actionText, { color: palette.border }]}>
              {localCommentsCount || 0} {/* Use local state for immediate updates */}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShare}
            disabled={post.is_share}
          >
            <Ionicons 
              name="share-social-outline" 
              size={20} 
              color={post.is_share ? "#6B7280" : palette.border} 
            />
            <Text 
              style={[
                styles.actionText,
                { color: palette.border }, 
                post.is_share && styles.disabledText
              ]}
            >
              {post.shares_count || 0}
            </Text>
          </TouchableOpacity>
        </View>
        
        
        {/* Comment Input */}
        {showCommentInput && (
          <View style={[styles.commentInputContainer, { borderTopColor: palette.border }]}>
            <View style={styles.commentInputAvatar}>
              {/* Use getAvatarUrl for current user avatar in comment input */}
              <Image 
                source={{ uri: getAvatarUrl(userData?.avatar) }}
                style={styles.commentInputAvatarImage}
              />
            </View>
            
            <View style={styles.commentInputWrapper}>
              <TextInput
                style={[styles.commentInput, { 
                  backgroundColor: palette.layout === '#F8F9FA' ? '#E2E8F0' : '#1F2937',
                  color: palette.text 
                }]}
                placeholder={t('write_comment')}
                placeholderTextColor={palette.border}
                value={commentText}
                onChangeText={setCommentText}
              />
              
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  !commentText.trim() && styles.sendButtonDisabled
                ]}
                onPress={handleCommentSubmit} // Use our updated comment handler
                disabled={!commentText.trim()}
              >
                <Ionicons 
                  name="send" 
                  size={18} 
                  color={commentText.trim() ? palette.accent : "#6B7280"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Comments Section */}
        {(showCommentInput || detailMode) && <Comments />}
        
        {/* Share Modal */}
        <Modal
          visible={isShareModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsShareModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.shareModalContent, { 
              backgroundColor: 'rgba(31, 41, 55, 0.9)',
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
                  backgroundColor: 'rgba(17, 24, 39, 0.8)',
                  borderColor: palette.border,
                  color: palette.text 
                }]}
                placeholder={t('add_your_thoughts')}
                placeholderTextColor={palette.border}
                multiline
                value={shareText}
                onChangeText={setShareText}
              />
              
              <View style={[styles.sharedPostPreview, { 
                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                borderColor: palette.border 
              }]}>
                <Text style={[styles.sharedLabel, { color: palette.border }]}>
                  {t('original_post_by')} {post.user_username}
                </Text>
                <Text style={[styles.sharedPreviewText, { color: palette.text }]} numberOfLines={2}>
                  {post.content}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.shareButton, { backgroundColor: palette.accent }]}
                onPress={submitShare}
              >
                <Text style={styles.shareButtonText}>{t('share')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  postWrapper: {
    marginBottom: 0,
    position: 'relative',
  },
  container: {
    borderRadius: 0,
    overflow: 'hidden',
    borderBottomWidth: 0.4,
    position: 'relative',
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  gradientLine: {
    height: 0,
    width: '100%',
  },
  header: {
    padding : 10,
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
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
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
    borderColor: '#080f19',
  },
  streakText: {
    color: '#FFFFFF',
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
  // Post type badge styles
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
  achievementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  achievementPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  achievementText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 0,
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 0, // Reduced margin between text and cards
  },
  programCardContainer: {
    marginTop: 0, // Reduced margin between text and program card
  },
  workoutLogContainer: {
    marginTop: 0, // Reduced margin between text and workout log
  },
  groupWorkoutContainer: {
    marginTop: 0,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginTop: 8, // Reduced margin
  },
  sharedPostContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8, // Reduced margin
    borderWidth: 1,
  },
  sharedPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sharedPostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  sharedPostAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  sharedPostAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sharedPostUsername: {
    fontSize: 14,
    fontWeight: '600',
    paddingRight: 8,
  },
  sharedPostDate: {
    fontSize: 12,
  },
  sharedPostContent: {
    fontSize: 14,
    marginBottom: 12,
  },
  sharedPostImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8, // Reduced margin
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 0,
    // borderBottomWidth: 0.4,
    paddingVertical: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
  },
  likedText: {
    color: '#F87171',
  },
  disabledText: {
    color: '#6B7280',
  },
  // Likers section - New styles
  likersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  likersAvatarsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  likerAvatarWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#111827',
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
  commentInputContainer: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  commentInputAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  commentInputAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  commentInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendButton: {
    padding: 8,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  commentsContainer: {
    padding: 8,
    paddingTop: 0,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  commentAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  commentAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  commentBubble: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentDate: {
    fontSize: 10,
  },
  commentContent: {
    fontSize: 14,
  },
  noCommentsText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  shareModalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Edit Post styles
  editContainer: {
    marginBottom: 16,
  },
  editInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    borderWidth: 1,
    marginBottom: 12,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  deleteText: {
    color: '#EF4444',
  },
  sharedPostUserInfo: {
    flex: 1,
  },
  sharedPostAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});

export default Post;