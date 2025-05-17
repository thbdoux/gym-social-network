// components/feed/PostReactionButton.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Get screen dimensions for positioning
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Available reaction types with emojis
const REACTIONS = [
  { type: 'like', emoji: '👍' },
  { type: 'love', emoji: '❤️' },
  { type: 'laugh', emoji: '😂' },
  { type: 'wow', emoji: '😮' },
  { type: 'sad', emoji: '😢' },
  { type: 'angry', emoji: '😡' }
];

interface PostReactionButtonProps {
  postId: number;
  isReacted: boolean;
  reactionType: string | null;
  reactionsCount: number;
  onReact: (postId: number, reactionType: string) => void;
  onUnreact: (postId: number) => void;
  palette: any;
}

const PostReactionButton: React.FC<PostReactionButtonProps> = ({
  postId,
  isReacted,
  reactionType,
  reactionsCount,
  onReact,
  onUnreact,
  palette
}) => {
  const { t } = useLanguage();
  const [showReactions, setShowReactions] = useState(false);
  
  // Animation references
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bgOpacityAnim = useRef(new Animated.Value(0)).current;
  
  // Reference to measure button position
  const buttonRef = useRef(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Effect to animate reactions panel in/out
  useEffect(() => {
    if (showReactions) {
      // Fade in and scale up - similar to comment section
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 5
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bgOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Fade out and scale down
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(bgOpacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [showReactions]);
  
  // Function to measure button position
  const measureButton = () => {
    if (buttonRef.current) {
      buttonRef.current.measure((fx, fy, width, height, px, py) => {
        setButtonPosition({
          x: px,
          y: py,
          width: width,
          height: height
        });
      });
    }
  };
  
  // Get current reaction details
  const getCurrentReaction = () => {
    if (!isReacted || !reactionType) {
      return { type: null, emoji: null };
    }
    
    const reaction = REACTIONS.find(r => r.type === reactionType);
    return reaction || { type: 'like', emoji: '👍' };
  };
  
  const currentReaction = getCurrentReaction();
  
  // Toggle reaction panel
  const toggleReactionPanel = () => {
    measureButton();
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowReactions(!showReactions);
  };
  
  // Handle press on a reaction
  const handleReactionPress = (reactionType: string) => {
    // If already reacted with this type, unreact
    if (isReacted && currentReaction.type === reactionType) {
      onUnreact(postId);
    } else {
      onReact(postId, reactionType);
    }
    
    setShowReactions(false);
  };
  
  // Handle short press on button - like/unlike
  const handleButtonPress = () => {
    if (isReacted) {
      onUnreact(postId);
    } else {
      onReact(postId, 'like');
    }
  };
  
  // Calculate reaction panel position to ensure it's fully visible on screen
  const calculateReactionPanelPosition = () => {
    // Calculate panel dimensions
    const PANEL_WIDTH = 280;
    const PANEL_HEIGHT = 50;
    
    // Start with centering the panel above the button
    let leftPosition = buttonPosition.x + (buttonPosition.width / 2) - (PANEL_WIDTH / 2);
    let topPosition = buttonPosition.y - PANEL_HEIGHT - 10; // 10px gap above button
    
    // Adjust if panel would go off-screen to the left
    if (leftPosition < 20) {
      leftPosition = 20;
    }
    
    // Adjust if panel would go off-screen to the right
    if (leftPosition + PANEL_WIDTH > screenWidth - 20) {
      leftPosition = screenWidth - PANEL_WIDTH - 20;
    }
    
    // Adjust if panel would go off-screen at the top
    if (topPosition < 60) { // Account for status bar and header
      // Position below the button instead
      topPosition = buttonPosition.y + buttonPosition.height + 10;
    }
    
    return {
      left: leftPosition,
      top: topPosition
    };
  };

  return (
    <View style={styles.container}>
      {/* Long pressable reaction button */}
      <TouchableOpacity
        ref={buttonRef}
        style={styles.button}
        onPress={handleButtonPress}
        onLongPress={toggleReactionPanel}
        delayLongPress={300}
        activeOpacity={0.7}
      >
        <View style={styles.buttonContent}>
          {isReacted && currentReaction.emoji ? (
            <Text style={styles.reactionEmoji}>{currentReaction.emoji}</Text>
          ) : (
            <Ionicons 
              name="heart-outline" 
              size={20} 
              color={palette.border} 
            />
          )}
          <Text 
            style={[
              styles.actionText,
              { color: palette.border },
              isReacted && styles.activeText
            ]}
          >
            {reactionsCount || 0}
          </Text>
        </View>
      </TouchableOpacity>
      
      {/* Using Modal to ensure the reaction panel is in the foreground */}
      <Modal
        visible={showReactions}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowReactions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowReactions(false)}>
          <View style={styles.modalOverlay}>
            {/* Dark background overlay with animation */}
            <Animated.View 
              style={[
                StyleSheet.absoluteFill,
                styles.darkOverlay,
                { opacity: bgOpacityAnim }
              ]} 
            />
            
            {/* Reaction panel with improved positioning */}
            <Animated.View 
              style={[
                styles.reactionsPanel,
                calculateReactionPanelPosition(),
                {
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                  backgroundColor: palette.page_background,
                  borderColor: palette.border,
                }
              ]}
            >
              {REACTIONS.map((reaction) => (
                <TouchableOpacity
                  key={reaction.type}
                  style={[
                    styles.reactionItem,
                    currentReaction.type === reaction.type && styles.activeReactionItem
                  ]}
                  onPress={() => handleReactionPress(reaction.type)}
                >
                  <Text 
                    style={[
                      styles.reactionEmoji,
                      currentReaction.type === reaction.type && styles.activeReactionText
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

const styles = StyleSheet.create({
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
  },
  activeText: {
    color: '#F87171',
  },
  // Modal overlay for handling touches outside reaction panel
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  // Dark background overlay
  darkOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  // Reaction panel styles - improved for positioning and appearance
  reactionsPanel: {
    position: 'absolute',
    width: 280,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    zIndex: 9999,
    elevation: 10, // High elevation for Android
    
    // Add shadow for better visibility
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  reactionItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  reactionEmoji: {
    fontSize: 22,
  },
  activeReactionItem: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
  },
  activeReactionText: {
    fontSize: 24,
  },
});

export default PostReactionButton;