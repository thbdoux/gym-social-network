// utils/createThemedStyles.ts
import { StyleSheet } from 'react-native';
import { ColorPalette } from './colorConfig';

type StyleCreator<T> = (palette: ColorPalette) => T;

/**
 * Creates personality-responsive styles using the provided palette
 * @param createStyles A function that generates styles using the provided color palette
 * @returns A StyleSheet object with the generated styles
 */
export function createThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  createStyles: StyleCreator<T>
): (palette: ColorPalette) => T {
  return (palette: ColorPalette) => StyleSheet.create(createStyles(palette));
}

/**
 * Creates a linear gradient color array from a palette for specific use cases
 * @param palette The color palette
 * @param type The gradient type/use case
 * @returns An array of colors for linear gradient
 */
export function getGradientColors(
  palette: ColorPalette, 
  type: 'header' | 'card' | 'button' | 'avatar' = 'card'
): string[] {
  switch (type) {
    case 'header':
      return [palette.primary, palette.secondary];
    case 'button':
      return [palette.secondary, palette.primary];
    case 'avatar':
      return [palette.accent, palette.primary];
    case 'card':
    default:
      return [palette.highlight, palette.background];
  }
}

/**
 * Returns alpha-adjusted color for overlays and backgrounds
 * @param color The base color (hex)
 * @param alpha The alpha value (0-1)
 * @returns RGBA color string
 */
export function withAlpha(color: string, alpha: number): string {
  // Convert hex to rgb
  let r = 0, g = 0, b = 0;
  
  // 3 digits
  if (color.length === 4) {
    r = parseInt(color[1] + color[1], 16);
    g = parseInt(color[2] + color[2], 16);
    b = parseInt(color[3] + color[3], 16);
  } 
  // 6 digits
  else if (color.length === 7) {
    r = parseInt(color.slice(1, 3), 16);
    g = parseInt(color.slice(3, 5), 16);
    b = parseInt(color.slice(5, 7), 16);
  }
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}