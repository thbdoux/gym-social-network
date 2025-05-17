// components/feed/CommentSection.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  Pressable,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarUrl } from '../../utils/imageUtils';
import { 
  useCommentOnPost, 
  useEditComment, 
  useDeleteComment,
  useReactToComment,
  useUnreactToComment
} from '../../hooks/query/usePostQuery';

export interface Comment {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user_username: string;
  user_id: number;
  user_profile_picture?: string;
  reactions_count: number;
  reactions: {
    id: number;
    reaction_type: string;
    user_username: string;
    user_id: number;
  }[];
  replies: Comment[];
  replies_count: number;
  mentioned_users: { id: number; username: string }[];
  is_edited: boolean;
  parent?: number;
}

interface CommentSectionProps {
  postId: number;
  comments: Comment[];
  userData: any;
  onNavigateToProfile?: (userId: number) => void;
  onProfileClick?: (userId: number) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments,
  userData,
  onNavigateToProfile,
  onProfileClick
}) => {
  const { t } = useLanguage();
  const { palette } = useTheme();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<number[]>([]);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [longPressedComment, setLongPressedComment] = useState<number | null>(null);
  // Add the missing state for reaction panel
  const [reactionPanelVisible, setReactionPanelVisible] = useState<number | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Add a separate animation value for border highlight that doesn't use native driver
  const borderAnim = useRef(new Animated.Value(0)).current;

  const { mutate: commentOnPost } = useCommentOnPost();
  const { mutate: editComment } = useEditComment();
  const { mutate: deleteComment } = useDeleteComment();
  const { mutate: reactToComment } = useReactToComment();
  const { mutate: unreactToComment } = useUnreactToComment();

  // Format time as "x min ago", "x hr ago", etc.
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSec < 60) {
      return t('just_now');
    } else if (diffMin < 60) {
      return `${diffMin}${t('min_ago')}`;
    } else if (diffHr < 24) {
      return `${diffHr}${t('hr_ago')}`;
    } else if (diffDays < 7) {
      return `${diffDays}${t('d_ago')}`;
    } else if (diffWeeks < 4) {
      return `${diffWeeks}${t('w_ago')}`;
    } else if (diffMonths < 12) {
      return `${diffMonths}${t('mo_ago')}`;
    } else {
      return `${diffYears}${t('y_ago')}`;
    }
  };

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      commentOnPost({
        postId: postId, 
        content: commentText
      }, {
        onSuccess: () => {
          setCommentText('');
        }
      });
    }
  };

  const handleReplySubmit = () => {
    if (replyText.trim() && replyingTo) {
      // Include the @username mention in the reply
      const replyContent = `@${replyingTo.user_username} ${replyText}`;
      
      commentOnPost({
        postId: postId, 
        content: replyContent,
        parentId: replyingTo.id
      }, {
        onSuccess: () => {
          setReplyText('');
          setReplyingTo(null);
          // Auto-expand replies when a new reply is added
          if (!expandedReplies.includes(replyingTo.id)) {
            setExpandedReplies([...expandedReplies, replyingTo.id]);
          }
        }
      });
    }
  };

  const handleEditCommentSubmit = () => {
    if (editCommentText.trim() && editingComment) {
      editComment({
        postId: postId,
        commentId: editingComment.id,
        content: editCommentText
      }, {
        onSuccess: () => {
          setEditingComment(null);
          setEditCommentText('');
        }
      });
    }
  };
  
  const handleDeleteComment = (comment: Comment) => {
    deleteComment({
      postId: postId,
      commentId: comment.id,
      parentId: comment.parent
    });
    setActionMenuVisible(false);
  };

  const handleReactToComment = (comment: Comment, reactionType: string) => {
    // Check if user already has this reaction
    const currentUserReaction = comment.reactions.find(
      r => r.user_id === userData?.id && r.reaction_type === reactionType
    );
    
    if (currentUserReaction) {
      // Remove the reaction if it's the same type
      unreactToComment({
        postId: postId,
        commentId: comment.id,
        parentId: comment.parent,
        userId: userData?.id
      });
    } else {
      // Add or change the reaction
      reactToComment({
        postId: postId,
        commentId: comment.id,
        reactionType,
        parentId: comment.parent
      });
    }
    
    // Hide reaction panel after selection
    setReactionPanelVisible(null);
  };

  const handleLongPressComment = (comment: Comment) => {
    setSelectedComment(comment);
    setLongPressedComment(comment.id);
    setActionMenuVisible(true);
    
    // Animate the hover effect
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true
    }).start();
    
    // Animate the border effect separately without native driver
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false
    }).start();
    
    // Animate the action menu
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 5
    }).start();
  };

  const handleCloseActionMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start();
    
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false
    }).start();
    
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => {
      setActionMenuVisible(false);
      setLongPressedComment(null);
      setSelectedComment(null);
    });
  };

  const toggleReplies = (commentId: number) => {
    if (expandedReplies.includes(commentId)) {
      setExpandedReplies(expandedReplies.filter(id => id !== commentId));
    } else {
      setExpandedReplies([...expandedReplies, commentId]);
    }
  };

  // Get total reaction count for a comment
  const getTotalReactions = (comment: Comment) => {
    return comment.reactions.length;
  };

  // Get dominant reaction types for display
  const getTopReactions = (comment: Comment) => {
    const reactionCounts = {};
    comment.reactions.forEach(reaction => {
      reactionCounts[reaction.reaction_type] = (reactionCounts[reaction.reaction_type] || 0) + 1;
    });
    
    return Object.entries(reactionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
  };

  // Map reaction type to emoji
  const getReactionEmoji = (type: string) => {
    switch (type) {
      case 'like': return '👍';
      case 'love': return '❤️';
      case 'laugh': return '😂';
      default: return '👍';
    }
  };

  const renderReactionPanel = (comment: Comment) => {
    if (reactionPanelVisible !== comment.id) return null;
    
    return (
      <Animated.View 
        style={[
          styles.reactionPanel,
          {
            transform: [{ scale: scaleAnim }],
            backgroundColor: palette.layout === '#F8F9FA' ? '#FFFFFF' : '#1F2937'
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.reactionOption}
          onPress={() => handleReactToComment(comment, 'like')}
        >
          <Text style={styles.reactionEmoji}>👍</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.reactionOption}
          onPress={() => handleReactToComment(comment, 'love')}
        >
          <Text style={styles.reactionEmoji}>❤️</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.reactionOption}
          onPress={() => handleReactToComment(comment, 'laugh')}
        >
          <Text style={styles.reactionEmoji}>😂</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isCurrentUserComment = comment.user_id === userData?.id;
    const hasUserReacted = comment.reactions.some(r => r.user_id === userData?.id);
    const userReactionType = comment.reactions.find(r => r.user_id === userData?.id)?.reaction_type;
    const topReactions = getTopReactions(comment);
    const totalReactions = getTotalReactions(comment);
    const isLongPressed = longPressedComment === comment.id;
    
    return (
      <View key={comment.id} style={[
        styles.commentItem,
        isReply && styles.replyItem
      ]}>
        <TouchableOpacity 
          style={styles.commentAvatar}
          onPress={() => {
            if (comment.user_id && onNavigateToProfile) {
              onNavigateToProfile(comment.user_id);
            } else if (comment.user_id && onProfileClick) {
              onProfileClick(comment.user_id);
            }
          }}
        >
          <Image 
            source={{ uri: getAvatarUrl(comment.user_profile_picture) }}
            style={styles.commentAvatarImage}
          />
        </TouchableOpacity>
        
        <View style={styles.commentContentContainer}>
          <TouchableWithoutFeedback
            onLongPress={() => handleLongPressComment(comment)}
            delayLongPress={200}
          >
            <View>
              <Animated.View style={[
                styles.commentBubble, 
                { backgroundColor: palette.layout === '#F8F9FA' ? '#F3F4F6' : 'rgba(31, 41, 55, 0.8)' },
                // Use opacity and scale which are compatible with native driver
                isLongPressed && {
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.95]
                  }),
                  transform: [
                    { scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0.98]
                      })
                    }
                  ]
                }
              ]}>
                {/* Use a separate non-animated border View when highlight is needed */}
                {isLongPressed && (
                  <Animated.View 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderColor: palette.accent,
                      borderWidth: borderAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.5]
                      }),
                      borderRadius: 18,
                      zIndex: -1
                    }}
                  />
                )}
                <View style={styles.commentHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      if (comment.user_id && onNavigateToProfile) {
                        onNavigateToProfile(comment.user_id);
                      } else if (comment.user_id && onProfileClick) {
                        onProfileClick(comment.user_id);
                      }
                    }}
                  >
                    <Text style={[styles.commentUsername, { color: palette.text }]}>
                      {comment.user_username}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {editingComment?.id === comment.id ? (
                  // Edit comment mode
                  <View style={styles.editCommentContainer}>
                    <TextInput
                      style={[styles.editCommentInput, { 
                        backgroundColor: palette.layout === '#F8F9FA' ? '#E2E8F0' : 'rgba(31, 41, 55, 0.6)',
                        borderColor: palette.accent,
                        color: palette.text 
                      }]}
                      value={editCommentText}
                      onChangeText={setEditCommentText}
                      multiline
                      placeholder={t('edit_your_comment')}
                      placeholderTextColor={palette.border}
                      autoFocus
                    />
                    <View style={styles.editCommentButtons}>
                      <TouchableOpacity 
                        style={[styles.editButton, styles.cancelButton, { borderColor: palette.border }]}
                        onPress={() => setEditingComment(null)}
                      >
                        <Text style={[styles.editButtonText, { color: palette.text }]}>
                          {t('cancel')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.editButton, styles.saveButton, { backgroundColor: palette.accent }]}
                        onPress={handleEditCommentSubmit}
                      >
                        <Text style={styles.saveButtonText}>{t('save')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  // Normal comment display
                  <Text style={[styles.commentContent, { color: palette.text }]}>
                    {comment.content}
                  </Text>
                )}
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
          
          {/* Render reaction panel for this comment */}
          {renderReactionPanel(comment)}
          
          {/* Comment actions row */}
          <View style={styles.commentActionsRow}>
            {/* Time display */}
            <Text style={[styles.commentTime, { color: palette.border }]}>
              {formatTimeAgo(comment.created_at)}
              {comment.is_edited && ` · ${t('edited')}`}
            </Text>

            {totalReactions > 0 && (
              <View style={[
                styles.reactionsDisplay,
                { backgroundColor: palette.layout === '#F8F9FA' ? '#FFFFFF' : '#374151' }
              ]}>
                <View style={styles.reactionIcons}>
                  {topReactions.map((type, index) => (
                    <Text key={index} style={styles.reactionIcon}>
                      {getReactionEmoji(type)}
                    </Text>
                  ))}
                </View>
                <Text style={[styles.reactionCount, { color: palette.border }]}>
                  {totalReactions}
                </Text>
              </View>
            )}
          </View>
          
          {/* Show/hide replies toggle */}
          {!isReply && comment.replies_count > 0 && (
            <TouchableOpacity 
              style={styles.showRepliesButton}
              onPress={() => toggleReplies(comment.id)}
            >
              <MaterialCommunityIcons 
                name={expandedReplies.includes(comment.id) ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={palette.accent} 
              />
              <Text style={[styles.showRepliesText, { color: palette.accent }]}>
                {expandedReplies.includes(comment.id) 
                  ? t('hide_replies') 
                  : t('view_replies', { count: comment.replies_count })}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Replies section */}
          {!isReply && expandedReplies.includes(comment.id) && comment.replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {comment.replies.map(reply => renderComment(reply, true))}
            </View>
          )}
          
          {/* Reply input if replying to this comment */}
          {replyingTo?.id === comment.id && (
            <View style={styles.replyInputContainer}>
              <View style={styles.replyInputAvatar}>
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
                  placeholder={t('reply_to', { username: comment.user_username })}
                  placeholderTextColor={palette.border}
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                  autoFocus
                />
                
                <TouchableOpacity 
                  style={[
                    styles.sendButton,
                    !replyText.trim() && styles.sendButtonDisabled
                  ]}
                  onPress={handleReplySubmit}
                  disabled={!replyText.trim()}
                >
                  <Ionicons 
                    name="send" 
                    size={18} 
                    color={replyText.trim() ? palette.accent : "#6B7280"} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Comment Input */}
      <View style={[styles.commentInputContainer, { borderTopColor: palette.border }]}>
        <View style={styles.commentInputAvatar}>
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
            multiline
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              !commentText.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleCommentSubmit}
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
      
      {/* Comments List */}
      <View style={styles.commentsContainer}>
        {comments.length > 0 ? (
          comments.map(comment => renderComment(comment))
        ) : (
          <Text style={[styles.noCommentsText, { color: palette.border }]}>
            {t('no_comments')}
          </Text>
        )}
      </View>
      
      <Modal
        animationType="none"
        transparent={true}
        visible={actionMenuVisible}
        onRequestClose={handleCloseActionMenu}
      >
        <TouchableWithoutFeedback onPress={handleCloseActionMenu}>
          <View style={styles.modalOverlay}>
            {selectedComment && (
              <View style={styles.actionMenuContainer}>
                {/* Reactions row */}
                <Animated.View 
                  style={[
                    styles.reactionsRow,
                    {
                      backgroundColor: palette.layout === '#F8F9FA' ? '#FFFFFF' : '#1F2937',
                      transform: [{ scale: scaleAnim }],
                      opacity: scaleAnim
                    }
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.reactionOption}
                    onPress={() => {
                      handleReactToComment(selectedComment, 'like');
                      handleCloseActionMenu();
                    }}
                  >
                    <Text style={styles.reactionEmoji}>👍</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.reactionOption}
                    onPress={() => {
                      handleReactToComment(selectedComment, 'love');
                      handleCloseActionMenu();
                    }}
                  >
                    <Text style={styles.reactionEmoji}>❤️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.reactionOption}
                    onPress={() => {
                      handleReactToComment(selectedComment, 'laugh');
                      handleCloseActionMenu();
                    }}
                  >
                    <Text style={styles.reactionEmoji}>😂</Text>
                  </TouchableOpacity>
                </Animated.View>
                
                {/* Actions menu */}
                <Animated.View 
                  style={[
                    styles.actionsMenu,
                    {
                      backgroundColor: palette.layout === '#F8F9FA' ? '#FFFFFF' : '#1F2937',
                      transform: [{ scale: scaleAnim }],
                      opacity: scaleAnim
                    }
                  ]}
                >
                  {/* Reply option - always visible */}
                  <TouchableOpacity
                    style={styles.actionOption}
                    onPress={() => {
                      setReplyingTo(selectedComment);
                      handleCloseActionMenu();
                    }}
                  >
                    <Ionicons name="return-down-forward" size={20} color={palette.text} />
                    <Text style={[styles.actionOptionText, { color: palette.text }]}>
                      {t('reply')}
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Edit option - only for comment owner */}
                  {selectedComment.user_id === userData?.id && (
                    <>
                      <View style={[styles.actionDivider, { backgroundColor: palette.border }]} />
                      <TouchableOpacity
                        style={styles.actionOption}
                        onPress={() => {
                          setEditingComment(selectedComment);
                          setEditCommentText(selectedComment.content);
                          handleCloseActionMenu();
                        }}
                      >
                        <Ionicons name="pencil" size={20} color={palette.text} />
                        <Text style={[styles.actionOptionText, { color: palette.text }]}>
                          {t('edit')}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {/* Delete option - only for comment owner */}
                  {selectedComment.user_id === userData?.id && (
                    <>
                      <View style={[styles.actionDivider, { backgroundColor: palette.border }]} />
                      <TouchableOpacity
                        style={styles.actionOption}
                        onPress={() => {
                          handleCloseActionMenu();
                          Alert.alert(
                            t('delete_comment'),
                            t('confirm_delete_comment'),
                            [
                              { text: t('cancel'), style: 'cancel' },
                              { 
                                text: t('delete'), 
                                style: 'destructive',
                                onPress: () => handleDeleteComment(selectedComment)
                              }
                            ]
                          );
                        }}
                      >
                        <Ionicons name="trash" size={20} color="#EF4444" />
                        <Text style={{ color: "#EF4444", fontSize: 16, marginLeft: 12 }}>
                          {t('delete')}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </Animated.View>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  commentInputContainer: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  commentInputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  commentInputAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
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
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    padding: 10,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  commentsContainer: {
    padding: 12,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '100%',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
    overflow: 'hidden',
  },
  commentAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  commentContentContainer: {
    flex: 1,
  },
  commentBubble: {
    maxWidth: '90%',
    borderRadius: 18,
    padding: 12,
    paddingTop: 8,
  },
  commentHeader: {
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 12,
    marginRight: 12,
  },
  reactionButton: {
    marginRight: 12,
  },
  reactionsDisplay: {
    position: 'absolute',
    right: 10,
    bottom: -10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    zIndex: 10,
  },
  reactionIcons: {
    flexDirection: 'row',
  },
  reactionIcon: {
    fontSize: 12,
    marginRight: -2,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  commentActionsRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginLeft: 2,
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeAction: {
    fontWeight: '600',
  },
  showRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 8,
  },
  showRepliesText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  repliesContainer: {
    marginTop: 8,
    marginLeft: 20,
  },
  replyItem: {
    marginBottom: 10,
  },
  replyInputContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  noCommentsText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16,
  },
  editCommentContainer: {
    marginVertical: 4,
  },
  editCommentInput: {
    borderRadius: 16,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    borderWidth: 1,
    marginBottom: 8,
  },
  editCommentButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionMenuContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: '80%',
  },
  reactionsRow: {
    flexDirection: 'row',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reactionOption: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    borderRadius: 21,
  },
  reactionEmoji: {
    fontSize: 24,
  },
  actionsMenu: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionOptionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  actionDivider: {
    height: 1,
    width: '100%',
    opacity: 0.2,
  },
  reactionPanel: {
    position: 'absolute',
    top: -50,
    left: 10,
    flexDirection: 'row',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100,
  }
});

export default CommentSection;