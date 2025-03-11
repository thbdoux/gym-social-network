import React from 'react';
import { Users, ArrowRight } from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';

const FriendsPreview = ({ friends, onViewAllClick }) => {
  // Format text utilities
  const formatText = (text) => {
    if (!text) return '';
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl overflow-hidden shadow-lg">
      <div className="p-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2 group">
            <Users className="w-5 h-5 text-green-400 transition-transform duration-300 group-hover:scale-110" />
            <span className="group-hover:text-green-300 transition-colors duration-300">Friends</span>
          </h2>
          <button 
            onClick={onViewAllClick}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            View All
          </button>
        </div>
        
        {/* Friend Avatars */}
        <div className="mt-4">
          {friends.length > 0 ? (
            <div className="space-y-3">
              {friends.slice(0, 3).map((friendData) => {
                // Extract the friend from the data structure
                const friend = friendData.friend ? friendData.friend : friendData;
                
                return (
                  <div 
                    key={friend.id} 
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                  >
                    <img
                      src={getAvatarUrl(friend.avatar)}
                      alt={friend.username}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{friend.username}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <span className="truncate">{formatText(friend.training_level || 'beginner')}</span>
                        {friend.personality_type && (
                          <>
                            <span>•</span>
                            <span className="truncate">{formatText(friend.personality_type)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {friends.length > 3 && (
                <button 
                  onClick={onViewAllClick}
                  className="w-full text-center py-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-300 text-sm flex items-center justify-center gap-1"
                >
                  <span>View all {friends.length} friends</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-600 opacity-70" />
              <p className="text-gray-400">No friends yet</p>
              <button 
                onClick={onViewAllClick}
                className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-all duration-300 transform hover:scale-105"
              >
                Find Friends
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsPreview;