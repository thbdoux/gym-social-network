// hooks/query/usePostQuery.ts
import { 
    useQuery, 
    useMutation, 
    useQueryClient,
    useInfiniteQuery 
  } from '@tanstack/react-query';
  import { postService } from '../../api/services';
  
  // Query keys
  export const postKeys = {
    all: ['posts'],
    feed: () => [...postKeys.all, 'feed'],
    post: (id) => [...postKeys.all, id],
    infinite: (limit = 10) => [...postKeys.feed(), 'infinite', limit]
  };
  
  // Get the feed posts
  export const usePostsFeed = () => {
    return useQuery({
      queryKey: postKeys.feed(),
      queryFn: postService.getFeed,
      staleTime: 1000 * 60 * 2, // 2 minutes
    });
  };
  
  // Get a single post by ID
  export const usePost = (postId) => {
    return useQuery({
      queryKey: postKeys.post(postId),
      queryFn: () => postService.getPostById(postId),
      enabled: !!postId,
    });
  };
  
  // Create a post
  export const useCreatePost = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: postService.createPost,
      onSuccess: (newPost) => {
        queryClient.setQueryData(postKeys.feed(), (oldData) => {
          if (!oldData) return [newPost];
          return [newPost, ...oldData];
        });
      },
    });
  };
  
  // Update a post
  export const useUpdatePost = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ id, updates }) => postService.updatePost(id, updates),
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
    });
  };
  
  // Delete a post
  export const useDeletePost = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (postId) => postService.deletePost(postId),
      onSuccess: (_, postId) => {
        // Remove post from feed
        queryClient.setQueryData(postKeys.feed(), (oldData) => {
          if (!oldData) return [];
          return oldData.filter(post => post.id !== postId);
        });
        
        // Remove the individual post cache
        queryClient.removeQueries({ queryKey: postKeys.post(postId) });
      },
    });
  };
  
  // Like a post
  export const useLikePost = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (postId) => postService.likePost(postId),
      // Use optimistic updates for likes to make the UI feel responsive
      onMutate: async (postId) => {
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
                is_liked: !post.is_liked,
                likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
              };
            }
            return post;
          });
        });
        
        // Return the previous posts to roll back if needed
        return { previousPosts };
      },
      onError: (err, postId, context) => {
        // Roll back to previous state if mutation fails
        queryClient.setQueryData(postKeys.feed(), context.previousPosts);
      },
      onSettled: () => {
        // Refetch after error or success to make sure we're in sync with the server
        queryClient.invalidateQueries({ queryKey: postKeys.feed() });
      },
    });
  };
  
  // Comment on a post
  export const useCommentOnPost = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ postId, content }) => postService.commentOnPost(postId, content),
      onSuccess: (newComment, { postId }) => {
        // Update the post in the feed by adding the new comment
        queryClient.setQueryData(postKeys.feed(), (oldData) => {
          if (!oldData) return [];
          return oldData.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                comments: [...(post.comments || []), newComment],
                comments_count: (post.comments_count || 0) + 1
              };
            }
            return post;
          });
        });
        
        // Update individual post cache if it exists
        queryClient.setQueryData(postKeys.post(postId), (oldPost) => {
          if (!oldPost) return null;
          return {
            ...oldPost,
            comments: [...(oldPost.comments || []), newComment],
            comments_count: (oldPost.comments_count || 0) + 1
          };
        });
      },
    });
  };
  
  // Share a post
  export const useSharePost = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ postId, content }) => postService.sharePost(postId, content),
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
    });
  };
  
  // Infinite Query for loading more posts
  export const useInfinitePosts = (limit = 10) => {
    return useInfiniteQuery({
      queryKey: postKeys.infinite(limit),
      queryFn: ({ pageParam = 1 }) => 
        postService.getPosts({ page: pageParam, limit }),
      getNextPageParam: (lastPage, allPages) => {
        // Check if there are more pages to load
        const hasMorePages = lastPage.next !== null;
        if (!hasMorePages) return undefined;
        
        // Return the next page number
        return allPages.length + 1;
      },
    });
  };