// utils/colorConfig.ts

// Define the available personality types
export type Personality = 'optimizer' | 'versatile' | 'diplomate' | 'mentor';

// Define the structure of a color palette
export interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
  accent: string;
  highlight: string;
}

// Define color palettes for each personality
const COLOR_PALETTES: Record<Personality, ColorPalette> = {
  optimizer: {
    primary: '#0077B6',    // Strong blue - focused, efficient
    secondary: '#00B4D8',  // Light blue - clarity, precision
    background: '#E9ECEF', // Light gray - clean, minimal
    text: '#212529',       // Dark gray - direct, clear
    border: '#ADB5BD',     // Medium gray - structured
    accent: '#FF9F1C',     // Orange - energy, action
    highlight: '#CAF0F8',  // Very light blue - emphasis
  },
  versatile: {
    primary: '#7209B7',    // Purple - adaptable, creative
    secondary: '#F72585',  // Pink - vibrant, dynamic
    background: '#F8F9FA', // Off-white - flexible, neutral
    text: '#343A40',       // Dark gray - balanced
    border: '#CED4DA',     // Light gray - adaptable
    accent: '#4CC9F0',     // Bright blue - multifaceted
    highlight: '#FDE2E6',  // Light pink - subtle emphasis
  },
  diplomate: {
    primary: '#2A9D8F',    // Teal - harmony, balance
    secondary: '#E9C46A',  // Gold - warmth, diplomacy
    background: '#F1FAEE', // Very light mint - calming
    text: '#264653',       // Dark teal - trustworthy
    border: '#B7E4D8',     // Light teal - peaceful
    accent: '#F4A261',     // Peach - communication, openness
    highlight: '#E8F8F5',  // Very light teal - gentle emphasis
  },
  mentor: {
    primary: '#5E548E',    // Deep purple - wisdom, guidance
    secondary: '#9C89B8',  // Lavender - supportive, nurturing
    background: '#F5F5F5', // Light gray - knowledge, clarity
    text: '#231942',       // Very dark purple - authoritative
    border: '#DCCFEC',     // Light purple - structure
    accent: '#FF6B6B',     // Coral red - passion for teaching
    highlight: '#F0E6F6',  // Very light purple - gentle emphasis
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