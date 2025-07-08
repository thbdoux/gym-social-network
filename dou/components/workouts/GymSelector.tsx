// components/workouts/GymSelector.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Animated,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { createThemedStyles } from '../../utils/createThemedStyles';
import { useGyms, useAllGymsSearch, useSaveExternalGym } from '../../hooks/query/useGymQuery';
import { type Gym, type ExternalGym } from '../../api/services/gymService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

interface GymSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGymId: number | null;
  onGymSelected: (gym: Gym | ExternalGym | null) => void;
}

const GymSelector: React.FC<GymSelectorProps> = ({
  isOpen,
  onClose,
  selectedGymId,
  onGymSelected,
}) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const styles = themedStyles(palette);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [activeTab, setActiveTab] = useState<'saved' | 'search'>('saved');
  const [searchResults, setSearchResults] = useState(null);
  
  const slideAnim = useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const { data: savedGyms, isLoading: savedGymsLoading } = useGyms();
  const searchMutation = useAllGymsSearch(); // Now a mutation
  const saveExternalGym = useSaveExternalGym();

  const handleSearch = async () => {
    if (!searchQuery.trim() && !searchLocation.trim()) {
      Alert.alert(t('error'), t('enter_search_criteria'));
      return;
    }

    try {
      const result = await searchMutation.mutateAsync({
        q: searchQuery.trim() || undefined,
        location: searchLocation.trim() || undefined,
        include_external: true
      });
      setSearchResults(result);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert(t('error'), t('search_failed'));
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchLocation('');
    setSearchResults(null);
  };

  // Animations
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: BOTTOM_SHEET_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: BOTTOM_SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(onClose);
  };

  const handleGymSelect = (gym: Gym | ExternalGym | null) => {
    onGymSelected(gym);
    handleClose();
  };

  const handleSaveExternalGym = async (gym: ExternalGym) => {
    try {
      const result = await saveExternalGym.mutateAsync(gym);
      Alert.alert(
        t('success'),
        result.created ? t('gym_saved_successfully') : t('gym_already_exists'),
        [{ text: t('ok') }]
      );
      
      if (result.created) {
        setActiveTab('saved');
      }
    } catch (error) {
      Alert.alert(t('error'), t('failed_to_save_gym'), [{ text: t('ok') }]);
    }
  };

  const renderGymItem = ({ item, isExternal = false }: { item: Gym | ExternalGym; isExternal?: boolean }) => {
    const isSelected = !isExternal && selectedGymId === (item as Gym).id;
    
    return (
      <View style={styles.gymItemContainer}>
        <TouchableOpacity
          style={[styles.gymItem, isSelected && styles.selectedGymItem]}
          onPress={() => handleGymSelect(item)}
          activeOpacity={0.7}
        >
          <View style={styles.gymItemContent}>
            <View style={styles.gymItemLeft}>
              <View style={[
                styles.gymIconContainer,
                isSelected && { backgroundColor: palette.accent }
              ]}>
                <Ionicons 
                  name="fitness" 
                  size={20} 
                  color={isSelected ? 'white' : palette.text_secondary} 
                />
              </View>
              <View style={styles.gymItemText}>
                <View style={styles.gymHeader}>
                  <Text style={[
                    styles.gymName,
                    { color: isSelected ? palette.accent : palette.text }
                  ]}>
                    {item.name}
                  </Text>
                  {isExternal && (
                    <View style={[styles.externalBadge, { backgroundColor: palette.layout }]}>
                      <Text style={[styles.externalText, { color: palette.accent }]}>
                        {item.source === 'openstreetmap' ? 'OSM' : 'EXT'}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={12} color={palette.text_secondary} />
                  <Text style={[styles.gymLocation, { color: palette.text_secondary }]}>
                    {item.location}
                  </Text>
                </View>

                {item.rating && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={[styles.ratingText, { color: palette.text_secondary }]}>
                      {item.rating.toFixed(1)}
                    </Text>
                    {item.user_ratings_total && (
                      <Text style={[styles.reviewCount, { color: palette.text_tertiary }]}>
                        ({item.user_ratings_total})
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
            {isSelected && (
              <Ionicons name="checkmark-circle" size={24} color={palette.accent} />
            )}
          </View>
        </TouchableOpacity>

        {isExternal && (
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: palette.accent }]}
            onPress={() => handleSaveExternalGym(item as ExternalGym)}
            disabled={saveExternalGym.isPending}
          >
            {saveExternalGym.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="download-outline" size={16} color="white" />
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSavedGyms = () => {
    if (savedGymsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.accent} />
          <Text style={[styles.loadingText, { color: palette.text_secondary }]}>
            {t('loading_gyms')}
          </Text>
        </View>
      );
    }

    const gymData = [
      // Home workout option
      { 
        id: 0, 
        name: t('home_workout'), 
        location: t('workout_at_home'),
        isHomeOption: true 
      },
      ...(savedGyms || [])
    ];

    return (
      <FlatList
        data={gymData}
        keyExtractor={(item) => item.isHomeOption ? 'home' : item.id.toString()}
        renderItem={({ item }) => {
          if (item.isHomeOption) {
            const isSelected = selectedGymId === null;
            return (
              <TouchableOpacity
                style={[styles.gymItem, isSelected && styles.selectedGymItem]}
                onPress={() => handleGymSelect(null)}
                activeOpacity={0.7}
              >
                <View style={styles.gymItemContent}>
                  <View style={styles.gymItemLeft}>
                    <View style={[
                      styles.gymIconContainer,
                      isSelected && { backgroundColor: palette.accent }
                    ]}>
                      <Ionicons 
                        name="home-outline" 
                        size={20} 
                        color={isSelected ? 'white' : palette.text_secondary} 
                      />
                    </View>
                    <View style={styles.gymItemText}>
                      <Text style={[
                        styles.gymName,
                        { color: isSelected ? palette.accent : palette.text }
                      ]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.gymLocation, { color: palette.text_secondary }]}>
                        {item.location}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={palette.accent} />
                  )}
                </View>
              </TouchableOpacity>
            );
          }
          return renderGymItem({ item, isExternal: false });
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gymList}
        ListEmptyComponent={
          !savedGymsLoading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="fitness-outline" size={48} color={palette.text_tertiary} />
              <Text style={[styles.emptyTitle, { color: palette.text }]}>
                {t('no_saved_gyms')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: palette.text_secondary }]}>
                {t('search_and_save_gyms')}
              </Text>
            </View>
          )
        }
      />
    );
  };

  const renderSearchResults = () => {
    // Show loading state
    if (searchMutation.isPending) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.accent} />
          <Text style={[styles.loadingText, { color: palette.text_secondary }]}>
            {t('searching_gyms')}
          </Text>
        </View>
      );
    }

    // Show initial state (no search performed)
    if (!searchResults) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color={palette.text_tertiary} />
          <Text style={[styles.emptyTitle, { color: palette.text }]}>
            {t('search_for_gyms')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: palette.text_secondary }]}>
            {t('enter_gym_name_or_location')}
          </Text>
        </View>
      );
    }

    // Show search results
    const allResults = [
      ...searchResults.local_gyms.map(gym => ({ ...gym, isExternal: false })),
      ...searchResults.external_gyms.map(gym => ({ ...gym, isExternal: true }))
    ];

    return (
      <FlatList
        data={allResults}
        keyExtractor={(item) => item.isExternal ? item.external_id : item.id.toString()}
        renderItem={({ item }) => renderGymItem({ item, isExternal: item.isExternal })}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gymList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={palette.text_tertiary} />
            <Text style={[styles.emptyTitle, { color: palette.text }]}>
              {t('no_gyms_found')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: palette.text_secondary }]}>
              {t('try_different_search')}
            </Text>
          </View>
        }
      />
    );
  };


  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropAnim }]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            onPress={handleClose}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
              style={styles.keyboardView}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              {/* Header - remains the same */}
              <View style={[styles.header, { backgroundColor: palette.page_background }]}>
                <View style={[styles.dragHandle, { backgroundColor: palette.text_tertiary }]} />
                
                <View style={styles.headerContent}>
                  <Text style={[styles.headerTitle, { color: palette.text }]}>
                    {t('select_gym')}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                  >
                    <Ionicons name="close" size={24} color={palette.text} />
                  </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={[styles.tabContainer, { backgroundColor: palette.card_background }]}>
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      activeTab === 'saved' && { backgroundColor: palette.accent }
                    ]}
                    onPress={() => setActiveTab('saved')}
                  >
                    <Ionicons
                      name="bookmarks"
                      size={16}
                      color={activeTab === 'saved' ? 'white' : palette.text_secondary}
                    />
                    <Text style={[
                      styles.tabText,
                      { color: activeTab === 'saved' ? 'white' : palette.text_secondary }
                    ]}>
                      {t('saved')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tab,
                      activeTab === 'search' && { backgroundColor: palette.accent }
                    ]}
                    onPress={() => setActiveTab('search')}
                  >
                    <Ionicons
                      name="search"
                      size={16}
                      color={activeTab === 'search' ? 'white' : palette.text_secondary}
                    />
                    <Text style={[
                      styles.tabText,
                      { color: activeTab === 'search' ? 'white' : palette.text_secondary }
                    ]}>
                      {t('search')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* UPDATED: Search Inputs with Search Button */}
              {activeTab === 'search' && (
                <View style={styles.searchContainer}>
                  <View style={[styles.searchInputContainer, { 
                    backgroundColor: palette.input_background,
                    borderColor: palette.border 
                  }]}>
                    <Ionicons name="search" size={18} color={palette.text_secondary} />
                    <TextInput
                      style={[styles.searchInput, { color: palette.text }]}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder={t('search_gym_name_brand')}
                      placeholderTextColor={palette.text_tertiary}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {searchQuery && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={palette.text_secondary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={[styles.searchInputContainer, { 
                    backgroundColor: palette.input_background,
                    borderColor: palette.border 
                  }]}>
                    <Ionicons name="location" size={18} color={palette.text_secondary} />
                    <TextInput
                      style={[styles.searchInput, { color: palette.text }]}
                      value={searchLocation}
                      onChangeText={setSearchLocation}
                      placeholder={t('search_location')}
                      placeholderTextColor={palette.text_tertiary}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {searchLocation && (
                      <TouchableOpacity onPress={() => setSearchLocation('')}>
                        <Ionicons name="close-circle" size={18} color={palette.text_secondary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* ADDED: Search Button Row */}
                  <View style={styles.searchButtonRow}>
                    <TouchableOpacity
                      style={[styles.searchButton, { backgroundColor: palette.accent }]}
                      onPress={handleSearch}
                      disabled={searchMutation.isPending}
                    >
                      {searchMutation.isPending ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Ionicons name="search" size={16} color="white" />
                          <Text style={styles.searchButtonText}>{t('search')}</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {searchResults && (
                      <TouchableOpacity
                        style={[styles.clearButton, { backgroundColor: palette.card_background, borderColor: palette.border }]}
                        onPress={handleClearSearch}
                      >
                        <Ionicons name="refresh" size={16} color={palette.text_secondary} />
                        <Text style={[styles.clearButtonText, { color: palette.text_secondary }]}>
                          {t('clear')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* Content */}
              <View style={styles.content}>
                {activeTab === 'saved' ? renderSavedGyms() : renderSearchResults()}
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const themedStyles = createThemedStyles((palette) => ({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_SHEET_HEIGHT,
    backgroundColor: palette.page_background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 20,
  },
  content: {
    flex: 1,
  },
  gymList: {
    padding: 20,
    paddingBottom: 40,
  },
  gymItemContainer: {
    marginBottom: 8,
  },
  gymItem: {
    backgroundColor: palette.card_background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 4,
  },
  selectedGymItem: {
    borderColor: palette.accent,
    backgroundColor: `${palette.accent}10`,
  },
  gymItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  gymItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gymIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${palette.text_secondary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gymItemText: {
    flex: 1,
  },
  gymHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gymName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  externalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  externalText: {
    fontSize: 10,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  gymLocation: {
    fontSize: 14,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  reviewCount: {
    fontSize: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
}));

export default GymSelector;