// utils/imageManager.ts - Enhanced with loading screen support
import { Asset } from 'expo-asset';
import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useState, useEffect } from 'react';

// Define types
type ImageCategory = 'avatars' | 'backgrounds' | 'personality' | 'icons' | 'posts' | 'loading';
type ImageSize = 'small' | 'medium' | 'large' | 'original';

interface CachedImage {
  uri: string;
  width: number;
  height: number;
  loaded: boolean;
}

interface RemoteImageOptions {
  cacheExpiry?: number;
  forceReload?: boolean;
}

interface PreloadProgress {
  total: number;
  loaded: number;
  category?: ImageCategory;
}

// Default options
const DEFAULT_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

class ImageManager {
  private localAssets: Record<string, number> = {};
  private remoteCache: Record<string, CachedImage> = {};
  private preloadedCategories: Set<ImageCategory> = new Set();
  private loadedImageCache: Record<string, any> = {};
  private cacheDirectory = FileSystem.cacheDirectory + 'images/';
  private criticalImagesPreloaded = false;
  private preloadListeners: ((progress: PreloadProgress) => void)[] = [];
  
  constructor() {
    this.setupCacheDirectory();
    this.registerDefaultImages();
  }
  
  private async setupCacheDirectory(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
    }
  }
  
  /**
   * Register all default images including loading screens
   */
  private registerDefaultImages(): void {
    // Loading screen images (critical - should be preloaded first)
    this.registerLocalImage('loading', 'default', require('../assets/images/dou-white.png'));
    this.registerLocalImage('loading', 'fallback', require('../assets/images/dou.png'));
    
    // Icons category for UI elements
    this.registerLocalImage('icons', 'loading-default', require('../assets/images/dou-white.png'));
    this.registerLocalImage('icons', 'loading-fallback', require('../assets/images/dou.png'));
    
    // Personality images
    this.registerLocalImage('personality', 'optimizer', require('../assets/images/optimizer-hawk/feed-no-bg.png'));
    this.registerLocalImage('personality', 'versatile', require('../assets/images/versatile-fox/feed-no-bg.png'));
    this.registerLocalImage('personality', 'diplomate', require('../assets/images/diplomate-monkey/feed-no-bg.png'));
    this.registerLocalImage('personality', 'mentor', require('../assets/images/mentor-elephant/feed-no-bg.png'));
  }
  
  /**
   * Preload critical images (loading screens) immediately
   * This should be called during app initialization
   */
  public async preloadCriticalImages(): Promise<void> {
    if (this.criticalImagesPreloaded) {
      return;
    }
    
    console.log('🔥 Preloading critical images...');
    
    try {
      // Get all loading and critical icon images
      const criticalKeys = Object.keys(this.localAssets).filter(key => 
        key.startsWith('loading/') || key.includes('loading-')
      );
      
      const criticalAssets = criticalKeys.map(key => this.localAssets[key]);
      
      // Preload these assets
      await Asset.loadAsync(criticalAssets);
      
      // Cache them for immediate access
      criticalKeys.forEach(key => {
        this.loadedImageCache[key] = this.localAssets[key];
      });
      
      // Mark loading category as preloaded
      this.preloadedCategories.add('loading');
      this.criticalImagesPreloaded = true;
      
      console.log('✅ Critical images preloaded successfully');
      
      // Notify listeners
      this.notifyPreloadProgress({
        total: criticalAssets.length,
        loaded: criticalAssets.length,
        category: 'loading'
      });
      
    } catch (error) {
      console.error('❌ Error preloading critical images:', error);
    }
  }
  
  /**
   * Check if critical images are preloaded
   */
  public areCriticalImagesReady(): boolean {
    return this.criticalImagesPreloaded;
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
      const defaultRef = this.getDefaultForCategory(category);
      this.loadedImageCache[key] = defaultRef;
      return defaultRef;
    }
    
    // Cache the image reference for future use
    this.loadedImageCache[key] = imageRef;
    return imageRef;
  }
  
  /**
   * Get loading screen image with fallback
   */
  public getLoadingImage(variant: 'default' | 'fallback' = 'default'): any {
    if (this.criticalImagesPreloaded) {
      return this.getLocalImage('loading', variant);
    }
    
    // Return direct require if not preloaded yet
    if (variant === 'fallback') {
      return require('../assets/images/dou.png');
    }
    return require('../assets/images/dou-white.png');
  }
  
  /**
   * Check if a category has been preloaded
   */
  public isCategoryPreloaded(category: ImageCategory): boolean {
    return this.preloadedCategories.has(category);
  }
  
  /**
   * Preload all registered local images with progress tracking
   */
  public async preloadAllLocalImages(): Promise<void> {
    const imageModules = Object.values(this.localAssets);
    const totalImages = imageModules.length;
    let loadedCount = 0;
    
    console.log(`📦 Preloading ${totalImages} local images...`);
    
    // Load images in batches for better performance
    const batchSize = 10;
    for (let i = 0; i < imageModules.length; i += batchSize) {
      const batch = imageModules.slice(i, i + batchSize);
      
      try {
        await Asset.loadAsync(batch);
        loadedCount += batch.length;
        
        // Update progress
        this.notifyPreloadProgress({
          total: totalImages,
          loaded: loadedCount
        });
        
      } catch (error) {
        console.warn(`Failed to load batch ${i / batchSize + 1}:`, error);
        loadedCount += batch.length; // Count as loaded to continue
      }
    }
    
    // Cache the loaded assets
    Object.entries(this.localAssets).forEach(([key, value]) => {
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
    
    console.log('✅ All local images preloaded successfully');
  }
  
  /**
   * Preload specific local images by category with progress
   */
  public async preloadLocalImagesByCategory(category: ImageCategory): Promise<void> {
    if (this.preloadedCategories.has(category)) {
      return;
    }
    
    const categoryEntries = Object.entries(this.localAssets)
      .filter(([key]) => key.startsWith(category));
    
    const categoryImages = categoryEntries.map(([_, value]) => value);
    
    if (categoryImages.length === 0) {
      console.warn(`No images found for category: ${category}`);
      return;
    }
    
    console.log(`📦 Preloading ${categoryImages.length} images for category: ${category}`);
    
    try {
      // Load the assets
      await Asset.loadAsync(categoryImages);
      
      // Cache the loaded assets
      categoryEntries.forEach(([key, value]) => {
        this.loadedImageCache[key] = value;
      });
      
      // Mark this category as preloaded
      this.preloadedCategories.add(category);
      
      // Notify progress
      this.notifyPreloadProgress({
        total: categoryImages.length,
        loaded: categoryImages.length,
        category
      });
      
      console.log(`✅ Category ${category} preloaded successfully`);
      
    } catch (error) {
      console.error(`❌ Error preloading category ${category}:`, error);
    }
  }
  
  /**
   * Add preload progress listener
   */
  public onPreloadProgress(listener: (progress: PreloadProgress) => void): () => void {
    this.preloadListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.preloadListeners.indexOf(listener);
      if (index > -1) {
        this.preloadListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Notify all preload progress listeners
   */
  private notifyPreloadProgress(progress: PreloadProgress): void {
    this.preloadListeners.forEach(listener => {
      try {
        listener(progress);
      } catch (error) {
        console.error('Error in preload progress listener:', error);
      }
    });
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
    
    const filename = this.getCacheFilename(uri);
    const key = `${category}/${name}`;
    const cacheFilePath = this.cacheDirectory + filename;
    
    const cachedInfo = this.remoteCache[key];
    const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
    
    if (
      fileInfo.exists && 
      !forceReload &&
      cachedInfo &&
      new Date().getTime() - fileInfo.modificationTime * 1000 < cacheExpiry
    ) {
      return cacheFilePath;
    }
    
    try {
      await FileSystem.downloadAsync(uri, cacheFilePath);
      
      const dimensions = await this.getImageDimensions(cacheFilePath);
      
      this.remoteCache[key] = {
        uri: cacheFilePath,
        width: dimensions.width,
        height: dimensions.height,
        loaded: true
      };
      
      return cacheFilePath;
    } catch (error) {
      console.error('Error downloading image:', error);
      return this.getDefaultRemoteUri(category);
    }
  }
  
  /**
   * Clear cache for specific category or all categories
   */
  public async clearCache(category?: ImageCategory): Promise<void> {
    try {
      if (category) {
        const categoryPaths = Object.keys(this.remoteCache)
          .filter(key => key.startsWith(category))
          .map(key => this.remoteCache[key].uri);
        
        for (const path of categoryPaths) {
          const fileInfo = await FileSystem.getInfoAsync(path);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(path);
          }
        }
        
        for (const key of Object.keys(this.remoteCache)) {
          if (key.startsWith(category)) {
            delete this.remoteCache[key];
          }
        }
        
        for (const key of Object.keys(this.loadedImageCache)) {
          if (key.startsWith(category)) {
            delete this.loadedImageCache[key];
          }
        }
        
        this.preloadedCategories.delete(category);
        
        // Reset critical flag if loading category is cleared
        if (category === 'loading') {
          this.criticalImagesPreloaded = false;
        }
      } else {
        const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(this.cacheDirectory);
          await this.setupCacheDirectory();
        }
        
        this.remoteCache = {};
        this.loadedImageCache = {};
        this.preloadedCategories.clear();
        this.criticalImagesPreloaded = false;
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
      
      if (dirInfo.size !== undefined) {
        return dirInfo.size;
      }
      
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
  
  private getCacheFilename(uri: string): string {
    let hash = 0;
    for (let i = 0; i < uri.length; i++) {
      hash = ((hash << 5) - hash) + uri.charCodeAt(i);
      hash |= 0;
    }
    
    const extension = uri.split('.').pop() || 'jpg';
    return `${Math.abs(hash)}.${extension}`;
  }
  
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
  
  private getDefaultForCategory(category: ImageCategory): number {
    switch (category) {
      case 'loading':
        return require('../assets/images/dou-white.png');
      case 'personality':
        return this.localAssets['personality/versatile'] || require('../assets/images/versatile-fox/feed-no-bg.png');
      case 'avatars':
        return require('../assets/images/dou.png');
      default:
        return require('../assets/images/dou.png');
    }
  }
  
  private getDefaultRemoteUri(category: ImageCategory): string {
    return '';
  }
}

// Export singleton instance
export const imageManager = new ImageManager();

// Enhanced hook for image preloading with progress
export function useImagePreloading(categories?: ImageCategory[]): { 
  isLoaded: boolean; 
  progress: PreloadProgress | null;
  criticalImagesReady: boolean;
} {
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState<PreloadProgress | null>(null);
  const [criticalImagesReady, setCriticalImagesReady] = useState(
    imageManager.areCriticalImagesReady()
  );
  
  useEffect(() => {
    const unsubscribe = imageManager.onPreloadProgress(setProgress);
    return unsubscribe;
  }, []);
  
  useEffect(() => {
    async function loadImages() {
      try {
        // Always ensure critical images are loaded first
        if (!imageManager.areCriticalImagesReady()) {
          await imageManager.preloadCriticalImages();
          setCriticalImagesReady(true);
        }
        
        if (categories && categories.length > 0) {
          const allCategoriesPreloaded = categories.every(category => 
            imageManager.isCategoryPreloaded(category)
          );
          
          if (allCategoriesPreloaded) {
            setIsLoaded(true);
            return;
          }
          
          for (const category of categories) {
            if (!imageManager.isCategoryPreloaded(category)) {
              await imageManager.preloadLocalImagesByCategory(category);
            }
          }
        } else {
          await imageManager.preloadAllLocalImages();
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Error preloading images:', error);
        setIsLoaded(true);
      }
    }
    
    loadImages();
  }, [categories]);
  
  return { isLoaded, progress, criticalImagesReady };
}

// Hook specifically for loading screen images
export function useLoadingScreenImages(): { isReady: boolean; getImage: (variant?: 'default' | 'fallback') => any } {
  const [isReady, setIsReady] = useState(imageManager.areCriticalImagesReady());
  
  useEffect(() => {
    if (!isReady) {
      imageManager.preloadCriticalImages().then(() => {
        setIsReady(true);
      });
    }
  }, [isReady]);
  
  const getImage = (variant: 'default' | 'fallback' = 'default') => {
    return imageManager.getLoadingImage(variant);
  };
  
  return { isReady, getImage };
}