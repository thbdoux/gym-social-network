import React, { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { gymService } from '../../../api/services';

const EQUIPMENT_TYPES = [
  { value: 'cardio', label: 'Cardio Equipment' },
  { value: 'weights', label: 'Free Weights' },
  { value: 'machines', label: 'Weight Machines' },
  { value: 'functional', label: 'Functional Training' },
  { value: 'crossfit', label: 'CrossFit Equipment' }
];

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const COMMON_AMENITIES = ['24/7', 'Cardio Area', 'Free Weights', 'Showers', 'Lockers', 'Parking'];

export const AddGymModal = ({ onClose, onSuccess }) => {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    amenities: {},
    equipment: {},
    opening_hours: {},
    photos: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Only include advanced fields if in advanced mode
      const apiData = {
        name: formData.name,
        location: formData.location
      };
  
      if (isAdvancedMode) {
        // Add optional fields if they have values
        if (formData.description) apiData.description = formData.description;
        
        // Convert amenities to array
        const amenitiesArray = Object.entries(formData.amenities)
          .filter(([_, enabled]) => enabled)
          .map(([name]) => name);
        if (amenitiesArray.length > 0) apiData.amenities = amenitiesArray;
  
        // Convert equipment to array
        const equipmentArray = Object.entries(formData.equipment)
          .filter(([_, enabled]) => enabled)
          .map(([type]) => type);
        if (equipmentArray.length > 0) apiData.equipment = equipmentArray;
  
        // Add opening hours if any are set
        if (Object.keys(formData.opening_hours).length > 0) {
          apiData.opening_hours = formData.opening_hours;
        }
      }
  
      // Use gymService instead of direct API call
      const createdGym = await gymService.createGym(apiData);
      onSuccess(createdGym);
      onClose();
    } catch (error) {
      console.error('Error creating gym:', error.response?.data || error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);  // Always reset loading state
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Add New Gym</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 p-2 hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-76px)]">
          {/* Mode Toggle */}
          <div className="flex justify-end">
            <label className="inline-flex items-center cursor-pointer">
              <span className="mr-3 text-sm text-gray-400">
                {isAdvancedMode ? 'Advanced Mode' : 'Simple Mode'}
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isAdvancedMode}
                  onChange={(e) => setIsAdvancedMode(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full border border-gray-600"></div>
                <div className={`absolute left-1 top-1 bg-blue-600 w-4 h-4 rounded-full transition-transform transform ${isAdvancedMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </label>
          </div>

          {/* Basic Fields */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-400">Gym Name*</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
                placeholder="e.g. Fitness Park"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400">Location*</label>
              <input
                required
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
                placeholder="e.g. Boulogne"
              />
            </div>
          </div>

          {/* Advanced Fields */}
          {isAdvancedMode && (
            <>
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
                  rows={3}
                  placeholder="Brief description of the gym..."
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Equipment</label>
                <div className="grid grid-cols-2 gap-2">
                  {EQUIPMENT_TYPES.map(({ value, label }) => (
                    <label key={value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.equipment[value] || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          equipment: {
                            ...prev.equipment,
                            [value]: e.target.checked
                          }
                        }))}
                        className="rounded border-gray-600 bg-gray-700 text-blue-600"
                      />
                      <span className="text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Amenities</label>
                <div className="grid grid-cols-3 gap-2">
                  {COMMON_AMENITIES.map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.amenities[amenity] || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          amenities: {
                            ...prev.amenities,
                            [amenity]: e.target.checked
                          }
                        }))}
                        className="rounded border-gray-600 bg-gray-700 text-blue-600"
                      />
                      <span className="text-gray-300">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Gym</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const GymSelect = ({ 
  value, 
  onChange, 
  gyms, 
  loading, 
  error, 
  onAddGym 
}) => {
  const selectedValue = value?.toString() || '';
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-sm text-gray-400">Gym (optional)</label>
        <button
          type="button"
          onClick={onAddGym}
          className="text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-400/10 rounded-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {loading ? (
        <div className="flex items-center space-x-2 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading gyms...</span>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400">
          {error}
        </div>
      ) : (
        <select
          value={value || ''}
          onChange={onChange}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="">Select Gym</option>
          {gyms.map((gym) => (
            <option key={gym.id} value={gym.id}>
              {gym.name} - {gym.location}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};