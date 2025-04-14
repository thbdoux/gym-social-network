// components/wizard/steps/Step6IdentityReveal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../../context/LanguageContext';

type ScoreType = {
  optimizer: number;
  diplomate: number;
  mentor: number;
  versatile: number;
};

type UserProfileType = {
  gender: string | null;
  [key: string]: any;
};

type WorkoutType = {
  name: string;
  icon: string;
  level: number;
};

type PersonalityProfileType = {
  icon: string;
  secondaryIcon: string;
  title: string;
  subtitle: string;
  description: string;
  heroGradient: string[];
  textColor: string;
  traits: string[];
  compatibleWorkouts: WorkoutType[];
  celebMatches: string[];
};

interface Step6IdentityRevealProps {
  personalityType: string;
  userProfile: UserProfileType;
  onComplete: (data: ScoreType) => void;
  isSubmitting: boolean;
}

const Step6IdentityReveal: React.FC<Step6IdentityRevealProps> = ({ 
  personalityType, 
  userProfile, 
  onComplete, 
  isSubmitting 
}) => {
  const { t } = useLanguage();
  const [stage, setStage] = useState<'initializing' | 'countdown' | 'revealing' | 'complete'>('initializing');
  const [revealCounter, setRevealCounter] = useState(3);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [animatedSection, setAnimatedSection] = useState<'hero' | 'traits' | 'workouts' | 'celebs'>('hero');
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const counterAnim = useState(new Animated.Value(1))[0];
  
  // Personality profiles with details
  const personalityProfiles: {[key: string]: PersonalityProfileType} = {
    optimizer: {
      icon: 'trending-up',
      secondaryIcon: 'medal',
      title: 'the_metric_master',
      subtitle: 'optimizer_subtitle',
      description: 'optimizer_description',
      heroGradient: ['rgba(37, 99, 235, 0.2)', 'rgba(6, 182, 212, 0.1)', 'rgba(30, 58, 138, 0.2)'],
      textColor: '#3B82F6',
      traits: [
        'optimizer_trait_1',
        'optimizer_trait_2',
        'optimizer_trait_3'
      ],
      compatibleWorkouts: [
        { name: 'HIIT', icon: 'flash', level: 3 },
        { name: 'Strength Training', icon: 'barbell', level: 3 },
        { name: 'Running', icon: 'trending-up', level: 2 },
      ],
      celebMatches: [
        'David Goggins',
        'Chris Bumstead',
        'Tia-Clair Toomey'
      ]
    },
    diplomate: {
      icon: 'heart',
      secondaryIcon: 'people',
      title: 'the_social_butterfly',
      subtitle: 'diplomate_subtitle',
      description: 'diplomate_description',
      heroGradient: ['rgba(219, 39, 119, 0.2)', 'rgba(139, 92, 246, 0.1)', 'rgba(157, 23, 77, 0.2)'],
      textColor: '#EC4899',
      traits: [
        'diplomate_trait_1',
        'diplomate_trait_2',
        'diplomate_trait_3'
      ],
      compatibleWorkouts: [
        { name: 'Group Fitness', icon: 'people', level: 3 },
        { name: 'Dance', icon: 'musical-notes', level: 3 },
        { name: 'Team Sports', icon: 'trophy', level: 3 },
      ],
      celebMatches: [
        'Richard Simmons',
        'Peloton Instructors',
        'Zumba Enthusiasts'
      ]
    },
    mentor: {
      icon: 'people',
      secondaryIcon: 'trophy',
      title: 'the_mentor',
      subtitle: 'mentor_subtitle',
      description: 'mentor_description',
      heroGradient: ['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)', 'rgba(6, 78, 59, 0.2)'],
      textColor: '#10B981',
      traits: [
        'mentor_trait_1',
        'mentor_trait_2',
        'mentor_trait_3'
      ],
      compatibleWorkouts: [
        { name: 'Personal Training', icon: 'people', level: 3 },
        { name: 'Group Coaching', icon: 'trophy', level: 3 },
        { name: 'Partner Workouts', icon: 'heart', level: 2 },
      ],
      celebMatches: [
        'Jillian Michaels',
        'Tony Horton',
        'Kayla Itsines'
      ]
    },
    versatile: {
      icon: 'sparkles',
      secondaryIcon: 'flash',
      title: 'the_explorer',
      subtitle: 'versatile_subtitle',
      description: 'versatile_description',
      heroGradient: ['rgba(245, 158, 11, 0.2)', 'rgba(249, 115, 22, 0.1)', 'rgba(146, 64, 14, 0.2)'],
      textColor: '#F59E0B',
      traits: [
        'versatile_trait_1',
        'versatile_trait_2',
        'versatile_trait_3'
      ],
      compatibleWorkouts: [
        { name: 'CrossFit', icon: 'sparkles', level: 3 },
        { name: 'Adventure Sports', icon: 'flash', level: 3 },
        { name: 'Obstacle Courses', icon: 'trophy', level: 3 },
      ],
      celebMatches: [
        'Zac Efron',
        'Bear Grylls',
        'Alex Honnold'
      ]
    }
  };
  
  // Configure animation sequence
  useEffect(() => {
    if (personalityType) {
      // Fade in the component
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad)
      }).start();
      
      // Start the reveal sequence after initial load
      const initTimer = setTimeout(() => {
        setStage('countdown');
      }, 1000);
      
      return () => clearTimeout(initTimer);
    }
  }, [personalityType, fadeAnim]);
  
  // Handle countdown animation
  useEffect(() => {
    if (stage === 'countdown' && revealCounter > 0) {
      // Animate counter
      Animated.sequence([
        Animated.timing(counterAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad)
        }),
        Animated.timing(counterAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad)
        })
      ]).start();
      
      const countdownTimer = setTimeout(() => {
        setRevealCounter(prevCount => prevCount - 1);
      }, 800);
      
      return () => clearTimeout(countdownTimer);
    } else if (stage === 'countdown' && revealCounter === 0) {
      const revealTimer = setTimeout(() => {
        setStage('revealing');
      }, 500);
      
      return () => clearTimeout(revealTimer);
    }
  }, [stage, revealCounter, counterAnim]);
  
  // Handle reveal animations
  useEffect(() => {
    if (stage === 'revealing') {
      // Animate scale
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }).start();
      
      const sequence = [
        { section: 'hero', delay: 0 },
        { section: 'traits', delay: 1200 },
        { section: 'workouts', delay: 2200 },
        { section: 'celebs', delay: 3200 },
      ];
      
      // Sequential animation of sections
      sequence.forEach(item => {
        setTimeout(() => {
          setAnimatedSection(item.section as any);
        }, item.delay);
      });
      
      // Mark animation as complete
      setTimeout(() => {
        setAnimationFinished(true);
        setStage('complete');
      }, 4000);
    }
  }, [stage, scaleAnim]);
  
  // Get the current personality profile
  const profile = personalityProfiles[personalityType] || personalityProfiles.versatile;
  
  // Helper function to render workout compatibility
  const renderCompat = (level: number) => {
    return (
      <View style={styles.compatibilityDots}>
        {[...Array(3)].map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.compatDot,
              i < level ? styles.activeDot : styles.inactiveDot,
              i < level && personalityType === 'optimizer' && styles.activeDotOptimizer,
              i < level && personalityType === 'diplomate' && styles.activeDotDiplomate,
              i < level && personalityType === 'mentor' && styles.activeDotMentor,
              i < level && personalityType === 'versatile' && styles.activeDotVersatile
            ]} 
          />
        ))}
      </View>
    );
  };
  
  // Render loading and countdown animations
  if (stage === 'initializing' || stage === 'countdown') {
    return (
      <Animated.View 
        style={[
          styles.container,
          { opacity: fadeAnim }
        ]}
      >
        {stage === 'initializing' ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingIconContainer}>
              <Animated.View style={styles.loadingSpinner} />
            </View>
            <Text style={styles.loadingTitle}>{t('analyzing_profile')}</Text>
            <Text style={styles.loadingSubtitle}>{t('fitness_identity')}</Text>
          </View>
        ) : (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownTitle}>{t('fitness_identity')}</Text>
            <Animated.View 
              style={[
                styles.countdownCircle,
                { transform: [{ scale: counterAnim }] }
              ]}
            >
              <Text style={styles.countdownNumber}>{revealCounter}</Text>
            </Animated.View>
          </View>
        )}
      </Animated.View>
    );
  }
  
  // Main content with animated reveal
  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim }
      ]}
    >
      <Text style={styles.title}>{t('fitness_identity')}</Text>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero section */}
        <Animated.View 
          style={[
            styles.heroSection,
            { 
              opacity: animatedSection === 'hero' || animatedSection === 'traits' || 
                      animatedSection === 'workouts' || animatedSection === 'celebs' ? 1 : 0,
              transform: [
                { 
                  translateY: animatedSection === 'hero' || animatedSection === 'traits' || 
                             animatedSection === 'workouts' || animatedSection === 'celebs' ? 0 : 20 
                },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <LinearGradient
            colors={profile.heroGradient}
            style={styles.gradientBackground}
          />
          
          <View style={styles.profileHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name={profile.icon as any} size={32} color="white" />
              <View style={styles.secondaryIconContainer}>
                <Ionicons name={profile.secondaryIcon as any} size={16} color="white" />
              </View>
            </View>
            
            <View style={styles.profileTitleContainer}>
              <Text style={[styles.profileTitle, { color: profile.textColor }]}>
                {t(profile.title)}
              </Text>
              <Text style={styles.profileSubtitle}>
                {t(profile.subtitle)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.profileDescription}>
            {t(profile.description)}
          </Text>
        </Animated.View>
        
        {/* Traits section */}
        <Animated.View 
          style={[
            styles.traitsSection,
            { 
              opacity: animatedSection === 'traits' || animatedSection === 'workouts' || 
                      animatedSection === 'celebs' ? 1 : 0,
              transform: [
                { 
                  translateY: animatedSection === 'traits' || animatedSection === 'workouts' || 
                             animatedSection === 'celebs' ? 0 : 20 
                }
              ]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle" size={16} color={profile.textColor} />
            <Text style={styles.sectionTitle}>{t('key_traits')}</Text>
          </View>
          
          {profile.traits.map((trait, index) => (
            <View key={index} style={styles.traitItem}>
              <View style={[styles.traitBullet, { backgroundColor: `${profile.textColor}30` }]}>
                <Ionicons name="checkmark" size={10} color={profile.textColor} />
              </View>
              <Text style={styles.traitText}>{t(trait)}</Text>
            </View>
          ))}
        </Animated.View>
        
        {/* Compatible workouts & Celeb matches in a row */}
        <View style={styles.twoColumnsContainer}>
          {/* Compatible workouts */}
          <Animated.View 
            style={[
              styles.columnSection,
              { 
                opacity: animatedSection === 'workouts' || animatedSection === 'celebs' ? 1 : 0,
                transform: [
                  { 
                    translateY: animatedSection === 'workouts' || animatedSection === 'celebs' ? 0 : 20 
                  }
                ]
              }
            ]}
          >
            <Text style={styles.columnTitle}>{t('workout_compatibility')}</Text>
            
            {profile.compatibleWorkouts.map((workout, index) => (
              <View key={index} style={styles.compatItem}>
                <View style={styles.compatItemHeader}>
                  <View style={[styles.compatIcon, { backgroundColor: `${profile.textColor}30` }]}>
                    <Ionicons name={workout.icon as any} size={12} color={profile.textColor} />
                  </View>
                  <Text style={styles.compatName}>{workout.name}</Text>
                </View>
                {renderCompat(workout.level)}
              </View>
            ))}
          </Animated.View>
          
          {/* Celebrity matches */}
          <Animated.View 
            style={[
              styles.columnSection,
              { 
                opacity: animatedSection === 'celebs' ? 1 : 0,
                transform: [{ translateY: animatedSection === 'celebs' ? 0 : 20 }]
              }
            ]}
          >
            <Text style={styles.columnTitle}>{t('celebrity_matches')}</Text>
            
            {profile.celebMatches.map((celeb, index) => (
              <View key={index} style={styles.celebItem}>
                <View style={[styles.celebBullet, { backgroundColor: profile.textColor }]} />
                <Text style={styles.celebName}>{celeb}</Text>
              </View>
            ))}
          </Animated.View>
        </View>
        
        {/* Motivational message based on user's gender */}
        {animationFinished && (
          <View style={[styles.motivationalMessage, { opacity: animationFinished ? 1 : 0 }]}>
            <Text style={styles.motivationalText}>
              {userProfile.gender === 'female' 
                ? "Ready to shine! Let your fitness journey empower you to discover new strengths and connect with an amazing community." 
                : "Time to crush your goals! Your fitness journey is about to take off with a community that matches your energy."}
            </Text>
          </View>
        )}
      </ScrollView>
      
      <TouchableOpacity
        style={[
          styles.continueButton,
          !animationFinished && styles.disabledButton,
          personalityType === 'optimizer' && styles.optimizerButton,
          personalityType === 'diplomate' && styles.diplomateButton,
          personalityType === 'mentor' && styles.mentorButton,
          personalityType === 'versatile' && styles.versatileButton
        ]}
        onPress={() => onComplete({ optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 })}
        disabled={!animationFinished || isSubmitting}
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <View style={styles.loadingButtonContent}>
            <View style={styles.smallSpinner} />
            <Text style={styles.continueButtonText}>{t('saving_results')}</Text>
          </View>
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.continueButtonText}>{t('continue_to_register')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#3B82F6',
    borderTopColor: 'transparent',
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  countdownContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 24,
  },
  countdownCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  heroSection: {
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  secondaryIconContainer: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTitleContainer: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  profileSubtitle: {
    fontSize: 12,
    color: 'white',
  },
  profileDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  traitsSection: {
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  traitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  traitBullet: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  traitText: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  twoColumnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  columnSection: {
    width: '48%',
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },
  columnTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  compatItem: {
    marginBottom: 8,
  },
  compatItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  compatIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  compatName: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  compatibilityDots: {
    flexDirection: 'row',
  },
  compatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 2,
  },
  activeDot: {
    backgroundColor: '#3B82F6',
  },
  activeDotOptimizer: {
    backgroundColor: '#3B82F6',
  },
  activeDotDiplomate: {
    backgroundColor: '#EC4899',
  },
  activeDotMentor: {
    backgroundColor: '#10B981',
  },
  activeDotVersatile: {
    backgroundColor: '#F59E0B',
  },
  inactiveDot: {
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
  },
  celebItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  celebBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  celebName: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  motivationalMessage: {
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    marginBottom: 16,
  },
  motivationalText: {
    fontSize: 13,
    color: '#D1D5DB',
    fontStyle: 'italic',
    textAlign: 'center',
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
  optimizerButton: {
    backgroundColor: '#3B82F6',
  },
  diplomateButton: {
    backgroundColor: '#EC4899',
  },
  mentorButton: {
    backgroundColor: '#10B981',
  },
  versatileButton: {
    backgroundColor: '#F59E0B',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallSpinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
    borderTopColor: 'transparent',
    marginRight: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
});

export default Step6IdentityReveal;