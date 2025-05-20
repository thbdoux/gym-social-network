// app/(app)/group-workout/ParticipantsDisplay.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';
import { getAvatarUrl } from '../../../utils/imageUtils';

interface ParticipantsDisplayProps {
  invitedParticipants: any[];
  confirmedParticipants: any[];
  colors: any;
  onParticipantsPress: () => void;
}

const ParticipantsDisplay: React.FC<ParticipantsDisplayProps> = ({
  invitedParticipants,
  confirmedParticipants,
  colors,
  onParticipantsPress
}) => {
  const { t } = useLanguage();
  
  // Limit participants displayed to prevent too many overlapping
  const displayConfirmedLimit = 5;
  const displayInvitedLimit = 5;

  // Select participants to display (respecting the limit)
  const displayConfirmed = confirmedParticipants.slice(0, displayConfirmedLimit);
  const displayInvited = invitedParticipants.slice(0, displayInvitedLimit);
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onParticipantsPress}
      activeOpacity={0.8}
    >
      <View style={[styles.participantsSection, { backgroundColor: 'rgba(31, 41, 55, 0.3)' }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            {t('participants')}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
        </View>
        
        <View style={styles.participantsRow}>
          {/* Confirmed Participants */}
          <View style={styles.participantColumn}>
            <Text style={[styles.columnLabel, { color: colors.text.secondary }]}>
              {t('confirmed')} ({confirmedParticipants.length})
            </Text>
            
            <View style={styles.avatarsContainer}>
              {displayConfirmed.length > 0 ? (
                <>
                  {displayConfirmed.map((participant, index) => (
                    <View 
                      key={`confirmed-${participant.id}`} 
                      style={[
                        styles.avatarContainer,
                        index > 0 && { marginLeft: -10 }, // Overlapping effect
                      ]}
                    >
                      <Image
                        source={{ uri: getAvatarUrl(participant.user_details.avatar) }}
                        style={styles.avatar}
                      />
                      <View style={[styles.statusOverlay, { borderColor: colors.success }]} />
                    </View>
                  ))}
                  
                  {/* More indicator */}
                  {confirmedParticipants.length > displayConfirmedLimit && (
                    <View style={[styles.moreContainer, { backgroundColor: 'rgba(31, 41, 55, 0.7)' }]}>
                      <Text style={styles.moreText}>+{confirmedParticipants.length - displayConfirmedLimit}</Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                  {t('none')}
                </Text>
              )}
            </View>
          </View>
          
          {/* Invited Participants */}
          <View style={styles.participantColumn}>
            <Text style={[styles.columnLabel, { color: colors.text.secondary }]}>
              {t('invited')} ({invitedParticipants.length})
            </Text>
            
            <View style={styles.avatarsContainer}>
              {displayInvited.length > 0 ? (
                <>
                  {displayInvited.map((participant, index) => (
                    <View 
                      key={`invited-${participant.id}`} 
                      style={[
                        styles.avatarContainer,
                        index > 0 && { marginLeft: -10 }, // Overlapping effect
                      ]}
                    >
                      <Image
                        source={{ uri: getAvatarUrl(participant.user_details.avatar) }}
                        style={[styles.avatar, styles.invitedAvatar]}
                      />
                      <View style={[styles.statusOverlay, { borderColor: colors.tertiary }]} />
                    </View>
                  ))}
                  
                  {/* More indicator */}
                  {invitedParticipants.length > displayInvitedLimit && (
                    <View style={[styles.moreContainer, { backgroundColor: 'rgba(31, 41, 55, 0.7)', opacity: 0.7 }]}>
                      <Text style={styles.moreText}>+{invitedParticipants.length - displayInvitedLimit}</Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                  {t('none')}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  participantsSection: {
    borderRadius: 12,
    padding: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  participantsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  participantColumn: {
    flex: 1,
  },
  columnLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
  },
  avatarContainer: {
    position: 'relative',
    width: 36,
    height: 36,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  invitedAvatar: {
    opacity: 0.7,
  },
  statusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    borderWidth: 2,
  },
  moreContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  moreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  }
});

export default ParticipantsDisplay;