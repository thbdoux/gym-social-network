// components/workouts/ProgramSelectionBottomSheet.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  Animated,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../context/LanguageContext';
import WorkoutCard from './WorkoutCard';

const { height: screenHeight } = Dimensions.get('window');

interface ProgramSelectionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onWorkoutSelected: (workout: any) => void;
  activeProgram: any;
  programsLoading: boolean;
  user: any;
  themePalette: any;
}

// Fixed at 80% of screen height
const SHEET_HEIGHT = screenHeight * 0.2;

const ProgramSelectionBottomSheet: React.FC<ProgramSelectionBottomSheetProps> = ({
  visible,
  onClose,
  onWorkoutSelected,
  activeProgram,
  programsLoading,
  user,
  themePalette
}) => {
  const { t } = useLanguage();
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Animation values
  const translateY = useRef(new Animated.Value(screenHeight)).current;

  // Reset state when modal becomes visible
  useEffect(() => {
    if (visible && !isNavigating) {
      setSelectedWorkoutId(null);
      setIsNavigating(false);
      
      // Animate to fixed position when opening
      Animated.spring(translateY, {
        toValue: SHEET_HEIGHT,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else if (!visible) {
      // Animate to bottom (closed position)
      Animated.spring(translateY, {
        toValue: screenHeight,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    if (isNavigating) return;
    Animated.spring(translateY, {
      toValue: screenHeight,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    setTimeout(() => onClose(), 300);
  };

  const handleSubmit = () => {
    if (selectedWorkoutId) {
      const selectedWorkout = activeProgram?.workouts?.find(w => w.id === selectedWorkoutId);
      if (selectedWorkout) {
        onWorkoutSelected({
          ...selectedWorkout,
          program: activeProgram.id,
          program_name: activeProgram.name
        });
      }
    }
  };

  const handleWorkoutSelection = (workoutId: number) => {
    const newSelectedId = selectedWorkoutId === workoutId ? null : workoutId;
    setSelectedWorkoutId(newSelectedId);
  };

  const handleDirectWorkoutSelection = (workout: any) => {
    setIsNavigating(true);
    
    // Close sheet before selection
    Animated.spring(translateY, {
      toValue: screenHeight,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    
    // Call selection after animation starts
    setTimeout(() => {
      onWorkoutSelected({
        ...workout,
        program: activeProgram.id,
        program_name: activeProgram.name
      });
    }, 100);
  };

  const renderWorkoutItem = ({ item }: { item: any }) => (
    <View style={styles.workoutItem}>
      <TouchableOpacity
        style={styles.selectionButton}
        onPress={() => handleWorkoutSelection(item.id)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.selectionCircle,
          { borderColor: '#16a34a' },
          selectedWorkoutId === item.id && { 
            backgroundColor: '#16a34a' 
          }
        ]}>
          {selectedWorkoutId === item.id && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleDirectWorkoutSelection(item)}
        >
          <WorkoutCard
            workoutId={item.id}
            workout={{
              ...item,
              program: activeProgram.id,
              program_name: activeProgram.name
            }}
            isTemplate={false}
            user={user?.username}
            selectionMode={false}
            themePalette={themePalette}
            pointerEvents="none"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Don't render if not visible
  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <View style={styles.backdrop}>
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          onPress={handleClose}
          activeOpacity={1}
        />
      </View>

      {/* Bottom Sheet */}
      <Animated.View 
        style={[
          styles.bottomSheet,
          { transform: [{ translateY }] }
        ]}
      >
        <View style={styles.sheetContainer}>
          <BlurView intensity={40} tint="dark" style={styles.blurView} />
          
          <SafeAreaView style={styles.safeArea}>
            {/* Header with Gradient */}
            <LinearGradient
              colors={['#16a34a', '#22c55e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerGradient}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <Text style={styles.title}>
                {t('select_program_workout')}
              </Text>
              
              {/* Choose Workout Icon Button */}
              {activeProgram?.workouts?.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.headerSubmitButton,
                    { 
                      backgroundColor: selectedWorkoutId 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'rgba(255, 255, 255, 0.1)' 
                    }
                  ]}
                  onPress={handleSubmit}
                  disabled={!selectedWorkoutId}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name="checkmark" 
                    size={20} 
                    color={selectedWorkoutId ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'} 
                  />
                </TouchableOpacity>
              )}
              
              {(!activeProgram?.workouts?.length) && <View style={styles.headerSpacer} />}
            </LinearGradient>

            {/* Program Info */}
            {activeProgram && (
              <View style={styles.programInfo}>
                <View style={styles.programInfoContent}>
                <Text style={styles.programName}></Text>
                  <Text style={styles.programName}>{t('current_program')} : {activeProgram.name}</Text>
                  <Text style={styles.programDetails}>
                    {activeProgram.workouts?.length || 0} {t('workouts')}
                  </Text>
                </View>
              </View>
            )}

            {/* Content */}
            <View style={styles.content}>
              {programsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator 
                    size="large" 
                    color="#16a34a" 
                  />
                  <Text style={styles.loadingText}>
                    {t('loading')}...
                  </Text>
                </View>
              ) : activeProgram?.workouts?.length > 0 ? (
                <FlatList
                  data={activeProgram.workouts}
                  keyExtractor={(item) => `program-workout-${item.id}`}
                  renderItem={renderWorkoutItem}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons 
                    name="barbell-outline" 
                    size={48} 
                    color="#4B5563" 
                  />
                  <Text style={styles.emptyStateTitle}>
                    {t('no_program_workouts')}
                  </Text>
                  <Text style={styles.emptyStateText}>
                    {t('add_workouts_to_program')}
                  </Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdropTouchable: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: screenHeight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  sheetContainer: {
    flex: 1,
    position: 'relative',
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40, // Match the icon button width
  },
  headerSubmitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  programInfoContent: {
    alignItems: 'center',
  },
  programName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  programDetails: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
  listContent: {
    paddingVertical: 16,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectionButton: {
    marginRight: 12,
    padding: 4,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ProgramSelectionBottomSheet;