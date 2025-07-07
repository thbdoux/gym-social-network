// components/feed/PostReactionButton.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  UIManager,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles, withAlpha } from '../../utils/createThemedStyles';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Get screen dimensions
const { width: screenWidth } = Dimensions.get('window');

// Available reaction types - simple like Facebook
const REACTIONS = [
  { type: 'like', emoji: '👍', color: '#3B82F6' },
  { type: 'love', emoji: '❤️', color: '#EF4444' },
  { type: 'laugh', emoji: '😂', color: '#F59E0B' },
  { type: 'wow', emoji: '😮', color: '#8B5CF6' },
  { type: 'sad', emoji: '😢', color: '#06B6D4' },
  { type: 'angry', emoji: '😡', color: '#F97316' }
];

interface PostReactionButtonProps {
  postId: number;
  isReacted: boolean;
  reactionType: string | null;
  reactionsCount: number;
  onReact: (postId: number, reactionType: string) => void;
  onUnreact: (postId: number) => void;
}

const PostReactionButton: React.FC<PostReactionButtonProps> = ({
  postId,
  isReacted,
  reactionType,
  reactionsCount,
  onReact,
  onUnreact
}) => {
  const { t } = useLanguage();
  const { palette } = useTheme();
  const [showReactions, setShowReactions] = useState(false);
  
  // Animation references
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const buttonRef = useRef(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const styles = themedStyles(palette);
  
  // Effect to animate reactions panel
  useEffect(() => {
    if (showReactions) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 20
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [showReactions]);
  
  // Measure button position
  const measureButton = () => {
    if (buttonRef.current) {
      buttonRef.current.measure((fx, fy, width, height, px, py) => {
        setButtonPosition({ x: px, y: py, width, height });
      });
    }
  };
  
  // Get current reaction details
  const getCurrentReaction = () => {
    if (!isReacted || !reactionType) return null;
    return REACTIONS.find(r => r.type === reactionType) || REACTIONS[0];
  };
  
  const currentReaction = getCurrentReaction();
  
  // Toggle reaction panel
  const toggleReactionPanel = () => {
    measureButton();
    setShowReactions(!showReactions);
  };
  
  // Handle reaction press
  const handleReactionPress = (selectedReactionType: string) => {
    if (isReacted && currentReaction?.type === selectedReactionType) {
      onUnreact(postId);
    } else {
      onReact(postId, selectedReactionType);
    }
    setShowReactions(false);
  };
  
  // Handle button press
  const handleButtonPress = () => {
    if (isReacted) {
      onUnreact(postId);
    } else {
      onReact(postId, 'like');
    }
  };
  
  // Calculate panel position
  const calculatePanelPosition = () => {
    const PANEL_WIDTH = 300;
    const PANEL_HEIGHT = 50;
    
    let leftPosition = buttonPosition.x + (buttonPosition.width / 2) - (PANEL_WIDTH / 2);
    let topPosition = buttonPosition.y - PANEL_HEIGHT - 10;
    
    // Keep panel on screen
    if (leftPosition < 16) leftPosition = 16;
    if (leftPosition + PANEL_WIDTH > screenWidth - 16) {
      leftPosition = screenWidth - PANEL_WIDTH - 16;
    }
    if (topPosition < 100) {
      topPosition = buttonPosition.y + buttonPosition.height + 10;
    }
    
    return { left: leftPosition, top: topPosition };
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        ref={buttonRef}
        style={styles.button}
        onPress={handleButtonPress}
        onLongPress={toggleReactionPanel}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <View style={styles.buttonContent}>
          {currentReaction ? (
            <Text style={styles.reactionEmoji}>{currentReaction.emoji}</Text>
          ) : (
            <Ionicons 
              name="heart-outline" 
              size={20} 
              color={palette.text_secondary} 
            />
          )}
          <Text 
            style={[
              styles.actionText,
              currentReaction && { color: currentReaction.color }
            ]}
          >
            {reactionsCount || 0}
          </Text>
        </View>
      </TouchableOpacity>
      
      {/* Simple horizontal reaction panel */}
      <Modal
        visible={showReactions}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowReactions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowReactions(false)}>
          <View style={styles.modalOverlay}>
            <Animated.View 
              style={[
                styles.reactionsPanel,
                calculatePanelPosition(),
                {
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
              {REACTIONS.map((reaction) => (
                <TouchableOpacity
                  key={reaction.type}
                  style={[
                    styles.reactionItem,
                    currentReaction?.type === reaction.type && styles.activeReactionItem
                  ]}
                  onPress={() => handleReactionPress(reaction.type)}
                >
                  <Text 
                    style={[
                      styles.reactionEmojiLarge,
                      currentReaction?.type === reaction.type && styles.activeReactionEmoji
                    ]}
                  >
                    {reaction.emoji}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

// Themed styles
const themedStyles = createThemedStyles((palette) => ({
  container: {
    position: 'relative',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: palette.text_secondary,
    fontWeight: '500',
  },
  reactionEmoji: {
    fontSize: 20,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  // Simple horizontal panel like Facebook
  reactionsPanel: {
    position: 'absolute',
    width: 300,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: palette.card_background,
    borderRadius: 25,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: withAlpha(palette.border, 0.3),
    
    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  
  reactionItem: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  activeReactionItem: {
    backgroundColor: withAlpha(palette.accent, 0.2),
    transform: [{ scale: 1.1 }],
  },
  
  reactionEmojiLarge: {
    fontSize: 28,
  },
  
  activeReactionEmoji: {
    fontSize: 32,
  },
}));

export default PostReactionButton;