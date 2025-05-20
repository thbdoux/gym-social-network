// components/wizard/steps/Step5ChatMiniGame.tsx
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
};

type ChatStageType = {
  message: string;
  options: ChatOption[];
  response_to?: string;
};

interface Step5ChatMiniGameProps {
  onComplete: (data: ScoreType) => void;
  initialScores?: ScoreType;
}

const Step5ChatMiniGame: React.FC<Step5ChatMiniGameProps> = ({ onComplete, initialScores }) => {
  const { t } = useLanguage();
  const [stage, setStage] = useState(0);
  const [selectedResponses, setSelectedResponses] = useState<ChatOption[]>([]);
  const [typing, setTyping] = useState(false);
  const [showFinalResponse, setShowFinalResponse] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Chat conversation flow
  const chatFlow: ChatStageType[] = [
    {
      message: 'chat_initial_message',
      options: [
        {
          id: 'same_as_you',
          text: 'chat_response_same_as_you',
          score: { optimizer: 0, diplomate: 3, mentor: 1, versatile: 1 },
          leads_to: 'friend_excited'
        },
        {
          id: 'hiking',
          text: 'chat_response_hiking',
          score: { optimizer: 1, diplomate: 0, mentor: 0, versatile: 3 },
          leads_to: 'friend_disappointed'
        },
        {
          id: 'gym',
          text: 'chat_response_gym',
          score: { optimizer: 3, diplomate: 0, mentor: 1, versatile: 0 },
          leads_to: 'friend_neutral'
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
          final_response: 'chat_friend_final_excited'
        },
        {
          id: 'workout_first',
          text: 'chat_response_workout_first',
          score: { optimizer: 2, diplomate: 1, mentor: 1, versatile: 0 },
          final_response: 'chat_friend_final_understanding'
        },
        {
          id: 'bring_friends',
          text: 'chat_response_bring_friends',
          score: { optimizer: 0, diplomate: 2, mentor: 3, versatile: 0 },
          final_response: 'chat_friend_final_impressed'
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
          score: { optimizer: 1, diplomate: 2, mentor: 1, versatile: 1 },
          final_response: 'chat_friend_final_pleased'
        },
        {
          id: 'invite_hiking',
          text: 'chat_response_invite_hiking',
          score: { optimizer: 0, diplomate: 1, mentor: 2, versatile: 2 },
          final_response: 'chat_friend_final_interested'
        },
        {
          id: 'stick_to_plan',
          text: 'chat_response_stick_to_plan',
          score: { optimizer: 2, diplomate: 0, mentor: 0, versatile: 3 },
          final_response: 'chat_friend_final_respectful'
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
          score: { optimizer: 2, diplomate: 1, mentor: 3, versatile: 0 },
          final_response: 'chat_friend_final_considering'
        },
        {
          id: 'another_day',
          text: 'chat_response_another_day',
          score: { optimizer: 1, diplomate: 2, mentor: 1, versatile: 1 },
          final_response: 'chat_friend_final_happy'
        },
        {
          id: 'training_important',
          text: 'chat_response_training_important',
          score: { optimizer: 3, diplomate: 0, mentor: 0, versatile: 1 },
          final_response: 'chat_friend_final_admiring'
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
    // Calculate scores based on selected responses
    const calculatedScores: ScoreType = {
      optimizer: 0,
      diplomate: 0,
      mentor: 0,
      versatile: 0
    };
    
    selectedResponses.forEach(response => {
      Object.keys(calculatedScores).forEach(key => {
        calculatedScores[key as keyof ScoreType] += response.score[key as keyof ScoreType];
      });
    });
    
    // Adjust scores to reduce chance of getting "versatile" type
    if (calculatedScores.versatile > Math.max(calculatedScores.optimizer, calculatedScores.diplomate, calculatedScores.mentor)) {
      // Reduce versatile score by 15% if it's the highest
      calculatedScores.versatile *= 0.85;
    }
    
    onComplete(calculatedScores);
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
      
      {/* Chat interface */}
      <View style={styles.chatContainer}>
        {/* Chat header */}
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderIcon}>
            <Ionicons name="chatbubble" size={16} color="#10B981" />
          </View>
          <View>
            <Text style={styles.chatHeaderName}>{t('chat_friend_name')}</Text>
            <Text style={styles.chatHeaderStatus}>{t('chat_friend_status')}</Text>
          </View>
        </View>
        
        {/* Chat messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Initial friend message */}
          <View style={styles.friendMessageRow}>
            <View style={styles.friendAvatar} />
            <View style={styles.friendMessageBubble}>
              <Text style={styles.messageText}>{t(chatFlow[0].message)}</Text>
            </View>
          </View>
          
          {/* First user response if selected */}
          {selectedResponses.length > 0 && (
            <View style={styles.userMessageRow}>
              <View style={styles.userMessageBubble}>
                <Text style={styles.messageText}>{t(selectedResponses[0].text)}</Text>
              </View>
            </View>
          )}
          
          {/* Friend's second message */}
          {stage >= 1 && (
            <View style={styles.friendMessageRow}>
              <View style={styles.friendAvatar} />
              <View style={styles.friendMessageBubble}>
                <Text style={styles.messageText}>{t(getCurrentStage().message)}</Text>
              </View>
            </View>
          )}
          
          {/* Second user response if selected */}
          {selectedResponses.length > 1 && (
            <View style={styles.userMessageRow}>
              <View style={styles.userMessageBubble}>
                <Text style={styles.messageText}>{t(selectedResponses[1].text)}</Text>
              </View>
            </View>
          )}
          
          {/* Friend's final response after user's second message */}
          {showFinalResponse && (
            <View style={styles.friendMessageRow}>
              <View style={styles.friendAvatar} />
              <View style={styles.friendMessageBubble}>
                <Text style={styles.messageText}>{t(getFinalResponseKey())}</Text>
              </View>
            </View>
          )}
          
          {/* Typing indicator */}
          {typing && (
            <View style={styles.friendMessageRow}>
              <View style={styles.friendAvatar} />
              <View style={styles.typingIndicator}>
                <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
                <View style={[styles.typingDot, { animationDelay: '200ms' }]} />
                <View style={[styles.typingDot, { animationDelay: '400ms' }]} />
              </View>
            </View>
          )}
        </ScrollView>
        
        {/* Response options or continue button */}
        <View style={styles.chatFooter}>
          {stage < 2 ? (
            <View style={styles.responseOptions}>
              {getCurrentStage().options.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.responseOption}
                  onPress={() => handleSelectResponse(option)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.responseText}>{t(option.text)}</Text>
                  <Ionicons name="send" size={14} color="#3B82F6" />
                </TouchableOpacity>
              ))}
            </View>
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
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
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
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  friendMessageRow: {
    flexDirection: 'row',
    marginBottom: 16,
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
    marginBottom: 16,
  },
  userMessageBubble: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '70%',
  },
  messageText: {
    color: 'white',
    fontSize: 14,
  },
  typingIndicator: {
    flexDirection: 'row',
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
    opacity: 0.6,
  },
  chatFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(75, 85, 99, 0.3)',
    padding: 12,
  },
  responseOptions: {
    gap: 8,
  },
  responseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  responseText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
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