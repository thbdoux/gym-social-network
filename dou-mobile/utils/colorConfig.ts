// utils/colorConfig.ts

// Define the available personality types
export type Personality = 'optimizer' | 'versatile' | 'diplomate' | 'mentor';

// Define the structure of a color palette
export interface ColorPalette {
  layout: string;
  page_background:string,
  text: string;
  border: string;
  accent: string;
  highlight: string;
}

// Define color palettes for each personality
const COLOR_PALETTES: Record<Personality, ColorPalette> = {
  optimizer: {    
    layout: '#002e4d', 
    page_background:'#00192c',
    text: '#fbfcf9',       
    border: '#ADB5BD',     
    accent: '#00192c',     
    highlight: '#e9a835',  
  },
  versatile: {
    layout: '#49ab53',
    page_background:'#00492b',
    text: '#CED4DA',      
    border: '#efca72',
    accent: '#e17714',
    highlight: '#FDE2E6',
  },
  diplomate: {
    layout: '#b092b1',
    page_background:'#003c3c',
    text: '#feefd3',
    border: '#B7E4D8',
    accent: '#f1661b',
    highlight: '#E8F8F5',
  },
  mentor: {
    layout: '#bb3c20',
    page_background:'#00494d',
    text: '#e7d5a4',
    border: '#e7d5a4',
    accent: '#203132',
    highlight: '#e6d5a4',
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