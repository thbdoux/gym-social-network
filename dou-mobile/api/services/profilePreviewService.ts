// api/services/profilePreviewService.ts
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

interface ProfilePreview {
  user: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_picture?: string;
    bio?: string;
  };
  stats: {
    post_count: number;
    follower_count: number;
    following_count: number;
    workout_count: number;
    [key: string]: any;
  };
  is_following?: boolean;
  is_friend?: boolean;
  is_friend_requested?: boolean;
  has_requested_friendship?: boolean;
  [key: string]: any;
}

interface Friend {
  id: number;
  username: string;
  profile_picture?: string;
  [key: string]: any;
}

interface Post {
  id: number;
  content: string;
  created_at: string;
  author: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  [key: string]: any;
}

interface Program {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  [key: string]: any;
}

interface WorkoutLog {
  id: number;
  date: string;
  name: string;
  [key: string]: any;
}

/**
 * Service for profile preview API operations
 */
const profilePreviewService = {
  /**
   * Get complete profile preview data for a user
   */
  getUserProfilePreview: async (userId: number): Promise<ProfilePreview> => {
    const response = await apiClient.get(`/users/${userId}/profile-preview/`);
    return response.data;
  },

  /**
   * Get a user's friends for profile preview
   */
  getUserFriends: async (userId: number): Promise<Friend[]> => {
    const response = await apiClient.get(`/users/${userId}/friends/`);
    return response.data || [];
  },

  /**
   * Get a user's posts for profile preview
   */
  getUserPosts: async (userId: number): Promise<Post[]> => {
    const response = await apiClient.get(`/users/${userId}/posts/`);
    return response.data || [];
  },

  /**
   * Get detailed program data with appropriate permissions for profile preview
   */
  getProgramDetails: async (programId: number): Promise<Program> => {
    const response = await apiClient.get(`/workouts/programs/${programId}/details/`);
    return response.data;
  },

  /**
   * Get detailed workout log data with appropriate permissions for profile preview
   */
  getWorkoutLogDetails: async (logId: number): Promise<WorkoutLog> => {
    const response = await apiClient.get(`/workouts/logs/${logId}/details/`);
    return response.data;
  }
};

export default profilePreviewService;