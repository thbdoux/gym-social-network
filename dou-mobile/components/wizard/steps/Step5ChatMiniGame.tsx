// components/wizard/steps/Step5ChatMiniGame.tsx - Enhanced with no personality spoilers
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../../context/LanguageContext';

type ScoreType = {
  optimizer: number;
  diplomate: number;
  mentor: number;
  versatile: number;
};

type ChatOption = {
  id: string;
  text: string;
  score: ScoreType;
  leads_to?: string;
  final_response?: string;
  personality_type: string; // Keep for internal scoring, but don't show to user
  gradient: string[];
};

type ChatStageType = {
  message: string;
  options: ChatOption[];
  response_to?: string;
};

interface Step5ChatMiniGameProps {
  onComplete: (data: ScoreType & { responses: any }) => void;
  initialScores?: ScoreType;
}

const Step5ChatMiniGame: React.FC<Step5ChatMiniGameProps> = ({ onComplete, initialScores }) => {
  const { t } = useLanguage();
  const [stage, setStage] = useState(0);
  const [selectedResponses, setSelectedResponses] = useState<ChatOption[]>([]);
  const [typing, setTyping] = useState(false);
  const [showFinalResponse, setShowFinalResponse] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [messageAnimations] = useState(() => 
    Array.from({ length: 10 }, () => new Animated.Value(0))
  );
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Enhanced chat conversation flow with REBALANCED scores (no personality spoilers shown)
  const chatFlow: ChatStageType[] = [
    {
      message: 'chat_initial_message',
      options: [
        {
          id: 'same_as_you',
          text: 'chat_response_same_as_you',
          score: { optimizer: 0, diplomate: 3, mentor: 1, versatile: 1 },
          leads_to: 'friend_excited',
          personality_type: 'diplomate',
          gradient: ['rgba(99, 102, 241, 0.2)', 'rgba(67, 56, 202, 0.1)'] // Neutral gradient
        },
        {
          id: 'hiking',
          text: 'chat_response_hiking',
          score: { optimizer: 1, diplomate: 1, mentor: 1, versatile: 3 },
          leads_to: 'friend_disappointed',
          personality_type: 'versatile',
          gradient: ['rgba(99, 102, 241, 0.2)', 'rgba(67, 56, 202, 0.1)'] // Neutral gradient
        },
        {
          id: 'gym',
          text: 'chat_response_gym',
          score: { optimizer: 2, diplomate: 0, mentor: 1, versatile: 1 },
          leads_to: 'friend_neutral',
          personality_type: 'optimizer',
          gradient: ['rgba(99, 102, 241, 0.2)', 'rgba(67, 56, 202, 0.1)'] // Neutral gradient
        },
        {
          id: 'help_friend',
          text: 'chat_response_help_friend',
          score: { optimizer: 1, diplomate: 2, mentor: 3, versatile: 1 },
          leads_to: 'friend_grateful',
          personality_type: 'mentor',
          gradient: ['rgba(99, 102, 241, 0.2)', 'rgba(67, 56, 202, 0.1)'] // Neutral gradient
        }
      ]
    },
    {
      response_to: 'friend_excited',
      message: 'chat_friend_excited',
      options: [
        {
          id: 'join_party',
          text: 'chat_response_join_party',
          score: { optimizer: 0, diplomate: 3, mentor: 1, versatile: 1 },
          final_response: 'chat_friend_final_excited',
          personality_type: 'diplomate',
          gradient: ['rgba(99, 102, 241, 0.2)', 'rgba(67, 56, 202, 0.1)']
        },
        {
          id: 'workout_first',
          text: 'chat_response_workout_first',
          score: { optimizer: 2, diplomate: 1, mentor: 1, versatile: 1 },
          final_response: 'chat_friend_final_understanding',
          personality_type: 'optimizer',
          gradient: ['rgba(99, 102, 241, 0.2)', 'rgba(67, 56, 202, 0.1)']
        },
        {
          id: 'bring_friends',
          text: 'chat_response_bring_friends',
          score: { optimizer: 1, diplomate: 2, mentor: 3, versatile: 1 },
          final_response: 'chat_friend_final_impressed',
          personality_type: 'mentor',
          gradient: ['rgba(99, 102, 241, 0.2)', 'rgba(67, 56, 202, 0.1)']
        }
      ]
    },
    {
      response_to: 'friend_disappointed',
      message: 'chat_friend_disappointed',
      options: [
        {
          id: 'next_time',
          text: 'chat_response_next_time',
          score: { optimizer: 1, diplomate: 2, mentor: 2, versatile: 1 },
          final_response: 'chat_friend_final_pleased',
          personality_type: 'diplomate',
          gradient: ['rgba(99, 102, 241, 0.2)', 'rgba(67, 56, 202, 0.1)']
        },
        {
          id: 'invite_hiking',
          text: 'chat_response_invite_hiking',
          score: { optimizer: 0, diplomate: 2, mentor: 2, versatile: 2 },
          final_response: 'chat_friend_final_interested',
          personality_type: 'versatile',
          gradient: ['rgba(99, 102, 241, 0.2)', 'rgba(67, 56, 202, 0.1)']
        },
        {
          id: 'stick_to_plan',
          text: 'chat_response_stick_to_plan',
          score: { optimizer: 1, diplomate: 0, mentor: 1, versatile: 3 },
          final_response: 'chat_friend_final_respectful',
          personality_type: 'versatile',
          gradient: ['rgba(99, 102, 241, 0.2)', 'rgba(67, 56, 202, 0.1)']
        }
      ]
    },
    {
      response_to: 'friend_neutral',
      message: 'chat_friend_neutral',
      options: [
        {
          id: 'come_to_gym',
          text: 'chat_response_come_to_gym',
          score: { optimizer: 1, diplomate: 2, mentor: 3, versatile: 0 },
          final_response: 'chat_friend_final_considering',
          personality_type: 'mentor',
          gradient: ['rgba(99, 102, 241, 0.2)', 'rgba(67, 56, 202, 0.1)']
        },
        {
          id: 'another_day',
          text: 'chat_response_another_day',
          score: { optimizer: 1, diplomate: 2, mentor: 1, versatile: 2 },
          final_response: 'chat_friend_final_happy',
          personality_type: 'diplomate',
          gradient: ['rgba(99, 102, 241, 0.2)', 'rgba(67, 56, 202, 0.1)']
        },
        {
          id: 'training_important',
          text: 'chat_response_training_important',
          score: { optimizer: 2, diplomate: 0, mentor: 0, versatile: 1 },
          final_response: 'chat_friend_final_admiring',
          personality_type: 'optimizer',
          gradient: ['rgba(99, 102, 241, 0.2)', 'rgba(67, 56, 202, 0.1)']
        }
      ]
    },
    {
      response_to: 'friend_grateful',
      message: 'chat_friend_grateful',
      options: [
        {
          id: 'give_advice',
          text: 'chat_response_give_advice',
          score: { optimizer: 1, diplomate: 1, mentor: 3, versatile: 1 },
          final_response: 'chat_friend_final_thankful',
          personality_type: 'mentor',
          gradient: ['rgba(99, 102, 241, 0.2)', 'rgba(67, 56, 202, 0.1)']
        },
        {
          id: 'plan_together',
          text: 'chat_response_plan_together',
          score: { optimizer: 2, diplomate: 2, mentor: 2, versatile: 2 },
          final_response: 'chat_friend_final_excited_plan',
          personality_type: 'versatile',
          gradient: ['rgba(99, 102, 241, 0.2)', 'rgba(67, 56, 202, 0.1)']
        }
      ]
    }
  ];
  
  // Animation when component mounts
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad)
    }).start();
  }, []);
  
  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [stage, selectedResponses, typing, showFinalResponse]);
  
  // Animate new messages
  useEffect(() => {
    const messageIndex = selectedResponses.length + (typing ? 1 : 0);
    if (messageIndex < messageAnimations.length) {
      Animated.timing(messageAnimations[messageIndex], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad)
      }).start();
    }
  }, [selectedResponses.length, typing, messageAnimations]);
  
  // Get current stage of the chat
  const getCurrentStage = () => {
    if (stage === 0) return chatFlow[0];
    
    const previousResponse = selectedResponses[0];
    const friendResponseType = previousResponse.leads_to;
    
    return chatFlow.find(flow => flow.response_to === friendResponseType) || chatFlow[0];
  };
  
  // Get final response message key
  const getFinalResponseKey = () => {
    if (selectedResponses.length < 2) return '';
    return selectedResponses[1].final_response || 'chat_friend_final_default';
  };
  
  // Handle selecting a response
  const handleSelectResponse = (option: ChatOption) => {
    // Add selected response to history
    setSelectedResponses(prev => [...prev, option]);
    
    // Show typing indicator
    setTyping(true);
    
    // After a delay, move to next stage
    setTimeout(() => {
      setTyping(false);
      if (stage === 1) {
        // For the second response, show the final message from friend
        setShowFinalResponse(true);
        
        // After showing the final response, enable the continue button
        setTimeout(() => {
          setStage(prev => prev + 1);
        }, 1500);
      } else {
        setStage(prev => prev + 1);
      }
    }, 1500);
  };
  
  // Handle completing the chat
  const handleContinue = () => {
    // Calculate scores based on selected responses with enhanced weighting
    const calculatedScores: ScoreType = {
      optimizer: 0,
      diplomate: 0,
      mentor: 0,
      versatile: 0
    };
    
    // Store detailed user responses for analytics
    const responses = {
      selected_responses: selectedResponses.map(response => ({
        id: response.id,
        text: response.text,
        personality_type: response.personality_type,
        leads_to: response.leads_to,
        final_response: response.final_response
      })),
      conversation_path: selectedResponses.map(r => r.leads_to).filter(Boolean),
      personality_progression: selectedResponses.map(response => response.personality_type),
      response_consistency: {
        same_personality_count: selectedResponses.filter((r, i, arr) => 
          i === 0 || r.personality_type === arr[i-1].personality_type
        ).length,
        total_responses: selectedResponses.length
      }
    };
    
    // Weight first response more heavily (sets the tone)
    const weights = [1.5, 1.0]; // First response weighted 50% more
    
    selectedResponses.forEach((response, index) => {
      const weight = weights[index] || 1;
      Object.keys(calculatedScores).forEach(key => {
        calculatedScores[key as keyof ScoreType] += response.score[key as keyof ScoreType] * weight;
      });
    });
    
    // Consistency bonus: if user chose same personality type consistently, small bonus
    const personalityTypes = selectedResponses.map(r => r.personality_type);
    const consistentType = personalityTypes[0];
    const isConsistent = personalityTypes.every(type => type === consistentType);
    
    if (isConsistent && selectedResponses.length > 1) {
      calculatedScores[consistentType as keyof ScoreType] += 1; // Small consistency bonus
    }
    
    // Apply diminishing returns to prevent single-response dominance
    Object.keys(calculatedScores).forEach(key => {
      const score = calculatedScores[key as keyof ScoreType];
      calculatedScores[key as keyof ScoreType] = Math.sqrt(score + 1) * 2; // Moderate diminishing returns
    });
    
    console.log('💬 Step 5 Chat - Calculated scores:', calculatedScores);
    console.log('📊 Step 5 Chat - User responses:', responses);
    
    onComplete({ ...calculatedScores, responses });
  };
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim }
      ]}
    >
      <Text style={styles.title}>{t('chat_title')}</Text>
      <Text style={styles.subtitle}>{t('chat_subtitle')}</Text>
      
      {/* Enhanced chat interface */}
      <View style={styles.chatContainer}>
        {/* Chat header */}
        <LinearGradient
          colors={['rgba(31, 41, 55, 0.9)', 'rgba(31, 41, 55, 0.7)']}
          style={styles.chatHeader}
        >
          <View style={styles.chatHeaderIcon}>
            <Ionicons name="chatbubble" size={16} color="#10B981" />
          </View>
          <View>
            <Text style={styles.chatHeaderName}>{t('chat_friend_name')}</Text>
            <Text style={styles.chatHeaderStatus}>
              {typing ? t('chat_typing') || 'typing...' : t('chat_friend_status')}
            </Text>
          </View>
          <View style={styles.chatIndicators}>
            <View style={[styles.onlineIndicator, typing && styles.typingIndicator]} />
          </View>
        </LinearGradient>
        
        {/* Chat messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Initial friend message */}
          <Animated.View 
            style={[
              styles.messageWrapper,
              {
                opacity: messageAnimations[0],
                transform: [
                  {
                    translateY: messageAnimations[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    })
                  }
                ]
              }
            ]}
          >
            <View style={styles.friendMessageRow}>
              <View style={styles.friendAvatar} />
              <View style={styles.friendMessageBubble}>
                <Text style={styles.messageText}>{t(chatFlow[0].message)}</Text>
              </View>
            </View>
          </Animated.View>
          
          {/* First user response if selected */}
          {selectedResponses.length > 0 && (
            <Animated.View 
              style={[
                styles.messageWrapper,
                {
                  opacity: messageAnimations[1],
                  transform: [
                    {
                      translateY: messageAnimations[1].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={styles.userMessageRow}>
                <LinearGradient
                  colors={selectedResponses[0].gradient}
                  style={styles.userMessageBubble}
                >
                  <Text style={styles.messageText}>{t(selectedResponses[0].text)}</Text>
                </LinearGradient>
              </View>
            </Animated.View>
          )}
          
          {/* Friend's second message */}
          {stage >= 1 && (
            <Animated.View 
              style={[
                styles.messageWrapper,
                {
                  opacity: messageAnimations[2],
                  transform: [
                    {
                      translateY: messageAnimations[2].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={styles.friendMessageRow}>
                <View style={styles.friendAvatar} />
                <View style={styles.friendMessageBubble}>
                  <Text style={styles.messageText}>{t(getCurrentStage().message)}</Text>
                </View>
              </View>
            </Animated.View>
          )}
          
          {/* Second user response if selected */}
          {selectedResponses.length > 1 && (
            <Animated.View 
              style={[
                styles.messageWrapper,
                {
                  opacity: messageAnimations[3],
                  transform: [
                    {
                      translateY: messageAnimations[3].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={styles.userMessageRow}>
                <LinearGradient
                  colors={selectedResponses[1].gradient}
                  style={styles.userMessageBubble}
                >
                  <Text style={styles.messageText}>{t(selectedResponses[1].text)}</Text>
                </LinearGradient>
              </View>
            </Animated.View>
          )}
          
          {/* Friend's final response */}
          {showFinalResponse && (
            <Animated.View 
              style={[
                styles.messageWrapper,
                {
                  opacity: messageAnimations[4],
                  transform: [
                    {
                      translateY: messageAnimations[4].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={styles.friendMessageRow}>
                <View style={styles.friendAvatar} />
                <View style={styles.friendMessageBubble}>
                  <Text style={styles.messageText}>{t(getFinalResponseKey())}</Text>
                </View>
              </View>
            </Animated.View>
          )}
          
          {/* Typing indicator */}
          {typing && (
            <Animated.View style={styles.friendMessageRow}>
              <View style={styles.friendAvatar} />
              <View style={styles.typingIndicatorBubble}>
                <View style={styles.typingDots}>
                  <Animated.View style={[styles.typingDot, { opacity: fadeAnim }]} />
                  <Animated.View style={[styles.typingDot, { opacity: fadeAnim }]} />
                  <Animated.View style={[styles.typingDot, { opacity: fadeAnim }]} />
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>
        
        {/* Response options or continue button */}
        <View style={styles.chatFooter}>
          {stage < 2 ? (
            <ScrollView 
              style={styles.responseOptionsScrollView}
              contentContainerStyle={styles.responseOptions}
              showsVerticalScrollIndicator={false}
            >
              {getCurrentStage().options.map((option) => {
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.responseOption}
                    onPress={() => handleSelectResponse(option)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['transparent', ...option.gradient.map(c => c.replace('0.2', '0.1'))]}
                      style={styles.responseGradient}
                    />
                    
                    <View style={styles.responseContent}>
                      <Text style={styles.responseText}>{t(option.text)}</Text>
                      
                      <View style={styles.responseFooter}>
                        {/* REMOVED: Personality indicators to prevent spoilers */}
                        <Ionicons name="send" size={14} color="#6366F1" />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>{t('finish_chat')}</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chatHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatHeaderName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  chatHeaderStatus: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  chatIndicators: {
    marginLeft: 'auto',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  typingIndicator: {
    backgroundColor: '#F59E0B',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  friendMessageRow: {
    flexDirection: 'row',
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    marginRight: 8,
  },
  friendMessageBubble: {
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '70%',
  },
  userMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  userMessageBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '70%',
    marginRight: 8,
  },
  messageText: {
    color: 'white',
    fontSize: 14,
  },
  typingIndicatorBubble: {
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
  },
  chatFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(75, 85, 99, 0.3)',
    padding: 12,
    maxHeight: 200,
  },
  responseOptionsScrollView: {
    maxHeight: 150,
  },
  responseOptions: {
    gap: 8,
  },
  responseOption: {
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  responseGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  responseContent: {
    padding: 12,
  },
  responseText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 18,
  },
  responseFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
});


export default Step5ChatMiniGame;