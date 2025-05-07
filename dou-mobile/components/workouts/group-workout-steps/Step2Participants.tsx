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
  ScrollView,
  Image
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { GroupWorkoutFormData } from '../GroupWorkoutWizard';
import { Ionicons } from '@expo/vector-icons';
import { useUsers, useFriends, useUser } from '../../../hooks/query/useUserQuery';
import { getAvatarUrl } from '../../../utils/imageUtils';

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
  
  // Fetch participant details for users that don't have full details
  useEffect(() => {
    // Only load details for participants that we don't already have details for
    const participantsToLoad = participantIds.filter(id => 
      !participantsDetails.some(p => p.id === id)
    );
    
    if (participantsToLoad.length > 0) {
      const loadParticipantDetails = async () => {
        const loadedDetails = await Promise.all(
          participantsToLoad.map(async (id) => {
            try {
              // Find in already loaded users or fetch
              const userFromList = allUsers.find(u => u.id === id);
              if (userFromList) return userFromList;
              
              // If not found, use useUser hook (assuming it returns a promise-based API)
              return await useUser(id).data;
            } catch (err) {
              console.error(`Failed to load user ${id}:`, err);
              return { id, username: `User ${id}` };
            }
          })
        );
        
        setParticipantsDetails(prev => [...prev, ...loadedDetails]);
        
        // Update form data with the loaded details
        updateFormData({
          participants_details: [...participantsDetails, ...loadedDetails]
        });
      };
      
      loadParticipantDetails();
    }
  }, [participantIds]);
  
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
  
  // Remove user
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
    
    // Update form data
    updateFormData({
      invited_users: newInvitedUsers,
      participants: newParticipants,
      participants_details: newParticipantsDetails
    });
  };
  
  // Render friend suggestion item
  const renderFriendSuggestionItem = ({ item }) => {
    // Skip if already invited or is the creator
    const friendUser = item.friend || item;
    
    if (
      participantIds.includes(friendUser.id) || 
      invitedUsers.includes(friendUser.id) ||
      friendUser.id === user.id
    ) {
      return null;
    }
    
    return (
      <TouchableOpacity
        style={styles.friendSuggestionItem}
        onPress={() => handleInviteUser(friendUser.id, friendUser)}
      >
        <Image 
          source={{ uri: getAvatarUrl(friendUser.avatar) }} 
          style={styles.avatar} 
          defaultSource={require('../../../assets/images/dou.png')}
        />
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>
            {friendUser.display_name || friendUser.username}
          </Text>
          <Text style={styles.username}>@{friendUser.username}</Text>
        </View>
        <Ionicons name="add-circle" size={24} color="#f97316" />
      </TouchableOpacity>
    );
  };
  
  // Render invited user item
  const renderParticipantItem = ({ item }) => {
    const isCreator = item.id === user.id;
    
    return (
      <View style={styles.participantItem}>
        <Image 
          source={{ uri: getAvatarUrl(item.avatar) }} 
          style={styles.avatar}
          defaultSource={require('../../../assets/images/dou.png')}
        />
        <Text style={styles.participantName}>
          {item.display_name || item.username}
          {isCreator && (
            <Text style={styles.creatorBadge}> • {t('creator')}</Text>
          )}
        </Text>
        
        {!isCreator && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveUser(item.id)}
          >
            <Ionicons name="close-circle" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  // Render search result item
  const renderSearchResultItem = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleInviteUser(item.id, item)}
    >
      <Image 
        source={{ uri: getAvatarUrl(item.avatar) }} 
        style={styles.avatar} 
        defaultSource={require('../../../assets/images/dou.png')}
      />
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{item.display_name || item.username}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
      <Ionicons name="add-circle" size={24} color="#f97316" />
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.sectionTitle}>{t('invite_participants')}</Text>
      
      {/* Search input */}
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
      
      {/* Loading indicator */}
      {(usersLoading || friendsLoading) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#f97316" />
          <Text style={styles.loadingText}>{t('loading_users')}</Text>
        </View>
      )}
      
      {/* Friend suggestions - Vertical layout */}
      {!isSearching && searchQuery.length === 0 && friends.length > 0 && (
        <View style={styles.friendSuggestionsContainer}>
          <Text style={styles.friendSuggestionsTitle}>
            {t('friend_suggestions')}
          </Text>
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderFriendSuggestionItem}
            style={styles.friendSuggestionsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.friendSuggestionsContent}
          />
        </View>
      )}
      
      {/* Search results */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#f97316" />
          <Text style={styles.loadingText}>{t('searching')}</Text>
        </View>
      ) : searchQuery.length > 0 && (
        <>
          {searchResults.length > 0 ? (
            <View style={styles.searchResultsContainer}>
              <Text style={styles.searchResultsTitle}>
                {t('search_results')}
              </Text>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderSearchResultItem}
                style={styles.searchResultsList}
                nestedScrollEnabled={true}
              />
            </View>
          ) : searchQuery.length >= 2 && (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>{t('no_users_found')}</Text>
            </View>
          )}
        </>
      )}
      
      {/* Participants list */}
      <View style={styles.participantsContainer}>
        <View style={styles.participantsHeader}>
          <Text style={styles.participantsTitle}>
            {t('participants')} ({participantsDetails.length})
          </Text>
          {errors.participants && (
            <Text style={styles.errorText}>{errors.participants}</Text>
          )}
        </View>
        
        {participantsDetails.length > 0 ? (
          <FlatList
            data={participantsDetails}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderParticipantItem}
            style={styles.participantsList}
            nestedScrollEnabled={true}
          />
        ) : (
          <View style={styles.emptyParticipantsContainer}>
            <Text style={styles.emptyParticipantsText}>
              {t('no_participants_yet')}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
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
  // Friend suggestions - vertical layout
  friendSuggestionsContainer: {
    marginBottom: 24,
    maxHeight: 300,
  },
  friendSuggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    marginLeft: 4,
  },
  friendSuggestionsList: {
    maxHeight: 280,
  },
  friendSuggestionsContent: {
    paddingBottom: 8,
  },
  friendSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  // Search results
  searchResultsContainer: {
    marginBottom: 16,
    maxHeight: 200,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    marginLeft: 4,
  },
  searchResultsList: {
    maxHeight: 180,
  },
  searchResultItem: {
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
  participantsContainer: {
    flex: 1,
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    marginLeft: 4,
  },
  participantsList: {
    maxHeight: 300,
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
    marginTop: 16,
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