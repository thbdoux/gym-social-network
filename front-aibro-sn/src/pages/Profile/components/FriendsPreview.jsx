import React from 'react';
import { Users, Plus, ArrowRight } from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';

const FriendsPreview = ({ friends, onViewAllClick, onFriendClick }) => {
  // Format text utilities
  const formatText = (text) => {
    if (!text) return '';
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="border border-white/5 rounded-xl">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium flex items-center gap-1.5">
            <Users className="w-4 h-4 text-green-400" />
            <span>Friends</span>
          </h2>
          <button 
            onClick={onViewAllClick}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            View All
          </button>
        </div>
        
        {friends.length > 0 ? (
          <div className="space-y-2.5">
            {friends.slice(0, 3).map((friendData) => {
              const friend = friendData.friend ? friendData.friend : friendData;
              
              return (
                <div 
                  key={friend.id} 
                  onClick={() => onFriendClick(friend)}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <img
                    src={getAvatarUrl(friend.avatar)}
                    alt={friend.username}
                    className="w-8 h-8 rounded-full object-cover border border-gray-800"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{friend.username}</div>
                    <div className="text-xs text-gray-400 truncate">
                      {formatText(friend.training_level || 'beginner')}
                      {friend.personality_type && ` • ${formatText(friend.personality_type)}`}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {friends.length > 3 && (
              <button 
                onClick={onViewAllClick}
                className="w-full text-center py-2 text-sm border border-white/5 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-1"
              >
                <span>{friends.length - 3} more</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="py-5 text-center border border-white/5 rounded-lg">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p className="text-sm text-gray-400 mb-3">Connect with friends</p>
            <button 
              onClick={onViewAllClick}
              className="inline-flex items-center px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 rounded-md"
            >
              <Plus className="w-3 h-3 mr-1" />
              Find Friends
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPreview;