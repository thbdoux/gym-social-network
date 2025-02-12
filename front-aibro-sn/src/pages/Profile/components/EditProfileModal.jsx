import React, { useState, useEffect } from 'react';
import { X, Save, Upload } from 'lucide-react';
import api from '../../../api';
import GymCreationCard from './GymCreationCard';

const EditProfileModal = ({ isOpen, onClose, user, setUser}) => {
  const [error, setError] = useState(null);
  const [showGymCreation, setShowGymCreation] = useState(false);
  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    fitness_goals: user?.fitness_goals || '',
    training_level: user?.training_level || 'beginner',
    personality_type: user?.personality_type || 'casual',
    preferred_gym: user?.preferred_gym || ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "/api/placeholder/120/120");
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGyms = async () => {
      try {
        const response = await api.get('/gyms/');
        setGyms(response.data.results || []);
      } catch (error) {
        console.error('Error fetching gyms:', error);
      }
    };
    fetchGyms();
  }, []);

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
    setLoading(true);
    
    try {
      // Create FormData object
      const profileData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          profileData.append(key, formData[key]);
        }
      });
      
      // Add avatar if a new one was selected
      if (avatarFile) {
        profileData.append('avatar', avatarFile);
      }

      const response = await api.patch('/users/me/', profileData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update the global user state with the new data
      setUser(response.data);
      
      // Clear any existing error states
      setError(null);
      
      // Close the modal
      onClose();
      
      // Show success message
      if (typeof window.toast === 'function') {
        window.toast.success('Profile updated successfully');
      }
      
    } catch (error) {
      // Handle different types of errors
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error.response) {
        if (error.response.status === 413) {
          errorMessage = 'The uploaded file is too large.';
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        }
      }
      
      console.error('Profile update error:', error);
      setError(errorMessage);
      
      if (typeof window.toast === 'function') {
        window.toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold mb-6">Edit Profile</h2>
        
        <form 
          className="space-y-4" 
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSaveProfile(e);
          }}>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img
                src={avatarPreview}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-700"
              />
              <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Fitness Goals</label>
            <textarea
              value={formData.fitness_goals}
              onChange={(e) => setFormData({...formData, fitness_goals: e.target.value})}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 h-24"
              placeholder="What are your fitness goals? (e.g., muscle building, weight loss, endurance)"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Preferred Gym</label>
            <div className="flex gap-2">
              <select
                value={formData.preferred_gym}
                onChange={(e) => setFormData({...formData, preferred_gym: e.target.value})}
                className="flex-1 bg-gray-700 rounded-lg px-4 py-2"
              >
                <option value="">Select a gym</option>
                {gyms.map((gym) => (
                  <option key={gym.id} value={gym.id}>
                    {gym.name} - {gym.location}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowGymCreation(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
              >
                Add Gym
              </button>
            </div>
            {showGymCreation && (
              <div className="mt-4">
                <GymCreationCard
                  onClose={() => setShowGymCreation(false)}
                  onGymCreated={async (newGym) => {
                    try {
                      // Update gyms list with the new gym
                      setGyms(prevGyms => [...prevGyms, newGym]);
                      
                      // Update form data with the new gym ID
                      setFormData(prevData => ({
                        ...prevData,
                        preferred_gym: newGym.id.toString()
                      }));
                      
                      // Hide the gym creation card
                      setShowGymCreation(false);

                      // Show success message if toast is available
                      if (typeof window.toast === 'function') {
                        window.toast.success('Gym created successfully');
                      }
                    } catch (error) {
                      console.error('Error handling new gym:', error);
                      if (typeof window.toast === 'function') {
                        window.toast.error('Error updating gym selection');
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Training Level</label>
            <select
              value={formData.training_level}
              onChange={(e) => setFormData({...formData, training_level: e.target.value})}
              className="w-full bg-gray-700 rounded-lg px-4 py-2"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Personality Type</label>
            <select
              value={formData.personality_type}
              onChange={(e) => setFormData({...formData, personality_type: e.target.value})}
              className="w-full bg-gray-700 rounded-lg px-4 py-2"
            >
              <option value="casual">Casual</option>
              <option value="lone_wolf">Lone Wolf</option>
              <option value="extrovert_bro">Extrovert Bro</option>
              <option value="competitor">Competitor</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-2 mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;