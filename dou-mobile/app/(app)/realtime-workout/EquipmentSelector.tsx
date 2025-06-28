import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';

interface EquipmentSelectorProps {
  visible: boolean;
  onClose: () => void;
  currentEquipment?: string;
  onSelect: (equipment: string) => void;
  theme: any;
}

const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({
  visible,
  onClose,
  currentEquipment,
  onSelect,
  theme
}) => {
  const { t } = useLanguage();

  const equipmentOptions = [
    { id: 'bodyweight', name: t('bodyweight'), icon: 'person-outline' },
    { id: 'barbell', name: t('barbell'), icon: 'barbell-outline' },
    { id: 'dumbbell', name: t('dumbbell'), icon: 'fitness-outline' },
    { id: 'kettlebell', name: t('kettlebell'), icon: 'fitness-outline' },
    { id: 'cable', name: t('cable'), icon: 'git-pull-request-outline' },
    { id: 'machine', name: t('machine'), icon: 'hardware-chip-outline' },
    { id: 'resistance_band', name: t('resistance_band'), icon: 'remove-outline' },
    { id: 'medicine_ball', name: t('medicine_ball'), icon: 'basketball-outline' },
    { id: 'suspension', name: t('suspension'), icon: 'git-pull-request-outline' },
    { id: 'smith_machine', name: t('smith_machine'), icon: 'square-outline' },
    { id: 'pull_up_bar', name: t('pull_up_bar'), icon: 'remove-outline' },
    { id: 'bench', name: t('bench'), icon: 'square-outline' },
    { id: 'other', name: t('other'), icon: 'ellipsis-horizontal-outline' }
  ];

  const renderEquipmentOption = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.equipmentOption,
        {
          backgroundColor: currentEquipment === item.id ? `${theme.accent}20` : 'transparent',
          borderColor: currentEquipment === item.id ? theme.accent : theme.border
        }
      ]}
      onPress={() => {
        onSelect(item.id);
        onClose();
      }}
    >
      <View style={styles.equipmentLeft}>
        <View style={[
          styles.equipmentIconContainer,
          { backgroundColor: currentEquipment === item.id ? theme.accent : theme.background_secondary }
        ]}>
          <Ionicons 
            name={item.icon} 
            size={20} 
            color={currentEquipment === item.id ? '#FFFFFF' : theme.text_secondary} 
          />
        </View>
        <Text style={[
          styles.equipmentName,
          { color: currentEquipment === item.id ? theme.accent : theme.text }
        ]}>
          {item.name}
        </Text>
      </View>
      
      {currentEquipment === item.id && (
        <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: theme.card_background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t('select_equipment')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.text_secondary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={equipmentOptions}
            renderItem={renderEquipmentOption}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.equipmentList}
          />
          
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: theme.border }]} 
            onPress={onClose}
          >
            <Text style={[styles.cancelButtonText, { color: theme.text }]}>
              {t('cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  equipmentList: {
    flexGrow: 0,
  },
  equipmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  equipmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  equipmentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EquipmentSelector;