// utils/imageUtils.ts
import { API_BASE_URL, getFullUrl } from '../api/config';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

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

/**
 * Compresses an image to make it suitable for upload
 * @param imageUri URI of the image to compress
 * @param options Configuration options for compression
 * @returns Promise resolving to the URI of the compressed image
 */
export const compressImage = async (
  imageUri: string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png';
    maxSizeKB?: number;
  } = {}
): Promise<string> => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'jpeg',
    maxSizeKB = 800 // Default max size 800KB
  } = options;

  try {
    // First, get the file info to see if we even need to compress
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    
    if (!fileInfo.exists) {
      throw new Error('Image file does not exist');
    }
    
    // Check if image is already under the size limit
    const fileSizeKB = fileInfo.size / 1024;
    
    if (fileSizeKB <= maxSizeKB) {
      console.log(`Image is already small enough (${Math.round(fileSizeKB)}KB)`);
      return imageUri;
    }
    
    console.log(`Original image size: ${Math.round(fileSizeKB)}KB`);
    
    // Calculate resize actions - maintain aspect ratio
    let resizeActions = [];
    
    // If we have the image dimensions, we can calculate a more precise resize
    // This would require getting image dimensions first - skipping for simplicity
    resizeActions.push({
      resize: {
        width: maxWidth,
        height: maxHeight,
      },
    });
    
    // First compression attempt with standard options
    let compressedUri = await ImageManipulator.manipulateAsync(
      imageUri,
      resizeActions,
      {
        format: ImageManipulator.SaveFormat[format.toUpperCase()],
        compress: quality,
      }
    );
    
    // Check if we need to compress further
    let compressedInfo = await FileSystem.getInfoAsync(compressedUri.uri);
    let compressedSizeKB = compressedInfo.size / 1024;
    console.log(`First compression result: ${Math.round(compressedSizeKB)}KB`);
    
    // If still too large, try additional compression with lower quality
    if (compressedSizeKB > maxSizeKB) {
      // Calculate new quality - use a formula to estimate required quality
      // Estimate that file size scales linearly with quality (approximate)
      let newQuality = Math.min(quality * (maxSizeKB / compressedSizeKB), 0.7);
      
      console.log(`Additional compression needed, new quality: ${newQuality.toFixed(2)}`);
      
      // Try additional compression
      compressedUri = await ImageManipulator.manipulateAsync(
        compressedUri.uri,
        [], // No further resize needed
        {
          format: ImageManipulator.SaveFormat[format.toUpperCase()],
          compress: newQuality,
        }
      );
      
      compressedInfo = await FileSystem.getInfoAsync(compressedUri.uri);
      compressedSizeKB = compressedInfo.size / 1024;
      console.log(`Final compression result: ${Math.round(compressedSizeKB)}KB`);
    }
    
    return compressedUri.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original image if compression fails
    return imageUri;
  }
};