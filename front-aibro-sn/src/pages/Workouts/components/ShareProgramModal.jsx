import React, { useState, useEffect } from 'react';
import { X, Share2, Activity, Target, Calendar, Send, CheckCircle } from 'lucide-react';

// Import React Query hook
import { useShareProgram } from '../../../hooks/query/useProgramQuery';

const ShareProgramModal = ({ program, onClose, onShareComplete }) => {
  const [content, setContent] = useState(`Check out my workout program: ${program.name}`);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Use React Query mutation hook for sharing a program
  const shareProgramMutation = useShareProgram();

  // Reset success state if there's an error
  useEffect(() => {
    if (error) {
      setShowSuccess(false);
    }
  }, [error]);

  const handleShareToFeed = async () => {
    if (!content.trim()) return;
    setError(null);
    
    try {
      await shareProgramMutation.mutateAsync({ 
        programId: program.id, 
        shareData: {
          content: content,
          programDetails: program
        }
      });
      
      // Show success effect before closing
      setShowSuccess(true);
      
      // Call onShareComplete if provided
      if (typeof onShareComplete === 'function') {
        onShareComplete();
      }
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error sharing program:', err);
      setError(`Failed to share program: ${err.message}`);
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
        {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-6 animate-fadeIn flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span>Program shared successfully!</span>
        </div>
      )}

      <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={showSuccess}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleShareToFeed}
            disabled={shareProgramMutation.isLoading || !content.trim() || showSuccess}
            className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50
              ${showSuccess 
                ? 'bg-green-600 text-white' 
                : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {shareProgramMutation.isLoading ? (
              <>Loading...</>
            ) : showSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Shared!</span>
              </>
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