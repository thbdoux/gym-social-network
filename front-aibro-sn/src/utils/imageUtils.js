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


export const getMediaUrl = (media) => {
  if (!media) return null;
  
  // If it's a File object (new upload)
  if (media instanceof File) {
    return URL.createObjectURL(media);
  }
  
  // If it's a media object from the API
  if (typeof media === 'object' && media.name) {
    // Assuming the backend stores workout media in a 'workout_logs' subdirectory
    return `${API_URL}/media/workout_logs/${media.name}`;
  }
  
  return null;
};