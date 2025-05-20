// app/(app)/group-workout-chat/[id].tsx
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
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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
  
  // Get theme context
  const { workoutPalette, palette } = useTheme();
  
  // Create dynamic theme colors
  const COLORS = {
    primary: workoutPalette.background,
    secondary: workoutPalette.highlight,
    tertiary: workoutPalette.border,
    background: palette.page_background,
    card: "#1F2937", // Consistent with other screens
    text: {
      primary: workoutPalette.text,
      secondary: workoutPalette.text_secondary,
      tertiary: "rgba(255, 255, 255, 0.5)"
    },
    border: workoutPalette.border,
    success: "#22c55e", // Keep universal success color
    danger: "#EF4444", // Keep universal danger color
    highlight: workoutPalette.highlight
  };
  
  // State and hooks
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: groupWorkout, isLoading, refetch } = useGroupWorkout(groupWorkoutId);
  const [messageInput, setMessageInput] = useState('');
  const messagesListRef = useRef(null);
  const { mutateAsync: sendMessage, isLoading: isSendingMessage } = useSendGroupWorkoutMessage();
  
  // Format message time
  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd();
      }, 300);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert(t('error'), t('failed_to_send_message'));
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (groupWorkout?.messages?.length) {
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
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
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: COLORS.text.primary }]}>{t('loading')}</Text>
      </View>
    );
  }
  
  // Render error state if group workout not found
  if (!groupWorkout) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: COLORS.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.danger} />
        <Text style={[styles.errorTitle, { color: COLORS.text.primary }]}>{t('workout_not_found')}</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: COLORS.text.primary }]}>{t('back_to_workout')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: COLORS.text.primary }]} numberOfLines={1}>
            {groupWorkout.title}
          </Text>
          <Text style={[styles.participantsCount, { color: COLORS.text.secondary }]}>
            {t('participants')}: {groupWorkout.participants_count}
          </Text>
        </View>
      </View>
      
      {/* Messages */}
      <View style={[styles.messagesContainer, { backgroundColor: 'rgba(31, 41, 55, 0.3)' }]}>
        {groupWorkout.messages && groupWorkout.messages.length > 0 ? (
          <FlatList
            ref={messagesListRef}
            data={groupWorkout.messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={[
                styles.messageContainer,
                item.user === user?.id ? styles.myMessage : styles.otherMessage
              ]}>
                {item.user !== user?.id && (
                  <Image
                    source={{ uri: getAvatarUrl(item.user_details.avatar) }}
                    style={styles.messageAvatar}
                  />
                )}
                
                <View style={[
                  styles.messageBubble,
                  item.user === user?.id ? 
                    [styles.myMessageBubble, { backgroundColor: '#10B981' }] : 
                    [styles.otherMessageBubble, { backgroundColor: '#3B82F6' }]
                ]}>
                  {item.user !== user?.id && (
                    <Text style={styles.messageSender}>
                      {item.user_details.username}
                    </Text>
                  )}
                  
                  <Text style={styles.messageText}>
                    {item.content}
                  </Text>
                  
                  <Text style={styles.messageTime}>
                    {formatMessageTime(item.created_at)}
                  </Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.messagesList}
          />
        ) : (
          <View style={styles.noMessagesContainer}>
            <Text style={[styles.noMessagesText, { color: COLORS.text.secondary }]}>
              {t('no_messages_yet')}
            </Text>
            <Text style={[styles.startConversationText, { color: COLORS.text.tertiary }]}>
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
          keyboardVerticalOffset={100}
          style={styles.inputContainer}
        >
          <View style={styles.messageInputContainer}>
            <TextInput
              style={[styles.messageInput, { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: COLORS.text.primary }]}
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
              style={[styles.sendButton, { backgroundColor: messageInput.trim() ? COLORS.success : 'rgba(107, 114, 128, 0.2)' }]}
              onPress={handleSendMessage}
              disabled={!messageInput.trim() || isSendingMessage}
            >
              {isSendingMessage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color={messageInput.trim() ? '#FFFFFF' : '#6B7280'} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.3)',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantsCount: {
    fontSize: 12,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
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
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
  },
  myMessageBubble: {
    borderTopRightRadius: 4,
  },
  otherMessageBubble: {
    borderTopLeftRadius: 4,
  },
  messageSender: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 4,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
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
  noMessagesText: {
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 16,
    marginBottom: 8,
  },
  startConversationText: {
    textAlign: 'center',
    fontSize: 14,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(75, 85, 99, 0.3)',
    padding: 8,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  }
});