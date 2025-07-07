// components/navigation/HeaderLogoWithSVG.tsx
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

/*
 * Updated component to use PNG image instead of SVG
 * Accepts width and height as parameters for flexibility
 */

interface HeaderLogoProps {
  width?: number;
  height?: number;
}

const HeaderLogoWithSVG: React.FC<HeaderLogoProps> = ({ 
  width = 80, 
  height = 45 
}) => {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/dou-white.png')} 
        style={[styles.logo, { width, height }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Base styles (width and height now come from props)
  },
});

export default HeaderLogoWithSVG;