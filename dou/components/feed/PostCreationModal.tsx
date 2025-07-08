// components/feed/PostCreationModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  Image,
  ActivityIndicator,
  Animated,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles, withAlpha } from '../../utils/createThemedStyles';
import { useCreatePost } from '../../hooks/query/usePostQuery';
import { getAvatarUrl, compressImage } from '../../utils/imageUtils'; // Added compressImage import
import WorkoutLogSelector from './WorkoutLogSelector';
import ProgramSelector from './ProgramSelector';
import GroupWorkoutSelector from './GroupWorkoutSelector';
import ProgramCard from '../workouts/ProgramCard';
import WorkoutLogCard from '../workouts/WorkoutLogCard';
import GroupWorkoutCard from '../workouts/GroupWorkoutCard';

interface PostType {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface PostCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: (post: any) => void;
  initialPostType?: string;
}

const PostCreationModal: React.FC<PostCreationModalProps> = ({ 
  visible, 
  onClose, 
  onPostCreated,
  initialPostType = 'regular'
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { palette, workoutPalette, programPalette, workoutLogPalette, groupWorkoutPalette } = useTheme();
  
  // Animation references
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Steps: 0 = post type selection, 1 = content entry
  const [step, setStep] = useState(1); // Changed default to 1 to skip type selection
  const [postType, setPostType] = useState<string>(initialPostType);
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageCompressing, setImageCompressing] = useState(false); // New state for image compression
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showWorkoutLogSelector, setShowWorkoutLogSelector] = useState(false);
  const [showProgramSelector, setShowProgramSelector] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [selectedWorkoutLog, setSelectedWorkoutLog] = useState<any>(null);
  const [showGroupWorkoutSelector, setShowGroupWorkoutSelector] = useState(false);
  const [selectedGroupWorkout, setSelectedGroupWorkout] = useState<any>(null);
  
  // Use the post creation mutation hook
  const { mutateAsync: createPost, isLoading: isPosting } = useCreatePost();
  
  // Create themed styles
  const styles = themedStyles(palette);
  
  // Post type definitions with themed colors
  const postTypes: Record<string, PostType> = {
    regular: {
      id: 'regular',
      label: t('regular_post'),
      icon: 'create-outline',
      color: palette.accent
    },
    workout_log: {
      id: 'workout_log',
      label: t('share_workout'),
      icon: 'fitness-outline',
      color: workoutLogPalette.background
    },
    program: {
      id: 'program',
      label: t('share_program'),
      icon: 'barbell-outline',
      color: programPalette.background
    },
    group_workout: {
      id: 'group_workout',
      label: t('group_workout'),
      icon: 'people-outline',
      color: groupWorkoutPalette.background
    }
  };
  
  // Reset state when modal visibility changes
  useEffect(() => {
    if (visible) {
      // Always set the post type from initialPostType
      setPostType(initialPostType);
      
      // Based on the post type, show the appropriate selector
      if (initialPostType === 'workout_log') {
        setShowWorkoutLogSelector(true);
      } else if (initialPostType === 'program') {
        setShowProgramSelector(true);
      } else if (initialPostType === 'group_workout') {
        setShowGroupWorkoutSelector(true);
      } else {
        // For regular posts, go directly to content entry
        setStep(1);
      }
      
      startEntryAnimation();
    } else {
      resetForm();
    }
  }, [visible, initialPostType]);
  
  // Handle keyboard visibility events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const startEntryAnimation = () => {
    // Reset animations
    slideAnim.setValue(100);
    fadeAnim.setValue(0);
    
    // Run animations
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  const handleProgramSelect = (program: any) => {
    setSelectedProgram(program);
    setShowProgramSelector(false);
    // FIXED: Update the post type to 'program'
    setPostType('program');
    // Auto-populate content with program name
    setContent(`${t('check_out_program')}: ${program.name}`);
    setStep(1);
  };
  
  const handleWorkoutLogSelect = (workoutLog: any) => {
    setSelectedWorkoutLog(workoutLog);
    setShowWorkoutLogSelector(false);
    // FIXED: Update the post type to 'workout_log'
    setPostType('workout_log');
    // Auto-populate content
    setContent(`${t('just_completed')}: ${workoutLog.workout_name || workoutLog.name || t('a_workout')}`);
    setStep(1);
  };

  const handleGroupWorkoutSelect = (groupWorkout: any) => {
    setSelectedGroupWorkout(groupWorkout);
    setShowGroupWorkoutSelector(false);
    // Auto-populate content with group workout title
    setContent(t('join_me_for'));
    setPostType('group_workout');
    setStep(1);
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(t('permission_needed'), t('camera_roll_permission'));
      return;
    }

    try {
      // Launch image picker with high quality (we'll compress it ourselves)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1, // Use highest quality, we'll compress it
      });

      if (!result.canceled && result.assets[0]) {
        const originalImageUri = result.assets[0].uri;
        
        // Show compression loading state
        setImageCompressing(true);
        
        try {
          console.log('Starting image compression...');
          
          // Compress the image before setting it
          const compressedUri = await compressImage(originalImageUri, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.8,
            format: 'jpeg',
            maxSizeKB: 800 // 800KB limit
          });
          
          console.log('Image compression completed successfully');
          setImage(compressedUri);
          
        } catch (compressionError) {
          console.warn('Image compression failed, using original:', compressionError);
          // If compression fails, show warning but still use the original
          Alert.alert(
            t('compression_warning'), 
            t('image_compression_failed_using_original'),
            [{ text: t('ok') }]
          );
          setImage(originalImageUri);
        } finally {
          setImageCompressing(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('error'), t('failed_to_select_image'));
      setImageCompressing(false);
    }
  };
  
  const handleCreatePost = async () => {
    if (!content.trim() && !image && !selectedProgram && !selectedWorkoutLog) {
      return;
    }

    try {
      setLoading(true);

      // Create FormData for the API request
      const formData = new FormData();
      formData.append('content', content);
      formData.append('post_type', postType);

      // Add image if selected (it's already compressed at this point)
      if (image) {
        const filename = image.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri: image, // This is already the compressed image URI
          name: filename,
          type,
        } as any);
      }
      
      // Add program details if selected
      if (postType === 'program' && selectedProgram) {
        formData.append('program_id', selectedProgram.id.toString());
      }
      
      // Add workout log details if selected
      if (postType === 'workout_log' && selectedWorkoutLog) {
        formData.append('workout_log_id', selectedWorkoutLog.id.toString());
      }
      if (postType === 'group_workout' && selectedGroupWorkout) {
        formData.append('group_workout_id', selectedGroupWorkout.id.toString());
      }

      // Use the mutation to create a post
      const newPost = await createPost(formData);
      
      // Call the onPostCreated callback with the new post
      onPostCreated(newPost);
      
      // Reset form and close modal
      resetForm();
      onClose();
      
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert(t('error'), t('failed_to_create_post'));
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setContent('');
    setImage(null);
    setPostType(initialPostType);
    setSelectedProgram(null);
    setSelectedWorkoutLog(null);
    setSelectedGroupWorkout(null);
    setImageCompressing(false);
    setStep(1); // Always set to content entry
  };

  // Handle keyboard done button
  const handleTextInputSubmit = () => {
    Keyboard.dismiss();
  };
  
  const renderContentEntry = () => {
    const currentPostType = postTypes[postType];
    const avatarUrl = getAvatarUrl(user?.avatar, 40);
    
    return (
      <View style={styles.contentContainer}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.userInfo}>
            {user?.avatar ? (
              <Image 
                source={{ uri: avatarUrl }} 
                style={styles.userAvatarImage}
                defaultSource={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username?.[0] || 'U')}&size=40&background=random` }}
              />
            ) : (
              <View style={[styles.userAvatar, { backgroundColor: palette.accent }]}>
                <Text style={styles.userAvatarText}>
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <Text style={styles.username}>{user?.username}</Text>
          </View>
          
          <TextInput
            style={styles.contentInput}
            multiline
            placeholder={
              postType === 'program' && selectedProgram 
                ? t('add_program_note') 
                : postType === 'workout_log' && selectedWorkoutLog
                ? t('add_workout_note')
                : t('whats_on_your_mind')
            }
            placeholderTextColor={palette.text_tertiary}
            value={content}
            onChangeText={setContent}
            autoFocus={true}
            returnKeyType="done"
            onSubmitEditing={handleTextInputSubmit}
            blurOnSubmit={true}
          />
          
          {/* Program Preview using ProgramCard */}
          {selectedProgram && (
            <View style={styles.cardPreviewWrapper}>
              <View style={styles.cardPreviewHeader}>
                <Text style={styles.cardPreviewTitle}>{t('program_preview')}</Text>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => {
                    setSelectedProgram(null);
                    setPostType('regular');
                  }}
                >
                  <Ionicons name="close-circle" size={24} color={palette.text_secondary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => setShowProgramSelector(true)}
              >
                <ProgramCard
                  programId={selectedProgram.id}
                  program={selectedProgram}
                  inFeedMode={true}
                  currentUser={user?.username}
                  disableNavigation={true}
                />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Workout Log Preview using WorkoutLogCard */}
          {selectedWorkoutLog && (
            <View style={styles.cardPreviewWrapper}>
              <View style={styles.cardPreviewHeader}>
                <Text style={styles.cardPreviewTitle}>{t('workout_preview')}</Text>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => {
                    setSelectedWorkoutLog(null);
                    setPostType('regular');
                  }}
                >
                  <Ionicons name="close-circle" size={24} color={palette.text_secondary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => setShowWorkoutLogSelector(true)}
              >
                <WorkoutLogCard
                  logId={selectedWorkoutLog.id}
                  log={selectedWorkoutLog}
                  user={user?.username}
                  inFeedMode={true}
                  disableNavigation={true}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Group Workout Preview */}
          {selectedGroupWorkout && (
            <View style={styles.cardPreviewWrapper}>
              <View style={styles.cardPreviewHeader}>
                <Text style={styles.cardPreviewTitle}>{t('group_workout_preview')}</Text>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => {
                    setSelectedGroupWorkout(null);
                    setPostType('regular');
                  }}
                >
                  <Ionicons name="close-circle" size={24} color={palette.text_secondary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => setShowGroupWorkoutSelector(true)}
              >
                <GroupWorkoutCard
                  groupWorkoutId={selectedGroupWorkout.id}
                  groupWorkout={selectedGroupWorkout}
                  selectionMode={false}
                />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Image Compression Loading State */}
          {imageCompressing && (
            <View style={styles.imageCompressionContainer}>
              <ActivityIndicator size="small" color={palette.accent} />
              <Text style={styles.imageCompressionText}>
                {t('compressing_image')}...
              </Text>
            </View>
          )}
          
          {/* Image Preview */}
          {image && !imageCompressing && (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: image }} 
                style={styles.imagePreview} 
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => setImage(null)}
              >
                <Ionicons name="close-circle" size={24} color={palette.text} />
              </TouchableOpacity>
              {/* Show compressed indicator */}
              <View style={styles.compressedIndicator}>
                <Ionicons name="checkmark-circle" size={16} color={palette.success || '#28a745'} />
                <Text style={styles.compressedIndicatorText}>
                  {t('compressed')}
                </Text>
              </View>
            </View>
          )}
          
          {/* Add some padding at the bottom to ensure content is not hidden behind action bar */}
          <View style={styles.scrollBottomPadding} />
        </ScrollView>
        
        {/* Action Bar - Positioned at bottom, outside of ScrollView */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 160 : 20}
        >
          <View style={styles.actionBar}>
            <View style={styles.mediaButtons}>
              <TouchableOpacity 
                style={[
                  styles.mediaButton, 
                  { backgroundColor: withAlpha(palette.accent, 0.1) },
                  imageCompressing && styles.mediaButtonDisabled
                ]}
                onPress={pickImage}
                disabled={imageCompressing}
              >
                {imageCompressing ? (
                  <ActivityIndicator size="small" color={palette.accent} />
                ) : (
                  <Ionicons name="image-outline" size={24} color={palette.accent} />
                )}
              </TouchableOpacity>
              
              {postType === 'regular' && (
                <>
                  <TouchableOpacity 
                    style={[styles.mediaButton, { backgroundColor: withAlpha(programPalette.background, 0.1) }]}
                    onPress={() => setShowProgramSelector(true)}
                  >
                    <Ionicons name="barbell-outline" size={24} color={programPalette.background} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.mediaButton, { backgroundColor: withAlpha(workoutLogPalette.background, 0.1) }]}
                    onPress={() => setShowWorkoutLogSelector(true)}
                  >
                    <Ionicons name="fitness-outline" size={24} color={workoutLogPalette.background} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.mediaButton, { backgroundColor: withAlpha(groupWorkoutPalette.background, 0.1) }]}
                    onPress={() => setShowGroupWorkoutSelector(true)}
                  >
                    <Ionicons name="people-outline" size={24} color={groupWorkoutPalette.background} />
                  </TouchableOpacity>
                </>
              )}
              
              {keyboardVisible && (
                <TouchableOpacity 
                  style={[styles.mediaButton, styles.keyboardDismissButton]}
                  onPress={() => Keyboard.dismiss()}
                >
                  <Ionicons name="chevron-down" size={24} color={palette.text} />
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity
              style={[
                styles.postButton,
                ((!content.trim() && !image && !selectedProgram && !selectedWorkoutLog) || imageCompressing) && styles.postButtonDisabled
              ]}
              onPress={handleCreatePost}
              disabled={(!content.trim() && !image && !selectedProgram && !selectedWorkoutLog) || loading || isPosting || imageCompressing}
            >
              {loading || isPosting ? (
                <ActivityIndicator color={palette.page_background} size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color={palette.page_background} />
                  <Text style={styles.postButtonText}>{t('post')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  };
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {postTypes[postType]?.label || t('create_post')}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={palette.text_secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            {renderContentEntry()}
          </View>
        </View>
        
        {/* Workout Log Selector Modal */}
        {showWorkoutLogSelector && (
          <WorkoutLogSelector
            onSelect={handleWorkoutLogSelect}
            onCancel={() => setShowWorkoutLogSelector(false)}
          />
        )}
        
        {/* Program Selector Modal */}
        {showProgramSelector && (
          <ProgramSelector
            onSelect={handleProgramSelect}
            onCancel={() => setShowProgramSelector(false)}
            title={t('select_program_to_share')}
            cancelText={t('cancel')}
          />
        )}
        {showGroupWorkoutSelector && (
          <GroupWorkoutSelector
            onSelect={handleGroupWorkoutSelect}
            onCancel={() => setShowGroupWorkoutSelector(false)}
          />
        )}
      </View>
    </Modal>
  );
};

// Themed styles using createThemedStyles pattern
const themedStyles = createThemedStyles((palette) => ({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    backgroundColor: palette.page_background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(palette.border, 0.3),
    backgroundColor: palette.layout,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.text,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalBody: {
    flex: 1,
  },
  postTypeContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  postTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(palette.border, 0.3),
  },
  postTypeHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  postTypeHeaderText: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.text,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  scrollBottomPadding: {
    height: 20, // Add padding so content is not hidden behind action bar
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userAvatarText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '600',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
  },
  contentInput: {
    backgroundColor: palette.input_background,
    borderRadius: 12,
    padding: 16,
    color: palette.text,
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: withAlpha(palette.border, 0.3),
  },
  cardPreviewWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: palette.card_background,
    borderWidth: 1,
    borderColor: withAlpha(palette.border, 0.3),
  },
  cardPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: withAlpha(palette.layout, 0.5),
  },
  cardPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.text,
  },
  removeButton: {
    padding: 4,
  },
  imageCompressionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: withAlpha(palette.accent, 0.1),
    borderRadius: 12,
    marginBottom: 16,
  },
  imageCompressionText: {
    marginLeft: 8,
    fontSize: 14,
    color: palette.text_secondary,
    fontStyle: 'italic',
  },
  imagePreviewContainer: {
    marginBottom: 16,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: withAlpha(palette.page_background, 0.8),
    borderRadius: 16,
    padding: 4,
  },
  compressedIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(palette.page_background, 0.9),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compressedIndicatorText: {
    marginLeft: 4,
    fontSize: 12,
    color: palette.success || '#28a745',
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: withAlpha(palette.border, 0.3),
    backgroundColor: palette.page_background,
  },
  mediaButtons: {
    flexDirection: 'row',
  },
  mediaButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: withAlpha(palette.border, 0.2),
  },
  mediaButtonDisabled: {
    opacity: 0.5,
  },
  keyboardDismissButton: {
    backgroundColor: withAlpha(palette.text_secondary, 0.1),
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: palette.page_background,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
}));

export default PostCreationModal;