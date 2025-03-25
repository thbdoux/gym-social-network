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
  [key: string]: any;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  author: {
    id: number;
    username: string;
    profile_picture?: string;
  };
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

  likePost: async (id: number): Promise<any> => {
    const response = await apiClient.post(`/posts/${id}/like/`);
    return response.data;
  },

  commentOnPost: async (id: number, content: string): Promise<Comment> => {
    const response = await apiClient.post(`/posts/${id}/comment/`, { content });
    return response.data;
  },

  sharePost: async (id: number, content: string = ''): Promise<Post> => {
    const response = await apiClient.post(`/posts/${id}/share/`, { content });
    return response.data;
  }
};

export default postService;