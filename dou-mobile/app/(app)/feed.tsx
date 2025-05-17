// app/(app)/feed.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router'; // useNavigation removed as not directly used here
import {
  View,
  Text,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Animated,
  ImageBackground,
  TouchableOpacity,
  Modal,
  // StyleSheet, // No longer needed here if all styles in themedStyles
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useHeaderAnimation } from '../../context/HeaderAnimationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles, withAlpha } from '../../utils/createThemedStyles';
import FeedContainer from '../../components/feed/FeedContainer';
import ProfilePreviewModal from '../../components/profile/ProfilePreviewModal';
import FriendsModal from '../../components/profile/FriendsModal';
import HeaderLogoWithSVG from '../../components/navigation/HeaderLogoWithSVG';
import FabMenu from '../../components/feed/FabMenu'; // Correct path
import SidebarButton from '../../components/navigation/SidebarButton';
import PostCreationModal from '../../components/feed/PostCreationModal';
import FeedViewSelector, { FEED_VIEW_TYPES } from '../../components/feed/FeedViewSelector';
import {
  useLikePost,
  useCommentOnPost,
  useSharePost,
  useDeletePost,
  useReactToPost,
  useUnreactToPost,
} from '../../hooks/query/usePostQuery';
import { useForkProgram } from '../../hooks/query/useProgramQuery';
import { usePostsFeed } from '../../hooks/query/usePostQuery';
import { imageManager, useImagePreloading } from '../../utils/imageManager';
import { useNotificationCount } from '../../hooks/query/useNotificationQuery'; // Import for notification count

export default function FeedScreen() {
  const router = useRouter();
  // const navigation = useNavigation(); // Not used directly
  const { user } = useAuth();
  const { t } = useLanguage();
  const { palette } = useTheme(); // personality not used directly

  const [refreshing, setRefreshing] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<string>('regular');
  const [currentFeedView, setCurrentFeedView] = useState(FEED_VIEW_TYPES.FRIENDS);
  const { isLoaded: imagesLoaded } = useImagePreloading(['personality']);
  const styles = themedStyles(palette);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { setScrollY } = useHeaderAnimation();
  
  // Get notification count
  const { data: notificationCount } = useNotificationCount();
  const unreadCount = notificationCount?.unread_count || 0;

  useEffect(() => {
    setScrollY(scrollY);
  }, [scrollY, setScrollY]);

  const { refetch: refetchPosts, isLoading: postsLoading, error: postsError } = usePostsFeed();
  const { mutateAsync: likePost } = useLikePost();
  const { mutateAsync: commentOnPost } = useCommentOnPost();
  const { mutateAsync: sharePost } = useSharePost();
  const { mutateAsync: deletePost } = useDeletePost();
  const { mutateAsync: forkProgram } = useForkProgram();
  const { mutateAsync: reactToPost } = useReactToPost();
  const { mutateAsync: unreactToPost } = useUnreactToPost();

  const changeView = (viewType: string) => {
    setCurrentFeedView(viewType);
    scrollY.setValue(0);
  };

  const welcomeContent = useMemo(() => {
    const personalityType = (user?.personality_type || 'versatile').toLowerCase();
    const message = t(`welcome_message_${personalityType}`) || t('welcome_message_default');
    const backgroundImage = imageManager.getLocalImage('personality', personalityType);
    return { message, backgroundImage };
  }, [user?.personality_type, t]);

  const headerHeight = scrollY.interpolate({ inputRange: [0, 60], outputRange: [60, 0], extrapolate: 'clamp' });
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 40], outputRange: [1, 0], extrapolate: 'clamp' });

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refetchPosts(); }
    catch (err) { console.error('Error refreshing posts:', err); }
    finally { setRefreshing(false); }
  };

  const handleLike = async (postId: number, isLiked: boolean) => {
    try { await likePost({ postId, isLiked }); }
    catch (err) { console.error('Error liking post:', err); Alert.alert('Error', 'Failed to like post'); }
  };

  const handleReactToPost = async (postId: number, reactionType: string) => {
    try { await reactToPost({ postId, reactionType, userId: user?.id }); }
    catch (err) { console.error('Error reacting to post:', err); Alert.alert('Error', 'Failed to react to post'); }
  };

  const handleUnreactToPost = async (postId: number) => {
    try { await unreactToPost({ postId, userId: user?.id }); }
    catch (err) { console.error('Error removing reaction:', err); Alert.alert('Error', 'Failed to remove reaction'); }
  };

  const handlePostClick = (postId: number) => router.push(`/post/${postId}`);
  const handleComment = async (postId: number, content: string) => {
    try { await commentOnPost({ postId, content }); }
    catch (err) { console.error('Error commenting:', err); Alert.alert('Error', 'Failed to add comment'); }
  };
  const handleShare = async (postId: number, content: string) => {
    try { await sharePost({ postId, content }); }
    catch (err) { console.error('Error sharing post:', err); Alert.alert('Error', 'Failed to share post'); }
  };
  const handleDeletePost = async (postId: number) => {
    try { await deletePost(postId); await refetchPosts(); }
    catch (err) { console.error('Error deleting post:', err); Alert.alert('Error', 'Failed to delete post'); }
  };
  const handleEditPost = async (post: any, newContent: string) => {
    try { await refetchPosts(); } // Placeholder for actual edit logic
    catch (err) { console.error('Error editing post:', err); Alert.alert('Error', 'Failed to edit post'); }
  };
  const handleForkProgram = async (programId: number) => {
    try { return await forkProgram(programId); }
    catch (err) { console.error('Error forking program:', err); Alert.alert('Error', 'Failed to fork program'); throw err; }
  };

  const handleProfileClick = (userId: number) => { setSelectedUserId(userId); setShowProfileModal(true); };
  const handleNavigateToProfile = (userId: number) => router.push(`/user/${userId}`);
  const handleFabItemPress = (itemId: string) => { setSelectedPostType(itemId); setShowPostModal(true); };
  const handleModalClose = () => { setShowPostModal(false); setTimeout(() => setSelectedPostType('regular'), 300); };
  const handlePostCreated = () => refetchPosts();
  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false });

  const renderWelcomeHeader = useMemo(() => (
    <View>
      <View style={styles.welcomeContainer}>
        <ImageBackground source={welcomeContent.backgroundImage} style={styles.welcomeBackground} imageStyle={styles.welcomeBackgroundImage}>
          <Text style={styles.welcomeText}>{welcomeContent.message}</Text>
          <Text style={styles.welcomeUsername}>{user?.displayName || user?.username || 'Friend'}?</Text>
        </ImageBackground>
      </View>
      <FeedViewSelector currentView={currentFeedView} changeView={changeView} />
    </View>
  ), [welcomeContent, user?.displayName, user?.username, styles, currentFeedView, changeView, t]); // Added t to dependencies

  const handleProgramSelect = (program: any) => {
    let programId: number | null = typeof program === 'number' ? program : (program?.id || program?.program_id || program?.programId || program?.program_details?.id);
    if (programId) router.push(`/program/${programId}`);
    else { console.error('Could not extract program ID:', program); Alert.alert('Error', 'Could not open program details'); }
  };
  const handleWorkoutLogSelect = (workoutLog: any) => {
    let workoutLogId: number | null = typeof workoutLog === 'number' ? workoutLog : (workoutLog?.id || workoutLog?.log_id);
    if (workoutLogId) router.push(`/workout-log/${workoutLogId}`);
    else { console.error('Could not extract workout log ID:', workoutLog); Alert.alert('Error', 'Could not open workout log'); }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity }]}>
          <View style={styles.headerContent}>
            <SidebarButton />
            <HeaderLogoWithSVG />
              <TouchableOpacity style={styles.headerIconTouchable} onPress={() => router.push('/notifications')}>
                <Ionicons name="notifications-outline" size={26} color={palette.text} />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <FabMenu onItemPress={handleFabItemPress} style={styles.fabMenuInHeader} />
          </View>
        </Animated.View>

        {/* Feed wrapper */}
        <View style={styles.feedWrapper}>
          {postsError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={40} color={palette.error} />
              <Text style={styles.errorText}>{t('error_loading_feed')}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => refetchPosts()}>
                <Text style={styles.retryButtonText}>{t('retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : (postsLoading && !refreshing) || !imagesLoaded ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={palette.primary} />
              <Text style={styles.loadingText}>{!imagesLoaded ? t('loading_images') : t('loading_posts')}</Text>
            </View>
          ) : (
            <FeedContainer
              onLike={handleLike} onReact={handleReactToPost} onUnreact={handleUnreactToPost}
              onComment={handleComment} onShare={handleShare} onDelete={handleDeletePost} onEdit={handleEditPost}
              onProgramSelect={handleProgramSelect} onWorkoutLogSelect={handleWorkoutLogSelect}
              onForkProgram={handleForkProgram} onProfileClick={handleProfileClick}
              onNavigateToProfile={handleNavigateToProfile} onPostClick={handlePostClick}
              refreshing={refreshing} onRefresh={handleRefresh} onScroll={handleScroll}
              scrollEventThrottle={16} contentContainerStyle={styles.feedContentContainer}
              ListHeaderComponent={renderWelcomeHeader} filterMode={currentFeedView}
            />
          )}
        </View>
      </SafeAreaView>

      {/* Modals */}
      {showFriendsModal && <FriendsModal isVisible={showFriendsModal} onClose={() => setShowFriendsModal(false)} currentUser={user} />}
      {selectedUserId && <ProfilePreviewModal isVisible={showProfileModal} onClose={() => setShowProfileModal(false)} userId={selectedUserId} />}
      <PostCreationModal visible={showPostModal} onClose={handleModalClose} onPostCreated={handlePostCreated} initialPostType={selectedPostType} />
    </View>
  );
}

const themedStyles = createThemedStyles((palette) => ({
  container: { flex: 1, backgroundColor: palette.layout /* borderRadius: 12 removed for full-screen effect */ },
  safeArea: { flex: 1 },
  header: {
    backgroundColor: palette.layout,
    // overflow: 'hidden', // IMPORTANT: Removed to allow FAB menu items to appear outside header bounds
    zIndex: 100, // Ensure header is above feed content, but FAB menu items will need higher zIndex
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12, // Adjusted padding
    height: '100%',
  },

  headerIconTouchable: { // Style for the TouchableOpacity around the icon
    padding: 6, // Clickable area
    marginRight: 8, // Space between notification icon and FAB menu button
    position: 'relative', // Added for absolute positioning of the badge
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fabMenuInHeader: {
    marginRight: 4,
    // This style is passed to the FabMenu component (specifically to its main button)
    // Can be used for margins if needed, e.g., marginRight: 4 if headerRight padding isn't enough
  },
  feedWrapper: { flex: 1 },
  feedContentContainer: { paddingBottom: 60 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: withAlpha(palette.text, 0.7) },
  welcomeContainer: { overflow: 'hidden' },
  welcomeBackground: { minHeight: 140, justifyContent: 'center', paddingVertical: 20 },
  welcomeBackgroundImage: {}, // No specific style needed if default is fine
  welcomeText: { fontSize: 18, fontWeight: '600', marginBottom: 4, paddingLeft: 16, color: palette.text, textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 },
  welcomeUsername: { fontSize: 45, paddingLeft: 15, fontWeight: '700', color: palette.text, textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { marginTop: 10, marginBottom: 20, color: withAlpha(palette.text, 0.7), textAlign: 'center' },
  retryButton: { backgroundColor: palette.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: palette.page_background, fontWeight: '600' },
}));