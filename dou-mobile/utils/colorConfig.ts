// utils/colorConfig.ts

// Define the available personality types
export type Personality = 'optimizer' | 'versatile' | 'diplomate' | 'mentor';

// Define the structure of a color palette
export interface ColorPalette {
  layout: string;
  page_background: string;
  text: string;
  border: string;
  accent: string;
  highlight: string;
}

// Enhanced workout palette with pattern properties
export interface WorkoutPalette {
  background: string;
  text: string;
  text_secondary: string;
  highlight: string;
  border: string;
  badge_bg: string;
  action_bg: string;
  // Pattern properties
  pattern_opacity: number;
  pattern_color: string;
  pattern_secondary_color: string;
  // Visual identity properties
  card_identity: 'template' | 'program' | 'log' | 'program_workout';
}

// Program palette with the same pattern enhancements
export interface ProgramPalette extends WorkoutPalette {}

// Workout log palette with the same pattern enhancements
export interface WorkoutLogPalette extends WorkoutPalette {}

// Program workout palette with the same pattern enhancements
export interface ProgramWorkoutPalette extends WorkoutPalette {}

// Define color palettes for each personality
const COLOR_PALETTES: Record<Personality, ColorPalette> = {
  optimizer: {    
    layout: '#102a43', // Deeper navy blue - analytical, focused
    page_background: '#081521',
    text: '#f0f4f8',       
    border: '#829ab1',     
    accent: '#334e68',     
    highlight: '#3f88c5',  // Cleaner blue highlight - performance oriented
  },
  versatile: {
    layout: '#2d3730', // Earthy, natural green - adventurous
    page_background: '#141c16',
    text: '#e6ebef',      
    border: '#b4c4ae',
    accent: '#386641', // Forest green - adventure, outdoors
    highlight: '#6b9080', // Softer green highlight
  },
  diplomate: {
    page_background: '#2a2430', // Warm purple - friendly but not childish
    layout: '#4a3f54',
    text: '#f8f0fb',
    border: '#c4addc',
    accent: '#8367c7', // Playful purple - social, fun
    highlight: '#b8a9c9', // Softer purple - approachable
  },
  mentor: {
    layout: '#5e352a', // Warm brown-red - authoritative, trustworthy
    page_background: '#301b15',
    text: '#f9f4ef',
    border: '#d6ccc2',
    accent: '#9b2226', // Deep red - coaching, guidance
    highlight: '#ba6c65', // Softer red - supportive
  },
};

// Define workout palettes with pattern properties (blue tones)
const WORKOUT_PALETTES: Record<Personality, WorkoutPalette> = {
  optimizer: {    
    background: '#0c3c63', // Professional blue for templates
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.85)',
    highlight: '#64b5f6', // Clean, precise blue highlight
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(0, 120, 212, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.12,
    pattern_color: '#90caf9',
    pattern_secondary_color: '#1976d2',
    card_identity: 'template',
  },
  versatile: {    
    background: '#1a4971', // Nature-inspired blue
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.8)',
    highlight: '#81c3ed', // Adaptive, fresh blue
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(21, 101, 192, 0.6)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.10,
    pattern_color: '#a5d6f6',
    pattern_secondary_color: '#2286c3',
    card_identity: 'template',
  },
  diplomate: {
    background: '#235789', // Friendly, sociable blue
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.85)',
    highlight: '#98c1d9', // Approachable blue
    border: 'rgba(255, 255, 255, 0.25)',
    badge_bg: 'rgba(40, 130, 220, 0.6)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.09,
    pattern_color: '#bbd1ea',
    pattern_secondary_color: '#3d5a80',
    card_identity: 'template',
  },
  mentor: {
    background: '#24527a', // Authoritative, guiding blue
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.85)',
    highlight: '#7ea8be', // Trustworthy blue
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(30, 100, 200, 0.6)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.12,
    pattern_color: '#a4c2d2',
    pattern_secondary_color: '#387ca3',
    card_identity: 'template',
  },
};

// Define program palettes with pattern properties (purple tones)
const PROGRAM_PALETTES: Record<Personality, ProgramPalette> = {
  optimizer: {    
    background: '#4a2a59', // Analytical purple for structured programs
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.85)',
    highlight: '#b39ddb', // Data-oriented purple highlight
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(140, 80, 200, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.12,
    pattern_color: '#d1c4e9',
    pattern_secondary_color: '#7b1fa2',
    card_identity: 'program',
  },
  versatile: {
    background: '#4d3572', // Versatile, adaptable purple
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.8)',
    highlight: '#c5b9e8', // Dynamic purple
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(130, 90, 210, 0.6)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.10,
    pattern_color: '#d8c8f0',
    pattern_secondary_color: '#673ab7',
    card_identity: 'program',
  },
  diplomate: {
    background: '#553c8b', // Playful, social purple
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.85)',
    highlight: '#cbb8e0', // Fun, approachable purple
    border: 'rgba(255, 255, 255, 0.25)',
    badge_bg: 'rgba(150, 100, 220, 0.6)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.09,
    pattern_color: '#e0d3ef',
    pattern_secondary_color: '#6a3093',
    card_identity: 'program',
  },
  mentor: {
    background: '#533267', // Guiding, experienced purple
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.85)',
    highlight: '#b399c9', // Supportive purple
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(130, 80, 190, 0.6)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.12,
    pattern_color: '#d4c1e0',
    pattern_secondary_color: '#6d4c7e',
    card_identity: 'program',
  },
};

// Define workout log palettes with pattern properties (green tones)
const WORKOUT_LOG_PALETTES: Record<Personality, WorkoutLogPalette> = {
  optimizer: {    
    background: '#1d472c', // Achievement-oriented green
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.85)',
    highlight: '#66bb6a', // Performance-tracking green highlight
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(40, 160, 70, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.12,
    pattern_color: '#a5d6a7',
    pattern_secondary_color: '#2e7d32',
    card_identity: 'log',
  },
  versatile: {
    background: '#2a543a', // Natural, outdoor green
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.8)',
    highlight: '#80c883', // Adventurous green
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(60, 170, 80, 0.6)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.10,
    pattern_color: '#b8e0b9',
    pattern_secondary_color: '#388e3c',
    card_identity: 'log',
  },
  diplomate: {
    background: '#276841', // Social, gamification green
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.85)',
    highlight: '#8fd694', // Cheerful, rewarding green
    border: 'rgba(255, 255, 255, 0.25)',
    badge_bg: 'rgba(50, 180, 60, 0.6)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.09,
    pattern_color: '#c5e8c7',
    pattern_secondary_color: '#43a047',
    card_identity: 'log',
  },
  mentor: {
    background: '#224c37', // Guiding, coaching green
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.85)',
    highlight: '#6abf69', // Supportive, achievement green
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(40, 150, 50, 0.6)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.12,
    pattern_color: '#a7d2a9',
    pattern_secondary_color: '#357a38',
    card_identity: 'log',
  },
};

// Define program workout palettes (violet tones - blend of program and workout)
const PROGRAM_WORKOUT_PALETTES: Record<Personality, ProgramWorkoutPalette> = {
  optimizer: {    
    background: '#3a3868', // Analytical violet
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.85)',
    highlight: '#9fa8da', // Performance-tracking violet
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(120, 110, 200, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.12,
    pattern_color: '#c5cae9',
    pattern_secondary_color: '#3949ab',
    card_identity: 'program_workout',
  },
  versatile: {
    background: '#3b386b', // Adaptable violet
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.8)',
    highlight: '#b0b5e2', // Dynamic violet
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(110, 100, 190, 0.6)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.10,
    pattern_color: '#d1d9ff',
    pattern_secondary_color: '#5c6bc0',
    card_identity: 'program_workout',
  },
  diplomate: {
    background: '#42407a', // Social, fun violet
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.85)',
    highlight: '#b8b5e1', // Playful violet
    border: 'rgba(255, 255, 255, 0.25)',
    badge_bg: 'rgba(130, 120, 210, 0.6)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.09,
    pattern_color: '#d8d3f0',
    pattern_secondary_color: '#5e35b1',
    card_identity: 'program_workout',
  },
  mentor: {
    background: '#3d376a', // Guiding, experienced violet
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.85)',
    highlight: '#9d96cf', // Supportive violet
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(110, 100, 180, 0.6)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.12,
    pattern_color: '#c8c1e9',
    pattern_secondary_color: '#4527a0',
    card_identity: 'program_workout',
  },
};

// Function to get the entire color palette for a personality
export const getColorPalette = (personality: Personality): ColorPalette => {
  return COLOR_PALETTES[personality];
};

// Function to get a specific color for a personality
export const getColor = (personality: Personality, colorType: keyof ColorPalette): string => {
  return COLOR_PALETTES[personality][colorType];
};

// Functions to get specialized component palettes
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