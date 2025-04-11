// app/post/[id].tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import Post from '../../components/feed/Post';
import { 
  usePost, 
  useLikePost, 
  useCommentOnPost, 
  useSharePost, 
  useDeletePost,
  // useEditPost
} from '../../hooks/query/usePostQuery';
import { useLanguage } from '../../context/LanguageContext';
import ProfilePreviewModal from '../../components/profile/ProfilePreviewModal';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const postId = typeof id === 'string' ? parseInt(id, 10) : 0;
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const currentUser = user?.username || '';
  
  // Add state for profile modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Use your existing hook to fetch post details
  const { 
    data: post, 
    isLoading, 
    error,
    refetch
  } = usePost(postId);
  
  // Add post action mutations
  const { mutateAsync: likePost } = useLikePost();
  const { mutateAsync: commentOnPost } = useCommentOnPost();
  const { mutateAsync: sharePost } = useSharePost();
  const { mutateAsync: deletePost } = useDeletePost();
  // const { mutateAsync: editPost } = useEditPost();

  const handleGoBack = () => {
    router.back();
  };

  // Add profile click handler
  const handleProfileClick = (userId: number) => {
    setSelectedUserId(userId);
    setShowProfileModal(true);
  };
  
  // Add handler to navigate to user profile page
  const handleNavigateToProfile = (userId: number) => {
    router.push(`/user/${userId}`);
  };

  // If we need to view a different post (for shared posts)
  const handlePostClick = (postId: number) => {
    router.push(`/post/${postId}`);
  };

  // Add this function for program clicks
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
  
  // Add handlers for post actions
  const handleLike = async (postId: number) => {
    try {
      await likePost(postId);
      refetch(); // Refresh post data
    } catch (err) {
      console.error('Error liking post:', err);
      Alert.alert('Error', 'Failed to like post');
    }
  };

  const handleComment = async (postId: number, content: string) => {
    try {
      await commentOnPost({ postId, content });
      refetch(); // Refresh post data
    } catch (err) {
      console.error('Error commenting on post:', err);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const handleShare = async (postId: number, content: string) => {
    try {
      await sharePost({ postId, content });
      refetch(); // Refresh post data
    } catch (err) {
      console.error('Error sharing post:', err);
      Alert.alert('Error', 'Failed to share post');
    }
  };
  
  const handleDeletePost = async (postId: number) => {
    try {
      await deletePost(postId);
      // Go back to feed after deleting
      router.back();
    } catch (err) {
      console.error('Error deleting post:', err);
      Alert.alert('Error', 'Failed to delete post');
    }
  };
  
  // Add edit post handler
  const handleEditPost = async (post: any, newContent: string) => {
    try {
      // await editPost({ postId: post.id, content: newContent });
      refetch(); // Refresh post data
    } catch (err) {
      console.error('Error editing post:', err);
      Alert.alert('Error', 'Failed to edit post');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading post...</Text>
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>Post not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Use your existing Post component with a detailMode flag */}
        <Post
          post={post}
          currentUser={currentUser}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
          onProfileClick={handleProfileClick}
          onNavigateToProfile={handleNavigateToProfile}
          onPostClick={handlePostClick}
          onProgramClick={handleProgramClick}
          detailMode={true} // Show in detail mode
        />
      </ScrollView>
      
      {/* Add Profile Preview Modal */}
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
    backgroundColor: '#080f19',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.5)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 24, // Matches the width of the back button for balance
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 0,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#080f19',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#080f19',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
});