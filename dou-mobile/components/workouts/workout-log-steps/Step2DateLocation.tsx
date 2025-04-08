import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Modal,
  PanResponder,
  Dimensions
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { WorkoutLogFormData } from '../WorkoutLogWizard';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useGyms } from '../../../hooks/query/useGymQuery';
import { useAuth } from '../../../hooks/useAuth';

type Step2DateLocationProps = {
  formData: WorkoutLogFormData;
  updateFormData: (data: Partial<WorkoutLogFormData>) => void;
  errors: Record<string, string>;
};

const { width } = Dimensions.get('window');

const Step2DateLocation = ({ formData, updateFormData, errors }: Step2DateLocationProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // State for Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // State for gym selector
  const [gymSelectorVisible, setGymSelectorVisible] = useState(false);
  
  // Duration state
  const [durationAnimation] = useState(new Animated.Value(formData.duration_minutes || 45));
  
  // Get preferred gym from user
  const [preferredGym, setPreferredGym] = useState<any>(null);
  
  // Get gyms from hook
  const { data: gyms = [], isLoading: gymsLoading } = useGyms();
  
  // Create PanResponder for duration gauge
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt, gestureState) => {
      const { locationX } = evt.nativeEvent;
      handleDurationSliderChange(locationX);
    },
    onPanResponderMove: (evt, gestureState) => {
      const { locationX } = evt.nativeEvent;
      handleDurationSliderChange(locationX);
    },
    onPanResponderRelease: () => {},
  });
  
  // Handle duration slider change
  const handleDurationSliderChange = (positionX: number) => {
    // Get the gauge element width
    const gaugeWidth = width - 80; // Approximate width based on padding/margins
    
    // Calculate percentage of the gauge that was touched
    const percentage = Math.max(0, Math.min(1, positionX / gaugeWidth));
    
    // Calculate duration based on percentage (max 120 minutes)
    const newDuration = Math.round(percentage * 120);
    
    // Update form data
    updateFormData({ duration_minutes: newDuration === 0 ? 5 : newDuration }); // Minimum 5 minutes
    
    // Animate duration gauge
    Animated.timing(durationAnimation, {
      toValue: newDuration === 0 ? 5 : newDuration,
      duration: 100,
      useNativeDriver: false
    }).start();
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
            location: undefined
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
    if (showTimePicker) setShowTimePicker(false);
  };
  
  // Toggle time picker
  const toggleTimePicker = () => {
    setShowTimePicker(!showTimePicker);
    if (showDatePicker) setShowDatePicker(false);
  };
  
  // Handle date change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      const currentTime = formData.date;
      selectedDate.setHours(currentTime.getHours());
      selectedDate.setMinutes(currentTime.getMinutes());
      
      updateFormData({ date: selectedDate });
    }
  };
  
  // Handle time change
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    
    if (selectedTime) {
      const newDate = new Date(formData.date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      
      updateFormData({ date: newDate });
    }
  };
  
  // Handle duration change
  const handleDurationChange = (minutes: number) => {
    updateFormData({ duration_minutes: minutes });
    
    // Animate duration gauge
    Animated.timing(durationAnimation, {
      toValue: minutes,
      duration: 300,
      useNativeDriver: false
    }).start();
  };
  
  // Quick duration presets
  const durationPresets = [15, 30, 45, 60, 90, 120];
  
  // Handle gym selection
  const handleGymSelection = (gymId?: number, gymName?: string) => {
    if (gymId && gymName) {
      updateFormData({ 
        gym_id: gymId,
        gym_name: gymName,
        location: undefined
      });
      setGymSelectorVisible(false);
    } else {
      // Show gym selector modal
      setGymSelectorVisible(true);
    }
  };
  
  // Handle home selection
  const handleHomeSelection = () => {
    updateFormData({ 
      gym_id: undefined,
      gym_name: undefined,
      location: 'Home'
    });
  };
  
  const durationWidth = durationAnimation.interpolate({
    inputRange: [0, 120],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp'
  });

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Date card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar-outline" size={22} color="#16a34a" />
          <Text style={styles.cardTitle}>{t('date')}</Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.dateButton,
            errors.date && styles.inputError
          ]}
          onPress={toggleDatePicker}
        >
          <Text style={styles.dateText}>{formatDate(formData.date)}</Text>
          <Ionicons name={showDatePicker ? "chevron-up" : "chevron-down"} size={16} color="#9CA3AF" />
        </TouchableOpacity>
        
        {errors.date ? (
          <Text style={styles.errorText}>{errors.date}</Text>
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
      
      {/* Time card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="time-outline" size={22} color="#16a34a" />
          <Text style={styles.cardTitle}>{t('time')}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.timeButton}
          onPress={toggleTimePicker}
        >
          <Text style={styles.timeText}>{formatTime(formData.date)}</Text>
          <Ionicons name={showTimePicker ? "chevron-up" : "chevron-down"} size={16} color="#9CA3AF" />
        </TouchableOpacity>
        
        {showTimePicker && (
          <DateTimePicker
            value={formData.date}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}
      </View>
      
      {/* Duration card with gauge */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="hourglass-outline" size={22} color="#16a34a" />
          <Text style={styles.cardTitle}>{t('duration')}</Text>
        </View>
        
        <View style={styles.durationContainer}>
          {/* Duration gauge - now with touch interaction */}
          <View 
            style={styles.durationGauge}
            {...panResponder.panHandlers}
          >
            <Animated.View 
              style={[
                styles.durationFill,
                { width: durationWidth }
              ]} 
            />
          </View>
          
          {/* Duration value */}
          <View style={styles.durationValue}>
            <Text style={styles.durationNumber}>{formData.duration_minutes}</Text>
            <Text style={styles.durationUnit}>{t('minutes')}</Text>
          </View>
        </View>
        
        {/* Duration presets */}
        <View style={styles.durationPresets}>
          {durationPresets.map(minutes => (
            <TouchableOpacity
              key={minutes}
              style={[
                styles.durationPreset,
                formData.duration_minutes === minutes && styles.durationPresetSelected
              ]}
              onPress={() => handleDurationChange(minutes)}
            >
              <Text style={[
                styles.durationPresetText,
                formData.duration_minutes === minutes && styles.durationPresetTextSelected
              ]}>
                {minutes}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Location card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="location-outline" size={22} color="#16a34a" />
          <Text style={styles.cardTitle}>{t('location')}</Text>
        </View>
        
        <View style={styles.locationOptions}>
          <TouchableOpacity
            style={[
              styles.locationOption,
              formData.gym_id && styles.locationOptionSelected
            ]}
            onPress={() => handleGymSelection()}
          >
            <Ionicons 
              name="fitness-outline" 
              size={24} 
              color={formData.gym_id ? '#FFFFFF' : '#9CA3AF'} 
            />
            <Text style={[
              styles.locationOptionText,
              formData.gym_id && styles.locationOptionTextSelected
            ]}>
              {t('gym')}
            </Text>
            
            {formData.gym_id && formData.gym_name && (
              <Text style={styles.preferredGymText}>
                {formData.gym_name}
              </Text>
            )}
            
            {!formData.gym_id && preferredGym && (
              <Text style={styles.preferredGymText}>
                {preferredGym.name}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.locationOption,
              formData.location === 'Home' && styles.locationOptionSelected
            ]}
            onPress={handleHomeSelection}
          >
            <Ionicons 
              name="home-outline" 
              size={24} 
              color={formData.location === 'Home' ? '#FFFFFF' : '#9CA3AF'} 
            />
            <Text style={[
              styles.locationOptionText,
              formData.location === 'Home' && styles.locationOptionTextSelected
            ]}>
              {t('at_home')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Gym selector modal */}
      <Modal
        visible={gymSelectorVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setGymSelectorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('select_gym')}</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setGymSelectorVisible(false)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.gymList}>
              {gymsLoading ? (
                <Text style={styles.loadingText}>{t('loading_gyms')}</Text>
              ) : gyms.length === 0 ? (
                <View style={styles.noGymsContainer}>
                  <Text style={styles.noGymsText}>{t('no_gyms_found')}</Text>
                  <TouchableOpacity
                    style={styles.customLocationButton}
                    onPress={() => {
                      handleHomeSelection();
                      setGymSelectorVisible(false);
                    }}
                  >
                    <Text style={styles.customLocationButtonText}>
                      {t('use_home_location')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {gyms.map((gym) => (
                    <TouchableOpacity
                      key={gym.id}
                      style={[
                        styles.gymItem,
                        formData.gym_id === gym.id && styles.gymItemSelected
                      ]}
                      onPress={() => handleGymSelection(gym.id, gym.name)}
                    >
                      <View style={styles.gymInfo}>
                        <Text style={styles.gymName}>{gym.name}</Text>
                        <Text style={styles.gymAddress}>{gym.location}</Text>
                      </View>
                      {formData.gym_id === gym.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.customLocationOption}
              onPress={() => {
                handleHomeSelection();
                setGymSelectorVisible(false);
              }}
            >
              <Ionicons name="home-outline" size={20} color="#FFFFFF" />
              <Text style={styles.customLocationOptionText}>
                {t('workout_at_home')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444', // red-500
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
  },
  timeText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  durationContainer: {
    marginBottom: 16,
  },
  durationGauge: {
    height: 24,
    backgroundColor: '#111827',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  durationFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 12,
  },
  durationValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  durationNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  durationUnit: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  durationPresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  durationPreset: {
    width: '31%',
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  durationPresetSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  durationPresetText: {
    color: '#E5E7EB',
    fontWeight: '600',
  },
  durationPresetTextSelected: {
    color: '#FFFFFF',
  },
  locationOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationOption: {
    width: '48%',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  locationOptionSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  locationOptionText: {
    fontSize: 16,
    color: '#E5E7EB',
    fontWeight: '600',
    marginTop: 8,
  },
  locationOptionTextSelected: {
    color: '#FFFFFF',
  },
  preferredGymText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    minHeight: '60%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalClose: {
    padding: 4,
  },
  gymList: {
    padding: 16,
  },
  loadingText: {
    color: '#9CA3AF',
    textAlign: 'center',
    padding: 20,
  },
  noGymsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noGymsText: {
    color: '#9CA3AF',
    marginBottom: 16,
  },
  customLocationButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  customLocationButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  gymItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  gymItemSelected: {
    borderColor: '#16a34a',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  gymInfo: {
    flex: 1,
  },
  gymName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  gymAddress: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  customLocationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  customLocationOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default Step2DateLocation;