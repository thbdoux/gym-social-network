// components/feed/Post.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

interface PostProps {
  post: any;
  currentUser: string;
  onLike: (postId: number) => void;
  onComment: (postId: number, content: string) => void;
  onShare: (postId: number, content: string) => void;
  onEdit?: (post: any) => void;
  onDelete?: (postId: number) => void;
}

const Post: React.FC<PostProps> = ({
  post,
  currentUser,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareText, setShareText] = useState('');

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleLike = () => {
    onLike(post.id);
  };

  const handleComment = () => {
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  const handleShare = () => {
    if (post.is_share) {
      Alert.alert('Info', 'Shared posts cannot be shared again');
      return;
    }
    
    setShareModalVisible(true);
  };

  const submitShare = () => {
    onShare(post.id, shareText);
    setShareText('');
    setShareModalVisible(false);
  };

  const handleDeletePost = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(post.id);
            }
            setMenuVisible(false);
          }
        }
      ]
    );
  };

  // Determine post type and set appropriate colors
  const getPostTypeDetails = (type = 'regular') => {
    switch (type) {
      case 'program':
        return {
          icon: 'barbell',
          label: 'Program',
          colors: { 
            bg: 'rgba(124, 58, 237, 0.2)',
            text: '#A78BFA'
          }
        };
      case 'workout_log':
        return {
          icon: 'fitness',
          label: 'Workout',
          colors: { 
            bg: 'rgba(16, 185, 129, 0.2)',
            text: '#6EE7B7'
          }
        };
      default:
        return {
          icon: 'create',
          label: 'Post',
          colors: { 
            bg: 'rgba(59, 130, 246, 0.2)',
            text: '#93C5FD'
          }
        };
    }
  };

  const postTypeDetails = getPostTypeDetails(post.post_type);

  // Render the original shared post if this is a shared post
  const SharedPostContent = ({ originalPost }) => {
    if (!originalPost) return null;
    
    const originalPostType = getPostTypeDetails(originalPost.post_type);
    
    return (
      <View style={styles.sharedPostContainer}>
        <View style={styles.sharedPostHeader}>
          <View style={styles.avatarContainer}>
            {originalPost.author?.profile_picture ? (
              <Image
                source={{ uri: originalPost.author.profile_picture }}
                style={styles.smallAvatar}
              />
            ) : (
              <View style={[styles.smallAvatarPlaceholder, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.smallAvatarText}>
                  {getInitials(originalPost.author?.username || originalPost.user_username)}
                </Text>
              </View>
            )}
          </View>
          <View>
            <Text style={styles.sharedUsername}>
              {originalPost.author?.username || originalPost.user_username}
            </Text>
            <Text style={styles.sharedDate}>
              {formatDate(originalPost.created_at)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.sharedContent}>{originalPost.content}</Text>
        
        {originalPost.image && (
          <Image
            source={{ uri: originalPost.image }}
            style={styles.sharedImage}
            resizeMode="cover"
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <View style={styles.authorContainer}>
          <View style={styles.avatarContainer}>
            {post.author?.profile_picture ? (
              <Image
                source={{ uri: post.author.profile_picture }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, {
                backgroundColor: post.post_type === 'program' ? '#8B5CF6' :
                                post.post_type === 'workout_log' ? '#10B981' : '#3B82F6'
              }]}>
                <Text style={styles.avatarText}>
                  {getInitials(post.author?.username || post.user_username)}
                </Text>
              </View>
            )}
          </View>
          
          <View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>
                {post.author?.username || post.user_username}
              </Text>
              
              {post.is_share && (
                <Text style={styles.sharedLabel}>shared a post</Text>
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
            
            <Text style={styles.postDate}>{formatDate(post.created_at)}</Text>
          </View>
        </View>
        
        {post.user_username === currentUser && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuVisible(!menuVisible)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Post Content */}
      <View style={styles.content}>
        {post.content && <Text style={styles.postText}>{post.content}</Text>}
        
        {/* Original post content if this is a shared post */}
        {post.is_share && post.original_post_details && (
          <SharedPostContent originalPost={post.original_post_details} />
        )}
        
        {/* Regular post image */}
        {!post.is_share && post.image && (
          <Image
            source={{ uri: post.image }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}
      </View>
      
      {/* Post Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons
            name={post.is_liked ? "heart" : "heart-outline"}
            size={24}
            color={post.is_liked ? "#EF4444" : "#9CA3AF"}
          />
          <Text style={[styles.actionText, post.is_liked && styles.likedText]}>
            {post.likes_count || 0}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowCommentInput(!showCommentInput)}
        >
          <Ionicons name="chatbubble-outline" size={22} color="#9CA3AF" />
          <Text style={styles.actionText}>
            {post.comments?.length || post.comments_count || 0}
          </Text>
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
          <Text style={[styles.actionText, post.is_share && styles.disabledText]}>
            {post.shares_count || 0}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Comments Section */}
      {showCommentInput && (
        <View style={styles.commentsSection}>
          <View style={styles.commentInputContainer}>
            <View style={styles.avatarContainer}>
              {user?.profile_picture ? (
                <Image
                  source={{ uri: user.profile_picture }}
                  style={styles.smallAvatar}
                />
              ) : (
                <View style={styles.smallAvatarPlaceholder}>
                  <Text style={styles.smallAvatarText}>
                    {getInitials(currentUser)}
                  </Text>
                </View>
              )}
            </View>
            
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor="#9CA3AF"
              value={commentText}
              onChangeText={setCommentText}
            />
            
            <TouchableOpacity 
              style={[styles.sendButton, !commentText.trim() && styles.disabledSendButton]}
              onPress={handleComment}
              disabled={!commentText.trim()}
            >
              <Ionicons 
                name="send" 
                size={18} 
                color={commentText.trim() ? "#3B82F6" : "#6B7280"} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Comments List */}
          {post.comments && post.comments.length > 0 && (
            <View style={styles.commentsList}>
              {post.comments.map(comment => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.avatarContainer}>
                    {comment.author?.profile_picture ? (
                      <Image
                        source={{ uri: comment.author.profile_picture }}
                        style={styles.smallAvatar}
                      />
                    ) : (
                      <View style={styles.smallAvatarPlaceholder}>
                        <Text style={styles.smallAvatarText}>
                          {getInitials(comment.author?.username || comment.user_username)}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.commentContent}>
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentAuthor}>
                        {comment.author?.username || comment.user_username}
                      </Text>
                      <Text style={styles.commentText}>{comment.content}</Text>
                    </View>
                    <Text style={styles.commentDate}>
                      {formatDate(comment.created_at)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
      
      {/* Options Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            {onEdit && (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  onEdit(post);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#E5E7EB" />
                <Text style={styles.menuItemText}>Edit Post</Text>
              </TouchableOpacity>
            )}
            
            {onDelete && (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleDeletePost}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={[styles.menuItemText, styles.deleteText]}>Delete Post</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Share Modal */}
      <Modal
        visible={shareModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.shareModalContent}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Share Post</Text>
              <TouchableOpacity
                onPress={() => setShareModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.shareUserInfo}>
              <View style={styles.avatarContainer}>
                {user?.profile_picture ? (
                  <Image
                    source={{ uri: user.profile_picture }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {getInitials(currentUser)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.shareUsername}>{currentUser}</Text>
            </View>
            
            <TextInput
              style={styles.shareInput}
              placeholder="Add a comment..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={shareText}
              onChangeText={setShareText}
              autoFocus
            />
            
            <View style={styles.sharedPostPreview}>
              <Text style={styles.sharedLabel}>Original post by {post.author?.username || post.user_username}</Text>
              <Text style={styles.sharedPreviewText} numberOfLines={2}>{post.content}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.shareButton}
              onPress={submitShare}
            >
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  smallAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  smallAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  postTypeText: {
    fontSize: 10,
    color: '#93C5FD',
    marginLeft: 2,
  },
  postDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  menuButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  content: {
    padding: 12,
    paddingTop: 0,
  },
  postText: {
    fontSize: 15,
    color: '#E5E7EB',
    marginBottom: 12,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  sharedPostContainer: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sharedPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sharedUsername: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sharedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  sharedContent: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 8,
  },
  sharedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    padding: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  commentsSection: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledSendButton: {
    opacity: 0.5,
  },
  commentsList: {
    marginTop: 16,
    gap: 12,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  commentDate: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: 200,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  menuItemText: {
    marginLeft: 8,
    color: '#E5E7EB',
    fontSize: 16,
  },
  deleteText: {
    color: '#EF4444',
  },
  shareModalContent: {
    width: '90%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  shareUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  shareUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  shareInput: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sharedPostPreview: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sharedPreviewText: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Post;