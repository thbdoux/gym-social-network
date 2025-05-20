// components/workouts/SelectionModeHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

interface SelectionModeHeaderProps {
  toggleSelectionMode: () => void;
  confirmDelete: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  selectedItems: number[];
  totalItems: number;
}

const SelectionModeHeader: React.FC<SelectionModeHeaderProps> = ({
  toggleSelectionMode,
  confirmDelete,
  selectAll,
  deselectAll,
  selectedItems,
  totalItems
}) => {
  const { t } = useLanguage();

  return (
    <View style={styles.selectionHeader}>
      <TouchableOpacity 
        style={styles.cancelButton}
        onPress={toggleSelectionMode}
      >
        <Text style={styles.cancelText}>{t('cancel')}</Text>
      </TouchableOpacity>
      
      <Text style={styles.selectionCount}>
        {selectedItems.length} {t('selected')}
      </Text>
      
      <View style={styles.selectionActions}>
        {selectedItems.length > 0 && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={confirmDelete}
          >
            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        
        {selectedItems.length === 0 ? (
          <TouchableOpacity 
            style={styles.selectAllButton}
            onPress={selectAll}
          >
            <Text style={styles.selectAllText}>{t('select_all')}</Text>
          </TouchableOpacity>
        ) : selectedItems.length < totalItems ? (
          <TouchableOpacity 
            style={styles.selectAllButton}
            onPress={selectAll}
          >
            <Text style={styles.selectAllText}>{t('select_all')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.selectAllButton}
            onPress={deselectAll}
          >
            <Text style={styles.selectAllText}>{t('deselect_all')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  selectionCount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  selectAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectAllText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

export default SelectionModeHeader;