// components/feed/FabMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Platform,
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
  style?: object;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// This component is split into two parts:
// 1. The FAB button itself that stays in the header
// 2. The overlay (backdrop + menu items) that renders at the root level

const FabMenu: React.FC<FabMenuProps> = ({ onItemPress, style }) => {
  const { t } = useLanguage();
  const { palette } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [fabButtonLayout, setFabButtonLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const animation = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const fabButtonRef = useRef<TouchableOpacity>(null);

  const menuItems: FabMenuItem[] = [
    { id: 'regular', label: t('regular_post'), icon: 'create-outline', color: '#60A5FA' },
    { id: 'workout_log', label: t('share_workout'), icon: 'fitness-outline', color: '#34D399' },
    { id: 'program', label: t('share_program'), icon: 'barbell-outline', color: '#A78BFA' },
    { id: 'group_workout', label: t('group_workout'), icon: 'people-outline', color: '#FB923C' },
  ];

  useEffect(() => {
    if (isOpen) {
      // Measure FAB button position when menu opens
      if (fabButtonRef.current) {
        fabButtonRef.current.measure((fx, fy, width, height, px, py) => {
          setFabButtonLayout({ x: px, y: py, width, height });
        });
      }

      Animated.parallel([
        Animated.timing(animation, { toValue: 1, duration: 300, useNativeDriver: true, easing: Easing.bezier(0.2, 1, 0.2, 1) }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(animation, { toValue: 0, duration: 200, useNativeDriver: true, easing: Easing.bezier(0.2, 1, 0.2, 1) }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen, animation, backdropOpacity]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleItemPress = (itemId: string) => {
    setIsOpen(false);
    onItemPress(itemId);
  };

  const fabRotate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const renderFabButton = () => (
    <TouchableOpacity
      ref={fabButtonRef}
      style={[styles.fab, { backgroundColor: palette.highlight }, style]}
      onPress={toggleMenu}
      activeOpacity={0.8}
      onLayout={() => {
        if (fabButtonRef.current && !fabButtonLayout) {
          fabButtonRef.current.measure((fx, fy, width, height, px, py) => {
            setFabButtonLayout({ x: px, y: py, width, height });
          });
        }
      }}
    >
      <Animated.View style={{ transform: [{ rotate: fabRotate }] }}>
        <Ionicons name={isOpen ? "close-outline" : "add-outline"} size={28} color={palette.accent} />
      </Animated.View>
    </TouchableOpacity>
  );

  const renderMenuItems = () => {
    if (!fabButtonLayout) return null;

    // Position the menu below the FAB button
    const itemsContainerStyle = {
      position: 'absolute' as 'absolute',
      top: fabButtonLayout.y + fabButtonLayout.height + 8,
      right: screenWidth - (fabButtonLayout.x + fabButtonLayout.width),
      alignItems: 'flex-end' as 'flex-end',
      zIndex: 99,
    };

    return (
      <View style={itemsContainerStyle}>
        {menuItems.map((item, index) => {
          const itemSpacing = 10; // Reduced spacing
          
          const itemAnimationY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, index * itemSpacing],
          });
          const itemOpacity = animation.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
          const itemScale = animation.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });

          return (
            <Animated.View
              key={item.id}
              style={[
                styles.fabMenuItemWrapper,
                {
                  transform: [{ translateY: itemAnimationY }, { scale: itemScale }],
                  opacity: itemOpacity,
                },
              ]}
              pointerEvents={isOpen ? 'auto' : 'none'}
            >
              <Text style={[styles.fabItemLabel, { color: palette.text }]}>{item.label}</Text>
              <TouchableOpacity
                style={[styles.fabItemButton, { backgroundColor: item.color }]}
                onPress={() => handleItemPress(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons name={item.icon as any} size={20} color="white" />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  return (
    <>
      {/* The FAB button in the header */}
      {renderFabButton()}

      {/* The overlay (rendered at root level in feed.tsx) */}
      {isOpen && (
        <>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: backdropOpacity }
            ]}
            onTouchStart={() => setIsOpen(false)}
          />
          {renderMenuItems()}
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    // zIndex: 9998,
  },
  fabMenuItemWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 4,
  },
  fabItemButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginLeft: 10,
  },
  fabItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
});

export default FabMenu;