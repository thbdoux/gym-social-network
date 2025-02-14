// ExerciseCard.jsx
import React from 'react';
import { Plus, Copy, Trash2, ChevronDown, ChevronUp, Dumbbell, ClipboardList } from 'lucide-react';
import SetForm from '../SetForm';

const EQUIPMENT_OPTIONS = [
  'Dumbbells',
  'Barbell',
  'Machine',
  'Bodyweight',
  'Smith Machine',
  'Cables',
  'Kettlebell',
  'Resistance Bands',
  'Other'
];

const ExerciseCard = ({ 
  exercise, 
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onDuplicate,
  onDelete,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  isEditing = true
}) => {

  
  return (
    <div className="bg-gray-800/50 rounded-xl overflow-hidden transition-all duration-300">
      <div className="p-4">
        {/* Exercise Header */}
        <div className="flex items-center space-x-4">
          <div className="bg-blue-500/20 p-2 rounded-lg">
            <Dumbbell className="w-6 h-6 text-blue-400" />
          </div>
          
          <input
            value={exercise.name}
            onChange={(e) => onUpdate(index, 'name', e.target.value)}
            placeholder="Exercise name *"
            className="flex-1 bg-transparent text-lg font-semibold text-white border-none focus:ring-2 focus:ring-blue-500/50 rounded-lg px-2 py-1"
            required
          />
          
          <div className="flex items-center space-x-2">
            {/* Removed duplicate button here */}
            <button
              type="button"
              onClick={() => onDelete(index)}
              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onToggle(index)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Equipment</label>
                <select
                  value={exercise.equipment}
                  onChange={(e) => onUpdate(index, 'equipment', e.target.value)}
                  className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white"
                >
                  <option value="">Select Equipment</option>
                  {EQUIPMENT_OPTIONS.map(eq => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <input
                  type="text"
                  value={exercise.notes || ''}
                  onChange={(e) => onUpdate(index, 'notes', e.target.value)}
                  placeholder="Optional notes"
                  className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white"
                />
              </div>
            </div>

            {/* Sets Section */}
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-white font-medium flex items-center">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Sets
                </h4>
                <button
                  type="button"
                  onClick={() => onAddSet(index)}
                  className="px-3 py-1.5 bg-blue-600 text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Set</span>
                </button>
              </div>

              <div className="space-y-3">
              {exercise.sets.map((set, setIndex) => (
                <SetForm
                  key={setIndex}
                  set={set}
                  setIndex={setIndex}  // Add this prop
                  onUpdate={(field, value) => {
                    console.log('Set update in ExerciseCard:', { setIndex, field, value }); // Debug log
                    onUpdateSet(setIndex, field, value);
                  }}
                  onDelete={() => {
                    console.log('Set delete in ExerciseCard:', { setIndex }); // Debug log
                    onRemoveSet(setIndex);
                  }}
                  isEditing={isEditing}
                />
              ))}
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseCard;