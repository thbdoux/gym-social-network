import React, { useState } from 'react';
import { Dumbbell, CheckCircle, ChevronDown, ChevronUp, Info, X } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';

// Import React Query hook
import { usePrograms } from '../../../../../hooks/query/useProgramQuery';

const ProgramSelectionStep = ({ formData, updateFormData, colors, programs: propPrograms = [], programsLoading, programsError }) => {
  const { t } = useLanguage();
  
  // Use React Query hook if not passed from props
  const { 
    data: queryPrograms = [], 
    isLoading: queryLoading, 
    error: queryError 
  } = usePrograms({
    // Only enable the query if programs weren't provided via props
    enabled: !propPrograms || propPrograms.length === 0
  });
  
  // Use prop programs if available, otherwise use query programs
  const programs = propPrograms.length > 0 ? propPrograms : queryPrograms;
  // Use prop loading state if available, otherwise use query loading state
  const loading = propPrograms.length > 0 ? programsLoading : queryLoading;
  // Use prop error if available, otherwise use query error
  const error = propPrograms.length > 0 ? programsError : queryError;
  
  const [selectedProgramId, setSelectedProgramId] = useState(formData.program || null);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  // Get active programs
  const activePrograms = programs.filter(program => program.is_active);

  // Handle program selection
  const handleProgramSelect = (programId) => {
    setSelectedProgramId(programId);
    updateFormData({ program: programId });
  };

  // Handle skip
  const handleSkip = () => {
    setSelectedProgramId(null);
    updateFormData({ program: null });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h3 className="text-xl font-bold text-center text-white mb-6">
        {t("program_selection_title")}
      </h3>

      {/* Info toggle */}
      <div 
        className="flex items-center justify-center mb-6 cursor-pointer text-sm"
        onClick={() => setShowMoreInfo(!showMoreInfo)}
      >
        <Info className="w-4 h-4 text-purple-400 mr-2" />
        <span className="text-gray-300">{t("program_selection_why")}</span>
        {showMoreInfo ? 
          <ChevronUp className="w-4 h-4 text-gray-300 ml-1" /> : 
          <ChevronDown className="w-4 h-4 text-gray-300 ml-1" />
        }
      </div>

      {/* Info box (collapsible) */}
      {showMoreInfo && (
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 mb-6 animate-fadeIn">
          <p className="text-gray-300 text-sm">
            {t("program_selection_info")}
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-lg">
          {error?.message || t("failed_load_programs")}
        </div>
      )}

      {/* No programs state */}
      {!loading && activePrograms.length === 0 && (
        <div className="bg-gray-800/50 rounded-xl p-8 text-center border border-dashed border-gray-700">
          <div className="bg-purple-900/30 rounded-full p-3 w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <Dumbbell className="w-7 h-7 text-purple-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">{t("no_active_programs")}</h3>
          <p className="text-gray-400 mb-4">
            {t("no_active_programs_description")}
          </p>
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors inline-flex items-center"
          >
            {t("continue_without_program")}
          </button>
        </div>
      )}

      {/* Programs grid - new grid layout */}
      {!loading && activePrograms.length > 0 && (
        <div className="space-y-6">
          {/* Grid layout for program selections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePrograms.map(program => {
              const isSelected = selectedProgramId === program.id;
              return (
                <div
                  key={program.id}
                  onClick={() => handleProgramSelect(program.id)}
                  className={`
                    p-4 rounded-xl border overflow-hidden relative cursor-pointer transition-all duration-300
                    ${isSelected 
                      ? 'border-purple-500/50 bg-gradient-to-br from-purple-900/20 to-violet-800/20' 
                      : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}
                    transform hover:scale-[1.02] h-full flex flex-col
                  `}
                >
                  <div className="flex items-start justify-between h-full">
                    {/* Program info */}
                    <div className="flex flex-col h-full">
                      <div className="flex items-center mb-2">
                        <div className={`
                          p-2.5 rounded-lg mr-3 transition-all duration-300 flex-shrink-0
                          ${isSelected 
                            ? 'bg-gradient-to-r from-purple-600 to-violet-600 shadow-lg' 
                            : 'bg-gray-800'}
                        `}>
                          <Dumbbell className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-purple-400'}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white flex items-center text-lg">
                            <span className="truncate">{program.name}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-end">
                        <div className="flex items-center justify-between mt-auto">
                          <div className="text-xs text-gray-400">
                            {program.workouts?.length || 0} {t("workouts")}
                          </div>
                          
                          <div className="text-xs text-gray-400">
                            {program.sessions_per_week}x/{t("weekly")}
                          </div>
                          
                          {program.is_active && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                              {t("active")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Selection indicator */}
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0
                      ${isSelected ? 'bg-gradient-to-r from-purple-500 to-violet-500' : 'bg-gray-700'}
                    `}>
                      {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                  
                  {/* Bottom gradient bar for selected item */}
                  {isSelected && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Skip button */}
          <div className="mt-6">
            <button
              onClick={handleSkip}
              className={`
                w-full px-4 py-3 rounded-xl border transition-all
                ${selectedProgramId === null 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/50 text-white' 
                  : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white'}
                flex items-center justify-center
              `}
            >
              <X className="w-5 h-5 mr-2" />
              {t("skip_program_selection")}
              {selectedProgramId === null && (
                <CheckCircle className="w-4 h-4 ml-2 text-purple-400" />
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ProgramSelectionStep;