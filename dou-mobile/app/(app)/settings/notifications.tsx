// app/(app)/settings/notifications.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import notificationService, { NotificationPreferences } from '../../../api/services/notificationService';

export default function NotificationSettingsScreen() {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const styles = themedStyles(palette);

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await notificationService.getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    try {
      setSaving(true);
      
      const updatedPreferences = { ...preferences, [key]: value };
      setPreferences(updatedPreferences);

      await notificationService.updateNotificationPreferences({ [key]: value });
    } catch (error) {
      console.error('Error updating preference:', error);
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to update notification preference');
    } finally {
      setSaving(false);
    }
  };

  // Handle clearing old notifications
  const handleClearOldNotifications = async () => {
    Alert.alert(
      t('notifications.settings.clear_old_title'),
      t('notifications.settings.clear_old_desc'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('notifications.settings.clear_confirm'),
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              await notificationService.clearOldNotifications(30);
              Alert.alert(t('success'), t('notifications.settings.clear_success'));
            } catch (error) {
              console.error('Failed to clear notifications:', error);
              Alert.alert(t('error'), t('notifications.settings.clear_failed'));
            } finally {
              setIsClearing(false);
            }
          }
        }
      ]
    );
  };

  // Handle clearing all notifications
  const handleClearAllNotifications = async () => {
    Alert.alert(
      t('notifications.settings.clear_all_title'),
      t('notifications.settings.clear_all_desc'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('notifications.settings.clear_all_confirm'),
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              await notificationService.clearAllNotifications();
              Alert.alert(t('success'), t('notifications.settings.clear_all_success'));
            } catch (error) {
              console.error('Failed to clear all notifications:', error);
              Alert.alert(t('error'), t('notifications.settings.clear_failed'));
            } finally {
              setIsClearing(false);
            }
          }
        }
      ]
    );
  };

  const NotificationToggle = ({ 
    title, 
    description, 
    value, 
    onValueChange, 
    disabled = false 
  }: {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View style={styles.toggleItem}>
      <View style={styles.toggleContent}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || saving}
        thumbColor={value ? palette.primary : palette.text}
        trackColor={{ false: palette.highlight, true: palette.accent }}
      />
    </View>
  );

  const ActionButton = ({ 
    title, 
    description, 
    onPress, 
    icon, 
    color = palette.primary,
    disabled = false 
  }: {
    title: string;
    description: string;
    onPress: () => void;
    icon: string;
    color?: string;
    disabled?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.actionButton, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon as any} size={20} color={color} />
      <View style={styles.actionContent}>
        <Text style={[styles.actionTitle, { color }]}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      {disabled ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={palette.text} />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>{t('loading_preferences')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Master Toggle */}
        <Text style={styles.sectionHeader}>{t('push_notifications')}</Text>
        <NotificationToggle
          title={t('enable_push_notifications')}
          description={t('receive_notifications_on_device')}
          value={preferences?.push_notifications_enabled ?? true}
          onValueChange={(value) => updatePreference('push_notifications_enabled', value)}
        />

        {/* Social Notification Types */}
        <Text style={styles.sectionHeader}>{t('social_notifications')}</Text>
        
        <NotificationToggle
          title={t('likes')}
          description={t('when_someone_likes_your_post')}
          value={preferences?.push_likes ?? true}
          onValueChange={(value) => updatePreference('push_likes', value)}
          disabled={!preferences?.push_notifications_enabled}
        />

        <NotificationToggle
          title={t('comments')}
          description={t('when_someone_comments_on_your_post')}
          value={preferences?.push_comments ?? true}
          onValueChange={(value) => updatePreference('push_comments', value)}
          disabled={!preferences?.push_notifications_enabled}
        />

        <NotificationToggle
          title={t('mentions')}
          description={t('when_someone_mentions_you')}
          value={preferences?.push_mentions ?? true}
          onValueChange={(value) => updatePreference('push_mentions', value)}
          disabled={!preferences?.push_notifications_enabled}
        />

        <NotificationToggle
          title={t('friend_requests')}
          description={t('when_someone_sends_friend_request')}
          value={preferences?.push_friend_requests ?? true}
          onValueChange={(value) => updatePreference('push_friend_requests', value)}
          disabled={!preferences?.push_notifications_enabled}
        />

        <NotificationToggle
          title={t('shares')}
          description={t('when_someone_shares_your_content')}
          value={preferences?.push_shares ?? true}
          onValueChange={(value) => updatePreference('push_shares', value)}
          disabled={!preferences?.push_notifications_enabled}
        />

        {/* Workout & Program Notifications */}
        <Text style={styles.sectionHeader}>{t('workout_program_notifications')}</Text>

        <NotificationToggle
          title={t('workout_milestones')}
          description={t('workout_achievements_and_goals')}
          value={preferences?.push_workout_milestones ?? true}
          onValueChange={(value) => updatePreference('push_workout_milestones', value)}
          disabled={!preferences?.push_notifications_enabled}
        />

        <NotificationToggle
          title={t('workout_invitations')}
          description={t('when_invited_to_group_workouts')}
          value={preferences?.push_workout_invitations ?? true}
          onValueChange={(value) => updatePreference('push_workout_invitations', value)}
          disabled={!preferences?.push_notifications_enabled}
        />

        <NotificationToggle
          title={t('workout_reminders')}
          description={t('scheduled_workout_reminders')}
          value={preferences?.push_workout_reminders ?? true}
          onValueChange={(value) => updatePreference('push_workout_reminders', value)}
          disabled={!preferences?.push_notifications_enabled}
        />

        <NotificationToggle
          title={t('program_interactions')}
          description={t('when_programs_are_used_or_forked')}
          value={preferences?.push_program_interactions ?? true}
          onValueChange={(value) => updatePreference('push_program_interactions', value)}
          disabled={!preferences?.push_notifications_enabled}
        />

        {/* System & Announcements */}
        <Text style={styles.sectionHeader}>{t('system_notifications')}</Text>

        <NotificationToggle
          title={t('system_updates')}
          description={t('app_updates_and_maintenance')}
          value={preferences?.push_system_updates ?? true}
          onValueChange={(value) => updatePreference('push_system_updates', value)}
          disabled={!preferences?.push_notifications_enabled}
        />

        <NotificationToggle
          title={t('gym_announcements')}
          description={t('announcements_from_your_gym')}
          value={preferences?.push_gym_announcements ?? true}
          onValueChange={(value) => updatePreference('push_gym_announcements', value)}
          disabled={!preferences?.push_notifications_enabled}
        />

        <NotificationToggle
          title={t('challenges')}
          description={t('challenge_invitations_and_results')}
          value={preferences?.push_challenges ?? true}
          onValueChange={(value) => updatePreference('push_challenges', value)}
          disabled={!preferences?.push_notifications_enabled}
        />

        {/* Email Notifications */}
        <Text style={styles.sectionHeader}>{t('email_notifications')}</Text>

        <NotificationToggle
          title={t('email_digest')}
          description={t('daily_summary_via_email')}
          value={preferences?.email_notifications ?? false}
          onValueChange={(value) => updatePreference('email_notifications', value)}
        />

        <NotificationToggle
          title={t('email_weekly_summary')}
          description={t('weekly_activity_summary')}
          value={preferences?.email_weekly_summary ?? false}
          onValueChange={(value) => updatePreference('email_weekly_summary', value)}
        />

        {/* Frequency Settings */}
        <Text style={styles.sectionHeader}>{t('notification_frequency')}</Text>

        <NotificationToggle
          title={t('instant_notifications')}
          description={t('receive_notifications_immediately')}
          value={preferences?.instant_notifications ?? true}
          onValueChange={(value) => updatePreference('instant_notifications', value)}
          disabled={!preferences?.push_notifications_enabled}
        />

        <NotificationToggle
          title={t('quiet_hours')}
          description={t('no_notifications_during_sleep')}
          value={preferences?.quiet_hours ?? false}
          onValueChange={(value) => updatePreference('quiet_hours', value)}
          disabled={!preferences?.push_notifications_enabled}
        />

        {/* Clear Options */}
        <Text style={styles.sectionHeader}>{t('notification_management')}</Text>

        <ActionButton
          title={t('clear_old_notifications')}
          description={t('remove_notifications_older_than_30_days')}
          icon="time"
          onPress={handleClearOldNotifications}
          disabled={isClearing}
        />

        <ActionButton
          title={t('clear_all_notifications')}
          description={t('remove_all_notifications_permanently')}
          icon="trash"
          color={palette.warning}
          onPress={handleClearAllNotifications}
          disabled={isClearing}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const themedStyles = createThemedStyles((palette) => ({
  container: {
    flex: 1,
    backgroundColor: palette.page_background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: palette.text,
    fontSize: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.text,
    marginTop: 24,
    marginBottom: 12,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: palette.highlight,
    borderRadius: 12,
    marginBottom: 8,
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.text,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: palette.text,
    opacity: 0.7,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: palette.highlight,
    borderRadius: 12,
    marginBottom: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: palette.text,
    opacity: 0.7,
  },
}));