// app/(app)/feed.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useHeaderAnimation } from '../../context/HeaderAnimationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles, withAlpha } from '../../utils/createThemedStyles';
import OptimizedFeedContainer from '../../components/feed/OptimizedFeedContainer';
import ProfilePreviewModal from '../../components/profile/ProfilePreviewModal';
import FriendsModal from '../../components/profile/FriendsModal';
import HeaderLogoWithSVG from '../../components/navigation/HeaderLogoWithSVG';
import PostTypeModal from '../../components/feed/PostTypeModal';
import PostCreationModal from '../../components/feed/PostCreationModal';
import { getAvatarUrl } from '../../utils/imageUtils';
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
import { useNotificationCount } from '../../hooks/query/useNotificationQuery';

// Enhanced Post Creation Row Component with Avatar Image
const PostCreationRow: React.FC<{
  user: any;
  onAvatarPress: () => void;
  onInputPress: () => void;
  styles: any;
  t: (key: string) => string;
}> = ({ user, onAvatarPress, onInputPress, styles, t }) => {
  const avatarUrl = getAvatarUrl(user?.avatar, 40);
  
  return (
    <View style={styles.postCreationRow}>
      <TouchableOpacity onPress={onAvatarPress} style={styles.postCreationAvatar}>
        {user?.avatar ? (
          <Image 
            source={{ uri: avatarUrl }} 
            style={styles.avatarImage}
            defaultSource={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username?.[0] || 'U')}&size=40&background=random` }}
          />
        ) : (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.username?.[0]?.toUpperCase() || user?.displayName?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.postCreationInput} 
        onPress={onInputPress}
        activeOpacity={0.7}
      >
        <Text style={styles.postCreationInputText}>
          {t('whats_on_your_mind') || "What's on your mind?"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { palette } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<string>('regular');
  const [showPostTypeModal, setShowPostTypeModal] = useState(false);
  const { isLoaded: imagesLoaded } = useImagePreloading(['personality']);
  const styles = themedStyles(palette);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { setScrollY } = useHeaderAnimation();
  
  // Get notification count
  const { data: notificationCount } = useNotificationCount();
  const unreadCount = notificationCount?.unread || 0;

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
  
  // Handlers for post creation
  const handleShowPostTypeModal = () => setShowPostTypeModal(true);
  const handlePostTypeSelect = (postType: string) => {
    setSelectedPostType(postType);
    setShowPostModal(true);
  };
  
  // Handlers for post creation row
  const handleAvatarPress = () => {
    if (user?.id) {
      router.push(`/user/${user.id}`);
    }
  };
  
  const handlePostInputPress = () => {
    setSelectedPostType('regular');
    setShowPostModal(true);
  };
  
  const handleModalClose = () => { setShowPostModal(false); setTimeout(() => setSelectedPostType('regular'), 300); };
  const handlePostCreated = () => refetchPosts();
  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false });

  // Simplified header - just post creation row
  const renderHeader = useMemo(() => (
    <View>
      {/* Post Creation Row - Facebook style */}
      <PostCreationRow
        user={user}
        onAvatarPress={handleAvatarPress}
        onInputPress={handlePostInputPress}
        styles={styles}
        t={t}
      />
    </View>
  ), [user, styles, t]);

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
            {/* Logo on the left */}
            <HeaderLogoWithSVG />
            
            {/* Icons on the right */}
            <View style={styles.headerRightContainer}>
              {/* Notification Icon with Badge */}
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
              
              {/* Create Post Button */}
              {/* <TouchableOpacity style={styles.createPostButton} onPress={handleShowPostTypeModal}>
                <Ionicons name="add" size={26} color={palette.text} />
              </TouchableOpacity> */}
            </View>
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
            <OptimizedFeedContainer
              onLike={handleLike} 
              onReact={handleReactToPost} 
              onUnreact={handleUnreactToPost}
              onComment={handleComment} 
              onShare={handleShare} 
              onDelete={handleDeletePost} 
              onEdit={handleEditPost}
              onProgramSelect={handleProgramSelect} 
              onWorkoutLogSelect={handleWorkoutLogSelect}
              onForkProgram={handleForkProgram} 
              onProfileClick={handleProfileClick}
              onNavigateToProfile={handleNavigateToProfile} 
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

      {/* Modals */}
      {showFriendsModal && <FriendsModal isVisible={showFriendsModal} onClose={() => setShowFriendsModal(false)} currentUser={user} />}
      {selectedUserId && <ProfilePreviewModal isVisible={showProfileModal} onClose={() => setShowProfileModal(false)} userId={selectedUserId} />}
      <PostCreationModal visible={showPostModal} onClose={handleModalClose} onPostCreated={handlePostCreated} initialPostType={selectedPostType} />
      
      {/* Post Type Modal */}
      <PostTypeModal 
        visible={showPostTypeModal} 
        onClose={() => setShowPostTypeModal(false)}
        onSelectType={handlePostTypeSelect}
      />
    </View>
  );
}

const themedStyles = createThemedStyles((palette) => ({
  container: { flex: 1, backgroundColor: palette.layout },
  safeArea: { flex: 1 },
  header: {
    backgroundColor: palette.layout,
    zIndex: 100,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingLeft: 16,
    height: '100%',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconTouchable: {
    padding: 8,
    marginRight: 10,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: palette.layout,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  createPostButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  feedWrapper: { flex: 1 },
  feedContentContainer: { paddingBottom: 60 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: withAlpha(palette.text, 0.7) },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { marginTop: 10, marginBottom: 20, color: withAlpha(palette.text, 0.7), textAlign: 'center' },
  retryButton: { backgroundColor: palette.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: palette.page_background, fontWeight: '600' },
  
  // Post creation row styles
  postCreationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: palette.layout,
    marginBottom: 8,
  },
  postCreationAvatar: {
    marginRight: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: palette.page_background,
    fontSize: 16,
    fontWeight: '600',
  },
  postCreationInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: withAlpha(palette.border, 0.2),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: withAlpha(palette.text, 0.7),
    minHeight: 40,
    justifyContent: 'center',
  },
  postCreationInputText: {
    color: palette.text,
    fontSize: 16,
  },
}));