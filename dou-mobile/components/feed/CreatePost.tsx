// components/feed/CreatePost.tsx
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Modal, 
  Platform,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../../context/LanguageContext';
import WorkoutLogSelector from './WorkoutLogSelector';
import ProgramSelector from './ProgramSelector';
import { useAuth } from '../../hooks/useAuth';
import { useCreatePost } from '../../hooks/query/usePostQuery';

interface CreatePostProps {
  onPostCreated: (post: any) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [postType, setPostType] = useState('regular');
  const [showWorkoutLogSelector, setShowWorkoutLogSelector] = useState(false);
  const [showProgramSelector, setShowProgramSelector] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [selectedWorkoutLog, setSelectedWorkoutLog] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  
  // Use the post creation mutation hook
  const { mutateAsync: createPost, isLoading: isPosting } = useCreatePost();
  
  // Post type definitions
  const postTypes = {
    regular: {
      label: t('regular_post'),
      icon: 'create-outline',
      color: '#60A5FA'
    },
    workout_log: {
      label: t('share_workout'),
      icon: 'fitness-outline',
      color: '#34D399'
    },
    program: {
      label: t('share_program'),
      icon: 'barbell-outline',
      color: '#A78BFA'
    },
    workout_invite: {
      label: t('group_workout'),
      icon: 'people-outline',
      color: '#FB923C'
    }
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
      
      // Reset form
      resetForm();
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
    setPostType('regular');
    setSelectedProgram(null);
    setSelectedWorkoutLog(null);
    setExpanded(false);
  };
  
  const handleProgramSelect = (program: any) => {
    setSelectedProgram(program);
    setShowProgramSelector(false);
    // Auto-populate content with program name
    setContent(`${t('check_out_program')}: ${program.name}`);
    setPostType('program');
  };
  
  const handleWorkoutLogSelect = (workoutLog: any) => {
    setSelectedWorkoutLog(workoutLog);
    setShowWorkoutLogSelector(false);
    // Auto-populate content
    setContent(`${t('just_completed')}: ${workoutLog.workout_name || workoutLog.name || t('a_workout')}`);
    setPostType('workout_log');
  };
  
  const handleTypeSelect = (key: string) => {
    setPostType(key);
    setShowTypeMenu(false);
    
    if (key === 'program') {
      setShowProgramSelector(true);
    } else if (key === 'workout_log') {
      setShowWorkoutLogSelector(true);
    }
  };
  
  // Get the current post type information
  const currentType = postTypes[postType as keyof typeof postTypes];
  
  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.inputPlaceholder}
            onPress={() => setExpanded(true)}
          >
            <Text style={styles.placeholderText}>
              {t('whats_on_your_mind')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.photoButton}
            onPress={pickImage}
          >
            <Ionicons name="image-outline" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        
        {/* Post Type Buttons */}
        <View style={styles.postTypeContainer}>
          {Object.entries(postTypes).map(([key, type]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.postTypeButton,
                postType === key && styles.postTypeButtonActive,
                { borderColor: postType === key ? type.color : 'transparent' }
              ]}
              onPress={() => handleTypeSelect(key)}
            >
              <Ionicons 
                name={type.icon as any} 
                size={18} 
                color={postType === key ? type.color : '#9CA3AF'} 
              />
              <Text 
                style={[
                  styles.postTypeText,
                  postType === key && styles.postTypeTextActive,
                  { color: postType === key ? type.color : '#9CA3AF' }
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Expanded Post Creation Modal */}
      <Modal
        visible={expanded}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExpanded(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('create_post')}</Text>
              <TouchableOpacity onPress={() => setExpanded(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
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
            </View>
            
            <View style={styles.modalFooter}>
              <View style={styles.mediaButtons}>
                <TouchableOpacity 
                  style={styles.mediaButton}
                  onPress={pickImage}
                >
                  <Ionicons name="image-outline" size={24} color="#60A5FA" />
                </TouchableOpacity>
                
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
        </View>
      </Modal>
      
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
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputPlaceholder: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  photoButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  postTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 2,
  },
  postTypeButtonActive: {
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
  },
  postTypeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  postTypeTextActive: {
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
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
  modalBody: {
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
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
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
  attachmentPreview: {
    marginTop: 16,
    backgroundColor: '#111827',
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
    padding: 8,
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
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.5)',
  },
  mediaButtons: {
    flexDirection: 'row',
  },
  mediaButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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

export default CreatePost;