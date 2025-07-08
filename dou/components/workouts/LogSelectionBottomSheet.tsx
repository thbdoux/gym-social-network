// components/workouts/LogSelectionBottomSheet.tsx
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
import WorkoutLogCard from './WorkoutLogCard';

const { height: screenHeight } = Dimensions.get('window');

interface LogSelectionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onLogSelected: (log: any) => void;
  logs: any[];
  logsLoading: boolean;
  user: any;
  themePalette: any;
}

// Fixed at 80% of screen height
const SHEET_HEIGHT = screenHeight * 0.2;

const LogSelectionBottomSheet: React.FC<LogSelectionBottomSheetProps> = ({
  visible,
  onClose,
  onLogSelected,
  logs,
  logsLoading,
  user,
  themePalette,
}) => {
  const { t } = useLanguage();
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Animation values
  const translateY = useRef(new Animated.Value(screenHeight)).current;

  // Reset state when modal becomes visible
  useEffect(() => {
    if (visible && !isNavigating) {
      setSelectedLogId(null);
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
    if (selectedLogId) {
      const selectedLog = logs.find(l => l.id === selectedLogId);
      if (selectedLog) {
        onLogSelected(selectedLog);
      }
    }
  };

  const handleLogSelection = (logId: number) => {
    const newSelectedId = selectedLogId === logId ? null : logId;
    setSelectedLogId(newSelectedId);
  };

  const handleDirectLogSelection = (log: any) => {
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
      onLogSelected(log);
    }, 100);
  };

  const renderLogItem = ({ item }: { item: any }) => (
    <View style={styles.logItem}>
      <TouchableOpacity
        style={styles.selectionButton}
        onPress={() => handleLogSelection(item.id)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.selectionCircle,
          { borderColor: themePalette.workoutLogPalette?.background || '#3B82F6' },
          selectedLogId === item.id && { 
            backgroundColor: themePalette.workoutLogPalette?.background || '#3B82F6' 
          }
        ]}>
          {selectedLogId === item.id && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleDirectLogSelection(item)}
        >
          <WorkoutLogCard
            logId={item.id}
            log={item}
            user={user?.username}
            selectionMode={false}
            isSelected={false}
            onSelect={() => {}}
            onLongPress={() => {}}
            pointerEvents="none"
            themePalette={themePalette}
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
              colors={[
                themePalette.workoutLogPalette?.background || '#3B82F6', 
                themePalette.workoutLogPalette?.accent || '#60A5FA'
              ]}
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
                {t('select')}
              </Text>
              
              {/* Choose Log Icon Button */}
              {logs.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.headerSubmitButton,
                    { 
                      backgroundColor: selectedLogId 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'rgba(255, 255, 255, 0.1)' 
                    }
                  ]}
                  onPress={handleSubmit}
                  disabled={!selectedLogId}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name="checkmark" 
                    size={20} 
                    color={selectedLogId ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'} 
                  />
                </TouchableOpacity>
              )}
              
              {logs.length === 0 && <View style={styles.headerSpacer} />}
            </LinearGradient>

            {/* Content */}
            <View style={styles.content}>
              {logsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator 
                    size="large" 
                    color={themePalette.workoutLogPalette?.background || '#3B82F6'} 
                  />
                  <Text style={styles.loadingText}>
                    {t('loading')}...
                  </Text>
                </View>
              ) : logs.length > 0 ? (
                <FlatList
                  data={logs}
                  keyExtractor={(item) => `log-${item.id}`}
                  renderItem={renderLogItem}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons 
                    name="library-outline" 
                    size={48} 
                    color="#4B5563" 
                  />
                  <Text style={styles.emptyStateTitle}>
                    {t('no_workout_logs')}
                  </Text>
                  <Text style={styles.emptyStateText}>
                    {t('create_your_first_workout_log')}
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
  logItem: {
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

export default LogSelectionBottomSheet;