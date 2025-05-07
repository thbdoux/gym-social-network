// api/services/groupWorkoutService.ts
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

interface GroupWorkout {
  id: number;
  title: string;
  description: string;
  creator: number;
  creator_details: {
    id: number;
    username: string;
    avatar?: string;
  };
  workout_template?: number;
  workout_template_details?: any;
  gym?: number;
  gym_details?: any;
  scheduled_time: string;
  privacy: 'public' | 'upon-request' | 'private';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  max_participants: number;
  participants_count: number;
  is_creator: boolean;
  current_user_status: string;
  is_full: boolean;
  is_active: boolean;
  participants?: GroupWorkoutParticipant[];
  join_requests?: GroupWorkoutJoinRequest[];
  messages?: GroupWorkoutMessage[];
}

interface GroupWorkoutParticipant {
  id: number;
  user: number;
  user_details: {
    id: number;
    username: string;
    avatar?: string;
  };
  status: 'invited' | 'joined' | 'declined' | 'removed';
  joined_at?: string;
  workout_log?: number;
}

interface GroupWorkoutJoinRequest {
  id: number;
  user: number;
  user_details: {
    id: number;
    username: string;
    avatar?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  created_at: string;
  updated_at: string;
}

interface GroupWorkoutMessage {
  id: number;
  user: number;
  user_details: {
    id: number;
    username: string;
    avatar?: string;
  };
  content: string;
  created_at: string;
}

/**
 * Service for group workout API operations
 */
const groupWorkoutService = {
  getGroupWorkouts: async (filters?: Record<string, any>): Promise<GroupWorkout[]> => {
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    const response = await apiClient.get(`/workouts/group-workouts/${queryString ? `?${queryString}` : ''}`);
    return extractData(response);
  },

  getGroupWorkoutById: async (id: number): Promise<GroupWorkout> => {
    const response = await apiClient.get(`/workouts/group-workouts/${id}/`);
    return response.data;
  },

  createGroupWorkout: async (workoutData: Partial<GroupWorkout>): Promise<GroupWorkout> => {
    console.log(workoutData);
    try {
      console.log('Creating group workout with data:', workoutData);
      const response = await apiClient.post('/workouts/group-workouts/', workoutData);
      console.log('Group workout created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating group workout:', error);
      if (error.response && error.response.data) {
        console.error('API Error Response:', JSON.stringify(error.response.data));
      }
      throw error;
    }
  },

  updateGroupWorkout: async (id: number, updates: Partial<GroupWorkout>): Promise<GroupWorkout> => {
    try {
      console.log(`Updating group workout ${id} with data:`, updates);
      const response = await apiClient.patch(`/workouts/group-workouts/${id}/`, updates);
      console.log('Group workout updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating group workout ${id}:`, error);
      if (error.response && error.response.data) {
        console.error('API Error Response:', JSON.stringify(error.response.data));
      }
      throw error;
    }
  },

  deleteGroupWorkout: async (id: number): Promise<void> => {
    await apiClient.delete(`/workouts/group-workouts/${id}/`);
  },

  inviteUsers: async (id: number, userIds: number[]): Promise<any> => {
    const response = await apiClient.post(`/workouts/group-workouts/${id}/invite/`, {
      user_ids: userIds
    });
    return response.data;
  },

  joinGroupWorkout: async (id: number, message?: string): Promise<any> => {
    const payload = message ? { message } : {};
    const response = await apiClient.post(`/workouts/group-workouts/${id}/join/`, payload);
    return response.data;
  },

  leaveGroupWorkout: async (id: number): Promise<any> => {
    const response = await apiClient.post(`/workouts/group-workouts/${id}/leave/`);
    return response.data;
  },

  cancelGroupWorkout: async (id: number): Promise<any> => {
    const response = await apiClient.post(`/workouts/group-workouts/${id}/cancel/`);
    return response.data;
  },

  sendMessage: async (id: number, content: string): Promise<GroupWorkoutMessage> => {
    const response = await apiClient.post(`/workouts/group-workouts/${id}/send_message/`, {
      content
    });
    return response.data;
  },

  getMessages: async (id: number, page: number = 1): Promise<GroupWorkoutMessage[]> => {
    const response = await apiClient.get(`/workouts/group-workouts/${id}/messages/?page=${page}`);
    return extractData(response);
  },

  getJoinRequests: async (id: number): Promise<GroupWorkoutJoinRequest[]> => {
    const response = await apiClient.get(`/workouts/group-workouts/${id}/join_requests/`);
    return extractData(response);
  },

  respondToJoinRequest: async (
    id: number, 
    requestId: number, 
    response: 'approve' | 'reject'
  ): Promise<any> => {
    const apiResponse = await apiClient.post(`/workouts/group-workouts/${id}/respond_to_request/`, {
      request_id: requestId,
      response
    });
    return apiResponse.data;
  },

  removeParticipant: async (id: number, userId: number): Promise<any> => {
    const response = await apiClient.post(`/workouts/group-workouts/${id}/remove_participant/`, {
      user_id: userId
    });
    return response.data;
  },

  completeGroupWorkout: async (id: number): Promise<any> => {
    const response = await apiClient.post(`/workouts/group-workouts/${id}/complete/`);
    return response.data;
  },

  createPostForGroupWorkout: async (groupWorkoutId: number, content: string, image?: File): Promise<any> => {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('post_type', 'group_workout');
    formData.append('group_workout_id', groupWorkoutId.toString());
    
    if (image) {
      formData.append('image', image);
    }
    
    const response = await apiClient.post('/posts/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Get participants for a specific group workout
  getGroupWorkoutParticipants: async (id: number): Promise<GroupWorkoutParticipant[]> => {
    const response = await apiClient.get(`/workouts/group-workouts/${id}/`);
    // Extract participants from the detailed response
    return response.data.participants || [];
  },

  // Get a filtered list of participants by status
  getGroupWorkoutParticipantsByStatus: async (id: number, status: string): Promise<GroupWorkoutParticipant[]> => {
    const participants = await groupWorkoutService.getGroupWorkoutParticipants(id);
    return participants.filter(participant => participant.status === status);
  },

  // Get only joined participants
  getJoinedParticipants: async (id: number): Promise<GroupWorkoutParticipant[]> => {
    return groupWorkoutService.getGroupWorkoutParticipantsByStatus(id, 'joined');
  },

  // Check if a user is a participant in a group workout
  isUserParticipant: async (groupWorkoutId: number, userId: number): Promise<boolean> => {
    const participants = await groupWorkoutService.getGroupWorkoutParticipants(groupWorkoutId);
    return participants.some(p => p.user === userId && p.status === 'joined');
  },

  // Update participant status
  updateParticipantStatus: async (
    groupWorkoutId: number,
    userId: number,
    newStatus: 'joined' | 'invited' | 'declined' | 'removed'
  ): Promise<any> => {
    // This is a custom endpoint we'd need to add to the backend
    const response = await apiClient.put(`/workouts/group-workouts/${groupWorkoutId}/update_participant_status/`, {
      user_id: userId,
      status: newStatus
    });
    return response.data;
  },
};

export default groupWorkoutService;