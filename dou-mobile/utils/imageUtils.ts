// utils/imageUtils.ts
import { API_BASE_URL, getFullUrl } from '../api/config';

export const getAvatarUrl = (avatarPath, size = 120) => {
  if (!avatarPath) {
    return `https://ui-avatars.com/api/?name=U&size=${size}&background=random`;
  }
  
  // If it's already a full URL, return as is
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // Use the getFullUrl helper from config
  // This will handle cases whether the path has /media prefix or not
  const url = getFullUrl(avatarPath);
  
  // Fallback in case something goes wrong with the URL formation
  if (!url) {
    return `https://ui-avatars.com/api/?name=U&size=${size}&background=random`;
  }
  
  return url;
};