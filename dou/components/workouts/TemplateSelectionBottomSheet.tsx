// components/workouts/TemplateSelectionBottomSheet.tsx
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
import { router } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import WorkoutCard from './WorkoutCard';

const { height: screenHeight } = Dimensions.get('window');

interface TemplateSelectionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onTemplateSelected: (template: any) => void;
  templates: any[];
  templatesLoading: boolean;
  user: any;
  themePalette: any;
}

// Fixed at 80% of screen height
const SHEET_HEIGHT = screenHeight * 0.2;

const TemplateSelectionBottomSheet: React.FC<TemplateSelectionBottomSheetProps> = ({
  visible,
  onClose,
  onTemplateSelected,
  templates,
  templatesLoading,
  user,
  themePalette,
}) => {
  const { t } = useLanguage();
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Animation values
  const translateY = useRef(new Animated.Value(screenHeight)).current;

  // Reset state when modal becomes visible
  useEffect(() => {
    if (visible && !isNavigating) {
      setSelectedTemplateId(null);
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
    if (selectedTemplateId) {
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      if (selectedTemplate) {
        onTemplateSelected(selectedTemplate);
      }
    }
  };

  const handleTemplateNavigation = (templateId: number) => {
    setSelectedTemplateId(templateId);
    setIsNavigating(true);
    
    // Close sheet before navigation
    Animated.spring(translateY, {
      toValue: screenHeight,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    
    // Navigate after animation starts
    setTimeout(() => {
      router.push(`/workout/${templateId}`);
    }, 100);
  };

  const handleTemplateSelection = (templateId: number) => {
    const newSelectedId = selectedTemplateId === templateId ? null : templateId;
    setSelectedTemplateId(newSelectedId);
  };

  const renderTemplateItem = ({ item }: { item: any }) => (
    <View style={styles.templateItem}>
      <TouchableOpacity
        style={styles.selectionButton}
        onPress={() => handleTemplateSelection(item.id)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.selectionCircle,
          { borderColor: themePalette.highlight },
          selectedTemplateId === item.id && { 
            backgroundColor: themePalette.highlight 
          }
        ]}>
          {selectedTemplateId === item.id && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.cardContainer}>
        <WorkoutCard
          workoutId={item.id}
          workout={item}
          isTemplate={true}
          user={user?.username}
          selectionMode={false}
          themePalette={themePalette}
          onCardPress={() => handleTemplateNavigation(item.id)}
        />
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
          { 
            backgroundColor: themePalette.page_background,
            transform: [{ translateY }]
          }
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header with Icon Button */}
          <View style={[styles.header, { borderBottomColor: themePalette.border }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={themePalette.text} />
            </TouchableOpacity>
            
            <Text style={[styles.title, { color: themePalette.text }]}>
              {t('select')}
            </Text>
            
            {/* Choose Template Icon Button */}
            {templates.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.headerSubmitButton,
                  { 
                    backgroundColor: selectedTemplateId 
                      ? themePalette.highlight 
                      : themePalette.text_secondary 
                  }
                ]}
                onPress={handleSubmit}
                disabled={!selectedTemplateId}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name="checkmark" 
                  size={20} 
                  color={selectedTemplateId ? '#FFFFFF' : themePalette.text} 
                />
              </TouchableOpacity>
            )}
            
            {templates.length === 0 && <View style={styles.headerSpacer} />}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {templatesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator 
                  size="large" 
                  color={themePalette.highlight} 
                />
                <Text style={[styles.loadingText, { color: themePalette.text }]}>
                  {t('loading')}...
                </Text>
              </View>
            ) : templates.length > 0 ? (
              <FlatList
                data={templates}
                keyExtractor={(item) => `template-${item.id}`}
                renderItem={renderTemplateItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons 
                  name="document-text-outline" 
                  size={48} 
                  color={themePalette.text_secondary} 
                />
                <Text style={[styles.emptyStateTitle, { color: themePalette.text }]}>
                  {t('no_templates')}
                </Text>
                <Text style={[styles.emptyStateText, { color: themePalette.text_secondary }]}>
                  {t('create_your_first_template')}
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  listContent: {
    paddingVertical: 16,
  },
  templateItem: {
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
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default TemplateSelectionBottomSheet;