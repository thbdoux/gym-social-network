import React, { useState, useRef, useEffect } from 'react';
import { X, Share2 } from 'lucide-react';
import { useSharePost } from '../../../hooks/query';
import { getAvatarUrl } from '../../../utils/imageUtils';

const SharePostModal = ({ isOpen, onClose, post, onShareSuccess }) => {
  const [shareText, setShareText] = useState('');
  const modalRef = useRef(null);
  const inputRef = useRef(null);

  // Use React Query mutation
  const sharePostMutation = useSharePost();

  useEffect(() => {
    // Focus the text area when modal opens
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }

    // Close modal when clicking outside
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle share post submission
  const handleSharePost = () => {
    if (!shareText.trim()) return;

    // Use React Query mutation
    sharePostMutation.mutate(
      { postId: post.id, content: shareText },
      {
        onSuccess: (sharedPost) => {
          // Call the success callback with the new post data
          if (onShareSuccess) {
            onShareSuccess(sharedPost);
          }
          
          // Reset and close modal
          setShareText('');
          onClose();
        },
        onError: (error) => {
          console.error('Error sharing post:', error);
          alert('Failed to share post. Please try again.');
        }
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-gray-800 rounded-lg w-full max-w-lg overflow-hidden shadow-xl transform transition-all animate-in fade-in"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Share2 className="mr-2 w-5 h-5 text-blue-400" />
            Share Post
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <label htmlFor="share-comment" className="block text-sm font-medium text-gray-400 mb-2">
              Add your thoughts
            </label>
            <textarea
              id="share-comment"
              ref={inputRef}
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              placeholder="What do you think about this post?"
              rows={4}
              className="w-full bg-gray-900 text-gray-100 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            />
          </div>

          {/* Original post preview */}
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {post.user_username[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-white">{post.user_username}</p>
                <p className="text-xs text-gray-400">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <p className="text-gray-300 line-clamp-3">{post.content}</p>
            {post.image && (
              <div className="mt-2 rounded-lg overflow-hidden h-16">
                <img 
                  src={getAvatarUrl(post.image)} 
                  alt="Post thumbnail" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-900 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSharePost}
            disabled={!shareText.trim() || sharePostMutation.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {sharePostMutation.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sharing...</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;