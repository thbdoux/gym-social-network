// utils/imageUtils.ts
import { API_BASE_URL, getFullUrl } from '../api/config';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';

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
 * Get image dimensions
 */
const getImageDimensions = (uri: string): Promise<{ width: number, height: number }> => {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => {
        console.warn('Could not get image dimensions:', error);
        reject(error);
      }
    );
  });
};

/**
 * Calculate new dimensions that maintain aspect ratio within max bounds
 */
const calculateAspectRatioResize = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number, height: number } => {
  // If image is already smaller than max dimensions, keep original size
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }
  
  // Calculate aspect ratio
  const aspectRatio = originalWidth / originalHeight;
  
  // Calculate new dimensions based on aspect ratio
  let newWidth = maxWidth;
  let newHeight = maxWidth / aspectRatio;
  
  // If height exceeds max, recalculate based on height
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = maxHeight * aspectRatio;
  }
  
  // Round to integers
  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight)
  };
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
    console.log(`Original image size: ${Math.round(fileSizeKB)}KB`);
    
    // Get original image dimensions
    let originalDimensions;
    try {
      originalDimensions = await getImageDimensions(imageUri);
      console.log(`Original dimensions: ${originalDimensions.width}x${originalDimensions.height}`);
    } catch (error) {
      console.warn('Could not get image dimensions, proceeding with resize anyway');
      originalDimensions = { width: maxWidth, height: maxHeight };
    }
    
    // Calculate proper resize dimensions maintaining aspect ratio
    const newDimensions = calculateAspectRatioResize(
      originalDimensions.width,
      originalDimensions.height,
      maxWidth,
      maxHeight
    );
    
    console.log(`New dimensions: ${newDimensions.width}x${newDimensions.height}`);
    
    // Check if we need to resize or compress
    const needsResize = newDimensions.width !== originalDimensions.width || 
                       newDimensions.height !== originalDimensions.height;
    const needsCompression = fileSizeKB > maxSizeKB;
    
    // If image is already small enough and doesn't need resizing, return original
    if (!needsResize && !needsCompression) {
      console.log(`Image is already optimized (${Math.round(fileSizeKB)}KB)`);
      return imageUri;
    }
    
    // Prepare resize actions if needed
    let resizeActions = [];
    if (needsResize) {
      resizeActions.push({
        resize: newDimensions, // This maintains aspect ratio
      });
    }
    
    // First compression attempt with calculated dimensions and quality
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
    if (compressedSizeKB > maxSizeKB && quality > 0.3) {
      // Calculate new quality - use a more conservative approach
      let newQuality = Math.max(quality * (maxSizeKB / compressedSizeKB) * 0.9, 0.3);
      
      console.log(`Additional compression needed, new quality: ${newQuality.toFixed(2)}`);
      
      // Try additional compression without further resizing
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
    
    // Verify the final image still has correct dimensions (for debugging)
    try {
      const finalDimensions = await getImageDimensions(compressedUri.uri);
      console.log(`Final image dimensions: ${finalDimensions.width}x${finalDimensions.height}`);
    } catch (error) {
      console.warn('Could not verify final image dimensions');
    }
    
    return compressedUri.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original image if compression fails
    return imageUri;
  }
};