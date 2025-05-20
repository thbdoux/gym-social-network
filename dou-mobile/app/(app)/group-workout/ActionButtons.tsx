// app/(app)/group-workout/ActionButtons.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';
import { useJoinGroupWorkout } from '../../../hooks/query/useGroupWorkoutQuery';

interface ActionButtonsProps {
  groupWorkout: any;
  colors: any;
  onCancelPress: () => void;
  onCompletePress: () => void;
  onLeavePress: () => void;
  onJoinPress: () => void;
  isCreator: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  groupWorkout,
  colors,
  onCancelPress,
  onCompletePress,
  onLeavePress,
  onJoinPress,
  isCreator
}) => {
  const { t } = useLanguage();
  const [joinMessage, setJoinMessage] = useState('');
  const { mutateAsync: joinGroupWorkout, isLoading: isJoining } = useJoinGroupWorkout();
  
  // Handle joining a group workout
  const handleJoin = async () => {
    try {
      if (groupWorkout?.privacy === 'upon-request') {
        await joinGroupWorkout({ 
          id: groupWorkout.id,
          message: joinMessage 
        });
        setJoinMessage('');
      } else {
        await joinGroupWorkout({ id: groupWorkout.id });
      }
      onJoinPress();
    } catch (error) {
      console.error('Failed to join group workout:', error);
      Alert.alert(t('error'), t('failed_to_join_workout'));
    }
  };
  
  return (
    <View style={styles.actionsSection}>
      <View style={styles.actionButtonsContainer}>
        {/* Creator Actions - Subtle buttons at the bottom */}
        {isCreator && (
          <View style={styles.creatorActionRow}>
            <View style={styles.subtleButtonsContainer}>
              <TouchableOpacity 
                style={[styles.subtleButton, { borderColor: colors.danger }]}
                onPress={onCancelPress}
              >
                <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                <Text style={[styles.subtleButtonText, { color: colors.danger }]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.subtleButton, { borderColor: colors.success }]}
                onPress={onCompletePress}
              >
                <Ionicons name="checkbox-outline" size={18} color={colors.success} />
                <Text style={[styles.subtleButtonText, { color: colors.success }]}>
                  {t('complete')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Participant Actions - only show for non-creators */}
        {!isCreator && (
          <View style={styles.participantActions}>
            {groupWorkout.current_user_status === 'joined' && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.danger }]}
                onPress={onLeavePress}
              >
                <Text style={styles.actionButtonText}>{t('leave_workout')}</Text>
              </TouchableOpacity>
            )}
            
            {groupWorkout.current_user_status === 'invited' && (
              <View style={styles.inviteResponseButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.danger }]}
                  onPress={onLeavePress}
                >
                  <Text style={styles.actionButtonText}>{t('decline')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.success }]}
                  onPress={handleJoin}
                >
                  <Text style={styles.actionButtonText}>{t('accept')}</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {groupWorkout.current_user_status === 'not_participating' && (
              <>
                {groupWorkout.privacy === 'public' && !groupWorkout.is_full && (
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.success }]}
                    onPress={handleJoin}
                    disabled={isJoining}
                  >
                    {isJoining ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.actionButtonText}>{t('join_workout')}</Text>
                    )}
                  </TouchableOpacity>
                )}
                
                {groupWorkout.privacy === 'upon-request' && !groupWorkout.is_full && (
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      Alert.prompt(
                        t('request_to_join'),
                        t('join_request_message'),
                        [
                          { text: t('cancel'), style: 'cancel' },
                          { 
                            text: t('send'),
                            onPress: (message) => {
                              setJoinMessage(message || '');
                              handleJoin();
                            }
                          }
                        ]
                      );
                    }}
                    disabled={isJoining}
                  >
                    {isJoining ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.actionButtonText}>{t('request_to_join')}</Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
            
            {groupWorkout.current_user_status === 'request_pending' && (
              <View style={[styles.pendingRequestBadge, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Text style={{ color: '#3B82F6' }}>{t('join_request_pending')}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionsSection: {
    padding: 16,
    paddingTop: 0,
  },
  actionButtonsContainer: {
    marginBottom: 16,
  },
  creatorActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  subtleButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  subtleButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  subtleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  participantActions: {
    alignItems: 'center',
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  inviteResponseButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  pendingRequestBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  }
});

export default ActionButtons;