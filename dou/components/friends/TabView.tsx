// components/friends/TabView.tsx
import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';

interface TabViewProps {
  activeTab: 'friends' | 'requests' | 'discover';
  onTabChange: (tab: 'friends' | 'requests' | 'discover') => void;
  children: React.ReactElement[];
  scrollY: any; // Keep for compatibility but not used
  style?: any;
}

export default function TabView({ 
  activeTab, 
  onTabChange, 
  children, 
  scrollY,
  style 
}: TabViewProps) {
  const tabs = ['friends', 'requests', 'discover'] as const;
  const activeIndex = tabs.indexOf(activeTab);

  return (
    <View style={[styles.container, style]}>
      {children[activeIndex]}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});