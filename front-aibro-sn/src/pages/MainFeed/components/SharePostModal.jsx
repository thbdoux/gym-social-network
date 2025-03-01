import React, { useState, useRef, useEffect } from 'react';
import { X, Share2 } from 'lucide-react';
import api from '../../../api';
import { getAvatarUrl } from '../../../utils/imageUtils';

const SharePostModal = ({ isOpen, onClose, post, onShareSuccess }) => {
  const [shareText, setShareText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);
  const inputRef = useRef(null);


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
  const handleSharePost = async () => {
    if (!shareText.trim()) return;

    try {
      setIsSubmitting(true);
      
      // Call the API directly
      const response = await api.post(`/posts/${post.id}/share/`, {
        content: shareText
      });
      
      // Call the success callback with the new post data
      if (onShareSuccess) {
        onShareSuccess(response.data);
      }
      
      // Reset and close modal
      setShareText('');
      onClose();
    } catch (error) {
      console.error('Error sharing post:', error.response?.data || error);
      alert('Failed to share post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
            disabled={!shareText.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            {isSubmitting ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;