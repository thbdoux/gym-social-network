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
  const [step, setStep] = useState(0);
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
      // If a post type is provided via props, skip to step 1
      if (initialPostType !== 'regular') {
        setPostType(initialPostType);
        if (initialPostType === 'workout_log') {
          setShowWorkoutLogSelector(true);
        } else if (initialPostType === 'program') {
          setShowProgramSelector(true);
        } else {
          setStep(1);
        }
      } else {
        setStep(0);
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
  
  const handlePostTypeSelect = (type: string) => {
    setPostType(type);
    
    // For workout log and program, we need to show the selectors first
    if (type === 'workout_log') {
      setShowWorkoutLogSelector(true);
    } else if (type === 'program') {
      setShowProgramSelector(true);
    } else {
      // For regular or workout invite, go straight to content entry
      setStep(1);
    }
  };
  
  const handleProgramSelect = (program: any) => {
    setSelectedProgram(program);
    setShowProgramSelector(false);
    // Auto-populate content with program name
    setContent(`${t('check_out_program')}: ${program.name}`);
    setStep(1);
  };
  
  const handleWorkoutLogSelect = (workoutLog: any) => {
    setSelectedWorkoutLog(workoutLog);
    setShowWorkoutLogSelector(false);
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
    setStep(0);
  };
  
  const renderPostTypeSelection = () => {
    return (
      <Animated.View 
        style={[
          styles.postTypeContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.sectionTitle}>{t('choose_post_type')}</Text>
        
        <View style={styles.postTypeGrid}>
          {Object.values(postTypes).map((type) => (
            <TouchableOpacity
              key={type.id}
              style={styles.postTypeCard}
              onPress={() => handlePostTypeSelect(type.id)}
            >
              <View style={[styles.postTypeIconContainer, { backgroundColor: `${type.color}20` }]}>
                <Ionicons name={type.icon as any} size={24} color={type.color} />
              </View>
              <Text style={styles.postTypeLabel}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
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
            
            {/* Program Preview */}
            {selectedProgram && (
              <View style={styles.attachmentPreview}>
                <View style={styles.attachmentHeader}>
                  <View style={styles.programIcon}>
                    <Ionicons name="barbell" size={16} color="#A78BFA" />
                  </View>
                  <Text style={styles.attachmentTitle}>{selectedProgram.name}</Text>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => {
                      setSelectedProgram(null);
                      setPostType('regular');
                    }}
                  >
                    <Ionicons name="close" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.attachmentDescription} numberOfLines={2}>
                  {selectedProgram.description || t('no_description')}
                </Text>
                
                <View style={styles.programDetails}>
                  <View style={styles.programDetail}>
                    <Ionicons name="calendar-outline" size={14} color="#A78BFA" />
                    <Text style={styles.programDetailText}>
                      {selectedProgram.sessions_per_week}x {t('weekly')}
                    </Text>
                  </View>
                  
                  <View style={styles.programDetail}>
                    <Ionicons name="barbell-outline" size={14} color="#A78BFA" />
                    <Text style={styles.programDetailText}>
                      {selectedProgram.workouts?.length || 0} {t('workouts')}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            {/* Workout Log Preview */}
            {selectedWorkoutLog && (
              <View style={styles.attachmentPreview}>
                <View style={styles.attachmentHeader}>
                  <View style={styles.workoutIcon}>
                    <Ionicons name="fitness" size={16} color="#34D399" />
                  </View>
                  <Text style={styles.attachmentTitle}>
                    {selectedWorkoutLog.workout_name || selectedWorkoutLog.name || t('unnamed_workout')}
                  </Text>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => {
                      setSelectedWorkoutLog(null);
                      setPostType('regular');
                    }}
                  >
                    <Ionicons name="close" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.workoutDetails}>
                  <View style={styles.workoutDetail}>
                    <Ionicons name="calendar-outline" size={14} color="#34D399" />
                    <Text style={styles.workoutDetailText}>
                      {selectedWorkoutLog.date || t('no_date')}
                    </Text>
                  </View>
                  
                  <View style={styles.workoutDetail}>
                    <Ionicons name="fitness-outline" size={14} color="#34D399" />
                    <Text style={styles.workoutDetailText}>
                      {selectedWorkoutLog.exercise_count || selectedWorkoutLog.exercises?.length || 0} {t('exercises')}
                    </Text>
                  </View>
                </View>
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
              {step === 0 ? t('create_post') : postTypes[postType]?.label || t('create_post')}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            {step === 0 ? renderPostTypeSelection() : renderContentEntry()}
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
    backgroundColor: '#111827',
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
  postTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  postTypeCard: {
    width: '48%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  postTypeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  postTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
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
  attachmentPreview: {
    marginTop: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  attachmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  removeButton: {
    padding: 4,
  },
  attachmentDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  programDetails: {
    flexDirection: 'row',
    marginTop: 12,
  },
  programDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  programDetailText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  workoutDetails: {
    flexDirection: 'row',
    marginTop: 12,
  },
  workoutDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  workoutDetailText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  imagePreviewContainer: {
    marginTop: 16,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
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