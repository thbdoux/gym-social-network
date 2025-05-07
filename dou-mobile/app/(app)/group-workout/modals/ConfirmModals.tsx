// app/(app)/group-workout/modals/ConfirmModals.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useLanguage } from '../../../../context/LanguageContext';
import groupWorkoutService from '../../../../api/services/groupWorkoutService';

// Base Confirm Modal props
interface BaseConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  colors: any;
  groupWorkoutId: number;
}

// Cancel Confirm Modal
export const ConfirmCancelModal: React.FC<BaseConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  colors,
  groupWorkoutId
}) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleCancel = async () => {
    setIsLoading(true);
    
    try {
      await groupWorkoutService.cancelGroupWorkout(groupWorkoutId);
      setIsLoading(false);
      onConfirm();
    } catch (error) {
      console.error('Failed to cancel group workout:', error);
      setIsLoading(false);
      Alert.alert(t('error'), t('failed_to_cancel_workout'));
    }
  };
  
  return (
    <ConfirmModalBase
      visible={visible}
      title={t('cancel_workout')}
      message={t('cancel_workout_confirmation')}
      colors={colors}
      onClose={onClose}
      onConfirm={handleCancel}
      confirmText={t('yes_cancel')}
      cancelText={t('no')}
      confirmButtonColor={colors.danger}
      isLoading={isLoading}
    />
  );
};

// Complete Confirm Modal
export const ConfirmCompleteModal: React.FC<BaseConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  colors,
  groupWorkoutId
}) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleComplete = async () => {
    setIsLoading(true);
    
    try {
      await groupWorkoutService.completeGroupWorkout(groupWorkoutId);
      setIsLoading(false);
      onConfirm();
    } catch (error) {
      console.error('Failed to complete group workout:', error);
      setIsLoading(false);
      Alert.alert(t('error'), t('failed_to_complete_workout'));
    }
  };
  
  return (
    <ConfirmModalBase
      visible={visible}
      title={t('complete_workout')}
      message={t('complete_workout_confirmation')}
      colors={colors}
      onClose={onClose}
      onConfirm={handleComplete}
      confirmText={t('complete')}
      cancelText={t('cancel')}
      confirmButtonColor={colors.success}
      isLoading={isLoading}
    />
  );
};

// Leave Confirm Modal
export const ConfirmLeaveModal: React.FC<BaseConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  colors,
  groupWorkoutId
}) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLeave = async () => {
    setIsLoading(true);
    
    try {
      await groupWorkoutService.leaveGroupWorkout(groupWorkoutId);
      setIsLoading(false);
      onConfirm();
    } catch (error) {
      console.error('Failed to leave group workout:', error);
      setIsLoading(false);
      Alert.alert(t('error'), t('failed_to_leave_workout'));
    }
  };
  
  return (
    <ConfirmModalBase
      visible={visible}
      title={t('leave_workout')}
      message={t('leave_workout_confirmation')}
      colors={colors}
      onClose={onClose}
      onConfirm={handleLeave}
      confirmText={t('leave')}
      cancelText={t('cancel')}
      confirmButtonColor={colors.danger}
      isLoading={isLoading}
    />
  );
};

// Base component for confirm modals
interface ConfirmModalBaseProps {
  visible: boolean;
  title: string;
  message: string;
  colors: any;
  onClose: () => void;
  onConfirm: () => void;
  confirmText: string;
  cancelText: string;
  confirmButtonColor: string;
  isLoading: boolean;
}

const ConfirmModalBase: React.FC<ConfirmModalBaseProps> = ({
  visible,
  title,
  message,
  colors,
  onClose,
  onConfirm,
  confirmText,
  cancelText,
  confirmButtonColor,
  isLoading
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.confirmModalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.confirmTitle, { color: colors.text.primary }]}>
            {title}
          </Text>
          
          <Text style={[styles.confirmText, { color: colors.text.secondary }]}>
            {message}
          </Text>
          
          <View style={styles.confirmButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: 'rgba(107, 114, 128, 0.2)' }]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={{ color: colors.text.primary }}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: confirmButtonColor }]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{confirmText}</Text>
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
  },
  confirmModalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  }
});