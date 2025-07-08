// components/shared/OverlappedAvatars.tsx
import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { useUser } from '../../hooks/query/useUserQuery';
import { getAvatarUrl } from '../../utils/imageUtils';

interface OverlappedAvatarsProps {
  userIds: number[];
  size?: 'small' | 'medium' | 'large';
  maxVisible?: number;
  onUserPress?: (userId: number) => void;
  style?: any;
}

const OverlappedAvatars: React.FC<OverlappedAvatarsProps> = ({
  userIds = [],
  size = 'medium',
  maxVisible = 3,
  onUserPress,
  style
}) => {
  if (!userIds || userIds.length === 0) {
    return null;
  }

  const sizeMap = {
    small: { width: 24, height: 24, borderRadius: 12, overlap: 16 },
    medium: { width: 32, height: 32, borderRadius: 16, overlap: 20 },
    large: { width: 40, height: 40, borderRadius: 20, overlap: 24 }
  };

  const avatarSize = sizeMap[size];
  const visibleUsers = userIds.slice(0, maxVisible);
  const remainingCount = userIds.length - maxVisible;

  return (
    <View style={[styles.container, style]}>
      {visibleUsers.map((userId, index) => (
        <AvatarItem
          key={userId}
          userId={userId}
          size={avatarSize}
          index={index}
          onPress={onUserPress}
        />
      ))}
      
      {remainingCount > 0 && (
        <View 
          style={[
            styles.avatar,
            {
              width: avatarSize.width,
              height: avatarSize.height,
              borderRadius: avatarSize.borderRadius,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              left: visibleUsers.length * avatarSize.overlap,
            }
          ]}
        >
          <Text style={[styles.remainingText, { fontSize: avatarSize.width * 0.3 }]}>
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
};

interface AvatarItemProps {
  userId: number;
  size: any;
  index: number;
  onPress?: (userId: number) => void;
}

const AvatarItem: React.FC<AvatarItemProps> = ({ userId, size, index, onPress }) => {
  const { data: user, isLoading } = useUser(userId);
  
  const handlePress = () => {
    if (onPress) {
      onPress(userId);
    }
  };

  if (isLoading || !user) {
    return (
      <View 
        style={[
          styles.avatar,
          styles.loadingAvatar,
          {
            width: size.width,
            height: size.height,
            borderRadius: size.borderRadius,
            left: index * size.overlap,
          }
        ]}
      />
    );
  }

  const avatarUrl = getAvatarUrl(user?.avatar);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.avatar,
        {
          width: size.width,
          height: size.height,
          borderRadius: size.borderRadius,
          left: index * size.overlap,
        }
      ]}
      disabled={!onPress}
    >
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.avatarImage,
          {
            width: size.width,
            height: size.height,
            borderRadius: size.borderRadius,
          }
        ]}
        // Use a fallback to the generated avatar URL instead of a local asset
        onError={() => {
          // If the image fails to load, the avatarUrl already contains a fallback
          // from the getAvatarUrl function, so no additional handling needed
        }}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  loadingAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  remainingText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default OverlappedAvatars;