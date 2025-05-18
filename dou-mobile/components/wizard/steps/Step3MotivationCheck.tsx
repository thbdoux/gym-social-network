// components/wizard/steps/Step3MotivationCheck.tsx
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
  onComplete: (data: ScoreType) => void;
  initialScores?: ScoreType;
}

const Step3MotivationCheck: React.FC<Step3MotivationCheckProps> = ({ onComplete, initialScores }) => {
  const { t } = useLanguage();
  const [selectedMotivations, setSelectedMotivations] = useState<string[]>([]);
  const [animation] = useState(new Animated.Value(0));
  
  // List of motivations
  const motivations: MotivationType[] = [
    {
      id: 'see_friends_records',
      icon: 'trophy',
      name: 'motivation_friends_records',
      score: { optimizer: 1, diplomate: 2, mentor: 2, versatile: 0 }
    },
    {
      id: 'meet_people',
      icon: 'people',
      name: 'motivation_meet_people',
      score: { optimizer: 0, diplomate: 3, mentor: 2, versatile: 0 }
    },
    {
      id: 'take_up_sport',
      icon: 'flash',
      name: 'motivation_take_up_sport',
      score: { optimizer: 1, diplomate: 2, mentor: 0, versatile: 2 }
    },
    {
      id: 'physical_transformation',
      icon: 'fitness',
      name: 'motivation_physical_transformation',
      score: { optimizer: 3, diplomate: 0, mentor: 0, versatile: 1 }
    },
    {
      id: 'monitor_exercise',
      icon: 'analytics',
      name: 'motivation_monitor_exercise',
      score: { optimizer: 3, diplomate: 0, mentor: 1, versatile: 0 }
    },
    {
      id: 'flex_performance',
      icon: 'trending-up',
      name: 'motivation_flex_performance',
      score: { optimizer: 2, diplomate: 1, mentor: 1, versatile: 1 }
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
    
    // If user didn't select anything, provide a balanced score
    if (selectedMotivations.length === 0) {
      Object.keys(calculatedScores).forEach(key => {
        calculatedScores[key as keyof ScoreType] = 1; // Balanced default
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
    
    onComplete(calculatedScores);
  };
  
  // Calculated animated values
  const fadeIn = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0]
  });
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeIn,
          transform: [{ translateY }]
        }
      ]}
    >
      <Text style={styles.title}>{t('motivation_title')}</Text>
      <Text style={styles.subtitle}>{t('motivation_subtitle')}</Text>
      
      <View style={styles.motivationsGrid}>
        {motivations.map((motivation) => {
          const isSelected = selectedMotivations.includes(motivation.id);
          
          return (
            <TouchableOpacity
              key={motivation.id}
              style={[
                styles.motivationCard,
                isSelected && styles.selectedMotivationCard
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
                  size={24} 
                  color={isSelected ? "white" : "#9CA3AF"} 
                />
              </View>
              <Text style={[
                styles.motivationText,
                isSelected && styles.selectedMotivationText
              ]}>
                {t(motivation.name)}
              </Text>
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
    paddingTop: 10,
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
    marginBottom: 24,
  },
  motivationCard: {
    width: '48%',
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  selectedMotivationCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
    transform: [{scale: 1.05}],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  motivationText: {
    color: '#D1D5DB',
    fontSize: 13,
    textAlign: 'center',
  },
  selectedMotivationText: {
    color: 'white',
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 14,
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