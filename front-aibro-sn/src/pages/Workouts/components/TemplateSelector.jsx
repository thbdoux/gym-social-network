import React, { useState } from 'react';
import { Plus, Copy, Trash2, ChevronDown, ChevronUp, XCircle,ArrowLeft } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
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
    <div className="mt-2 flex items-center space-x-2">
      <select
        onChange={(e) => onSelect(parseInt(e.target.value))}
        className="bg-gray-700 text-white rounded px-3 py-2 flex-1"
        defaultValue=""
      >
        <option value="" disabled>Select Day</option>
        {WEEKDAYS.map((day, index) => (
          <option key={day} value={index}>{day}</option>
        ))}
      </select>
      <button
        onClick={onCancel}
        className="px-3 py-2 bg-gray-600 rounded hover:bg-gray-500 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
};

const TemplateSelector = ({ 
  templates, 
  onSelect, 
  onCancel, 
  onCreateNew,
  currentProgramWorkouts,
  onBack,
  onError 
}) => {
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectingDayFor, setSelectingDayFor] = useState(null);
  const [error, setError] = useState('');

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
      if (onError) {
        onError('Failed to add workout to program');
      }
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
    <div className="space-y-6 bg-gray-800 p-6 rounded-lg">
      <div className="flex justify-between items-center">
      <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <h3 className="text-lg font-medium text-white">Select Existing Workout</h3>
        </div>
        <button
          type="button"
          onClick={onCreateNew}  // Changed from onCancel to onCreateNew
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Instead
        </button>
      </div>


      {error && (
        <ErrorAlert 
          message={error} 
          onClose={() => setError('')}
        />
      )}

      <div className="space-y-4">
        {templates.map(template => (
          <div 
            key={template.id} 
            className="bg-gray-700 p-4 rounded-lg"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white">{template.name}</h4>
                <p className="text-gray-400">{template.split_method.replace(/_/g, ' ')}</p>
                {template.description && (
                  <p className="text-gray-400 text-sm mt-1">{template.description}</p>
                )}
                {template.creator_username && (
                  <p className="text-sm text-gray-500 mt-1">
                    Created by: {template.creator_username}
                  </p>
                )}
              </div>
              
              {selectingDayFor?.id === template.id ? (
                <WeekdaySelector
                  onSelect={(day) => handleDaySelect(day)}
                  onCancel={() => setSelectingDayFor(null)}
                />
              ) : (
                <button
                  onClick={() => handleTemplateClick(template)}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                >
                  Add to Program
                </button>
              )}
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No workout templates available
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