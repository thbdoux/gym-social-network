import React, { useState } from 'react';
import { X, Save, MapPin } from 'lucide-react';
import { useCreateGym } from '../../../hooks/query';

const GymCreationCard = ({ onClose, onGymCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    opening_hours: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '22:00' },
      saturday: { open: '08:00', close: '20:00' },
      sunday: { open: '08:00', close: '20:00' }
    }
  });
  const [error, setError] = useState(null);
  
  // Use React Query mutation hook for creating a gym
  const createGymMutation = useCreateGym();

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event propagation
    setError(null);

    try {
      const newGym = await createGymMutation.mutateAsync(formData);
      if (newGym) {
        // Make sure we pass the new gym data in the correct format
        await onGymCreated(newGym);
      }
    } catch (error) {
      console.error('Gym creation error:', error);
      setError(error.response?.data?.detail || 'Failed to create gym');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Add New Gym</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Gym Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-gray-700 rounded-lg px-4 py-2"
            placeholder="Enter gym name"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Location</label>
          <div className="relative">
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2"
              placeholder="Enter gym location"
              required
            />
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-gray-700 rounded-lg px-4 py-2 h-20"
            placeholder="Describe the gym (equipment, amenities, etc.)"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={createGymMutation.isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-2 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {createGymMutation.isLoading ? 'Creating...' : 'Create Gym'}
        </button>
      </form>
    </div>
  );
};

export default GymCreationCard;