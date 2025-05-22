// components/GymSelectionModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGyms } from '../../hooks/query/useGymQuery';
import { useLanguage } from '../../context/LanguageContext';
import { createThemedStyles } from '../../utils/createThemedStyles';

interface Gym {
  id: number;
  name: string;
  location: string;
  description?: string;
  is_default?: boolean;
}

interface GymSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectGym: (gym: Gym | null) => void;
  selectedGym: Gym | null;
  themePalette: any;
}

const GymSelectionModal: React.FC<GymSelectionModalProps> = ({
  visible,
  onClose,
  onSelectGym,
  selectedGym,
  themePalette
}) => {
  const { t } = useLanguage();
  const { data: gyms, isLoading, error } = useGyms();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGyms, setFilteredGyms] = useState<Gym[]>([]);

  const styles = themedStyles(themePalette);

  // Filter gyms based on search query
  useEffect(() => {
    if (!gyms) {
      setFilteredGyms([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredGyms(gyms);
      return;
    }

    const filtered = gyms.filter(gym => 
      gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredGyms(filtered);
  }, [gyms, searchQuery]);

  const handleSelectGym = (gym: Gym) => {
    onSelectGym(gym);
    onClose();
  };

  const handleNoGymSelected = () => {
    onSelectGym(null);
    onClose();
  };

  const renderGymItem = ({ item }: { item: Gym }) => {
    const isSelected = selectedGym?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.gymItem,
          isSelected && styles.selectedGymItem
        ]}
        onPress={() => handleSelectGym(item)}
      >
        <View style={styles.gymItemContent}>
          <View style={styles.gymItemLeft}>
            <View style={styles.gymIconContainer}>
              <Ionicons 
                name="fitness" 
                size={24} 
                color={isSelected ? themePalette.accent : themePalette.text_secondary} 
              />
            </View>
            <View style={styles.gymItemText}>
              <Text style={[
                styles.gymName,
                { color: isSelected ? themePalette.accent : themePalette.text }
              ]}>
                {item.name}
              </Text>
              <Text style={[
                styles.gymLocation,
                { color: isSelected ? themePalette.accent : themePalette.text_secondary }
              ]}>
                {item.location}
              </Text>
              {item.description && (
                <Text style={[
                  styles.gymDescription,
                  { color: isSelected ? themePalette.accent : themePalette.text_tertiary }
                ]}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color={themePalette.accent} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themePalette.accent} />
          <Text style={[styles.loadingText, { color: themePalette.text_secondary }]}>
            {t('loading_gyms')}
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={themePalette.error} />
          <Text style={[styles.errorText, { color: themePalette.error }]}>
            {t('error_loading_gyms')}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: themePalette.accent }]}
            onPress={() => window.location.reload()}
          >
            <Text style={styles.retryButtonText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!gyms || gyms.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="fitness-outline" size={48} color={themePalette.text_tertiary} />
          <Text style={[styles.emptyText, { color: themePalette.text_secondary }]}>
            {t('no_gyms_available')}
          </Text>
          <Text style={[styles.emptySubtext, { color: themePalette.text_tertiary }]}>
            {t('contact_admin_to_add_gyms')}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredGyms}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGymItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gymList}
        ListEmptyComponent={
          <View style={styles.emptySearchContainer}>
            <Ionicons name="search" size={32} color={themePalette.text_tertiary} />
            <Text style={[styles.noResultsText, { color: themePalette.text_secondary }]}>
              {t('no_gyms_match_search')}
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={themePalette.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themePalette.text }]}>
            {t('select_gym')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={themePalette.text_secondary} />
            <TextInput
              style={[styles.searchInput, { color: themePalette.text }]}
              placeholder={t('search_gyms')}
              placeholderTextColor={themePalette.text_tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={themePalette.text_secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* No Gym Option */}
        <TouchableOpacity
          style={[
            styles.noGymOption,
            !selectedGym && styles.selectedGymItem
          ]}
          onPress={handleNoGymSelected}
        >
          <View style={styles.gymItemContent}>
            <View style={styles.gymItemLeft}>
              <View style={styles.gymIconContainer}>
                <Ionicons 
                  name="home-outline" 
                  size={24} 
                  color={!selectedGym ? themePalette.accent : themePalette.text_secondary} 
                />
              </View>
              <View style={styles.gymItemText}>
                <Text style={[
                  styles.gymName,
                  { color: !selectedGym ? themePalette.accent : themePalette.text }
                ]}>
                  {t('no_gym_home_workout')}
                </Text>
                <Text style={[
                  styles.gymLocation,
                  { color: !selectedGym ? themePalette.accent : themePalette.text_secondary }
                ]}>
                  {t('workout_at_home_or_anywhere')}
                </Text>
              </View>
            </View>
            {!selectedGym && (
              <Ionicons name="checkmark-circle" size={24} color={themePalette.accent} />
            )}
          </View>
        </TouchableOpacity>

        {/* Gym List */}
        <View style={styles.content}>
          {renderContent()}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const themedStyles = createThemedStyles((palette) => ({
  container: {
    flex: 1,
    backgroundColor: palette.page_background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.input_background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  noGymOption: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  gymList: {
    paddingBottom: 20,
  },
  gymItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  selectedGymItem: {
    backgroundColor: `${palette.accent}10`,
    borderBottomColor: palette.accent,
  },
  gymItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gymItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gymIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${palette.text_secondary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gymItemText: {
    flex: 1,
  },
  gymName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  gymLocation: {
    fontSize: 14,
    marginBottom: 2,
  },
  gymDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
}));

export default GymSelectionModal;