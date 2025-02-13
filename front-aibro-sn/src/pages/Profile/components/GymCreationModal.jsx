import React, { useState } from 'react';
import { X, Save, MapPin } from 'lucide-react';
import api from '../../../api';

const GymCreationModal = ({ isOpen, onClose, onGymCreated }) => {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/gyms/', formData);
      if (response.data) {
        onGymCreated(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Gym creation error:', error);
      setError(error.response?.data?.detail || 'Failed to create gym');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-6">Add New Gym</h2>

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
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Gym'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GymCreationModal;