import React, { useState, useCallback } from 'react';
import { Shield, Eye, EyeOff, Share2, Plus, X, Search, User } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';
import { debounce } from 'lodash'; // Make sure to import debounce
import userService from '../../../../../api/services/userService'; // Import your user service

const AdvancedOptionsStep = ({ formData, updateFormData }) => {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Get the current shares from formData or initialize to empty array
  const shares = formData.shares || [];

  // Debounced search function to avoid too many API calls
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (query.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      
      setIsSearching(true);
      try {
        const results = await userService.searchUsers(query);
        // Filter out users already in the share list
        const filteredResults = results.filter(
          user => !shares.some(share => share.username === user.username)
        );
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [shares]
  );

  // Handle adding a user to the share list
  const handleAddUser = (user) => {
    if (!shares.some(share => share.username === user.username)) {
      const newShares = [...shares, { username: user.username, id: user.id }];
      updateFormData({ shares: newShares });
    }
    setUsername('');
    setSearchResults([]);
  };

  // Handle removing a user from the share list
  const handleRemoveUser = (username) => {
    const newShares = shares.filter(share => share.username !== username);
    updateFormData({ shares: newShares });
  };

  // Handle input change for username search
  const handleInputChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    debouncedSearch(value);
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <h2 className="text-2xl font-bold text-white text-center mb-8">
        {t('wizard_options_title')}
      </h2>
      
      <div className="space-y-6">
        {/* Active program toggle switch */}
        <label className="relative inline-flex items-center cursor-pointer bg-gray-900 p-4 rounded-lg border border-gray-700 w-full">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => updateFormData({ is_active: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1.5rem] after:left-[1.5rem] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <div className="ml-4">
            <span className="text-white font-medium flex items-center">
              <Shield className="w-4 h-4 mr-2 text-blue-400" />
              {t('wizard_options_active_program')}
            </span>
          </div>
        </label>

        {/* Public toggle switch */}
        <label className="relative inline-flex items-center cursor-pointer bg-gray-900 p-4 rounded-lg border border-gray-700 w-full">
          <input
            type="checkbox"
            checked={formData.is_public}
            onChange={(e) => updateFormData({ is_public: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1.5rem] after:left-[1.5rem] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <div className="ml-4">
            <span className="text-white font-medium flex items-center">
              {formData.is_public ? (
                <Eye className="w-4 h-4 mr-2 text-green-400" />
              ) : (
                <EyeOff className="w-4 h-4 mr-2 text-red-400" />
              )}
              {t('wizard_options_public')}
            </span>
          </div>
        </label>

        {/* New Share with specific users section */}
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 w-full">
          <div className="flex items-center mb-4">
            <Share2 className="w-4 h-4 mr-2 text-purple-400" />
            <span className="text-white font-medium">
              {t('wizard_options_share_with')}
            </span>
          </div>

          {/* User search input */}
          <div className="relative mb-4">
            <div className="flex">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text"
                  value={username}
                  onChange={handleInputChange}
                  placeholder={t('wizard_options_search_users')}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white text-sm"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setUsername('')}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-r-lg text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-gray-800 rounded-lg border border-gray-700 shadow-lg max-h-60 overflow-auto">
                {searchResults.map(user => (
                  <div 
                    key={user.id}
                    onClick={() => handleAddUser(user)}
                    className="flex items-center p-2 hover:bg-gray-700 cursor-pointer"
                  >
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.username} 
                        className="w-6 h-6 rounded-full mr-2 object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                    )}
                    <span className="text-white">{user.username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* List of users to share with */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {shares.length === 0 ? (
              <p className="text-gray-400 text-sm">{t('wizard_options_no_shares')}</p>
            ) : (
              shares.map(share => (
                <div 
                  key={share.username}
                  className="flex items-center justify-between bg-gray-800 rounded-lg p-2"
                >
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-purple-400" />
                    <span className="text-white text-sm">{share.username}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveUser(share.username)}
                    className="p-1 text-gray-400 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedOptionsStep;