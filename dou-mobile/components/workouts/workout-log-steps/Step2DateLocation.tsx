import React, { useState, useEffect, useMemo } from 'react';
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
  Dimensions,
  TextInput,
  FlatList
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

type GymType = {
  id: number;
  name: string;
  location: string;
  [key: string]: any;
};

const { width } = Dimensions.get('window');

const Step2DateLocation = ({ formData, updateFormData, errors }: Step2DateLocationProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // State for Date & Time pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // State for gym selector
  const [gymSelectorVisible, setGymSelectorVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGymChain, setSelectedGymChain] = useState<string | null>(null);
  
  // Duration state
  const [durationAnimation] = useState(new Animated.Value(formData.duration_minutes || 45));
  
  // Get preferred gym from user
  const [preferredGym, setPreferredGym] = useState<GymType | null>(null);
  
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
  
  // Clear gym chain selection
  const clearGymChainSelection = () => {
    setSelectedGymChain(null);
    setSearchQuery('');
  };
  
  // Handle gym selection
  const handleGymSelection = (gym?: GymType) => {
    if (gym) {
      updateFormData({ 
        gym_id: gym.id,
        gym_name: gym.name,
        location: gym.location
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
      {/* Date and Time cards (side by side) */}
      <View style={styles.rowContainer}>
        {/* Date card */}
        <View style={[styles.card, styles.halfCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={20} color="#16a34a" />
            <Text style={styles.cardTitle}>{t('date')}</Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.dateTimeButton,
              errors.date && styles.inputError
            ]}
            onPress={toggleDatePicker}
          >
            <Text style={styles.dateTimeText}>{formatDate(formData.date)}</Text>
            <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
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
        <View style={[styles.card, styles.halfCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={20} color="#16a34a" />
            <Text style={styles.cardTitle}>{t('time')}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={toggleTimePicker}
          >
            <Text style={styles.dateTimeText}>{formatTime(formData.date)}</Text>
            <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
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
      </View>
      
      {/* Duration card with gauge */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="hourglass-outline" size={20} color="#16a34a" />
          <Text style={styles.cardTitle}>
            {t('duration')} 
            <Text style={styles.durationIndicator}> • {formData.duration_minutes} {t('min')}</Text>
          </Text>
        </View>
        
        {/* Duration gauge with touch interaction */}
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
          <View style={styles.durationTicks}>
            {[0, 30, 60, 90, 120].map(tick => (
              <View key={tick} style={styles.durationTick}>
                <Text style={styles.durationTickText}>{tick}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      
      {/* Location card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="location-outline" size={20} color="#16a34a" />
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
              <View style={styles.selectedGymInfo}>
                <Text style={styles.selectedGymName}>
                  {formData.gym_name}
                </Text>
                <Text style={styles.selectedGymLocation}>
                  {formData.location}
                </Text>
              </View>
            )}
            
            {!formData.gym_id && preferredGym && (
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
                                {formData.gym_id === item.id && (
                                  <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
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
                            {formData.gym_id === item.id && (
                              <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
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
            
            {/* Bottom button for home option */}
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
  halfCard: {
    width: '48%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  durationIndicator: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
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
    borderColor: '#EF4444', // red-500
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  // Duration Gauge Styles
  durationGauge: {
    height: 16,
    backgroundColor: '#111827',
    borderRadius: 8,
    overflow: 'visible',
    marginVertical: 20,
    position: 'relative',
  },
  durationFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 8,
  },
  durationTicks: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 0,
    bottom: -20,
  },
  durationTick: {
    alignItems: 'center',
  },
  durationTickText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  // Location Styles
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
    minHeight: 120,
    justifyContent: 'center',
  },
  locationOptionSelected: {
    backgroundColor: '#065f46', // Dark green background for better contrast
    borderColor: '#10b981', // Light green border
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
  // Modal Styles
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
  // Search Styles
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
  // Gym List Styles
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
    backgroundColor: '#16a34a',
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
});

export default Step2DateLocation;