import React, { useState, useEffect, useMemo } from 'react';
import Post from './Post';
import { useFriends, useUsers } from '../../../hooks/query';

const FeedContainer = ({ 
    posts = [], 
    loading = false,
    currentUser, 
    onLike, 
    onComment, 
    onShare, 
    onEdit, 
    onDelete,
    onProgramSelect,
    onForkProgram
  }) => {
    const [filteredPosts, setFilteredPosts] = useState([]);
    
    // Use React Query hooks instead of direct API calls
    const { 
      data: friendsList = [], 
      isLoading: friendsLoading 
    } = useFriends();
    
    const { 
      data: allUsers = [], 
      isLoading: usersLoading 
    } = useUsers();
    
    // Create a memoized map of user data by username for better performance
    const usersData = useMemo(() => {
      const userData = {};
      if (allUsers && allUsers.length > 0) {
        allUsers.forEach(user => {
          if (user.username) {
            userData[user.username] = user;
          }
        });
      }
      return userData;
    }, [allUsers]);
    
    // Create a set of friend usernames
    const friendUsernames = useMemo(() => {
      if (!friendsList || friendsList.length === 0) return new Set();
      return new Set(friendsList.map(f => f.friend?.username).filter(Boolean));
    }, [friendsList]);
    
    // Filter posts to only show friends' posts and current user's posts
    useEffect(() => {
      if (posts && posts.length > 0 && !friendsLoading) {
        const friendPosts = posts.filter(post => 
          friendUsernames.has(post.user_username) || post.user_username === currentUser
        );
        setFilteredPosts(friendPosts);
      } else {
        setFilteredPosts([]);
      }
    }, [posts, friendUsernames, currentUser, friendsLoading]);
  
    // Determine if we're still loading
    const isLoading = loading || friendsLoading || usersLoading;
  
    if (isLoading) {
      return (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 rounded-lg p-4 shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full"></div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-800 rounded w-24"></div>
                  <div className="h-2 bg-gray-800 rounded w-16 mt-2"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-800 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-800 rounded w-1/2 mb-3"></div>
              <div className="h-40 bg-gray-800 rounded w-full mb-3"></div>
              <div className="h-10 bg-gray-800 rounded w-full"></div>
            </div>
          ))}
        </div>
      );
    }
  
    return (
      <div>
        {filteredPosts.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-gray-400">Connect with friends to see their updates here</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredPosts.map((post) => (
              <Post
                key={post.id}
                post={post}
                currentUser={currentUser}
                onLike={onLike}
                onComment={onComment}
                onShare={onShare}
                onEdit={onEdit}
                onDelete={onDelete}
                userData={usersData[post.user_username]}
                onProgramClick={onProgramSelect}
                onForkProgram={onForkProgram}
              />
            ))}
          </div>
        )}
      </div>
    );
  };
  
  export default FeedContainer;