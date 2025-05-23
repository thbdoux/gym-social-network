// components/UserAvatar.tsx
import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet, ActivityIndicator } from 'react-native';
import { getAvatarUrl } from '../../utils/imageUtils';
import userService from '../../api/services/userService';

interface UserAvatarProps {
  avatarPath?: string | null;
  size?: number;
  style?: any;
  userId?: number;
  forceRefresh?: boolean;
}

/**
 * Component to display user avatars with proper error handling and refresh capabilities
 */
const UserAvatar: React.FC<UserAvatarProps> = ({ 
  avatarPath, 
  size = 120, 
  style = {},
  userId,
  forceRefresh = false
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadAvatar = async () => {
      setIsLoading(true);
      setImageError(false);
      
      try {
        // Check if this user just updated their avatar
        const lastUploadedPath = userService.getLastUploadedAvatarPath();
        const shouldBustCache = forceRefresh || !!lastUploadedPath;
        
        // Determine which avatar path to use
        let pathToUse = avatarPath;
        
        // If this is the user who just updated their avatar, use the latest path
        if (lastUploadedPath) {
          console.log('Using last uploaded path instead of provided path');
          pathToUse = lastUploadedPath;
          // Clear it once we've used it
          userService.clearLastUploadedAvatarPath();
        }
        
        // Get the URL with potential cache busting
        const url = getAvatarUrl(pathToUse, size, shouldBustCache);
        console.log('Avatar display URL:', url);
        setImageUrl(url);
      } catch (error) {
        console.error('Error setting avatar URL:', error);
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadAvatar();
  }, [avatarPath, size, forceRefresh]);

  // If we're loading, show a loading indicator
  if (isLoading) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  }

  // If there was an error or no URL, show a placeholder
  if (imageError || !imageUrl) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <Image
          source={{ uri: `https://ui-avatars.com/api/?name=U&size=${size}&background=random` }}
          style={styles.image}
          onLoad={() => console.log('Placeholder avatar loaded')}
        />
      </View>
    );
  }

  // Otherwise, show the actual avatar
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        onError={(e) => {
          console.error('Error loading avatar image:', e.nativeEvent.error);
          setImageError(true);
        }}
        onLoad={() => console.log('Avatar image loaded successfully')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default UserAvatar;