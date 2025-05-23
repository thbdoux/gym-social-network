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
  const { workoutLogPalette, palette } = useTheme();
  
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date and Time cards (side by side) */}
        <View style={styles.rowContainer}>
          {/* Date card */}
          <View style={[
            styles.card, 
            styles.halfCard, 
            { 
              backgroundColor: palette.card_background, 
              borderColor: errors.date ? palette.error : palette.border 
            }
          ]}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={20} color={workoutLogPalette.highlight} />
              <Text style={[styles.cardTitle, { color: workoutLogPalette.text }]}>
                {t('date')}
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
          
          {/* Time card */}
          <View style={[
            styles.card, 
            styles.halfCard,
            { 
              backgroundColor: palette.card_background,
              borderColor: palette.border 
            }
          ]}>
            <View style={styles.cardHeader}>
              <Ionicons name="time-outline" size={20} color={workoutLogPalette.highlight} />
              <Text style={[styles.cardTitle, { color: workoutLogPalette.text }]}>
                {t('time')}
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
              onPress={toggleTimePicker}
            >
              <Text style={[styles.dateTimeText, { color: workoutLogPalette.text }]}>
                {formatTime(formData.date)}
              </Text>
              <Ionicons name="chevron-down" size={16} color={palette.text_tertiary} />
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
              <Text style={[styles.durationIndicator, { color: palette.text_secondary }]}>
                • {formData.duration_minutes} {t('min')}
              </Text>
            </Text>
          </View>
          
          {/* Duration gauge with touch interaction */}
          <View 
            style={[styles.durationGauge, { backgroundColor: palette.input_background }]}
            {...panResponder.panHandlers}
          >
            <Animated.View 
              style={[
                styles.durationFill,
                { 
                  width: durationWidth,
                  backgroundColor: workoutLogPalette.highlight 
                }
              ]} 
            />
            <View style={styles.durationTicks}>
              {[0, 30, 60, 90, 120].map(tick => (
                <View key={tick} style={styles.durationTick}>
                  <Text style={[styles.durationTickText, { color: palette.text_secondary }]}>
                    {tick}
                  </Text>
                </View>
              ))}
            </View>
          </View>
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
          
          <View style={styles.locationOptions}>
            <TouchableOpacity
              style={[
                styles.locationOption,
                { 
                  backgroundColor: palette.input_background,
                  borderColor: formData.gym_id ? workoutLogPalette.highlight : palette.border 
                },
                formData.gym_id && { backgroundColor: palette.input_background }
              ]}
              onPress={() => handleGymSelection()}
            >
              <Ionicons 
                name="fitness-outline" 
                size={24} 
                color={formData.gym_id ? workoutLogPalette.highlight : palette.text_tertiary} 
              />
              <Text style={[
                styles.locationOptionText,
                { color: formData.gym_id ? workoutLogPalette.text : palette.text_secondary }
              ]}>
                {t('gym')}
              </Text>
              
              {formData.gym_id && formData.gym_name && (
                <View style={styles.selectedGymInfo}>
                  <Text style={[styles.selectedGymName, { color: workoutLogPalette.text }]}>
                    {formData.gym_name}
                  </Text>
                  <Text style={[styles.selectedGymLocation, { color: palette.text_secondary }]}>
                    {formData.location}
                  </Text>
                </View>
              )}
              
              {!formData.gym_id && preferredGym && (
                <View style={styles.selectedGymInfo}>
                  <Text style={[styles.preferredGymText, { color: palette.text_secondary }]}>
                    {preferredGym.name}
                  </Text>
                  <Text style={[styles.preferredGymLocation, { color: palette.text_tertiary }]}>
                    {preferredGym.location}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.locationOption,
                { 
                  backgroundColor: palette.input_background,
                  borderColor: formData.location === 'Home' ? workoutLogPalette.highlight : palette.border 
                },
                formData.location === 'Home' && { backgroundColor: palette.input_background }
              ]}
              onPress={handleHomeSelection}
            >
              <Ionicons 
                name="home-outline" 
                size={24} 
                color={formData.location === 'Home' ? workoutLogPalette.highlight : palette.text_tertiary} 
              />
              <Text style={[
                styles.locationOptionText,
                { color: formData.location === 'Home' ? workoutLogPalette.text : palette.text_secondary }
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
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: palette.page_background }]}>
                <View style={[
                  styles.modalHeader, 
                  { borderBottomColor: palette.border }
                ]}>
                  <TouchableOpacity
                    style={styles.modalBackButton}
                    onPress={() => selectedGymChain ? clearGymChainSelection() : setGymSelectorVisible(false)}
                  >
                    <Ionicons 
                      name={selectedGymChain ? "arrow-back" : "close"} 
                      size={24} 
                      color={workoutLogPalette.text} 
                    />
                  </TouchableOpacity>
                  
                  <Text style={[styles.modalTitle, { color: workoutLogPalette.text }]}>
                    {selectedGymChain ? selectedGymChain : t('select_gym')}
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.modalClose}
                    onPress={() => setGymSelectorVisible(false)}
                  >
                    <Ionicons name="close" size={24} color={workoutLogPalette.text} />
                  </TouchableOpacity>
                </View>
                
                {/* Search Bar */}
                <View style={[
                  styles.searchContainer,
                  { 
                    backgroundColor: palette.input_background,
                    borderColor: palette.border 
                  }
                ]}>
                  <Ionicons name="search" size={20} color={palette.text_tertiary} style={styles.searchIcon} />
                  <TextInput
                    style={[styles.searchInput, { color: workoutLogPalette.text }]}
                    placeholder={t('search_gyms')}
                    placeholderTextColor={palette.text_tertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery !== '' && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color={palette.text_tertiary} />
                    </TouchableOpacity>
                  )}
                </View>
                
                {gymsLoading ? (
                  <View style={styles.loaderContainer}>
                    <Text style={[styles.loadingText, { color: palette.text_tertiary }]}>
                      {t('loading_gyms')}
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Show gym chains or locations based on selection state */}
                    {!selectedGymChain ? (
                      // Show list of gym chains (names)
                      <>
                        {filteredGyms.length === 0 ? (
                          <View style={styles.noResultsContainer}>
                            <Text style={[styles.noResultsText, { color: palette.text_tertiary }]}>
                              {t('no_gyms_found')}
                            </Text>
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
                                    style={[
                                      styles.gymChainItem,
                                      { 
                                        backgroundColor: palette.card_background,
                                        borderColor: palette.border 
                                      }
                                    ]}
                                    onPress={() => setSelectedGymChain(item)}
                                  >
                                    <View style={styles.gymChainInfo}>
                                      <Text style={[styles.gymChainName, { color: workoutLogPalette.text }]}>
                                        {item}
                                      </Text>
                                      <Text style={[styles.gymChainCount, { color: palette.text_secondary }]}>
                                        {gyms.filter(gym => gym.name === item).length} {t('locations')}
                                      </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={palette.text_tertiary} />
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
                                    style={[
                                      styles.gymItem,
                                      { 
                                        backgroundColor: palette.card_background,
                                        borderColor: palette.border 
                                      }
                                    ]}
                                    onPress={() => handleGymSelection(item)}
                                  >
                                    <View style={styles.gymInfo}>
                                      <Text style={[styles.gymName, { color: workoutLogPalette.text }]}>
                                        {item.name}
                                      </Text>
                                      <Text style={[styles.gymAddress, { color: palette.text_secondary }]}>
                                        {item.location}
                                      </Text>
                                    </View>
                                    {formData.gym_id === item.id && (
                                      <Ionicons name="checkmark-circle" size={24} color={workoutLogPalette.highlight} />
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
                            <Text style={[styles.noResultsText, { color: palette.text_tertiary }]}>
                              {t('no_locations_found')}
                            </Text>
                          </View>
                        ) : (
                          <FlatList
                            data={filteredGyms}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                style={[
                                  styles.gymItem,
                                  { 
                                    backgroundColor: palette.card_background,
                                    borderColor: palette.border 
                                  }
                                ]}
                                onPress={() => handleGymSelection(item)}
                              >
                                <View style={styles.gymInfo}>
                                  <Text style={[styles.gymAddress, { color: palette.text_secondary }]}>
                                    {item.location}
                                  </Text>
                                </View>
                                {formData.gym_id === item.id && (
                                  <Ionicons name="checkmark-circle" size={24} color={workoutLogPalette.highlight} />
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
                  style={[
                    styles.customLocationOption,
                    { backgroundColor: workoutLogPalette.highlight }
                  ]}
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
          </KeyboardAvoidingView>
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
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
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
    marginLeft: 8,
  },
  durationIndicator: {
    fontSize: 14,
    fontWeight: '400',
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
  // Duration Gauge Styles
  durationGauge: {
    height: 16,
    borderRadius: 8,
    overflow: 'visible',
    marginVertical: 20,
    position: 'relative',
  },
  durationFill: {
    height: '100%',
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
    fontSize: 12,
  },
  // Location Styles
  locationOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationOption: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 120,
    justifyContent: 'center',
  },
  locationOptionText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  selectedGymInfo: {
    marginTop: 12,
    alignItems: 'center',
  },
  selectedGymName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedGymLocation: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  preferredGymText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  preferredGymLocation: {
    fontSize: 12,
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
  },
  modalBackButton: {
    padding: 8,
    borderRadius: 16,
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
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
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
    fontSize: 16,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
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
    borderWidth: 1,
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
  },
  gymChainCount: {
    fontSize: 14,
    marginTop: 4,
  },
  gymItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
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
    marginBottom: 4,
  },
  gymAddress: {
    fontSize: 14,
  },
  customLocationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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