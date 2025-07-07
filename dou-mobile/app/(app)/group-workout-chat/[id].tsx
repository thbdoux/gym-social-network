// app/(app)/group-workout-chat/[id].tsx - Enhanced Chat Screen
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Keyboard,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import { useGroupWorkout, useSendGroupWorkoutMessage } from '../../../hooks/query/useGroupWorkoutQuery';
import { getAvatarUrl } from '../../../utils/imageUtils';

export default function GroupWorkoutChatScreen() {
  // Get group workout ID from route params
  const params = useLocalSearchParams();
  
  // Extract ID with fallbacks
  const rawId = params.id;
  
  let groupWorkoutId: number;
  
  // Handle different types of ID that might come through
  if (typeof rawId === 'string') {
    groupWorkoutId = parseInt(rawId, 10) || 0;
  } else if (typeof rawId === 'number') {
    groupWorkoutId = rawId;
  } else if (Array.isArray(rawId) && rawId.length > 0) {
    // Sometimes params come as arrays
    const firstId = rawId[0];
    groupWorkoutId = typeof firstId === 'string' ? parseInt(firstId, 10) || 0 : 
                typeof firstId === 'number' ? firstId : 0;
  } else {
    groupWorkoutId = 0;
  }
  
  // Use the groupWorkoutPalette for consistent colors with main screen
  const { groupWorkoutPalette, palette } = useTheme();
  
  // Create dynamic theme colors
  const COLORS = {
    primary: groupWorkoutPalette.background,
    secondary: groupWorkoutPalette.highlight,
    tertiary: groupWorkoutPalette.border,
    background: palette.page_background,
    card: "rgba(31, 41, 55, 0.4)", // Slightly transparent for layering
    text: {
      primary: groupWorkoutPalette.text,
      secondary: groupWorkoutPalette.text_secondary,
      tertiary: "rgba(255, 255, 255, 0.6)"
    },
    border: groupWorkoutPalette.border,
    success: "#10b981", // Emerald green
    danger: "#ef4444", // Keep universal danger color
    warning: "#f59e0b", // Amber warning
    highlight: groupWorkoutPalette.highlight,
    badge_bg: groupWorkoutPalette.badge_bg,
    action_bg: groupWorkoutPalette.action_bg,
    gradientStart: "#f59e0b", // amber-500
    gradientEnd: "#d97706"    // amber-600
  };
  
  // State and hooks
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: groupWorkout, isLoading, refetch } = useGroupWorkout(groupWorkoutId);
  const [messageInput, setMessageInput] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const messagesListRef = useRef(null);
  const { mutateAsync: sendMessage, isLoading: isSendingMessage } = useSendGroupWorkoutMessage();
  
  // Listen for keyboard events to improve scrolling behavior
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        scrollToBottom(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Format message time
  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format message date for section headers
  const formatMessageDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t('today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('yesterday');
    } else {
      return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    try {
      await sendMessage({
        id: groupWorkoutId,
        content: messageInput
      });
      setMessageInput('');
      await refetch();
      
      // Scroll to bottom after message sent
      scrollToBottom(true);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert(t('error'), t('failed_to_send_message'));
    }
  };
  
  // Improved scroll to bottom function
  const scrollToBottom = (animated = false) => {
    if (messagesListRef.current && groupWorkout?.messages?.length) {
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd({ animated });
      }, 100);
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom(false);
  }, [groupWorkout?.messages]);
  
  // Check if user is a participant or creator
  const canParticipate = (): boolean => {
    if (!user || !groupWorkout) return false;
    
    if (groupWorkout.is_creator) return true;
    
    const isParticipant = groupWorkout.participants?.some(
      p => p.user === user.id && p.status === 'joined'
    );
    
    return isParticipant || groupWorkout.privacy === 'public';
  };
  
  // Group messages by date
  const groupMessagesByDate = (messages) => {
    if (!messages || !messages.length) return [];
    
    const groupedMessages = [];
    let currentDate = null;
    
    messages.forEach(message => {
      const messageDate = new Date(message.created_at).toDateString();
      
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groupedMessages.push({
          type: 'date',
          date: message.created_at,
          id: `date-${message.created_at}`
        });
      }
      
      groupedMessages.push({
        type: 'message',
        ...message
      });
    });
    
    return groupedMessages;
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={[styles.loadingText, { color: "#ffffff" }]}>{t('loading')}</Text>
      </LinearGradient>
    );
  }
  
  // Render error state if group workout not found
  if (!groupWorkout) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: COLORS.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.danger} />
        <Text style={[styles.errorTitle, { color: COLORS.text.primary }]}>{t('workout_not_found')}</Text>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: COLORS.primary }]} 
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: COLORS.text.primary }]}>
            {t('back_to_workout')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Process messages for the FlatList
  const processedMessages = groupMessagesByDate(groupWorkout.messages);
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {groupWorkout.title}
          </Text>
          <Text style={styles.participantsCount}>
            {t('participants')}: {groupWorkout.participants_count}
          </Text>
        </View>
      </LinearGradient>
      
      {/* Messages */}
      <View style={styles.messagesContainer}>
        {processedMessages.length > 0 ? (
          <FlatList
            ref={messagesListRef}
            data={processedMessages}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            renderItem={({ item }) => {
              if (item.type === 'date') {
                // Render date separator
                return (
                  <View style={styles.dateSeparator}>
                    <View style={[styles.dateLine, { backgroundColor: COLORS.border }]} />
                    <View style={[styles.dateContainer, { backgroundColor: COLORS.card }]}>
                      <Text style={[styles.dateText, { color: COLORS.text.tertiary }]}>
                        {formatMessageDate(item.date)}
                      </Text>
                    </View>
                    <View style={[styles.dateLine, { backgroundColor: COLORS.border }]} />
                  </View>
                );
              }
              
              // Render message
              const isMyMessage = item.user === user?.id;
              
              return (
                <View style={[
                  styles.messageContainer,
                  isMyMessage ? styles.myMessage : styles.otherMessage
                ]}>
                  {!isMyMessage && (
                    <Image
                      source={{ uri: getAvatarUrl(item.user_details.avatar) }}
                      style={styles.messageAvatar}
                    />
                  )}
                  
                  <View style={[
                    styles.messageBubble,
                    isMyMessage ? 
                      [styles.myMessageBubble, { backgroundColor: COLORS.highlight }] : 
                      [styles.otherMessageBubble, { backgroundColor: COLORS.card }]
                  ]}>
                    {!isMyMessage && (
                      <Text style={[styles.messageSender, { color: COLORS.text.primary }]}>
                        {item.user_details.username}
                      </Text>
                    )}
                    
                    <Text style={[
                      styles.messageText, 
                      { color: isMyMessage ? '#FFFFFF' : COLORS.text.primary }
                    ]}>
                      {item.content}
                    </Text>
                    
                    <Text style={[
                      styles.messageTime, 
                      { color: isMyMessage ? 'rgba(255, 255, 255, 0.7)' : COLORS.text.tertiary }
                    ]}>
                      {formatMessageTime(item.created_at)}
                    </Text>
                  </View>
                </View>
              );
            }}
            contentContainerStyle={styles.messagesList}
          />
        ) : (
          <View style={styles.noMessagesContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
              <Ionicons name="chatbubbles-outline" size={40} color={COLORS.text.tertiary} />
            </View>
            <Text style={[styles.noMessagesText, { color: COLORS.text.primary }]}>
              {t('no_messages_yet')}
            </Text>
            <Text style={[styles.startConversationText, { color: COLORS.text.secondary }]}>
              {t('be_first_to_message')}
            </Text>
          </View>
        )}
      </View>
      
      {/* Message Input */}
      {(groupWorkout.status === 'scheduled' || groupWorkout.status === 'in_progress') && 
       canParticipate() && (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
          style={[styles.inputContainer, { borderTopColor: COLORS.border }]}
        >
          <View style={styles.messageInputContainer}>
            <TextInput
              style={[
                styles.messageInput, 
                { 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                  color: COLORS.text.primary,
                  borderColor: COLORS.border
                }
              ]}
              placeholder={t('type_message')}
              placeholderTextColor={COLORS.text.tertiary}
              value={messageInput}
              onChangeText={setMessageInput}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
              multiline={true}
              maxLength={500}
            />
            
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                { 
                  backgroundColor: messageInput.trim() 
                    ? COLORS.highlight 
                    : 'rgba(107, 114, 128, 0.2)' 
                }
              ]}
              onPress={handleSendMessage}
              disabled={!messageInput.trim() || isSendingMessage}
            >
              {isSendingMessage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={messageInput.trim() ? '#FFFFFF' : COLORS.text.tertiary} 
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  participantsCount: {
    fontSize: 12,
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  dateContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: width * 0.75,
  },
  myMessage: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  myMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  noMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noMessagesText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  startConversationText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    borderTopWidth: 1,
    padding: 12,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  }
});