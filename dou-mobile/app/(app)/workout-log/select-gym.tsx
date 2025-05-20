// app/(app)/workout-log/select-gym.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Custom hooks
import { useLanguage } from '../../../context/LanguageContext';
import { useGyms } from '../../../hooks/query/useGymQuery';
import { useLog, useUpdateLog } from '../../../hooks/query/useLogQuery';
import { 
  useQueryClient   
} from '@tanstack/react-query';
import { logKeys } from '../../../hooks/query/useLogQuery';

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

export default function GymSelectionScreen() {
  // Get log ID and current gym ID from route params
  const { logId, currentGymId } = useLocalSearchParams();
  const workoutLogId = typeof logId === 'string' ? parseInt(logId, 10) : 0;
  const currentGym = typeof currentGymId === 'string' ? parseInt(currentGymId, 10) : undefined;
  
  // State for search
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();
  
  // Hooks
  const { t } = useLanguage();
  const { data: gyms, isLoading, error } = useGyms();
  const { mutateAsync: updateLog } = useUpdateLog();
  
  // Filtered gyms based on search query
  const filteredGyms = React.useMemo(() => {
    if (!gyms) return [];
    
    if (!searchQuery.trim()) {
      return gyms;
    }
    
    const query = searchQuery.toLowerCase();
    return gyms.filter(gym => 
      gym.name.toLowerCase().includes(query) || 
      gym.location.toLowerCase().includes(query)
    );
  }, [gyms, searchQuery]);
  
  // Fetch the current log data to preserve exercises
  const { data: currentLog } = useLog(workoutLogId);
  
  // Handle gym selection
  const handleSelectGym = async (gymId) => {
    try {
      // Make sure we have the current log data before proceeding
      if (!currentLog) {
        console.error('Unable to fetch current log data');
        Alert.alert(t('error'), t('failed_to_update_gym'));
        return;
      }
      
      // Update only the gym_id while preserving all other data
      await updateLog({
        id: workoutLogId,
        logData: {
          gym: gymId,
          exercises: currentLog.exercises // Important: Preserve existing exercises
        }
      });
      
      queryClient.invalidateQueries({ queryKey: logKeys.detail(workoutLogId) });
      // Go back to workout log detail page
      router.back();
    } catch (error) {
      console.error('Failed to update gym:', error);
      Alert.alert(t('error'), t('failed_to_update_gym'));
    }
  };
  
  // Navigate to create gym page
  const handleCreateGym = () => {
    router.push({
      pathname: "/workout-log/create-gym",
      params: { returnToLogId: workoutLogId }
    });
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
        <Text style={styles.errorTitle}>{t('error_loading_gyms')}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('go_back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Render gym item
  const renderGymItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.gymItem,
        currentGym === item.id && styles.selectedGymItem
      ]}
      onPress={() => handleSelectGym(item.id)}
    >
      <View style={styles.gymInfo}>
        <Text style={styles.gymName}>{item.name}</Text>
        <Text style={styles.gymLocation}>{item.location}</Text>
        {item.description && (
          <Text style={styles.gymDescription} numberOfLines={2}>{item.description}</Text>
        )}
      </View>
      
      {currentGym === item.id && (
        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );
  
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
            <Text style={styles.headerTitle}>{t('select_gym')}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleCreateGym}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.text.tertiary} style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder={t('search_gyms')}
          placeholderTextColor={COLORS.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Gym List */}
      {filteredGyms && filteredGyms.length > 0 ? (
        <FlatList
          data={filteredGyms}
          renderItem={renderGymItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="fitness-outline" size={48} color={COLORS.text.tertiary} />
          <Text style={styles.emptyStateText}>
            {searchQuery 
              ? t('no_gyms_found_for_search') 
              : t('no_gyms_available')}
          </Text>
          <TouchableOpacity
            style={styles.createGymButton}
            onPress={handleCreateGym}
          >
            <Ionicons name="add-circle" size={20} color={COLORS.primary} />
            <Text style={styles.createGymText}>{t('create_new_gym')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
  addButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  
  // Search container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: COLORS.text.primary,
    fontSize: 15,
  },
  
  // List styles
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  gymItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedGymItem: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.card}E6`, // Adding some transparency
  },
  gymInfo: {
    flex: 1,
    marginRight: 8,
  },
  gymName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  gymLocation: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  gymDescription: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    fontStyle: 'italic',
  },
  
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.text.tertiary,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  createGymButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createGymText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
});