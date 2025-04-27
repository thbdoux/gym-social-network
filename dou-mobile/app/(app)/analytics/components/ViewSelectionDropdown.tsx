// components/ViewSelectionDropdown.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';

export type AnalyticsViewMode = 
  | 'comparison' 
  | 'total-weight' 
  | 'average-weight' 
  | 'sets-analysis';

interface ViewOption {
  id: AnalyticsViewMode;
  label: string;
  icon: string;
}

interface ViewSelectionDropdownProps {
  selectedView: AnalyticsViewMode;
  onViewChange: (view: AnalyticsViewMode) => void;
}

export const ViewSelectionDropdown: React.FC<ViewSelectionDropdownProps> = ({ 
  selectedView, 
  onViewChange 
}) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);

  const viewOptions: ViewOption[] = [
    { id: 'comparison', label: t('comparison_view'), icon: 'bar-chart-2' },
    { id: 'total-weight', label: t('total_weight_analysis'), icon: 'trending-up' },
    { id: 'average-weight', label: t('average_weight_analysis'), icon: 'activity' },
    { id: 'sets-analysis', label: t('sets_analysis'), icon: 'layers' },
  ];

  const selectedOption = viewOptions.find(option => option.id === selectedView) || viewOptions[0];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.dropdownButton, { borderColor: palette.border }]}
        onPress={() => setShowModal(true)}
      >
        <Feather name={selectedOption.icon as any} size={16} color={palette.text} />
        <Text style={[styles.dropdownText, { color: palette.text }]}>
          {selectedOption.label.split('_')[0]}
        </Text>
        <Feather name="chevron-down" size={16} color={palette.text} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowModal(false)}
        >
          <View 
            style={[
              styles.modalContent, 
              { 
                backgroundColor: palette.page_background,
                borderColor: palette.border,
                top: 110 // Position below the header and controls
              }
            ]}
          >
            <FlatList
              data={viewOptions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedView === item.id && { backgroundColor: palette.highlight + '15' }
                  ]}
                  onPress={() => {
                    onViewChange(item.id);
                    setShowModal(false);
                  }}
                >
                  <Feather 
                    name={item.icon as any} 
                    size={18} 
                    color={selectedView === item.id ? palette.highlight : palette.text} 
                    style={styles.optionIcon}
                  />
                  <Text 
                    style={[
                      styles.optionText, 
                      { color: selectedView === item.id ? palette.highlight : palette.text }
                    ]}
                  >
                    {item.label}
                  </Text>
                  {selectedView === item.id && (
                    <Feather name="check" size={18} color={palette.highlight} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  dropdownText: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    position: 'absolute',
    left: 10,
    right: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
});