import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { GroupWorkoutFormData } from '../GroupWorkoutWizard';
import { Ionicons } from '@expo/vector-icons';
import { useUsers, useFriends } from '../../../hooks/query/useUserQuery';
import { getAvatarUrl } from '../../../utils/imageUtils';
import userService from '../../../api/services/userService';

type Step2ParticipantsProps = {
  formData: GroupWorkoutFormData;
  updateFormData: (data: Partial<GroupWorkoutFormData>) => void;
  errors: Record<string, string>;
  user: any;
};

type UserType = {
  id: number;
  username: string;
  display_name?: string;
  avatar?: string | null;
  [key: string]: any;
};

const Step2Participants = ({ formData, updateFormData, errors, user }: Step2ParticipantsProps) => {
  const { t } = useLanguage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<number[]>(formData.invited_users || []);
  
  // Get list of participants (creator + invited users)
  const participantIds = formData.participants || [user?.id];
  const [participantsDetails, setParticipantsDetails] = useState<any[]>(formData.participants_details || [user]);

  // Use React Query hooks to fetch users and friends
  const { data: allUsers = [], isLoading: usersLoading } = useUsers();
  const { data: friends = [], isLoading: friendsLoading } = useFriends();
  
  // Get user details directly from userService
  const getUserDetail = async (id) => {
    try {
      return await userService.getUserById(id);
    } catch (err) {
      console.error(`Failed to load user ${id}:`, err);
      return { id, username: `User ${id}` };
    }
  };

  // Fetch participant details for users that don't have full details
  useEffect(() => {
    // Only load details for participants that we don't already have details for
    const participantsToLoad = participantIds.filter(id => 
      !participantsDetails.some(p => p.id === id)
    );
    
    if (participantsToLoad.length > 0) {
      const loadParticipantDetails = async () => {
        // Try to find users in multiple sources
        const loadedDetails = await Promise.all(
          participantsToLoad.map(async (id) => {
            try {
              // Search strategy 1: Check allUsers list first
              const userFromList = allUsers.find(u => u.id === id);
              if (userFromList) return userFromList;
              
              // Search strategy 2: Check friends list
              const userFromFriends = friends.find(f => 
                (f.id === id) || 
                (f.friend && f.friend.id === id)
              );
              if (userFromFriends) {
                // Return either the friend object or the nested friend property
                return userFromFriends.friend || userFromFriends;
              }
              
              // Search strategy 3: Direct API call as last resort
              return await getUserDetail(id);
            } catch (err) {
              console.error(`Failed to load user ${id}:`, err);
              return { id, username: `User ${id}` };
            }
          })
        );
        
        // Update local state and form data
        setParticipantsDetails(prev => {
          const newDetails = [...prev];
          
          // Add only users that aren't already in the list
          loadedDetails.forEach(user => {
            if (!newDetails.some(p => p.id === user.id)) {
              newDetails.push(user);
            }
          });
          
          return newDetails;
        });
        
        // Update form data
        updateFormData({
          participants_details: participantsDetails.concat(
            loadedDetails.filter(user => 
              !participantsDetails.some(p => p.id === user.id)
            )
          )
        });
      };
      
      loadParticipantDetails();
    }
  }, [participantIds, allUsers, friends]);
  
  // Search users when query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsSearching(true);
      
      try {
        // Filter all users based on search query
        const results = allUsers.filter((user: UserType) => 
          user.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Filter out already invited users and the creator
        const filteredResults = results.filter(
          (u: UserType) => !participantIds.includes(u.id) && 
                 !invitedUsers.includes(u.id) &&
                 u.id !== user.id
        );
        
        setSearchResults(filteredResults);
      } catch (error) {
        console.error("Error searching users:", error);
        Alert.alert(t('error'), t('failed_to_search_users'));
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allUsers, participantIds, invitedUsers]);
  
  // Invite user
  const handleInviteUser = (userId: number, userObj: UserType) => {
    const newInvitedUsers = [...invitedUsers, userId];
    setInvitedUsers(newInvitedUsers);
    
    // Calculate participants: creator (always first) + invited users
    const newParticipants = [user?.id, ...newInvitedUsers];
    
    // Add the user object to the participants details
    const newParticipantsDetails = [...participantsDetails];
    if (!newParticipantsDetails.some(p => p.id === userId)) {
      newParticipantsDetails.push(userObj);
    }
    
    // Update local state
    setParticipantsDetails(newParticipantsDetails);
    
    // Update form data
    updateFormData({
      invited_users: newInvitedUsers,
      participants: newParticipants,
      participants_details: newParticipantsDetails
    });
    
    // Clear search results and query
    setSearchResults([]);
    setSearchQuery('');
  };

  // Remove user - FIXED VERSION
  const handleRemoveUser = (userId: number) => {
    // Cannot remove creator (first participant)
    if (userId === user.id) {
      Alert.alert(t('error'), t('cannot_remove_creator'));
      return;
    }
    
    // Remove from invited users
    const newInvitedUsers = invitedUsers.filter(id => id !== userId);
    setInvitedUsers(newInvitedUsers);
    
    // Remove from participants
    const newParticipants = participantIds.filter(id => id !== userId);
    
    // Remove from participant details
    const newParticipantsDetails = participantsDetails.filter(p => p.id !== userId);
    
    // Update local state - THIS WAS MISSING
    setParticipantsDetails(newParticipantsDetails);
    
    // Update form data
    updateFormData({
      invited_users: newInvitedUsers,
      participants: newParticipants,
      participants_details: newParticipantsDetails
    });
  };

  // Create data for single FlatList to avoid nesting
  const createListData = () => {
    const data = [];
    
    // Header section
    data.push({ type: 'header', id: 'header' });
    
    // Search section
    data.push({ type: 'search', id: 'search' });
    
    // Loading section
    if (usersLoading || friendsLoading || isSearching) {
      data.push({ type: 'loading', id: 'loading' });
    }
    
    // Friend suggestions or search results
    if (!isSearching && searchQuery.length === 0 && friends.length > 0) {
      data.push({ type: 'friendsHeader', id: 'friendsHeader' });
      friends.forEach((friend, index) => {
        const friendUser = friend.friend || friend;
        if (
          !participantIds.includes(friendUser.id) && 
          !invitedUsers.includes(friendUser.id) &&
          friendUser.id !== user.id
        ) {
          data.push({ type: 'friend', id: `friend_${friendUser.id}`, data: friendUser });
        }
      });
    } else if (searchQuery.length > 0) {
      if (searchResults.length > 0) {
        data.push({ type: 'searchHeader', id: 'searchHeader' });
        searchResults.forEach((result) => {
          data.push({ type: 'searchResult', id: `search_${result.id}`, data: result });
        });
      } else if (searchQuery.length >= 2) {
        data.push({ type: 'noResults', id: 'noResults' });
      }
    }
    
    // Participants section
    data.push({ type: 'participantsHeader', id: 'participantsHeader' });
    if (participantsDetails.length > 0) {
      participantsDetails.forEach((participant) => {
        data.push({ type: 'participant', id: `participant_${participant.id}`, data: participant });
      });
    } else {
      data.push({ type: 'emptyParticipants', id: 'emptyParticipants' });
    }
    
    return data;
  };

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'header':
        return (
          <Text style={styles.sectionTitle}>{t('invite_participants')}</Text>
        );
      
      case 'search':
        return (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_users')}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        );
      
      case 'loading':
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#f97316" />
            <Text style={styles.loadingText}>
              {isSearching ? t('searching') : t('loading_users')}
            </Text>
          </View>
        );
      
      case 'friendsHeader':
        return (
          <Text style={styles.sectionSubtitle}>{t('friend_suggestions')}</Text>
        );
      
      case 'friend':
        return (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => handleInviteUser(item.data.id, item.data)}
          >
            <Image 
              source={{ uri: getAvatarUrl(item.data.avatar) }} 
              style={styles.avatar} 
              defaultSource={require('../../../assets/images/dou.png')}
            />
            <View style={styles.userInfo}>
              <Text style={styles.displayName}>
                {item.data.display_name || item.data.username}
              </Text>
              <Text style={styles.username}>@{item.data.username}</Text>
            </View>
            <Ionicons name="add-circle" size={24} color="#f97316" />
          </TouchableOpacity>
        );
      
      case 'searchHeader':
        return (
          <Text style={styles.sectionSubtitle}>{t('search_results')}</Text>
        );
      
      case 'searchResult':
        return (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => handleInviteUser(item.data.id, item.data)}
          >
            <Image 
              source={{ uri: getAvatarUrl(item.data.avatar) }} 
              style={styles.avatar} 
              defaultSource={require('../../../assets/images/dou.png')}
            />
            <View style={styles.userInfo}>
              <Text style={styles.displayName}>
                {item.data.display_name || item.data.username}
              </Text>
              <Text style={styles.username}>@{item.data.username}</Text>
            </View>
            <Ionicons name="add-circle" size={24} color="#f97316" />
          </TouchableOpacity>
        );
      
      case 'noResults':
        return (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>{t('no_users_found')}</Text>
          </View>
        );
      
      case 'participantsHeader':
        return (
          <View style={styles.participantsHeader}>
            <Text style={styles.sectionSubtitle}>
              {t('participants')} ({participantsDetails.length})
            </Text>
            {errors.participants && (
              <Text style={styles.errorText}>{errors.participants}</Text>
            )}
          </View>
        );
      
      case 'participant':
        const isCreator = item.data.id === user.id;
        return (
          <View style={styles.participantItem}>
            <Image 
              source={{ uri: getAvatarUrl(item.data.avatar) }} 
              style={styles.avatar}
              defaultSource={require('../../../assets/images/dou.png')}
            />
            <Text style={styles.participantName}>
              {item.data.display_name || item.data.username}
              {isCreator && (
                <Text style={styles.creatorBadge}> • {t('creator')}</Text>
              )}
            </Text>
            
            {!isCreator && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveUser(item.data.id)}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        );
      
      case 'emptyParticipants':
        return (
          <View style={styles.emptyParticipantsContainer}>
            <Text style={styles.emptyParticipantsText}>
              {t('no_participants_yet')}
            </Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <FlatList
      data={createListData()}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#FFFFFF',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    color: '#9CA3AF',
    marginLeft: 8,
  },
  // User item styles (shared between friends and search results)
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#9CA3AF',
  },
  // Participants styles
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    marginRight: 12,
  },
  participantName: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  creatorBadge: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  emptyParticipantsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    marginTop: 8,
  },
  emptyParticipantsText: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
});

export default Step2Participants;