// components/feed/PostTypeModal.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface PostTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (postType: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PostTypeModal: React.FC<PostTypeModalProps> = ({ 
  visible, 
  onClose, 
  onSelectType
}) => {
  const { t } = useLanguage();
  const { palette } = useTheme();

  const menuItems = [
    { id: 'regular', label: t('regular_post'), icon: 'create-outline', color: '#60A5FA' },
    { id: 'workout_log', label: t('share_workout'), icon: 'fitness-outline', color: '#34D399' },
    { id: 'program', label: t('share_program'), icon: 'barbell-outline', color: '#A78BFA' },
    { id: 'group_workout', label: t('group_workout'), icon: 'people-outline', color: '#FB923C' },
  ];

  const handleItemSelect = (itemId: string) => {
    onSelectType(itemId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.menuContainer}>
          <View style={styles.header}>
            <Text style={styles.headerText}>{t('create_post')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.menuItems}>
            {menuItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleItemSelect(item.id)}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.menuItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: screenWidth,
    height: screenHeight,
  },
  menuContainer: {
    width: '80%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  menuItems: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  }
});

export default PostTypeModal;