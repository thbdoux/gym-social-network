// app/post/[id].tsx - Enhanced with always-visible comment section and better keyboard handling
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Keyboard
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import Post from '../../../components/feed/Post';
import { 
  usePost, 
  useLikePost, 
  useCommentOnPost, 
  useSharePost, 
  useDeletePost,
  useUpdatePost,
  useReactToPost,
  useUnreactToPost
} from '../../../hooks/query/usePostQuery';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import ProfilePreviewModal from '../../../components/profile/ProfilePreviewModal';
import CustomLoadingScreen from '../../../components/shared/CustomLoadingScreen';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const postId = typeof id === 'string' ? parseInt(id, 10) : 0;
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const currentUser = user?.username || '';
  const { palette } = useTheme();
  
  // State management
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const commentSectionAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch post data
  const { 
    data: post, 
    isLoading, 
    error,
    refetch
  } = usePost(postId);
  
  // Post action mutations
  const { mutateAsync: likePost } = useLikePost();
  const { mutateAsync: commentOnPost } = useCommentOnPost();
  const { mutateAsync: sharePost } = useSharePost();
  const { mutateAsync: deletePost } = useDeletePost();
  const { mutateAsync: updatePost } = useUpdatePost();
  const { mutateAsync: reactToPost } = useReactToPost();
  const { mutateAsync: unreactToPost } = useUnreactToPost();

  // Enhanced keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        
        // Scroll to bottom when keyboard appears to ensure comment input is visible
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(40);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Initial fade-in animation
  useEffect(() => {
    if (post) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Auto-show comment section immediately for better UX
      Animated.spring(commentSectionAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }).start();
    }
  }, [post]);

  const handleGoBack = () => {
    router.back();
  };

  const handleProfileClick = (userId: number) => {
    setSelectedUserId(userId);
    setShowProfileModal(true);
  };
  
  const handleNavigateToProfile = (userId: number) => {
    router.push(`/user/${userId}`);
  };

  const handlePostClick = (postId: number) => {
    // In detail mode, don't navigate away
    return;
  };

  const handleWorkoutLogClick = (workoutLog: any) => {
    let workoutLogId: number | null = null;
    
    if (workoutLog) {
      if (typeof workoutLog === 'number') {
        workoutLogId = workoutLog;
      } else if (typeof workoutLog === 'object') {
        workoutLogId = workoutLog.id || workoutLog.log_id || workoutLog;
      }
    }
    
    if (workoutLogId) {
      router.push(`/workout-log/${workoutLogId}`);
    } else {
      console.error('Could not extract workout log ID from:', workoutLog);
      Alert.alert('Error', 'Could not open workout log details');
    }
  };

  const handleProgramClick = (program: any) => {
    let programId: number | null = null;
    
    if (program) {
      if (typeof program === 'number') {
        programId = program;
      } else if (typeof program === 'object') {
        programId = program.id || program.program_id || program.programId;
        
        if (!programId && program.program_details) {
          programId = program.program_details.id;
        }
      }
    }
    
    if (programId) {
      router.push(`/program/${programId}`);
    } else {
      console.error('Could not extract program ID from:', program);
      Alert.alert('Error', 'Could not open program details');
    }
  };
  
  // Post action handlers with animations
  const handleLike = async (postId: number, isLiked: boolean) => {
    try {
      await likePost({ postId, isLiked });
      refetch();
    } catch (err) {
      console.error('Error liking post:', err);
      Alert.alert('Error', 'Failed to like post');
    }
  };

  const handleComment = async (postId: number, content: string) => {
    try {
      await commentOnPost({ postId, content });
      
      // Animate comment success
      Animated.sequence([
        Animated.timing(commentSectionAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(commentSectionAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
      
      refetch();
    } catch (err) {
      console.error('Error commenting on post:', err);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const handleShare = async (postId: number, content: string) => {
    try {
      await sharePost({ postId, content });
      refetch();
    } catch (err) {
      console.error('Error sharing post:', err);
      Alert.alert('Error', 'Failed to share post');
    }
  };
  
  const handleDeletePost = async (postId: number) => {
    try {
      await deletePost(postId);
      router.back();
    } catch (err) {
      console.error('Error deleting post:', err);
      Alert.alert('Error', 'Failed to delete post');
    }
  };
  
  const handleEditPost = async (post: any, newContent: string) => {
    try {
      await updatePost({ 
        id: post.id, 
        updates: { content: newContent } 
      });
      refetch();
    } catch (err) {
      console.error('Error editing post:', err);
      Alert.alert('Error', 'Failed to edit post');
    }
  };
  
  const handleReactToPost = async (postId: number, reactionType: string) => {
    try {
      await reactToPost({ 
        postId, 
        reactionType,
        userId: user?.id
      });
      refetch();
    } catch (err) {
      console.error('Error reacting to post:', err);
      Alert.alert('Error', 'Failed to react to post');
    }
  };
  
  const handleUnreactToPost = async (postId: number) => {
    try {
      await unreactToPost({ 
        postId,
        userId: user?.id
      });
      refetch();
    } catch (err) {
      console.error('Error removing reaction from post:', err);
      Alert.alert('Error', 'Failed to remove reaction');
    }
  };

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: palette.page_background
    },
    header: {
      borderBottomColor: palette.border,
      backgroundColor: palette.layout
    },
    headerTitle: {
      color: palette.text
    },
    loadingContainer: {
      backgroundColor: palette.page_background
    },
    loadingText: {
      color: palette.text
    },
    errorContainer: {
      backgroundColor: palette.page_background
    },
    errorTitle: {
      color: palette.error
    },
    errorText: {
      color: palette.text
    },
    backButtonText: {
      color: palette.accent
    }
  };

  if (isLoading) {
    return (
      <CustomLoadingScreen 
        animationType="pulse"
        size='large'
        text={t('loading') || 'Loading post...'}
        preloadImages={true}
        // style={{ backgroundColor: palette.page_background }}
        // textColor={palette.text}
        // tintColor={palette.accent}
      />
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={[styles.errorContainer, dynamicStyles.errorContainer]}>
        <StatusBar barStyle="light-content" />
        <Text style={[styles.errorTitle, dynamicStyles.errorTitle]}>
          {t('error') || 'Error'}
        </Text>
        <Text style={[styles.errorText, dynamicStyles.errorText]}>
          {t('post_not_found') || 'Post not found'}
        </Text>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: palette.accent }]}
          onPress={handleGoBack}
        >
          <Text style={[styles.backButtonText, { color: palette.page_background }]}>
            {t('go_back') || 'Go back'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <StatusBar 
        barStyle={palette.layout === '#1e293b' ? 'light-content' : 'dark-content'} 
        backgroundColor={palette.layout}
      />
      
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>
          {t('post') || 'Post'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Main content with improved keyboard avoidance */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.contentContainer,
            keyboardVisible && { paddingBottom: keyboardHeight > 0 ? 0 : 50 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <Post
              post={post}
              currentUser={currentUser}
              userData={user}
              onLike={handleLike}
              onReact={handleReactToPost}
              onUnreact={handleUnreactToPost}
              onComment={handleComment}
              onShare={handleShare}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
              onProfileClick={handleProfileClick}
              onNavigateToProfile={handleNavigateToProfile}
              onPostClick={handlePostClick}
              onProgramClick={handleProgramClick}
              onWorkoutLogClick={handleWorkoutLogClick}
              detailMode={true}
              showCommentsByDefault={true} // New prop to always show comments
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Profile Preview Modal */}
      {selectedUserId && (
        <ProfilePreviewModal
          isVisible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userId={selectedUserId}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 24,
  },
  headerBackButton: {
    padding: 8,
    borderRadius: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});