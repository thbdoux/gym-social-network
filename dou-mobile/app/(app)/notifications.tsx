// app/(app)/notifications.tsx - SIMPLIFIED VERSION
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  RefreshControl,
  StatusBar,
  Platform,
  SafeAreaView,
  SectionList
} from 'react-native';
import { 
  useNotifications, 
  useMarkNotificationAsRead, 
  useMarkAllNotificationsAsRead,
  useNotificationCount
} from '../../hooks/query/useNotificationQuery';
import { useRealTimeNotifications, useNotificationRefresh } from '../../hooks/useRealTimeNotifications';
import { useNotificationSocket } from '../../hooks/useNotificationSocket';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles } from '../../utils/createThemedStyles';
import { router } from 'expo-router';
import { isToday, isYesterday, differenceInDays } from 'date-fns';
import { useLanguage } from '../../context/LanguageContext';
import CustomLoadingScreen from '../../components/shared/CustomLoadingScreen';
import { NotificationItem } from '../../components/notifications/NotificationItem';
import { SectionHeader } from '../../components/notifications/SectionHeader';

export default function NotificationsScreen() {
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const { t } = useLanguage();

  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<number>>(new Set());
  
  // Refs for performance
  const lastRefreshTime = useRef(0);
  const refreshThrottle = 2000; // 2 seconds between refreshes
  
  // Enhanced real-time configuration
  const realTimeConfig = useMemo(() => ({
    enablePushUpdates: true,
    enableWebSocketUpdates: true,
    enableAppStateUpdates: true,
    enablePeriodicUpdates: true,
    periodicInterval: 60000,
    debugMode: __DEV__,
  }), []);

  // Enhanced hooks
  const {
    isRealTimeActive,
    socketConnected,
    manualRefresh: realtimeManualRefresh,
  } = useRealTimeNotifications(realTimeConfig);

  const { refresh: manualRefresh } = useNotificationRefresh();
  
  // Query hooks
  const { 
    data: notifications, 
    isLoading, 
    refetch, 
    error 
  } = useNotifications({
    refetchInterval: socketConnected ? false : 30000,
  });
  
  const { data: countData, refetch: refetchCount } = useNotificationCount();
  
  // Mutation hooks
  const markAsRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();
  
  // Socket integration
  const { 
    isConnected: socketStatus, 
    markAsRead: socketMarkAsRead, 
    markAllAsRead: socketMarkAllAsRead,
  } = useNotificationSocket();
  
  // Enhanced refresh with throttling
  const onRefresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshTime.current < refreshThrottle) return;
    
    lastRefreshTime.current = now;
    setRefreshing(true);
    
    try {
      await Promise.allSettled([
        refetch(),
        refetchCount(),
        manualRefresh(),
        realtimeManualRefresh(),
      ]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchCount, manualRefresh, realtimeManualRefresh]);
  
  // Enhanced mark as read with socket coordination
  const handleMarkAsRead = useCallback((id: number) => {
    markAsRead.mutate(id);
    if (socketConnected) {
      socketMarkAsRead(id);
    }
  }, [markAsRead, socketConnected, socketMarkAsRead]);
  
  // Enhanced mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    markAllRead.mutate();
    if (socketConnected) {
      socketMarkAllAsRead();
    }
  }, [markAllRead, socketConnected, socketMarkAllAsRead]);
  
  // Notification expansion handling
  const toggleNotificationExpansion = useCallback((id: number) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);
  
  // Enhanced sections with metadata
  const sections = useMemo(() => {
    if (!notifications || notifications.length === 0) return [];
    
    const sortedNotifications = [...notifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const sections = [];
    const today = new Date();
    
    // Today
    const todayNotifications = sortedNotifications.filter(
      notification => isToday(new Date(notification.created_at))
    );
    if (todayNotifications.length > 0) {
      sections.push({
        title: 'notifications.sections.today',
        data: todayNotifications,
        count: todayNotifications.filter(n => !n.is_read).length,
      });
    }
    
    // Yesterday
    const yesterdayNotifications = sortedNotifications.filter(
      notification => isYesterday(new Date(notification.created_at))
    );
    if (yesterdayNotifications.length > 0) {
      sections.push({
        title: 'notifications.sections.yesterday',
        data: yesterdayNotifications,
        count: yesterdayNotifications.filter(n => !n.is_read).length,
      });
    }
    
    // This week
    const thisWeekNotifications = sortedNotifications.filter(notification => {
      const date = new Date(notification.created_at);
      const days = differenceInDays(today, date);
      return !isToday(date) && !isYesterday(date) && days <= 7;
    });
    if (thisWeekNotifications.length > 0) {
      sections.push({
        title: 'notifications.sections.this_week',
        data: thisWeekNotifications,
        count: thisWeekNotifications.filter(n => !n.is_read).length,
      });
    }
    
    // Earlier
    const olderNotifications = sortedNotifications.filter(notification => {
      const date = new Date(notification.created_at);
      return differenceInDays(today, date) > 7;
    });
    if (olderNotifications.length > 0) {
      sections.push({
        title: 'notifications.sections.earlier',
        data: olderNotifications,
        count: olderNotifications.filter(n => !n.is_read).length,
      });
    }
    
    return sections;
  }, [notifications]);
  
  // Render functions
  const renderItem = useCallback(({ item }) => (
    <NotificationItem 
      notification={item} 
      onMarkAsRead={handleMarkAsRead}
      isExpanded={expandedNotifications.has(item.id)}
      onToggleExpand={toggleNotificationExpansion}
    />
  ), [handleMarkAsRead, expandedNotifications, toggleNotificationExpansion]);

  const renderSectionHeader = useCallback(({ section: { title, count } }) => (
    <SectionHeader title={title} count={count} />
  ), []);

  const keyExtractor = useCallback((item) => `notification-${item.id}`, []);
  
  if (isLoading) {
    return (
      <CustomLoadingScreen 
        text={t('notifications.loading')}
        animationType='pulse'
        size="large"
        preloadImages={true}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.layout }]}>
      <StatusBar barStyle="light-content" backgroundColor={palette.layout} />
      
      <View style={[styles.container, { backgroundColor: palette.page_background }]}>
        {/* Simplified header with three action buttons */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
            {countData?.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{countData.unread}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.headerRight}>
            {/* Refresh button */}
            <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
              <Ionicons name="refresh" size={20} color="white" />
            </TouchableOpacity>
            
            {/* Mark all read button */}
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerButton}>
              <Ionicons name="checkmark-done" size={20} color="white" />
            </TouchableOpacity>
            
            {/* Settings button */}
            <TouchableOpacity 
              onPress={() => router.push('/settings/notifications')} 
              style={styles.headerButton}
            >
              <Ionicons name="settings" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Content */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={palette.warning} />
            <Text style={styles.errorText}>{t('notifications.load_error')}</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>{t('notifications.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : sections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color={palette.text} />
            <Text style={styles.emptyTitle}>{t('notifications.no_notifications')}</Text>
            <Text style={styles.emptyText}>{t('notifications.no_notifications_desc')}</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <Text style={styles.refreshButtonText}>{t('notifications.check_now')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
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
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={20}
            getItemLayout={(data, index) => ({
              length: 100,
              offset: 100 * index,
              index
            })}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// Simplified styles
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
    paddingVertical: 12,
    backgroundColor: palette.layout,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
  },
  unreadBadge: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: palette.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  refreshButton: {
    marginTop: 20,
    backgroundColor: palette.layout,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: palette.text,
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: palette.layout,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
}));