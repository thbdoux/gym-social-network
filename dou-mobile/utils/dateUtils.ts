// utils/dateUtils.ts
import { format, parse, isValid, parseISO } from 'date-fns';

/**
 * Comprehensive date utilities for handling various date formats
 * between frontend and Django backend (ISO format)
 */

export interface DateFormatOptions {
  locale?: string;
  includeTime?: boolean;
  dateStyle?: 'short' | 'medium' | 'long' | 'full';
  timeStyle?: 'short' | 'medium' | 'long' | 'full';
}

/**
 * Safely parse a date from various input formats
 * Handles: ISO strings, Date objects, dd/MM/yyyy strings, and null/undefined
 */
export const safeParseDate = (dateInput: string | Date | null | undefined): Date | null => {
  if (!dateInput) return null;
  
  try {
    // If it's already a Date object, validate it
    if (dateInput instanceof Date) {
      return isValid(dateInput) ? dateInput : null;
    }
    
    const dateString = dateInput.toString().trim();
    if (!dateString) return null;
    
    // Try parsing as ISO format first (backend format)
    if (dateString.includes('T') || dateString.includes('Z') || dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      const isoDate = parseISO(dateString);
      if (isValid(isoDate)) return isoDate;
    }
    
    // Try parsing as dd/MM/yyyy format (legacy frontend format)
    if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
      if (isValid(parsedDate)) return parsedDate;
    }
    
    // Try parsing as yyyy-MM-dd format
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
      if (isValid(parsedDate)) return parsedDate;
    }
    
    // Last resort: try native Date constructor
    const nativeDate = new Date(dateString);
    if (isValid(nativeDate)) return nativeDate;
    
    console.warn(`Unable to parse date: ${dateString}`);
    return null;
  } catch (error) {
    console.error('Error parsing date:', error, dateInput);
    return null;
  }
};

/**
 * Convert any date input to ISO string format (for backend)
 */
export const toISOString = (dateInput: string | Date | null | undefined): string | null => {
  const date = safeParseDate(dateInput);
  return date ? date.toISOString() : null;
};

/**
 * Format date for display based on locale
 */
export const formatDateForDisplay = (
  dateInput: string | Date | null | undefined, 
  locale: string = 'en',
  options: DateFormatOptions = {}
): string => {
  const date = safeParseDate(dateInput);
  if (!date) return '';
  
  try {
    const localeCode = locale === 'en' ? 'en-US' : 'fr-FR';
    
    if (options.includeTime) {
      return date.toLocaleDateString(localeCode, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return date.toLocaleDateString(localeCode, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return '';
  }
};

/**
 * Format time for display
 */
export const formatTimeForDisplay = (
  dateInput: string | Date | null | undefined,
  locale: string = 'en'
): string => {
  const date = safeParseDate(dateInput);
  if (!date) return '';
  
  try {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (error) {
    console.error('Error formatting time for display:', error);
    return '';
  }
};

/**
 * Format date and time together for display
 */
export const formatDateTimeForDisplay = (
  dateInput: string | Date | null | undefined,
  locale: string = 'en',
  separator: string = ' • '
): string => {
  const date = formatDateForDisplay(dateInput, locale);
  const time = formatTimeForDisplay(dateInput, locale);
  
  if (!date && !time) return '';
  if (!date) return time;
  if (!time) return date;
  
  return `${date}${separator}${time}`;
};

/**
 * Calculate countdown from now to a future date
 */
export const calculateCountdown = (
  scheduledTime: string | Date | null | undefined,
  translations: {
    workout_passed: string;
    tomorrow: string;
    days_left: (count: number) => string;
    hours_left: (count: number) => string;
    minutes_left: (count: number) => string;
    starting_now: string;
  }
): string => {
  const workoutDate = safeParseDate(scheduledTime);
  if (!workoutDate) return '';
  
  const now = new Date();
  const diffTime = workoutDate.getTime() - now.getTime();
  
  if (diffTime < 0) {
    return translations.workout_passed;
  }
  
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return diffDays === 1 ? translations.tomorrow : translations.days_left(diffDays);
  } else if (diffHours > 0) {
    return translations.hours_left(diffHours);
  } else if (diffMinutes > 0) {
    return translations.minutes_left(diffMinutes);
  } else {
    return translations.starting_now;
  }
};

/**
 * Convert dd/MM/yyyy format to Date object (for legacy support)
 */
export const parseDDMMYYYY = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') return null;
  
  try {
    const parsedDate = parse(dateString.trim(), 'dd/MM/yyyy', new Date());
    return isValid(parsedDate) ? parsedDate : null;
  } catch (error) {
    console.error('Error parsing dd/MM/yyyy date:', error, dateString);
    return null;
  }
};

/**
 * Format date for react-native-calendars (yyyy-MM-dd)
 */
export const formatForCalendar = (dateInput: string | Date | null | undefined): string => {
  const date = safeParseDate(dateInput);
  if (!date) return '';
  
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date for calendar:', error);
    return '';
  }
};

/**
 * Get current date/time as ISO string (for backend)
 */
export const getCurrentISOString = (): string => {
  return new Date().toISOString();
};

/**
 * Check if a date is today
 */
export const isToday = (dateInput: string | Date | null | undefined): boolean => {
  const date = safeParseDate(dateInput);
  if (!date) return false;
  
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (dateInput: string | Date | null | undefined): boolean => {
  const date = safeParseDate(dateInput);
  if (!date) return false;
  
  return date.getTime() < new Date().getTime();
};

/**
 * Get minimum date for date pickers (current date/time)
 */
export const getMinimumDate = (): Date => {
  return new Date();
};

/**
 * Debug utility to log date parsing attempts
 */
export const debugDateParsing = (dateInput: any, context: string = '') => {
  console.log(`[DateUtils Debug] ${context}:`, {
    input: dateInput,
    type: typeof dateInput,
    isDate: dateInput instanceof Date,
    parsedResult: safeParseDate(dateInput),
    isoString: toISOString(dateInput)
  });
};