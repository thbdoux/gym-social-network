// components/workouts/CardBackground.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { 
  Path, 
  Circle, 
  Line, 
  Rect, 
  G,
  Defs,
  Pattern,
  Polyline,
  LinearGradient,
  Stop
} from 'react-native-svg';
import { WorkoutPalette } from '../../utils/colorConfig';

interface CardBackgroundProps {
  palette: WorkoutPalette;
  children?: React.ReactNode;
  style?: any;
}

const CardBackground: React.FC<CardBackgroundProps> = ({ 
  palette, 
  children,
  style
}) => {
  const renderPattern = () => {
    const { card_identity, pattern_color, pattern_secondary_color, pattern_opacity } = palette;
    
    switch (card_identity) {
      case 'template':
        return renderWorkoutTemplatePattern(pattern_color, pattern_secondary_color, pattern_opacity);
      case 'program':
        return renderProgramPattern(pattern_color, pattern_secondary_color, pattern_opacity);
      case 'log':
        return renderWorkoutLogPattern(pattern_color, pattern_secondary_color, pattern_opacity);
      case 'program_workout':
        return renderProgramWorkoutPattern(pattern_color, pattern_secondary_color, pattern_opacity);
      default:
        return null;
    }
  };
  
  // Blueprint/Grid pattern for workout templates
  const renderWorkoutTemplatePattern = (color: string, secondaryColor: string, opacity: number) => {
    return (
      <Svg height="100%" width="100%" style={styles.patternContainer}>
        <Defs>
          <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <Path 
              d="M 40 0 L 0 0 0 40" 
              fill="none" 
              stroke={color} 
              strokeWidth="0.5" 
              opacity={opacity * 0.8} 
            />
            <Circle cx="0" cy="0" r="1" fill={color} opacity={opacity} />
            <Circle cx="40" cy="0" r="1" fill={color} opacity={opacity} />
            <Circle cx="40" cy="40" r="1" fill={color} opacity={opacity} />
            <Circle cx="0" cy="40" r="1" fill={color} opacity={opacity} />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />
        
        {/* Dumbbell icon in background */}
        <G opacity={opacity * 0.7} transform="translate(100, 80) scale(0.8)">
          <Circle cx="20" cy="20" r="13" fill="none" stroke={secondaryColor} strokeWidth="2" />
          <Rect x="35" y="17" width="60" height="6" fill={secondaryColor} rx="3" />
          <Circle cx="110" cy="20" r="13" fill="none" stroke={secondaryColor} strokeWidth="2" />
        </G>
        
        {/* Exercise timeline indicators */}
        <G opacity={opacity * 0.5} transform="translate(30, 160)">
          <Circle cx="0" cy="0" r="5" fill={secondaryColor} />
          <Line x1="10" y1="0" x2="50" y2="0" stroke={secondaryColor} strokeWidth="2" strokeDasharray="5,3" />
          <Circle cx="60" cy="0" r="5" fill={secondaryColor} />
          <Line x1="70" y1="0" x2="110" y2="0" stroke={secondaryColor} strokeWidth="2" strokeDasharray="5,3" />
          <Circle cx="120" cy="0" r="5" fill={secondaryColor} />
        </G>
      </Svg>
    );
  };
  
  // Calendar/Routine pattern for programs
  const renderProgramPattern = (color: string, secondaryColor: string, opacity: number) => {
    return (
      <Svg height="100%" width="100%" style={styles.patternContainer}>
        <Defs>
          <LinearGradient id="scheduleGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.background} stopOpacity="0.1" />
            <Stop offset="1" stopColor={palette.background} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>
        
        {/* Calendar grid */}
        <G opacity={opacity * 0.7}>
          {/* Calendar outline */}
          <Rect x="30" y="40" width="140" height="130" fill="none" stroke={color} strokeWidth="1.5" rx="5" />
          
          {/* Days header */}
          <Line x1="30" y1="60" x2="170" y2="60" stroke={color} strokeWidth="1" />
          
          {/* Vertical lines for days */}
          <Line x1="50" y1="40" x2="50" y2="170" stroke={color} strokeWidth="0.8" />
          <Line x1="70" y1="40" x2="70" y2="170" stroke={color} strokeWidth="0.8" />
          <Line x1="90" y1="40" x2="90" y2="170" stroke={color} strokeWidth="0.8" />
          <Line x1="110" y1="40" x2="110" y2="170" stroke={color} strokeWidth="0.8" />
          <Line x1="130" y1="40" x2="130" y2="170" stroke={color} strokeWidth="0.8" />
          <Line x1="150" y1="40" x2="150" y2="170" stroke={color} strokeWidth="0.8" />
          
          {/* Horizontal lines for weeks */}
          <Line x1="30" y1="80" x2="170" y2="80" stroke={color} strokeWidth="0.8" />
          <Line x1="30" y1="100" x2="170" y2="100" stroke={color} strokeWidth="0.8" />
          <Line x1="30" y1="120" x2="170" y2="120" stroke={color} strokeWidth="0.8" />
          <Line x1="30" y1="140" x2="170" y2="140" stroke={color} strokeWidth="0.8" />
        </G>
        
        {/* Journey path visualization */}
        <G opacity={opacity}>
          <Path 
            d="M 40 180 C 80 120, 100 150, 160 90" 
            fill="none" 
            stroke={secondaryColor} 
            strokeWidth="3" 
            strokeDasharray="4,2" 
          />
          <Circle cx="40" cy="180" r="4" fill={secondaryColor} />
          <Circle cx="100" cy="135" r="4" fill={secondaryColor} />
          <Circle cx="160" cy="90" r="4" fill={secondaryColor} />
        </G>
        
        {/* Weekly activity markers */}
        <G opacity={opacity * 0.9} transform="translate(50, 50)">
          <Circle cx="0" cy="0" r="3" fill={secondaryColor} />
          <Circle cx="40" cy="0" r="3" fill={secondaryColor} />
          <Circle cx="80" cy="0" r="3" fill={secondaryColor} />
          <Circle cx="0" cy="30" r="3" fill={secondaryColor} />
          <Circle cx="40" cy="30" r="3" fill={secondaryColor} />
          <Circle cx="0" cy="60" r="3" fill={secondaryColor} />
          <Circle cx="80" cy="60" r="3" fill={secondaryColor} />
        </G>
      </Svg>
    );
  };
  
  // Achievement/Completion pattern for workout logs
  const renderWorkoutLogPattern = (color: string, secondaryColor: string, opacity: number) => {
    return (
      <Svg height="100%" width="100%" style={styles.patternContainer}>
        {/* Achievement background */}
        <Defs>
          <LinearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.2" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        
        {/* Progress rays */}
        <G opacity={opacity * 0.6}>
          <Path d="M 100 200 L 100 0" stroke={color} strokeWidth="1" />
          <Path d="M 100 200 L 200 30" stroke={color} strokeWidth="1" />
          <Path d="M 100 200 L 0 30" stroke={color} strokeWidth="1" />
          <Path d="M 100 200 L 180 100" stroke={color} strokeWidth="1" />
          <Path d="M 100 200 L 20 100" stroke={color} strokeWidth="1" />
        </G>
        
        {/* Checkmark achievement icon */}
        <G opacity={opacity} transform="translate(120, 80) scale(1.5)">
          <Circle cx="0" cy="0" r="20" fill="none" stroke={secondaryColor} strokeWidth="2" />
          <Path 
            d="M -10 0 L -3 7 L 10 -6" 
            fill="none" 
            stroke={secondaryColor} 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </G>
        
        {/* Trophy icon */}
        <G opacity={opacity * 0.7} transform="translate(60, 140)">
          <Path 
            d="M -15 0 L 15 0 15 -20 -15 -20 Z" 
            fill="none" 
            stroke={secondaryColor} 
            strokeWidth="1.5" 
          />
          <Path 
            d="M 0 0 L 0 10" 
            stroke={secondaryColor} 
            strokeWidth="1.5" 
          />
          <Path 
            d="M -10 10 L 10 10" 
            stroke={secondaryColor} 
            strokeWidth="1.5" 
          />
          <Path 
            d="M -15 -10 L -25 -10 -25 -15 -15 -15" 
            fill="none" 
            stroke={secondaryColor} 
            strokeWidth="1.5" 
          />
          <Path 
            d="M 15 -10 L 25 -10 25 -15 15 -15" 
            fill="none" 
            stroke={secondaryColor} 
            strokeWidth="1.5" 
          />
        </G>
      </Svg>
    );
  };
  
  // Combined pattern for program workouts
  const renderProgramWorkoutPattern = (color: string, secondaryColor: string, opacity: number) => {
    return (
      <Svg height="100%" width="100%" style={styles.patternContainer}>
        <Defs>
          <Pattern id="scheduleGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <Path 
              d="M 50 0 L 0 0 0 50" 
              fill="none" 
              stroke={color} 
              strokeWidth="0.5" 
              opacity={opacity * 0.6} 
            />
          </Pattern>
        </Defs>
        
        {/* Blended background grid */}
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#scheduleGrid)" />
        
        {/* Program line */}
        <G opacity={opacity * 0.7}>
          <Path 
            d="M 30 80 L 170 80" 
            stroke={secondaryColor} 
            strokeWidth="2" 
            strokeDasharray="5,3" 
          />
          
          {/* Workout indicators on program line */}
          <Circle cx="60" cy="80" r="6" fill={secondaryColor} opacity="0.8" />
          <Circle cx="100" cy="80" r="6" fill={secondaryColor} opacity="0.8" />
          <Circle cx="140" cy="80" r="6" fill={secondaryColor} opacity="0.8" />
        </G>
        
        {/* The current workout indicator */}
        <G opacity={opacity} transform="translate(100, 120)">
          <Circle cx="0" cy="0" r="15" fill="none" stroke={color} strokeWidth="1.5" />
          <Circle cx="0" cy="0" r="8" fill={secondaryColor} opacity="0.8" />
          <Line x1="0" y1="-30" x2="0" y2="30" stroke={color} strokeWidth="1" strokeDasharray="2,2" />
          <Line x1="-30" y1="0" x2="30" y2="0" stroke={color} strokeWidth="1" strokeDasharray="2,2" />
        </G>
        
        {/* Small calendar indicator */}
        <G opacity={opacity * 0.5} transform="translate(40, 150)">
          <Rect x="0" y="0" width="20" height="20" fill="none" stroke={secondaryColor} strokeWidth="1" />
          <Line x1="0" y1="5" x2="20" y2="5" stroke={secondaryColor} strokeWidth="0.8" />
          <Line x1="5" y1="0" x2="5" y2="20" stroke={secondaryColor} strokeWidth="0.8" />
          <Line x1="10" y1="0" x2="10" y2="20" stroke={secondaryColor} strokeWidth="0.8" />
          <Line x1="15" y1="0" x2="15" y2="20" stroke={secondaryColor} strokeWidth="0.8" />
          <Line x1="0" y1="10" x2="20" y2="10" stroke={secondaryColor} strokeWidth="0.8" />
          <Line x1="0" y1="15" x2="20" y2="15" stroke={secondaryColor} strokeWidth="0.8" />
        </G>
      </Svg>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }, style]}>
      {renderPattern()}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default CardBackground;