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
  // New pattern properties
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
    layout: '#00192c', 
    page_background: '#00192c',
    text: '#fbfcf9',       
    border: '#ADB5BD',     
    accent: '#00192c',     
    highlight: '#e9a835',  
  },
  versatile: {
    layout: '#16251a',
    page_background: '#16251a',
    text: '#CED4DA',      
    border: '#9e995d',
    accent: '#e17714',
    highlight: '#FDE2E6',
  },
  diplomate: {
    layout: '#b092b1',
    page_background: '#3f2243',
    text: '#feefd3',
    border: '#B7E4D8',
    accent: '#f1661b',
    highlight: '#E8F8F5',
  },
  mentor: {
    layout: '#bb3c20',
    page_background: '#00494d',
    text: '#e7d5a4',
    border: '#e7d5a4',
    accent: '#203132',
    highlight: '#e6d5a4',
  },
};

// Define workout palettes with pattern properties
const WORKOUT_PALETTES: Record<Personality, WorkoutPalette> = {
  optimizer: {    
    background: '#0c4a6e', // Deeper blue for better contrast with patterns
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.8)',
    highlight: '#38bdf8', // Lighter blue for highlights
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(255, 255, 255, 0.2)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.15,
    pattern_color: '#7dd3fc',
    pattern_secondary_color: '#0ea5e9',
    card_identity: 'template',
  },
  versatile: {    
    background: '#0c4a6e',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#38bdf8',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(255, 255, 255, 0.2)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.12,
    pattern_color: '#7dd3fc',
    pattern_secondary_color: '#0ea5e9',
    card_identity: 'template',
  },
  diplomate: {
    background: '#0c4a6e',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.8)',
    highlight: '#38bdf8',
    border: 'rgba(255, 255, 255, 0.25)',
    badge_bg: 'rgba(255, 255, 255, 0.25)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#7dd3fc',
    pattern_secondary_color: '#0ea5e9',
    card_identity: 'template',
  },
  mentor: {
    background: '#0c4a6e',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#38bdf8',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(255, 255, 255, 0.2)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.18,
    pattern_color: '#7dd3fc',
    pattern_secondary_color: '#0ea5e9',
    card_identity: 'template',
  },
};

// Define program palettes with pattern properties
const PROGRAM_PALETTES: Record<Personality, ProgramPalette> = {
  optimizer: {    
    background: '#4c1d95', // Deeper purple for better contrast
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.8)',
    highlight: '#c084fc', // Lighter purple for highlights
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(200, 0, 240, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.15,
    pattern_color: '#d8b4fe',
    pattern_secondary_color: '#8b5cf6',
    card_identity: 'program',
  },
  versatile: {
    background: '#4c1d95',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#c084fc',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(200, 0, 240, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.12,
    pattern_color: '#d8b4fe',
    pattern_secondary_color: '#8b5cf6',
    card_identity: 'program',
  },
  diplomate: {
    background: '#4c1d95',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.8)',
    highlight: '#c084fc',
    border: 'rgba(255, 255, 255, 0.25)',
    badge_bg: 'rgba(210, 0, 255, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#d8b4fe',
    pattern_secondary_color: '#8b5cf6',
    card_identity: 'program',
  },
  mentor: {
    background: '#4c1d95',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#c084fc',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(200, 0, 240, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.18,
    pattern_color: '#d8b4fe',
    pattern_secondary_color: '#8b5cf6',
    card_identity: 'program',
  },
};

// Define workout log palettes with pattern properties
const WORKOUT_LOG_PALETTES: Record<Personality, WorkoutLogPalette> = {
  optimizer: {    
    background: '#14532d', // Deeper green for better contrast
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.8)',
    highlight: '#4ade80', // Lighter green for highlights
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(60, 200, 0, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.15,
    pattern_color: '#86efac',
    pattern_secondary_color: '#22c55e',
    card_identity: 'log',
  },
  versatile: {
    background: '#14532d',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#4ade80',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(60, 200, 0, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.12,
    pattern_color: '#86efac',
    pattern_secondary_color: '#22c55e',
    card_identity: 'log',
  },
  diplomate: {
    background: '#14532d',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.8)',
    highlight: '#4ade80',
    border: 'rgba(255, 255, 255, 0.25)',
    badge_bg: 'rgba(60, 210, 0, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#86efac',
    pattern_secondary_color: '#22c55e',
    card_identity: 'log',
  },
  mentor: {
    background: '#14532d',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#4ade80',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(60, 200, 0, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.18,
    pattern_color: '#86efac',
    pattern_secondary_color: '#22c55e',
    card_identity: 'log',
  },
};

// Define program workout palettes (combo of program and workout styles)
const PROGRAM_WORKOUT_PALETTES: Record<Personality, ProgramWorkoutPalette> = {
  optimizer: {    
    background: '#5b21b6', // Somewhere between workout and program
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.8)',
    highlight: '#a78bfa',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(170, 0, 220, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.15,
    pattern_color: '#c4b5fd',
    pattern_secondary_color: '#8b5cf6',
    card_identity: 'program_workout',
  },
  versatile: {
    background: '#5b21b6',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#a78bfa',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(170, 0, 220, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.12,
    pattern_color: '#c4b5fd',
    pattern_secondary_color: '#8b5cf6',
    card_identity: 'program_workout',
  },
  diplomate: {
    background: '#5b21b6',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.8)',
    highlight: '#a78bfa',
    border: 'rgba(255, 255, 255, 0.25)',
    badge_bg: 'rgba(180, 0, 235, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
    pattern_opacity: 0.1,
    pattern_color: '#c4b5fd',
    pattern_secondary_color: '#8b5cf6',
    card_identity: 'program_workout',
  },
  mentor: {
    background: '#5b21b6',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#a78bfa',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(170, 0, 220, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
    pattern_opacity: 0.18,
    pattern_color: '#c4b5fd',
    pattern_secondary_color: '#8b5cf6',
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