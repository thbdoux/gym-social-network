import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Modal,
  Dimensions,
  FlatList
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { GroupWorkoutFormData } from '../GroupWorkoutWizard';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useGyms } from '../../../hooks/query/useGymQuery';

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

const { width } = Dimensions.get('window');

const Step3Schedule = ({ formData, updateFormData, errors, user }: Step3ScheduleProps) => {
  const { t } = useLanguage();
  
  // State for Date & Time pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // State for gym selector
  const [gymSelectorVisible, setGymSelectorVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGymChain, setSelectedGymChain] = useState<string | null>(null);
  
  // Get preferred gym from user
  const [preferredGym, setPreferredGym] = useState<GymType | null>(null);
  
  // Get gyms from hook
  const { data: gyms = [], isLoading: gymsLoading } = useGyms();
  
  // Extract unique gym chains (names)
  const gymChains = useMemo(() => {
    if (!gyms.length) return [];
    const uniqueGymNames = [...new Set(gyms.map(gym => gym.name))];
    return uniqueGymNames.sort();
  }, [gyms]);
  
  // Filter gyms based on search query and selected gym chain
  const filteredGyms = useMemo(() => {
    if (!gyms.length) return [];
    
    return gyms.filter(gym => {
      const matchesSearch = searchQuery === '' || 
        gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gym.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesChain = selectedGymChain === null || gym.name === selectedGymChain;
      
      return matchesSearch && matchesChain;
    });
  }, [gyms, searchQuery, selectedGymChain]);
  
  // Filter locations based on selected gym chain
  const locationsForSelectedChain = useMemo(() => {
    if (!gyms.length || !selectedGymChain) return [];
    
    const locations = gyms
      .filter(gym => gym.name === selectedGymChain)
      .map(gym => gym.location);
    
    return [...new Set(locations)].sort();
  }, [gyms, selectedGymChain]);
  
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
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
      updateFormData({ scheduled_date: selectedDate });
    }
  };
  
  // Handle time change
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    
    if (selectedTime) {
      // Format time for display and storage
      const formattedTime = selectedTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
      
      updateFormData({ time_string: formattedTime });
    }
  };
  
  // Handle duration change
  const handleDurationChange = (minutes: number) => {
    if (minutes >= 15 && minutes <= 180) {
      updateFormData({ duration_minutes: minutes });
    }
  };
  
  // Clear gym chain selection
  const clearGymChainSelection = () => {
    setSelectedGymChain(null);
    setSearchQuery('');
  };
  
  // Handle gym selection
  const handleGymSelection = (gym?: GymType) => {
    if (gym) {
      updateFormData({ 
        gym: gym.id,
        gym_name: gym.name,
        location: gym.location,
        custom_location: undefined
      });
      setGymSelectorVisible(false);
    } else {
      // Show gym selector modal
      setGymSelectorVisible(true);
      if (formData.gym_name) {
        setSelectedGymChain(formData.gym_name);
      }
    }
  };
  
  // Handle home selection
  const handleHomeSelection = () => {
    updateFormData({ 
      gym: undefined,
      gym_name: undefined,
      location: 'Home',
      custom_location: undefined
    });
  };
  
  // Handle custom location
  const handleCustomLocation = (location: string) => {
    updateFormData({
      gym: undefined,
      gym_name: undefined,
      location: location
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Date and Time cards (side by side) */}
      <View style={styles.rowContainer}>
        {/* Date card */}
        <View style={[styles.card, styles.halfCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={20} color="#f97316" />
            <Text style={styles.cardTitle}>{t('date')}</Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.dateTimeButton,
              errors.scheduled_date && styles.inputError
            ]}
            onPress={toggleDatePicker}
          >
            <Text style={styles.dateTimeText}>
              {formatDate(formData.scheduled_date)}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          
          {errors.scheduled_date ? (
            <Text style={styles.errorText}>{errors.scheduled_date}</Text>
          ) : null}
          
          {showDatePicker && (
            <DateTimePicker
              value={formData.scheduled_date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()} // Can't schedule in the past
            />
          )}
        </View>
        
        {/* Time card */}
        <View style={[styles.card, styles.halfCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={20} color="#f97316" />
            <Text style={styles.cardTitle}>{t('time')}</Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.dateTimeButton,
              errors.time_string && styles.inputError
            ]}
            onPress={toggleTimePicker}
          >
            <Text style={styles.dateTimeText}>{formData.time_string}</Text>
            <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          
          {errors.time_string ? (
            <Text style={styles.errorText}>{errors.time_string}</Text>
          ) : null}
          
          {showTimePicker && (
            <DateTimePicker
              value={new Date(`2021-01-01T${formData.time_string}:00`)}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>
      </View>
      
      {/* Location card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="location-outline" size={20} color="#f97316" />
          <Text style={styles.cardTitle}>{t('location')}</Text>
        </View>
        
        <View style={styles.locationOptions}>
          <TouchableOpacity
            style={[
              styles.locationOption,
              formData.gym && styles.locationOptionSelected
            ]}
            onPress={() => handleGymSelection()}
          >
            <Ionicons 
              name="fitness-outline" 
              size={24} 
              color={formData.gym ? '#FFFFFF' : '#9CA3AF'} 
            />
            <Text style={[
              styles.locationOptionText,
              formData.gym && styles.locationOptionTextSelected
            ]}>
              {t('gym')}
            </Text>
            
            {formData.gym && formData.gym_name && (
              <View style={styles.selectedGymInfo}>
                <Text style={styles.selectedGymName}>
                  {formData.gym_name}
                </Text>
                <Text style={styles.selectedGymLocation}>
                  {formData.location}
                </Text>
              </View>
            )}
            
            {!formData.gym && preferredGym && (
              <View style={styles.selectedGymInfo}>
                <Text style={styles.preferredGymText}>
                  {preferredGym.name}
                </Text>
                <Text style={styles.preferredGymLocation}>
                  {preferredGym.location}
                </Text>
              </View>
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
        
        {/* Custom location input */}
        <TouchableOpacity
          style={[
            styles.customLocationContainer,
            !formData.gym && formData.location !== 'Home' && styles.customLocationContainerSelected
          ]}
          onPress={() => {
            if (!formData.location || formData.location === 'Home' || formData.gym) {
              handleCustomLocation('');
            }
          }}
        >
          <Ionicons 
            name="location-outline" 
            size={24} 
            color={!formData.gym && formData.location !== 'Home' ? '#f97316' : '#9CA3AF'} 
          />
          
          <TextInput
            style={[
              styles.customLocationInput,
              !formData.gym && formData.location !== 'Home' && styles.customLocationInputActive
            ]}
            placeholder={t('enter_custom_location')}
            placeholderTextColor="#9CA3AF"
            value={!formData.gym && formData.location !== 'Home' ? formData.location : ''}
            onChangeText={handleCustomLocation}
            editable={!formData.gym && formData.location !== 'Home'}
          />
        </TouchableOpacity>
      </View>
      
      {/* Duration card - moved below location and made smaller */}
      <View style={styles.smallCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="hourglass-outline" size={20} color="#f97316" />
          <Text style={styles.cardTitle}>{t('duration')}</Text>
        </View>
        
        <View style={styles.durationContainer}>
          <TouchableOpacity
            style={styles.durationButton}
            onPress={() => handleDurationChange(formData.duration_minutes - 15)}
            disabled={formData.duration_minutes <= 15}
          >
            <Ionicons 
              name="remove" 
              size={20} 
              color={formData.duration_minutes <= 15 ? '#6B7280' : '#FFFFFF'} 
            />
          </TouchableOpacity>
          
          <View style={styles.durationDisplayContainer}>
            <Text style={styles.durationDisplay}>{formData.duration_minutes}</Text>
            <Text style={styles.durationUnit}>{t('minutes')}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.durationButton}
            onPress={() => handleDurationChange(formData.duration_minutes + 15)}
            disabled={formData.duration_minutes >= 180}
          >
            <Ionicons 
              name="add" 
              size={20} 
              color={formData.duration_minutes >= 180 ? '#6B7280' : '#FFFFFF'} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Quick duration selectors */}
        <View style={styles.quickDurationContainer}>
          {[30, 45, 60, 90].map(duration => (
            <TouchableOpacity
              key={duration}
              style={[
                styles.quickDurationButton,
                formData.duration_minutes === duration && styles.quickDurationButtonSelected
              ]}
              onPress={() => handleDurationChange(duration)}
            >
              <Text style={[
                styles.quickDurationText,
                formData.duration_minutes === duration && styles.quickDurationTextSelected
              ]}>
                {duration}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Enhanced Gym selector modal */}
      <Modal
        visible={gymSelectorVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setGymSelectorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => selectedGymChain ? clearGymChainSelection() : setGymSelectorVisible(false)}
              >
                <Ionicons 
                  name={selectedGymChain ? "arrow-back" : "close"} 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
              
              <Text style={styles.modalTitle}>
                {selectedGymChain ? selectedGymChain : t('select_gym')}
              </Text>
              
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setGymSelectorVisible(false)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('search_gyms')}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Gym List Content */}
            {gymsLoading ? (
              <View style={styles.loaderContainer}>
                <Text style={styles.loadingText}>{t('loading_gyms')}</Text>
              </View>
            ) : (
              <>
                {/* Show gym chains or locations based on selection state */}
                {!selectedGymChain ? (
                  // Show list of gym chains (names)
                  <>
                    {filteredGyms.length === 0 ? (
                      <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsText}>{t('no_gyms_found')}</Text>
                      </View>
                    ) : (
                      <>
                        {searchQuery === '' ? (
                          // Show categorized gym chains if no search
                          <FlatList
                            data={gymChains}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                style={styles.gymChainItem}
                                onPress={() => setSelectedGymChain(item)}
                              >
                                <View style={styles.gymChainInfo}>
                                  <Text style={styles.gymChainName}>{item}</Text>
                                  <Text style={styles.gymChainCount}>
                                    {gyms.filter(gym => gym.name === item).length} {t('locations')}
                                  </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                              </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.gymList}
                          />
                        ) : (
                          // Show search results
                          <FlatList
                            data={filteredGyms}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                style={styles.gymItem}
                                onPress={() => handleGymSelection(item)}
                              >
                                <View style={styles.gymInfo}>
                                  <Text style={styles.gymName}>{item.name}</Text>
                                  <Text style={styles.gymAddress}>{item.location}</Text>
                                </View>
                                {formData.gym === item.id && (
                                  <Ionicons name="checkmark-circle" size={24} color="#f97316" />
                                )}
                              </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.gymList}
                          />
                        )}
                      </>
                    )}
                  </>
                ) : (
                  // Show locations for selected gym chain
                  <>
                    {filteredGyms.length === 0 ? (
                      <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsText}>{t('no_locations_found')}</Text>
                      </View>
                    ) : (
                      <FlatList
                        data={filteredGyms}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.gymItem}
                            onPress={() => handleGymSelection(item)}
                          >
                            <View style={styles.gymInfo}>
                              <Text style={styles.gymAddress}>{item.location}</Text>
                            </View>
                            {formData.gym === item.id && (
                              <Ionicons name="checkmark-circle" size={24} color="#f97316" />
                            )}
                          </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.gymList}
                      />
                    )}
                  </>
                )}
              </>
            )}
            
            {/* Home option */}
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
    paddingBottom: 32,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  smallCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  halfCard: {
    width: '48%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 12,
  },
  dateTimeText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  // Duration styles - smaller version
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 12,
  },
  durationButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 18,
  },
  durationDisplayContainer: {
    alignItems: 'center',
  },
  durationDisplay: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  durationUnit: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  quickDurationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickDurationButton: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: '#111827',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#374151',
  },
  quickDurationButtonSelected: {
    backgroundColor: '#4B5563',
    borderColor: '#9CA3AF',
  },
  quickDurationText: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  quickDurationTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  // Location styles
  locationOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  locationOption: {
    width: '48%',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
    minHeight: 120,
    justifyContent: 'center',
  },
  locationOptionSelected: {
    backgroundColor: '#7c2d12',
    borderColor: '#f97316',
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
  selectedGymInfo: {
    marginTop: 12,
    alignItems: 'center',
  },
  selectedGymName: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedGymLocation: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 4,
    textAlign: 'center',
  },
  preferredGymText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
  },
  preferredGymLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  customLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  customLocationContainerSelected: {
    borderColor: '#f97316',
    backgroundColor: '#7c2d12',
  },
  customLocationInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
  customLocationInputActive: {
    color: '#FFFFFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  modalBackButton: {
    padding: 8,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  modalClose: {
    padding: 8,
  },
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    padding: 0,
  },
  // Gym list styles
  gymList: {
    padding: 16,
    paddingTop: 0,
  },
  gymChainItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  gymChainInfo: {
    flex: 1,
  },
  gymChainName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  gymChainCount: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  gymItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
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
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    marginTop: 'auto',
  },
  customLocationOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  // Additional styles from Step2DateLocation
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Step3Schedule;