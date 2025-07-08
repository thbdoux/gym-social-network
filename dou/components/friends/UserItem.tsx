// components/friends/UserItem.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getAvatarUrl } from '../../utils/imageUtils';

interface User {
  id: number;
  username: string;
  avatar?: string;
  training_level?: string;
  personality_type?: string;
}

interface UserItemProps {
  user: User;
  onPress: () => void;
  rightComponent?: React.ReactNode;
  showProfileNavigation?: boolean;
}

export default function UserItem({ 
  user, 
  onPress, 
  rightComponent,
  showProfileNavigation = false 
}: UserItemProps) {
  const { palette } = useTheme();
  const { t } = useLanguage();
  // Format text utility
  const formatText = (text?: string): string => {
    if (!text) return '';
    return text
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get initials for avatar fallback
  const getInitials = (name?: string): string => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: `${palette.accent}B3` }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {user.avatar ? (
        <Image source={{ uri: getAvatarUrl(user.avatar, 80) }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: palette.highlight }]}>
          <Text style={styles.avatarText}>{getInitials(user.username)}</Text>
        </View>
      )}
      
      <View style={styles.userInfo}>
        <Text style={[styles.username, { color: palette.text }]}>{user.username}</Text>
        <Text style={[styles.userDetail, { color: `${palette.text}80` }]}>
          {formatText(user.training_level || '')}
          {user.training_level && user.personality_type && " • "}
          {formatText(user.personality_type || '')}
        </Text>
      </View>
      
      <View style={styles.rightSection}>
        {rightComponent}
        {showProfileNavigation && (
          <Ionicons name="chevron-forward" size={20} color={`${palette.text}60`} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 14,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});