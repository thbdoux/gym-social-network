import React, { useState, useEffect } from 'react';
import { userService } from '../../../api/services';
import Post from './Post';

const FeedContainer = ({ 
    posts, 
    currentUser, 
    onLike, 
    onComment, 
    onShare, 
    onEdit, 
    onDelete,
    onProgramSelect,
    onForkProgram
  }) => {
    const [usersData, setUsersData] = useState({});
    const [friendUsernames, setFriendUsernames] = useState(null);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Fetch friends list
    useEffect(() => {
      const fetchFriends = async () => {
        try {
          // Use userService instead of direct API call
          const friendsList = await userService.getFriends();
          
          // Get list of friend usernames
          const friendsSet = new Set(friendsList.map(f => f.friend.username));
          setFriendUsernames(friendsSet);
        } catch (error) {
          console.error('Error fetching friends:', error);
          setFriendUsernames(new Set()); // Set empty set on error
        }
      };
  
      fetchFriends();
    }, []);
  
    // Filter posts to only show friends' posts and current user's posts
    useEffect(() => {
      // Only proceed if friendUsernames is not null (indicating friends have been fetched)
      if (friendUsernames !== null) {
        const friendPosts = posts.filter(post => 
          friendUsernames.has(post.user_username) || post.user_username === currentUser
        );
        setFilteredPosts(friendPosts);
        setLoading(false);
      }
    }, [posts, friendUsernames, currentUser]);
  
    // Fetch user data for posts
    useEffect(() => {
      const usernames = [...new Set(filteredPosts.map(post => post.user_username))];
      
      const fetchUsersData = async () => {
        try {
          // Use userService instead of direct API call
          const allUsers = await userService.getAllUsers();
          
          const newUsersData = {};
          usernames.forEach(username => {
            const user = allUsers.find(u => u.username === username);
            if (user) {
              newUsersData[username] = user;
            }
          });
          
          setUsersData(newUsersData);
        } catch (error) {
          console.error('Error fetching users data:', error);
        }
      };
  
      if (usernames.length > 0) {
        fetchUsersData();
      }
    }, [filteredPosts]);
  
    if (loading) {
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