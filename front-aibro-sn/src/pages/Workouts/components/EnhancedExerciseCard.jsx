import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Copy, Trash2, ChevronDown, ChevronUp, 
  Dumbbell, MoreHorizontal, X, Zap, CheckCircle 
} from 'lucide-react';

const EQUIPMENT_OPTIONS = [
  'Dumbbells', 'Barbell', 'Machine', 'Bodyweight', 
  'Smith Machine', 'Cables', 'Kettlebell', 
  'Resistance Bands', 'Other'
];

// Default rest time
const DEFAULT_REST_TIME = 60;

const EnhancedExerciseCard = ({ 
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
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const cardRef = useRef(null);
  
  const colors = {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30'
  };
  
  useEffect(() => {
    // Auto-scroll to newly added exercise if it's expanded
    if (isExpanded && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isExpanded]);
  
  const applyPresetSets = (preset) => {
    let sets = [];
    
    switch(preset) {
      case '5x5':
        sets = Array(5).fill().map((_, index) => ({
          id: Date.now() + index,
          reps: 5,
          weight: exercise.sets[0]?.weight || 0,
          rest_time: DEFAULT_REST_TIME,
          order: index
        }));
        break;
      case '3x8':
        sets = Array(3).fill().map((_, index) => ({
          id: Date.now() + index,
          reps: 8,
          weight: exercise.sets[0]?.weight || 0,
          rest_time: DEFAULT_REST_TIME,
          order: index
        }));
        break;
      case '4x8':
        sets = Array(4).fill().map((_, index) => ({
          id: Date.now() + index,
          reps: 8,
          weight: exercise.sets[0]?.weight || 0,
          rest_time: DEFAULT_REST_TIME,
          order: index
        }));
        break;
      case '4xPyramid':
        sets = Array(4).fill().map((_, index) => ({
          id: Date.now() + index,
          reps: [12, 10, 8, 6][index],
          weight: exercise.sets[0]?.weight || 0,
          rest_time: DEFAULT_REST_TIME,
          order: index
        }));
        break;
    }
    
    // Update all sets
    sets.forEach((set, setIndex) => {
      if (setIndex < exercise.sets.length) {
        // Update existing sets
        onUpdateSet(index, setIndex, 'reps', set.reps);
        onUpdateSet(index, setIndex, 'rest_time', set.rest_time);
      } else {
        // Add new sets if needed
        onAddSet(index);
      }
    });
    
    // Remove extra sets if needed
    if (exercise.sets.length > sets.length) {
      for (let i = exercise.sets.length - 1; i >= sets.length; i--) {
        onRemoveSet(index, i);
      }
    }
    
    setShowSettings(false);
  };

  return (
    <div 
      ref={cardRef}
      className={`bg-gray-800/90 rounded-lg overflow-hidden border ${colors.border} hover:shadow-md transition-all ${isExpanded ? 'mb-4' : 'mb-2'}`}
    >
      <div className="flex justify-between items-center p-3 cursor-pointer" onClick={() => onToggle(index)}>
        <div className="flex items-center flex-1">
          <div className={`${colors.bg} p-2 rounded-lg mr-3`}>
            <Dumbbell className={`w-4 h-4 ${colors.text}`} />
          </div>
          <div className="flex-1 min-w-0 relative">
            <div className="absolute inset-0 -mx-1 -my-1 bg-blue-500/10 -z-10 pointer-events-none rounded-md"></div>
            <input
              type="text"
              value={exercise.name}
              onChange={(e) => onUpdate(index, 'name', e.target.value)}
              placeholder={`Exercise ${index + 1}`}
              className="w-full bg-transparent border-none px-0 py-0 text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex text-xs text-gray-400 mt-0.5">
              <span>{exercise.equipment || 'No equipment'}</span>
              <span className="mx-1.5">•</span>
              <span>{exercise.sets.length} sets</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          {!isExpanded && exercise.sets.length > 0 && (
            <div className="mr-3 px-2 py-0.5 bg-blue-500/10 rounded text-xs text-blue-400 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              <span>{exercise.sets.length} sets</span>
            </div>
          )}
          
          <div className="flex">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
              }}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(index);
              }}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Exercise Settings Menu */}
          {showSettings && (
            <div className="absolute right-0 mt-8 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 w-48 py-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(false);
                  onDuplicate(index);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate Exercise
              </button>
              <div className="px-4 py-1 text-xs text-gray-500">Set Presets</div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  applyPresetSets('5x5');
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                5 x 5 reps
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  applyPresetSets('3x8');
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                3 x 8 reps
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  applyPresetSets('4x8');
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                4 x 8 reps
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  applyPresetSets('4xPyramid');
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                4 x 12/10/8/6 reps
              </button>
              <div className="border-t border-gray-700 my-1"></div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(false);
                  if (confirm('Delete this exercise?')) {
                    onDelete(index);
                  }
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Exercise
              </button>
            </div>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Equipment</label>
              <select
                value={exercise.equipment || ''}
                onChange={(e) => onUpdate(index, 'equipment', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm"
              >
                <option value="">Select Equipment</option>
                {EQUIPMENT_OPTIONS.map(eq => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>
            </div>
            
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={exercise.notes || ''}
                onChange={(e) => onUpdate(index, 'notes', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm"
                placeholder="Form cues, targets, etc."
              />
            </div>
          </div>
          
          <div className="mt-3">
            <div className="mb-2 flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-300">Sets</h4>
              <button
                type="button"
                onClick={() => onAddSet(index)}
                className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs rounded transition-colors flex items-center"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Set
              </button>
            </div>
            
            <div className="bg-gray-900/50 rounded-lg border border-gray-700/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/30 bg-gray-800/50">
                    <th className="py-2 pl-3 pr-1 text-left text-xs font-medium text-gray-400">#</th>
                    <th className="py-2 px-1 text-left text-xs font-medium text-gray-400">Weight</th>
                    <th className="py-2 px-1 text-left text-xs font-medium text-gray-400">Reps</th>
                    <th className="py-2 px-1 text-left text-xs font-medium text-gray-400">Rest</th>
                    <th className="py-2 px-1 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {exercise.sets.map((set, setIndex) => (
                    <tr key={set.id || setIndex} className="border-b border-gray-700/20 last:border-0 hover:bg-gray-800/30">
                      <td className="py-2 pl-3 pr-1 font-medium text-gray-400">{setIndex + 1}</td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          value={set.weight}
                          onChange={(e) => onUpdateSet(index, setIndex, 'weight', e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => onUpdateSet(index, setIndex, 'reps', e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          value={set.rest_time}
                          onChange={(e) => onUpdateSet(index, setIndex, 'rest_time', e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                        />
                      </td>
                      <td className="py-1 px-1 text-center">
                        {exercise.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onRemoveSet(index, setIndex)}
                            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedExerciseCard;