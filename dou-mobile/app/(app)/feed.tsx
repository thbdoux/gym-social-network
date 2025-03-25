import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { postService } from '../../api/services';
import { Ionicons } from '@expo/vector-icons';
import CreatePost from '../../components/feed/CreatePost';
import FeedContainer from '../../components/feed/FeedContainer';

export default function FeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await postService.getFeed();
      setPosts(fetchedPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handleLike = async (postId) => {
    try {
      await postService.likePost(postId);
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: !post.is_liked,
                likes_count: post.is_liked
                  ? post.likes_count - 1
                  : post.likes_count + 1,
              }
            : post
        )
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleComment = async (postId, content) => {
    try {
      const newComment = await postService.commentOnPost(postId, content);
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: [...(post.comments || []), newComment],
                comments_count: (post.comments_count || 0) + 1,
              }
            : post
        )
      );
    } catch (err) {
      console.error('Error commenting on post:', err);
    }
  };

  const handleShare = async (postId, content) => {
    try {
      const sharedPost = await postService.sharePost(postId, content);
      setPosts([sharedPost, ...posts]);
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  const handleCreatePost = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome back, {user?.username || 'Athlete'}!
        </Text>
      </View>

      <CreatePost onPostCreated={handleCreatePost} />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : (
        <FeedContainer
          posts={posts}
          loading={loading}
          currentUser={user?.username || ''}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
        />
      )}

      {/* Floating action button for new post */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Keep your original styles

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  feedContainer: {
    padding: 16,
    paddingBottom: 80, // Extra padding for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E5E7EB',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  postCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  authorName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  postDate: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  postContent: {
    color: '#E5E7EB',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});