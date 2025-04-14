// components/wizard/steps/Step2FitnessType.tsx
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

// Define a type for the score
type ScoreType = {
  optimizer: number;
  diplomate: number;
  mentor: number;
  versatile: number;
};

// Define a type for the activity card
type ActivityCardType = {
  id: string;
  icon: string;
  name: string;
  category: 'sports' | 'lifestyle';
  score: ScoreType;
};

interface Step2FitnessTypeProps {
  onComplete: (data: ScoreType) => void;
  initialScores?: ScoreType;
}

const Step2FitnessType: React.FC<Step2FitnessTypeProps> = ({ onComplete, initialScores }) => {
  const { t } = useLanguage();
  const [animation] = useState(new Animated.Value(0));
  
  // Available activity cards
  const [availableCards, setAvailableCards] = useState<ActivityCardType[]>([
    // Sports activities
    { 
      id: 'gym_rat', 
      icon: 'barbell',
      name: 'fitness_type_gym_rat',
      category: 'sports',
      score: { optimizer: 3, diplomate: 1, mentor: 1, versatile: 1 }
    },
    { 
      id: 'mountain_climber', 
      icon: 'trail-sign',
      name: 'fitness_type_mountain_climber',
      category: 'sports',
      score: { optimizer: 1, diplomate: 1, mentor: 0, versatile: 3 }
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
      score: { optimizer: 3, diplomate: 0, mentor: 1, versatile: 1 }
    },
    { 
      id: 'swimmer', 
      icon: 'water',
      name: 'fitness_type_swimmer',
      category: 'sports',
      score: { optimizer: 2, diplomate: 0, mentor: 1, versatile: 2 }
    },
    { 
      id: 'yoga_enthusiast', 
      icon: 'body',
      name: 'fitness_type_yoga',
      category: 'sports',
      score: { optimizer: 1, diplomate: 2, mentor: 3, versatile: 1 }
    },
    { 
      id: 'runner', 
      icon: 'walk',
      name: 'fitness_type_runner',
      category: 'sports',
      score: { optimizer: 3, diplomate: 0, mentor: 1, versatile: 1 }
    },
    { 
      id: 'dancer', 
      icon: 'musical-notes',
      name: 'fitness_type_dancer',
      category: 'sports',
      score: { optimizer: 2, diplomate: 2, mentor: 1, versatile: 2 }
    },
    // Non-sportive activities
    { 
      id: 'couch_potato', 
      icon: 'tv',
      name: 'fitness_type_couch_potato',
      category: 'lifestyle',
      score: { optimizer: 0, diplomate: 2, mentor: 0, versatile: 1 }
    },
    { 
      id: 'gamer', 
      icon: 'game-controller',
      name: 'fitness_type_gamer',
      category: 'lifestyle',
      score: { optimizer: 1, diplomate: 1, mentor: 0, versatile: 1 }
    },
    { 
      id: 'cook', 
      icon: 'restaurant',
      name: 'fitness_type_cook',
      category: 'lifestyle',
      score: { optimizer: 1, diplomate: 2, mentor: 2, versatile: 1 }
    },
    { 
      id: 'reader', 
      icon: 'book',
      name: 'fitness_type_reader',
      category: 'lifestyle',
      score: { optimizer: 0, diplomate: 1, mentor: 3, versatile: 0 }
    },
  ]);
  
  const [selectedCards, setSelectedCards] = useState<ActivityCardType[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'sports' | 'lifestyle'>('all');
  
  // Animation when component mounts
  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad)
    }).start();
  }, []);
  
  // Select a card and add it to selected cards
  const handleSelectCard = (card: ActivityCardType) => {
    // Don't add if we already have 4 cards
    if (selectedCards.length >= 4) return;
    
    // Add the card to selected cards
    setSelectedCards(prev => [...prev, card]);
    
    // Remove the card from available cards
    setAvailableCards(prev => prev.filter(c => c.id !== card.id));
  };
  
  // Remove a card from selection and add it back to available cards
  const handleRemoveCard = (cardId: string) => {
    // Find the card
    const card = selectedCards.find(c => c.id === cardId);
    
    if (card) {
      // Add it back to available cards
      setAvailableCards(prev => [...prev, card]);
      
      // Remove it from selected cards
      setSelectedCards(prev => prev.filter(c => c.id !== cardId));
    }
  };
  
  // Move a card up in the ranking
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    
    setSelectedCards(prev => {
      const newCards = [...prev];
      [newCards[index], newCards[index - 1]] = [newCards[index - 1], newCards[index]];
      return newCards;
    });
  };
  
  // Move a card down in the ranking
  const handleMoveDown = (index: number) => {
    if (index === selectedCards.length - 1) return;
    
    setSelectedCards(prev => {
      const newCards = [...prev];
      [newCards[index], newCards[index + 1]] = [newCards[index + 1], newCards[index]];
      return newCards;
    });
  };
  
  const handleContinue = () => {
    // Calculate scores based on ranking
    // First place (index 0) gets highest weight, last place gets lowest
    const calculatedScores: ScoreType = {
      optimizer: 0,
      diplomate: 0,
      mentor: 0,
      versatile: 0
    };
    
    // Weight by position (first choice worth more than last)
    const weights = [5, 3, 2, 1]; // Emphasize top choices more
    
    selectedCards.forEach((card, index) => {
      const weight = weights[index] || 1; // Fallback to weight 1 if we have more than 4 cards somehow
      Object.keys(card.score).forEach(key => {
        calculatedScores[key as keyof ScoreType] += card.score[key as keyof ScoreType] * weight;
      });
    });
    
    // If "versatile" is overpowered, reduce its score by 15-25%
    const averageScore = (calculatedScores.optimizer + calculatedScores.diplomate + calculatedScores.mentor) / 3;
    if (calculatedScores.versatile > (averageScore * 1.2)) {
      calculatedScores.versatile *= 0.8; // Reduce by 20%
    }
    
    onComplete(calculatedScores);
  };
  
  // Filter available cards by category
  const filteredAvailableCards = activeCategory === 'all' 
    ? availableCards
    : availableCards.filter(card => card.category === activeCategory);
  
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
      <Text style={styles.title}>{t('fitness_type_title')}</Text>
      <Text style={styles.subtitle}>{t('fitness_type_subtitle_new')}</Text>
      
      {/* Category filter buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeCategory === 'all' && styles.activeFilterButton
          ]}
          onPress={() => setActiveCategory('all')}
        >
          <Text style={[
            styles.filterButtonText,
            activeCategory === 'all' && styles.activeFilterText
          ]}>
            {t('all_activities')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeCategory === 'sports' && styles.activeFilterButtonSports
          ]}
          onPress={() => setActiveCategory('sports')}
        >
          <Text style={[
            styles.filterButtonText,
            activeCategory === 'sports' && styles.activeFilterText
          ]}>
            {t('sports_activities')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeCategory === 'lifestyle' && styles.activeFilterButtonLifestyle
          ]}
          onPress={() => setActiveCategory('lifestyle')}
        >
          <Text style={[
            styles.filterButtonText,
            activeCategory === 'lifestyle' && styles.activeFilterText
          ]}>
            {t('lifestyle_activities')}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Selected cards section - only show if we have selections */}
      {selectedCards.length > 0 && (
        <View style={styles.selectedCardsContainer}>
          <Text style={styles.sectionTitle}>
            {t('your_selections')} ({selectedCards.length}/4):
          </Text>
          
          {selectedCards.map((card, index) => (
            <View key={card.id} style={styles.selectedCard}>
              <View style={styles.selectedCardRank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              
              <View style={styles.selectedCardIcon}>
                <Ionicons name={card.icon as any} size={16} color="#FFFFFF" />
              </View>
              
              <Text style={styles.selectedCardText}>{t(card.name)}</Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    index === 0 && styles.disabledButton
                  ]}
                  onPress={() => handleMoveUp(index)}
                  disabled={index === 0}
                >
                  <Ionicons 
                    name="chevron-up" 
                    size={16} 
                    color={index === 0 ? "#4B5563" : "#9CA3AF"} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    index === selectedCards.length - 1 && styles.disabledButton
                  ]}
                  onPress={() => handleMoveDown(index)}
                  disabled={index === selectedCards.length - 1}
                >
                  <Ionicons 
                    name="chevron-down" 
                    size={16} 
                    color={index === selectedCards.length - 1 ? "#4B5563" : "#9CA3AF"} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.removeButton]}
                  onPress={() => handleRemoveCard(card.id)}
                >
                  <Ionicons name="close" size={16} color="#F87171" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
      
      {/* Available cards */}
      <Text style={styles.sectionTitle}>
        {t('available_activities')}:
      </Text>
      
      <ScrollView 
        style={styles.availableCardsScrollView}
        contentContainerStyle={styles.availableCardsContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredAvailableCards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[
              styles.availableCard,
              selectedCards.length >= 4 && styles.disabledCard
            ]}
            onPress={() => handleSelectCard(card)}
            disabled={selectedCards.length >= 4}
          >
            <View style={styles.availableCardIcon}>
              <Ionicons name={card.icon as any} size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.availableCardText}>{t(card.name)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Info message */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {selectedCards.length === 0 
            ? t('please_select_activities')
            : selectedCards.length < 4
              ? t('can_select_more', { remaining: 4 - selectedCards.length })
              : t('max_selections_reached')}
        </Text>
      </View>
      
      <TouchableOpacity
        style={[
          styles.continueButton,
          selectedCards.length === 0 && styles.disabledContinueButton
        ]}
        onPress={handleContinue}
        disabled={selectedCards.length === 0}
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
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    marginHorizontal: 4,
  },
  activeFilterButton: {
    backgroundColor: '#3B82F6',
  },
  activeFilterButtonSports: {
    backgroundColor: '#10B981',
  },
  activeFilterButtonLifestyle: {
    backgroundColor: '#8B5CF6',
  },
  filterButtonText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  selectedCardsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    marginBottom: 8,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  selectedCardRank: {
    width: 24,
    alignItems: 'center',
  },
  rankText: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectedCardIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  selectedCardText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  removeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  availableCardsScrollView: {
    maxHeight: 180,
  },
  availableCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  availableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    width: '48%',
  },
  disabledCard: {
    opacity: 0.5,
  },
  availableCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  availableCardText: {
    flex: 1,
    color: 'white',
    fontSize: 12,
  },
  infoContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 12,
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 12,
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
  disabledContinueButton: {
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