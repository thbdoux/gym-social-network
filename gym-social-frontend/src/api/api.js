// src/api/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (credentials) => {
  const response = await api.post('/auth/login/', credentials);
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/users/', userData);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/auth/users/me/');
  return response.data;
};

export const createPost = async (postData) => {
  const response = await api.post('/posts/', postData);
  return response.data;
};

export const getPosts = async () => {
  const response = await api.get('/posts/');
  return response.data;
};

export const likePost = async (postId) => {
  const response = await api.post(`/posts/${postId}/like/`);
  return response.data;
};

export const createWorkout = async (workoutData) => {
  const response = await api.post('/workouts/', workoutData);
  return response.data;
};

export const getWorkouts = async () => {
  const response = await api.get('/workouts/');
  return response.data;
};