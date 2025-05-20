// app/(app)/group-workout/modals/InviteModal.tsx
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../../context/LanguageContext';
import { getAvatarUrl } from '../../../../utils/imageUtils';
import { useUsers } from '../../../../hooks/query/useUserQuery';
import groupWorkoutService from '../../../../api/services/groupWorkoutService';

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  groupWorkoutId: number;
  colors: any;
  onInvite: () => void;
  participants: any[];
}

const InviteModal: React.FC<InviteModalProps> = ({
  visible,
  onClose,
  groupWorkoutId,
  colors,
  onInvite,
  participants
}) => {
  const { t } = useLanguage();
  const { data: users = [] } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const searchInputRef = useRef(null);
  
  // Filter users for invite modal
  const filteredUsers = users.filter(u => {
    // Don't show users who are already participants
    const isAlreadyParticipant = participants.some(
      p => p.user_details.id === u.id
    );
    
    if (isAlreadyParticipant) return false;
    
    // Apply search filter
    if (searchQuery) {
      return u.username.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return true;
  });
  
  // Toggle user selection
  const toggleUserSelection = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
  
  // Handle inviting users
  const handleInviteUsers = async () => {
    if (selectedUsers.length === 0) {
      onClose();
      return;
    }
    
    setIsInviting(true);
    
    try {
      await groupWorkoutService.inviteUsers(groupWorkoutId, selectedUsers);
      setSelectedUsers([]);
      setSearchQuery('');
      setIsInviting(false);
      onInvite();
      onClose();
    } catch (error) {
      console.error('Failed to invite users:', error);
      setIsInviting(false);
      Alert.alert(t('error'), t('failed_to_invite_users'));
    }
  };
  
  // Reset state when modal closes
  const handleClose = () => {
    setSelectedUsers([]);
    setSearchQuery('');
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {t('invite_users')}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.searchContainer, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <Ionicons name="search" size={20} color={colors.text.tertiary} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: colors.text.primary }]}
              placeholder={t('search_users')}
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Selected Users Counter */}
          {selectedUsers.length > 0 && (
            <View style={styles.selectedCounter}>
              <Text style={{ color: colors.text.secondary }}>
                {t('selected_users', { count: selectedUsers.length })}
              </Text>
            </View>
          )}
          
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.userItem,
                  { borderBottomColor: 'rgba(75, 85, 99, 0.2)' },
                  selectedUsers.includes(item.id) && { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                ]}
                onPress={() => toggleUserSelection(item.id)}
              >
                <View style={styles.userInfo}>
                  <Image
                    source={{ uri: getAvatarUrl(item.avatar) }}
                    style={styles.userAvatar}
                  />
                  
                  <Text style={[styles.userName, { color: colors.text.primary }]}>
                    {item.username}
                  </Text>
                </View>
                
                <View style={[
                  styles.checkbox,
                  { borderColor: 'rgba(107, 114, 128, 0.5)' },
                  selectedUsers.includes(item.id) && [styles.checkboxSelected, { backgroundColor: colors.success }]
                ]}>
                  {selectedUsers.includes(item.id) && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyListContainer}>
                <Text style={[styles.emptyListText, { color: colors.text.secondary }]}>
                  {searchQuery.length > 0 ? t('no_users_found') : t('no_users_to_invite')}
                </Text>
              </View>
            }
          />
          
          <View style={[styles.modalFooter, { borderTopColor: 'rgba(75, 85, 99, 0.2)' }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}
              onPress={handleClose}
              disabled={isInviting}
            >
              <Text style={{ color: colors.danger }}>{t('cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.inviteButton,
                selectedUsers.length > 0 ? 
                  { backgroundColor: colors.success } : 
                  { backgroundColor: 'rgba(107, 114, 128, 0.2)' }
              ]}
              onPress={handleInviteUsers}
              disabled={selectedUsers.length === 0 || isInviting}
            >
              {isInviting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ 
                  color: selectedUsers.length > 0 ? '#FFFFFF' : '#6B7280',
                  fontWeight: 'bold'
                }}>
                  {t('invite_selected', { count: selectedUsers.length })}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    marginTop: 0,
    marginBottom: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  clearSearchButton: {
    padding: 4,
  },
  selectedCounter: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: 'transparent',
  },
  emptyListContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyListText: {
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default InviteModal;