// components/feed/Post.tsx
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useLanguage } from '../../context/LanguageContext';
import WorkoutLogCard from '../workouts/WorkoutLogCard';
import ProgramCard from '../workouts/ProgramCard';

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
  original_post_details?: any; // This could be a more specific type
  image?: string;
  program_id?: number;
  program_details?: any;
  workout_log?: number;
  workout_log_details?: any;
  user_username: string;
  user_id?: number;
  // New fields for the updated design
  streak?: number;
  achievements?: string[];
  stats?: {
    totalWorkouts?: number;
    thisWeek?: number;
    streak?: number;
  };
  personality?: string; // Added personality field for avatar gradient
}

interface PostProps {
  post: Post;
  currentUser: string;
  onLike: (postId: number) => void;
  onComment: (postId: number, content: string) => void;
  onShare?: (postId: number, content: string) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: number) => void;
  userData?: any;
  onProgramClick?: (program: any) => void;
  onForkProgram?: (programId: number) => Promise<any>;
  onProfileClick?: (userId: number) => void;
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
  onForkProgram,
  onProfileClick,
  detailMode,
  onPostClick  
}) => {
  const { t } = useLanguage();
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareText, setShareText] = useState('');
  const [liked, setLiked] = useState(post.is_liked);

  // Format date to display relative time for recent dates
  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Get post type details including colors for gradient
  const getPostTypeDetails = (type: string = 'regular') => {
    switch(type) {
      case 'program':
        return {
          icon: 'barbell',
          label: t('program'),
          colors: { 
            bg: 'rgba(124, 58, 237, 0.2)',
            text: '#A78BFA',
            border: 'rgba(124, 58, 237, 0.3)',
            gradient: ['#9333EA', '#D946EF']
          }
        };
      case 'workout_log':
        return {
          icon: 'fitness',
          label: t('workout_log'),
          colors: { 
            bg: 'rgba(16, 185, 129, 0.2)',
            text: '#34D399',
            border: 'rgba(16, 185, 129, 0.3)',
            gradient: ['#059669', '#10B981']
          }
        };
      case 'workout_invite':
        return {
          icon: 'people',
          label: t('workout_invite'),
          colors: { 
            bg: 'rgba(249, 115, 22, 0.2)',
            text: '#FB923C',
            border: 'rgba(249, 115, 22, 0.3)',
            gradient: ['#EA580C', '#F97316']
          }
        };
      default:
        return {
          icon: 'create',
          label: t('regular'),
          colors: { 
            bg: 'rgba(59, 130, 246, 0.2)',
            text: '#60A5FA',
            border: 'rgba(59, 130, 246, 0.3)',
            gradient: ['#6366F1', '#3B82F6']
          }
        };
    }
  };

  // Get avatar gradient colors based on user personality
  const getPersonalityGradient = () => {
    const personality = post.personality || 'default';
    
    switch(personality.toLowerCase()) {
      case 'optimizer':
        return ['#F59E0B', '#EF4444']; // Amber to Red
      case 'diplomate':
        return ['#10B981', '#3B82F6']; // Emerald to Blue
      case 'mentor':
        return ['#6366F1', '#4F46E5']; // Indigo to Dark Indigo
      case 'versatile':
        return ['#EC4899', '#8B5CF6']; // Pink to Purple
      default:
        return ['#9333EA', '#D946EF']; // Default Purple Gradient
    }
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

  const handlePostClick = () => {
    // Only navigate if we're not in detail mode and a handler is provided
    if (!detailMode && onPostClick) {
      onPostClick(post.id);
    }
  };

  const handleOriginalPostClick = (originalPostId: number) => {
    if (onPostClick) {
      onPostClick(originalPostId);
    }
  };
  
  const handleDeletePost = () => {
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
            setShowMenu(false);
          }
        }
      ]
    );
  };

  const handleLike = () => {
    setLiked(!liked);
    onLike(post.id);
  };
  
  // Determine what type of post this is
  const effectivePostType = (post.is_share && post.original_post_details?.post_type) 
    ? post.original_post_details.post_type 
    : post.post_type || 'regular';
  
  const postTypeDetails = getPostTypeDetails(effectivePostType);
  
  const SharedPostContent = ({ 
    originalPost, 
    onOriginalPostClick 
  }: { 
    originalPost: any,
    onOriginalPostClick?: (postId: number) => void 
  }) => {
    // Get post type details for the original post
    const originalPostTypeDetails = getPostTypeDetails(originalPost.post_type);
    
    // Add a handler for clicking on the shared post content
    const handleOriginalPostClick = () => {
      if (onOriginalPostClick && originalPost.id) {
        onOriginalPostClick(originalPost.id);
      }
    };
    
    return (
      <TouchableOpacity 
        style={styles.sharedPostContainer}
        onPress={handleOriginalPostClick}
        activeOpacity={0.7}
      >
        <View style={styles.sharedPostHeader}>
          <TouchableOpacity 
            style={styles.sharedPostAvatar}
            onPress={() => originalPost.user_id && onProfileClick && onProfileClick(originalPost.user_id)}
            activeOpacity={0.7}
          >
            <Text style={styles.sharedPostAvatarText}>
              {originalPost.user_username?.[0]?.toUpperCase() || '?'}
            </Text>
          </TouchableOpacity>
          
          <View>
            <Text style={styles.sharedPostUsername}>{originalPost.user_username}</Text>
            <Text style={styles.sharedPostDate}>
              {formatDate(originalPost.created_at)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.sharedPostContent}>{originalPost.content}</Text>
        
        {/* Keep the rest of the component the same */}
        {originalPost.post_type === 'workout_log' && originalPost.workout_log_details && (
          <WorkoutLogCard
            user={currentUser}
            logId={originalPost.workout_log}
            log={originalPost.workout_log_details}
            inFeedMode={true}
          />
        )}
        
        {originalPost.post_type === 'program' && originalPost.program_details && (
          <ProgramCard 
            programId={originalPost.program_id || originalPost.program}
            program={originalPost.program_details}
            inFeedMode={true}
            currentUser={currentUser}
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
      {(post.comments && post.comments.length > 0) ? (
        post.comments.map(comment => (
          <View key={comment.id} style={styles.commentItem}>
            <View style={styles.commentAvatar}>
              <Text style={styles.commentAvatarText}>
                {comment.user_username?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            
            <View style={styles.commentBubble}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentUsername}>
                  {comment.user_username}
                </Text>
                <Text style={styles.commentDate}>
                  {formatDate(comment.created_at)}
                </Text>
              </View>
              <Text style={styles.commentContent}>{comment.content}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noCommentsText}>{t('no_comments')}</Text>
      )}
    </View>
  );

  // Get user streak to display on avatar
  const userStreak = post.streak || post.stats?.streak || 0;
  
  // Mock badges based on user activity
  const mockBadges = [
    { id: 1, name: "20-Day Streak", icon: "flame", color: ["#F59E0B", "#EF4444"] },
    { id: 2, name: "Power Lifter", icon: "barbell", color: ["#DC2626", "#7F1D1D"] },
    { id: 3, name: "Early Bird", icon: "sunny", color: ["#F59E0B", "#FBBF24"] },
    { id: 4, name: "Yoga Master", icon: "body", color: ["#10B981", "#3B82F6"] },
    { id: 5, name: "Weekend Warrior", icon: "trophy", color: ["#6366F1", "#4F46E5"] },
    { id: 6, name: "Community Coach", icon: "people", color: ["#EC4899", "#8B5CF6"] },
  ];
  
  // Determine which badges to show (either from post or mocked)
  const badgesToShow = post.achievements && post.achievements.length > 0 
    ? post.achievements.map(name => {
        const foundBadge = mockBadges.find(b => b.name === name);
        return foundBadge || { 
          id: Math.random(), 
          name, 
          icon: "trophy", 
          color: ["#9333EA", "#D946EF"] 
        };
      })
    : [mockBadges[0], mockBadges[Math.floor(Math.random() * (mockBadges.length - 1)) + 1]];
  
  // Get stats for the activity stats bar
  const stats = {
    totalWorkouts: post.stats?.totalWorkouts || 0,
    thisWeek: post.stats?.thisWeek || 0,
    streak: userStreak || 0
  };
  
  // Get personality-based gradient for avatar
  const avatarGradientColors = getPersonalityGradient();
  
  // Check if post is workout related
  const isWorkoutRelated = post.post_type === 'workout_log' || post.post_type === 'program';
  
  return (
    <TouchableOpacity 
      activeOpacity={detailMode ? 1 : 0.7}
      onPress={handlePostClick}
      disabled={detailMode}
      style={styles.postWrapper}
    >
      <View style={styles.container}>
        {/* Blur effect background */}
        <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
        
        {/* Glow effect for premium posts */}
        <View style={styles.glowEffect} />
        
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
            {/* User Avatar with Activity Ring */}
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={avatarGradientColors}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.avatarInner}>
                  {userData?.avatar ? (
                    <Image
                      source={{ uri: userData.avatar }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {post.user_username?.[0]?.toUpperCase() || '?'}
                    </Text>
                  )}
                </View>
              </LinearGradient>
              
              {/* Streak indicator */}
              {userStreak > 0 && (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>{userStreak}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>{post.user_username}</Text>
                
                {post.is_share && (
                  <Text style={styles.sharedLabel}>{t('shared_a_post')}</Text>
                )}
              </View>
              
              <Text style={styles.postDate}>
                @{post.user_username} • {formatDate(post.created_at)}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setShowMenu(!showMenu)}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        
        {/* Post Menu */}
        {showMenu && (
          <View style={styles.menuPopup}>
            {post.user_username === currentUser && (
              <>
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    if (onEdit) onEdit(post);
                    setShowMenu(false);
                  }}
                >
                  <Ionicons name="create-outline" size={20} color="#E5E7EB" />
                  <Text style={styles.menuItemText}>{t('edit_post')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={handleDeletePost}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  <Text style={[styles.menuItemText, styles.deleteText]}>{t('delete_post')}</Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => setShowMenu(false)}
            >
              <Ionicons name="close-outline" size={20} color="#E5E7EB" />
              <Text style={styles.menuItemText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Achievement Pills */}
        {badgesToShow.length > 0 && (
          <View style={styles.achievementsContainer}>
            {badgesToShow.map((badge, index) => (
              <LinearGradient
                key={index}
                colors={badge.color}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.achievementPill}
              >
                <Ionicons name={badge.icon} size={12} color="#FFFFFF" />
                <Text style={styles.achievementText}>{badge.name}</Text>
              </LinearGradient>
            ))}
          </View>
        )}
        
        {/* Post Content */}
        <View style={styles.content}>
          {post.content && <Text style={styles.postText}>{post.content}</Text>}
          
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
              />
            </View>
          )}
          
          {/* Shared Post */}
          {post.is_share && post.original_post_details && (
            <SharedPostContent 
              originalPost={post.original_post_details} 
              onOriginalPostClick={handleOriginalPostClick}
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
        </View>
        
        {/* Activity Stats Bar - Only show for workout related posts */}
        {isWorkoutRelated && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Ionicons name="bar-chart" size={14} color="#A78BFA" />
              <Text style={styles.statText}>{stats.totalWorkouts} workouts</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="flash" size={14} color="#FBBF24" />
              <Text style={styles.statText}>{stats.thisWeek} this week</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="flash" size={14} color="#F87171" />
              <Text style={styles.statText}>{stats.streak} day streak</Text>
            </View>
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLike}
          >
            <Ionicons 
              name={post.is_liked ? "heart" : "heart-outline"} 
              size={20} 
              color={post.is_liked ? "#F87171" : "#9CA3AF"} 
            />
            <Text 
              style={[
                styles.actionText, 
                post.is_liked && styles.likedText
              ]}
            >
              {post.likes_count || 0}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowCommentInput(!showCommentInput)}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#9CA3AF" />
            <Text style={styles.actionText}>{post.comments_count || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShare}
            disabled={post.is_share}
          >
            <Ionicons 
              name="share-social-outline" 
              size={20} 
              color={post.is_share ? "#6B7280" : "#9CA3AF"} 
            />
            <Text 
              style={[
                styles.actionText, 
                post.is_share && styles.disabledText
              ]}
            >
              {post.shares_count || 0}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Comment Input */}
        {showCommentInput && (
          <View style={styles.commentInputContainer}>
            <View style={styles.commentInputAvatar}>
              <Text style={styles.commentInputAvatarText}>
                {currentUser?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            
            <View style={styles.commentInputWrapper}>
              <TextInput
                style={styles.commentInput}
                placeholder={t('write_a_comment')}
                placeholderTextColor="#9CA3AF"
                value={commentText}
                onChangeText={setCommentText}
              />
              
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  !commentText.trim() && styles.sendButtonDisabled
                ]}
                onPress={() => {
                  if (commentText.trim()) {
                    onComment(post.id, commentText);
                    setCommentText('');
                  }
                }}
                disabled={!commentText.trim()}
              >
                <Ionicons 
                  name="send" 
                  size={18} 
                  color={commentText.trim() ? "#60A5FA" : "#6B7280"} 
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
            <View style={styles.shareModalContent}>
              <View style={styles.shareModalHeader}>
                <Text style={styles.shareModalTitle}>{t('share_post')}</Text>
                <TouchableOpacity onPress={() => setIsShareModalOpen(false)}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.shareInput}
                placeholder={t('add_your_thoughts')}
                placeholderTextColor="#9CA3AF"
                multiline
                value={shareText}
                onChangeText={setShareText}
              />
              
              <View style={styles.sharedPostPreview}>
                <Text style={styles.sharedLabel}>
                  {t('original_post_by')} {post.user_username}
                </Text>
                <Text style={styles.sharedPreviewText} numberOfLines={2}>
                  {post.content}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.shareButton}
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
    marginBottom: 16,
    position: 'relative',
  },
  container: {
    backgroundColor: 'rgba(17, 24, 39, 0.9)', // More transparent background for blur effect
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
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
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    borderRadius: 24,
  },
  gradientLine: {
    height: 2,
    width: '100%',
  },
  header: {
    padding: 20,
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
    backgroundColor: '#3B82F6',
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
    backgroundColor: '#9333EA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#111827',
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
    color: '#FFFFFF',
    marginRight: 8,
  },
  sharedLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  postDate: {
    fontSize: 13,
    color: '#9CA3AF',
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
  menuPopup: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.5)',
  },
  menuItemText: {
    fontSize: 14,
    color: '#E5E7EB',
    marginLeft: 8,
  },
  deleteText: {
    color: '#EF4444',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  postText: {
    fontSize: 16,
    color: '#E5E7EB',
    lineHeight: 24,
    marginBottom: 8, // Reduced margin between text and cards
  },
  programCardContainer: {
    marginTop: 8, // Reduced margin between text and program card
  },
  workoutLogContainer: {
    marginTop: 8, // Reduced margin between text and workout log
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginTop: 8, // Reduced margin
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#D1D5DB',
    marginLeft: 6,
  },
  sharedPostContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8, // Reduced margin
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
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
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sharedPostAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sharedPostUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sharedPostDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  sharedPostContent: {
    fontSize: 14,
    color: '#D1D5DB',
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
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.3)',
    paddingVertical: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#9CA3AF',
  },
  likedText: {
    color: '#F87171',
  },
  disabledText: {
    color: '#6B7280',
  },
  commentInputContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.3)',
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    backgroundColor: '#1F2937',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFFFFF',
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
    padding: 16,
    paddingTop: 8,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  commentBubble: {
    flex: 1,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
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
    color: '#FFFFFF',
  },
  commentDate: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  commentContent: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  noCommentsText: {
    fontSize: 14,
    color: '#9CA3AF',
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
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.5)',
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  shareInput: {
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 100,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  sharedPostPreview: {
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  sharedLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  sharedPreviewText: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Post;