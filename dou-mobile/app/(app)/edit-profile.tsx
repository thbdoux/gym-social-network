// app/(app)/edit-profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';

// Custom hooks
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useCurrentUser, useUpdateUser } from '../../hooks/query/useUserQuery';
import { useGyms, useGymDisplay } from '../../hooks/query/useGymQuery';
import { getAvatarUrl } from '../../utils/imageUtils';

export default function EditProfileScreen() {
  const { t } = useLanguage();
  const { palette, personality } = useTheme();
  const { data: profile, isLoading: profileLoading } = useCurrentUser();
  const { mutateAsync: updateUser, isLoading: updateLoading } = useUpdateUser();
  const { data: gyms, isLoading: gymsLoading } = useGyms();
  
  // Local states for form fields
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [fitnessGoals, setFitnessGoals] = useState('');
  const [trainingLevel, setTrainingLevel] = useState('');
  const [personalityType, setPersonalityType] = useState('');
  const [preferredGym, setPreferredGym] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [newAvatarUri, setNewAvatarUri] = useState(null);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gymModalVisible, setGymModalVisible] = useState(false);
  const [personalityModalVisible, setPersonalityModalVisible] = useState(false);
  const [trainingLevelModalVisible, setTrainingLevelModalVisible] = useState(false);
  
  // Initialize form with user data
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setFitnessGoals(profile.fitness_goals || '');
      setTrainingLevel(profile.training_level || '');
      setPersonalityType(profile.personality_type || '');
      setPreferredGym(profile.preferred_gym || null);
      setAvatar(profile.avatar || null);
    }
  }, [profile]);
  
  // Handle image picking
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(t('permission_denied'), t('camera_roll_permission_needed'));
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    // Log result for debugging
    console.log('ImagePicker result:', JSON.stringify(result));
    
    // The newer API returns an assets array and uses "canceled" (not cancelled)
    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log('Setting new avatar URI to:', result.assets[0].uri);
      setNewAvatarUri(result.assets[0].uri);
    }
  };
  
  // Handle form submission
  // In edit-profile.tsx - Replace the handleSubmit function

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // If there's a new avatar, we need to use FormData
      if (newAvatarUri) {
        console.log('New avatar selected, using FormData for upload');
        
        // Create FormData for file upload
        const formData = new FormData();
        
        // Add all text fields to FormData - convert all values to strings
        formData.append('bio', bio || '');
        formData.append('fitness_goals', fitnessGoals || '');
        formData.append('training_level', trainingLevel || '');
        formData.append('personality_type', personalityType || '');
        
        // Add preferred_gym (nullable) if it exists
        if (preferredGym !== null) {
          formData.append('preferred_gym', preferredGym.toString());
        }
        
        // Get file extension
        const uriParts = newAvatarUri.split('.');
        const fileType = uriParts[uriParts.length - 1].toLowerCase();
        
        // Prepare file information
        const fileName = `avatar-${Date.now()}.${fileType}`;
        const fileType2 = fileType === 'jpg' ? 'jpeg' : fileType;
        
        // Create the file object with the correct structure for React Native
        const fileObject = {
          uri: Platform.OS === 'ios' ? newAvatarUri.replace('file://', '') : newAvatarUri,
          name: fileName,
          type: `image/${fileType2}`
        };
        
        // Log the file object for debugging
        console.log('File object for upload:', JSON.stringify(fileObject));
        
        // Append file to FormData with the correct field name
        formData.append('avatar', fileObject);
        
        // Log the formData keys (this won't show values but helps debugging)
        // Note: FormData logging is limited in React Native
        console.log('FormData entries:');
        for (let [key, value] of Object.entries(formData._parts || [])) {
          console.log(`${key}: ${JSON.stringify(value)}`);
        }
        
        // Use the formData version for the update
        await updateUser(formData);
      } else {
        // No new avatar, just use regular JSON
        const updateData = {
          bio,
          fitness_goals: fitnessGoals,
          training_level: trainingLevel,
          personality_type: personalityType,
          preferred_gym: preferredGym,
        };
        
        await updateUser(updateData);
      }
      
      Alert.alert(
        t('success'),
        t('profile_updated_successfully'),
        [{ text: t('ok'), onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.error('API Error Response:', JSON.stringify({
          data: error.response.data,
          headers: error.response.headers,
          status: error.response.status
        }));
      } else if (error.request) {
        console.error('Request was made but no response was received', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      Alert.alert(t('error'), t('failed_to_update_profile'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Define personality types and training levels from model
  const personalityTypes = [
    { value: 'optimizer', label: t('optimizer') },
    { value: 'diplomate', label: t('diplomate') },
    { value: 'mentor', label: t('mentor') },
    { value: 'versatile', label: t('versatile') },
    { value: 'casual', label: t('casual') }
  ];
  
  const trainingLevels = [
    { value: 'beginner', label: t('beginner') },
    { value: 'intermediate', label: t('intermediate') },
    { value: 'advanced', label: t('advanced') }
  ];
  
  // Get preferred gym display text
  const { displayText: gymDisplayText, gym } = useGymDisplay(profile?.id, preferredGym);
  
  // Get gradient colors from theme
  const gradientColors = [palette.background, palette.secondary];
  
  // Render loading state
  if (profileLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: palette.page_background }]}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={[styles.loadingText, { color: palette.text }]}>{t('loading_profile')}</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.page_background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>{t('edit_profile')}</Text>
          </View>
        </View>
      </LinearGradient>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView 
          style={styles.formContainer}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Picture */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity 
              style={styles.avatarWrapper}
              onPress={pickImage}
            >
              <Image
                source={{ 
                  uri: newAvatarUri || getAvatarUrl(avatar, 150) 
                }}
                style={styles.avatar}
              />
              <View style={[styles.editAvatarButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
                <Ionicons name="camera" size={20} color={palette.text} />
              </View>
            </TouchableOpacity>
            <Text style={[styles.changePhotoText, { color: palette.text }]}>{t('tap_to_change_photo')}</Text>
          </View>
          
          {/* Username (read-only) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: palette.text }]}>{t('username')}</Text>
            <TextInput
              style={[
                styles.textInput, 
                styles.readOnlyInput, 
                { 
                  backgroundColor: palette.input_background,
                  borderColor: palette.border,
                  color: palette.text
                }
              ]}
              value={username}
              editable={false}
            />
            <Text style={[styles.inputHint, { color: palette.text }]}>{t('username_cannot_be_changed')}</Text>
          </View>
          
          {/* Bio */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: palette.text }]}>{t('bio')}</Text>
            <TextInput
              style={[
                styles.textInput, 
                styles.multilineInput,
                { 
                  backgroundColor: palette.input_background,
                  borderColor: palette.border,
                  color: palette.text
                }
              ]}
              placeholder={t('enter_bio')}
              placeholderTextColor={palette.text}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          {/* Fitness Goals */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: palette.text }]}>{t('fitness_goals')}</Text>
            <TextInput
              style={[
                styles.textInput, 
                styles.multilineInput,
                { 
                  backgroundColor: palette.input_background,
                  borderColor: palette.border,
                  color: palette.text
                }
              ]}
              placeholder={t('enter_fitness_goals')}
              placeholderTextColor={palette.text}
              value={fitnessGoals}
              onChangeText={setFitnessGoals}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          {/* Training Level */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: palette.text }]}>{t('training_level')}</Text>
            <TouchableOpacity 
              style={[
                styles.pickerButton,
                { 
                  backgroundColor: palette.input_background,
                  borderColor: palette.border
                }
              ]}
              onPress={() => setTrainingLevelModalVisible(true)}
            >
              <Text style={[styles.pickerButtonText, { color: palette.text }]}>
                {trainingLevel ? t(trainingLevel.toLowerCase()) : t('select_training_level')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={palette.text} />
            </TouchableOpacity>
          </View>
          
          {/* Personality Type */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: palette.text }]}>{t('personality_type')}</Text>
            <TouchableOpacity 
              style={[
                styles.pickerButton,
                { 
                  backgroundColor: palette.input_background,
                  borderColor: palette.border
                }
              ]}
              onPress={() => setPersonalityModalVisible(true)}
            >
              <Text style={[styles.pickerButtonText, { color: palette.text }]}>
                {personalityType ? t(personalityType.toLowerCase()) : t('select_personality_type')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={palette.text} />
            </TouchableOpacity>
          </View>
          
          {/* Preferred Gym */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: palette.text }]}>{t('preferred_gym')}</Text>
            <TouchableOpacity 
              style={[
                styles.pickerButton,
                { 
                  backgroundColor: palette.input_background,
                  borderColor: palette.border
                }
              ]}
              onPress={() => setGymModalVisible(true)}
            >
              <Text style={[styles.pickerButtonText, { color: palette.text }]}>
                {preferredGym ? gymDisplayText : t('select_gym')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={palette.text} />
            </TouchableOpacity>
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: palette.highlight },
              isSubmitting && { backgroundColor: `${palette.text}80` } // Add transparency for disabled state
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting || updateLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" style={styles.submitButtonIcon} />
                <Text style={styles.submitButtonText}>{t('save_changes')}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Training Level Modal */}
      <Modal
        visible={trainingLevelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTrainingLevelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: palette.page_background }]}>
            <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
            <Text style={[styles.modalTitle, { color: palette.text }]}>{t('select_training_level')}</Text>
            
            {trainingLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.modalOption,
                  trainingLevel === level.value && [
                    styles.modalOptionSelected,
                    { 
                      backgroundColor: palette.page_background,
                      borderColor: palette.border
                    }
                  ]
                ]}
                onPress={() => {
                  setTrainingLevel(level.value);
                  setTrainingLevelModalVisible(false);
                }}
              >
                <Text 
                  style={[
                    styles.modalOptionText,
                    { color: palette.text },
                    trainingLevel === level.value && { color: palette.text, fontWeight: 'bold' }
                  ]}
                >
                  {level.label}
                </Text>
                {trainingLevel === level.value && (
                  <Ionicons name="checkmark" size={20} color={palette.text} />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.modalCancelButton, { borderTopColor: palette.border }]}
              onPress={() => setTrainingLevelModalVisible(false)}
            >
              <Text style={[styles.modalCancelText, { color: palette.text }]}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Personality Type Modal */}
      <Modal
        visible={personalityModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPersonalityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: palette.page_background }]}>
            <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
            <Text style={[styles.modalTitle, { color: palette.text }]}>{t('select_personality_type')}</Text>
            
            {personalityTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.modalOption,
                  personalityType === type.value && [
                    styles.modalOptionSelected,
                    { 
                      backgroundColor: palette.page_background,
                      borderColor: palette.border
                    }
                  ]
                ]}
                onPress={() => {
                  setPersonalityType(type.value);
                  setPersonalityModalVisible(false);
                }}
              >
                <Text 
                  style={[
                    styles.modalOptionText,
                    { color: palette.text },
                    personalityType === type.value && { color: palette.text, fontWeight: 'bold' }
                  ]}
                >
                  {type.label}
                </Text>
                {personalityType === type.value && (
                  <Ionicons name="checkmark" size={20} color={palette.text} />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.modalCancelButton, { borderTopColor: palette.border }]}
              onPress={() => setPersonalityModalVisible(false)}
            >
              <Text style={[styles.modalCancelText, { color: palette.text }]}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Gym Selection Modal */}
      <Modal
        visible={gymModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGymModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: palette.page_background }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>{t('select_gym')}</Text>
            
            {gymsLoading ? (
              <ActivityIndicator size="small" color={palette.text} style={styles.modalLoading} />
            ) : (
              <ScrollView style={styles.modalScroll}>
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    preferredGym === null && [
                      styles.modalOptionSelected,
                      { 
                        backgroundColor: palette.highlight,
                        borderColor: palette.highlight
                      }
                    ]
                  ]}
                  onPress={() => {
                    setPreferredGym(null);
                    setGymModalVisible(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.modalOptionText,
                      { color: palette.text },
                      preferredGym === null && { color: palette.text, fontWeight: 'bold' }
                    ]}
                  >
                    {t('no_preferred_gym')}
                  </Text>
                  {preferredGym === null && (
                    <Ionicons name="checkmark" size={20} color={palette.highlight} />
                  )}
                </TouchableOpacity>
                
                {gyms && gyms.map((gym) => (
                  <TouchableOpacity
                    key={gym.id}
                    style={[
                      styles.modalOption,
                      preferredGym === gym.id && [
                        styles.modalOptionSelected,
                        { 
                          backgroundColor: palette.page_background,
                          borderColor: palette.border
                        }
                      ]
                    ]}
                    onPress={() => {
                      setPreferredGym(gym.id);
                      setGymModalVisible(false);
                    }}
                  >
                    <View style={styles.gymModalOption}>
                      <Text 
                        style={[
                          styles.modalOptionText,
                          { color: palette.text },
                          preferredGym === gym.id && { color: palette.text, fontWeight: 'bold' }
                        ]}
                      >
                        {gym.name}
                      </Text>
                      <Text style={[styles.gymLocationText, { color: palette.text }]}>
                        {gym.location}
                      </Text>
                    </View>
                    
                    {preferredGym === gym.id && (
                      <Ionicons name="checkmark" size={20} color={palette.text} />
                    )}
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  style={[
                    styles.addGymButton, 
                    { backgroundColor: palette.highlight }
                  ]}
                  onPress={() => {
                    setGymModalVisible(false);
                    router.push('/workout-log/create-gym');
                  }}
                >
                  <Ionicons name="add-circle" size={20} color='FFFFF' />
                  <Text style={[styles.addGymText, { color: 'FFFFF' }]}>{t('add_new_gym')}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
            
            <TouchableOpacity
              style={[styles.modalCancelButton, { borderTopColor: palette.border }]}
              onPress={() => setGymModalVisible(false)}
            >
              <Text style={[styles.modalCancelText, { color: palette.text }]}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  
  // Header styles
  header: {
    padding: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  
  // Form styles
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  
  // Avatar styles
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 14,
  },
  
  // Input styles
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 8,
    fontSize: 15,
    padding: 12,
    borderWidth: 1,
  },
  readOnlyInput: {
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  pickerButtonText: {
    fontSize: 15,
  },
  
  // Submit button
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 14,
    marginTop: 10,
    marginBottom: 24,
  },
  submitButtonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionSelected: {
    borderWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
  },
  gymModalOption: {
    flex: 1,
  },
  gymLocationText: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalLoading: {
    marginVertical: 20,
  },
  addGymButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
  },
  addGymText: {
    fontSize: 14,
    marginLeft: 8,
  },
});