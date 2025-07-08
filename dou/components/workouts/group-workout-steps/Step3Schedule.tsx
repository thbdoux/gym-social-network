import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { GroupWorkoutFormData } from '../GroupWorkoutWizard';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useGyms } from '../../../hooks/query/useGymQuery';
import GymSelectionModal from '../GymSelectionModal';

type Step3ScheduleProps = {
  formData: GroupWorkoutFormData;
  updateFormData: (data: Partial<GroupWorkoutFormData>) => void;
  errors: Record<string, string>;
  user: any;
};

type GymType = {
  id: number;
  name: string;
  location: string;
  [key: string]: any;
};

const Step3Schedule = ({ formData, updateFormData, errors, user }: Step3ScheduleProps) => {
  const { t, language } = useLanguage();
  
  // State for gym selector
  const [gymSelectorVisible, setGymSelectorVisible] = useState(false);
  
  // Get preferred gym from user
  const [preferredGym, setPreferredGym] = useState<GymType | null>(null);
  
  // Get gyms from hook
  const { data: gyms = [], isLoading: gymsLoading } = useGyms();
  
  // Generate duration options in 15-minute steps
  const durationOptions = useMemo(() => {
    const options = [];
    for (let i = 15; i <= 180; i += 15) {
      options.push({ value: i, label: formatDuration(i) });
    }
    return options;
  }, []);
  
  // Format duration for display
  function formatDuration(minutes: number) {
    if (minutes < 60) {
      return `${minutes} ${t('minutes')}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${remainingMinutes}m`;
      }
    }
  }
  
  // Find preferred gym
  useEffect(() => {
    if (gyms.length && user?.preferred_gym) {
      const gym = gyms.find(gym => gym.id === user.preferred_gym);
      if (gym) {
        setPreferredGym(gym);
        
        // If no gym is selected yet, use preferred gym
        if (!formData.gym && !formData.location) {
          updateFormData({ 
            gym: gym.id,
            gym_name: gym.name,
            location: gym.location,
          });
        }
      }
    }
  }, [gyms, user]);
  
  // Get scheduled datetime from formData
  const getScheduledDateTime = () => {
    if (formData.scheduled_date && formData.time_string) {
      const date = new Date(formData.scheduled_date);
      const [hours, minutes] = formData.time_string.split(':').map(num => parseInt(num, 10));
      date.setHours(hours || 12, minutes || 0, 0, 0);
      return date;
    }
    
    if (formData.scheduled_datetime) {
      return new Date(formData.scheduled_datetime);
    }
    
    if (formData.scheduled_date) {
      return new Date(formData.scheduled_date);
    }
    
    // Default to current time + 1 hour
    const defaultDateTime = new Date();
    defaultDateTime.setHours(defaultDateTime.getHours() + 1, 0, 0, 0);
    return defaultDateTime;
  };
  
  // Handle datetime change
  const handleDateTimeChange = (event: any, selectedDateTime?: Date) => {
    if (selectedDateTime) {
      const timeString = selectedDateTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
      
      updateFormData({ 
        scheduled_datetime: selectedDateTime,
        scheduled_date: selectedDateTime,
        time_string: timeString
      });
    }
  };
  
  // Handle duration selection
  const handleDurationChange = (duration: number) => {
    updateFormData({ duration_minutes: duration });
  };
  
  // Handle gym selection from modal
  const handleGymSelection = (gym: GymType | null) => {
    if (gym) {
      updateFormData({ 
        gym: gym.id,
        gym_name: gym.name,
        location: gym.location,
        custom_location: undefined
      });
    } else {
      updateFormData({ 
        gym: undefined,
        gym_name: undefined,
        location: 'Home',
        custom_location: undefined
      });
    }
  };
  
  // Handle custom location
  const handleCustomLocation = (location: string) => {
    updateFormData({
      gym: undefined,
      gym_name: undefined,
      location: location,
      custom_location: location
    });
  };
  
  // Get currently selected gym for modal
  const selectedGym = useMemo(() => {
    if (!formData.gym || !gyms.length) return null;
    return gyms.find(gym => gym.id === formData.gym) || null;
  }, [formData.gym, gyms]);

  // Format gym display text
  const getGymDisplayText = () => {
    if (formData.gym && formData.gym_name) {
      return `${formData.gym_name} - ${formData.location}`;
    } else if (formData.location === 'Home') {
      return t('at_home');
    } else if (formData.custom_location) {
      return formData.custom_location;
    } else {
      return t('select_location');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* DateTime Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar-outline" size={20} color="#f97316" />
          <Text style={styles.cardTitle}>{t('date_and_time')}</Text>
        </View>
        <View style={styles.dateTimeContainer}>
          <DateTimePicker
            value={getScheduledDateTime()}
            mode="datetime"
            display="default"
            locale={language}
            onChange={handleDateTimeChange}
            minimumDate={new Date()}
            style={styles.dateTimePicker}
            textColor="#FFFFFF"
            accentColor="#f97316"
          />
        </View>
        {(errors.scheduled_date || errors.time_string || errors.scheduled_datetime) && (
          <Text style={styles.errorText}>
            {errors.scheduled_date || errors.time_string || errors.scheduled_datetime}
          </Text>
        )}
      </View>
      
      {/* Duration Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="hourglass-outline" size={20} color="#f97316" />
          <Text style={styles.cardTitle}>{t('duration')}</Text>
        </View>
        <View style={styles.pickerWrapper}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.duration_minutes}
              onValueChange={handleDurationChange}
              style={styles.picker}
              dropdownIconColor="#f97316"
              itemStyle={styles.pickerItem}
            >
              {durationOptions.map((option) => (
                <Picker.Item 
                  key={option.value} 
                  label={option.label} 
                  value={option.value}
                  color={Platform.OS === 'ios' ? '#FFFFFF' : '#000000'}
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>
      
      {/* Location Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="location-outline" size={20} color="#f97316" />
          <Text style={styles.cardTitle}>{t('gym_location')}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.locationButton,
            (formData.gym || formData.location === 'Home' || formData.custom_location) && styles.locationButtonSelected
          ]}
          onPress={() => setGymSelectorVisible(true)}
        >
          <View style={styles.locationContent}>
            <Ionicons 
              name={formData.location === 'Home' ? "home" : "fitness"} 
              size={20} 
              color={(formData.gym || formData.location === 'Home' || formData.custom_location) ? "#f97316" : "#6B7280"} 
            />
            <View style={styles.locationTextContainer}>
              <Text style={[
                styles.locationText,
                !(formData.gym || formData.location === 'Home' || formData.custom_location) && styles.locationPlaceholder
              ]}>
                {getGymDisplayText()}
              </Text>
              {preferredGym && !(formData.gym || formData.location === 'Home' || formData.custom_location) && (
                <Text style={styles.preferredText}>
                  {t('preferred')}: {preferredGym.name}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color="#6B7280" />
          </View>
        </TouchableOpacity>
        
        {/* Custom location input */}
        {!formData.gym && formData.location !== 'Home' && (
          <View style={styles.customLocationWrapper}>
            <View style={styles.customLocationContainer}>
              <Ionicons name="create-outline" size={16} color="#f97316" />
              <TextInput
                style={styles.customLocationInput}
                placeholder={t('enter_custom_location')}
                placeholderTextColor="#6B7280"
                value={formData.custom_location || ''}
                onChangeText={handleCustomLocation}
              />
            </View>
          </View>
        )}
      </View>
      
      {/* Gym Selection Modal */}
      <GymSelectionModal
        visible={gymSelectorVisible}
        onClose={() => setGymSelectorVisible(false)}
        onSelectGym={handleGymSelection}
        selectedGym={selectedGym}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginLeft: 10,
  },
  dateTimeContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  dateTimePicker: {
    backgroundColor: 'transparent',
    height: Platform.OS === 'ios' ? 120 : 40,
  },
  pickerWrapper: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    overflow: 'hidden',
  },
  pickerContainer: {
    backgroundColor: 'transparent',
  },
  picker: {
    color: '#F8FAFC',
    backgroundColor: 'transparent',
    height: Platform.OS === 'ios' ? 120 : 50,
  },
  pickerItem: {
    fontSize: 16,
    color: '#F8FAFC',
    height: 120,
  },
  locationButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  locationButtonSelected: {
    borderColor: '#f97316',
    backgroundColor: '#7c2d12',
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F8FAFC',
  },
  locationPlaceholder: {
    color: '#6B7280',
    fontWeight: '400',
  },
  preferredText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  customLocationWrapper: {
    marginTop: 12,
  },
  customLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f97316',
  },
  customLocationInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '400',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 12,
    fontWeight: '500',
  },
});

export default Step3Schedule;