import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const EditPostModal = ({ post, isOpen, onClose, onSave }) => {
  const [editedContent, setEditedContent] = React.useState(post?.content || '');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSave = () => {
    const updatedPost = {
      ...post,
      content: editedContent,
    };
    onSave(updatedPost);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-lg mx-4 overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Edit Post</h3>
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
            <textarea
              ref={textareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full bg-gray-900 text-gray-100 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            />
          </div>

          {/* Post preview */}
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                {post.user_profile_picture ? (
                  <img 
                    src={post.user_profile_picture} 
                    alt={post.user_username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {post.user_username[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400">
                Preview as <span className="text-white">{post.user_username}</span>
              </div>
            </div>
            <p className="text-gray-300">{editedContent || 'Your post content will appear here'}</p>
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
            onClick={handleSave}
            disabled={!editedContent.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-blue-500"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;