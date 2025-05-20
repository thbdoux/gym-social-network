import React, { useState } from 'react';
import WelcomeHeader from './components/WelcomeHeader';
import CreatePost from './components/CreatePost';
import FeedContainer from './components/FeedContainer';
import EditPostModal from './components/EditPostModal';
import FriendsPreview from '../Profile/components/FriendsPreview';
import FriendsModal from '../Profile/components/FriendsModal';
import { useLanguage } from '../../context/LanguageContext';
import { 
  usePostsFeed, 
  useCurrentUser, 
  useFriends,
  useLikePost,
  useCommentOnPost,
  useSharePost,
  useUpdatePost,
  useDeletePost,
  useCreatePost
} from '../../hooks/query';

const MainFeed = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const { t } = useLanguage();
  
  // Use React Query hooks
  const { data: posts = [], isLoading: postsLoading, error: postsError } = usePostsFeed();
  const { data: user } = useCurrentUser();
  const { data: friends = [] } = useFriends();
  
  // Mutations
  const createPostMutation = useCreatePost();
  const likePostMutation = useLikePost();
  const commentPostMutation = useCommentOnPost();
  const sharePostMutation = useSharePost();
  const updatePostMutation = useUpdatePost();
  const deletePostMutation = useDeletePost();

  const handlePostCreated = (postData) => {
    createPostMutation.mutate(postData);
  };

  const handlePostLike = (postId) => {
    likePostMutation.mutate(postId);
  };

  const handlePostComment = (postId, content) => {
    commentPostMutation.mutate({ postId, content });
  };

  const handleSharePost = (postId, content) => {
    sharePostMutation.mutate({ postId, content });
  };
  
  const handleEditClick = (post) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };

  const handleEditPost = (updatedPost) => {
    updatePostMutation.mutate(
      { id: updatedPost.id, updates: updatedPost },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setEditingPost(null);
        }
      }
    );
  };

  const handleDeletePost = (postId) => {
    deletePostMutation.mutate(postId);
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
            loading={postsLoading}
            error={postsError?.message}
            currentUser={user?.username}
            onLike={handlePostLike}
            onComment={handlePostComment}
            onShare={handleSharePost} 
            onEdit={handleEditClick}
            onDelete={handleDeletePost}
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
          modalTitle={t('edit_post')}
          saveButtonText={t('save')}
          cancelButtonText={t('cancel')}
        />
      )}
      
      {isFriendsModalOpen && (
        <FriendsModal
          isOpen={isFriendsModalOpen}
          onClose={() => setIsFriendsModalOpen(false)}
          currentUser={user}
          modalTitle={t('your_friends')}
          closeButtonText={t('close')}
        />
      )}
    </div>
  );
};

export default MainFeed;