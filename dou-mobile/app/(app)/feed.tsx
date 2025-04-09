// app/(app)/feed.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Animated,
  ImageBackground,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useHeaderAnimation } from '../../context/HeaderAnimationContext';
import FeedContainer from '../../components/feed/FeedContainer';
import ProfilePreviewModal from '../../components/profile/ProfilePreviewModal';
import FriendsModal from '../../components/profile/FriendsModal';
import HeaderLogoWithSVG from '../../components/navigation/HeaderLogoWithSVG';
import FabMenu from '../../components/feed/FabMenu';
import SidebarButton from '../../components/navigation/SidebarButton';
import PostCreationModal from '../../components/feed/PostCreationModal';
import { useLikePost, useCommentOnPost, useSharePost, useDeletePost } from '../../hooks/query/usePostQuery';
import { useForkProgram } from '../../hooks/query/useProgramQuery';
import { usePostsFeed } from '../../hooks/query/usePostQuery';

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<string>('regular');
  
  // Create an animated scroll value and share it with the header animation context
  const scrollY = useRef(new Animated.Value(0)).current;
  const { setScrollY } = useHeaderAnimation();
  
  // Share the scroll value with the header animation context
  useEffect(() => {
    setScrollY(scrollY);
  }, [scrollY, setScrollY]);
  
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

  // Calculate header animation values - make it disappear completely
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [60, 0],
    extrapolate: 'clamp'
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

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

  const handleOpenFriendsModal = () => {
    setShowFriendsModal(true);
  };
  
  // Handle profile click
  const handleProfileClick = (userId: number) => {
    setSelectedUserId(userId);
    setShowProfileModal(true);
  };
  
  // FAB Menu handlers
  const handleFabItemPress = (itemId: string) => {
    setSelectedPostType(itemId);
    setShowPostModal(true);
  };
  
  // Handle post modal close
  const handleModalClose = () => {
    setShowPostModal(false);
    // Reset back to regular after modal closes
    setTimeout(() => setSelectedPostType('regular'), 300);
  };
  
  // Handle post created
  const handlePostCreated = (newPost: any) => {
    // Refresh posts feed after creating a new post
    refetchPosts();
  };
  
  // Handle scroll events to track scroll position for header animation
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // Custom rendering for the feed content with welcome message at the top
  const renderHeader = () => {
    // Determine personality type from user object (with fallback)
    const personalityType = user?.personalityType || 'versatile';
    
    // Define messages and background images for each personality type
    let message = '';
    let backgroundImage;
    
    switch (personalityType) {
      case 'optimizer':
        message = "Ready to maximize your day, efficiency seeker?";
        backgroundImage = require('../../assets/images/bob.jpg');
        break;
      case 'versatile':
        message = "Welcome back! What would you like to explore today?";
        backgroundImage = require('../../assets/images/bob.jpg');
        break;
      case 'diplomate':
        message = "Your community is waiting to connect with you!";
        backgroundImage = require('../../assets/images/bob.jpg');
        break;
      case 'mentor':
        message = "Ready to inspire and guide others today?";
        backgroundImage = require('../../assets/images/bob.jpg');
        break;
      default:
        message = "Welcome back! Let's discover what's new.";
        backgroundImage = require('../../assets/images/bob.jpg');
        break;
    }
    
    return (
      <View style={styles.welcomeContainer}>
        <ImageBackground
          source={backgroundImage}
          style={styles.welcomeBackground}
          imageStyle={styles.welcomeBackgroundImage}
        >
          <View style={styles.welcomeOverlay}>
            <Text style={styles.welcomeText}>
              {message}
            </Text>
            <Text style={styles.welcomeUsername}>
              {user?.displayName || user?.username || 'Friend'}
            </Text>
          </View>
        </ImageBackground>
      </View>
    );
  };

  // Add a handler for program selection
  const handleProgramSelect = (program: any) => {
    
    // Get the program ID - check all possible properties where ID might be stored
    let programId: number | null = null;
    
    if (program) {
      if (typeof program === 'number') {
        // If program is just the ID itself
        programId = program;
      } else if (typeof program === 'object') {
        // Try all possible ID properties
        programId = program.id || program.program_id || program.programId;
        
        // If program details is nested, try to extract from there
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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Only the logo header animates out */}
        <Animated.View 
          style={[
            styles.header,
            { 
              height: headerHeight,
              opacity: headerOpacity
            }
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft} />
            <HeaderLogoWithSVG />
            <View style={styles.headerRight}>
              <SidebarButton />
            </View>
          </View>
        </Animated.View>

        {/* Feed wrapper - includes the welcome message as its header */}
        <View style={styles.feedWrapper}>
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
              onProgramSelect={handleProgramSelect}
              onForkProgram={handleForkProgram}
              onProfileClick={handleProfileClick}
              onPostClick={handlePostClick}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.feedContentContainer}
              ListHeaderComponent={renderHeader}
            />
          )}
        </View>
      </SafeAreaView>
      
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
      
      {/* Post Creation Modal */}
      <PostCreationModal
        visible={showPostModal}
        onClose={handleModalClose}
        onPostCreated={handlePostCreated}
        initialPostType={selectedPostType}
      />
      
      {/* FAB Menu - positioned correctly to avoid conflicts with bottom tab bar */}
      <FabMenu onItemPress={handleFabItemPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    backgroundColor: '#111827', // Unified background color
    overflow: 'hidden',
    // No border or separator
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: '100%',
  },
  headerLeft: {
    width: 40,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  feedWrapper: {
    flex: 1,
    paddingTop: 0, // No extra padding needed since friends list is part of the feed
  },
  feedContentContainer: {
    paddingBottom: 100, // More space for bottom tab bar + fab menu
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
  // New styles for welcome message
  welcomeContainer: {
    marginHorizontal: 0,
    marginVertical: 0,
    borderRadius: 0,
    overflow: 'hidden',
    elevation: 3, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  welcomeBackground: {
    minHeight: 140,
    borderRadius: 0,
  },
  welcomeBackgroundImage: {
    borderRadius: 0,
  },
  welcomeOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)', // Dark overlay for text readability
    padding: 20,
    minHeight: 140,
    justifyContent: 'center',
    borderRadius: 0,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  welcomeUsername: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
});