import React from 'react';
import { Search, Filter } from 'lucide-react';

export const FilterBar = ({ onSearch, onFilter, filters = {} }) => {
  return (
    <div className="flex items-center space-x-4 py-2">
      {/* Search Bar */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search plans..."
          onChange={(e) => onSearch?.(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800/40 border border-gray-700 
                   rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                   focus:border-transparent text-white placeholder-gray-400"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center space-x-2">
        <FilterButton
          label="Focus"
          options={['Strength', 'Hypertrophy', 'Endurance']}
          value={filters.focus}
          onChange={(value) => onFilter?.('focus', value)}
        />
        <FilterButton
          label="Duration"
          options={['4 weeks', '8 weeks', '12 weeks']}
          value={filters.duration}
          onChange={(value) => onFilter?.('duration', value)}
        />
        <FilterButton
          label="Level"
          options={['Beginner', 'Intermediate', 'Advanced']}
          value={filters.level}
          onChange={(value) => onFilter?.('level', value)}
        />
      </div>
    </div>
  );
};

const FilterButton = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-gray-800/40 border border-gray-700 rounded-lg 
                 hover:bg-gray-700/40 transition-colors flex items-center space-x-2"
      >
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-gray-300">{label}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-48 bg-gray-800 border 
                      border-gray-700 rounded-lg shadow-xl z-10">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-700/40 
                          transition-colors ${
                            value === option ? 'text-blue-400' : 'text-gray-300'
                          }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;