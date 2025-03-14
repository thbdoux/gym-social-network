import React, { useState, useEffect } from 'react';
import WelcomeHeader from './components/WelcomeHeader';
import CreatePost from './components/CreatePost';
import FeedContainer from './components/FeedContainer';
import EditPostModal from './components/EditPostModal';
import FriendsPreview from '../Profile/components/FriendsPreview';
import { programService } from '../../api/services';
import postService from '../../api/services/postService';
import userService from '../../api/services/userService';
import FriendsModal from '../Profile/components/FriendsModal';

const MainFeed = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  
  const handleProgramSelect = async (program) => {
    try {
      await programService.getProgramById(program.id);
    } catch (err) {
      console.error('Error navigating to program:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, postsData, friendsData] = await Promise.all([
          userService.getCurrentUser(),
          postService.getFeed(),
          userService.getFriends()
        ]);
        
        setUser(userData);
        setPosts(postsData);
        setFriends(friendsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
  
    fetchData();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostLike = async (postId) => {
    try {
      await postService.likePost(postId);
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, is_liked: !post.is_liked, likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1 }
          : post
      ));
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handlePostComment = async (postId, content) => {
    try {
      const newComment = await postService.commentOnPost(postId, content);
      
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...(post.comments || []), newComment]
          };
        }
        return post;
      }));
    } catch (err) {
      console.error('Error commenting on post:', err);
    }
  };

  const handleSharePost = async (postId, newSharedPostOrContent) => {
    try {
      let sharedPost;
      
      if (typeof newSharedPostOrContent === 'object' && newSharedPostOrContent !== null) {
        // If we already have the full shared post data, use it directly
        sharedPost = newSharedPostOrContent;
        setPosts(prevPosts => [sharedPost, ...prevPosts]);
      } else {
        // If we just have the content text, make the API call via service
        const content = typeof newSharedPostOrContent === 'string' 
          ? newSharedPostOrContent 
          : '';
          
        sharedPost = await postService.sharePost(postId, content);
        
        // Update the posts state with the new shared post
        setPosts(prevPosts => [sharedPost, ...prevPosts]);
      }
      return sharedPost;
    } catch (err) {
      console.error('Error sharing post:', err);
      alert('Failed to share post. Please try again.');
    }
  };
  
  const handleEditClick = (post) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };

  const handleEditPost = async (updatedPost) => {
    try {
      const editableData = {
        content: updatedPost.content,
        post_type: updatedPost.post_type,
        image: updatedPost.image
      };

      const updated = await postService.updatePost(updatedPost.id, editableData);
      setPosts(posts.map(p => p.id === updatedPost.id ? updated : p));
      setIsEditModalOpen(false);
      setEditingPost(null);
    } catch (error) {
      console.error('Error updating post:', error.response?.data || error);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await postService.deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Feed Section - 3/4 width on desktop */}
        <div className="lg:col-span-3 space-y-4">
          <WelcomeHeader username={user?.username} />
          <CreatePost onPostCreated={handlePostCreated} />
          
          <FeedContainer
            posts={posts}
            currentUser={user?.username}
            onLike={handlePostLike}
            onComment={handlePostComment}
            onShare={handleSharePost} 
            onEdit={handleEditClick}
            onDelete={handleDeletePost}
            onProgramSelect={handleProgramSelect}
          />
        </div>
        
        {/* Friends Sidebar - 1/4 width on desktop */}
        <div className="lg:col-span-1 space-y-4">
        <FriendsPreview 
          friends={friends} 
          onViewAllClick={() => setIsFriendsModalOpen(true)}
          maxDisplay={3}
        />
          
          {/* You can add more sidebar components here */}
        </div>
      </div>
      
      {/* Modals */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPost(null);
          }}
          onSave={handleEditPost}
        />
      )}
      
      {isFriendsModalOpen && (
        <FriendsModal
          isOpen={isFriendsModalOpen}
          onClose={() => setIsFriendsModalOpen(false)}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default MainFeed;