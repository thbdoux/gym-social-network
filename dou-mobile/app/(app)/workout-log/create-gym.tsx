// app/(app)/workout-log/create-gym.tsx
import React, { useState } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Custom hooks
import { useLanguage } from '../../../context/LanguageContext';
import { useCreateGym } from '../../../hooks/query/useGymQuery';

// Color scheme (reusing from WorkoutLogDetailScreen)
const COLORS = {
  primary: "#4ade80", // Light green
  secondary: "#10b981", // Emerald
  tertiary: "#059669", // Green-teal
  accent: "#f59e0b", // Amber
  success: "#10b981", // Emerald
  danger: "#ef4444", // Red
  background: "#080f19", // Dark background
  card: "#1F2937", // Card background
  text: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.7)",
    tertiary: "rgba(255, 255, 255, 0.5)"
  },
  border: "rgba(255, 255, 255, 0.1)"
};

export default function CreateGymScreen() {
  // Get return log ID from route params
  const { returnToLogId } = useLocalSearchParams();
  const logId = typeof returnToLogId === 'string' ? parseInt(returnToLogId, 10) : 0;
  
  // State for form
  const [gymName, setGymName] = useState('');
  const [gymLocation, setGymLocation] = useState('');
  const [gymDescription, setGymDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hooks
  const { t } = useLanguage();
  const { mutateAsync: createGym } = useCreateGym();
  
  // Check if form is valid
  const isFormValid = gymName.trim() !== '' && gymLocation.trim() !== '';
  
  // Handle create gym
  const handleCreateGym = async () => {
    if (!isFormValid) {
      Alert.alert(t('error'), t('name_and_location_required'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newGym = await createGym({
        name: gymName.trim(),
        location: gymLocation.trim(),
        description: gymDescription.trim() || undefined,
      });
      
      // Navigate back to gym selection with the new gym selected
      if (logId) {
        router.push({
          pathname: "/workout-log/select-gym",
          params: { 
            logId: logId,
            currentGymId: newGym.id 
          }
        });
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Failed to create gym:', error);
      Alert.alert(t('error'), t('failed_to_create_gym'));
      setIsSubmitting(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#080f19" />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
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
            <Text style={styles.headerTitle}>{t('create_new_gym')}</Text>
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
          {/* Gym Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('gym_name')} *</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('enter_gym_name')}
              placeholderTextColor={COLORS.text.tertiary}
              value={gymName}
              onChangeText={setGymName}
              returnKeyType="next"
            />
            <Text style={styles.inputHint}>{t('e.g. Basic Fit, Fitness Park, etc.')}</Text>
          </View>
          
          {/* Gym Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('gym_location')} *</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('enter_gym_location')}
              placeholderTextColor={COLORS.text.tertiary}
              value={gymLocation}
              onChangeText={setGymLocation}
              returnKeyType="next"
            />
            <Text style={styles.inputHint}>{t('e.g. Downtown, 123 Main St, etc.')}</Text>
          </View>
          
          {/* Gym Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('description')}</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder={t('enter_gym_description')}
              placeholderTextColor={COLORS.text.tertiary}
              value={gymDescription}
              onChangeText={setGymDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.inputHint}>{t('optional_description')}</Text>
          </View>
          
          {/* Required Field Note */}
          <Text style={styles.requiredNote}>* {t('required_fields')}</Text>
          
          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleCreateGym}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={styles.submitButtonIcon} />
                <Text style={styles.submitButtonText}>{t('create_gym')}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    color: COLORS.text.primary,
    fontSize: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  requiredNote: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(74, 222, 128, 0.4)',
  },
  submitButtonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});