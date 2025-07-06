// app/(app)/workout/components/AnimatedHeader.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  Animated,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedHeaderProps {
  scrollY: Animated.Value;
  template: any;
  colors: any;
  isCreator: boolean;
  estimatedDuration: number;
  language: string;
  onDeleteTemplate: () => void;
  onFieldUpdate: (field: string, value: any) => void;
  setTemplateName: (name: string) => void;
  setTemplateDescription: (description: string) => void;
  setSplitMethod: (method: string) => void;
  setDifficultyLevel: (level: string) => void;
  setEstimatedDuration: (duration: number) => void;
  setEquipmentRequired: (equipment: string[]) => void;
  setTags: (tags: string[]) => void;
  setIsPublic: (isPublic: boolean) => void;
  t: (key: string) => string;
  onHeaderHeightChange?: (height: number) => void;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  scrollY,
  template,
  colors,
  isCreator,
  estimatedDuration,
  language,
  onDeleteTemplate,
  onFieldUpdate,
  setTemplateName,
  setTemplateDescription,
  setSplitMethod,
  setDifficultyLevel,
  setEstimatedDuration,
  setEquipmentRequired,
  setTags,
  setIsPublic,
  t,
  onHeaderHeightChange,
}) => {
  const [headerHeight, setHeaderHeight] = useState(280); // Default height
  const headerRef = useRef<View>(null);
  
  const HEADER_MIN_HEIGHT = 0;
  const HEADER_SCROLL_DISTANCE = headerHeight - HEADER_MIN_HEIGHT;

  // Calculate dynamic header height based on content
  const calculateHeaderHeight = () => {
    let height = Platform.OS === 'ios' ? 320 : StatusBar.currentHeight || 0; // Status bar

    // Add height for description if present
    if (template.description) {
      const descriptionLines = Math.ceil((template.description.length || 0) / 50);
      const descriptionHeight = Math.max(40, Math.min(80, 20 + (descriptionLines * 18)));
      height += descriptionHeight;
      height += 8; // Margin after description
    }

    // Add height for equipment if present
    if (template.equipment_required && template.equipment_required.length > 0) {
      height += 75; // Equipment section
      height += 8; // Margin after equipment
    }

    return height;
  };

  // Update header height when content changes
  useEffect(() => {
    const newHeight = calculateHeaderHeight();
    setHeaderHeight(newHeight);
    onHeaderHeightChange?.(newHeight);
  }, [template.description, template.tags, template.equipment_required]);

  // Animated values
  const animatedHeaderHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [headerHeight, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.8, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  // Get difficulty color and display
  const getDifficultyInfo = (level?: string) => {
    switch (level) {
      case 'beginner':
        return { color: '#10B981', icon: '🟢', text: t('beginner') };
      case 'intermediate':
        return { color: '#F59E0B', icon: '🟡', text: t('intermediate') };
      case 'advanced':
        return { color: '#EF4444', icon: '🔴', text: t('advanced') };
      default:
        return { color: colors.text.secondary, icon: '⚪', text: t('not_set') };
    }
  };

  // Get split method display
  const getSplitMethodDisplay = (method?: string) => {
    switch (method) {
      case 'full_body':
        return t('full_body');
      case 'upper_lower':
        return t('upper_lower');
      case 'push_pull_legs':
        return t('push_pull_legs');
      case 'body_part':
        return t('body_part');
      default:
        return t('not_specified');
    }
  };

  const handleNamePress = () => {
    if (!isCreator) return;
    Alert.prompt(
      t('edit_template_name'),
      t('enter_new_template_name'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: (name) => {
            if (name && name.trim() !== '') {
              setTemplateName(name);
              onFieldUpdate('name', name);
            }
          }
        }
      ],
      'plain-text',
      template.name
    );
  };

  const handleDescriptionPress = () => {
    if (!isCreator) return;
    Alert.prompt(
      t('edit'),
      t('edit_description'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: (description) => {
            setTemplateDescription(description || '');
            onFieldUpdate('description', description || '');
          }
        }
      ],
      'plain-text',
      template.description || ''
    );
  };

  const handleDurationPress = () => {
    if (!isCreator) return;
    
    Alert.prompt(
      t('edit'),
      t('enter_duration_in_minutes'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: (durationText) => {
            if (!durationText) return;
            
            const duration = parseInt(durationText.trim(), 10);
            if (!isNaN(duration) && duration >= 0) {
              setEstimatedDuration(duration);
              onFieldUpdate('estimated_duration', duration);
            } else {
              Alert.alert(t('error'), 'Please enter a valid number (0 or greater)');
            }
          }
        }
      ],
      'plain-text',
      estimatedDuration.toString()
    );
  };

  const handleDifficultyPress = () => {
    if (!isCreator) return;
    Alert.alert(
      t('edit_difficulty'),
      t('select_difficulty_level'),
      [
        {
          text: t('beginner'),
          onPress: () => {
            setDifficultyLevel('beginner');
            onFieldUpdate('difficulty_level', 'beginner');
          }
        },
        {
          text: t('intermediate'),
          onPress: () => {
            setDifficultyLevel('intermediate');
            onFieldUpdate('difficulty_level', 'intermediate');
          }
        },
        {
          text: t('advanced'),
          onPress: () => {
            setDifficultyLevel('advanced');
            onFieldUpdate('difficulty_level', 'advanced');
          }
        },
        { text: t('cancel'), style: 'cancel' }
      ]
    );
  };

  const handleSplitMethodPress = () => {
    if (!isCreator) return;
    Alert.alert(
      t('edit'),
      t('split_method'),
      [
        {
          text: t('full_body'),
          onPress: () => {
            setSplitMethod('full_body');
            onFieldUpdate('split_method', 'full_body');
          }
        },
        {
          text: t('upper_lower'),
          onPress: () => {
            setSplitMethod('upper_lower');
            onFieldUpdate('split_method', 'upper_lower');
          }
        },
        {
          text: t('push_pull_legs'),
          onPress: () => {
            setSplitMethod('push_pull_legs');
            onFieldUpdate('split_method', 'push_pull_legs');
          }
        },
        {
          text: t('body_part'),
          onPress: () => {
            setSplitMethod('body_part');
            onFieldUpdate('split_method', 'body_part');
          }
        },
        { text: t('cancel'), style: 'cancel' }
      ]
    );
  };

  const handlePublicToggle = (value: boolean) => {
    if (!isCreator) return;
    setIsPublic(value);
    onFieldUpdate('is_public', value);
  };

  // Handle options menu (simplified to just delete)
  const handleOptionsMenu = () => {
    Alert.alert(
      t('template_options'),
      t('select_an_option'),
      [
        {
          text: t('delete'),
          style: 'destructive',
          onPress: onDeleteTemplate
        },
        {
          text: t('cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  const difficultyInfo = getDifficultyInfo(template.difficulty_level);

  return (
    <Animated.View 
      ref={headerRef}
      style={[
        styles.header, 
        { 
          height: animatedHeaderHeight, 
          opacity: headerOpacity 
        }
      ]}
    >
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        {/* Top Row - Title on left, options on right */}
        <View style={styles.headerTopRow}>
          <Animated.View style={[styles.titleContainer, { transform: [{ scale: titleScale }] }]}>
            <TouchableOpacity onPress={handleNamePress} activeOpacity={isCreator ? 0.7 : 1}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {template.name}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          
          {isCreator && (
            <TouchableOpacity 
              style={styles.optionsButton}
              onPress={handleOptionsMenu}
            >
              <Ionicons name="ellipsis-vertical" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Description - only if available */}
        {template.description && (
          <TouchableOpacity 
            style={styles.descriptionContainer}
            onPress={handleDescriptionPress}
            activeOpacity={isCreator ? 0.7 : 1}
          >
            <Text style={styles.descriptionText} numberOfLines={3}>
              {template.description}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Template Info Container */}
        <View style={styles.templateInfoContainer}>
          {/* First Row - Split Method & Difficulty */}
          <View style={styles.infoRow}>
            <TouchableOpacity 
              style={styles.infoItem} 
              onPress={handleSplitMethodPress}
              activeOpacity={isCreator ? 0.7 : 1}
            >
              <Text style={styles.infoLabel}>{t('split_method')}</Text>
              <Text style={styles.infoValue}>
                {getSplitMethodDisplay(template.split_method)}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.infoItem} 
              onPress={handleDifficultyPress}
              activeOpacity={isCreator ? 0.7 : 1}
            >
              <Text style={styles.infoLabel}>{t('difficulty')}</Text>
              <Text style={[styles.infoValue, { color: difficultyInfo.color }]}>
                {difficultyInfo.icon} {difficultyInfo.text}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Second Row - Duration */}
          <View style={styles.infoRow}>
            <TouchableOpacity 
              style={[styles.infoItem, { flex: 1 }]} 
              onPress={handleDurationPress}
              activeOpacity={isCreator ? 0.7 : 1}
            >
              <Text style={styles.infoLabel}>{t('estimated_duration')}</Text>
              <Text style={styles.infoValue}>
                {estimatedDuration > 0 ? `${estimatedDuration} ${t('minutes')}` : (isCreator ? t('tap_to_set') : '-')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tags Section */}
        {template.tags && template.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pricetag-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.sectionLabel}>{t('tags')}</Text>
            </View>
            <View style={styles.tagsContainer}>
              {template.tags.map((tag: string, index: number) => (
                <View 
                  key={`tag-${index}`} 
                  style={[styles.tag, { backgroundColor: `rgba(66, 153, 225, 0.2)` }]}
                >
                  <Text style={[styles.tagText, { color: '#4299E1' }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Equipment Required Section */}
        {template.equipment_required && template.equipment_required.length > 0 && (
          <View style={styles.equipmentSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="barbell-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.sectionLabel}>{t('equipment_required')}</Text>
            </View>
            <View style={styles.equipmentContainer}>
              {template.equipment_required.map((equipment: string, index: number) => (
                <View 
                  key={`equipment-${index}`} 
                  style={[styles.equipmentItem, { backgroundColor: `rgba(16, 185, 129, 0.2)` }]}
                >
                  <Text style={[styles.equipmentText, { color: '#10B981' }]}>{t(equipment)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Public/Private Toggle */}
        <View style={styles.publicToggleSection}>
          <View style={styles.toggleInfo}>
            <Ionicons 
              name={template.is_public ? "globe-outline" : "lock-closed-outline"} 
              size={16} 
              color={colors.text.secondary} 
            />
            <Text style={styles.toggleLabel}>
              {template.is_public ? t('public_template') : t('private_template')}
            </Text>
          </View>
          
          {isCreator && (
            <Switch
              value={template.is_public}
              onValueChange={handlePublicToggle}
              trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: colors.success }}
              thumbColor={template.is_public ? '#FFFFFF' : '#f4f3f4'}
            />
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerGradient: {
    flex: 1,
    padding: 16,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  optionsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  descriptionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  templateInfoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tagsSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  equipmentSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  equipmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  equipmentItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  equipmentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  publicToggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 12,
    padding: 12,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '500',
  },
});