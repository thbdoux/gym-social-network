import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Copy, Trash2, ChevronDown, ChevronUp, 
  Dumbbell, MoreHorizontal, X, Zap, CheckCircle,
  Clipboard, Settings
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
  const settingsRef = useRef(null);
  const cardRef = useRef(null);
  
  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);
  
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
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-750"
    >
      {/* Exercise Header - Cleaner and more intuitive */}
      <div 
        className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        onClick={() => onToggle(index)}
      >
        <div className="flex items-center flex-1 min-w-0">
          {/* Exercise Number */}
          <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium mr-2 flex-shrink-0">
            {index + 1}
          </div>
          
          {/* Exercise Name Input */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={exercise.name}
              onChange={(e) => onUpdate(index, 'name', e.target.value)}
              placeholder={`Exercise ${index + 1}`}
              className="w-full bg-transparent border-0 border-b border-transparent hover:border-gray-200 dark:hover:border-gray-700 px-0 py-0.5 text-gray-900 dark:text-white text-sm font-medium focus:ring-0 focus:border-blue-500 transition-colors"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Exercise Metadata */}
            <div className="flex text-xs text-gray-500 dark:text-gray-400 mt-0.5 items-center">
              {exercise.equipment && (
                <>
                  <Dumbbell className="w-3 h-3 mr-1" />
                  <span className="truncate">{exercise.equipment}</span>
                  <span className="mx-1.5">•</span>
                </>
              )}
              <span>{exercise.sets.length} {exercise.sets.length === 1 ? 'set' : 'sets'}</span>
            </div>
          </div>
        </div>
        
        {/* Status Indicator for Collapsed State */}
        {!isExpanded && exercise.sets.length > 0 && (
          <div className="mr-2 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-full text-xs text-blue-700 dark:text-blue-400 flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span>Ready</span>
          </div>
        )}
        
        {/* Controls */}
        <div className="flex">
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            {/* Exercise Settings Menu - More organized and clear */}
            {showSettings && (
              <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 w-48 py-1 overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Exercise Actions
                </div>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSettings(false);
                    onDuplicate(index);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Copy className="w-3.5 h-3.5 mr-2 text-gray-500 dark:text-gray-400" />
                  Duplicate Exercise
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this exercise?')) {
                      onDelete(index);
                    }
                    setShowSettings(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Delete Exercise
                </button>
                
                <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-750 border-t border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                  Quick Set Templates
                </div>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    applyPresetSets('5x5');
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Clipboard className="w-3.5 h-3.5 mr-2 text-blue-500" />
                  5 × 5 Strength
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    applyPresetSets('3x8');
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Clipboard className="w-3.5 h-3.5 mr-2 text-purple-500" />
                  3 × 8 Hypertrophy
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    applyPresetSets('4x8');
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Clipboard className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                  4 × 8 Volume
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    applyPresetSets('4xPyramid');
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Clipboard className="w-3.5 h-3.5 mr-2 text-green-500" />
                  Pyramid (12→10→8→6)
                </button>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(index);
            }}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Expanded Content - More organized and user-friendly */}
      {isExpanded && (
        <div className="px-3 pb-3 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
          {/* Exercise Configuration Fields - Simplified and more intuitive */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Equipment</label>
              <select
                value={exercise.equipment || ''}
                onChange={(e) => onUpdate(index, 'equipment', e.target.value)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1.5 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Equipment</option>
                {EQUIPMENT_OPTIONS.map(eq => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={exercise.notes || ''}
                onChange={(e) => onUpdate(index, 'notes', e.target.value)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1.5 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Form cues, targets, etc."
              />
            </div>
          </div>
          
          {/* Sets Section - Better organized */}
          <div className="mt-4">
            <div className="mb-2 flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sets</h4>
              <button
                type="button"
                onClick={() => onAddSet(index)}
                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs rounded-md transition-colors flex items-center"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Set
              </button>
            </div>
            
            {/* Sets Table - More readable and user-friendly */}
            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-600">
                    <th className="py-2 pl-3 pr-1 text-left text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
                    <th className="py-2 px-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Weight</th>
                    <th className="py-2 px-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Reps</th>
                    <th className="py-2 px-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Rest (s)</th>
                    <th className="py-2 px-1 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {exercise.sets.map((set, setIndex) => (
                    <tr key={set.id || setIndex} className="border-b border-gray-100 dark:border-gray-600 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-650">
                      <td className="py-2 pl-3 pr-1 font-medium text-gray-500 dark:text-gray-400">{setIndex + 1}</td>
                      <td className="py-1 px-1">
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) => onUpdateSet(index, setIndex, 'weight', e.target.value)}
                            className="w-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded px-2 py-1 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">kg</span>
                        </div>
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => onUpdateSet(index, setIndex, 'reps', e.target.value)}
                          className="w-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded px-2 py-1 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          value={set.rest_time}
                          onChange={(e) => onUpdateSet(index, setIndex, 'rest_time', e.target.value)}
                          className="w-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded px-2 py-1 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="py-1 px-1 text-center">
                        {exercise.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onRemoveSet(index, setIndex)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            aria-label="Remove set"
                          >
                            <X className="w-3.5 h-3.5" />
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