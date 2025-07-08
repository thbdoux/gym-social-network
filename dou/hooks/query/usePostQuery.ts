// hooks/query/usePostQuery.ts - Enhanced with auth guards
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  useInfiniteQuery 
} from '@tanstack/react-query';
import { postService } from '../../api/services';
import { useAuth } from '../useAuth';

// Query keys
export const postKeys = {
  all: ['posts'],
  feed: () => [...postKeys.all, 'feed'],
  post: (id) => [...postKeys.all, id],
  comments: (postId) => [...postKeys.post(postId), 'comments'],
  comment: (postId, commentId) => [...postKeys.comments(postId), commentId],
  infinite: (limit = 10) => [...postKeys.feed(), 'infinite', limit],
  likers: (postId) => [...postKeys.post(postId), 'likers'],
  reactions: (postId) => [...postKeys.post(postId), 'reactions']
};

// Get the feed posts - AUTH PROTECTED
export const usePostsFeed = () => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: postKeys.feed(),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching posts feed...');
      return postService.getFeed();
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    staleTime: 1000 * 60 * 2, // 2 minutes
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Get a single post by ID - AUTH PROTECTED
export const usePost = (postId) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: postKeys.post(postId),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching post:', postId);
      return postService.getPostById(postId);
    },
    enabled: 
      !!postId &&
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Create a post - AUTH PROTECTED
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (postData) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📝 Creating post...');
      return postService.createPost(postData);
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData(postKeys.feed(), (oldData) => {
        if (!oldData) return [newPost];
        return [newPost, ...oldData];
      });
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Update a post - AUTH PROTECTED
export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('✏️ Updating post:', id);
      return postService.updatePost(id, updates);
    },
    onSuccess: (updatedPost) => {
      // Update the post in the feed
      queryClient.setQueryData(postKeys.feed(), (oldData) => {
        if (!oldData) return [];
        return oldData.map(post => 
          post.id === updatedPost.id ? updatedPost : post
        );
      });
      
      // Update the individual post cache
      queryClient.setQueryData(postKeys.post(updatedPost.id), updatedPost);
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Delete a post - AUTH PROTECTED
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (postId) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('🗑️ Deleting post:', postId);
      return postService.deletePost(postId);
    },
    onSuccess: (_, postId) => {
      // Remove post from feed
      queryClient.setQueryData(postKeys.feed(), (oldData) => {
        if (!oldData) return [];
        return oldData.filter(post => post.id !== postId);
      });
      
      // Remove the individual post cache
      queryClient.removeQueries({ queryKey: postKeys.post(postId) });
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Updated to handle both like and unlike actions - AUTH PROTECTED
export const useLikePost = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, isLiked }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('❤️ Toggling like for post:', postId);
      return postService.likePost(postId, isLiked);
    },
    // Use optimistic updates for likes to make the UI feel responsive
    onMutate: async ({ postId, isLiked }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: postKeys.feed() });
      
      // Save the previous value
      const previousPosts = queryClient.getQueryData(postKeys.feed());
      
      // Optimistically update the feed
      queryClient.setQueryData(postKeys.feed(), (oldData) => {
        if (!oldData) return [];
        return oldData.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              is_liked: !isLiked,
              likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
              // Clear any reaction if we're liking
              user_reaction: isLiked ? null : 'like'
            };
          }
          return post;
        });
      });
      
      // Update the individual post cache if it exists
      queryClient.setQueryData(postKeys.post(postId), (oldPost) => {
        if (!oldPost) return null;
        return {
          ...oldPost,
          is_liked: !isLiked,
          likes_count: isLiked ? oldPost.likes_count - 1 : oldPost.likes_count + 1,
          user_reaction: isLiked ? null : 'like'
        };
      });
      
      // Return the previous posts to roll back if needed
      return { previousPosts };
    },
    onError: (err, { postId }, context) => {
      // Roll back to previous state if mutation fails
      queryClient.setQueryData(postKeys.feed(), context.previousPosts);
    },
    onSettled: () => {
      // Refetch after error or success to make sure we're in sync with the server
      queryClient.invalidateQueries({ queryKey: postKeys.feed() });
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// React to a post - AUTH PROTECTED
export const useReactToPost = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, reactionType }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('😊 Reacting to post:', postId, 'with:', reactionType);
      return postService.reactToPost(postId, reactionType);
    },
    onMutate: async ({ postId, reactionType, userId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: postKeys.feed() });
      
      // Save the previous value
      const previousPosts = queryClient.getQueryData(postKeys.feed());
      
      // Use current user ID if not provided
      const currentUserId = userId || user?.id;
      
      // Optimistically update the feed
      queryClient.setQueryData(postKeys.feed(), (oldData) => {
        if (!oldData) return [];
        return oldData.map(post => {
          if (post.id === postId) {
            // Check if user already had a reaction
            const previousReaction = post.user_reaction;
            const hasExistingReaction = !!previousReaction;
            
            // Prepare updated reactions
            let updatedReactions = [...(post.reactions || [])];
            const userReactionIndex = updatedReactions.findIndex(r => r.user_id === currentUserId);
            
            if (userReactionIndex >= 0) {
              // Replace existing reaction
              updatedReactions[userReactionIndex] = {
                ...updatedReactions[userReactionIndex],
                reaction_type: reactionType
              };
            } else {
              // Add new reaction (this will be replaced by the server response)
              updatedReactions.push({
                id: -1, // Temporary ID
                reaction_type: reactionType,
                user_id: currentUserId,
                user_username: user?.username || 'currentUser',
                created_at: new Date().toISOString()
              });
            }
            
            return {
              ...post,
              user_reaction: reactionType,
              reactions: updatedReactions,
              reactions_count: hasExistingReaction ? post.reactions_count : (post.reactions_count || 0) + 1,
              // If we're reacting, we can't have a like at the same time
              is_liked: false,
              likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count
            };
          }
          return post;
        });
      });
      
      // Do the same for the individual post if it exists
      queryClient.setQueryData(postKeys.post(postId), (oldPost) => {
        if (!oldPost) return null;
        
        // Check if user already had a reaction
        const previousReaction = oldPost.user_reaction;
        const hasExistingReaction = !!previousReaction;
        
        // Prepare updated reactions
        let updatedReactions = [...(oldPost.reactions || [])];
        const userReactionIndex = updatedReactions.findIndex(r => r.user_id === currentUserId);
        
        if (userReactionIndex >= 0) {
          // Replace existing reaction
          updatedReactions[userReactionIndex] = {
            ...updatedReactions[userReactionIndex],
            reaction_type: reactionType
          };
        } else {
          // Add new reaction (this will be replaced by the server response)
          updatedReactions.push({
            id: -1, // Temporary ID
            reaction_type: reactionType,
            user_id: currentUserId,
            user_username: user?.username || 'currentUser',
            created_at: new Date().toISOString()
          });
        }
        
        return {
          ...oldPost,
          user_reaction: reactionType,
          reactions: updatedReactions,
          reactions_count: hasExistingReaction ? oldPost.reactions_count : (oldPost.reactions_count || 0) + 1,
          // If we're reacting, we can't have a like at the same time
          is_liked: false,
          likes_count: oldPost.is_liked ? oldPost.likes_count - 1 : oldPost.likes_count
        };
      });
      
      return { previousPosts };
    },
    onError: (err, { postId }, context) => {
      // Roll back to previous state if mutation fails
      if (context?.previousPosts) {
        queryClient.setQueryData(postKeys.feed(), context.previousPosts);
      }
    },
    onSuccess: (newReaction, { postId }) => {
      // Fetch fresh data to ensure consistency
      queryClient.invalidateQueries({ queryKey: postKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.reactions(postId) });
    },
    onSettled: () => {
      // Refetch feed to ensure consistency
      queryClient.invalidateQueries({ queryKey: postKeys.feed() });
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Remove a reaction from a post - AUTH PROTECTED
export const useUnreactToPost = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('🚫 Removing reaction from post:', postId);
      return postService.unreactToPost(postId);
    },
    onMutate: async ({ postId, userId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: postKeys.feed() });
      
      // Save the previous value
      const previousPosts = queryClient.getQueryData(postKeys.feed());
      
      // Use current user ID if not provided
      const currentUserId = userId || user?.id;
      
      // Optimistically update the feed
      queryClient.setQueryData(postKeys.feed(), (oldData) => {
        if (!oldData) return [];
        return oldData.map(post => {
          if (post.id === postId) {
            // Remove the user's reaction
            const updatedReactions = (post.reactions || []).filter(
              r => r.user_id !== currentUserId
            );
            
            return {
              ...post,
              reactions: updatedReactions,
              reactions_count: (post.reactions_count || 0) - 1,
              user_reaction: null
            };
          }
          return post;
        });
      });
      
      // Do the same for the individual post if it exists
      queryClient.setQueryData(postKeys.post(postId), (oldPost) => {
        if (!oldPost) return null;
        
        // Remove the user's reaction
        const updatedReactions = (oldPost.reactions || []).filter(
          r => r.user_id !== currentUserId
        );
        
        return {
          ...oldPost,
          reactions: updatedReactions,
          reactions_count: (oldPost.reactions_count || 0) - 1,
          user_reaction: null
        };
      });
      
      return { previousPosts };
    },
    onError: (err, { postId }, context) => {
      // Roll back to previous state if mutation fails
      if (context?.previousPosts) {
        queryClient.setQueryData(postKeys.feed(), context.previousPosts);
      }
    },
    onSuccess: (_, { postId }) => {
      // Fetch fresh data to ensure consistency
      queryClient.invalidateQueries({ queryKey: postKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.reactions(postId) });
    },
    onSettled: () => {
      // Refetch feed to ensure consistency
      queryClient.invalidateQueries({ queryKey: postKeys.feed() });
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Get reactions for a post - AUTH PROTECTED
export const usePostReactions = (postId) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: postKeys.reactions(postId),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching reactions for post:', postId);
      return postService.getPostReactions(postId);
    },
    enabled: 
      !!postId &&
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Get comments for a post - AUTH PROTECTED
export const usePostComments = (postId) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: postKeys.comments(postId),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching comments for post:', postId);
      return postService.getPostComments(postId);
    },
    enabled: 
      !!postId &&
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Comment on a post - improved to better update counts - AUTH PROTECTED
export const useCommentOnPost = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, content, parentId }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('💬 Adding comment to post:', postId);
      return postService.commentOnPost(postId, content, parentId);
    },
    onSuccess: (newComment, { postId }) => {
      // Update comments cache
      queryClient.setQueryData(postKeys.comments(postId), (oldData) => {
        if (!oldData) return [newComment];
        
        // If this is a top-level comment, add it to the list
        if (!newComment.parent) {
          return [newComment, ...oldData];
        }
        
        // If this is a reply, find the parent and add the reply
        return oldData.map(comment => {
          if (comment.id === newComment.parent) {
            return {
              ...comment,
              replies: [newComment, ...(comment.replies || [])],
              replies_count: (comment.replies_count || 0) + 1
            };
          }
          return comment;
        });
      });
      
      // Update the post cache to reflect new comment count
      queryClient.setQueryData(postKeys.post(postId), (oldPost) => {
        if (!oldPost) return null;
        return {
          ...oldPost,
          comments_count: oldPost.comments_count + 1
        };
      });
      
      // Update the feed with new comment count
      queryClient.setQueryData(postKeys.feed(), (oldData) => {
        if (!oldData) return [];
        return oldData.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments_count: post.comments_count + 1
            };
          }
          return post;
        });
      });
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Edit a comment - AUTH PROTECTED
export const useEditComment = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, commentId, content }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('✏️ Editing comment:', commentId);
      return postService.editComment(postId, commentId, content);
    },
    onSuccess: (updatedComment, { postId }) => {
      // Update the comments cache
      queryClient.setQueryData(postKeys.comments(postId), (oldData) => {
        if (!oldData) return [];
        
        // If this is a top-level comment, update it in the list
        if (!updatedComment.parent) {
          return oldData.map(comment => 
            comment.id === updatedComment.id ? updatedComment : comment
          );
        }
        
        // If this is a reply, find the parent and update the reply
        return oldData.map(comment => {
          if (comment.id === updatedComment.parent) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.id === updatedComment.id ? updatedComment : reply
              )
            };
          }
          return comment;
        });
      });
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Delete a comment - AUTH PROTECTED
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, commentId }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('🗑️ Deleting comment:', commentId);
      return postService.deleteComment(postId, commentId);
    },
    
    // Add optimistic update
    onMutate: async ({ postId, commentId, parentId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: postKeys.comments(postId) });
      
      // Get the current state
      const previousComments = queryClient.getQueryData(postKeys.comments(postId));
      
      // Optimistically update
      queryClient.setQueryData(postKeys.comments(postId), (oldData) => {
        if (!oldData) return [];
        
        // If deleting a top-level comment
        if (!parentId) {
          return oldData.filter(comment => comment.id !== commentId);
        }
        
        // If deleting a reply
        return oldData.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies.filter(reply => reply.id !== commentId),
              replies_count: comment.replies_count - 1
            };
          }
          return comment;
        });
      });
      
      return { previousComments };
    },
    
    // Handle errors by rolling back
    onError: (err, { postId }, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(postKeys.comments(postId), context.previousComments);
      }
    },
    
    onSuccess: (_, { postId }) => {
      // Refresh comment data to ensure consistency
      queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) });
      
      // Update the post comment count
      queryClient.setQueryData(postKeys.post(postId), (oldPost) => {
        if (!oldPost) return null;
        return {
          ...oldPost,
          comments_count: Math.max(0, oldPost.comments_count - 1)
        };
      });
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// React to a comment - AUTH PROTECTED
export const useReactToComment = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, commentId, reactionType }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('😊 Reacting to comment:', commentId);
      return postService.reactToComment(postId, commentId, reactionType);
    },
    onSuccess: (newReaction, { postId, commentId, parentId }) => {
      // Update the comments cache
      queryClient.setQueryData(postKeys.comments(postId), (oldData) => {
        if (!oldData) return [];
        
        // Function to update a comment's reactions
        const updateCommentReactions = (comment) => {
          if (comment.id !== commentId) return comment;
          
          // Find if user already had a reaction
          const userId = newReaction.user_id;
          const existingReactionIndex = comment.reactions.findIndex(
            r => r.user_id === userId
          );
          
          let updatedReactions;
          if (existingReactionIndex >= 0) {
            // Replace existing reaction
            updatedReactions = [
              ...comment.reactions.slice(0, existingReactionIndex),
              newReaction,
              ...comment.reactions.slice(existingReactionIndex + 1)
            ];
          } else {
            // Add new reaction
            updatedReactions = [...comment.reactions, newReaction];
          }
          
          return {
            ...comment,
            reactions: updatedReactions,
            reactions_count: updatedReactions.length
          };
        };
        
        // If this is a reaction on a top-level comment
        if (!parentId) {
          return oldData.map(updateCommentReactions);
        }
        
        // If this is a reaction on a reply
        return oldData.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies.map(updateCommentReactions)
            };
          }
          return comment;
        });
      });
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Remove a reaction from a comment - AUTH PROTECTED
export const useUnreactToComment = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, commentId }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('🚫 Removing reaction from comment:', commentId);
      return postService.unreactToComment(postId, commentId);
    },
    onSuccess: (_, { postId, commentId, parentId, userId }) => {
      // Use current user ID if not provided
      const currentUserId = userId || user?.id;
      
      // Update the comments cache
      queryClient.setQueryData(postKeys.comments(postId), (oldData) => {
        if (!oldData) return [];
        
        // Function to remove a user's reaction from a comment
        const removeUserReaction = (comment) => {
          if (comment.id !== commentId) return comment;
          
          const updatedReactions = comment.reactions.filter(
            r => r.user_id !== currentUserId
          );
          
          return {
            ...comment,
            reactions: updatedReactions,
            reactions_count: updatedReactions.length
          };
        };
        
        // If this is a reaction on a top-level comment
        if (!parentId) {
          return oldData.map(removeUserReaction);
        }
        
        // If this is a reaction on a reply
        return oldData.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies.map(removeUserReaction)
            };
          }
          return comment;
        });
      });
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Share a post - AUTH PROTECTED
export const useSharePost = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, content }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('🔄 Sharing post:', postId);
      return postService.sharePost(postId, content);
    },
    onSuccess: (sharedPost) => {
      // Add the new shared post to the feed
      queryClient.setQueryData(postKeys.feed(), (oldData) => {
        if (!oldData) return [sharedPost];
        if (oldData.some(post => post.id === sharedPost.id)) {
          return oldData;
        }
        return [sharedPost, ...oldData];
      });
      
      // Increment the share count on the original post
      queryClient.setQueryData(postKeys.feed(), (oldData) => {
        if (!oldData) return [];
        return oldData.map(post => {
          if (post.id === sharedPost.original_post_details?.id) {
            return {
              ...post,
              shares_count: (post.shares_count || 0) + 1
            };
          }
          return post;
        });
      });
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Infinite Query for loading more posts - AUTH PROTECTED
export const useInfinitePosts = (limit = 10) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useInfiniteQuery({
    queryKey: postKeys.infinite(limit),
    queryFn: async ({ pageParam = 1 }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching infinite posts page:', pageParam);
      return postService.getPosts({ page: pageParam, limit });
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    getNextPageParam: (lastPage, allPages) => {
      // Check if there are more pages to load
      const hasMorePages = lastPage.next !== null;
      if (!hasMorePages) return undefined;
      
      // Return the next page number
      return allPages.length + 1;
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

/**
 * Hook to fetch users who liked a post - AUTH PROTECTED
 * @param postId The ID of the post
 * @returns Query result with likers data
 */
export const usePostLikers = (postId) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: postKeys.likers(postId),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching likers for post:', postId);
      return postService.getLikers(postId);
    },
    enabled: 
      !!postId &&
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    staleTime: 1000 * 60 * 2, // 2 minutes
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};