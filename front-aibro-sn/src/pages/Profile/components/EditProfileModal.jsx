import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Dumbbell, User, Award, Heart, MapPin, Plus } from 'lucide-react';
import GymCreationModal from './GymCreationModal';
import { getAvatarUrl } from '../../../utils/imageUtils';

// Import React Query hooks
import { 
  useUpdateUser, 
  useGyms, 
  useCurrentUser 
} from '../../../hooks/query';

const EditProfileModal = ({ isOpen, onClose, user }) => {
  const [error, setError] = useState(null);
  const [showGymCreation, setShowGymCreation] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(getAvatarUrl(user?.avatar));
  const [formData, setFormData] = useState({
    bio: '',
    fitness_goals: '',
    training_level: 'beginner',
    personality_type: 'casual',
    preferred_gym: ''
  });

  // React Query hooks
  const { data: gyms = [] } = useGyms();
  const updateUserMutation = useUpdateUser();
  
  // Initialize form data with user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setFormData({
        bio: user.bio || '',
        fitness_goals: user.fitness_goals || '',
        training_level: user.training_level || 'beginner',
        personality_type: user.personality_type || 'casual',
        preferred_gym: user.preferred_gym ? user.preferred_gym.toString() : ''
      });
      setAvatarPreview(getAvatarUrl(user.avatar));
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const profileData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          profileData.append(key, formData[key]);
        }
      });
      
      if (avatarFile) {
        profileData.append('avatar', avatarFile);
      }

      await updateUserMutation.mutateAsync(profileData);
      onClose();
      
      if (typeof window.toast === 'function') {
        window.toast.success('Profile updated successfully');
      }
    } catch (error) {
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error.response) {
        if (error.response.status === 413) {
          errorMessage = 'The uploaded file is too large.';
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        }
      }
      
      setError(errorMessage);
      if (typeof window.toast === 'function') {
        window.toast.error(errorMessage);
      }
    }
  };

  const handleGymCreated = (newGym) => {
    // No need to manually update gyms as React Query will handle it
    setFormData(prevData => ({
      ...prevData,
      preferred_gym: newGym.id.toString()
    }));
    setShowGymCreation(false);
    if (typeof window.toast === 'function') {
      window.toast.success('Gym created successfully');
    }
  };

  const formatText = (text) => {
    if (!text) return '';
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between bg-gray-800/50 px-6 py-4 border-b border-gray-700/50">
            <h2 className="text-xl font-bold">Edit Profile</h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex h-[500px]">
            {/* Sidebar Navigation */}
            <div className="w-40 bg-gray-900/50 border-r border-gray-700/50 p-4">
              <nav className="space-y-1">
                <TabButton 
                  active={activeTab === 'general'} 
                  onClick={() => setActiveTab('general')}
                  icon={<User />}
                  label="General"
                />
                <TabButton 
                  active={activeTab === 'fitness'} 
                  onClick={() => setActiveTab('fitness')}
                  icon={<Dumbbell />}
                  label="Fitness"
                />
                <TabButton 
                  active={activeTab === 'gym'} 
                  onClick={() => setActiveTab('gym')}
                  icon={<MapPin />}
                  label="Gym"
                />
              </nav>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <form onSubmit={handleSaveProfile} className="space-y-5">
                {activeTab === 'general' && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="flex justify-center mb-4">
                      <div className="relative group">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-700 group-hover:border-blue-600 transition-all duration-300 shadow-lg">
                          <img
                            src={avatarPreview}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={() => {
                              setAvatarPreview(getAvatarUrl(null));
                            }}
                          />
                        </div>
                        <label className="absolute bottom-1 right-1 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                        </label>
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-medium">Change Photo</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-1 font-medium">About Me</label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="w-full bg-gray-700/50 border border-gray-700 rounded-lg px-4 py-3 h-28 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        placeholder="Tell others about yourself..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-1 font-medium">Personality Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['casual', 'lone_wolf', 'competitor', 'extrovert_bro'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({...formData, personality_type: type})}
                            className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                              formData.personality_type === type
                                ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                                : 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50'
                            }`}
                          >
                            <Heart className="w-4 h-4" />
                            <span>{formatText(type)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'fitness' && (
                  <div className="space-y-5 animate-fadeIn">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1 font-medium">Fitness Goals</label>
                      <textarea
                        value={formData.fitness_goals}
                        onChange={(e) => setFormData({...formData, fitness_goals: e.target.value})}
                        className="w-full bg-gray-700/50 border border-gray-700 rounded-lg px-4 py-3 h-32 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        placeholder="What are your fitness goals?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-1 font-medium">Training Level</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['beginner', 'intermediate', 'advanced'].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setFormData({...formData, training_level: level})}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                              formData.training_level === level
                                ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                                : 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50'
                            }`}
                          >
                            <Award className={`w-4 h-4 ${formData.training_level === level ? 'text-blue-400' : ''}`} />
                            <span>{formatText(level)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'gym' && (
                  <div className="space-y-5 animate-fadeIn">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm text-gray-300 font-medium">Preferred Gym</label>
                        <button
                          type="button"
                          onClick={() => setShowGymCreation(true)}
                          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Add New Gym
                        </button>
                      </div>
                      <div className="space-y-3">
                        {gyms.length > 0 ? (
                          gyms.map((gym) => (
                            <button
                              key={gym.id}
                              type="button"
                              onClick={() => setFormData({...formData, preferred_gym: gym.id.toString()})}
                              className={`flex items-center w-full text-left p-3 rounded-lg border transition-all ${
                                formData.preferred_gym === gym.id.toString()
                                  ? 'bg-blue-600/20 border-blue-500/50'
                                  : 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50'
                              }`}
                            >
                              <div className="flex-1">
                                <div className="font-medium">{gym.name}</div>
                                <div className="text-sm text-gray-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {gym.location}
                                </div>
                              </div>
                              {formData.preferred_gym === gym.id.toString() && (
                                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="text-center p-6 bg-gray-800/30 rounded-lg border border-gray-700/50">
                            <p className="text-gray-400">No gyms available</p>
                            <button
                              type="button"
                              onClick={() => setShowGymCreation(true)}
                              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors inline-flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" /> Add Your Gym
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2 animate-fadeIn">
                    <X className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>{error}</div>
                  </div>
                )}
                
                <div className="border-t border-gray-700/50 pt-4 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={updateUserMutation.isLoading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 text-sm flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Save className="w-4 h-4" />
                    {updateUserMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <GymCreationModal
        isOpen={showGymCreation}
        onClose={() => setShowGymCreation(false)}
        onGymCreated={handleGymCreated}
      />
    </>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
      active 
        ? 'bg-blue-600/20 text-blue-400' 
        : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
    }`}
  >
    <span className="w-4 h-4">{icon}</span>
    <span className="text-sm">{label}</span>
  </button>
);

export default EditProfileModal;