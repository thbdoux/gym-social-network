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
import { useCurrentUser, useUpdateUser } from '../../hooks/query/useUserQuery';
import { useGyms, useGymDisplay } from '../../hooks/query/useGymQuery';
import { getAvatarUrl } from '../../utils/imageUtils';

export default function EditProfileScreen() {
  const { t } = useLanguage();
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
    
    if (!result.cancelled && result.uri) {
      setNewAvatarUri(result.uri);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Prepare update data
      const updateData = {
        bio,
        fitness_goals: fitnessGoals,
        training_level: trainingLevel,
        personality_type: personalityType,
        preferred_gym: preferredGym,
      };
      
      // If there's a new avatar, add it to update data
      if (newAvatarUri) {
        // In a real app, you would upload the image to server
        // For now, let's assume we're just setting the URI
        updateData.avatar = newAvatarUri;
      }
      
      await updateUser(updateData);
      
      Alert.alert(
        t('success'),
        t('profile_updated_successfully'),
        [{ text: t('ok'), onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
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
  
  // Render loading state
  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>{t('loading_profile')}</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#9333EA', '#D946EF']}
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
              <View style={styles.editAvatarButton}>
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>{t('tap_to_change_photo')}</Text>
          </View>
          
          {/* Username (read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('username')}</Text>
            <TextInput
              style={[styles.textInput, styles.readOnlyInput]}
              value={username}
              editable={false}
            />
            <Text style={styles.inputHint}>{t('username_cannot_be_changed')}</Text>
          </View>
          
          {/* Bio */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('bio')}</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder={t('enter_bio')}
              placeholderTextColor="#9ca3af"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          {/* Fitness Goals */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('fitness_goals')}</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder={t('enter_fitness_goals')}
              placeholderTextColor="#9ca3af"
              value={fitnessGoals}
              onChangeText={setFitnessGoals}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          {/* Training Level */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('training_level')}</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setTrainingLevelModalVisible(true)}
            >
              <Text style={styles.pickerButtonText}>
                {trainingLevel ? t(trainingLevel.toLowerCase()) : t('select_training_level')}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Personality Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('personality_type')}</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setPersonalityModalVisible(true)}
            >
              <Text style={styles.pickerButtonText}>
                {personalityType ? t(personalityType.toLowerCase()) : t('select_personality_type')}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Preferred Gym */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('preferred_gym')}</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setGymModalVisible(true)}
            >
              <Text style={styles.pickerButtonText}>
                {preferredGym ? gymDisplayText : t('select_gym')}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled
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
          <View style={styles.modalContent}>
            <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
            <Text style={styles.modalTitle}>{t('select_training_level')}</Text>
            
            {trainingLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.modalOption,
                  trainingLevel === level.value && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setTrainingLevel(level.value);
                  setTrainingLevelModalVisible(false);
                }}
              >
                <Text 
                  style={[
                    styles.modalOptionText,
                    trainingLevel === level.value && styles.modalOptionTextSelected
                  ]}
                >
                  {level.label}
                </Text>
                {trainingLevel === level.value && (
                  <Ionicons name="checkmark" size={20} color="#a855f7" />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setTrainingLevelModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>{t('cancel')}</Text>
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
          <View style={styles.modalContent}>
            <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
            <Text style={styles.modalTitle}>{t('select_personality_type')}</Text>
            
            {personalityTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.modalOption,
                  personalityType === type.value && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setPersonalityType(type.value);
                  setPersonalityModalVisible(false);
                }}
              >
                <Text 
                  style={[
                    styles.modalOptionText,
                    personalityType === type.value && styles.modalOptionTextSelected
                  ]}
                >
                  {type.label}
                </Text>
                {personalityType === type.value && (
                  <Ionicons name="checkmark" size={20} color="#a855f7" />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setPersonalityModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>{t('cancel')}</Text>
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
          <View style={styles.modalContent}>
            <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
            <Text style={styles.modalTitle}>{t('select_gym')}</Text>
            
            {gymsLoading ? (
              <ActivityIndicator size="small" color="#a855f7" style={styles.modalLoading} />
            ) : (
              <ScrollView style={styles.modalScroll}>
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    preferredGym === null && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setPreferredGym(null);
                    setGymModalVisible(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.modalOptionText,
                      preferredGym === null && styles.modalOptionTextSelected
                    ]}
                  >
                    {t('no_preferred_gym')}
                  </Text>
                  {preferredGym === null && (
                    <Ionicons name="checkmark" size={20} color="#a855f7" />
                  )}
                </TouchableOpacity>
                
                {gyms && gyms.map((gym) => (
                  <TouchableOpacity
                    key={gym.id}
                    style={[
                      styles.modalOption,
                      preferredGym === gym.id && styles.modalOptionSelected
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
                          preferredGym === gym.id && styles.modalOptionTextSelected
                        ]}
                      >
                        {gym.name}
                      </Text>
                      <Text style={styles.gymLocationText}>{gym.location}</Text>
                    </View>
                    
                    {preferredGym === gym.id && (
                      <Ionicons name="checkmark" size={20} color="#a855f7" />
                    )}
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  style={styles.addGymButton}
                  onPress={() => {
                    setGymModalVisible(false);
                    router.push('/workout-log/create-gym');
                  }}
                >
                  <Ionicons name="add-circle" size={20} color="#a855f7" />
                  <Text style={styles.addGymText}>{t('add_new_gym')}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setGymModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>{t('cancel')}</Text>
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
    backgroundColor: '#080f19',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#080f19',
  },
  loadingText: {
    color: '#9ca3af',
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 14,
    color: '#a855f7',
  },
  
  // Input styles
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  readOnlyInput: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    color: '#9ca3af',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerButtonText: {
    color: '#ffffff',
    fontSize: 15,
  },
  
  // Submit button
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a855f7',
    borderRadius: 8,
    padding: 14,
    marginTop: 10,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(168, 85, 247, 0.4)',
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
    backgroundColor: '#1F2937',
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
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalOptionTextSelected: {
    color: '#a855f7',
    fontWeight: 'bold',
  },
  gymModalOption: {
    flex: 1,
  },
  gymLocationText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  modalCancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#ef4444',
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
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 8,
  },
  addGymText: {
    fontSize: 14,
    color: '#a855f7',
    marginLeft: 8,
  },
});