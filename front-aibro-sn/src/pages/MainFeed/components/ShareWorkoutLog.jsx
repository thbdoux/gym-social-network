import React, { useState, useEffect } from 'react';
import { Activity, Search, Share2, X, ChevronDown } from 'lucide-react';
import WorkoutLogCard from './../../Workouts/components/WorkoutLogCard';
import { useWorkoutLogs } from './../../Workouts/hooks/useWorkoutLogs';

const ShareWorkoutLog = ({ onClose, onShare }) => {
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareComment, setShareComment] = useState('');
  const { logs, loading } = useWorkoutLogs();

  // Filter logs based on search query
  const filteredLogs = logs.filter(log =>
    log.workout_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.date?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShare = () => {
    if (!selectedLog) return;
    
    // Log the data being shared
    console.log('Selected workout log:', selectedLog);
    
    const postData = {
      content: shareComment,
      post_type: 'workout_log',
      workout_log_id: selectedLog.id  // Changed from workout_log to workout_log_id
    };
    
    console.log('Sending post data:', postData);
    onShare(postData);
    onClose();
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-3xl mx-4 overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Share Workout</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your workouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 text-gray-100 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Workout List */}
        <div className="max-h-[400px] overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center text-gray-400">Loading workouts...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center text-gray-400">No workouts found</div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`cursor-pointer transition-all duration-300 rounded-xl overflow-hidden ${
                  selectedLog?.id === log.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedLog(log)}
              >
                <WorkoutLogCard
                  log={log}
                  hideActions={true}
                />
              </div>
            ))
          )}
        </div>

        {/* Share Comment */}
        {selectedLog && (
          <div className="p-6 border-t border-gray-700">
            <textarea
              value={shareComment}
              onChange={(e) => setShareComment(e.target.value)}
              placeholder="Add a comment about this workout..."
              className="w-full bg-gray-900 text-gray-100 rounded-lg p-3 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

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
            onClick={handleShare}
            disabled={!selectedLog}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-blue-500 flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Workout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareWorkoutLog;