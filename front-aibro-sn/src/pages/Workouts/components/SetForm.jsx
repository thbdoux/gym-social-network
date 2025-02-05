// SetForm.jsx
import React from 'react';
import { Trash2 } from 'lucide-react';

const SetForm = ({ set, onUpdate, onDelete }) => {
  return (
    <div className="grid grid-cols-4 gap-4 items-center bg-gray-800/50 p-3 rounded-lg">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Reps *</label>
        <input
          type="number"
          value={set.reps}
          onChange={(e) => onUpdate('reps', e.target.value)}
          className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white"
          required
          min="1"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Weight (kg)</label>
        <input
          type="number"
          value={set.weight}
          onChange={(e) => onUpdate('weight', e.target.value)}
          className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white"
          min="0"
          step="0.5"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Rest (sec)</label>
        <input
          type="number"
          value={set.rest_time}
          onChange={(e) => onUpdate('rest_time', e.target.value)}
          className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white"
          min="0"
          step="5"
        />
      </div>
      <div className="flex justify-end items-end h-full">
        <button
          type="button"
          onClick={onDelete}
          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SetForm;