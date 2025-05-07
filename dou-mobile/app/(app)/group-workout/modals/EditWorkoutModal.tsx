// app/(app)/group-workout/modals/EditWorkoutModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../../context/LanguageContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUpdateGroupWorkout } from '../../../../hooks/query/useGroupWorkoutQuery';
import groupWorkoutService from '../../../../api/services/groupWorkoutService';

interface EditWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  groupWorkout: any;
  colors: any;
  onSave: () => void;
}

const EditWorkoutModal: React.FC<EditWorkoutModalProps> = ({
  visible,
  onClose,
  groupWorkout,
  colors,
  onSave
}) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [maxParticipants, setMaxParticipants] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'upon-request' | 'private'>('public');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Initialize form values when modal becomes visible
  useEffect(() => {
    if (visible && groupWorkout) {
      setTitle(groupWorkout.title || '');
      setDescription(groupWorkout.description || '');
      setScheduledTime(new Date(groupWorkout.scheduled_time));
      setMaxParticipants(groupWorkout.max_participants?.toString() || '');
      setPrivacy(groupWorkout.privacy || 'public');
    }
  }, [visible, groupWorkout]);
  
  // Handle date change
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setScheduledTime(selectedDate);
    }
  };
  
  // Format date for display
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString(undefined, options);
  };
  
  // Handle save
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('error'), t('title_required'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare update data
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        scheduled_time: scheduledTime.toISOString(),
        max_participants: maxParticipants ? parseInt(maxParticipants) : 0,
        privacy
      };
      
      // Call service to update
      await groupWorkoutService.updateGroupWorkout(groupWorkout.id, updateData);
      
      setIsLoading(false);
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to update group workout:', error);
      setIsLoading(false);
      Alert.alert(t('error'), t('failed_to_update_workout'));
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {t('edit_workout')}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContainer}>
            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text.secondary }]}>
                {t('title')} *
              </Text>
              <TextInput
                style={[
                  styles.formInput, 
                  { 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    color: colors.text.primary,
                    borderColor: colors.border
                  }
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder={t('workout_title')}
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
            
            {/* Description Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text.secondary }]}>
                {t('description')}
              </Text>
              <TextInput
                style={[
                  styles.formInput, 
                  styles.textArea,
                  { 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    color: colors.text.primary,
                    borderColor: colors.border
                  }
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder={t('workout_description')}
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            {/* Scheduled Time */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text.secondary }]}>
                {t('scheduled_time')} *
              </Text>
              <TouchableOpacity
                style={[
                  styles.formInput, 
                  styles.dateInput,
                  { 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: colors.text.primary }}>
                  {formatDate(scheduledTime)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.text.primary} />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={scheduledTime}
                  mode="datetime"
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </View>
            
            {/* Max Participants */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text.secondary }]}>
                {t('max_participants')}
              </Text>
              <TextInput
                style={[
                  styles.formInput, 
                  { 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    color: colors.text.primary,
                    borderColor: colors.border
                  }
                ]}
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                placeholder={t('max_participants_placeholder')}
                placeholderTextColor={colors.text.tertiary}
                keyboardType="number-pad"
              />
              <Text style={[styles.helperText, { color: colors.text.tertiary }]}>
                {t('leave_empty_for_unlimited')}
              </Text>
            </View>
            
            {/* Privacy Settings */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text.secondary }]}>
                {t('privacy')}
              </Text>
              
              {/* Public Option */}
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  privacy === 'public' && { backgroundColor: 'rgba(16, 185, 129, 0.2)' }
                ]}
                onPress={() => setPrivacy('public')}
              >
                <View style={styles.optionButtonContent}>
                  <Ionicons 
                    name="globe-outline" 
                    size={20} 
                    color={privacy === 'public' ? colors.success : colors.text.secondary} 
                  />
                  <Text style={[
                    styles.optionButtonText, 
                    { color: privacy === 'public' ? colors.success : colors.text.primary }
                  ]}>
                    {t('public')}
                  </Text>
                </View>
                <Text style={[styles.optionButtonDesc, { color: colors.text.tertiary }]}>
                  {t('public_description')}
                </Text>
              </TouchableOpacity>
              
              {/* Upon Request Option */}
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  privacy === 'upon-request' && { backgroundColor: 'rgba(59, 130, 246, 0.2)' }
                ]}
                onPress={() => setPrivacy('upon-request')}
              >
                <View style={styles.optionButtonContent}>
                  <Ionicons 
                    name="hand-right-outline" 
                    size={20} 
                    color={privacy === 'upon-request' ? '#3B82F6' : colors.text.secondary} 
                  />
                  <Text style={[
                    styles.optionButtonText, 
                    { color: privacy === 'upon-request' ? '#3B82F6' : colors.text.primary }
                  ]}>
                    {t('upon_request')}
                  </Text>
                </View>
                <Text style={[styles.optionButtonDesc, { color: colors.text.tertiary }]}>
                  {t('upon_request_description')}
                </Text>
              </TouchableOpacity>
              
              {/* Private Option */}
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  privacy === 'private' && { backgroundColor: 'rgba(107, 114, 128, 0.2)' }
                ]}
                onPress={() => setPrivacy('private')}
              >
                <View style={styles.optionButtonContent}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={privacy === 'private' ? '#6B7280' : colors.text.secondary} 
                  />
                  <Text style={[
                    styles.optionButtonText, 
                    { color: privacy === 'private' ? '#6B7280' : colors.text.primary }
                  ]}>
                    {t('private')}
                  </Text>
                </View>
                <Text style={[styles.optionButtonDesc, { color: colors.text.tertiary }]}>
                  {t('private_description')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={{ color: colors.danger }}>{t('cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.success }]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{t('save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  optionButton: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  optionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  optionButtonDesc: {
    fontSize: 12,
    marginLeft: 28,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  }
});

export default EditWorkoutModal;