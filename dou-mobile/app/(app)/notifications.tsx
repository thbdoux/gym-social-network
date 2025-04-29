// app/(app)/notifications.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { 
  useNotifications, 
  useMarkNotificationAsRead, 
  useMarkAllNotificationsAsRead,
  useNotificationCount 
} from '../../hooks/query/useNotificationQuery';
import { useNotificationSocket } from '../../hooks/useNotificationSocket';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles } from '../../utils/createThemedStyles';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { router, useNavigation } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { Image } from 'expo-image';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  
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
  
  // Handle navigation to related content
  const handlePress = () => {
    // If not read, mark as read
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    
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
  };
  
  // Format timestamp
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });
  
  return (
    <TouchableOpacity 
      style={[styles.notificationItem, !notification.is_read && styles.unreadItem]} 
      onPress={handlePress}
    >
      {/* Left: Icon or Avatar */}
      <View style={styles.iconContainer}>
        {notification.sender?.avatar ? (
          <Image source={{ uri: notification.sender.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.iconCircle, { backgroundColor: palette.primary }]}>
            <Ionicons 
              name={getNotificationIcon(notification.notification_type)} 
              size={18} 
              color="white" 
            />
          </View>
        )}
      </View>
      
      {/* Middle: Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.notificationText}>{notification.content}</Text>
        <Text style={styles.timeAgo}>{timeAgo}</Text>
      </View>
      
      {/* Right: Unread indicator */}
      {!notification.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

export default function NotificationsScreen() {
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const navigation = useNavigation();
  
  // Get notifications and hooks
  const { data: notifications, isLoading, refetch } = useNotifications();
  const { data: countData } = useNotificationCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();
  const { isConnected: socketConnected } = useNotificationSocket();
  
  const [refreshing, setRefreshing] = useState(false);
  
  // Set up navigation header
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Notifications',
      headerRight: () => (
        <TouchableOpacity 
          style={{ marginRight: 16 }} 
          onPress={() => markAllRead.mutate()}
        >
          <Text style={{ color: palette.primary }}>Mark all read</Text>
        </TouchableOpacity>
      )
    });
  }, [navigation, palette]);
  
  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  
  // Handle mark as read
  const handleMarkAsRead = (id) => {
    markAsRead.mutate(id);
  };
  
  return (
    <View style={styles.container}>
      {/* Connection Status Indicator */}
      {!socketConnected && (
        <Animated.View 
          entering={FadeIn.duration(300)} 
          exiting={FadeOut.duration(300)} 
          style={styles.connectionStatus}
        >
          <Text style={styles.connectionText}>Connecting to notifications...</Text>
        </Animated.View>
      )}
      
      {/* Notification List */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : notifications?.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off" size={64} color={palette.text_secondary} />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <NotificationItem 
              notification={item} 
              onMarkAsRead={handleMarkAsRead} 
            />
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
        />
      )}
    </View>
  );
}

const themedStyles = createThemedStyles((palette) => ({
  container: {
    flex: 1,
    backgroundColor: palette.page_background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionStatus: {
    backgroundColor: palette.warning,
    padding: 8,
    alignItems: 'center',
  },
  connectionText: {
    color: palette.text_dark,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: palette.card_background,
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: palette.primary + '10', // 10% opacity primary color
  },
  iconContainer: {
    marginRight: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  contentContainer: {
    flex: 1,
  },
  notificationText: {
    color: palette.text,
    fontSize: 14,
    marginBottom: 4,
  },
  timeAgo: {
    color: palette.text_secondary,
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.primary,
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    color: palette.text_secondary,
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
}));