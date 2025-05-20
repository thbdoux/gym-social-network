// components/feed/FeedViewSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles, withAlpha } from '../../utils/createThemedStyles';

// Define constants for view types
export const FEED_VIEW_TYPES = {
  DISCOVER: 'discover',
  FRIENDS: 'friends'
};

// Define order of views for potential swiping
export const FEED_VIEW_ORDER = [
  FEED_VIEW_TYPES.DISCOVER,
  FEED_VIEW_TYPES.FRIENDS
];

interface FeedViewSelectorProps {
  currentView: string;
  changeView: (viewType: string) => void;
}

const FeedViewSelector: React.FC<FeedViewSelectorProps> = ({
  currentView,
  changeView,
}) => {
  const { t } = useLanguage();
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.tab, 
          currentView === FEED_VIEW_TYPES.DISCOVER && styles.activeTab,
          { borderBottomColor: currentView === FEED_VIEW_TYPES.DISCOVER ? palette.text : 'transparent' }
        ]}
        onPress={() => changeView(FEED_VIEW_TYPES.DISCOVER)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.tabText, 
          currentView === FEED_VIEW_TYPES.DISCOVER && styles.activeTabText,
          { color: currentView === FEED_VIEW_TYPES.DISCOVER ? palette.text : palette.border }
        ]}>
          {t('discover') || 'Discover'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.tab, 
          currentView === FEED_VIEW_TYPES.FRIENDS && styles.activeTab,
          { borderBottomColor: currentView === FEED_VIEW_TYPES.FRIENDS ? palette.text : 'transparent' }
        ]}
        onPress={() => changeView(FEED_VIEW_TYPES.FRIENDS)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.tabText, 
          currentView === FEED_VIEW_TYPES.FRIENDS && styles.activeTabText,
          { color: currentView === FEED_VIEW_TYPES.FRIENDS ? palette.text : palette.border }
        ]}>
          {t('friends') || 'Friends'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const themedStyles = createThemedStyles((palette) => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: palette.page_background,
    paddingBottom:12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 3,
  },
  activeTab: {
    borderBottomWidth: 3,
    
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '700',
  },
}));

export default FeedViewSelector;