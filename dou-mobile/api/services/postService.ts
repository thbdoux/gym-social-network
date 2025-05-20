// api/services/postService.ts
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

interface Post {
  id: number;
  content: string;
  post_type: string;
  created_at: string;
  author: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  comments?: Comment[];
  reactions?: PostReaction[];
  reactions_count?: number;
  user_reaction?: string;
  [key: string]: any;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user_username: string;
  user_id: number;
  user_profile_picture?: string;
  reactions_count: number;
  reactions: CommentReaction[];
  replies: Comment[];
  replies_count: number;
  mentioned_users: { id: number; username: string }[];
  is_edited: boolean;
  parent?: number;
}

interface CommentReaction {
  id: number;
  reaction_type: string;
  user_username: string;
  user_id: number;
  created_at: string;
}

interface PostReaction {
  id: number;
  reaction_type: string;
  user_username: string;
  user_id: number;
  created_at: string;
}

interface Liker {
  id: number;
  username: string;
  profile_picture?: string;
}

/**
 * Service for social posts API operations
 */
const postService = {

  getPosts: async (): Promise<Post[]> => {
    const response = await apiClient.get('/posts/');
    return response.data;
  },
  
  getFeed: async (): Promise<Post[]> => {
    const response = await apiClient.get('/posts/feed/');
    return response.data;
  },

  getPostById: async (id: number): Promise<Post> => {
    const response = await apiClient.get(`/posts/${id}/`);
    return response.data;
  },

  createPost: async (postData: FormData): Promise<Post> => {
    const response = await apiClient.post('/posts/', postData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updatePost: async (id: number, updates: Partial<Post>): Promise<Post> => {
    const response = await apiClient.put(`/posts/${id}/`, updates);
    return response.data;
  },

  deletePost: async (id: number): Promise<void> => {
    await apiClient.delete(`/posts/${id}/`);
  },

  // Update like method to handle both like and unlike operations
  likePost: async (id: number, isLiked: boolean): Promise<any> => {
    // If the post is already liked, send DELETE request to unlike it
    if (isLiked) {
      const response = await apiClient.delete(`/posts/${id}/like/`);
      return response.data;
    } 
    // Otherwise, send POST request to like it
    const response = await apiClient.post(`/posts/${id}/like/`);
    return response.data;
  },

  // Add or update a reaction to a post
  reactToPost: async (id: number, reactionType: string): Promise<PostReaction> => {
    const response = await apiClient.post(`/posts/${id}/react/`, { 
      reaction_type: reactionType 
    });
    return response.data;
  },
  
  // Remove a reaction from a post
  unreactToPost: async (id: number): Promise<void> => {
    await apiClient.delete(`/posts/${id}/unreact/`);
  },

  // Get all reactions for a post
  getPostReactions: async (id: number): Promise<PostReaction[]> => {
    const response = await apiClient.get(`/posts/${id}/reactions/`);
    return response.data;
  },

  commentOnPost: async (id: number, content: string, parent_id?: number): Promise<Comment> => {
    const response = await apiClient.post(`/posts/${id}/comment/`, { 
      content,
      parent_id
    });
    return response.data;
  },
  // Get all comments for a post
  getPostComments: async (id: number): Promise<Comment[]> => {
    const response = await apiClient.get(`/posts/${id}/comments/`);
    return response.data;
  },
  // Update the edit comment method
  editComment: async (postId: number, commentId: number, content: string): Promise<Comment> => {
    // Ensure we're using the correct URL pattern
    const response = await apiClient.put(`/posts/${postId}/comments/${commentId}/`, {
      content
    });
    return response.data;
  },

  // Update the delete comment method
  deleteComment: async (postId: number, commentId: number): Promise<void> => {
    // Ensure we're using the correct URL pattern
    await apiClient.delete(`/posts/${postId}/comments/${commentId}/`);
  },
  // Add or update a reaction to a comment
  reactToComment: async (postId: number, commentId: number, reactionType: string): Promise<CommentReaction> => {
    const response = await apiClient.post(`/posts/${postId}/comments/${commentId}/react/`, { 
      reaction_type: reactionType 
    });
    return response.data;
  },
  
  // Remove a reaction from a comment
  unreactToComment: async (postId: number, commentId: number): Promise<void> => {
    await apiClient.delete(`/posts/${postId}/comments/${commentId}/unreact/`);
  },
  
  // Reply to a comment
  replyToComment: async (postId: number, commentId: number, content: string): Promise<Comment> => {
    // Use the correct URL pattern for nested resources
    const response = await apiClient.post(`/posts/${postId}/comments/${commentId}/reply/`, {
      content
    });
    return response.data;
  },
  sharePost: async (id: number, content: string = ''): Promise<Post> => {
    const response = await apiClient.post(`/posts/${id}/share/`, { content });
    return response.data;
  },
  /**
   * Get users who liked a post
   * @param postId The ID of the post
   * @returns Array of users who liked the post
   */
   getLikers: async (postId: number): Promise<Liker[]> => {
    const response = await apiClient.get(`/posts/${postId}/likers/`);
    return response.data;
  },
};

export default postService;