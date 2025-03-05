const API_URL = import.meta.env.VITE_API_URL;

export const getAvatarUrl = (avatarPath, size = 120) => {
  if (!avatarPath) {
    return `https://ui-avatars.com/api/?name=U&size=${size}&background=random`;
  }
  
  // If it's already a full URL, return as is
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // Otherwise, combine API_URL with the avatar path
  return `${API_URL}${avatarPath}`.replace(/([^:]\/)\/+/g, "$1");
};

