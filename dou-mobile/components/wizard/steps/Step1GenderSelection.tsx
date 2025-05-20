// components/wizard/steps/Step1GenderSelection.tsx
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
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../../context/LanguageContext';

interface Step1GenderSelectionProps {
  onComplete: (data: { gender: string, optimizer: number, diplomate: number, mentor: number, versatile: number }) => void;
  initialData?: { gender: string | null };
}

const Step1GenderSelection: React.FC<Step1GenderSelectionProps> = ({ onComplete, initialData }) => {
  const { t } = useLanguage();
  const [selectedGender, setSelectedGender] = useState<string | null>(initialData?.gender || null);
  const [animation] = useState(new Animated.Value(0));
  
  // Animation when component mounts
  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad)
    }).start();
  }, []);
  
  const handleSelect = (gender: string) => {
    setSelectedGender(gender);
  };
  
  const handleContinue = () => {
    if (selectedGender) {
      // Gender doesn't affect personality score directly, but we pass it along
      onComplete({ 
        gender: selectedGender,
        optimizer: 0,
        diplomate: 0,
        mentor: 0,
        versatile: 0 
      });
    }
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
      <Text style={styles.title}>{t('gender_title')}</Text>
      
      <View style={styles.optionsContainer}>
        {/* Male option */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            selectedGender === 'male' && styles.selectedCard
          ]}
          onPress={() => handleSelect('male')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(37, 99, 235, 0.1)', 'rgba(17, 24, 39, 0.5)']}
            style={styles.gradientBackground}
          />
          
          <View style={styles.iconContainer}>
            <Ionicons name="man" size={64} color="rgba(219, 234, 254, 0.7)" />
          </View>
          
          <Text style={styles.optionLabel}>{t('gender_male')}</Text>
          
          {selectedGender === 'male' && (
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
        
        {/* Female option */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            selectedGender === 'female' && styles.selectedCardFemale
          ]}
          onPress={() => handleSelect('female')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(219, 39, 119, 0.1)', 'rgba(17, 24, 39, 0.5)']}
            style={styles.gradientBackground}
          />
          
          <View style={styles.iconContainer}>
            <Ionicons name="woman" size={64} color="rgba(251, 207, 232, 0.7)" />
          </View>
          
          <Text style={styles.optionLabel}>{t('gender_female')}</Text>
          
          {selectedGender === 'female' && (
            <View style={[styles.checkmarkContainer, styles.femaleCheckmark]}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={[
          styles.continueButton,
          !selectedGender && styles.disabledButton
        ]}
        onPress={handleContinue}
        disabled={!selectedGender}
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
    marginBottom: 32,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  optionCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    transform: [{scale: 1.03}],
  },
  selectedCardFemale: {
    borderColor: '#EC4899',
    borderWidth: 2,
    transform: [{scale: 1.03}],
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  femaleCheckmark: {
    backgroundColor: '#EC4899',
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

export default Step1GenderSelection;