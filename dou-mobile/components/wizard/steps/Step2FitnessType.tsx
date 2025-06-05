// components/wizard/steps/Step2FitnessType.tsx - Simplified clean version
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

type ActivityType = {
  id: string;
  icon: string;
  name: string;
  category: 'sports' | 'lifestyle';
  score: ScoreType;
};

interface Step2FitnessTypeProps {
  onComplete: (data: ScoreType & { responses: any }) => void;
  initialScores?: ScoreType;
}

const Step2FitnessType: React.FC<Step2FitnessTypeProps> = ({ onComplete, initialScores }) => {
  const { t } = useLanguage();
  const [animation] = useState(new Animated.Value(0));
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'sports' | 'lifestyle'>('all');
  
  // Clean activity list - rebalanced scores without spoilers
  const activities: ActivityType[] = [
    // Sports
    { 
      id: 'gym_rat', 
      icon: 'barbell',
      name: 'fitness_type_gym_rat',
      category: 'sports',
      score: { optimizer: 2, diplomate: 1, mentor: 1, versatile: 1 }
    },
    { 
      id: 'mountain_climber', 
      icon: 'trail-sign',
      name: 'fitness_type_mountain_climber',
      category: 'sports',
      score: { optimizer: 1, diplomate: 1, mentor: 1, versatile: 3 }
    },
    { 
      id: 'footballer', 
      icon: 'football',
      name: 'fitness_type_footballer',
      category: 'sports',
      score: { optimizer: 1, diplomate: 3, mentor: 2, versatile: 1 }
    },
    { 
      id: 'cyclist', 
      icon: 'bicycle',
      name: 'fitness_type_cyclist',
      category: 'sports',
      score: { optimizer: 2, diplomate: 1, mentor: 1, versatile: 2 }
    },
    { 
      id: 'swimmer', 
      icon: 'water',
      name: 'fitness_type_swimmer',
      category: 'sports',
      score: { optimizer: 2, diplomate: 1, mentor: 1, versatile: 2 }
    },
    { 
      id: 'yoga_enthusiast', 
      icon: 'body',
      name: 'fitness_type_yoga',
      category: 'sports',
      score: { optimizer: 1, diplomate: 2, mentor: 3, versatile: 2 }
    },
    { 
      id: 'runner', 
      icon: 'walk',
      name: 'fitness_type_runner',
      category: 'sports',
      score: { optimizer: 2, diplomate: 1, mentor: 1, versatile: 2 }
    },
    { 
      id: 'dancer', 
      icon: 'musical-notes',
      name: 'fitness_type_dancer',
      category: 'sports',
      score: { optimizer: 1, diplomate: 2, mentor: 2, versatile: 3 }
    },
    { 
      id: 'team_coach', 
      icon: 'people',
      name: 'fitness_type_team_coach',
      category: 'sports',
      score: { optimizer: 1, diplomate: 2, mentor: 3, versatile: 1 }
    },
    { 
      id: 'adventure_sports', 
      icon: 'airplane',
      name: 'fitness_type_adventure_sports',
      category: 'sports',
      score: { optimizer: 1, diplomate: 1, mentor: 1, versatile: 3 }
    },
    // Lifestyle
    { 
      id: 'couch_potato', 
      icon: 'tv',
      name: 'fitness_type_couch_potato',
      category: 'lifestyle',
      score: { optimizer: 0, diplomate: 2, mentor: 1, versatile: 1 }
    },
    { 
      id: 'gamer', 
      icon: 'game-controller',
      name: 'fitness_type_gamer',
      category: 'lifestyle',
      score: { optimizer: 1, diplomate: 1, mentor: 1, versatile: 1 }
    },
    { 
      id: 'cook', 
      icon: 'restaurant',
      name: 'fitness_type_cook',
      category: 'lifestyle',
      score: { optimizer: 1, diplomate: 2, mentor: 2, versatile: 2 }
    },
    { 
      id: 'reader', 
      icon: 'book',
      name: 'fitness_type_reader',
      category: 'lifestyle',
      score: { optimizer: 1, diplomate: 1, mentor: 3, versatile: 1 }
    },
    { 
      id: 'outdoor_explorer', 
      icon: 'compass',
      name: 'fitness_type_outdoor_explorer',
      category: 'lifestyle',
      score: { optimizer: 1, diplomate: 1, mentor: 1, versatile: 3 }
    },
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
  
  const toggleActivity = (activityId: string) => {
    setSelectedActivities(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId);
      } else {
        // Allow maximum 4 selections
        if (prev.length >= 4) {
          return prev;
        }
        return [...prev, activityId];
      }
    });
  };
  
  const handleContinue = () => {
    // Calculate scores based on selected activities
    const calculatedScores: ScoreType = {
      optimizer: 0,
      diplomate: 0,
      mentor: 0,
      versatile: 0
    };
    
    // Store user responses (simplified)
    const responses = {
      selected_activities: selectedActivities,
      total_selections: selectedActivities.length,
    };
    
    selectedActivities.forEach(activityId => {
      const activity = activities.find(a => a.id === activityId);
      if (activity) {
        Object.keys(calculatedScores).forEach(key => {
          calculatedScores[key as keyof ScoreType] += activity.score[key as keyof ScoreType];
        });
      }
    });
    
    onComplete({ ...calculatedScores, responses });
  };
  
  // Filter activities by category
  const filteredActivities = activeCategory === 'all' 
    ? activities
    : activities.filter(activity => activity.category === activeCategory);
  
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
      <Text style={styles.title}>{t('fitness_type_title')}</Text>
      <Text style={styles.subtitle}>
        {t('fitness_type_subtitle_simple') || 'Choose your top 4 favorite activities'}
      </Text>
      
      {/* Simple category filter */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: t('all_activities') || 'All' },
          { key: 'sports', label: t('sports_activities') || 'Sports' },
          { key: 'lifestyle', label: t('lifestyle_activities') || 'Lifestyle' }
        ].map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              activeCategory === filter.key && styles.activeFilterButton
            ]}
            onPress={() => setActiveCategory(filter.key as any)}
          >
            <Text style={[
              styles.filterText,
              activeCategory === filter.key && styles.activeFilterText
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Activity selection */}
      <ScrollView 
        style={styles.activitiesScrollView}
        contentContainerStyle={styles.activitiesContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredActivities.map((activity, index) => {
          const isSelected = selectedActivities.includes(activity.id);
          const isDisabled = !isSelected && selectedActivities.length >= 4;
          
          return (
            <TouchableOpacity
              key={activity.id}
              style={[
                styles.activityCard,
                isSelected && styles.selectedCard,
                isDisabled && styles.disabledCard
              ]}
              onPress={() => toggleActivity(activity.id)}
              disabled={isDisabled}
              activeOpacity={0.8}
            >
              <View style={[
                styles.activityIcon,
                isSelected && styles.selectedIcon
              ]}>
                <Ionicons 
                  name={activity.icon as any} 
                  size={20} 
                  color={isSelected ? "#FFFFFF" : "#9CA3AF"} 
                />
              </View>
              
              <Text style={[
                styles.activityText,
                isSelected && styles.selectedText
              ]}>
                {t(activity.name)}
              </Text>
              
              {isSelected && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark" size={16} color="#10B981" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {/* Selection counter */}
      <View style={styles.selectionCounter}>
        <Text style={styles.counterText}>
          {selectedActivities.length}/4 {t('selected') || 'selected'}
        </Text>
      </View>
      
      <TouchableOpacity
        style={[
          styles.continueButton,
          selectedActivities.length === 0 && styles.disabledButton
        ]}
        onPress={handleContinue}
        disabled={selectedActivities.length === 0}
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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
  },
  activeFilterButton: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  activitiesScrollView: {
    flex: 1,
    marginBottom: 16,
  },
  activitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  activityCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    position: 'relative',
  },
  selectedCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    transform: [{ scale: 1.02 }],
  },
  disabledCard: {
    opacity: 0.4,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedIcon: {
    backgroundColor: 'rgba(59, 130, 246, 0.6)',
  },
  activityText: {
    flex: 1,
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '500',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCounter: {
    alignItems: 'center',
    marginBottom: 16,
  },
  counterText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
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

export default Step2FitnessType;