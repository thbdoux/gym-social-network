// components/navigation/BottomTabBar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';

interface TabBarItemProps {
  label: string;
  icon: string;
  route: string;
  current: boolean;
  onPress: () => void;
}

const TabBarItem: React.FC<TabBarItemProps> = ({ label, icon, current, onPress }) => (
  <TouchableOpacity
    style={styles.tabItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons
      name={current ? icon : `${icon}-outline`}
      size={24}
      color={current ? '#3B82F6' : '#9CA3AF'}
    />
    <Text style={[styles.tabLabel, current && styles.tabLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const BottomTabBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const navigateTo = (route: string): void => {
    router.push(route);
  };
  
  // Helper function to get initials for the avatar placeholder
  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };
  
  return (
    <View style={styles.container}>
      <TabBarItem
        label={t('feed')}
        icon="newspaper"
        route="/feed"
        current={pathname === '/feed'}
        onPress={() => navigateTo('/feed')}
      />
      
      <TabBarItem
        label={t('workouts')}
        icon="barbell"
        route="/workouts"
        current={pathname === '/workouts'}
        onPress={() => navigateTo('/workouts')}
      />
      
      {/* Profile Tab with User Avatar */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigateTo('/profile')}
        activeOpacity={0.7}
      >
        {user?.profile_picture ? (
          <Image
            source={{ uri: user.profile_picture }}
            style={[
              styles.profileAvatar,
              pathname === '/profile' && styles.profileAvatarActive
            ]}
          />
        ) : (
          <View
            style={[
              styles.profileAvatarPlaceholder,
              pathname === '/profile' && styles.profileAvatarPlaceholderActive
            ]}
          >
            <Text style={styles.profileAvatarText}>
              {getInitials(user?.username)}
            </Text>
          </View>
        )}
        <Text style={[
          styles.tabLabel, 
          pathname === '/profile' && styles.tabLabelActive
        ]}>
          {t('profile')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 2,
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  profileAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  profileAvatarActive: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  profileAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarPlaceholderActive: {
    backgroundColor: '#3B82F6',
  },
  profileAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default BottomTabBar;