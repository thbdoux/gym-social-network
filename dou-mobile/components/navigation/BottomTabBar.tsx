// components/navigation/BottomTabBar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';

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
  
  const navigateTo = (route: string): void => {
    router.push(route);
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
      
      <TabBarItem
        label={t('profile')}
        icon="person"
        route="/profile"
        current={pathname === '/profile'}
        onPress={() => navigateTo('/profile')}
      />
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
});

export default BottomTabBar;