// utils/ImageManager.ts
import { Asset } from 'expo-asset';
import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useState } from 'react';

// Define types
type ImageCategory = 'avatars' | 'backgrounds' | 'personality' | 'icons' | 'posts';
type ImageSize = 'small' | 'medium' | 'large' | 'original';

interface CachedImage {
  uri: string;
  width: number;
  height: number;
  loaded: boolean;
}

interface RemoteImageOptions {
  cacheExpiry?: number; // Time in ms before cache expires (default: 24 hours)
  forceReload?: boolean; // Force reload from source
}

// Default options
const DEFAULT_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

class ImageManager {
  // Store for local asset references
  private localAssets: Record<string, number> = {};
  
  // Store for remote image cache info
  private remoteCache: Record<string, CachedImage> = {};
  
  // Track which categories have been preloaded
  private preloadedCategories: Set<ImageCategory> = new Set();
  
  // Cache for already loaded local image objects
  private loadedImageCache: Record<string, any> = {};
  
  // Directory for cached images
  private cacheDirectory = FileSystem.cacheDirectory + 'images/';
  
  /**
   * Constructor - sets up the cache directory
   */
  constructor() {
    this.setupCacheDirectory();
    // Pre-register known local images (moved from feed.tsx)
    this.registerLocalImages();
  }
  
  /**
   * Create cache directory if it doesn't exist
   */
  private async setupCacheDirectory(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
    }
  }
  
  /**
   * Register all local images - called in constructor
   */
  private registerLocalImages(): void {
    // Personality images
    this.registerLocalImage('personality', 'optimizer', require('../assets/images/optimizer-hawk/feed-no-bg.png'));
    this.registerLocalImage('personality', 'versatile', require('../assets/images/versatile-fox/feed-no-bg.png'));
    this.registerLocalImage('personality', 'diplomate', require('../assets/images/diplomate-monkey/feed-no-bg.png'));
    this.registerLocalImage('personality', 'mentor', require('../assets/images/mentor-elephant/feed-no-bg.png'));
    
    // Add more local images as needed
  }
  
  /**
   * Register a local image with the image manager
   */
  public registerLocalImage(category: ImageCategory, name: string, requireReference: number): void {
    const key = `${category}/${name}`;
    this.localAssets[key] = requireReference;
  }
  
  /**
   * Get a local image that was registered with the manager
   * Now returns the cached loaded image object if available
   */
  public getLocalImage(category: ImageCategory, name: string): any {
    const key = `${category}/${name}`;
    
    // Check if we already have the loaded image in cache
    if (this.loadedImageCache[key]) {
      return this.loadedImageCache[key];
    }
    
    // Get the image require reference
    const imageRef = this.localAssets[key];
    
    if (!imageRef) {
      console.warn(`Image not found: ${key}. Using default.`);
      // Get default image based on category
      const defaultRef = this.getDefaultForCategory(category);
      // Cache and return it
      this.loadedImageCache[key] = defaultRef;
      return defaultRef;
    }
    
    // Cache the image reference for future use
    this.loadedImageCache[key] = imageRef;
    return imageRef;
  }
  
  /**
   * Check if a category has been preloaded
   */
  public isCategoryPreloaded(category: ImageCategory): boolean {
    return this.preloadedCategories.has(category);
  }
  
  /**
   * Preload all registered local images
   */
  public async preloadAllLocalImages(): Promise<void> {
    const imageModules = Object.values(this.localAssets);
    
    // Load all images and get their loaded assets
    const loadedAssets = await Asset.loadAsync(imageModules);
    
    // Cache the loaded assets in our image cache for faster access
    Object.entries(this.localAssets).forEach(([key, value], index) => {
      this.loadedImageCache[key] = value;
    });
    
    // Mark all categories as preloaded
    const categories = new Set<ImageCategory>();
    Object.keys(this.localAssets).forEach(key => {
      const category = key.split('/')[0] as ImageCategory;
      categories.add(category);
    });
    
    categories.forEach(category => {
      this.preloadedCategories.add(category);
    });
  }
  
  /**
   * Preload specific local images by category
   */
  public async preloadLocalImagesByCategory(category: ImageCategory): Promise<void> {
    // Skip if this category is already preloaded
    if (this.preloadedCategories.has(category)) {
      return;
    }
    
    const categoryEntries = Object.entries(this.localAssets)
      .filter(([key]) => key.startsWith(category));
    
    const categoryImages = categoryEntries.map(([_, value]) => value);
    
    // Load the assets
    await Asset.loadAsync(categoryImages);
    
    // Cache the loaded assets in our image cache for faster access
    categoryEntries.forEach(([key, value]) => {
      this.loadedImageCache[key] = value;
    });
    
    // Mark this category as preloaded
    this.preloadedCategories.add(category);
  }
  
  /**
   * Get cached remote image, downloading if needed
   */
  public async getRemoteImage(
    category: ImageCategory, 
    name: string, 
    uri: string, 
    options: RemoteImageOptions = {}
  ): Promise<string> {
    const { cacheExpiry = DEFAULT_CACHE_EXPIRY, forceReload = false } = options;
    
    // Create a filename for the cached image based on uri
    const filename = this.getCacheFilename(uri);
    const key = `${category}/${name}`;
    const cacheFilePath = this.cacheDirectory + filename;
    
    // Check if we have file info in cache
    const cachedInfo = this.remoteCache[key];
    const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
    
    // If file exists and isn't expired and we're not forcing reload
    if (
      fileInfo.exists && 
      !forceReload &&
      cachedInfo &&
      new Date().getTime() - fileInfo.modificationTime * 1000 < cacheExpiry
    ) {
      return cacheFilePath;
    }
    
    // Download the image
    try {
      await FileSystem.downloadAsync(uri, cacheFilePath);
      
      // Get image dimensions
      const dimensions = await this.getImageDimensions(cacheFilePath);
      
      // Update cache info
      this.remoteCache[key] = {
        uri: cacheFilePath,
        width: dimensions.width,
        height: dimensions.height,
        loaded: true
      };
      
      return cacheFilePath;
    } catch (error) {
      console.error('Error downloading image:', error);
      // Return default for category on error
      return this.getDefaultRemoteUri(category);
    }
  }
  
  /**
   * Clear cache for specific category or all categories
   */
  public async clearCache(category?: ImageCategory): Promise<void> {
    try {
      if (category) {
        // Clear only specific category
        const categoryPaths = Object.keys(this.remoteCache)
          .filter(key => key.startsWith(category))
          .map(key => this.remoteCache[key].uri);
        
        for (const path of categoryPaths) {
          const fileInfo = await FileSystem.getInfoAsync(path);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(path);
          }
        }
        
        // Remove from memory cache
        for (const key of Object.keys(this.remoteCache)) {
          if (key.startsWith(category)) {
            delete this.remoteCache[key];
          }
        }
        
        // Remove from loaded image cache
        for (const key of Object.keys(this.loadedImageCache)) {
          if (key.startsWith(category)) {
            delete this.loadedImageCache[key];
          }
        }
        
        // Reset preload state for this category
        this.preloadedCategories.delete(category);
      } else {
        // Clear all cache
        const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(this.cacheDirectory);
          await this.setupCacheDirectory();
        }
        
        // Clear all memory caches
        this.remoteCache = {};
        this.loadedImageCache = {};
        
        // Reset all preload states
        this.preloadedCategories.clear();
      }
    } catch (error) {
      console.error('Error clearing image cache:', error);
    }
  }
  
  /**
   * Get cache size in bytes
   */
  public async getCacheSize(): Promise<number> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (!dirInfo.exists) {
        return 0;
      }
      
      // On iOS, size info is available directly
      if (dirInfo.size !== undefined) {
        return dirInfo.size;
      }
      
      // On Android, we need to sum up file sizes
      const files = await FileSystem.readDirectoryAsync(this.cacheDirectory);
      let totalSize = 0;
      
      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(this.cacheDirectory + file);
        if (fileInfo.exists && fileInfo.size !== undefined) {
          totalSize += fileInfo.size;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }
  
  /**
   * Get a hash-based filename from a URL
   */
  private getCacheFilename(uri: string): string {
    // Simple hash function for filenames
    let hash = 0;
    for (let i = 0; i < uri.length; i++) {
      hash = ((hash << 5) - hash) + uri.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Extract file extension from URI
    const extension = uri.split('.').pop() || 'jpg';
    
    return `${Math.abs(hash)}.${extension}`;
  }
  
  /**
   * Get image dimensions
   */
  private getImageDimensions(uri: string): Promise<{ width: number, height: number }> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        (error) => {
          console.warn('Could not get image dimensions', error);
          resolve({ width: 0, height: 0 });
        }
      );
    });
  }
  
  /**
   * Get default image for a category
   */
  private getDefaultForCategory(category: ImageCategory): number {
    switch (category) {
      case 'personality':
        return this.localAssets['personality/versatile'] || require('../assets/images/versatile-fox/feed-no-bg.png');
      case 'avatars':
        // Placeholder for a default avatar
        return require('../assets/images/dou.png');
      default:
        // General default
        return require('../assets/images/dou.png');
    }
  }
  
  /**
   * Get default remote image uri for a category
   */
  private getDefaultRemoteUri(category: ImageCategory): string {
    // This would return the file URI for a default image that's bundled with the app
    // For now just return an empty string, but you would implement actual defaults
    return '';
  }
}

// Export a singleton instance
export const imageManager = new ImageManager();

// Helper hook for using the image manager
import { useEffect } from 'react';

export function useImagePreloading(categories?: ImageCategory[]): { isLoaded: boolean } {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    async function loadImages() {
      try {
        if (categories && categories.length > 0) {
          // Check if all requested categories are already preloaded
          const allCategoriesPreloaded = categories.every(category => 
            imageManager.isCategoryPreloaded(category)
          );
          
          // If all categories are already preloaded, skip loading
          if (allCategoriesPreloaded) {
            setIsLoaded(true);
            return;
          }
          
          // Load only categories that aren't already preloaded
          for (const category of categories) {
            if (!imageManager.isCategoryPreloaded(category)) {
              await imageManager.preloadLocalImagesByCategory(category);
            }
          }
        } else {
          // Load all images if no specific categories requested
          await imageManager.preloadAllLocalImages();
        }
        setIsLoaded(true);
      } catch (error) {
        console.error('Error preloading images:', error);
        setIsLoaded(true); // Consider images loaded even on error to not block UI
      }
    }
    
    loadImages();
  }, [categories]);
  
  return { isLoaded };
}