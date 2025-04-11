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
import { useCreatePost } from '../../hooks/query/usePostQuery';
import WorkoutLogSelector from './WorkoutLogSelector';
import ProgramSelector from './ProgramSelector';
import ProgramCard from '../workouts/ProgramCard';
import WorkoutLogCard from '../workouts/WorkoutLogCard';

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
  
  // Animation references
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Steps: 0 = post type selection, 1 = content entry
  const [step, setStep] = useState(1); // Changed default to 1 to skip type selection
  const [postType, setPostType] = useState<string>(initialPostType);
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showWorkoutLogSelector, setShowWorkoutLogSelector] = useState(false);
  const [showProgramSelector, setShowProgramSelector] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [selectedWorkoutLog, setSelectedWorkoutLog] = useState<any>(null);
  
  // Use the post creation mutation hook
  const { mutateAsync: createPost, isLoading: isPosting } = useCreatePost();
  
  // Post type definitions
  const postTypes: Record<string, PostType> = {
    regular: {
      id: 'regular',
      label: t('regular_post'),
      icon: 'create-outline',
      color: '#60A5FA'
    },
    workout_log: {
      id: 'workout_log',
      label: t('share_workout'),
      icon: 'fitness-outline',
      color: '#34D399'
    },
    program: {
      id: 'program',
      label: t('share_program'),
      icon: 'barbell-outline',
      color: '#A78BFA'
    },
    workout_invite: {
      id: 'workout_invite',
      label: t('group_workout'),
      icon: 'people-outline',
      color: '#FB923C'
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
  
  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(t('permission_needed'), t('camera_roll_permission'));
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
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

      // Add image if selected
      if (image) {
        const filename = image.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri: image,
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
    setStep(1); // Always set to content entry
  };
  
  const renderContentEntry = () => {
    const currentPostType = postTypes[postType];
    
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <View style={styles.contentContainer}>
          <View style={styles.postTypeHeader}>
            <View style={[styles.postTypeHeaderIcon, { backgroundColor: `${currentPostType.color}20` }]}>
              <Ionicons name={currentPostType.icon as any} size={18} color={currentPostType.color} />
            </View>
            <Text style={styles.postTypeHeaderText}>{currentPostType.label}</Text>
          </View>
          
          <ScrollView style={styles.scrollContainer}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
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
              placeholderTextColor="#9CA3AF"
              value={content}
              onChangeText={setContent}
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              blurOnSubmit={false}
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
                    <Ionicons name="close-circle" size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                <ProgramCard
                  programId={selectedProgram.id}
                  program={selectedProgram}
                  inFeedMode={true}
                  currentUser={user?.username}
                />
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
                    <Ionicons name="close-circle" size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                <WorkoutLogCard
                  logId={selectedWorkoutLog.id}
                  log={selectedWorkoutLog}
                  user={user?.username}
                  inFeedMode={true}
                />
              </View>
            )}
            
            {/* Image Preview */}
            {image && (
              <View style={styles.imagePreviewContainer}>
                <Image 
                  source={{ uri: image }} 
                  style={styles.imagePreview} 
                />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setImage(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
          
          <View style={styles.actionBar}>
            <View style={styles.mediaButtons}>
              <TouchableOpacity 
                style={styles.mediaButton}
                onPress={pickImage}
              >
                <Ionicons name="image-outline" size={24} color="#60A5FA" />
              </TouchableOpacity>
              
              {postType === 'regular' && (
                <>
                  <TouchableOpacity 
                    style={styles.mediaButton}
                    onPress={() => setShowProgramSelector(true)}
                  >
                    <Ionicons name="barbell-outline" size={24} color="#A78BFA" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.mediaButton}
                    onPress={() => setShowWorkoutLogSelector(true)}
                  >
                    <Ionicons name="fitness-outline" size={24} color="#34D399" />
                  </TouchableOpacity>
                </>
              )}
              
              {keyboardVisible && (
                <TouchableOpacity 
                  style={[styles.mediaButton, styles.keyboardDismissButton]}
                  onPress={() => Keyboard.dismiss()}
                >
                  <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity
              style={[
                styles.postButton,
                (!content.trim() && !image && !selectedProgram && !selectedWorkoutLog) && styles.postButtonDisabled
              ]}
              onPress={handleCreatePost}
              disabled={(!content.trim() && !image && !selectedProgram && !selectedWorkoutLog) || loading || isPosting}
            >
              {loading || isPosting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                  <Text style={styles.postButtonText}>{t('post')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
              <Ionicons name="close" size={24} color="#9CA3AF" />
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    backgroundColor: '#080f19',
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
    borderBottomColor: 'rgba(55, 65, 81, 0.5)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  keyboardAvoidView: {
    flex: 1,
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
    borderBottomColor: 'rgba(55, 65, 81, 0.3)',
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
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
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
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contentInput: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
  },
  cardPreviewWrapper: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  cardPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  cardPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  removeButton: {
    padding: 4,
  },
  imagePreviewContainer: {
    marginTop: 16,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.5)',
    backgroundColor: '#111827',
  },
  mediaButtons: {
    flexDirection: 'row',
  },
  mediaButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  keyboardDismissButton: {
    backgroundColor: '#4B5563',
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default PostCreationModal;