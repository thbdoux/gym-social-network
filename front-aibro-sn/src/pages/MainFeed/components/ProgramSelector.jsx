import React, { useState } from 'react';
import { Search, X, Dumbbell, Calendar, Target, Loader2, GitFork, Users, Clock, CheckCircle } from 'lucide-react';
import { usePrograms, useCurrentUser } from '../../../hooks/query';
import { useLanguage } from '../../../context/LanguageContext';

const ProgramSelector = ({ onSelect, onCancel, title, cancelText }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const { t } = useLanguage();
  
  // Use React Query hooks
  const { 
    data: allPrograms = [], 
    isLoading: programsLoading, 
    error: programsError 
  } = usePrograms();
  
  const { 
    data: currentUser, 
    isLoading: userLoading 
  } = useCurrentUser();
  
  // Filter programs to show only those created by the current user (not forked)
  const programs = allPrograms.filter(program => 
    program.creator_username === currentUser?.username
  );
  
  // Further filter based on search query
  const filteredPrograms = programs.filter(program => 
    program.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleProgramSelect = (programId) => {
    setSelectedProgramId(programId);
  };

  const handleConfirm = () => {
    if (selectedProgramId) {
      const selectedProgram = programs.find(program => program.id === selectedProgramId);
      onSelect(selectedProgram);
    }
  };
  
  const loading = programsLoading || userLoading;
  const error = programsError ? programsError.message : null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-900 rounded-xl w-full max-w-3xl overflow-hidden shadow-xl border border-gray-800">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
          <h3 className="text-xl font-semibold text-white">{title || t('select_program_to_share')}</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="p-5">
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-purple-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('search_programs')}
              className="w-full bg-gray-800/70 border border-gray-700 text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="bg-purple-900/30 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
              <p className="text-gray-400">{t('loading_programs')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-gray-800/30 rounded-xl border border-dashed border-red-700/50">
              <div className="bg-red-900/30 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <h4 className="text-lg font-medium text-white mb-2">{t('something_went_wrong')}</h4>
              <p className="text-red-400 max-w-md mx-auto">{error}</p>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-16 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
              <div className="bg-purple-900/30 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Dumbbell className="w-8 h-8 text-purple-400" />
              </div>
              <h4 className="text-lg font-medium text-white mb-2">
                {searchQuery ? t('no_matching_programs') : t('no_programs_created')}
              </h4>
              <p className="text-gray-400 max-w-md mx-auto">
                {searchQuery 
                  ? t('adjust_search_terms')
                  : t('create_program_first')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
              {filteredPrograms.map(program => {
                const isSelected = selectedProgramId === program.id;
                return (
                  <div
                    key={program.id}
                    onClick={() => handleProgramSelect(program.id)}
                    className={`
                      p-4 rounded-xl border overflow-hidden relative cursor-pointer transition-all duration-300
                      ${isSelected 
                        ? 'border-purple-500/50 bg-gradient-to-br from-purple-900/20 to-violet-800/20 transform scale-[1.02]' 
                        : 'border-gray-700 hover:border-gray-500 bg-gray-800/50 hover:scale-[1.02]'}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center mb-2">
                        <div className={`
                          p-2.5 rounded-lg mr-3 transition-all duration-300
                          ${isSelected 
                            ? 'bg-gradient-to-r from-purple-600 to-violet-600 shadow-lg' 
                            : 'bg-purple-900/30'}
                        `}>
                          <Dumbbell className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-purple-400'}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white flex items-center text-base">
                            <span className="truncate">{program.name}</span>
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-gray-700/50 text-purple-400 px-2 py-0.5 rounded-full">
                              {program.focus.replace(/_/g, ' ')}
                            </span>
                            {program.forked_from && (
                              <span className="text-xs bg-gray-700/50 text-gray-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <GitFork className="w-3 h-3" />
                                {t('forked')}
                              </span>
                            )}
                            {program.is_active && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                                {t('active')}
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
                    
                    {/* Description (limited to 2 lines) */}
                    <div className="mt-2 text-sm text-gray-400 line-clamp-2 bg-gray-800/50 p-2 rounded-lg">
                      {program.description || t('no_description')}
                    </div>
                    
                    {/* Program stats */}
                    <div className="grid grid-cols-2 gap-2 mt-3 bg-gray-800/70 p-2 rounded-lg">
                      <div className="flex items-center gap-2 p-1">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <div>
                          <span className="text-xs text-gray-500">{t('frequency')}</span>
                          <p className="text-sm font-medium text-white">
                            {program.sessions_per_week}x {t('weekly')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-1">
                        <Users className="w-4 h-4 text-purple-400" />
                        <div>
                          <span className="text-xs text-gray-500">{t('workouts')}</span>
                          <p className="text-sm font-medium text-white">
                            {program.workouts?.length || 0}
                          </p>
                        </div>
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
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-800 flex justify-between bg-gray-800/50">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {cancelText || t('cancel')}
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={!selectedProgramId}
            className={`
              px-6 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-2
              ${selectedProgramId 
                ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
            `}
          >
            <Dumbbell className="w-4 h-4" />
            {t('share_program')}
          </button>
        </div>
      </div>
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ProgramSelector;