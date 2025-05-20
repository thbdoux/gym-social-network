// app/(app)/group-workout/modals/SharePostModal.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../../context/LanguageContext';
import { getAvatarUrl } from '../../../../utils/imageUtils';
import groupWorkoutService from '../../../../api/services/groupWorkoutService';

interface SharePostModalProps {
  visible: boolean;
  onClose: () => void;
  groupWorkout: any;
  colors: any;
  onShare: () => void;
}

const SharePostModal: React.FC<SharePostModalProps> = ({
  visible,
  onClose,
  groupWorkout,
  colors,
  onShare
}) => {
  const { t } = useLanguage();
  const [sharePostText, setSharePostText] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  
  // Format date
  const formatDate = (date: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(date).toLocaleDateString(undefined, options);
  };
  
  // Handle share post
  const handleSharePost = async () => {
    if (!sharePostText.trim()) {
      Alert.alert(t('error'), t('post_content_required'));
      return;
    }
    
    setIsCreatingPost(true);
    
    try {
      await groupWorkoutService.createPostForGroupWorkout(
        groupWorkout.id,
        sharePostText,
        selectedImage
      );
      
      setIsCreatingPost(false);
      setSharePostText('');
      setSelectedImage(null);
      onShare();
      onClose();
      
      Alert.alert(t('success'), t('post_shared_successfully'));
    } catch (error) {
      console.error('Failed to share post:', error);
      setIsCreatingPost(false);
      Alert.alert(t('error'), t('failed_to_share_post'));
    }
  };
  
  // Handle selecting an image
  const handleSelectImage = () => {
    // Placeholder - would normally use image picker here
    Alert.alert(t('feature_coming_soon'), t('image_picker_not_implemented'));
  };
  
  // Reset state when modal closes
  const handleClose = () => {
    setSharePostText('');
    setSelectedImage(null);
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
              {t('share_workout')}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.contentContainer}>
            <View style={styles.sharePostContainer}>
              <TextInput
                style={[styles.sharePostInput, { 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                  color: colors.text.primary,
                  borderColor: colors.border
                }]}
                placeholder={t('share_post_placeholder')}
                placeholderTextColor={colors.text.tertiary}
                value={sharePostText}
                onChangeText={setSharePostText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              
              {/* Image selector */}
              <TouchableOpacity 
                style={[styles.imageSelector, { borderColor: colors.border }]}
                onPress={handleSelectImage}
              >
                <Ionicons name="image-outline" size={24} color={colors.text.secondary} />
                <Text style={{ color: colors.text.secondary, marginLeft: 8 }}>
                  {t('add_photo')}
                </Text>
              </TouchableOpacity>
              
              {/* Selected image preview */}
              {selectedImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: selectedImage.uri }} 
                    style={styles.imagePreview} 
                    resizeMode="cover"
                  />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Ionicons name="close-circle" size={26} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={[styles.sharePreview, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                <Text style={[styles.sharePreviewLabel, { color: colors.text.secondary }]}>
                  {t('sharing')}:
                </Text>
                <View style={styles.workoutPreview}>
                  <Text style={[styles.workoutPreviewTitle, { color: colors.text.primary }]}>
                    {groupWorkout.title}
                  </Text>
                  <Text style={[styles.workoutPreviewDetail, { color: colors.text.secondary }]}>
                    {formatDate(groupWorkout.scheduled_time)}
                  </Text>
                  <View style={styles.participantPreview}>
                    <Ionicons name="people-outline" size={16} color={colors.text.tertiary} />
                    <Text style={[styles.workoutPreviewDetail, { color: colors.text.tertiary, marginLeft: 4 }]}>
                      {groupWorkout.participants_count} {t('participants')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
          
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}
              onPress={handleClose}
              disabled={isCreatingPost}
            >
              <Text style={{ color: colors.danger }}>{t('cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.shareButton,
                sharePostText.trim() ? 
                  { backgroundColor: colors.highlight } : 
                  { backgroundColor: 'rgba(107, 114, 128, 0.2)' }
              ]}
              onPress={handleSharePost}
              disabled={!sharePostText.trim() || isCreatingPost}
            >
              {isCreatingPost ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ 
                  color: sharePostText.trim() ? '#FFFFFF' : '#6B7280',
                  fontWeight: 'bold' 
                }}>
                  {t('share')}
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
  contentContainer: {
    flex: 1,
  },
  sharePostContainer: {
    padding: 16,
  },
  sharePostInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    marginBottom: 16,
  },
  imageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
  },
  sharePreview: {
    padding: 16,
    borderRadius: 8,
  },
  sharePreviewLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  workoutPreview: {
    padding: 8,
  },
  workoutPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutPreviewDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  participantPreview: {
    flexDirection: 'row',
    alignItems: 'center',
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
    minWidth: 100,
  },
  shareButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  }
});

export default SharePostModal;