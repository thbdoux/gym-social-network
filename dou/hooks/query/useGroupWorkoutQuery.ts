// hooks/query/useGroupWorkoutQuery.ts
import { 
    useQuery, 
    useMutation, 
    useQueryClient,
    useInfiniteQuery 
  } from '@tanstack/react-query';
import { groupWorkoutService } from '../../api/services';

// Query keys
export const groupWorkoutKeys = {
  all: ['groupWorkouts'],
  lists: () => [...groupWorkoutKeys.all, 'list'],
  list: (filters) => [...groupWorkoutKeys.lists(), { ...filters }],
  details: () => [...groupWorkoutKeys.all, 'detail'],
  detail: (id) => [...groupWorkoutKeys.details(), id],
  messages: (id) => [...groupWorkoutKeys.detail(id), 'messages'],
  joinRequests: (id) => [...groupWorkoutKeys.detail(id), 'joinRequests'],
  participants: (id) => [...groupWorkoutKeys.detail(id), 'participants'],
  userWorkouts: (userId) => [...groupWorkoutKeys.lists(), 'user', userId],
  proposals: (id) => [...groupWorkoutKeys.detail(id), 'proposals'],
  mostVotedProposal: (id) => [...groupWorkoutKeys.detail(id), 'mostVotedProposal'],
  userTemplates: (userId) => ['workoutTemplates', 'user', userId],
};

// Get all group workouts with optional filters
export const useGroupWorkouts = (filters = {}) => {
  return useQuery({
    queryKey: groupWorkoutKeys.list(filters),
    queryFn: () => groupWorkoutService.getGroupWorkouts(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Get active group workouts
export const useActiveGroupWorkouts = () => {
  return useGroupWorkouts({ status: 'active' });
};

// Get group workouts for a specific user
export const useUserGroupWorkouts = (userId: number, filters = {}) => {
  return useQuery({
    queryKey: [...groupWorkoutKeys.lists(), 'user', userId, filters],
    queryFn: () => groupWorkoutService.getUserGroupWorkouts(userId, filters),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Get group workouts created by a specific user
export const useUserCreatedGroupWorkouts = (userId: number) => {
  return useUserGroupWorkouts(userId, { participation: 'created' });
};

// Get group workouts joined by a specific user
export const useUserJoinedGroupWorkouts = (userId: number) => {
  return useUserGroupWorkouts(userId, { participation: 'joined' });
};

// Get group workouts where user was invited
export const useUserInvitedGroupWorkouts = (userId: number) => {
  return useUserGroupWorkouts(userId, { participation: 'invited' });
};

// // Get workout groups created by a specific user
// export const useUserCreatedGroupWorkouts = (userId) => {
//   return useQuery({
//     queryKey: groupWorkoutKeys.userWorkouts(userId),
//     queryFn: () => groupWorkoutService.getGroupWorkouts({ 
//       participation: 'created', 
//       user_id: userId 
//     }),
//     enabled: !!userId,
//   });
// };

// // Get group workouts that the user has joined
// export const useUserJoinedGroupWorkouts = (userId?: number) => {
//   return useQuery({
//     queryKey: [...groupWorkoutKeys.lists(), 'joined', userId],
//     queryFn: () => groupWorkoutService.getGroupWorkouts({ 
//       participation: 'joined', 
//       user_id: userId 
//     }),
//     enabled: !!userId,
//     staleTime: 1000 * 60 * 2, // 2 minutes
//   });
// };

// Get group workout by id
export const useGroupWorkout = (id) => {
  return useQuery({
    queryKey: groupWorkoutKeys.detail(id),
    queryFn: () => groupWorkoutService.getGroupWorkoutById(id),
    enabled: !!id,
  });
};

// Create a group workout
export const useCreateGroupWorkout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: groupWorkoutService.createGroupWorkout,
    onSuccess: (newWorkout) => {
      // Update the group workouts list
      queryClient.setQueryData(groupWorkoutKeys.lists(), (oldData) => {
        if (!oldData) return [newWorkout];
        return [...oldData, newWorkout];
      });
      
      // Add to the user's created workouts
      if (newWorkout.creator) {
        queryClient.setQueryData(
          groupWorkoutKeys.userWorkouts(newWorkout.creator), 
          (oldData) => {
            if (!oldData) return [newWorkout];
            return [...oldData, newWorkout];
          }
        );
      }
    },
  });
};

// Update a group workout
export const useUpdateGroupWorkout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }) => groupWorkoutService.updateGroupWorkout(id, updates),
    onSuccess: (updatedWorkout) => {
      // Update in lists
      queryClient.setQueryData(groupWorkoutKeys.lists(), (oldData) => {
        if (!oldData) return [];
        return oldData.map(workout => 
          workout.id === updatedWorkout.id ? updatedWorkout : workout
        );
      });
      
      // Update in user workouts if it exists
      if (updatedWorkout.creator) {
        queryClient.setQueryData(
          groupWorkoutKeys.userWorkouts(updatedWorkout.creator),
          (oldData) => {
            if (!oldData) return oldData;
            return oldData.map(workout => 
              workout.id === updatedWorkout.id ? updatedWorkout : workout
            );
          }
        );
      }
      
      // Update the individual workout data
      queryClient.setQueryData(
        groupWorkoutKeys.detail(updatedWorkout.id), 
        updatedWorkout
      );
    },
  });
};

// Delete a group workout
export const useDeleteGroupWorkout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => groupWorkoutService.deleteGroupWorkout(id),
    onSuccess: (_, id) => {
      // Get the workout before removing it
      const workout = queryClient.getQueryData(groupWorkoutKeys.detail(id));
      const creatorId = workout?.creator;
      
      // Remove from lists
      queryClient.setQueryData(groupWorkoutKeys.lists(), (oldData) => {
        if (!oldData) return [];
        return oldData.filter(workout => workout.id !== id);
      });
      
      // Remove from user workouts if creator id is known
      if (creatorId) {
        queryClient.setQueryData(
          groupWorkoutKeys.userWorkouts(creatorId),
          (oldData) => {
            if (!oldData) return [];
            return oldData.filter(workout => workout.id !== id);
          }
        );
      }
      
      // Remove the individual workout cache
      queryClient.removeQueries({ queryKey: groupWorkoutKeys.detail(id) });
    },
  });
};

// Invite users to a group workout
export const useInviteToGroupWorkout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, userIds }) => groupWorkoutService.inviteUsers(id, userIds),
    onSuccess: (_, { id }) => {
      // Invalidate the workout to refetch updated participants
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.participants(id) });
    },
  });
};

// Join a group workout
export const useJoinGroupWorkout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, message }) => groupWorkoutService.joinGroupWorkout(id, message),
    onSuccess: (_, { id }) => {
      // Invalidate user joined workouts list
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.list({ participation: 'joined' }) });
      
      // Invalidate the specific workout
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.detail(id) });
    },
  });
};

// Leave a group workout
export const useLeaveGroupWorkout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => groupWorkoutService.leaveGroupWorkout(id),
    onSuccess: (_, id) => {
      // Update user joined workouts list
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.list({ participation: 'joined' }) });
      
      // Invalidate the specific workout
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.detail(id) });
    },
  });
};

// Cancel a group workout
export const useCancelGroupWorkout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => groupWorkoutService.cancelGroupWorkout(id),
    onSuccess: (_, id) => {
      // Get the workout before updating it
      const workout = queryClient.getQueryData(groupWorkoutKeys.detail(id));
      
      if (workout) {
        // Update the workout in the cache with cancelled status
        queryClient.setQueryData(
          groupWorkoutKeys.detail(id),
          { ...workout, status: 'cancelled' }
        );
        
        // Update in lists
        queryClient.setQueryData(groupWorkoutKeys.lists(), (oldData) => {
          if (!oldData) return [];
          return oldData.map(w => 
            w.id === id ? { ...w, status: 'cancelled' } : w
          );
        });
        
        // Update in user workouts if creator id is known
        if (workout.creator) {
          queryClient.setQueryData(
            groupWorkoutKeys.userWorkouts(workout.creator),
            (oldData) => {
              if (!oldData) return [];
              return oldData.map(w => 
                w.id === id ? { ...w, status: 'cancelled' } : w
              );
            }
          );
        }
      }
    },
  });
};

// Send a message in a group workout
export const useSendGroupWorkoutMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, content }) => groupWorkoutService.sendMessage(id, content),
    onSuccess: (newMessage, { id }) => {
      // Add the new message to the messages list
      queryClient.setQueryData(groupWorkoutKeys.messages(id), (oldData) => {
        if (!oldData) return [newMessage];
        return [...oldData, newMessage];
      });
      
      // Also update the messages in the workout detail if it exists
      queryClient.setQueryData(groupWorkoutKeys.detail(id), (oldWorkout) => {
        if (!oldWorkout) return null;
        
        return {
          ...oldWorkout,
          messages: [...(oldWorkout.messages || []), newMessage]
        };
      });
    },
  });
};

// Get messages for a group workout with pagination
export const useGroupWorkoutMessages = (id, page = 1) => {
  return useQuery({
    queryKey: [...groupWorkoutKeys.messages(id), page],
    queryFn: () => groupWorkoutService.getMessages(id, page),
    enabled: !!id,
  });
};

// Get messages for a group workout with infinite loading
export const useInfiniteGroupWorkoutMessages = (id) => {
  return useInfiniteQuery({
    queryKey: groupWorkoutKeys.messages(id),
    queryFn: ({ pageParam = 1 }) => 
      groupWorkoutService.getMessages(id, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      // Check if there are more pages
      if (!Array.isArray(lastPage) || lastPage.length === 0) {
        return undefined;
      }
      return allPages.length + 1;
    },
    enabled: !!id,
  });
};

// Get join requests for a group workout
export const useGroupWorkoutJoinRequests = (id) => {
  return useQuery({
    queryKey: groupWorkoutKeys.joinRequests(id),
    queryFn: () => groupWorkoutService.getJoinRequests(id),
    enabled: !!id,
  });
};

// Respond to a join request
export const useRespondToJoinRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, requestId, response }) => 
      groupWorkoutService.respondToJoinRequest(id, requestId, response),
    onSuccess: (_, { id }) => {
      // Invalidate join requests list
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.joinRequests(id) });
      
      // Invalidate workout details to update participants
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.detail(id) });
    },
  });
};

// Remove a participant from a group workout
export const useRemoveParticipant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, userId }) => groupWorkoutService.removeParticipant(id, userId),
    onSuccess: (_, { id }) => {
      // Invalidate workout details to update participants
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.participants(id) });
    },
  });
};

// Complete a group workout
export const useCompleteGroupWorkout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => groupWorkoutService.completeGroupWorkout(id),
    onSuccess: (result, id) => {
      // Get the workout before updating it
      const workout = queryClient.getQueryData(groupWorkoutKeys.detail(id));
      
      if (workout) {
        // Update the workout in the cache with completed status
        queryClient.setQueryData(
          groupWorkoutKeys.detail(id),
          { ...workout, status: 'completed' }
        );
        
        // Update in lists
        queryClient.setQueryData(groupWorkoutKeys.lists(), (oldData) => {
          if (!oldData) return [];
          return oldData.map(w => 
            w.id === id ? { ...w, status: 'completed' } : w
          );
        });
        
        // Update in user workouts if creator id is known
        if (workout.creator) {
          queryClient.setQueryData(
            groupWorkoutKeys.userWorkouts(workout.creator),
            (oldData) => {
              if (!oldData) return [];
              return oldData.map(w => 
                w.id === id ? { ...w, status: 'completed' } : w
              );
            }
          );
        }
      }
      
      // Invalidate workout logs to include newly created logs
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
};

// Create a post for a group workout
export const useCreateGroupWorkoutPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ groupWorkoutId, content, image }) => 
      groupWorkoutService.createPostForGroupWorkout(groupWorkoutId, content, image),
    onSuccess: (newPost) => {
      // Update posts feed if it exists
      queryClient.setQueryData(['posts', 'feed'], (oldData) => {
        if (!oldData) return [newPost];
        return [newPost, ...oldData];
      });
    },
  });
};


// Get participants for a specific group workout
export const useGroupWorkoutParticipants = (id) => {
  return useQuery({
    queryKey: groupWorkoutKeys.participants(id),
    queryFn: () => groupWorkoutService.getGroupWorkoutParticipants(id),
    enabled: !!id,
  });
};

// Get only participants with 'joined' status
export const useGroupWorkoutJoinedParticipants = (id) => {
  return useQuery({
    queryKey: [...groupWorkoutKeys.participants(id), 'joined'],
    queryFn: () => groupWorkoutService.getJoinedParticipants(id),
    enabled: !!id,
  });
};

// Check if current user is a participant in a group workout
export const useIsUserParticipant = (groupWorkoutId, userId) => {
  return useQuery({
    queryKey: [...groupWorkoutKeys.participants(groupWorkoutId), 'isParticipant', userId],
    queryFn: () => groupWorkoutService.isUserParticipant(groupWorkoutId, userId),
    enabled: !!groupWorkoutId && !!userId,
  });
};

// Update participant status
export const useUpdateParticipantStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ groupWorkoutId, userId, newStatus }) => 
      groupWorkoutService.updateParticipantStatus(groupWorkoutId, userId, newStatus),
    onSuccess: (_, { groupWorkoutId }) => {
      // Invalidate participants queries
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.participants(groupWorkoutId) });
      // Invalidate the workout detail
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.detail(groupWorkoutId) });
    },
  });
};

// Get participants count by status
export const useParticipantsCountByStatus = (id, status = 'joined') => {
  const participantsQuery = useGroupWorkoutParticipants(id);
  
  // Derived state from the participants query
  const count = useMemo(() => {
    if (!participantsQuery.data) return 0;
    return participantsQuery.data.filter(p => p.status === status).length;
  }, [participantsQuery.data, status]);
  
  return {
    ...participantsQuery,
    count
  };
};

// Get a user's workout templates
export const useUserWorkoutTemplates = (userId) => {
  return useQuery({
    queryKey: groupWorkoutKeys.userTemplates(userId),
    queryFn: () => groupWorkoutService.getUserWorkoutTemplates(userId),
    enabled: !!userId,
  });
};

// Get all proposals for a group workout
export const useGroupWorkoutProposals = (id) => {
  return useQuery({
    queryKey: groupWorkoutKeys.proposals(id),
    queryFn: () => groupWorkoutService.getProposals(id),
    enabled: !!id,
  });
};

// Get the most voted proposal
export const useMostVotedProposal = (id) => {
  return useQuery({
    queryKey: groupWorkoutKeys.mostVotedProposal(id),
    queryFn: async () => {
      try {
        return await groupWorkoutService.getMostVotedProposal(id);
      } catch (error) {
        // If the error is 404 (not found), return null instead of throwing
        if (error.response && error.response.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!id,
  });
};

// Propose a workout
export const useProposeWorkout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ groupWorkoutId, workoutTemplateId }) => 
      groupWorkoutService.proposeWorkout(groupWorkoutId, workoutTemplateId),
    onSuccess: (_, { groupWorkoutId }) => {
      // Invalidate proposals list
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.proposals(groupWorkoutId) });
      // Invalidate most voted proposal
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.mostVotedProposal(groupWorkoutId) });
      // Invalidate the workout detail to update the most voted proposal
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.detail(groupWorkoutId) });
    },
  });
};

// Vote for a proposal
export const useVoteForProposal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ groupWorkoutId, proposalId }) => 
      groupWorkoutService.voteForProposal(groupWorkoutId, proposalId),
    onSuccess: (_, { groupWorkoutId }) => {
      // Invalidate proposals list
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.proposals(groupWorkoutId) });
      // Invalidate most voted proposal
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.mostVotedProposal(groupWorkoutId) });
      // Invalidate the workout detail
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.detail(groupWorkoutId) });
    },
  });
};

// Remove vote from a proposal
export const useRemoveVote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ groupWorkoutId, proposalId }) => 
      groupWorkoutService.removeVote(groupWorkoutId, proposalId),
    onSuccess: (_, { groupWorkoutId }) => {
      // Invalidate proposals list
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.proposals(groupWorkoutId) });
      // Invalidate most voted proposal
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.mostVotedProposal(groupWorkoutId) });
      // Invalidate the workout detail
      queryClient.invalidateQueries({ queryKey: groupWorkoutKeys.detail(groupWorkoutId) });
    },
  });
};