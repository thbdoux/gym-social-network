// app/(app)/group-workout/EnhancedChatPreview.tsx - Simplified Chat Preview
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

interface EnhancedChatPreviewProps {
  messages: any[];
  colors: any;
  onViewAllPress: () => void;
  currentUserId?: number;
}

const EnhancedChatPreview: React.FC<EnhancedChatPreviewProps> = ({
  messages,
  colors,
  onViewAllPress,
  currentUserId
}) => {
  const { t } = useLanguage();
  
  // Get the most recent 2 messages for compact display
  const recentMessages = messages ? [...messages].reverse().slice(0, 2).reverse() : [];
  
  // Format message time
  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffMinutes < 1 ? 'now' : `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onViewAllPress}
      activeOpacity={0.9}
    >
      {/* Simplified Header */}
      <View style={[styles.headerContainer, { backgroundColor: colors.card }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Ionicons name="chatbubbles-outline" size={20} color={colors.text.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              {t('group_chat')}
            </Text>
            {messages.length > 0 && (
              <View style={[styles.messageBadge, { backgroundColor: colors.action_bg }]}>
                <Text style={[styles.messageBadgeText, { color: colors.highlight }]}>
                  {messages.length}
                </Text>
              </View>
            )}
          </View>
          
          <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
        </View>
      </View>
      
      {/* Messages Preview */}
      <View style={[styles.messagesContainer, { backgroundColor: colors.card }]}>
        {recentMessages && recentMessages.length > 0 ? (
          <>
            {recentMessages.map((message, index) => (
              <View key={message.id.toString()} style={[
                styles.messageRow,
                index < recentMessages.length - 1 && styles.messageRowBorder,
                { borderBottomColor: 'rgba(255, 255, 255, 0.05)' }
              ]}>
                <Image
                  source={{ uri: getAvatarUrl(message.user_details.avatar) }}
                  style={styles.messageAvatar}
                />
                
                <View style={styles.messageContent}>
                  <View style={styles.messageHeader}>
                    <Text style={[styles.messageSender, { color: colors.text.primary }]}>
                      {message.user === currentUserId ? t('you') : message.user_details.username}
                    </Text>
                    <Text style={[styles.messageTime, { color: colors.text.tertiary }]}>
                      {formatMessageTime(message.created_at)}
                    </Text>
                  </View>
                  
                  <Text 
                    style={[styles.messageText, { color: colors.text.secondary }]} 
                    numberOfLines={2}
                  >
                    {message.content}
                  </Text>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
              <Ionicons name="chatbubble-outline" size={32} color={colors.text.tertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>
              {t('no_messages_yet')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.tertiary }]}>
              {t('be_first_to_start_conversation')}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  messageBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  messageBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  messagesContainer: {
    padding: 16,
  },
  messageRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  messageRowBorder: {
    borderBottomWidth: 1,
    marginBottom: 8,
    paddingBottom: 12,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 13,
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  }
});

export default EnhancedChatPreview;