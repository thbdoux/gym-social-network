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

// Define specialized component color palettes
export interface WorkoutPalette {
  background: string;
  text: string;
  text_secondary: string;
  highlight: string;
  border: string;
  badge_bg: string;
  action_bg: string;
}

export interface ProgramPalette {
  background: string;
  text: string;
  text_secondary: string;
  highlight: string;
  border: string;
  badge_bg: string;
  action_bg: string;
}

export interface WorkoutLogPalette {
  background: string;
  text: string;
  text_secondary: string;
  highlight: string;
  border: string;
  badge_bg: string;
  action_bg: string;
}

export interface ProgramWorkoutPalette {
  background: string;
  text: string;
  text_secondary: string;
  highlight: string;
  border: string;
  badge_bg: string;
  action_bg: string;
}

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

// Define workout palettes with slight personality modifications
const WORKOUT_PALETTES: Record<Personality, WorkoutPalette> = {
  optimizer: {    
    background: '#0ea5e9',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#0c4a6e',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(255, 255, 255, 0.2)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
  },
  versatile: {
    background: '#0ea5e9',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#0c4a6e',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(255, 255, 255, 0.2)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
  },
  diplomate: {
    background: '#0ea5e9',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.8)',
    highlight: '#0b4568',
    border: 'rgba(255, 255, 255, 0.25)',
    badge_bg: 'rgba(255, 255, 255, 0.25)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
  },
  mentor: {
    background: '#0ea5e9',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#0d4c72',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(255, 255, 255, 0.2)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
  },
};

// Define program palettes with slight personality modifications
const PROGRAM_PALETTES: Record<Personality, ProgramPalette> = {
  optimizer: {    
    background: '#7e22ce',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#4a1472',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(200, 0, 240, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
  },
  versatile: {
    background: '#7e22ce',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#4a1472',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(200, 0, 240, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
  },
  diplomate: {
    background: '#7e22ce',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.8)',
    highlight: '#4d1589',
    border: 'rgba(255, 255, 255, 0.25)',
    badge_bg: 'rgba(210, 0, 255, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
  },
  mentor: {
    background: '#7e22ce',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#45136f',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(200, 0, 240, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
  },
};

// Define workout log palettes with slight personality modifications
const WORKOUT_LOG_PALETTES: Record<Personality, WorkoutLogPalette> = {
  optimizer: {    
    background: '#16a34a',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#166534',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(60, 200, 0, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
  },
  versatile: {
    background: '#16a34a',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#166534',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(60, 200, 0, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
  },
  diplomate: {
    background: '#16a34a',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.8)',
    highlight: '#15803d',
    border: 'rgba(255, 255, 255, 0.25)',
    badge_bg: 'rgba(60, 210, 0, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
  },
  mentor: {
    background: '#16a34a',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#14532d',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(60, 200, 0, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
  },
};

// Define program workout palettes (usually a combo of program and workout styles)
const PROGRAM_WORKOUT_PALETTES: Record<Personality, ProgramWorkoutPalette> = {
  optimizer: {    
    background: '#9333ea',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#581c87',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(170, 0, 220, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
  },
  versatile: {
    background: '#9333ea',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#581c87',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(170, 0, 220, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
  },
  diplomate: {
    background: '#9333ea',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.8)',
    highlight: '#6b21a8',
    border: 'rgba(255, 255, 255, 0.25)',
    badge_bg: 'rgba(180, 0, 235, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.95)',
  },
  mentor: {
    background: '#9333ea',
    text: '#ffffff',
    text_secondary: 'rgba(255, 255, 255, 0.7)',
    highlight: '#4c1d95',
    border: 'rgba(255, 255, 255, 0.2)',
    badge_bg: 'rgba(170, 0, 220, 0.7)',
    action_bg: 'rgba(255, 255, 255, 0.9)',
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