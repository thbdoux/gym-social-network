// components/feed/Post.tsx
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  onForkProgram
}) => {
  const { t } = useLanguage();
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareText, setShareText] = useState('');
  
  // Get post type details
  const getPostTypeDetails = (type: string = 'regular') => {
    switch(type) {
      case 'program':
        return {
          icon: 'barbell',
          label: t('program'),
          colors: { 
            bg: 'rgba(124, 58, 237, 0.2)',
            text: '#A78BFA',
            border: 'rgba(124, 58, 237, 0.3)'
          }
        };
      case 'workout_log':
        return {
          icon: 'fitness',
          label: t('workout_log'),
          colors: { 
            bg: 'rgba(16, 185, 129, 0.2)',
            text: '#34D399',
            border: 'rgba(16, 185, 129, 0.3)'
          }
        };
      case 'workout_invite':
        return {
          icon: 'people',
          label: t('workout_invite'),
          colors: { 
            bg: 'rgba(249, 115, 22, 0.2)',
            text: '#FB923C',
            border: 'rgba(249, 115, 22, 0.3)'
          }
        };
      default:
        return {
          icon: 'create',
          label: t('regular'),
          colors: { 
            bg: 'rgba(59, 130, 246, 0.2)',
            text: '#60A5FA',
            border: 'rgba(59, 130, 246, 0.3)'
          }
        };
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
  
  // Determine what type of post this is
  const effectivePostType = (post.is_share && post.original_post_details?.post_type) 
    ? post.original_post_details.post_type 
    : post.post_type || 'regular';
  
  const postTypeDetails = getPostTypeDetails(effectivePostType);
  
  const SharedPostContent = ({ originalPost }: { originalPost: any }) => {
    // Get post type details for the original post
    const originalPostTypeDetails = getPostTypeDetails(originalPost.post_type);
    
    return (
      <View style={styles.sharedPostContainer}>
        <View style={styles.sharedPostHeader}>
          <View style={styles.sharedPostAvatar}>
            <Text style={styles.sharedPostAvatarText}>
              {originalPost.user_username?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          
          <View>
            <Text style={styles.sharedPostUsername}>{originalPost.user_username}</Text>
            <Text style={styles.sharedPostDate}>
              {new Date(originalPost.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.sharedPostContent}>{originalPost.content}</Text>
        
        {/* Use WorkoutLogCard for workout logs */}
        {originalPost.post_type === 'workout_log' && originalPost.workout_log_details && (
          <WorkoutLogCard
            user={currentUser}
            logId={originalPost.workout_log}
            log={originalPost.workout_log_details}
            inFeedMode={true}
          />
        )}
        
        {/* Use ProgramCard for programs */}
        {originalPost.post_type === 'program' && originalPost.program_details && (
          <ProgramCard 
            programId={originalPost.program_id || originalPost.program}
            program={originalPost.program_details}
            inFeedMode={true}
            currentUser={currentUser}
            onFork={onForkProgram}
          />
        )}
        
        {/* Original Post Image */}
        {originalPost.image && (
          <Image
            source={{ uri: originalPost.image }}
            style={styles.sharedPostImage}
            resizeMode="cover"
          />
        )}
      </View>
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
                  {new Date(comment.created_at).toLocaleDateString()}
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
  
  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <View style={styles.authorContainer}>
          <View style={styles.avatar}>
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
          
          <View style={styles.authorInfo}>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName}>{post.user_username}</Text>
              
              {post.is_share && (
                <Text style={styles.sharedLabel}>{t('shared_a_post')}</Text>
              )}
              
              {post.post_type && (
                <View style={[styles.postTypeBadge, { backgroundColor: postTypeDetails.colors.bg }]}>
                  <Ionicons name={postTypeDetails.icon} size={12} color={postTypeDetails.colors.text} />
                  <Text style={[styles.postTypeText, { color: postTypeDetails.colors.text }]}>
                    {postTypeDetails.label}
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={styles.postDate}>
              {new Date(post.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowMenu(!showMenu)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
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
      
      {/* Post Content */}
      <View style={styles.content}>
        {post.content && <Text style={styles.postText}>{post.content}</Text>}
        
        {/* Program Card */}
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
          <SharedPostContent originalPost={post.original_post_details} />
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
      
      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onLike(post.id)}
        >
          <Ionicons 
            name={post.is_liked ? "heart" : "heart-outline"} 
            size={24} 
            color={post.is_liked ? "#EF4444" : "#9CA3AF"} 
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
          <Ionicons name="chatbubble-outline" size={22} color="#9CA3AF" />
          <Text style={styles.actionText}>{post.comments_count || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleShare}
          disabled={post.is_share}
        >
          <Ionicons 
            name="share-social-outline" 
            size={22} 
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
      {showCommentInput && <Comments />}
      
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
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 8,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  sharedLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  postTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 8,
  },
  postTypeText: {
    fontSize: 10,
    marginLeft: 4,
  },
  postDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  menuPopup: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#1F2937',
    borderRadius: 8,
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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postText: {
    fontSize: 16,
    color: '#E5E7EB',
    lineHeight: 24,
    marginBottom: 16,
  },
  programCardContainer: {
    marginTop: 12,
  },
  workoutLogContainer: {
    marginTop: 12,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginTop: 12,
  },
  sharedPostContainer: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
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
    marginTop: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.5)',
    padding: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#9CA3AF',
  },
  likedText: {
    color: '#EF4444',
  },
  disabledText: {
    color: '#6B7280',
  },
  commentInputContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.5)',
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
    backgroundColor: '#374151',
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
    backgroundColor: '#374151',
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
    backgroundColor: '#1F2937',
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
    backgroundColor: '#111827',
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
    backgroundColor: '#111827',
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