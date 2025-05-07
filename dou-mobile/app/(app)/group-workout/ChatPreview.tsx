// app/(app)/group-workout/ChatPreview.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';
import { getAvatarUrl } from '../../../utils/imageUtils';

interface ChatPreviewProps {
  messages: any[];
  colors: any;
  onViewAllPress: () => void;
  currentUserId?: number;
}

const ChatPreview: React.FC<ChatPreviewProps> = ({
  messages,
  colors,
  onViewAllPress,
  currentUserId
}) => {
  const { t } = useLanguage();
  
  // Get the most recent 3 messages
  const recentMessages = messages ? [...messages].reverse().slice(0, 3).reverse() : [];
  
  // Format message time
  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('group_chat')}
        </Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={onViewAllPress}
        >
          <Text style={[styles.viewAllText, { color: colors.highlight }]}>
            {t('view_all')}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.highlight} />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.previewContainer, { backgroundColor: 'rgba(31, 41, 55, 0.3)' }]}>
        {recentMessages && recentMessages.length > 0 ? (
          <>
            {recentMessages.map((message) => (
              <View key={message.id.toString()} style={[
                styles.messagePreview,
                message.user === currentUserId ? styles.myMessage : {}
              ]}>
                {message.user !== currentUserId && (
                  <Image
                    source={{ uri: getAvatarUrl(message.user_details.avatar) }}
                    style={styles.messageAvatar}
                  />
                )}
                
                <View style={[
                  styles.messageBubble,
                  message.user === currentUserId ? 
                    [styles.myMessageBubble, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }] : 
                    [styles.otherMessageBubble, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]
                ]}>
                  {message.user !== currentUserId && (
                    <Text style={[styles.messageSender, { color: colors.text.secondary }]}>
                      {message.user_details.username}
                    </Text>
                  )}
                  
                  <Text style={[styles.messageText, { color: colors.text.primary }]} numberOfLines={2}>
                    {message.content}
                  </Text>
                  
                  <Text style={[styles.messageTime, { color: colors.text.tertiary }]}>
                    {formatMessageTime(message.created_at)}
                  </Text>
                </View>
              </View>
            ))}
            
            <TouchableOpacity
              style={[styles.openChatButton, { backgroundColor: colors.secondary }]}
              onPress={onViewAllPress}
            >
              <Ionicons name="chatbubbles-outline" size={16} color="#FFFFFF" />
              <Text style={styles.openChatText}>{t('open_group_chat')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.noMessagesContainer}>
            <Text style={[styles.noMessagesText, { color: colors.text.secondary }]}>
              {t('no_messages_yet')}
            </Text>
            <TouchableOpacity
              style={[styles.startChatButton, { backgroundColor: colors.secondary }]}
              onPress={onViewAllPress}
            >
              <Text style={styles.startChatText}>{t('start_conversation')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 2,
  },
  previewContainer: {
    borderRadius: 16,
    padding: 12,
    overflow: 'hidden',
  },
  messagePreview: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '90%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  messageBubble: {
    padding: 8,
    borderRadius: 12,
    maxWidth: '100%',
  },
  myMessageBubble: {
    borderTopRightRadius: 2,
  },
  otherMessageBubble: {
    borderTopLeftRadius: 2,
  },
  messageSender: {
    fontWeight: 'bold',
    fontSize: 11,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageTime: {
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  noMessagesContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noMessagesText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  openChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignSelf: 'center',
    marginTop: 8,
  },
  openChatText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  startChatButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  startChatText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default ChatPreview;