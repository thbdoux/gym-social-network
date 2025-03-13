// src/api/services/postService.js
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

/**
 * Service for social posts API operations
 */
const postService = {

  getPosts: async () => {
    const response = await apiClient.get('/posts/');
    return response.data;
  },
  
  getFeed: async () => {
    const response = await apiClient.get('/posts/feed/');
    return response.data;
  },

  getPostById: async (id) => {
    const response = await apiClient.get(`/posts/${id}/`);
    return response.data;
  },

  createPost: async (postData) => {
    const response = await apiClient.post('/posts/', postData);
    return response.data;
  },

  updatePost: async (id, updates) => {
    const response = await apiClient.put(`/posts/${id}/`, updates);
    return response.data;
  },

  deletePost: async (id) => {
    await apiClient.delete(`/posts/${id}/`);
  },

  likePost: async (id) => {
    const response = await apiClient.post(`/posts/${id}/like/`);
    return response.data;
  },

  commentOnPost: async (id, content) => {
    const response = await apiClient.post(`/posts/${id}/comment/`, { content });
    return response.data;
  },

  sharePost: async (id, content = '') => {
    const response = await apiClient.post(`/posts/${id}/share/`, { content });
    return response.data;
  }
};

export default postService;