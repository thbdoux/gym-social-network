// components/ViewSelectionDropdown.tsx
import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';

export type AnalyticsViewMode = 
  | 'comparison' 
  | 'total-weight' 
  | 'average-weight' 
  | 'sets-analysis'
  | 'bodyweight-analysis'
  | 'endurance-analysis';

interface ViewOption {
  id: AnalyticsViewMode;
  label: string;
  description: string;
  icon: string;
  activeIcon: string;
  color: string;
}

interface ViewSelectionDropdownProps {
  currentView: AnalyticsViewMode;
  onViewChange: (view: AnalyticsViewMode) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const ViewSelectionDropdown: React.FC<ViewSelectionDropdownProps> = memo(({ 
  currentView, 
  onViewChange, 
  isVisible, 
  onClose 
}) => {
  const { palette } = useTheme();
  const { t } = useLanguage();

  const viewOptions: ViewOption[] = [
    {
      id: 'comparison',
      label: t('comparison_view'),
      description: t('compare_all_metrics_overview'),
      icon: 'bar-chart-outline',
      activeIcon: 'bar-chart',
      color: palette.highlight
    },
    {
      id: 'total-weight',
      label: t('strength_analysis'),
      description: t('total_weight_deep_dive'),
      icon: 'barbell-outline',
      activeIcon: 'barbell',
      color: '#ef4444'
    },
    {
      id: 'average-weight',
      label: t('intensity_analysis'),
      description: t('average_weight_progression'),
      icon: 'pulse-outline',
      activeIcon: 'pulse',
      color: '#f59e0b'
    },
    {
      id: 'sets-analysis',
      label: t('volume_analysis'),
      description: t('sets_and_muscle_distribution'),
      icon: 'layers-outline',
      activeIcon: 'layers',
      color: '#10b981'
    },
    {
      id: 'bodyweight-analysis',
      label: t('bodyweight_analysis'),
      description: t('bodyweight_exercise_progression'),
      icon: 'body-outline',
      activeIcon: 'body',
      color: '#8b5cf6'
    },
    {
      id: 'endurance-analysis',
      label: t('endurance_analysis'),
      description: t('duration_distance_performance'),
      icon: 'timer-outline',
      activeIcon: 'timer',
      color: '#06b6d4'
    }
  ];

  const handleViewSelect = (view: AnalyticsViewMode) => {
    onViewChange(view);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      <View style={[styles.dropdown, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: palette.text }]}>
            {t('select_analysis_view')}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={palette.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.optionsContainer}>
          {viewOptions.map((option) => {
            const isActive = currentView === option.id;
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionItem,
                  { borderBottomColor: palette.border + '30' },
                  isActive && { backgroundColor: option.color + '08' }
                ]}
                onPress={() => handleViewSelect(option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.iconContainer, { backgroundColor: option.color + '15' }]}>
                    <Ionicons 
                      name={isActive ? option.activeIcon : option.icon} 
                      size={24} 
                      color={option.color} 
                    />
                  </View>
                  
                  <View style={styles.textContainer}>
                    <Text style={[styles.optionLabel, { color: palette.text }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.optionDescription, { color: palette.text + '70' }]}>
                      {option.description}
                    </Text>
                  </View>
                  
                  {isActive && (
                    <View style={styles.activeIndicator}>
                      <Ionicons name="checkmark-circle" size={20} color={option.color} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.footer, { borderTopColor: palette.border + '30' }]}>
          <Text style={[styles.footerText, { color: palette.text + '60' }]}>
            {t('tap_to_switch_between_analysis_views')}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdown: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    maxHeight: 400,
  },
  optionItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  activeIndicator: {
    marginLeft: 8,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ViewSelectionDropdown;