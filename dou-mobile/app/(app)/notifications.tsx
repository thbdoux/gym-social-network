// app/(app)/notifications.tsx
import React, { useEffect, useState } from 'react';
import { runOnJS } from 'react-native-reanimated';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
  SafeAreaView,
  SectionList
} from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming, interpolate } from 'react-native-reanimated';
import { 
  useNotifications, 
  useMarkNotificationAsRead, 
  useMarkAllNotificationsAsRead,
  useNotificationCount 
} from '../../hooks/query/useNotificationQuery';
import { useUser } from '../../hooks/query/useUserQuery';
import { usePost } from '../../hooks/query/usePostQuery';
import { useNotificationSocket } from '../../hooks/useNotificationSocket';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles } from '../../utils/createThemedStyles';
import { router, useNavigation } from 'expo-router';
import { formatDistanceToNow, isToday, isYesterday, differenceInDays } from 'date-fns';
import { Image } from 'expo-image';
import { useLanguage } from '../../context/LanguageContext';
import { getAvatarUrl } from '../../utils/imageUtils';

// Component to display content preview based on notification type
const ContentPreview = ({ notification, postData }) => {
  const { palette, workoutPalette, programPalette, workoutLogPalette, programWorkoutPalette } = useTheme();
  const styles = themedStyles(palette);
  const { t } = useLanguage();
  
  // Get appropriate palette based on post type
  const getContentPalette = (type) => {
    switch (type) {
      case 'workout':
        return workoutPalette;
      case 'program':
        return programPalette;
      case 'workout_log':
        return workoutLogPalette;
      case 'program_workout':
        return programWorkoutPalette;
      default:
        return null;
    }
  };
  
  // Get icon based on post type
  const getContentIcon = (type) => {
    switch (type) {
      case 'workout':
        return 'barbell';
      case 'program':
        return 'calendar';
      case 'workout_log':
        return 'clipboard';
      case 'program_workout':
        return 'fitness';
      default:
        return 'document-text';
    }
  };
  
  switch (notification.notification_type) {
    case 'like':
    case 'comment':
    case 'share':
      // Post preview based on post type
      if (postData?.media && postData.media.length > 0) {
        // If post has media from the query
        return (
          <View style={styles.contentPreview}>
            <Image 
              source={{ uri: postData.media[0].url }} 
              style={styles.previewImage} 
            />
          </View>
        );
      } else if (notification.post_preview?.image) {
        // If post has an image from notification data
        return (
          <View style={styles.contentPreview}>
            <Image 
              source={{ uri: notification.post_preview.image }} 
              style={styles.previewImage} 
            />
          </View>
        );
      } else if (postData?.post_type || notification.post_type) {
        // Handle specialized content types (workout/program/etc.)
        const contentType = postData?.post_type || notification.post_type;
        const contentPalette = getContentPalette(contentType);
        
        if (contentPalette) {
          // Use specialized styling based on content type
          return (
            <View style={[
              styles.contentPreview,
              { backgroundColor: contentPalette.background }
            ]}>
              <View style={styles.typeIconContainer}>
                <Ionicons 
                  name={getContentIcon(contentType)} 
                  size={22} 
                  color={contentPalette.highlight} 
                />
              </View>
            </View>
          );
        }
      }
      
      // Default text post preview
      return (
        <View style={styles.contentPreview}>
          <View style={styles.postIconContainer}>
            <Ionicons name="document-text" size={20} color={palette.text_secondary} />
          </View>
        </View>
      );
      
    case 'friend_request':
    case 'friend_accept':
      // User profile preview
      return (
        <View style={styles.contentPreview}>
          <View style={styles.profileIconContainer}>
            <Ionicons name="person" size={20} color={palette.text_secondary} />
          </View>
        </View>
      );
      
    case 'program_fork':
      // Program preview with program palette
      return (
        <View style={[
          styles.contentPreview,
          { backgroundColor: programPalette.background }
        ]}>
          <View style={styles.programIconContainer}>
            <Ionicons name="git-branch" size={20} color={programPalette.highlight} />
          </View>
        </View>
      );
      
    case 'workout_milestone':
      // Workout milestone with workout log palette
      return (
        <View style={[
          styles.contentPreview,
          { backgroundColor: workoutLogPalette.background }
        ]}>
          <View style={styles.achievementIconContainer}>
            <Ionicons name="trophy" size={20} color={workoutLogPalette.highlight} />
          </View>
        </View>
      );
      
    case 'goal_achieved':
      // Goal achieved with workout log palette
      return (
        <View style={[
          styles.contentPreview,
          { backgroundColor: workoutLogPalette.background }
        ]}>
          <View style={styles.achievementIconContainer}>
            <Ionicons name="flag" size={20} color={workoutLogPalette.highlight} />
          </View>
        </View>
      );
      
    case 'gym_announcement':
      // Gym preview
      return (
        <View style={styles.contentPreview}>
          <View style={styles.gymIconContainer}>
            <Ionicons name="business" size={20} color={palette.text_secondary} />
          </View>
        </View>
      );
      
    default:
      // Default empty preview
      return null;
  }
};

// Instagram style notification item
const NotificationItem = ({ notification, onMarkAsRead }) => {
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const { t } = useLanguage();
  
  // Fetch full user data for the sender
  const { data: userData } = useUser(notification.sender);
  // If we have object_id, we can try to fetch specific post/content data
  const { data: postData } = notification.object_id && 
    (notification.notification_type === 'like' || 
     notification.notification_type === 'comment' || 
     notification.notification_type === 'share') 
    ? usePost(notification.object_id) 
    : { data: null };
  
  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return 'heart';
      case 'comment':
        return 'chatbubble';
      case 'share':
        return 'share-social';
      case 'friend_request':
        return 'person-add';
      case 'friend_accept':
        return 'people';
      case 'program_fork':
        return 'git-branch';
      case 'workout_milestone':
        return 'trophy';
      case 'goal_achieved':
        return 'flag';
      case 'mention':
        return 'at';
      case 'gym_announcement':
        return 'megaphone';
      default:
        return 'notifications';
    }
  };
  
  // Get icon color based on notification type
  const getIconColor = (type) => {
    switch (type) {
      case 'like':
        return '#FF3B30'; // Basic red for likes
      case 'comment':
        return '#007AFF'; // Basic blue for comments
      case 'share':
        return '#AF52DE'; // Basic purple for shares
      case 'friend_request':
      case 'friend_accept':
        return palette.primary;
      case 'program_fork':
        return palette.secondary;
      case 'workout_milestone':
      case 'goal_achieved':
        return '#FFD700'; // Gold color for achievements
      case 'mention':
        return palette.info;
      case 'gym_announcement':
        return palette.warning;
      default:
        return palette.primary;
    }
  };
  
  const hasActions = notification.notification_type === 'friend_request' && !notification.is_read;
  
  // Handle navigation to related content
  const handlePress = () => {
    // If not read, mark as read
    if (!notification.is_read) {
      // Add visual delay to ensure UI updates before navigation
      onMarkAsRead(notification.id);
      
      // Wait briefly for the API and UI to update before navigating
      setTimeout(() => {
        navigateToContent();
      }, 100);
    } else {
      navigateToContent();
    }
  };
  
  // Extract navigation logic to separate function
  const navigateToContent = () => {
    // Only navigate if there are no actions (like accept/decline buttons)
    if (!hasActions) {
      // Navigate based on notification type
      if (notification.notification_type === 'like' || 
          notification.notification_type === 'comment' || 
          notification.notification_type === 'share') {
        if (notification.object_id) {
          router.push(`/post/${notification.object_id}`);
        }
      } else if (notification.notification_type === 'friend_request') {
        router.push('/friends');
      } else if (notification.notification_type === 'program_fork') {
        if (notification.object_id) {
          router.push(`/program/${notification.object_id}`);
        }
      } else if (notification.notification_type === 'workout_milestone' ||
                notification.notification_type === 'goal_achieved') {
        router.push('/workouts');
      } else if (notification.notification_type === 'gym_announcement') {
        router.push('/gyms');
      }
    }
  };
  
  // Format timestamp
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: false });
  
  // Handle accept friend request
  const handleAccept = () => {
    // Implement accept friend request logic
    onMarkAsRead(notification.id);
    // Add your API call here
  };
  
  // Handle decline friend request
  const handleDecline = () => {
    // Implement decline friend request logic
    onMarkAsRead(notification.id);
    // Add your API call here
  };
  
  // Get user information from userData if available, otherwise fallback to notification data
  const username = userData?.username || notification.sender?.username || t('anonymous');
  const avatarUrl = userData?.avatar 
    ? getAvatarUrl(userData.avatar) 
    : notification.sender?.avatar 
      ? notification.sender.avatar 
      : null;
  
  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem, 
        notification.is_read ? styles.readNotification : styles.unreadNotification
      ]} 
      onPress={handlePress}
      disabled={hasActions}
    >
      {/* Left: Avatar with notification type icon */}
      <View style={styles.avatarWrapper}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.placeholderAvatar, { backgroundColor: palette.primary }]}>
              <Text style={styles.avatarInitial}>
                {username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          {/* Notification type icon */}
          <View 
            style={[
              styles.notificationTypeIcon, 
              { backgroundColor: getIconColor(notification.notification_type) }
            ]}
          >
            <Ionicons 
              name={getNotificationIcon(notification.notification_type)} 
              size={10} 
              color="white" 
            />
          </View>
        </View>
      </View>
      
      {/* Middle: Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.notificationText}>
          {t(`notification.${notification.notification_type}`, {
            username: username,
            content: notification.content || ''
          })}
        </Text>
        <Text style={styles.timeAgo}>{timeAgo}</Text>
        
        {/* Action buttons for friend requests */}
        {hasActions && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.acceptButton} 
              onPress={handleAccept}
            >
              <Text style={styles.acceptButtonText}>{t('accept')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.declineButton} 
              onPress={handleDecline}
            >
              <Text style={styles.declineButtonText}>{t('decline')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Right: Content Preview */}
      <ContentPreview 
        notification={notification}
        postData={postData}
      />
    </TouchableOpacity>
  );
};

// Section header component
const SectionHeader = ({ title }) => {
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const { t } = useLanguage();
  
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{t(title)}</Text>
    </View>
  );
};

export default function NotificationsScreen() {
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const navigation = useNavigation();
  const { t } = useLanguage();
  
  // Get notifications and hooks
  const { data: notifications, isLoading, refetch } = useNotifications();
  const { data: countData } = useNotificationCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();
  const { isConnected: socketConnected, markAsRead: socketMarkAsRead, markAllAsRead: socketMarkAllAsRead } = useNotificationSocket();
  
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Animation value for menu dropdown
  const menuAnimation = useSharedValue(0);
  
  // Toggle menu
  const toggleMenu = () => {
    if (menuVisible) {
      // Animate menu closing
      menuAnimation.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(setMenuVisible)(false);
      });
    } else {
      setMenuVisible(true);
      // Animate menu opening
      menuAnimation.value = withTiming(1, { duration: 200 });
    }
  };
  
  // Create animated style for menu
  const menuAnimatedStyle = useAnimatedStyle(() => {
    const opacity = menuAnimation.value;
    const translateY = interpolate(
      menuAnimation.value,
      [0, 1],
      [-20, 0]
    );
    
    return {
      opacity,
      transform: [{ translateY }]
    };
  });
  
  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  
  // Handle mark as read
  const handleMarkAsRead = (id) => {
    // Use the React Query mutation
    markAsRead.mutate(id);
    
    // Also update via socket for real-time updates
    try {
      if (socketConnected) {
        // Use the socket's markAsRead function from useNotificationSocket
        socketMarkAsRead(id);
      }
    } catch (error) {
      console.error("Error marking notification as read via socket:", error);
    }
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    // Use the React Query mutation
    markAllRead.mutate();
    
    // Also update via socket for real-time updates
    try {
      if (socketConnected) {
        // Use the socket's markAllAsRead function from useNotificationSocket
        socketMarkAllAsRead();
      }
    } catch (error) {
      console.error("Error marking all notifications as read via socket:", error);
    }
    
    setMenuVisible(false);
  };
  
  // Handle filter notifications
  const handleFilterNotifications = (filter) => {
    // Implement filter logic
    setMenuVisible(false);
  };
  
  // Group notifications by date sections
  const getSections = () => {
    if (!notifications || notifications.length === 0) {
      return [];
    }
    
    // Sort notifications by date (newest first)
    const sortedNotifications = [...notifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const sections = [];
    const today = new Date();
    
    // Group for new/today notifications
    const todayNotifications = sortedNotifications.filter(
      notification => isToday(new Date(notification.created_at))
    );
    
    if (todayNotifications.length > 0) {
      sections.push({
        title: 'notification.section.today',
        data: todayNotifications,
      });
    }
    
    // Group for yesterday notifications
    const yesterdayNotifications = sortedNotifications.filter(
      notification => isYesterday(new Date(notification.created_at))
    );
    
    if (yesterdayNotifications.length > 0) {
      sections.push({
        title: 'notification.section.yesterday',
        data: yesterdayNotifications,
      });
    }
    
    // Group for this week (except today and yesterday)
    const thisWeekNotifications = sortedNotifications.filter(notification => {
      const date = new Date(notification.created_at);
      const days = differenceInDays(today, date);
      return !isToday(date) && !isYesterday(date) && days <= 7;
    });
    
    if (thisWeekNotifications.length > 0) {
      sections.push({
        title: 'notification.section.this_week',
        data: thisWeekNotifications,
      });
    }
    
    // Group for older notifications
    const olderNotifications = sortedNotifications.filter(notification => {
      const date = new Date(notification.created_at);
      return differenceInDays(today, date) > 7;
    });
    
    if (olderNotifications.length > 0) {
      sections.push({
        title: 'notification.section.earlier',
        data: olderNotifications,
      });
    }
    
    return sections;
  };
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.layout }]}>
      <StatusBar barStyle="light-content" backgroundColor={palette.accent} />
      <View style={[styles.container, { backgroundColor: palette.page_background }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{t('notifications')}</Text>
          </View>
          
          <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Dropdown Menu */}
        {menuVisible && (
          <Animated.View 
            style={[
              styles.dropdownMenu,
              menuAnimatedStyle
            ]}
          >
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleMarkAllAsRead}
            >
              <Ionicons name="checkmark-done" size={18} color={palette.text} />
              <Text style={styles.menuItemText}>{t('mark_all_as_read')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleFilterNotifications('all')}
            >
              <Ionicons name="filter" size={18} color={palette.text} />
              <Text style={styles.menuItemText}>{t('show_all_notifications')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleFilterNotifications('unread')}
            >
              <Ionicons name="eye" size={18} color={palette.text} />
              <Text style={styles.menuItemText}>{t('show_unread_only')}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {/* Connection Status Indicator */}
        {!socketConnected && (
          <Animated.View 
            entering={FadeIn.duration(300)} 
            exiting={FadeOut.duration(300)} 
            style={styles.connectionStatus}
          >
            <Text style={styles.connectionText}>{t('connecting_to_notifications')}</Text>
          </Animated.View>
        )}
        
        {/* Notification List */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
        ) : notifications?.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color={palette.text} />
            <Text style={styles.emptyText}>{t('no_notifications_yet')}</Text>
          </View>
        ) : (
          <SectionList
            sections={getSections()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <NotificationItem 
                notification={item} 
                onMarkAsRead={handleMarkAsRead} 
              />
            )}
            renderSectionHeader={({ section: { title } }) => (
              <SectionHeader title={title} />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={[palette.primary]}
                tintColor={palette.primary}
              />
            }
            stickySectionHeadersEnabled={true}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const themedStyles = createThemedStyles((palette) => ({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: palette.layout,
  },
  container: {
    flex: 1,
    backgroundColor: palette.page_background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: palette.layout,
    borderBottomWidth: 0,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  menuButton: {
    padding: 8,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: palette.page_background,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  menuItemText: {
    marginLeft: 8,
    color: palette.text,
    fontSize: 14,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionStatus: {
    backgroundColor: palette.highlight,
    padding: 8,
    alignItems: 'center',
  },
  connectionText: {
    color: palette.text,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 0, 
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
  },
  readNotification: {
    backgroundColor: 'transparent',
  },
  unreadNotification: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)', // Subtle background for unread
  },
  avatarWrapper: {
    marginRight: 12,
  },
  avatarContainer: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  placeholderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.primary,
  },
  avatarInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  notificationTypeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.page_background,
  },
  contentContainer: {
    flex: 1,
    marginRight: 10,
  },
  notificationText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  timeAgo: {
    color: palette.text,
    fontSize: 13,
  },
  contentPreview: {
    width: 50,
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: 50,
    height: 50,
  },
  postIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  profileIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  programIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  achievementIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  gymIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  typeIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    padding: 4,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: palette.layout,
    marginVertical: 4,
    borderRadius: 8,
  },
  sectionHeaderText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    color: palette.text,
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: palette.accent,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 13,
  },
  declineButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  declineButtonText: {
    color: palette.text,
    fontWeight: '500',
    fontSize: 13,
  },
}));