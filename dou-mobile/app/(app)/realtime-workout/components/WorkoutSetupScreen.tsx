// components/WorkoutSetupScreen.tsx - Clean workout setup interface
import React from 'react';
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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { createThemedStyles } from '../../../../utils/createThemedStyles';
import GymSelectionModal from '../../../../components/workouts/GymSelectionModal';
import TemplateSelectionModal from '../../../../components/workouts/TemplateSelectionModal';

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

  const handleStartPress = () => {
    if (!workoutName.trim()) {
      Alert.alert(t('error'), t('please_enter_workout_name'));
      return;
    }
    handleStartWorkout();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
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

          {/* Template Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                {t('template')}
              </Text>
              <View style={[styles.optionalBadge, { backgroundColor: palette.accent_light }]}>
                <Text style={[styles.optionalText, { color: palette.accent }]}>
                  {t('optional')}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.selectionCard, { 
                backgroundColor: selectedTemplate ? palette.success_light : palette.card_background,
                borderColor: selectedTemplate ? palette.success : palette.border,
              }]}
              onPress={handleOpenTemplateModal}
              activeOpacity={0.7}
            >
              <View style={styles.selectionCardContent}>
                <View style={[styles.iconContainer, { 
                  backgroundColor: selectedTemplate ? palette.success : palette.background_secondary 
                }]}>
                  <Ionicons 
                    name={selectedTemplate ? "document-text" : "document-text-outline"} 
                    size={20} 
                    color={selectedTemplate ? "#FFFFFF" : palette.text_secondary}
                  />
                </View>
                
                <View style={styles.selectionInfo}>
                  {selectedTemplate ? (
                    <>
                      <Text style={[styles.selectionTitle, { color: palette.text }]}>
                        {selectedTemplate.name}
                      </Text>
                      <Text style={[styles.selectionSubtitle, { color: palette.text_secondary }]}>
                        {selectedTemplate.exercises?.length || 0} {t('exercises')}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.placeholderText, { color: palette.text_tertiary }]}>
                      {t('select_template_optional')}
                    </Text>
                  )}
                </View>
              </View>
              
              <View style={styles.selectionActions}>
                {selectedTemplate && (
                  <TouchableOpacity
                    style={[styles.clearButton, { backgroundColor: palette.background_secondary }]}
                    onPress={handleClearTemplate}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={16} color={palette.text_secondary} />
                  </TouchableOpacity>
                )}
                <Ionicons name="chevron-forward" size={18} color={palette.text_secondary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Workout Name */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {t('workout_name')}
            </Text>
            
            <View style={[styles.inputCard, { 
              backgroundColor: palette.card_background,
              borderColor: workoutName.trim() ? palette.accent : palette.border,
            }]}>
              <Ionicons 
                name="create-outline" 
                size={20} 
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
                  <Ionicons name="close-circle" size={18} color={palette.text_secondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Gym Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                {t('gym_location')}
              </Text>
              <View style={[styles.optionalBadge, { backgroundColor: palette.accent_light }]}>
                <Text style={[styles.optionalText, { color: palette.accent }]}>
                  {t('optional')}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.selectionCard, { 
                backgroundColor: selectedGym ? palette.info_light : palette.card_background,
                borderColor: selectedGym ? palette.info : palette.border,
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
                    size={20} 
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
                </View>
              </View>
              
              <Ionicons name="chevron-forward" size={18} color={palette.text_secondary} />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
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

        {/* Modals */}
        <GymSelectionModal
          visible={gymModalVisible}
          onClose={handleCloseGymModal}
          onSelectGym={handleSelectGym}
          selectedGym={selectedGym}
          themePalette={palette}
        />
        
        <TemplateSelectionModal
          visible={templateModalVisible}
          onClose={handleCloseTemplateModal}
          onTemplateSelected={handleSelectTemplate}
          templates={templates || []}
          templatesLoading={templatesLoading}
          user={currentUser}
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectionSubtitle: {
    fontSize: 14,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    minHeight: 24,
  },
  clearInputButton: {
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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