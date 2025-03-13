import React, { useState } from 'react';
import { Plus, ArrowLeft, XCircle, Check, Dumbbell, Clock, Flame, Search } from 'lucide-react';

// Simple custom alert component
const ErrorAlert = ({ message, onClose }) => (
  <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg flex justify-between items-center">
    <span>{message}</span>
    <button 
      onClick={onClose}
      className="ml-4 text-red-200 hover:text-red-100"
    >
      <XCircle className="w-5 h-5" />
    </button>
  </div>
);

const DuplicateWarningDialog = ({ isOpen, onConfirm, onCancel, templateName }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4">
          Add Duplicate Workout
        </h3>
        <p className="text-gray-300 mb-6">
          "{templateName}" is already in this program. Adding it again will let you schedule the same workout multiple times per week.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

const WeekdaySelector = ({ onSelect, onCancel }) => {
  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  return (
    <div className="flex flex-col space-y-2 mt-2">
      <div className="text-sm text-gray-300 mb-1">Select day for workout:</div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day, index) => (
          <button
            key={day}
            onClick={() => onSelect(index)}
            className="p-2 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/30 rounded 
                     text-center transition-colors text-blue-300 hover:text-blue-200"
          >
            <span className="text-xs font-medium">{day.slice(0, 3)}</span>
          </button>
        ))}
      </div>
      <button
        onClick={onCancel}
        className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors text-sm"
      >
        Cancel
      </button>
    </div>
  );
};

// Get difficulty indicator
const getDifficultyIndicator = (level) => {
  switch(level?.toLowerCase()) {
    case 'beginner': return { icon: '🔰', color: 'text-green-400 bg-green-900/30' };
    case 'intermediate': return { icon: '⚡', color: 'text-yellow-400 bg-yellow-900/30' };
    case 'advanced': return { icon: '💪', color: 'text-orange-400 bg-orange-900/30' };
    case 'expert': return { icon: '🏆', color: 'text-red-400 bg-red-900/30' };
    default: return { icon: '✓', color: 'text-blue-400 bg-blue-900/30' };
  }
};

const WorkoutTemplateCard = ({ template, onAddClick, isSelecting, onWeekdaySelect, onCancelSelect }) => {
  const difficulty = getDifficultyIndicator(template.difficulty_level);
  
  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-xl overflow-hidden hover:border-gray-600/50 transition-all duration-300">
      <div className="p-4">
        <div className="flex justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-900/30 mr-3">
                <Dumbbell className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white">{template.name}</h4>
                <p className="text-sm text-gray-400 capitalize">{template.split_method?.replace(/_/g, ' ')}</p>
              </div>
            </div>
            
            {template.description && (
              <p className="text-sm text-gray-400 mt-2 line-clamp-2">{template.description}</p>
            )}
          </div>
          
          {!isSelecting ? (
            <button
              onClick={() => onAddClick(template)}
              className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          ) : null}
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-gray-800/60 rounded-lg p-2 border border-gray-700/30">
            <div className="flex items-center text-xs text-gray-400 mb-1">
              <Dumbbell className="w-3 h-3 mr-1 text-blue-400" />
              <span>Exercises</span>
            </div>
            <p className="font-medium text-white">{template.exercises?.length || 0}</p>
          </div>
          
          <div className="bg-gray-800/60 rounded-lg p-2 border border-gray-700/30">
            <div className="flex items-center text-xs text-gray-400 mb-1">
              <Clock className="w-3 h-3 mr-1 text-blue-400" />
              <span>Duration</span>
            </div>
            <p className="font-medium text-white">{template.estimated_duration || "--"} <span className="text-xs">min</span></p>
          </div>
          
          <div className="bg-gray-800/60 rounded-lg p-2 border border-gray-700/30">
            <div className="flex items-center text-xs text-gray-400 mb-1">
              <Flame className="w-3 h-3 mr-1 text-blue-400" />
              <span>Level</span>
            </div>
            <div className="flex items-center">
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${difficulty.color}`}>{difficulty.icon}</span>
              <span className="text-xs text-white ml-1 capitalize">{template.difficulty_level || "All"}</span>
            </div>
          </div>
        </div>
        
        {isSelecting && (
          <WeekdaySelector
            onSelect={onWeekdaySelect}
            onCancel={onCancelSelect}
          />
        )}
      </div>
    </div>
  );
};

const TemplateSelector = ({ 
  templates, 
  onSelect, 
  onCreateNew,
  onBack,
  currentProgramWorkouts,
}) => {
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectingDayFor, setSelectingDayFor] = useState(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'strength' && template.split_method?.includes('strength')) return matchesSearch;
    if (activeFilter === 'upper' && template.split_method?.includes('upper')) return matchesSearch;
    if (activeFilter === 'lower' && template.split_method?.includes('lower')) return matchesSearch;
    if (activeFilter === 'full' && template.split_method?.includes('full')) return matchesSearch;
    
    return false;
  });

  const handleTemplateClick = (template) => {
    // Check if template is already in program
    const isDuplicate = currentProgramWorkouts?.some(
      workout => workout.id === template.id
    );

    if (isDuplicate) {
      setSelectedTemplate(template);
      setShowDuplicateWarning(true);
    } else {
      setSelectingDayFor(template);
    }
  };

  const handleDaySelect = (day) => {
    if (!selectingDayFor) return;
    
    try {
      // Pass both the template ID and the selected day to the parent component
      onSelect(selectingDayFor.id, day);
      setSelectingDayFor(null);
    } catch (err) {
      setError('Failed to add workout to program');
    }
  };

  const handleConfirmDuplicate = () => {
    setShowDuplicateWarning(false);
    if (selectedTemplate) {
      setSelectingDayFor(selectedTemplate);
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h3 className="text-lg font-medium text-white">Add Workout to Program</h3>
        </div>
        <button
          type="button"
          onClick={onCreateNew}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
        >
          Create New
        </button>
      </div>

      {error && (
        <ErrorAlert 
          message={error} 
          onClose={() => setError('')}
        />
      )}
      
      {/* Search and filter bar */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search workouts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        
        <div className="flex space-x-1">
          {[
            {id: 'all', label: 'All'},
            {id: 'strength', label: 'Strength'},
            {id: 'upper', label: 'Upper'},
            {id: 'lower', label: 'Lower'},
            {id: 'full', label: 'Full Body'}
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeFilter === filter.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {filteredTemplates.map(template => (
          <WorkoutTemplateCard
            key={template.id}
            template={template}
            onAddClick={handleTemplateClick}
            isSelecting={selectingDayFor?.id === template.id}
            onWeekdaySelect={(day) => handleDaySelect(day)}
            onCancelSelect={() => setSelectingDayFor(null)}
          />
        ))}
        
        {filteredTemplates.length === 0 && (
          <div className="col-span-full text-center py-10 bg-gray-800/40 rounded-xl border border-dashed border-gray-700">
            <Dumbbell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-400">No workouts found</h4>
            <p className="text-gray-500 mt-2">Try different search terms or create a new workout</p>
            <button
              onClick={onCreateNew}
              className="mt-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Workout
            </button>
          </div>
        )}
      </div>

      <DuplicateWarningDialog
        isOpen={showDuplicateWarning}
        onConfirm={handleConfirmDuplicate}
        onCancel={() => {
          setShowDuplicateWarning(false);
          setSelectedTemplate(null);
        }}
        templateName={selectedTemplate?.name}
      />
    </div>
  );
};

export default TemplateSelector;