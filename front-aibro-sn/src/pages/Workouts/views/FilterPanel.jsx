import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// Filter panel component
const FilterPanel = ({ filters, setFilters, programs, onClearFilters, isOpen, onClose }) => {
  const [localFilters, setLocalFilters] = useState({ ...filters });
  
  // Reset local filters when panel opens
  useEffect(() => {
    setLocalFilters({ ...filters });
  }, [filters, isOpen]);
  
  const handleApplyFilters = () => {
    setFilters(localFilters);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex justify-end">
      <div className="bg-gray-800 h-full w-full max-w-md overflow-y-auto p-6 animate-slide-in-right">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Date range filter */}
          <div>
            <h3 className="text-white font-medium mb-2">Date Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">From</label>
                <input
                  type="date"
                  value={localFilters.startDate || ''}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    startDate: e.target.value
                  })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">To</label>
                <input
                  type="date"
                  value={localFilters.endDate || ''}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    endDate: e.target.value
                  })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                />
              </div>
            </div>
          </div>
          
          {/* Program filter */}
          <div>
            <h3 className="text-white font-medium mb-2">Program</h3>
            <select
              value={localFilters.program || ''}
              onChange={(e) => setLocalFilters({
                ...localFilters,
                program: e.target.value
              })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
            >
              <option value="">All Programs</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Completion status */}
          <div>
            <h3 className="text-white font-medium mb-2">Status</h3>
            <div className="flex">
              <button
                className={`flex-1 py-2 px-4 rounded-l-lg ${
                  localFilters.completed === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
                onClick={() => setLocalFilters({
                  ...localFilters,
                  completed: null
                })}
              >
                All
              </button>
              <button
                className={`flex-1 py-2 px-4 ${
                  localFilters.completed === true
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
                onClick={() => setLocalFilters({
                  ...localFilters,
                  completed: true
                })}
              >
                Completed
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-r-lg ${
                  localFilters.completed === false
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
                onClick={() => setLocalFilters({
                  ...localFilters,
                  completed: false
                })}
              >
                In Progress
              </button>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-between pt-4 mt-6 border-t border-gray-700">
            <button
              onClick={() => {
                setLocalFilters({
                  program: null,
                  startDate: null,
                  endDate: null,
                  completed: null
                });
                onClearFilters();
                onClose();
              }}
              className="px-4 py-2 text-gray-400 hover:text-gray-300"
            >
              Clear All
            </button>
            
            <button
              onClick={handleApplyFilters}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;