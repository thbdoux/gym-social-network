// utils/formatters.ts
/**
 * Utility functions for formatting values
 */

/**
 * Format rest time in seconds to a human-readable string
 * @param seconds - The rest time in seconds
 * @returns Formatted rest time string (e.g., "1m 30s")
 */
 export const formatRestTime = (seconds?: number): string => {
    if (!seconds || seconds === 0) return '-';
    if (seconds < 60) return `${seconds}s`;
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };
  
  /**
   * Format a weight value with unit
   * @param weight - The weight value
   * @param unit - The weight unit (default: "kg")
   * @returns Formatted weight string
   */
  export const formatWeight = (weight?: number, unit: string = 'kg'): string => {
    if (!weight || weight === 0) return '-';
    return `${weight}${unit}`;
  };
  
  /**
   * Converts a hex color to an RGB string
   * @param hex - The hex color code (e.g., "#FF5500")
   * @returns A string in the format "r, g, b"
   */
  export const hexToRgb = (hex: string): string => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
  };
  
  /**
   * Gets emoji indicators for difficulty levels
   * @param level - The difficulty level string
   * @returns Emoji representing the difficulty
   */
  export const getDifficultyIndicator = (level?: int): string => {
    if (!level) return '🔥';
    
    switch(level) {
      case 0: return '🔥';
      case 1: return '🔥🔥';
      case 2: return '🔥🔥🔥';
      default: return '🔥';
    }
  };
  
  /**
   * Gets the name of a weekday from its index
   * @param day - The weekday index (0-6, where 0 is Sunday)
   * @returns The name of the weekday
   */
  export const getWeekdayName = (day?: number): string => {
    if (day === undefined) return '';
    
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekdays[day] || '';
  };
  
  /**
   * Calculate estimated workout completion time
   * @param exercises - Array of exercises
   * @returns Estimated time in minutes
   */
  export const calculateWorkoutTime = (exercises: any[]): number => {
    if (!exercises || exercises.length === 0) return 0;
    
    // Base time (setup, warmup, etc)
    let totalTime = 5; 
    
    for (const exercise of exercises) {
      const sets = exercise.sets || [];
      
      // Add time for each set (execution + rest)
      for (const set of sets) {
        // Estimate about 30-45 seconds per set execution
        totalTime += 0.5; 
        
        // Add rest time (converted from seconds to minutes)
        totalTime += (set.rest_time || 0) / 60;
      }
      
      // For supersets, add the superset rest time
      if (exercise.is_superset && exercise.superset_rest_time) {
        totalTime += exercise.superset_rest_time / 60;
      }
    }
    
    // Round to nearest integer
    return Math.round(totalTime);
  };