// app/(app)/group-workout/ChatSection.tsx
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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';
import { getAvatarUrl } from '../../../utils/imageUtils';
import { useSendGroupWorkoutMessage } from '../../../hooks/query/useGroupWorkoutQuery';

interface ChatSectionProps {
  groupWorkout: any;
  colors: any;
  user: any;
  isCreator: boolean;
  isParticipant: boolean;
  onRefresh: () => void;
}

const ChatSection: React.FC<ChatSectionProps> = ({
  groupWorkout,
  colors,
  user,
  isCreator,
  isParticipant,
  onRefresh
}) => {
  const { t } = useLanguage();
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
        id: groupWorkout.id,
        content: messageInput
      });
      setMessageInput('');
      onRefresh();
      
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
  
  return (
    <View style={styles.chatSection}>
      <View style={styles.chatHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('group_chat')}
        </Text>
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
            <Text style={[styles.noMessagesText, { color: colors.text.secondary }]}>
              {t('no_messages_yet')}
            </Text>
          </View>
        )}
      </View>
      
      {/* Message Input */}
      {(groupWorkout.status === 'scheduled' || groupWorkout.status === 'in_progress') && 
       (isCreator || isParticipant) && (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <View style={styles.messageInputContainer}>
            <TextInput
              style={[styles.messageInput, { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: colors.text.primary }]}
              placeholder={t('type_message')}
              placeholderTextColor={colors.text.tertiary}
              value={messageInput}
              onChangeText={setMessageInput}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />
            
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: messageInput.trim() ? colors.success : 'rgba(107, 114, 128, 0.2)' }]}
              onPress={handleSendMessage}
              disabled={!messageInput.trim() || isSendingMessage}
            >
              {isSendingMessage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={18} color={messageInput.trim() ? '#FFFFFF' : '#6B7280'} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chatSection: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
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
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  messageInput: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default ChatSection;