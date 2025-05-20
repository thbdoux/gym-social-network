import React, { useState } from 'react';
import { Users, ArrowRight, UserPlus } from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';
import ProfilePreviewModal from './ProfilePreviewModal';
import { useLanguage } from '../../../context/LanguageContext';

const FriendsPreview = ({ 
  friends = [], 
  onViewAllClick,
  maxDisplay = 5, 
  showPersonalityType = false
}) => {
  const { t } = useLanguage();
  
  // State for profile preview modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Format text utilities
  const formatText = (text) => {
    if (!text) return '';
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Handler for opening a friend's profile
  const handleFriendClick = (friend) => {
    setSelectedUser(friend);
    setIsProfileModalOpen(true);
  };

  // Handler for closing profile modal
  const handleCloseProfile = () => {
    setIsProfileModalOpen(false);
    // Wait for animation to complete before clearing the user data
    setTimeout(() => setSelectedUser(null), 300); 
  };

  return (
    <>
      <div className="bg-transparent rounded-xl border border-white/5 shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold flex items-center gap-1.5 text-gray-900 dark:text-white">
              <Users className="w-4 h-4 text-blue-500" />
              <span>{t('friends')}</span>
            </h2>
            <button 
              onClick={onViewAllClick}
              className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              aria-label={t('add_friend')}
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Friend List */}
          <div className="space-y-2 mt-2">
            {friends.length > 0 ? (
              friends.slice(0, maxDisplay).map((friendData) => {
                // Extract the friend from the data structure
                const friend = friendData.friend ? friendData.friend : friendData;
                
                return (
                  <div 
                    key={friend.id} 
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer"
                    onClick={() => handleFriendClick(friend)}
                  >
                    <img
                      src={getAvatarUrl(friend.avatar)}
                      alt={friend.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{friend.username}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {formatText(friend.training_level || 'beginner')}
                        {showPersonalityType && friend.personality_type && ` • ${formatText(friend.personality_type)}`}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('no_friends')}</p>
                <button 
                  onClick={onViewAllClick}
                  className="mt-3 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition-colors"
                >
                  {t('find_friends')}
                </button>
              </div>
            )}
            
            {friends.length > maxDisplay && (
              <button 
                onClick={onViewAllClick}
                className="w-full text-center py-1.5 mt-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 text-xs flex items-center justify-center gap-1 text-gray-600 dark:text-gray-300"
              >
                <span>{t('see_all_friends', { count: friends.length })}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Preview Modal */}
      <ProfilePreviewModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfile}
        userId={selectedUser?.id}
        initialUserData={selectedUser}
      />
    </>
  );
};

export default FriendsPreview;