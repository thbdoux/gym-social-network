
// src/pages/Workouts/components/ExerciseForm.jsx
import React from 'react';
import { ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react';

const EQUIPMENT_OPTIONS = [
  'Dumbbells',
  'Barbell',
  'Bodyweight',
  'Rings',
  'Machine',
  'Smith Machine',
  'Cables',
  'Kettlebell',
  'Resistance Bands',
  'Other'
];

const ExerciseForm = ({ 
  exercise, 
  onUpdate, 
  onDuplicate, 
  onDelete, 
  isExpanded, 
  onToggleExpand 
}) => {
  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <input
            type="text"
            value={exercise.name}
            onChange={(e) => onUpdate({ ...exercise, name: e.target.value })}
            placeholder="Exercise name"
            className="w-full p-2 rounded bg-gray-600 text-white border-gray-600"
          />
        </div>
        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => onDuplicate(exercise)}
            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
            title="Duplicate exercise"
          >
            <Copy className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(exercise.id)}
            className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-red-400"
            title="Delete exercise"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleExpand}
            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-300 mb-1">Equipment</label>
              <select
                value={exercise.equipment}
                onChange={(e) => onUpdate({ ...exercise, equipment: e.target.value })}
                className="w-full p-2 rounded bg-gray-600 text-white border-gray-600"
              >
                <option value="">Select equipment</option>
                {EQUIPMENT_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Type</label>
              <select
                value={exercise.type}
                onChange={(e) => onUpdate({ ...exercise, type: e.target.value })}
                className="w-full p-2 rounded bg-gray-600 text-white border-gray-600"
              >
                <option value="bilateral">Bilateral</option>
                <option value="unilateral">Unilateral</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Sets</label>
            {exercise.sets.map((set, index) => (
              <SetForm
                key={set.id}
                set={set}
                onUpdate={(updatedSet) => {
                  const newSets = [...exercise.sets];
                  newSets[index] = updatedSet;
                  onUpdate({ ...exercise, sets: newSets });
                }}
                onDuplicate={() => {
                  const newSet = { ...set, id: Date.now() };
                  onUpdate({
                    ...exercise,
                    sets: [...exercise.sets, newSet]
                  });
                }}
                onDelete={() => {
                  onUpdate({
                    ...exercise,
                    sets: exercise.sets.filter(s => s.id !== set.id)
                  });
                }}
              />
            ))}
            <button
              onClick={() => onUpdate({
                ...exercise,
                sets: [...exercise.sets, {
                  id: Date.now(),
                  reps: 0,
                  weight: 0,
                  rest_time: 60
                }]
              })}
              className="mt-2 px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Add Set
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SetForm = ({ set, onUpdate, onDuplicate, onDelete }) => {
  return (
    <div className="flex items-center space-x-2 mb-2">
      <div className="flex-1 grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-gray-400">Reps</label>
          <input
            type="number"
            value={set.reps}
            onChange={(e) => onUpdate({ ...set, reps: parseInt(e.target.value) })}
            className="w-full p-2 rounded bg-gray-600 text-white border-gray-600"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400">Weight (kg)</label>
          <input
            type="number"
            value={set.weight}
            onChange={(e) => onUpdate({ ...set, weight: parseInt(e.target.value) })}
            className="w-full p-2 rounded bg-gray-600 text-white border-gray-600"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400">Rest (sec)</label>
          <input
            type="number"
            value={set.rest_time}
            onChange={(e) => onUpdate({ ...set, rest_time: parseInt(e.target.value) })}
            className="w-full p-2 rounded bg-gray-600 text-white border-gray-600"
          />
        </div>
      </div>
      <div className="flex space-x-1 pt-5">
        <button
          onClick={onDuplicate}
          className="p-1 hover:bg-gray-600 rounded transition-colors"
          title="Duplicate set"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 hover:bg-gray-600 rounded transition-colors text-red-400"
          title="Delete set"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default { SetForm, ExerciseForm } ; 