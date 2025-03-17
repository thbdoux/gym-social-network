import React from 'react';
import { useLanguage } from '../../../../../context/LanguageContext';

const BasicInfoStep = ({ formData, updateFormData, errors }) => {
  const { t } = useLanguage();
  
  // Program name suggestions from translations
  const PROGRAM_SUGGESTIONS = [
    t('wizard_basic_info_suggestion_power'),
    t('wizard_basic_info_suggestion_shred'),
    t('wizard_basic_info_suggestion_strength')
  ];

  const handleSuggestionClick = (suggestion) => {
    updateFormData({ name: suggestion });
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <h2 className="text-2xl font-bold text-white text-center mb-8">
        {t('wizard_basic_info_title')}
      </h2>
      
      <input
        value={formData.name}
        onChange={(e) => updateFormData({ name: e.target.value })}
        className="w-full px-4 py-3 bg-gray-900 rounded-lg text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
        placeholder={t('wizard_basic_info_placeholder')}
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