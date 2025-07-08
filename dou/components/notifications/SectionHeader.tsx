// components/notifications/SectionHeader.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { createThemedStyles } from '../../utils/createThemedStyles';

interface SectionHeaderProps {
  title: string;
  count?: number;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, count }) => {
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const { t } = useLanguage();
  
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionHeaderText}>{t(title)}</Text>
        {count !== undefined && count > 0 && (
          <View style={styles.sectionCount}>
            <Text style={styles.sectionCountText}>{count}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const themedStyles = createThemedStyles((palette) => ({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: palette.layout,
    marginVertical: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  sectionCount: {
    backgroundColor: palette.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  sectionCountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
}));