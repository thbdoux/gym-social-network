// utils/colorConfig.ts - Improved colors with same structure

export type Personality = 'optimizer' | 'versatile' | 'diplomate' | 'mentor';

// Keep your original ColorPalette structure
export interface ColorPalette {
  layout: string;
  page_background: string;
  text: string;
  border: string;
  accent: string;
  highlight: string;
  // Additional colors used in components
  text_secondary: string;
  text_tertiary: string;
  card_background: string;
  input_background: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// Enhanced workout palette - same structure as before
export interface WorkoutPalette {
  background: string;
  text: string;
  text_secondary: string;
  highlight: string;
  border: string;
  badge_bg: string;
  action_bg: string;
  pattern_opacity: number;
  pattern_color: string;
  pattern_secondary_color: string;
  card_identity: 'template' | 'program' | 'log' | 'program_workout' | 'group_workout';
}

export interface ProgramPalette extends WorkoutPalette {}
export interface WorkoutLogPalette extends WorkoutPalette {}
export interface ProgramWorkoutPalette extends WorkoutPalette {}
export interface GroupWorkoutPalette extends WorkoutPalette {}

const COLOR_PALETTES: Record<Personality, ColorPalette> = {
  optimizer: {
    // Professional blue theme - clean and precise
    layout: '#1e293b',              // Slate blue header
    page_background: '#0f172a',     // Deep slate
    text: '#f8fafc',               // Near white for perfect readability
    border: '#475569',             // Visible slate border
    accent: '#3b82f6',             // Clean blue
    highlight: '#60a5fa',          // Lighter blue
    
    text_secondary: '#cbd5e1',     // Light slate for secondary text
    text_tertiary: '#64748b',      // Medium slate for placeholders
    card_background: '#1e293b',    // Slate cards
    input_background: '#334155',   // Darker slate for inputs
    success: '#22c55e',            // Clean green
    warning: '#eab308',            // Golden yellow
    error: '#ef4444',              // Clean red
    info: '#06b6d4',               // Cyan
  },

  versatile: {
    // Nature green theme - fresh and adaptable
    layout: '#166534',             // Forest green header
    page_background: '#0f1a0f',    // Deep forest
    text: '#f0fdf4',               // Near white with slight green tint
    border: '#4ade80',             // Bright green border
    accent: '#16a34a',             // Forest green
    highlight: '#4ade80',          // Bright green
    
    text_secondary: '#bbf7d0',     // Light green tint
    text_tertiary: '#65a370',      // Medium green for placeholders
    card_background: '#1a2e1a',    // Dark green cards
    input_background: '#2d4a2d',   // Green-tinted inputs
    success: '#22c55e',            // Success green
    warning: '#eab308',            // Amber
    error: '#ef4444',              // Red
    info: '#06b6d4',               // Cyan
  },

  diplomate: {
    // Warm purple theme - friendly and social
    layout: '#7c2d92',             // Rich purple header
    page_background: '#1e0a24',    // Deep purple
    text: '#fdf4ff',               // Near white with purple tint
    border: '#c996fa',             // Bright purple border
    accent: '#9333ea',             // Rich purple
    highlight: '#c084fc',          // Light purple
    
    text_secondary: '#e9d5ff',     // Light purple tint
    text_tertiary: '#8b5a9b',      // Medium purple for placeholders
    card_background: '#2e1a37',    // Dark purple cards
    input_background: '#4a2c54',   // Purple-tinted inputs
    success: '#22c55e',            // Green
    warning: '#eab308',            // Amber
    error: '#ef4444',              // Red
    info: '#06b6d4',               // Cyan
  },

  mentor : {
    layout: '#fa0d1b',              // Rosewood – deep header/nav background
    page_background: '#270202',     // Root Beer – dark, rich canvas background
    text: '#fef2f2',                // Soft off-white for strong contrast on dark reds
    border: '#c93631',              // Sangria – distinct but balanced for outlines/dividers
    accent: '#c93631',              // Persian Red – vibrant color for links, focus rings, etc.
    highlight: '#fa0d1b',           // Vivid Red – powerful highlight for alerts or CTAs
  
    text_secondary: '#fca5a5',      // Light coral – softens subtext while staying visible
    text_tertiary: '#f87171',       // Muted red – ideal for placeholders, tertiary labels
    card_background: '#3b0a0a',     // Slightly lighter than Root Beer – for card surfaces
    input_background: '#4b0e0e',    // Mid-tone red – adds input field clarity on dark base
  
    success: '#22c55e',             // Clean green – universal color for success (keeps UX consistent)
    warning: '#eab308',             // Amber – balances well with red hues
    error: '#ef4444',               // Bright red – matches intensity but stands out clearly
    info: '#06b6d4',                // Cyan – contrasting for info/tooltips
  }
  
};

// Clean workout palettes (blue tones) - same structure, better colors
const WORKOUT_PALETTES: Record<Personality, WorkoutPalette> = {
  optimizer: {
    background: '#1e40af',         // Clean blue background
    text: '#ffffff',
    text_secondary: '#dbeafe',
    highlight: '#60a5fa',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(59, 130, 246, 0.8)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#93c5fd',
    pattern_secondary_color: '#1d4ed8',
    card_identity: 'template',
  },
  versatile: {
    background: '#1565c0',
    text: '#ffffff',
    text_secondary: '#bbdefb',
    highlight: '#42a5f5',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(33, 150, 243, 0.8)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#90caf9',
    pattern_secondary_color: '#1976d2',
    card_identity: 'template',
  },
  diplomate: {
    background: '#1e40af',
    text: '#ffffff',
    text_secondary: '#c3e8ff',
    highlight: '#64b5f6',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(25, 118, 210, 0.8)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#90caf9',
    pattern_secondary_color: '#1565c0',
    card_identity: 'template',
  },
  mentor: {
    background: '#1565c0',
    text: '#ffffff',
    text_secondary: '#bbdefb',
    highlight: '#42a5f5',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(21, 101, 192, 0.8)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#90caf9',
    pattern_secondary_color: '#0d47a1',
    card_identity: 'template',
  },
};

// Clean program palettes (purple tones)
const PROGRAM_PALETTES: Record<Personality, ProgramPalette> = {
  optimizer: {
    background: '#7c3aed',
    text: '#ffffff',
    text_secondary: '#e9d5ff',
    highlight: '#a78bfa',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(124, 58, 237, 0.8)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#c4b5fd',
    pattern_secondary_color: '#6d28d9',
    card_identity: 'program',
  },
  versatile: {
    background: '#8b5cf6',
    text: '#ffffff',
    text_secondary: '#ede9fe',
    highlight: '#a78bfa',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(139, 92, 246, 0.8)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#c4b5fd',
    pattern_secondary_color: '#7c3aed',
    card_identity: 'program',
  },
  diplomate: {
    background: '#581c87',
    text: '#ffffff',
    text_secondary: '#f3e8ff',
    highlight: '#c084fc',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(147, 51, 234, 0.8)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#ddd6fe',
    pattern_secondary_color: '#7c2d92',
    card_identity: 'program',
  },
  mentor: {
    background: '#7c3aed',
    text: '#ffffff',
    text_secondary: '#e9d5ff',
    highlight: '#a78bfa',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(124, 58, 237, 0.8)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#c4b5fd',
    pattern_secondary_color: '#581c87',
    card_identity: 'program',
  },
};

// Clean workout log palettes (green tones)
const WORKOUT_LOG_PALETTES: Record<Personality, WorkoutLogPalette> = {
  optimizer: {
    background: '#166534',
    text: '#ffffff',
    text_secondary: '#dcfce7',
    highlight: '#4ade80',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(22, 163, 74, 0.8)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#86efac',
    pattern_secondary_color: '#15803d',
    card_identity: 'log',
  },
  versatile: {
    background: '#059669',
    text: '#ffffff',
    text_secondary: '#d1fae5',
    highlight: '#34d399',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(5, 150, 105, 0.8)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#6ee7b7',
    pattern_secondary_color: '#047857',
    card_identity: 'log',
  },
  diplomate: {
    background: '#15803d',
    text: '#ffffff',
    text_secondary: '#d1fae5',
    highlight: '#34d399',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(16, 185, 129, 0.8)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#6ee7b7',
    pattern_secondary_color: '#059669',
    card_identity: 'log',
  },
  mentor: {
    background: '#15803d',
    text: '#ffffff',
    text_secondary: '#dcfce7',
    highlight: '#4ade80',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(22, 163, 74, 0.8)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#86efac',
    pattern_secondary_color: '#14532d',
    card_identity: 'log',
  },
};

// Clean program workout palettes (violet tones)
const PROGRAM_WORKOUT_PALETTES: Record<Personality, ProgramWorkoutPalette> = {
  optimizer: {
    background: '#4338ca',
    text: '#ffffff',
    text_secondary: '#e0e7ff',
    highlight: '#818cf8',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(67, 56, 202, 0.8)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#a5b4fc',
    pattern_secondary_color: '#3730a3',
    card_identity: 'program_workout',
  },
  versatile: {
    background: '#5b21b6',
    text: '#ffffff',
    text_secondary: '#f3e8ff',
    highlight: '#8b5cf6',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(91, 33, 182, 0.8)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#c4b5fd',
    pattern_secondary_color: '#4c1d95',
    card_identity: 'program_workout',
  },
  diplomate: {
    background: '#1e40af',
    text: '#ffffff',
    text_secondary: '#e0e7ff',
    highlight: '#818cf8',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(99, 102, 241, 0.8)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#a5b4fc',
    pattern_secondary_color: '#4f46e5',
    card_identity: 'program_workout',
  },
  mentor: {
    background: '#4338ca',
    text: '#ffffff',
    text_secondary: '#e0e7ff',
    highlight: '#818cf8',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(67, 56, 202, 0.8)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#a5b4fc',
    pattern_secondary_color: '#312e81',
    card_identity: 'program_workout',
  },
};

const GROUP_WORKOUT_PALETTES: Record<Personality, GroupWorkoutPalette> = {
  optimizer: {
    background: '#f59e0b', // Primary amber for solid backgrounds
    text: '#ffffff',
    text_secondary: '#fef7e6', // Better contrast warm white
    highlight: '#fcd34d', // Brighter amber-300
    border: 'rgba(255, 255, 255, 0.25)',
    badge_bg: 'rgba(217, 119, 6, 0.9)',
    action_bg: 'rgba(255, 255, 255, 0.98)',
    pattern_opacity: 0.08,
    pattern_color: '#fed7aa',
    pattern_secondary_color: '#b45309',
    card_identity: 'group_workout',
    gradient_start: '#f59e0b', // amber-500
    gradient_end: '#d97706',   // amber-600
  },
  versatile: {
    background: '#f59e0b',
    text: '#ffffff',
    text_secondary: '#fef7e6',
    highlight: '#fb923c', // Orange-400 for variety
    border: 'rgba(255, 255, 255, 0.25)',
    badge_bg: 'rgba(245, 158, 11, 0.9)',
    action_bg: 'rgba(255, 255, 255, 0.98)',
    pattern_opacity: 0.08,
    pattern_color: '#fed7aa',
    pattern_secondary_color: '#c2410c',
    card_identity: 'group_workout',
    gradient_start: '#f59e0b', // amber-500
    gradient_end: '#ea580c',   // orange-600
  },
  diplomate: {
    background: '#b45309', // Softer yellow-amber
    text: '#ffffff',
    text_secondary: '#fef7e6',
    highlight: '#fbbf24',
    border: 'rgba(255, 255, 255, 0.25)',
    badge_bg: 'rgba(234, 179, 8, 0.9)',
    action_bg: 'rgba(255, 255, 255, 0.98)',
    pattern_opacity: 0.08,
    pattern_color: '#fef3c7',
    pattern_secondary_color: '#a16207',
    card_identity: 'group_workout',
    gradient_start: '#eab308', // yellow-500
    gradient_end: '#f59e0b',   // amber-500
  },
  mentor: {
    background: '#dc2626', // Red to orange - authoritative
    text: '#ffffff',
    text_secondary: '#fef2f2',
    highlight: '#f87171', // Red-400
    border: 'rgba(255, 255, 255, 0.25)',
    badge_bg: 'rgba(220, 38, 38, 0.9)',
    action_bg: 'rgba(255, 255, 255, 0.98)',
    pattern_opacity: 0.08,
    pattern_color: '#fecaca',
    pattern_secondary_color: '#991b1b',
    card_identity: 'group_workout',
    gradient_start: '#dc2626', // red-600
    gradient_end: '#ea580c',   // orange-600
  },
};

// Keep all your original getter functions - same API
export const getColorPalette = (personality: Personality): ColorPalette => {
  return COLOR_PALETTES[personality];
};

export const getColor = (personality: Personality, colorType: keyof ColorPalette): string => {
  return COLOR_PALETTES[personality][colorType];
};

export const getWorkoutPalette = (personality: Personality): WorkoutPalette => {
  return WORKOUT_PALETTES[personality];
};

export const getProgramPalette = (personality: Personality): ProgramPalette => {
  return PROGRAM_PALETTES[personality];
};

export const getWorkoutLogPalette = (personality: Personality): WorkoutLogPalette => {
  return WORKOUT_LOG_PALETTES[personality];
};

export const getProgramWorkoutPalette = (personality: Personality): ProgramWorkoutPalette => {
  return PROGRAM_WORKOUT_PALETTES[personality];
};

export const getGroupWorkoutPalette = (personality: Personality): GroupWorkoutPalette => {
  return GROUP_WORKOUT_PALETTES[personality];
};

// Keep the withAlpha helper function
export function withAlpha(color: string, alpha: number): string {
  let r = 0, g = 0, b = 0;
  
  if (color.length === 4) {
    r = parseInt(color[1] + color[1], 16);
    g = parseInt(color[2] + color[2], 16);
    b = parseInt(color[3] + color[3], 16);
  } else if (color.length === 7) {
    r = parseInt(color.slice(1, 3), 16);
    g = parseInt(color.slice(3, 5), 16);
    b = parseInt(color.slice(5, 7), 16);
  }
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}