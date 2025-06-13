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

  const sendTestNotification = async () => {
    try {
      await notificationService.sendTestNotification();
      Alert.alert('Success', 'Test notification sent! Check your device.');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
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

        {/* Test Button */}
        <TouchableOpacity 
          style={styles.testButton} 
          onPress={sendTestNotification}
          disabled={!preferences?.push_notifications_enabled}
        >
          <Ionicons name="send" size={20} color="white" />
          <Text style={styles.testButtonText}>{t('send_test_notification')}</Text>
        </TouchableOpacity>

        {/* Notification Types */}
        <Text style={styles.sectionHeader}>{t('notification_types')}</Text>
        
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
          title={t('friend_requests')}
          description={t('when_someone_sends_friend_request')}
          value={preferences?.push_friend_requests ?? true}
          onValueChange={(value) => updatePreference('push_friend_requests', value)}
          disabled={!preferences?.push_notifications_enabled}
        />

        <NotificationToggle
          title={t('workout_milestones')}
          description={t('workout_achievements_and_goals')}
          value={preferences?.push_workout_milestones ?? true}
          onValueChange={(value) => updatePreference('push_workout_milestones', value)}
          disabled={!preferences?.push_notifications_enabled}
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
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  testButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
}));