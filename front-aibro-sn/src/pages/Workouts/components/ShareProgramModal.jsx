import React, { useState } from 'react';
import { X, Share2, Activity, Target, Calendar, Send } from 'lucide-react';
import api from '../../../api';

const ShareProgramModal = ({ program, onClose }) => {
  const [content, setContent] = useState(`Check out my workout program: ${program.name}`);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState(null);

  // In ShareProgramModal.jsx, update to ensure program_id is correctly included

// In ShareProgramModal.jsx, update the handleShareToFeed function

const handleShareToFeed = async () => {
  if (!content.trim()) return;
  
  setIsSharing(true);
  try {
    console.log('Program being shared:', program);
    
    // Create post data with ONE program_id field
    const postData = new FormData();
    postData.append('content', content);
    postData.append('post_type', 'program');
    
    // Only append program_id ONCE as a string
    postData.append('program_id', String(program.id));
    
    // Include program details as JSON
    postData.append('program_details', JSON.stringify(program));
    
    console.log('Sending data:', {
      content: content,
      post_type: 'program',
      program_id: String(program.id)
    });
    
    // Send the post request
    const response = await api.post('/posts/', postData);
    console.log('Shared program post response:', response.data);
    
    onClose();
  } catch (err) {
    console.error('Error sharing program:', err);
    console.error('Error details:', err.response?.data);
    setError(`Failed to share program: ${err.response?.data?.detail || err.message}`);
  } finally {
    setIsSharing(false);
  }
};


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Share Program</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Program Preview */}
        <div className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-700/50">
          <h4 className="text-lg font-semibold text-white">{program.name}</h4>
          <p className="text-gray-400 text-sm mb-3">{program.description}</p>
          
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-gray-800/50 p-2 rounded-lg">
              <div className="flex items-center text-gray-400 text-xs mb-1">
                <Calendar className="w-3 h-3 mr-1" />
                <span>Frequency</span>
              </div>
              <div className="text-sm text-white font-medium">
                {program.sessions_per_week}x weekly
              </div>
            </div>
            
            <div className="bg-gray-800/50 p-2 rounded-lg">
              <div className="flex items-center text-gray-400 text-xs mb-1">
                <Target className="w-3 h-3 mr-1" />
                <span>Focus</span>
              </div>
              <div className="text-sm text-white font-medium capitalize">
                {program.focus.replace(/_/g, ' ')}
              </div>
            </div>
            
            <div className="bg-gray-800/50 p-2 rounded-lg">
              <div className="flex items-center text-gray-400 text-xs mb-1">
                <Activity className="w-3 h-3 mr-1" />
                <span>Workouts</span>
              </div>
              <div className="text-sm text-white font-medium">
                {program.workouts?.length || 0} total
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500 flex items-center">
            <span className="font-semibold">Program ID:</span>
            <span className="ml-1">{program.id}</span>
          </div>
        </div>

        {/* Message Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Add a message (optional)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700/50 rounded-lg text-white border border-gray-600 focus:border-blue-500 resize-none"
            rows={3}
          />
        </div>

        {error && (
          <div className="bg-red-400/10 border border-red-400/20 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShareToFeed}
            disabled={isSharing || !content.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {isSharing ? (
              <>Loading...</>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Share to Feed</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareProgramModal;