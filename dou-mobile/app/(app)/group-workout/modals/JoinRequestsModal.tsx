// app/(app)/group-workout/modals/JoinRequestsModal.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../../context/LanguageContext';
import { getAvatarUrl } from '../../../../utils/imageUtils';
import groupWorkoutService from '../../../../api/services/groupWorkoutService';

interface JoinRequestsModalProps {
  visible: boolean;
  onClose: () => void;
  joinRequests: any[];
  colors: any;
  groupWorkoutId: number;
  onRespond: () => void;
}

const JoinRequestsModal: React.FC<JoinRequestsModalProps> = ({
  visible,
  onClose,
  joinRequests,
  colors,
  groupWorkoutId,
  onRespond
}) => {
  const { t } = useLanguage();
  const [processingRequests, setProcessingRequests] = useState<{[key: number]: boolean}>({});
  
  // Handle responding to join requests
  const handleRespondToRequest = async (requestId: number, response: 'approve' | 'reject') => {
    // Update processing state
    setProcessingRequests(prev => ({ ...prev, [requestId]: true }));
    
    try {
      await groupWorkoutService.respondToJoinRequest(
        groupWorkoutId,
        requestId,
        response
      );
      
      // Update processing state
      setProcessingRequests(prev => ({ ...prev, [requestId]: false }));
      
      // Refresh the data
      onRespond();
    } catch (error) {
      console.error('Failed to respond to join request:', error);
      
      // Update processing state
      setProcessingRequests(prev => ({ ...prev, [requestId]: false }));
      
      Alert.alert(t('error'), t('failed_to_respond_to_request'));
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {t('join_requests')} ({joinRequests.length})
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={joinRequests}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const isProcessing = processingRequests[item.id] || false;
              
              return (
                <View style={[styles.requestItem, { borderBottomColor: 'rgba(75, 85, 99, 0.2)' }]}>
                  <View style={styles.requestInfo}>
                    <Image
                      source={{ uri: getAvatarUrl(item.user_details.avatar) }}
                      style={styles.requestAvatar}
                    />
                    
                    <View style={styles.requestDetails}>
                      <Text style={[styles.requestName, { color: colors.text.primary }]}>
                        {item.user_details.username}
                      </Text>
                      
                      {item.message && (
                        <Text style={[styles.requestMessage, { color: colors.text.secondary }]}>
                          "{item.message}"
                        </Text>
                      )}
                      
                      <Text style={[styles.requestDate, { color: colors.text.tertiary }]}>
                        {new Date(item.created_at).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  
                  {isProcessing ? (
                    <View style={styles.processingContainer}>
                      <ActivityIndicator size="small" color={colors.text.primary} />
                    </View>
                  ) : (
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={[styles.rejectButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}
                        onPress={() => handleRespondToRequest(item.id, 'reject')}
                      >
                        <Text style={{ color: colors.danger }}>{t('reject')}</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.approveButton, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}
                        onPress={() => handleRespondToRequest(item.id, 'approve')}
                      >
                        <Text style={{ color: colors.success }}>{t('approve')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyListContainer}>
                <Text style={[styles.emptyListText, { color: colors.text.secondary }]}>
                  {t('no_pending_requests')}
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  requestItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  requestInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  requestDetails: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  requestMessage: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  rejectButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  approveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  processingContainer: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyListText: {
    textAlign: 'center',
  }
});

export default JoinRequestsModal;