// src/context/DataContext.jsx
import React, { createContext, useContext, useCallback } from 'react';
import { useApiCache, useApiMutation } from '../hooks/useApiCache';
import { AuthContext } from './AuthContext';

export const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);

  // Posts data
  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
    invalidateCache: invalidatePosts
  } = useApiCache('/posts/feed/', {
    enabled: isAuthenticated,
    cacheTime: 2 * 60 * 1000, // Cache for 2 minutes
    transform: (data) => Array.isArray(data) ? data : []
  });

  // Trending posts
  const {
    data: trendingPosts,
    isLoading: trendingLoading,
    error: trendingError,
    refetch: refetchTrending
  } = useApiCache('/posts/trending/', {
    enabled: isAuthenticated,
    cacheTime: 10 * 60 * 1000 // Cache for 10 minutes
  });

  // Workouts data
  const {
    data: workoutTemplates,
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
    invalidateCache: invalidateTemplates
  } = useApiCache('/workouts/templates/', {
    enabled: isAuthenticated
  });

  const {
    data: workoutPrograms,
    isLoading: programsLoading,
    error: programsError,
    refetch: refetchPrograms,
    invalidateCache: invalidatePrograms
  } = useApiCache('/workouts/programs/', {
    enabled: isAuthenticated
  });

  const {
    data: workoutLogs,
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs,
    invalidateCache: invalidateLogs
  } = useApiCache('/workouts/logs/', {
    enabled: isAuthenticated
  });

  // Gyms data
  const {
    data: gyms,
    isLoading: gymsLoading,
    error: gymsError,
    refetch: refetchGyms
  } = useApiCache('/gyms/', {
    enabled: isAuthenticated,
    cacheTime: 30 * 60 * 1000 // Cache for 30 minutes
  });

  // Friends data
  const {
    data: friends,
    isLoading: friendsLoading,
    error: friendsError,
    refetch: refetchFriends
  } = useApiCache('/users/friends/', {
    enabled: isAuthenticated
  });

  // Friend requests
  const {
    data: friendRequests,
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests
  } = useApiCache('/users/friend_requests/', {
    enabled: isAuthenticated
  });

  // Post mutations
  const createPost = useApiMutation('post', '/posts/', {
    onSuccess: () => {
      invalidatePosts();
    }
  });

  const likePost = useCallback((postId) => {
    const mutation = useApiMutation('post', `/posts/${postId}/like/`, {
      onSuccess: () => {
        invalidatePosts();
      }
    });
    return mutation.mutate();
  }, [invalidatePosts]);

  const commentOnPost = useCallback((postId, content) => {
    const mutation = useApiMutation('post', `/posts/${postId}/comment/`, {
      onSuccess: () => {
        invalidatePosts();
      }
    });
    return mutation.mutate({ content });
  }, [invalidatePosts]);

  // Workout mutations
  const createWorkoutLog = useApiMutation('post', '/workouts/logs/', {
    onSuccess: () => {
      invalidateLogs();
      invalidatePosts(); // Because workout logs can appear in feed
    }
  });

  // Refetch all data
  const refetchAllData = useCallback(() => {
    refetchPosts();
    refetchTrending();
    refetchTemplates();
    refetchPrograms();
    refetchLogs();
    refetchGyms();
    refetchFriends();
    refetchRequests();
  }, [
    refetchPosts, refetchTrending, refetchTemplates, 
    refetchPrograms, refetchLogs, refetchGyms, 
    refetchFriends, refetchRequests
  ]);

  return (
    <DataContext.Provider
      value={{
        // Posts
        posts,
        postsLoading,
        postsError,
        refetchPosts,
        trendingPosts,
        trendingLoading,
        
        // Workouts
        workoutTemplates,
        templatesLoading,
        workoutPrograms,
        programsLoading,
        workoutLogs,
        logsLoading,
        
        // Gyms
        gyms,
        gymsLoading,
        
        // Friends
        friends,
        friendsLoading,
        friendRequests,
        requestsLoading,
        
        // Mutations
        createPost,
        likePost,
        commentOnPost,
        createWorkoutLog,
        
        // Utility
        refetchAllData
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use the data context
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};