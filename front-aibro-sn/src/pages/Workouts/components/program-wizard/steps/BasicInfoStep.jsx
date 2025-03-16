import React from 'react';

const PROGRAM_SUGGESTIONS = [
  "Power Builder",
  "Summer Shred",
  "Strength Foundations"
];

const BasicInfoStep = ({ formData, updateFormData, errors }) => {
  const handleSuggestionClick = (suggestion) => {
    updateFormData({ name: suggestion });
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <h2 className="text-2xl font-bold text-white text-center mb-8">
        Name your program
      </h2>
      
      <input
        value={formData.name}
        onChange={(e) => updateFormData({ name: e.target.value })}
        className="w-full px-4 py-3 bg-gray-900 rounded-lg text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
        placeholder="e.g., 12-Week Strength Builder"
        required
      />
      
      {errors.name && (
        <p className="mt-2 text-sm text-red-400">{errors.name}</p>
      )}
      
      {/* Suggestion chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {PROGRAM_SUGGESTIONS.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full text-sm border border-gray-700 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BasicInfoStep;