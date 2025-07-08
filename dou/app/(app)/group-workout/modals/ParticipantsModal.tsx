// app/(app)/group-workout/modals/ParticipantsModal.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../../context/LanguageContext';
import { getAvatarUrl } from '../../../../utils/imageUtils';
import groupWorkoutService from '../../../../api/services/groupWorkoutService';

interface ParticipantsModalProps {
  visible: boolean;
  onClose: () => void;
  participants: any[];
  isCreator: boolean;
  colors: any;
  currentUserId: number | undefined;
  onRemoveParticipant: () => void;
  groupWorkoutId: number;
}

const ParticipantsModal: React.FC<ParticipantsModalProps> = ({
  visible,
  onClose,
  participants,
  isCreator,
  colors,
  currentUserId,
  onRemoveParticipant,
  groupWorkoutId
}) => {
  const { t } = useLanguage();
  
  // Handle removing a participant
  const handleRemoveParticipant = async (userId: number, username: string) => {
    try {
      Alert.alert(
        t('remove_participant'),
        t('confirm_remove_participant', { username }),
        [
          { text: t('cancel'), style: 'cancel' },
          { 
            text: t('remove'), 
            style: 'destructive',
            onPress: async () => {
              await groupWorkoutService.removeParticipant(groupWorkoutId, userId);
              onRemoveParticipant();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to remove participant:', error);
      Alert.alert(t('error'), t('failed_to_remove_participant'));
    }
  };

  // Sort participants: first confirmed, then invited, then others
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.status === 'joined' && b.status !== 'joined') return -1;
    if (a.status !== 'joined' && b.status === 'joined') return 1;
    if (a.status === 'invited' && b.status !== 'invited') return -1;
    if (a.status !== 'invited' && b.status === 'invited') return 1;
    return 0;
  });
  
  // Get status color and text
  const getStatusInfo = (status: string): { color: string, text: string } => {
    switch (status) {
      case 'joined':
        return { color: colors.success, text: t('participating') };
      case 'invited':
        return { color: colors.tertiary, text: t('invited') };
      case 'declined':
        return { color: colors.danger, text: t('declined') };
      case 'removed':
        return { color: colors.danger, text: t('removed') };
      default:
        return { color: colors.text.secondary, text: t(status) };
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
              {t('participants')} ({participants.length})
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={sortedParticipants}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const statusInfo = getStatusInfo(item.status);
              
              return (
                <View style={[styles.participantItem, { borderBottomColor: 'rgba(75, 85, 99, 0.2)' }]}>
                  <View style={styles.participantInfo}>
                    <Image
                      source={{ uri: getAvatarUrl(item.user_details.avatar) }}
                      style={[
                        styles.participantAvatar,
                        item.status === 'invited' && styles.invitedAvatar
                      ]}
                    />
                    
                    <View style={styles.participantDetails}>
                      <Text style={[styles.participantName, { color: colors.text.primary }]}>
                        {item.user_details.username}
                      </Text>
                      
                      <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                        <Text style={[styles.participantStatus, { color: statusInfo.color }]}>
                          {statusInfo.text}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* Remove button - only for creator and only for other participants */}
                  {isCreator && 
                   item.user_details.id !== currentUserId && 
                   item.status === 'joined' && (
                    <TouchableOpacity
                      style={[styles.removeButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}
                      onPress={() => handleRemoveParticipant(item.user_details.id, item.user_details.username)}
                    >
                      <Text style={{ color: colors.danger }}>{t('remove')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                  {t('no_participants_yet')}
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
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  invitedAvatar: {
    opacity: 0.7,
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  participantStatus: {
    fontSize: 14,
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  }
});

export default ParticipantsModal;