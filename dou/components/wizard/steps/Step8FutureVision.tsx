// components/wizard/steps/Step8FutureVision.tsx - "In 2 years" vision step
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';

type ScoreType = {
  optimizer: number;
  diplomate: number;
  mentor: number;
  versatile: number;
};

type VisionType = {
  id: string;
  title: string;
  icon: string;
  score: ScoreType;
};

interface Step8FutureVisionProps {
  onComplete: (data: ScoreType & { responses: any }) => void;
  initialScores?: ScoreType;
}

const Step8FutureVision: React.FC<Step8FutureVisionProps> = ({ onComplete, initialScores }) => {
  const { t } = useLanguage();
  const [selectedVision, setSelectedVision] = useState<string | null>(null);
  const [animation] = useState(new Animated.Value(0));
  
  // The 4 future visions - each targets a specific personality type
  const visions: VisionType[] = [
    {
      id: 'mentoring_others',
      title: 'future_vision_mentoring',
      icon: 'people',
      score: { optimizer: 0, diplomate: 1, mentor: 3, versatile: 0 }
    },
    {
      id: 'most_performant',
      title: 'future_vision_performant',
      icon: 'trophy',
      score: { optimizer: 3, diplomate: 0, mentor: 0, versatile: 1 }
    },
    {
      id: 'everyone_knows',
      title: 'future_vision_popular',
      icon: 'heart',
      score: { optimizer: 0, diplomate: 3, mentor: 1, versatile: 0 }
    },
    {
      id: 'explored_all_methods',
      title: 'future_vision_explorer',
      icon: 'compass',
      score: { optimizer: 1, diplomate: 0, mentor: 0, versatile: 3 }
    }
  ];
  
  // Animation when component mounts
  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad)
    }).start();
  }, []);
  
  const handleSelect = (visionId: string) => {
    setSelectedVision(visionId);
  };
  
  const handleContinue = () => {
    if (selectedVision) {
      const vision = visions.find(v => v.id === selectedVision);
      if (vision) {
        // Store user responses (simplified)
        const responses = {
          selected_vision: selectedVision,
        };
        
        onComplete({ ...vision.score, responses });
      }
    }
  };
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })
            }
          ]
        }
      ]}
    >
      <Text style={styles.title}>
        {t('future_vision_title') || 'In 2 years, you imagine yourself to be:'}
      </Text>
      <Text style={styles.subtitle}>
        {t('future_vision_subtitle') || 'Choose the vision that resonates most with you'}
      </Text>
      
      <View style={styles.visionsContainer}>
        {visions.map((vision, index) => {
          const isSelected = selectedVision === vision.id;
          
          return (
            <Animated.View
              key={vision.id}
              style={[
                styles.visionWrapper,
                {
                  opacity: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1]
                  }),
                  transform: [
                    {
                      translateY: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20 + index * 10, 0]
                      })
                    }
                  ]
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.visionCard,
                  isSelected && styles.selectedCard
                ]}
                onPress={() => handleSelect(vision.id)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.iconContainer,
                  isSelected && styles.selectedIconContainer
                ]}>
                  <Ionicons 
                    name={vision.icon as any} 
                    size={28} 
                    color={isSelected ? "#FFFFFF" : "#9CA3AF"} 
                  />
                </View>
                
                <Text style={[
                  styles.visionTitle,
                  isSelected && styles.selectedTitle
                ]}>
                  {t(vision.title)}
                </Text>
                
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
      
      <TouchableOpacity
        style={[
          styles.continueButton,
          !selectedVision && styles.disabledButton
        ]}
        onPress={handleContinue}
        disabled={!selectedVision}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>{t('continue')}</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  visionsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  visionWrapper: {
    marginBottom: 16,
  },
  visionCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    minHeight: 100,
  },
  selectedCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.6)',
  },
  visionTitle: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  selectedTitle: {
    color: '#FFFFFF',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 'auto',
  },
  disabledButton: {
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
});

export default Step8FutureVision;