// app/(app)/group-workout/participants/[id].tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Hooks
import { useAuth } from '../../../../hooks/useAuth';
import { useLanguage } from '../../../../context/LanguageContext';
import { useTheme } from '../../../../context/ThemeContext';
import { useGroupWorkout } from '../../../../hooks/query/useGroupWorkoutQuery';
import { useUsers } from '../../../../hooks/query/useUserQuery';

// Services
import groupWorkoutService from '../../../../api/services/groupWorkoutService';
import { getAvatarUrl } from '../../../../utils/imageUtils';

export default function ParticipantsPage() {
  const params = useLocalSearchParams();
  const groupWorkoutId = parseInt(params.id as string, 10) || 0;
  
  const { user } = useAuth();
  const { t } = useLanguage();
  const { groupWorkoutPalette } = useTheme();
  const { data: groupWorkout, refetch } = useGroupWorkout(groupWorkoutId);
  const { data: allUsers = [] } = useUsers();
  
  // States
  const [participants, setParticipants] = useState([]);
  const [activeTab, setActiveTab] = useState<'participants' | 'invite'>('participants');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Colors
  const COLORS = {
    primary: groupWorkoutPalette.background,
    background: groupWorkoutPalette.background,
    card: "rgba(31, 41, 55, 0.9)",
    text: {
      primary: groupWorkoutPalette.text,
      secondary: groupWorkoutPalette.text_secondary,
      tertiary: "rgba(255, 255, 255, 0.6)"
    },
    border: groupWorkoutPalette.border,
    success: "#10b981",
    danger: "#ef4444",
    highlight: groupWorkoutPalette.highlight,
    gradientStart: "#f59e0b",
    gradientEnd: "#d97706"
  };

  // Fetch participants
  const fetchParticipants = async () => {
    try {
      setIsLoading(true);
      const participantsData = await groupWorkoutService.getGroupWorkoutParticipants(groupWorkoutId);
      setParticipants(participantsData);
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (groupWorkoutId) {
      fetchParticipants();
    }
  }, [groupWorkoutId]);

  // Filter users for invite tab
  const filteredUsers = allUsers.filter(u => {
    // Don't show users who are already participants
    const isAlreadyParticipant = participants.some(p => p.user_details.id === u.id);
    if (isAlreadyParticipant) return false;
    
    // Apply search filter
    if (searchQuery) {
      return u.username.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return true;
  });

  // Sort participants: confirmed first, then invited
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.status === 'joined' && b.status !== 'joined') return -1;
    if (a.status !== 'joined' && b.status === 'joined') return 1;
    if (a.status === 'invited' && b.status !== 'invited') return -1;
    if (a.status !== 'invited' && b.status === 'invited') return 1;
    return 0;
  });

  // Get status info
  const getStatusInfo = (status: string): { color: string, text: string, icon: string } => {
    switch (status) {
      case 'joined':
        return { color: COLORS.success, text: t('participating'), icon: 'checkmark-circle' };
      case 'invited':
        return { color: COLORS.highlight, text: t('invited'), icon: 'mail-outline' };
      case 'declined':
        return { color: COLORS.danger, text: t('declined'), icon: 'close-circle' };
      default:
        return { color: COLORS.text.secondary, text: t(status), icon: 'person-outline' };
    }
  };

  // Handle user selection for invites
  const toggleUserSelection = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Handle inviting users
  const handleInviteUsers = async () => {
    if (selectedUsers.length === 0) return;
    
    setIsInviting(true);
    try {
      await groupWorkoutService.inviteUsers(groupWorkoutId, selectedUsers);
      setSelectedUsers([]);
      setSearchQuery('');
      await fetchParticipants();
      setActiveTab('participants');
      Alert.alert(t('success'), t('users_invited_successfully'));
    } catch (error) {
      console.error('Failed to invite users:', error);
      Alert.alert(t('error'), t('failed_to_invite_users'));
    } finally {
      setIsInviting(false);
    }
  };

  // Handle removing participant
  const handleRemoveParticipant = async (userId: number, username: string) => {
    Alert.alert(
      t('remove_participant'),
      t('confirm_remove_participant', { username }),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('remove'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await groupWorkoutService.removeParticipant(groupWorkoutId, userId);
              await fetchParticipants();
            } catch (error) {
              console.error('Failed to remove participant:', error);
              Alert.alert(t('error'), t('failed_to_remove_participant'));
            }
          }
        }
      ]
    );
  };

  // Render participant item
  const renderParticipantItem = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    
    return (
      <View style={[styles.listItem, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: getAvatarUrl(item.user_details.avatar) }}
            style={[
              styles.avatar,
              item.status === 'invited' && styles.invitedAvatar
            ]}
          />
          
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: COLORS.text.primary }]}>
              {item.user_details.username}
            </Text>
            
            <View style={styles.statusRow}>
              <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Remove button for creator */}
        {groupWorkout?.is_creator && 
         item.user_details.id !== user?.id && 
         item.status === 'joined' && (
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}
            onPress={() => handleRemoveParticipant(item.user_details.id, item.user_details.username)}
          >
            <Ionicons name="person-remove-outline" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render invite item
  const renderInviteItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.listItem,
        { backgroundColor: COLORS.card, borderColor: COLORS.border },
        selectedUsers.includes(item.id) && { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
      ]}
      onPress={() => toggleUserSelection(item.id)}
    >
      <View style={styles.userInfo}>
        <Image
          source={{ uri: getAvatarUrl(item.avatar) }}
          style={styles.avatar}
        />
        
        <Text style={[styles.userName, { color: COLORS.text.primary }]}>
          {item.username}
        </Text>
      </View>
      
      <View style={[
        styles.checkbox,
        { borderColor: COLORS.border },
        selectedUsers.includes(item.id) && { backgroundColor: COLORS.success, borderColor: COLORS.success }
      ]}>
        {selectedUsers.includes(item.id) && (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>
              {groupWorkout?.title || t('participants')}
            </Text>
            
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: COLORS.card }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'participants' && { backgroundColor: COLORS.highlight }
          ]}
          onPress={() => setActiveTab('participants')}
        >
          <Ionicons 
            name="people-outline" 
            size={20} 
            color={activeTab === 'participants' ? '#FFFFFF' : COLORS.text.secondary} 
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'participants' ? '#FFFFFF' : COLORS.text.secondary }
          ]}>
            {t('participants')} ({participants.length})
          </Text>
        </TouchableOpacity>
        
        {groupWorkout?.is_creator && (
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'invite' && { backgroundColor: COLORS.highlight }
            ]}
            onPress={() => setActiveTab('invite')}
          >
            <Ionicons 
              name="person-add-outline" 
              size={20} 
              color={activeTab === 'invite' ? '#FFFFFF' : COLORS.text.secondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'invite' ? '#FFFFFF' : COLORS.text.secondary }
            ]}>
              {t('invite')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar (for invite tab) */}
      {activeTab === 'invite' && (
        <View style={[styles.searchContainer, { backgroundColor: COLORS.card }]}>
          <Ionicons name="search" size={20} color={COLORS.text.tertiary} />
          <TextInput
            style={[styles.searchInput, { color: COLORS.text.primary }]}
            placeholder={t('search_users')}
            placeholderTextColor={COLORS.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'participants' ? (
          <FlatList
            data={sortedParticipants}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderParticipantItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color={COLORS.text.tertiary} />
                <Text style={[styles.emptyTitle, { color: COLORS.text.primary }]}>
                  {t('no_participants_yet')}
                </Text>
                <Text style={[styles.emptySubtitle, { color: COLORS.text.secondary }]}>
                  {t('invite_people_to_join')}
                </Text>
              </View>
            }
          />
        ) : (
          <>
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderInviteItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="person-add-outline" size={64} color={COLORS.text.tertiary} />
                  <Text style={[styles.emptyTitle, { color: COLORS.text.primary }]}>
                    {searchQuery ? t('no_users_found') : t('no_users_to_invite')}
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: COLORS.text.secondary }]}>
                    {searchQuery ? t('try_different_search') : t('all_users_already_invited')}
                  </Text>
                </View>
              }
            />
            
            {/* Invite Button */}
            {selectedUsers.length > 0 && (
              <View style={[styles.inviteButtonContainer, { backgroundColor: COLORS.card }]}>
                <TouchableOpacity
                  style={[styles.inviteButton, { backgroundColor: COLORS.success }]}
                  onPress={handleInviteUsers}
                  disabled={isInviting}
                >
                  {isInviting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="send-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.inviteButtonText}>
                        {t('invite_selected', { count: selectedUsers.length })}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 8,
    margin: 16,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  invitedAvatar: {
    opacity: 0.7,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
    borderRadius: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  inviteButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});