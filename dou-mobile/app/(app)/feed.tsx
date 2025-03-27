import React, { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import FeedContainer from '../../components/feed/FeedContainer';
import PostCreationModal from '../../components/feed/PostCreationModal';
import ProfilePreviewModal from '../../components/profile/ProfilePreviewModal';
import FabMenu from '../../components/feed/FabMenu';
import FriendsBubbleList from '../../components/profile/FriendsBubbleList';
import FriendsModal from '../../components/profile/FriendsModal';
import { useLikePost, useCommentOnPost, useSharePost, useDeletePost } from '../../hooks/query/usePostQuery';
import { useForkProgram } from '../../hooks/query/useProgramQuery';
import { usePostsFeed } from '../../hooks/query/usePostQuery';

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<string>('regular');
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Reset post type when modal closes
  const handleModalClose = () => {
    setShowPostModal(false);
    // Reset back to regular after modal closes
    setTimeout(() => setSelectedPostType('regular'), 300);
  };
  
  // Use React Query hooks
  const { 
    refetch: refetchPosts,
    isLoading: postsLoading,
    error: postsError
  } = usePostsFeed();
  
  // Post action mutations
  const { mutateAsync: likePost } = useLikePost();
  const { mutateAsync: commentOnPost } = useCommentOnPost();
  const { mutateAsync: sharePost } = useSharePost();
  const { mutateAsync: deletePost } = useDeletePost();
  const { mutateAsync: forkProgram } = useForkProgram();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchPosts();
    } catch (err) {
      console.error('Error refreshing posts:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      await likePost(postId);
    } catch (err) {
      console.error('Error liking post:', err);
      Alert.alert('Error', 'Failed to like post');
    }
  };
  const handlePostClick = (postId: number) => {
    router.push(`/post/${postId}`);
  };

  const handleComment = async (postId: number, content: string) => {
    try {
      await commentOnPost({ postId, content });
    } catch (err) {
      console.error('Error commenting on post:', err);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const handleShare = async (postId: number, content: string) => {
    try {
      await sharePost({ postId, content });
    } catch (err) {
      console.error('Error sharing post:', err);
      Alert.alert('Error', 'Failed to share post');
    }
  };
  
  const handleDeletePost = async (postId: number) => {
    try {
      await deletePost(postId);
    } catch (err) {
      console.error('Error deleting post:', err);
      Alert.alert('Error', 'Failed to delete post');
    }
  };
  
  const handleForkProgram = async (programId: number) => {
    try {
      return await forkProgram(programId);
    } catch (err) {
      console.error('Error forking program:', err);
      Alert.alert('Error', 'Failed to fork program');
      throw err;
    }
  };

  const handlePostCreated = (newPost: any) => {
    // The React Query will automatically update the cache,
    // so we don't need to manually update the posts state.
    // Just refetch to ensure everything is fresh
    refetchPosts();
  };

  const handleOpenFriendsModal = () => {
    setShowFriendsModal(true);
    setShowFriendsList(false); // Close the friends list when opening the modal
  };
  
  // Toggle friends list visibility
  const toggleFriendsList = () => {
    setShowFriendsList(!showFriendsList);
  };

  // Handle profile click
  const handleProfileClick = (userId: number) => {
    console.log('Profile clicked in FeedScreen, userId:', userId);
    setSelectedUserId(userId);
    setShowProfileModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Friends button in the header */}
      <View style={styles.friendsButtonContainer}>
        <TouchableOpacity
          style={styles.friendsButton}
          onPress={toggleFriendsList}
        >
          <Ionicons name="people" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {postsLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : (
        <FeedContainer
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          onDelete={handleDeletePost}
          onForkProgram={handleForkProgram}
          onProfileClick={handleProfileClick}
          onPostClick={handlePostClick}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      {/* FAB Menu */}
      <FabMenu 
        onItemPress={(itemId) => {
          setSelectedPostType(itemId);
          setShowPostModal(true);
        }} 
      />
      
      {/* Post Creation Modal */}
      <PostCreationModal
        visible={showPostModal}
        onClose={handleModalClose}
        onPostCreated={handlePostCreated}
        initialPostType={selectedPostType}
      />
      
      {/* Friends Modal */}
      {showFriendsModal && (
        <FriendsModal
          isVisible={showFriendsModal}
          onClose={() => setShowFriendsModal(false)}
          currentUser={user}
        />
      )}


      {/* Profile Preview Modal */}
      {selectedUserId && (
        <ProfilePreviewModal
          isVisible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userId={selectedUserId}
        />
      )}

      {/* Friends Bubble List Modal with darkened background */}
      <Modal
        visible={showFriendsList}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFriendsList(false)}
      >
        <View style={styles.friendsListModalContainer}>
          {/* Darkened background touchable overlay */}
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={() => setShowFriendsList(false)}
          />
          
          {/* Friends list content */}
          <View style={styles.friendsListContent}>
            <FriendsBubbleList 
              onViewAllClick={handleOpenFriendsModal} 
              hideViewAllButton={true} // Hide the top-right button
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  friendsButtonContainer: {
    position: 'absolute',
    top: 8,
    left: 16,
    zIndex: 100,
  },
  friendsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendsListModalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  friendsListContent: {
    marginTop: 56, // Position below the header
    marginHorizontal: 16,
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#9CA3AF',
  },
});