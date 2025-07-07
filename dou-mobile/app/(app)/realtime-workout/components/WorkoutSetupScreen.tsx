// components/WorkoutSetupScreen.tsx - Enhanced workout setup interface
import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { createThemedStyles } from '../../../../utils/createThemedStyles';
import GymSelector from '../../../../components/workouts/GymSelector';
import TemplateSelectionBottomSheet from '../../../../components/workouts/TemplateSelectionBottomSheet';
import WorkoutCard from '../../../../components/workouts/WorkoutCard';

interface WorkoutSetupScreenProps {
  handlers: any;
  workoutManager: any;
  onBack: () => void;
}

const WorkoutSetupScreen: React.FC<WorkoutSetupScreenProps> = ({
  handlers,
  workoutManager,
  onBack
}) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const styles = themedStyles(palette);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const {
    workoutName,
    setWorkoutName,
    selectedGym,
    selectedTemplate,
    gymModalVisible,
    templateModalVisible,
    templates,
    templatesLoading,
    currentUser
  } = workoutManager;

  const {
    handleStartWorkout,
    handleSelectTemplate,
    handleClearTemplate,
    handleOpenTemplateModal,
    handleCloseTemplateModal,
    handleSelectGym,
    handleOpenGymModal,
    handleCloseGymModal
  } = handlers;

  // Animation effect on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Generate workout name suggestions
  const workoutSuggestions = useMemo(() => {
    const workoutNames = [
    "morning_session",
    "am_workout",
    "afternoon_pump",
    "quick_midday_workout",
    "evening_workout",
    "pm_power",
    "push_day",
    "pull_day",
    "leg_day",
    "upper_body",
    "full_body",
    "arms_day",
    "shoulders_blast",
    "road_to_arnold",
    "rocky_prep",
    "chuck_norris_prep",
    "cardio_blast",
    "strength_training",
    "functional",
    "endurance",
    ]
    const shuffled = [...workoutNames].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5).map(key => t(key));
  }, []);

  const handleStartPress = () => {
    if (!workoutName.trim()) {
      Alert.alert(t('error'), t('please_enter_workout_name'));
      return;
    }
    handleStartWorkout();
  };

  const handleSuggestionPress = (suggestion: string) => {
    setWorkoutName(suggestion);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View 
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Enhanced Header with Gradient Background */}
            <View style={[styles.header, { backgroundColor: palette.page_background }]}>
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Ionicons name="arrow-back" size={24} color={palette.text} />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, { color: palette.text }]}>
                  {t('new_workout')}
                </Text>
                <Text style={[styles.headerSubtitle, { color: palette.text_secondary }]}>
                  {t('configure_your_session')}
                </Text>
              </View>
            </View>

            {/* Enhanced Template Selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="document-text" size={18} color={palette.accent} style={styles.sectionIcon} />
                  <Text style={[styles.sectionTitle, { color: palette.text }]}>
                    {t('template')}
                  </Text>
                </View>
                <View style={[styles.optionalBadge, { backgroundColor: palette.accent_light }]}>
                  <Text style={[styles.optionalText, { color: palette.accent }]}>
                    {t('optional')}
                  </Text>
                </View>
              </View>
              
              {selectedTemplate ? (
                <View style={styles.templatePreview}>
                  <WorkoutCard
                    workoutId={selectedTemplate.id}
                    workout={selectedTemplate}
                    isTemplate={true}
                    user={currentUser?.username || ''}
                    selectionMode={false}
                  />
                  <TouchableOpacity
                    style={[styles.clearTemplateButton, { backgroundColor: palette.page_background }]}
                    onPress={handleClearTemplate}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={16} color={palette.text_secondary} />
                    <Text style={[styles.clearTemplateText, { color: palette.text_secondary }]}>
                      {t('remove')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.selectionCard, { 
                    backgroundColor: palette.card_background,
                    borderColor: palette.border,
                    shadowColor: palette.shadow,
                  }]}
                  onPress={handleOpenTemplateModal}
                  activeOpacity={0.7}
                >
                  <View style={styles.selectionCardContent}>
                    <View style={[styles.iconContainer, { 
                      backgroundColor: palette.page_background 
                    }]}>
                      <Ionicons 
                        name="document-text-outline" 
                        size={18} 
                        color={palette.text_secondary}
                      />
                    </View>
                    
                    <View style={styles.selectionInfo}>
                      <Text style={[styles.placeholderText, { color: palette.text_tertiary }]}>
                        {t('select_template_optional')}
                      </Text>
                    </View>
                  </View>
                  
                  <Ionicons name="chevron-forward" size={16} color={palette.text_secondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Enhanced Workout Name with Suggestions */}
            <View style={styles.section}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="create" size={18} color={palette.accent} style={styles.sectionIcon} />
                <Text style={[styles.sectionTitle, { color: palette.text }]}>
                  {t('workout_name')}
                </Text>
              </View>
              
              <View style={[styles.inputCard, { 
                backgroundColor: palette.card_background,
                borderColor: workoutName.trim() ? palette.accent : palette.border,
                shadowColor: workoutName.trim() ? palette.accent : palette.shadow,
              }]}>
                <Ionicons 
                  name="create-outline" 
                  size={18} 
                  color={workoutName.trim() ? palette.accent : palette.text_secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.textInput, { color: palette.text }]}
                  value={workoutName}
                  onChangeText={setWorkoutName}
                  placeholder={selectedTemplate ? selectedTemplate.name : t('enter_workout_name')}
                  placeholderTextColor={palette.text_tertiary}
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                {workoutName.trim() && (
                  <TouchableOpacity
                    style={styles.clearInputButton}
                    onPress={() => setWorkoutName('')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={16} color={palette.text_secondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Workout Name Suggestions */}
              <View style={styles.suggestionsContainer}>
                <View style={styles.suggestionsRow}>
                  {workoutSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.suggestionChip, { 
                        backgroundColor: workoutName === suggestion ? palette.layout : palette.page_background,
                        borderColor: workoutName === suggestion ? palette.accent : palette.border,
                      }]}
                      onPress={() => handleSuggestionPress(suggestion)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.suggestionText, { 
                        color: workoutName === suggestion ? palette.accent : palette.text_secondary 
                      }]}>
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Enhanced Gym Selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="location" size={18} color={palette.accent} style={styles.sectionIcon} />
                  <Text style={[styles.sectionTitle, { color: palette.text }]}>
                    {t('gym_location')}
                  </Text>
                </View>
                <View style={[styles.optionalBadge, { backgroundColor: palette.layout }]}>
                  <Text style={[styles.optionalText, { color: palette.accent }]}>
                    {t('optional')}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={[styles.selectionCard, { 
                  backgroundColor: selectedGym ? palette.layout : palette.card_background,
                  borderColor: selectedGym ? palette.info : palette.border,
                  shadowColor: selectedGym ? palette.info : palette.accent,
                }]}
                onPress={handleOpenGymModal}
                activeOpacity={0.7}
              >
                <View style={styles.selectionCardContent}>
                  <View style={[styles.iconContainer, { 
                    backgroundColor: selectedGym ? palette.info : palette.background_secondary 
                  }]}>
                    <Ionicons 
                      name={selectedGym ? "fitness" : "home-outline"} 
                      size={18} 
                      color={selectedGym ? "#FFFFFF" : palette.text_secondary}
                    />
                  </View>
                  
                  <View style={styles.selectionInfo}>
                    {selectedGym ? (
                      <>
                        <Text style={[styles.selectionTitle, { color: palette.text }]}>
                          {selectedGym.name}
                        </Text>
                        <Text style={[styles.selectionSubtitle, { color: palette.text_secondary }]}>
                          {selectedGym.location}
                        </Text>
                      </>
                    ) : (
                      <Text style={[styles.placeholderText, { color: palette.text_tertiary }]}>
                        {t('select_gym_or_home')}
                      </Text>
                    )}
                  {selectedGym?.distance && (
                    <Text style={[styles.selectionDistance, { color: palette.text_tertiary }]}>
                      {selectedGym.distance.toFixed(1)} km away
                    </Text>
                  )}
                  </View>
                </View>
                
                <Ionicons name="chevron-forward" size={16} color={palette.text_secondary} />
              </TouchableOpacity>
            </View>

            {/* Enhanced Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { 
                  borderColor: palette.border,
                  backgroundColor: palette.background_secondary
                }]}
                onPress={onBack}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={palette.text} style={styles.buttonIcon} />
                <Text style={[styles.cancelButtonText, { color: palette.text }]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.startButton, { 
                  backgroundColor: workoutName.trim() ? palette.success : palette.text_tertiary,
                  opacity: workoutName.trim() ? 1 : 0.6,
                  shadowColor: workoutName.trim() ? palette.success : 'transparent',
                }]}
                onPress={handleStartPress}
                disabled={!workoutName.trim()}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.startButtonText}>{t('start_workout')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Modals */}
        <GymSelector
          isOpen={gymModalVisible}
          onClose={handleCloseGymModal}
          selectedGymId={selectedGym?.id || null}
          onGymSelected={(gym) => {
            handleSelectGym(gym);
            // onClose is handled automatically by the bottom sheet
          }}
        />
        
        <TemplateSelectionBottomSheet
          visible={templateModalVisible}
          onClose={handleCloseTemplateModal}
          onTemplateSelected={handleSelectTemplate}
          templates={templates || []}
          templatesLoading={templatesLoading}
          user={currentUser}
          themePalette={palette}
        />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const themedStyles = createThemedStyles((palette) => ({
  container: {
    flex: 1,
    backgroundColor: palette.page_background,
  },
  animatedContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginHorizontal: -20,
    marginBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    backgroundColor: palette.page_background,
    borderRadius: 20,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  optionalText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  templatePreview: {
    marginBottom: 0,
  },
  clearTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  clearTemplateText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  selectionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectionSubtitle: {
    fontSize: 13,
  },
  placeholderText: {
    fontSize: 15,
    fontWeight: '500',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionDistance: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    minHeight: 22, 
  },
  clearInputButton: {
    marginLeft: 8,
    padding: 4,
  },
  suggestionsContainer: {
    marginTop: 14,
  },
  suggestionsLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
}));

export default WorkoutSetupScreen;