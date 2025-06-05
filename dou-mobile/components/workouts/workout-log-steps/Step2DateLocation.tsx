import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  FlatList,
  KeyboardAvoidingView
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { WorkoutLogFormData } from '../WorkoutLogWizard';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useGyms } from '../../../hooks/query/useGymQuery';
import { useAuth } from '../../../hooks/useAuth';
import GymSelectionModal from '../GymSelectionModal';

type Step2DateLocationProps = {
  formData: WorkoutLogFormData;
  updateFormData: (data: Partial<WorkoutLogFormData>) => void;
  errors: Record<string, string>;
};

type GymType = {
  id: number;
  name: string;
  location: string;
  [key: string]: any;
};

const Step2DateLocation = ({ formData, updateFormData, errors }: Step2DateLocationProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { workoutLogPalette, palette } = useTheme();
  
  // State for Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // State for gym selector
  const [gymSelectorVisible, setGymSelectorVisible] = useState(false);
  
  // State for duration picker
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  
  // Get preferred gym from user
  const [preferredGym, setPreferredGym] = useState<GymType | null>(null);
  
  // Get gyms from hook
  const { data: gyms = [], isLoading: gymsLoading } = useGyms();
  
  // Generate duration options in 5-minute steps
  const durationOptions = useMemo(() => {
    const options = [];
    for (let i = 5; i <= 180; i += 5) { // 5 minutes to 3 hours in 5-minute steps
      options.push(i);
    }
    return options;
  }, []);
  
  // Format duration for display
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} ${t('min')}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${remainingMinutes}${t('min')}`;
      }
    }
  };
  
  // Toggle duration picker
  const toggleDurationPicker = () => {
    setShowDurationPicker(!showDurationPicker);
  };
  
  // Handle duration selection
  const handleDurationChange = (duration: number) => {
    updateFormData({ duration_minutes: duration });
    setShowDurationPicker(false);
  };
  
  // Find preferred gym
  useEffect(() => {
    if (gyms.length && user?.preferred_gym) {
      const gym = gyms.find(gym => gym.id === user.preferred_gym);
      if (gym) {
        setPreferredGym(gym);
        
        // If no gym is selected yet, use preferred gym
        if (!formData.gym_id && !formData.location) {
          updateFormData({ 
            gym_id: gym.id,
            gym_name: gym.name,
            location: gym.location,
          });
        }
      }
    }
  }, [gyms, user]);
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Toggle date picker
  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };
  
  // Handle date change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      updateFormData({ date: selectedDate });
    }
  };
  
  // Handle gym selection from modal
  const handleGymSelection = (gym: GymType | null) => {
    if (gym) {
      updateFormData({ 
        gym_id: gym.id,
        gym_name: gym.name,
        location: gym.location
      });
    } else {
      // Handle "No Gym" / Home workout selection
      updateFormData({ 
        gym_id: undefined,
        gym_name: undefined,
        location: 'Home'
      });
    }
  };
  
  // Get currently selected gym for modal
  const selectedGym = useMemo(() => {
    if (!formData.gym_id || !gyms.length) return null;
    return gyms.find(gym => gym.id === formData.gym_id) || null;
  }, [formData.gym_id, gyms]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date card - now full width */}
        <View style={[
          styles.card, 
          { 
            backgroundColor: palette.card_background, 
            borderColor: errors.date ? palette.error : palette.border 
          }
        ]}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={20} color={workoutLogPalette.highlight} />
            <Text style={[styles.cardTitle, { color: workoutLogPalette.text }]}>
              {t('date')} • {formatTime(formData.date)}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.dateTimeButton,
              { 
                backgroundColor: palette.input_background,
                borderColor: errors.date ? palette.error : palette.border 
              }
            ]}
            onPress={toggleDatePicker}
          >
            <Text style={[styles.dateTimeText, { color: workoutLogPalette.text }]}>
              {formatDate(formData.date)}
            </Text>
            <Ionicons name="chevron-down" size={16} color={palette.text_tertiary} />
          </TouchableOpacity>
          
          {errors.date ? (
            <Text style={[styles.errorText, { color: palette.error }]}>
              {errors.date}
            </Text>
          ) : null}
          
          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()} // Can't log future workouts
            />
          )}
        </View>
        
        {/* Duration card with picker */}
        <View style={[
          styles.card,
          {
            backgroundColor: palette.card_background,
            borderColor: palette.border
          }
        ]}>
          <View style={styles.cardHeader}>
            <Ionicons name="hourglass-outline" size={20} color={workoutLogPalette.highlight} />
            <Text style={[styles.cardTitle, { color: workoutLogPalette.text }]}>
              {t('duration')}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.dateTimeButton,
              { 
                backgroundColor: palette.input_background,
                borderColor: palette.border 
              }
            ]}
            onPress={toggleDurationPicker}
          >
            <Text style={[styles.dateTimeText, { color: workoutLogPalette.text }]}>
              {formatDuration(formData.duration_minutes || 45)}
            </Text>
            <Ionicons name="chevron-down" size={16} color={palette.text_tertiary} />
          </TouchableOpacity>
        </View>
        
        {/* Location card */}
        <View style={[
          styles.card,
          {
            backgroundColor: palette.card_background,
            borderColor: palette.border
          }
        ]}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={20} color={workoutLogPalette.highlight} />
            <Text style={[styles.cardTitle, { color: workoutLogPalette.text }]}>
              {t('location')}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.locationButton,
              { 
                backgroundColor: palette.input_background,
                borderColor: (formData.gym_id || formData.location === 'Home') ? workoutLogPalette.highlight : palette.border 
              }
            ]}
            onPress={() => setGymSelectorVisible(true)}
          >
            <View style={styles.locationButtonContent}>
              <Ionicons 
                name={formData.location === 'Home' ? "home-outline" : "fitness-outline"} 
                size={24} 
                color={(formData.gym_id || formData.location === 'Home') ? workoutLogPalette.highlight : palette.text_tertiary} 
              />
              
              <View style={styles.locationTextContainer}>
                {formData.gym_id && formData.gym_name ? (
                  <>
                    <Text style={[styles.locationMainText, { color: workoutLogPalette.text }]}>
                      {formData.gym_name}
                    </Text>
                    <Text style={[styles.locationSubText, { color: palette.text_secondary }]}>
                      {formData.location}
                    </Text>
                  </>
                ) : formData.location === 'Home' ? (
                  <>
                    <Text style={[styles.locationMainText, { color: workoutLogPalette.text }]}>
                      {t('at_home')}
                    </Text>
                    <Text style={[styles.locationSubText, { color: palette.text_secondary }]}>
                      {t('workout_at_home_or_anywhere')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.locationMainText, { color: palette.text_secondary }]}>
                      {t('select_location')}
                    </Text>
                    {preferredGym && (
                      <Text style={[styles.locationSubText, { color: palette.text_tertiary }]}>
                        {t('preferred')}: {preferredGym.name}
                      </Text>
                    )}
                  </>
                )}
              </View>
              
              <Ionicons name="chevron-forward" size={20} color={palette.text_tertiary} />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Gym Selection Modal */}
        <GymSelectionModal
          visible={gymSelectorVisible}
          onClose={() => setGymSelectorVisible(false)}
          onSelectGym={handleGymSelection}
          selectedGym={selectedGym}
        />
        
        {/* Duration Selection Modal */}
        <Modal
          visible={showDurationPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDurationPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.durationModalContent, { backgroundColor: palette.page_background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setShowDurationPicker(false)}
                >
                  <Ionicons name="close" size={24} color={workoutLogPalette.text} />
                </TouchableOpacity>
                
                <Text style={[styles.modalTitle, { color: workoutLogPalette.text }]}>
                  {t('select_duration')}
                </Text>
                
                <View style={styles.modalClose} />
              </View>
              
              <FlatList
                data={durationOptions}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.durationOption,
                      { 
                        backgroundColor: palette.card_background,
                        borderBottomColor: palette.border 
                      },
                      formData.duration_minutes === item && { backgroundColor: `${workoutLogPalette.highlight}15` }
                    ]}
                    onPress={() => handleDurationChange(item)}
                  >
                    <Text style={[
                      styles.durationOptionText,
                      { color: formData.duration_minutes === item ? workoutLogPalette.highlight : workoutLogPalette.text }
                    ]}>
                      {formatDuration(item)}
                    </Text>
                    {formData.duration_minutes === item && (
                      <Ionicons name="checkmark" size={20} color={workoutLogPalette.highlight} />
                    )}
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.durationList}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  dateTimeText: {
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  // Location Styles
  locationButton: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  locationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  locationMainText: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationSubText: {
    fontSize: 14,
    marginTop: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  modalClose: {
    padding: 8,
  },
  // Duration Modal Styles
  durationModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  durationList: {
    paddingBottom: 20,
  },
  durationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  durationOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Step2DateLocation;