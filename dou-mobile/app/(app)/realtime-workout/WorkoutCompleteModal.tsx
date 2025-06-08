import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useLanguage } from '../../../context/LanguageContext';

interface WorkoutCompleteModalProps {
  visible: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  completionPercentage: number;
  hasIncompleteExercises: boolean;
  themePalette: any;
  workoutName: string;
  workoutDuration: number;
  exercises: any[];
}

const MOOD_OPTIONS = [
  { value: 1, label: 'terrible', icon: 'sad-outline', color: '#ef4444' },
  { value: 2, label: 'bad', icon: 'thumbs-down-outline', color: '#f97316' },
  { value: 3, label: 'okay', icon: 'remove-outline', color: '#eab308' },
  { value: 4, label: 'good', icon: 'thumbs-up-outline', color: '#22c55e' },
  { value: 5, label: 'great', icon: 'happy-outline', color: '#10b981' }
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'easy', color: '#10b981' },
  { value: 'moderate', label: 'moderate', color: '#f59e0b' },
  { value: 'hard', label: 'hard', color: '#ef4444' }
];

const WorkoutCompleteModal: React.FC<WorkoutCompleteModalProps> = ({
  visible,
  onSubmit,
  onCancel,
  completionPercentage,
  hasIncompleteExercises,
  themePalette,
  workoutName,
  workoutDuration,
  exercises
}) => {
  const { t } = useLanguage();
  const [mood, setMood] = useState(3);
  const [difficulty, setDifficulty] = useState('moderate');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  
  // Social sharing states
  const [shareToSocial, setShareToSocial] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation for social section
  const socialSectionHeight = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (shareToSocial && !postContent) {
      const defaultContent = generateDefaultPostContent();
      setPostContent(defaultContent);
    }
    
    Animated.timing(socialSectionHeight, {
      toValue: shareToSocial ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [shareToSocial]);

  const generateDefaultPostContent = () => {
    const duration = Math.floor(workoutDuration / 60);
    const completedSets = exercises.reduce((acc, ex) => 
      acc + ex.sets.filter((set: any) => set.completed).length, 0
    );
    
    return `Just finished "${workoutName}"! 💪\n\n`;
  };

  const handleSubmit = () => {
    if (hasIncompleteExercises) {
      Alert.alert(
        t('incomplete_workout'),
        t('incomplete_workout_confirm'),
        [
          { text: t('cancel'), style: 'cancel' },
          { 
            text: t('submit_anyway'), 
            onPress: () => submitWorkout() 
          }
        ]
      );
    } else {
      submitWorkout();
    }
  };

  const submitWorkout = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const formattedTags = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const workoutData = {
        mood_rating: mood,
        difficulty_level: difficulty,
        notes,
        tags: formattedTags,
        will_share_to_social: shareToSocial,
        post_content: shareToSocial ? postContent : null
      };

      // Submit workout - the handlers will now handle post creation internally
      await onSubmit(workoutData);
    } catch (error) {
      console.error('Error submitting workout:', error);
      Alert.alert(
        t('error'),
        t('error_saving_workout_log'),
        [{ text: t('ok') }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <BlurView intensity={30} tint="dark" style={styles.blurView} />
            
            <View style={[styles.modalContent, { backgroundColor: themePalette.card_background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themePalette.text }]}>
                  {t('workout_complete')}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onCancel}
                  disabled={isSubmitting}
                >
                  <Ionicons name="close" size={24} color={themePalette.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.modalBody} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Workout Summary */}
                <View style={[styles.summaryCard, { backgroundColor: `${themePalette.success}10` }]}>
                  <View style={styles.summaryHeader}>
                    <Ionicons name="trophy-outline" size={24} color={themePalette.success} />
                    <Text style={[styles.summaryTitle, { color: themePalette.success }]}>
                      {t('workout_summary')}
                    </Text>
                  </View>
                  
                  <View style={styles.summaryStats}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: themePalette.text }]}>
                        {formatDuration(workoutDuration)}
                      </Text>
                      <Text style={[styles.statLabel, { color: themePalette.text_secondary }]}>
                        {t('duration')}
                      </Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: themePalette.text }]}>
                        {exercises.length}
                      </Text>
                      <Text style={[styles.statLabel, { color: themePalette.text_secondary }]}>
                        {t('exercises')}
                      </Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: themePalette.text }]}>
                        {exercises.reduce((acc, ex) => acc + ex.sets.filter((set: any) => set.completed).length, 0)}
                      </Text>
                      <Text style={[styles.statLabel, { color: themePalette.text_secondary }]}>
                        {t('sets')}
                      </Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: themePalette.text }]}>
                        {completionPercentage}%
                      </Text>
                      <Text style={[styles.statLabel, { color: themePalette.text_secondary }]}>
                        {t('complete')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Share to Social Toggle */}
                <View style={[styles.shareSection, { borderColor: themePalette.border }]}>
                  <View style={styles.shareToggleContainer}>
                    <View style={styles.shareToggleLabel}>
                      <Ionicons name="share-social-outline" size={20} color={themePalette.text} />
                      <Text style={[styles.shareToggleText, { color: themePalette.text }]}>
                        {t('share_workout')}
                      </Text>
                    </View>
                    <Switch
                      value={shareToSocial}
                      onValueChange={setShareToSocial}
                      disabled={isSubmitting}
                      trackColor={{ 
                        false: themePalette.text_tertiary, 
                        true: `${themePalette.success}60` 
                      }}
                      thumbColor={shareToSocial ? themePalette.success : themePalette.text_secondary}
                    />
                  </View>
                  
                  {/* Social Post Content */}
                  <Animated.View 
                    style={[
                      styles.socialContent,
                      {
                        opacity: socialSectionHeight,
                        maxHeight: socialSectionHeight.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 200],
                        }),
                      }
                    ]}
                  >
                    <Text style={[styles.sectionLabel, { color: themePalette.text }]}>
                      {t('post_content')}
                    </Text>
                    
                    <TextInput
                      style={[
                        styles.postContentInput,
                        { 
                          color: themePalette.text,
                          backgroundColor: themePalette.input_background,
                          borderColor: themePalette.border
                        }
                      ]}
                      multiline
                      numberOfLines={4}
                      value={postContent}
                      onChangeText={setPostContent}
                      placeholder={t('write_about_workout')}
                      placeholderTextColor={themePalette.text_tertiary}
                      maxLength={500}
                      textAlignVertical="top"
                      editable={!isSubmitting}
                    />
                    
                    <Text style={[styles.characterCount, { color: themePalette.text_tertiary }]}>
                      {postContent.length}/500
                    </Text>
                  </Animated.View>
                </View>
                
                {/* Mood rating */}
                <View style={styles.sectionContainer}>
                  <Text style={[styles.sectionLabel, { color: themePalette.text }]}>
                    {t('how_was_your_workout')}
                  </Text>
                  
                  <View style={styles.moodOptions}>
                    {MOOD_OPTIONS.map(option => (
                      <TouchableOpacity
                        key={`mood-${option.value}`}
                        style={[
                          styles.moodOption,
                          mood === option.value && { 
                            backgroundColor: `${option.color}20`,
                            borderColor: option.color
                          }
                        ]}
                        onPress={() => setMood(option.value)}
                        disabled={isSubmitting}
                      >
                        <Ionicons 
                          name={option.icon} 
                          size={24} 
                          color={mood === option.value ? option.color : themePalette.text_secondary} 
                        />
                        <Text 
                          style={[
                            styles.moodLabel,
                            { color: mood === option.value ? option.color : themePalette.text_secondary }
                          ]}
                        >
                          {t(option.label)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Difficulty level */}
                <View style={styles.sectionContainer}>
                  <Text style={[styles.sectionLabel, { color: themePalette.text }]}>
                    {t('workout_difficulty')}
                  </Text>
                  
                  <View style={styles.difficultyOptions}>
                    {DIFFICULTY_OPTIONS.map(option => (
                      <TouchableOpacity
                        key={`difficulty-${option.value}`}
                        style={[
                          styles.difficultyOption,
                          difficulty === option.value 
                            ? { backgroundColor: option.color } 
                            : { borderColor: themePalette.border, backgroundColor: 'transparent' }
                        ]}
                        onPress={() => setDifficulty(option.value)}
                        disabled={isSubmitting}
                      >
                        <Text 
                          style={[
                            styles.difficultyLabel,
                            difficulty === option.value 
                              ? { color: '#FFFFFF' }
                              : { color: themePalette.text }
                          ]}
                        >
                          {t(option.label)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Notes */}
                <View style={styles.sectionContainer}>
                  <Text style={[styles.sectionLabel, { color: themePalette.text }]}>
                    {t('notes')} ({t('optional')})
                  </Text>
                  
                  <TextInput
                    style={[
                      styles.notesInput,
                      { 
                        color: themePalette.text,
                        backgroundColor: themePalette.input_background,
                        borderColor: themePalette.border
                      }
                    ]}
                    multiline
                    numberOfLines={3}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder={t('enter_workout_notes')}
                    placeholderTextColor={themePalette.text_tertiary}
                    textAlignVertical="top"
                    editable={!isSubmitting}
                  />
                </View>
                
                {/* Tags */}
                <View style={styles.sectionContainer}>
                  <Text style={[styles.sectionLabel, { color: themePalette.text }]}>
                    {t('tags')} ({t('optional')})
                  </Text>
                  
                  <TextInput
                    style={[
                      styles.tagsInput,
                      { 
                        color: themePalette.text,
                        backgroundColor: themePalette.input_background,
                        borderColor: themePalette.border
                      }
                    ]}
                    value={tags}
                    onChangeText={setTags}
                    placeholder={t('enter_tags_example')}
                    placeholderTextColor={themePalette.text_tertiary}
                    editable={!isSubmitting}
                  />
                </View>

                {/* Bottom padding for keyboard */}
                <View style={styles.bottomPadding} />
              </ScrollView>
              
              <View style={[styles.modalFooter, { borderTopColor: themePalette.border }]}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton, 
                    { 
                      borderColor: themePalette.border,
                      opacity: isSubmitting ? 0.6 : 1
                    }
                  ]}
                  onPress={onCancel}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.cancelButtonText, { color: themePalette.text }]}>
                    {t('cancel')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.submitButton, 
                    { 
                      backgroundColor: themePalette.success,
                      opacity: isSubmitting ? 0.6 : 1
                    }
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <View style={styles.submitButtonContent}>
                      <Text style={styles.submitButtonText}>
                        {shareToSocial ? t('saving_and_sharing') : t('saving')}...
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.submitButtonContent}>
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" style={styles.submitButtonIcon} />
                      <Text style={styles.submitButtonText}>
                        {shareToSocial ? t('save_and_share') : t('save_workout')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  shareSection: {
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  shareToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  shareToggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareToggleText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  socialContent: {
    overflow: 'hidden',
  },
  postContentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 100,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodOption: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    width: '18%',
  },
  moodLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  difficultyOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  difficultyLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 80,
  },
  tagsInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 50,
  },
  bottomPadding: {
    height: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonIcon: {
    marginRight: 6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default WorkoutCompleteModal;