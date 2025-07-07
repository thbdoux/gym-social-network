// components/wizard/steps/Step4ScenarioResponse.tsx - Simplified clean version
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';
import { imageManager, useImagePreloading } from '../../../utils/imageManager';

type ScoreType = {
  optimizer: number;
  diplomate: number;
  mentor: number;
  versatile: number;
};

type ScenarioResponseType = {
  id: string;
  name: string;
  description: string;
  icon: string;
  score: ScoreType;
};

interface Step4ScenarioResponseProps {
  onComplete: (data: ScoreType & { responses: any }) => void;
  initialScores?: ScoreType;
}

// Register the scenario image
imageManager.registerLocalImage('scenarios', 'gym_confusion', require('../../../assets/images/wizard_scenario.png'));

const Step4ScenarioResponse: React.FC<Step4ScenarioResponseProps> = ({ onComplete, initialScores }) => {
  const { t } = useLanguage();
  const [selectedResponse, setSelectedResponse] = useState<number | null>(null);
  const [animationStage, setAnimationStage] = useState(0);
  const [showScenario, setShowScenario] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Preload the scenario images
  const { isLoaded } = useImagePreloading(['scenarios', 'icons']);
  
  // Original 4 responses - removed the creative one
  const scenarioResponses: ScenarioResponseType[] = [
    {
      id: 'ignore',
      name: 'scenario_response_ignore',
      description: 'scenario_response_ignore_desc',
      icon: 'barbell',
      score: { optimizer: 2, diplomate: 0, mentor: 0, versatile: 1 }
    },
    {
      id: 'standby',
      name: 'scenario_response_standby',
      description: 'scenario_response_standby_desc',
      icon: 'eye',
      score: { optimizer: 1, diplomate: 2, mentor: 2, versatile: 2 }
    },
    {
      id: 'encourage',
      name: 'scenario_response_encourage',
      description: 'scenario_response_encourage_desc',
      icon: 'megaphone',
      score: { optimizer: 0, diplomate: 3, mentor: 1, versatile: 1 }
    },
    {
      id: 'explain',
      name: 'scenario_response_explain',
      description: 'scenario_response_explain_desc',
      icon: 'school',
      score: { optimizer: 1, diplomate: 1, mentor: 3, versatile: 0 }
    }
  ];
  
  // Initial animation sequence
  useEffect(() => {
    // Fade in the component
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad)
    }).start();
    
    // Start the scenario animation sequence
    const timer1 = setTimeout(() => setAnimationStage(1), 800);
    const timer2 = setTimeout(() => setAnimationStage(2), 1600);
    const timer3 = setTimeout(() => setAnimationStage(3), 2400);
    const timer4 = setTimeout(() => {
      setAnimationStage(4);
      setShowScenario(true);
    }, 3200);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);
  
  // Animation for scenario visualization
  useEffect(() => {
    let targetScale = 0.9;
    
    switch (animationStage) {
      case 1:
        targetScale = 1.1;
        break;
      case 2:
        targetScale = 1.05;
        break;
      case 3:
        targetScale = 1.05;
        break;
      case 4:
        targetScale = 1;
        break;
      default:
        targetScale = 0.9;
    }
    
    Animated.timing(scaleAnim, {
      toValue: targetScale,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad)
    }).start();
  }, [animationStage, scaleAnim]);
  
  const handleSelect = (index: number) => {
    setSelectedResponse(index);
  };
  
  const handleContinue = () => {
    if (selectedResponse !== null) {
      const response = scenarioResponses[selectedResponse];
      
      // Store user responses (simplified)
      const responses = {
        selected_response: response.id,
      };
      
      onComplete({ ...response.score, responses });
    }
  };
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim }
      ]}
    >
      <Text style={styles.title}>{t('scenario_title')}</Text>
      <Text style={styles.subtitle}>{t('scenario_subtitle')}</Text>
      
      {/* Scenario illustration */}
      <Animated.View 
        style={[
          styles.scenarioBox,
          {
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Animated.View style={[
          styles.scenarioImageContainer,
          { opacity: animationStage >= 1 ? 1 : 0 }
        ]}>
          <Image 
            source={imageManager.getLocalImage('scenarios', 'gym_confusion')} 
            style={styles.scenarioImage}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>
      
      {/* Scenario description */}
      {showScenario && (
        <View style={styles.scenarioDescription}>
          <Text style={styles.scenarioText}>
            {t('scenario_description_short')}
          </Text>
        </View>
      )}
      
      {/* Response options */}
      {showScenario && (
        <View style={styles.responsesContainer}>
          {scenarioResponses.map((response, index) => {
            const isSelected = selectedResponse === index;
            
            return (
              <TouchableOpacity
                key={response.id}
                style={[
                  styles.responseOption,
                  isSelected && styles.selectedResponseOption
                ]}
                onPress={() => handleSelect(index)}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <View style={styles.selectedIndicator} />
                )}
                
                <View style={styles.responseIconContainer}>
                  <Ionicons 
                    name={response.icon as any} 
                    size={20} 
                    color={isSelected ? "#3B82F6" : "#9CA3AF"} 
                  />
                </View>
                
                <View style={styles.responseTextContainer}>
                  <Text style={[
                    styles.responseTitle,
                    isSelected && styles.selectedResponseTitle
                  ]}>
                    {t(response.name)}
                  </Text>
                  <Text style={[
                    styles.responseDescription,
                    isSelected && styles.selectedResponseDescription
                  ]}>
                    {t(response.description)}
                  </Text>
                </View>
                
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      
      <TouchableOpacity
        style={[
          styles.continueButton,
          selectedResponse === null && styles.disabledButton
        ]}
        onPress={handleContinue}
        disabled={selectedResponse === null}
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
  scenarioBox: {
    height: 200,
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  scenarioImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  scenarioImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  scenarioDescription: {
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },
  scenarioText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
  responsesContainer: {
    marginBottom: 16,
    flex: 1,
  },
  responseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedResponseOption: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    transform: [{ scale: 1.01 }],
  },
  selectedIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#3B82F6',
  },
  responseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  responseTextContainer: {
    flex: 1,
  },
  responseTitle: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  selectedResponseTitle: {
    color: 'white',
  },
  responseDescription: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  selectedResponseDescription: {
    color: '#D1D5DB',
  },
  checkmark: {
    marginLeft: 8,
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
export default Step4ScenarioResponse;