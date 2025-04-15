// components/feed/FabMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Easing,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface FabMenuItem {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface FabMenuProps {
  onItemPress: (itemId: string) => void;
}

const FabMenu: React.FC<FabMenuProps> = ({ onItemPress }) => {
  const { t } = useLanguage();
  const { palette } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  // Animation values
  const animation = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  // Use personality-specific colors for menu items
  const menuItems: FabMenuItem[] = [
    {
      id: 'regular',
      label: t('regular_post'),
      icon: 'create-outline',
      color: '#60A5FA'
    },
    {
      id: 'workout_log',
      label: t('share_workout'),
      icon: 'fitness-outline',
      color: '#34D399'
    },
    {
      id: 'program',
      label: t('share_program'),
      icon: 'barbell-outline',
      color: '#A78BFA'
    },
    {
      id: 'workout_invite',
      label: t('group_workout'),
      icon: 'people-outline',
      color: '#FB923C'
    }
  ];
  
  useEffect(() => {
    if (isOpen) {
      // Animate menu opening
      Animated.parallel([
        Animated.timing(animation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.bezier(0.2, 1, 0.2, 1),
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate menu closing
      Animated.parallel([
        Animated.timing(animation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.bezier(0.2, 1, 0.2, 1),
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const handleItemPress = (itemId: string) => {
    setIsOpen(false);
    onItemPress(itemId);
  };
  
  // Main FAB rotation animation
  const fabRotate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });
  
  return (
    <>
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: backdropOpacity },
          { display: isOpen ? 'flex' : 'none' },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
        onTouchStart={() => setIsOpen(false)}
      />
      
      {/* Menu Items */}
      <View style={styles.fabMenuContainer} pointerEvents="box-none">
        {menuItems.map((item, index) => {
          // Calculate animations for each menu item
          const offsetDistance = 80 + (index * 60);
          
          const itemAnimation = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -offsetDistance],
          });
          
          const itemOpacity = animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
          });
          
          const itemScale = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          });
          
          return (
            <Animated.View
              key={item.id}
              style={[
                styles.fabMenuItem,
                {
                  transform: [
                    { translateY: itemAnimation },
                    { scale: itemScale }
                  ],
                  opacity: itemOpacity,
                }
              ]}
              pointerEvents={isOpen ? 'auto' : 'none'}
            >
              <TouchableOpacity
                style={[styles.fabItemButton, { backgroundColor: item.color }]}
                onPress={() => handleItemPress(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons name={item.icon as any} size={20} color={palette.accent} />
              </TouchableOpacity>
              <View style={[styles.fabItemLabelContainer, { backgroundColor: palette.accent }]}>
                <Text style={[styles.fabItemLabel, { color: palette.text }]}>{item.label}</Text>
              </View>
            </Animated.View>
          );
        })}
        
        {/* Main FAB Button */}
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: palette.highlight }]}
          onPress={toggleMenu}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ rotate: fabRotate }] }}>
            <Ionicons name="add" size={24} color={palette.accent} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  fabMenuContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 2,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabMenuItem: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  fabItemButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabItemLabelContainer: {
    position: 'absolute',
    right: 54,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabItemLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default FabMenu;