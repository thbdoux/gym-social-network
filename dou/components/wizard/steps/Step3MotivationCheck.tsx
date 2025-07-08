// components/wizard/steps/Step3MotivationCheck.tsx - Simplified compact version
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

type MotivationType = {
  id: string;
  icon: string;
  name: string;
  score: ScoreType;
};

interface Step3MotivationCheckProps {
  onComplete: (data: ScoreType & { responses: any }) => void;
  initialScores?: ScoreType;
}

const Step3MotivationCheck: React.FC<Step3MotivationCheckProps> = ({ onComplete, initialScores }) => {
  const { t } = useLanguage();
  const [selectedMotivations, setSelectedMotivations] = useState<string[]>([]);
  const [animation] = useState(new Animated.Value(0));
  
  // Simplified motivations - just titles, no descriptions
  const motivations: MotivationType[] = [
    {
      id: 'see_friends_records',
      icon: 'trophy',
      name: 'motivation_friends_records',
      score: { optimizer: 1, diplomate: 3, mentor: 2, versatile: 1 }
    },
    {
      id: 'meet_people',
      icon: 'people',
      name: 'motivation_meet_people',
      score: { optimizer: 0, diplomate: 3, mentor: 2, versatile: 1 }
    },
    {
      id: 'take_up_sport',
      icon: 'flash',
      name: 'motivation_take_up_sport',
      score: { optimizer: 1, diplomate: 1, mentor: 1, versatile: 3 }
    },
    {
      id: 'physical_transformation',
      icon: 'fitness',
      name: 'motivation_physical_transformation',
      score: { optimizer: 2, diplomate: 0, mentor: 1, versatile: 2 }
    },
    {
      id: 'monitor_exercise',
      icon: 'analytics',
      name: 'motivation_monitor_exercise',
      score: { optimizer: 2, diplomate: 0, mentor: 1, versatile: 1 }
    },
    {
      id: 'flex_performance',
      icon: 'trending-up',
      name: 'motivation_flex_performance',
      score: { optimizer: 2, diplomate: 2, mentor: 1, versatile: 1 }
    },
    {
      id: 'help_others_succeed',
      icon: 'heart',
      name: 'motivation_help_others',
      score: { optimizer: 0, diplomate: 2, mentor: 3, versatile: 1 }
    },
    {
      id: 'explore_new_activities',
      icon: 'compass',
      name: 'motivation_explore_new',
      score: { optimizer: 1, diplomate: 1, mentor: 1, versatile: 3 }
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
  
  const toggleMotivation = (id: string) => {
    setSelectedMotivations(prev => {
      if (prev.includes(id)) {
        return prev.filter(m => m !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  const handleContinue = () => {
    // Calculate scores based on selections
    const calculatedScores: ScoreType = {
      optimizer: 0,
      diplomate: 0,
      mentor: 0,
      versatile: 0
    };
    
    // Store user responses (simplified)
    const responses = {
      selected_motivations: selectedMotivations,
      total_selections: selectedMotivations.length,
    };
    
    // If user didn't select anything, provide a balanced score
    if (selectedMotivations.length === 0) {
      Object.keys(calculatedScores).forEach(key => {
        calculatedScores[key as keyof ScoreType] = 1;
      });
    } else {
      selectedMotivations.forEach(id => {
        const motivation = motivations.find(m => m.id === id);
        if (motivation) {
          Object.keys(calculatedScores).forEach(key => {
            calculatedScores[key as keyof ScoreType] += motivation.score[key as keyof ScoreType];
          });
        }
      });
    }
    
    onComplete({ ...calculatedScores, responses });
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
      <Text style={styles.title}>{t('motivation_title')}</Text>
      <Text style={styles.subtitle}>{t('motivation_subtitle') || 'Select all that apply'}</Text>
      
      <View style={styles.motivationsGrid}>
        {motivations.map((motivation, index) => {
          const isSelected = selectedMotivations.includes(motivation.id);
          
          return (
            <TouchableOpacity
              key={motivation.id}
              style={[
                styles.motivationCard,
                isSelected && styles.selectedCard
              ]}
              onPress={() => toggleMotivation(motivation.id)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.iconContainer, 
                isSelected && styles.selectedIconContainer
              ]}>
                <Ionicons 
                  name={motivation.icon as any} 
                  size={18} 
                  color={isSelected ? "#FFFFFF" : "#9CA3AF"} 
                />
              </View>
              
              <Text style={[
                styles.motivationText,
                isSelected && styles.selectedText
              ]}>
                {t(motivation.name)}
              </Text>
              
              {isSelected && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark" size={12} color="#10B981" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
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
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  motivationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  motivationCard: {
    width: '48%',
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    position: 'relative',
    minHeight: 80,
  },
  selectedCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    transform: [{ scale: 1.02 }],
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.6)',
  },
  motivationText: {
    color: '#D1D5DB',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
});

export default Step3MotivationCheck;