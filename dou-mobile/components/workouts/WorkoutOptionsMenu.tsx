// WorkoutOptionsMenu.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

type WorkoutOptionsMenuProps = {
  onDeleteWorkout: () => void;
  onEditInfo: () => void;
  onEditExercises: () => void;
  isCreator: boolean;
};

const WorkoutOptionsMenu = ({ 
  onDeleteWorkout, 
  onEditInfo, 
  onEditExercises,
  isCreator
}: WorkoutOptionsMenuProps) => {
  const { t } = useLanguage();
  const [menuVisible, setMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const openMenu = () => {
    setMenuVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };
  
  const closeMenu = (callback?: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
      if (callback) callback();
    });
  };
  
  if (!isCreator) return null;
  
  return (
    <View>
      <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
        <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      
      <Modal
        transparent={true}
        visible={menuVisible}
        animationType="none"
        onRequestClose={() => closeMenu()}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => closeMenu()}
        >
          <Animated.View
            style={[
              styles.menuContainer,
              { opacity: fadeAnim }
            ]}
          >
            <View style={styles.menuContent}>
              <TouchableOpacity 
                style={styles.menuOption}
                onPress={() => closeMenu(onEditInfo)}
              >
                <Ionicons name="information-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.menuOptionText}>{t('edit_workout_info')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuOption}
                onPress={() => closeMenu(onEditExercises)}
              >
                <Ionicons name="barbell-outline" size={20} color="#FFFFFF" />
                <Text style={styles.menuOptionText}>{t('edit_exercises')}</Text>
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <TouchableOpacity 
                style={styles.menuOption}
                onPress={() => closeMenu(onDeleteWorkout)}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text style={[styles.menuOptionText, styles.deleteText]}>{t('delete_workout')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuContent: {
    backgroundColor: '#1F2937', // Card background
    borderRadius: 8,
    minWidth: 200,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
  deleteText: {
    color: '#ef4444',
  },
});

export default WorkoutOptionsMenu;