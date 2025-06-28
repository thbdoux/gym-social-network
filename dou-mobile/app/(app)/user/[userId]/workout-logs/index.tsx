// app/(app)/user/[userId]/workout-logs/index.tsx
import React, { useState, useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../../../context/LanguageContext';
import { useTheme } from '../../../../../context/ThemeContext';
import { createThemedStyles } from '../../../../../utils/createThemedStyles';
import CustomLoadingScreen from '../../../../../components/shared/CustomLoadingScreen';
import WorkoutLogCard from '../../../../../components/workouts/WorkoutLogCard';
import { useUserLogs } from '../../../../../hooks/query/useLogQuery';
import { useUser } from '../../../../../hooks/query/useUserQuery';

export default function UserWorkoutLogsScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { t } = useLanguage();
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user data to get username
  const { data: profileUser, isLoading: userLoading } = useUser(userId);
  
  // Fetch logs for the user using username
  const { 
    data: logs = [], 
    isLoading: logsLoading, 
    refetch: refetchLogs 
  } = useUserLogs(profileUser?.username);

  // Filter logs to show only the user's logs
  const userLogs = logs.filter(log => log.username === profileUser?.username);

  const isLoading = userLoading || logsLoading;

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchLogs();
    } catch (error) {
      console.error('Error refreshing workout logs:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchLogs]);

  // Handle back navigation
  const handleGoBack = () => {
    router.back();
  };

  // Handle workout log click
  const handleWorkoutLogClick = (logId: number) => {
    router.push(`/workout-log/${logId}`);
  };

  // Render loading state
  if (isLoading && !refreshing) {
    return (
      <CustomLoadingScreen 
        animationType="bounce"
        text={t('loading')}
        size="large"
        preloadImages={true}
      />
    );
  }

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons 
        name="barbell-outline" 
        size={80} 
        color={palette.text_secondary} 
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyTitle, { color: palette.text }]}>
        {t('no_workout_logs')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: palette.text_secondary }]}>
        {t('user_has_no_logs')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.layout }]}>
      <StatusBar barStyle="light-content" backgroundColor={palette.accent} />
      
      <View style={[styles.container, { backgroundColor: palette.page_background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: palette.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.screenTitle, { color: palette.text }]}>
              {profileUser?.username ? `${profileUser.username} - ${t('workout_logs')}` : t('workout_logs')}
            </Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={palette.text}
              colors={[palette.text]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {userLogs.length === 0 ? (
            <EmptyState />
          ) : (
            <View style={styles.logsContainer}>
              {userLogs.map((log) => (
                <View key={`log-${log.id}`} style={styles.cardContainer}>
                  <WorkoutLogCard
                    logId={log.id}
                    log={log}
                    user={profileUser?.username || ''}
                    onWorkoutLogClick={handleWorkoutLogClick}
                    disableNavigation={false}
                    selectionMode={false}
                    isSelected={false}
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const themedStyles = createThemedStyles((palette) => ({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: palette.page_background,
  },
  container: {
    flex: 1,
    backgroundColor: palette.page_background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    backgroundColor: palette.layout,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  logsContainer: {
    gap: 0,
  },
  cardContainer: {
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 24,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
}));