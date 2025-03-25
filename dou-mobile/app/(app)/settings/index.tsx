// app/(app)/settings/index.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { useLogout } from '../../../hooks/query/useUserQuery';

export default function SettingsScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const logout = useLogout();

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('are_you_sure_you_want_to_logout'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('settings')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('account')}</Text>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/profile')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="person-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{t('profile')}</Text>
                <Text style={styles.settingDescription}>
                  {t('view_and_edit_your_profile')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/settings/language')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{t('language')}</Text>
                <Text style={styles.settingDescription}>
                  {t('change_app_language')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('other')}</Text>

          <View style={styles.card}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={[styles.iconContainer, { backgroundColor: '#6B7280' }]}>
                <Ionicons name="help-circle-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{t('help_support')}</Text>
                <Text style={styles.settingDescription}>
                  {t('get_help_and_contact_support')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
              <View style={[styles.iconContainer, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{t('logout')}</Text>
                <Text style={styles.settingDescription}>
                  {t('sign_out_of_your_account')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    paddingLeft: 8,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  version: {
    color: '#6B7280',
    fontSize: 14,
  },
});