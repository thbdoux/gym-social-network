// components/navigation/HeaderLogoWithSVG.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { 
  Text, 
  Defs, 
  RadialGradient, 
  LinearGradient, 
  Stop 
} from 'react-native-svg';

/*
 * NOTE: To use this component, you need to install the react-native-svg package.
 * Run: npm install react-native-svg
 * Then: npx expo install react-native-svg
 * 
 * This recreates your original SVG logo with the exact same gradients.
 */

const HeaderLogoWithSVG = () => {
  return (
    <View style={styles.container}>
      <Svg width="120" height="45" viewBox="0 20 200 45">
        <Defs>
          {/* Radial gradient for 'd' */}
          <RadialGradient 
            id="gradient-d" 
            cx="30%" 
            cy="30%" 
            r="70%" 
            fx="20%" 
            fy="20%"
          >
            <Stop offset="0%" stopColor="#FFA500" stopOpacity="1" />
            <Stop offset="50%" stopColor="#FF8C00" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF0080" stopOpacity="1" />
          </RadialGradient>
          
          {/* Linear gradient for 'o' */}
          <LinearGradient 
            id="gradient-o" 
            x1="0%" 
            y1="0%" 
            x2="100%" 
            y2="100%"
          >
            <Stop offset="0%" stopColor="#FF0080" stopOpacity="1" />
            <Stop offset="50%" stopColor="#FF00FF" stopOpacity="1" />
            <Stop offset="100%" stopColor="#4B0082" stopOpacity="1" />
          </LinearGradient>
          
          {/* Linear gradient for 'u' */}
          <LinearGradient 
            id="gradient-u" 
            x1="0%" 
            y1="100%" 
            x2="100%" 
            y2="0%"
          >
            <Stop offset="0%" stopColor="#4B0082" stopOpacity="1" />
            <Stop offset="30%" stopColor="#8A2BE2" stopOpacity="1" />
            <Stop offset="70%" stopColor="#0000FF" stopOpacity="1" />
            <Stop offset="100%" stopColor="#00BFFF" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        
        {/* The text characters with their respective gradients */}
        <Text 
          x="50" 
          y="60" 
          fontSize="50" 
          fontFamily="Arial-BoldMT, Arial Black" 
          fontWeight="bold" 
          fill="url(#gradient-d)"
        >
          d
        </Text>
        <Text 
          x="80" 
          y="60" 
          fontSize="50" 
          fontFamily="Arial-BoldMT, Arial Black" 
          fontWeight="bold"
          fill="url(#gradient-o)"
        >
          o
        </Text>
        <Text 
          x="110" 
          y="60" 
          fontSize="50" 
          fontFamily="Arial-BoldMT, Arial Black" 
          fontWeight="bold"
          fill="url(#gradient-u)"
        >
          u
        </Text>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HeaderLogoWithSVG;
