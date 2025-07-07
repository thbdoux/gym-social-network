// app/(app)/program/components/AnimatedHeader.tsx
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
  program: any;
  colors: any;
  isCreator: boolean;
  language: string;
  onDeleteProgram: () => void;
  onFieldUpdate: (field: string, value: any) => void;
  onToggleActive: () => void;
  onFork: () => void;
  onEditMode: () => void;
  editMode: boolean;
  onSaveProgram: () => void;
  onCancelEdit: () => void;
  programName: string;
  setProgramName: (name: string) => void;
  programDescription: string;
  setProgramDescription: (description: string) => void;
  programFocus: string;
  setProgramFocus: (focus: string) => void;
  programDifficulty: string;
  setProgramDifficulty: (difficulty: string) => void;
  programSessionsPerWeek: number;
  setProgramSessionsPerWeek: (sessions: number) => void;
  programEstimatedWeeks: number;
  setProgramEstimatedWeeks: (weeks: number) => void;
  t: (key: string) => string;
  onHeaderHeightChange?: (height: number) => void;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  scrollY,
  program,
  colors,
  isCreator,
  language,
  onDeleteProgram,
  onFieldUpdate,
  onToggleActive,
  onFork,
  onEditMode,
  editMode,
  onSaveProgram,
  onCancelEdit,
  programName,
  setProgramName,
  programDescription,
  setProgramDescription,
  programFocus,
  setProgramFocus,
  programDifficulty,
  setProgramDifficulty,
  programSessionsPerWeek,
  setProgramSessionsPerWeek,
  programEstimatedWeeks,
  setProgramEstimatedWeeks,
  t,
  onHeaderHeightChange,
}) => {
  const [headerHeight, setHeaderHeight] = useState(320); // Default height
  const headerRef = useRef<View>(null);
  
  const HEADER_MIN_HEIGHT = 0;
  const HEADER_SCROLL_DISTANCE = headerHeight - HEADER_MIN_HEIGHT;

  // Calculate dynamic header height based on content
  const calculateHeaderHeight = () => {
    let height = Platform.OS === 'ios' ? 320 : StatusBar.currentHeight || 0; // Status bar
    // Add height for description if present
    if (program.description) {
      const descriptionLines = Math.ceil((program.description.length || 0) / 50);
      const descriptionHeight = Math.max(40, Math.min(80, 20 + (descriptionLines * 18)));
      height += descriptionHeight;
      height += 8; // Margin after description
    }
    if(program.creator_username) {
      height += 20; // Margin after description
    }
    return height;
  };

  // Update header height when content changes
  useEffect(() => {
    const newHeight = calculateHeaderHeight();
    setHeaderHeight(newHeight);
    onHeaderHeightChange?.(newHeight);
  }, [program.description]);

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

  // Get focus display
  const getFocusDisplay = (focus?: string) => {
    const focusMap = {
      'strength': t('strength'),
      'hypertrophy': t('hypertrophy'),
      'endurance': t('endurance'),
      'power': t('power'),
      'general_fitness': t('general_fitness'),
      'weight_loss': t('weight_loss'),
      'sport_specific': t('sport_specific')
    };
    return focusMap[focus] || focus?.replace('_', ' ') || t('not_specified');
  };

  const handleNamePress = () => {
    if (!isCreator || editMode) return;
    Alert.prompt(
      t('edit_program_name'),
      t('enter_new_program_name'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: (name) => {
            if (name && name.trim() !== '') {
              setProgramName(name);
              onFieldUpdate('name', name);
            }
          }
        }
      ],
      'plain-text',
      program.name
    );
  };

  const handleDescriptionPress = () => {
    if (!isCreator || editMode) return;
    Alert.prompt(
      t('edit'),
      t('edit_description'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: (description) => {
            setProgramDescription(description || '');
            onFieldUpdate('description', description || '');
          }
        }
      ],
      'plain-text',
      program.description || ''
    );
  };

  const handleFocusPress = () => {
    if (!isCreator || editMode) return;
    Alert.alert(
      t('edit_focus'),
      t('select_program_focus'),
      [
        {
          text: t('strength'),
          onPress: () => {
            setProgramFocus('strength');
            onFieldUpdate('focus', 'strength');
          }
        },
        {
          text: t('hypertrophy'),
          onPress: () => {
            setProgramFocus('hypertrophy');
            onFieldUpdate('focus', 'hypertrophy');
          }
        },
        {
          text: t('endurance'),
          onPress: () => {
            setProgramFocus('endurance');
            onFieldUpdate('focus', 'endurance');
          }
        },
        {
          text: t('general_fitness'),
          onPress: () => {
            setProgramFocus('general_fitness');
            onFieldUpdate('focus', 'general_fitness');
          }
        },
        { text: t('cancel'), style: 'cancel' }
      ]
    );
  };

  const handleDifficultyPress = () => {
    if (!isCreator || editMode) return;
    Alert.alert(
      t('edit_difficulty'),
      t('select_difficulty_level'),
      [
        {
          text: t('beginner'),
          onPress: () => {
            setProgramDifficulty('beginner');
            onFieldUpdate('difficulty_level', 'beginner');
          }
        },
        {
          text: t('intermediate'),
          onPress: () => {
            setProgramDifficulty('intermediate');
            onFieldUpdate('difficulty_level', 'intermediate');
          }
        },
        {
          text: t('advanced'),
          onPress: () => {
            setProgramDifficulty('advanced');
            onFieldUpdate('difficulty_level', 'advanced');
          }
        },
        { text: t('cancel'), style: 'cancel' }
      ]
    );
  };

  const handleSessionsPress = () => {
    if (!isCreator || editMode) return;
    Alert.prompt(
      t('edit'),
      t('sessions_per_week'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: (sessionsText) => {
            if (!sessionsText) return;
            
            const sessions = parseInt(sessionsText.trim(), 10);
            if (!isNaN(sessions) && sessions >= 1 && sessions <= 7) {
              setProgramSessionsPerWeek(sessions);
              onFieldUpdate('sessions_per_week', sessions);
            } else {
              Alert.alert(t('error'), t('enter_valid_sessions'));
            }
          }
        }
      ],
      'plain-text',
      programSessionsPerWeek.toString()
    );
  };

  const handleWeeksPress = () => {
    if (!isCreator || editMode) return;
    Alert.prompt(
      t('edit'),
      t('estimated_weeks'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: (weeksText) => {
            if (!weeksText) return;
            
            const weeks = parseInt(weeksText.trim(), 10);
            if (!isNaN(weeks) && weeks >= 1) {
              setProgramEstimatedWeeks(weeks);
              onFieldUpdate('estimated_completion_weeks', weeks);
            } else {
              Alert.alert(t('error'), t('enter_valid_weeks'));
            }
          }
        }
      ],
      'plain-text',
      programEstimatedWeeks.toString()
    );
  };

  // Handle options menu
  const handleOptionsMenu = () => {
    if (!isCreator) return;
    
    const options = [
      {
        text: t('edit'),
        onPress: onEditMode
      },
      {
        text: program.is_active ? t('deactivate_program') : t('activate_program'),
        onPress: onToggleActive
      },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: onDeleteProgram
      },
      {
        text: t('cancel'),
        style: 'cancel'
      }
    ];

    Alert.alert(
      t('program_options'),
      t('select_an_option'),
      options
    );
  };

  const difficultyInfo = getDifficultyInfo(program.difficulty_level);

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
            <TouchableOpacity onPress={handleNamePress} activeOpacity={isCreator && !editMode ? 0.7 : 1}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {program.name}
              </Text>
            </TouchableOpacity>
            
            {/* Active badge and creator info */}
            <View style={styles.titleMeta}>
              {program.is_active && (
                <View style={[styles.activeBadge, { 
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  borderColor: 'rgba(34, 197, 94, 0.4)'
                }]}>
                  <Text style={[styles.activeBadgeText, { color: colors.success }]}>{t('active_program')}</Text>
                </View>
              )}
            </View>
          </Animated.View>
          
          <View style={styles.headerActions}>
            {editMode ? (
              <>
                <TouchableOpacity 
                  style={[styles.cancelButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                  onPress={onCancelEdit}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text.primary }]}>{t('cancel')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.saveButton, { backgroundColor: colors.success }]}
                  onPress={onSaveProgram}
                >
                  <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>{t('save')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {!isCreator && (
                  <TouchableOpacity 
                    style={[styles.forkButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                    onPress={onFork}
                  >
                    <Ionicons name="download-outline" size={18} color={colors.text.primary} />
                    <Text style={[styles.forkText, { color: colors.text.primary }]}>{t('fork')}</Text>
                  </TouchableOpacity>
                )}
                
                {isCreator && (
                  <TouchableOpacity 
                    style={styles.optionsButton}
                    onPress={handleOptionsMenu}
                  >
                    <Ionicons name="ellipsis-vertical" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
        
        {/* Description - only if available */}
        {program.description && (
          <TouchableOpacity 
            style={styles.descriptionContainer}
            onPress={handleDescriptionPress}
            activeOpacity={isCreator && !editMode ? 0.7 : 1}
          >
            <Text style={styles.descriptionText} numberOfLines={3}>
              {program.description}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Program Info Container */}
        <View style={styles.programInfoContainer}>
          {/* First Row - Focus & Difficulty */}
          <View style={styles.infoRow}>
            <TouchableOpacity 
              style={styles.infoItem} 
              onPress={handleFocusPress}
              activeOpacity={isCreator && !editMode ? 0.7 : 1}
            >
              <Text style={styles.infoLabel}>{t('focus')}</Text>
              <Text style={styles.infoValue}>
                {getFocusDisplay(program.focus)}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.infoItem} 
              onPress={handleDifficultyPress}
              activeOpacity={isCreator && !editMode ? 0.7 : 1}
            >
              <Text style={styles.infoLabel}>{t('difficulty')}</Text>
              <Text style={[styles.infoValue, { color: difficultyInfo.color }]}>
                {difficultyInfo.icon} {difficultyInfo.text}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Second Row - Sessions & Duration */}
          <View style={styles.infoRow}>
            <TouchableOpacity 
              style={styles.infoItem} 
              onPress={handleSessionsPress}
              activeOpacity={isCreator && !editMode ? 0.7 : 1}
            >
              <Text style={styles.infoLabel}>{t('sessions_per_week')}</Text>
              <Text style={styles.infoValue}>
                {programSessionsPerWeek > 0 ? `${programSessionsPerWeek} ${t('sessions')}` : (isCreator ? t('tap_to_set') : '-')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.infoItem} 
              onPress={handleWeeksPress}
              activeOpacity={isCreator && !editMode ? 0.7 : 1}
            >
              <Text style={styles.infoLabel}>{t('estimated_duration')}</Text>
              <Text style={styles.infoValue}>
                {programEstimatedWeeks > 0 ? `${programEstimatedWeeks} ${t('weeks')}` : (isCreator ? t('tap_to_set') : '-')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Creator Section */}
        <View style={styles.creatorSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.sectionLabel}>{t('created_by')}</Text>
          </View>
          <Text style={[styles.creatorText, { color: colors.text.primary }]}>
            {program.creator_username}
          </Text>
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  titleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  forkText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
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
  programInfoContainer: {
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
  creatorSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 12,
    padding: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
  },
  creatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});