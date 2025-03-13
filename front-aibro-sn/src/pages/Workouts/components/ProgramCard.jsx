import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, ChevronDown, ChevronUp, Calendar, Target, 
  Activity, GitFork, User, Clock, Users, Star, Trophy,
  Award, Layers, BarChart, Eye, Trash2, Edit, Share2,
  CheckCircle, ToggleLeft, ToggleRight, Loader2
} from 'lucide-react';
import { programService } from '../../../api/services';
import ExpandableProgramModal from './ExpandableProgramModal';
import { getPostTypeDetails } from '../../../utils/postTypeUtils';

const ProgramCard = ({ 
  // Core props
  programId,
  program: initialProgramData,
  singleColumn = false,
  currentUser,
  
  // Feed mode props
  inFeedMode = false,

  // Collection/Management mode props
  canManage = false,
  
  // Callbacks
  onProgramSelect,
  onDelete,
  onToggleActive,
  onShare,
  onFork,
  onEdit,
  onCreatePlan
}) => {
  const [program, setProgram] = useState(initialProgramData);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(!initialProgramData);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Empty state check - moved inside the component
  if (!program && !programId && onCreatePlan) {
    return <EmptyState onCreatePlan={onCreatePlan} />;
  }

  useEffect(() => {
    setProgram(initialProgramData);
  }, [initialProgramData]);

  useEffect(() => {
    const fetchProgramDetails = async () => {
      if (programId && !program) {
        try {
          setLoading(true);
          // Use programService instead of direct API call
          const fetchedProgram = await programService.getProgramById(programId);
          setProgram(fetchedProgram);
        } catch (err) {
          console.error('Error fetching program details:', err);
          setError('Failed to load program details');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProgramDetails();
  }, [programId, program]);

  if (loading) {
    return (
      <div className="mt-4 bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded-lg w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded-lg w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="h-20 bg-gray-700 rounded-lg"></div>
          <div className="h-20 bg-gray-700 rounded-lg"></div>
          <div className="h-20 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="mt-4 bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-xl">
        {error || "Unable to load program"}
      </div>
    );
  }
  
  // Check if the program was forked
  const isForked = !!program.forked_from;

  // Check if current user is the creator of the plan
  const isCreator = program.creator_username === currentUser;
  
  // Permission checks
  const canEditProgram = canManage && isCreator;
  const canShareProgram = canManage && isCreator;
  const canForkProgram = canManage && !isCreator;
  const canDeleteProgram = canManage && isCreator;
  
  // Now canToggleActive is always true if canManage is true (regardless of current active state)
  const canToggleActive = canManage;

  const getFocusIcon = (focus) => {
    switch(focus) {
      case 'strength': return <Trophy className="w-4 h-4 text-red-400" />;
      case 'hypertrophy': return <Layers className="w-4 h-4 text-purple-400" />;
      case 'endurance': return <Activity className="w-4 h-4 text-green-400" />;
      case 'weight_loss': return <Award className="w-4 h-4 text-blue-400" />;
      case 'strength_hypertrophy': return <Star className="w-4 h-4 text-indigo-400" />;
      default: return <Target className="w-4 h-4 text-blue-400" />;
    }
  };

  // Get difficulty label
  const getDifficultyLabel = (level) => {
    switch(level?.toLowerCase()) {
      case 'beginner': return { text: 'Beginner', icon: '🔰' };
      case 'intermediate': return { text: 'Intermediate', icon: '⚡' };
      case 'advanced': return { text: 'Advanced', icon: '💪' };
      case 'expert': return { text: 'Expert', icon: '🏆' };
      default: return { text: level || 'All Levels', icon: '✓' };
    }
  };

  const handleCardClick = (e) => {
    e.stopPropagation();
    setShowModal(true);
  };

  const handleExpandClick = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleButtonClick = (e, action) => {
    e.stopPropagation();
    action();
  };

  const handleToggleActive = async (e) => {
    e.stopPropagation();
    if (isToggling) return;
    
    try {
      setIsToggling(true);
      await onToggleActive?.(program.id);
    } catch (err) {
      console.error('Failed to toggle active state:', err);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <div 
        className={`mt-4 bg-gradient-to-br ${program.is_active ? 'from-purple-900/30 via-gray-800/95 to-gray-900/95 border-purple-500/50' : 'from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50'} border rounded-xl overflow-hidden transition-all duration-300 cursor-pointer transform ${isHovered ? 'shadow-md scale-[1.01]' : ''}`}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Status Indicator Line - Purple gradient for active, gray for inactive */}
        <div className={`h-1 w-full ${program.is_active ? 'bg-gradient-to-r from-violet-400 to-purple-500' : 'bg-gradient-to-r from-gray-600 to-gray-700'}`} />
        
        <div className="p-4">
          {/* Card Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 flex items-start">
              {/* Program Icon */}
              <div className={`p-2 ${program.is_active ? 'bg-purple-500/30' : 'bg-gray-700/30'} rounded-lg mr-3 flex-shrink-0`}>
                <Dumbbell className={`w-5 h-5 ${program.is_active ? 'text-purple-400' : 'text-gray-400'}`} />
              </div>
              
              <div className="min-w-0 overflow-hidden flex-grow">
                <div className="flex items-center">
                  <h4 className={`text-lg font-medium text-white transition-colors ${isHovered ? 'text-purple-300' : ''} truncate`}>
                    {program.name}
                  </h4>
                  
                  {isForked && (
                    <span className="ml-2 text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                      <GitFork className="w-3 h-3" />
                      <span className="hidden sm:inline">Forked</span>
                    </span>
                  )}
                  
                  {/* Active status badge */}
                  {program.is_active && (
                    <span className="ml-2 flex items-center text-xs text-green-400 flex-shrink-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Active</span>
                    </span>
                  )}
                </div>
                
                <div className="flex items-center mt-1 text-sm text-gray-400 truncate">
                  <User className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                  <span className="truncate">{program.creator_username}</span>
                </div>
              </div>
            </div>
            
            {/* Toggle Active button */}
            {canToggleActive && (
              <button
                onClick={handleToggleActive}
                disabled={isToggling}
                className={`p-1.5 mr-2 rounded-md transition-colors flex items-center ${
                  isToggling ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  program.is_active 
                    ? 'text-green-400 hover:text-green-300 hover:bg-green-900/20' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                }`}
                aria-label={program.is_active ? "Deactivate program" : "Set as active program"}
                title={program.is_active ? "Deactivate program" : "Set as active program"}
              >
                {isToggling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : program.is_active ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </button>
            )}
            
            {/* Action buttons - expand/collapse */}
            <div className="flex items-center flex-shrink-0">
              {/* Show management actions only if in management mode */}
              {canManage && (
                <div className={`flex items-center space-x-1 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 mr-2`}>
                  {canEditProgram && (
                    <button
                      onClick={(e) => handleButtonClick(e, () => onEdit?.(program))}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md transition-colors"
                      aria-label="Edit program"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  
                  {canShareProgram && (
                    <button
                      onClick={(e) => handleButtonClick(e, () => onShare?.(program))}
                      className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-900/20 rounded-md transition-colors"
                      aria-label="Share program"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  {canForkProgram && (
                    <button
                      onClick={(e) => handleButtonClick(e, () => onFork?.(program))}
                      className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-900/20 rounded-md transition-colors"
                      aria-label="Fork program"
                    >
                      <GitFork className="w-4 h-4" />
                    </button>
                  )}
                  
                  {canDeleteProgram && (
                    <button
                      onClick={(e) => handleButtonClick(e, () => {
                        if (window.confirm(`Are you sure you want to delete "${program.name}"?`)) {
                          onDelete?.(program.id);
                        }
                      })}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors"
                      aria-label="Delete program"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              
              <button
                onClick={handleExpandClick}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md transition-colors"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {/* Description - Show only if it exists and keep it brief */}
          {program.description && (
            <p className="mt-2 text-sm text-gray-300 line-clamp-2 hidden sm:block">{program.description}</p>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <div className="bg-gradient-to-br from-violet-900/20 to-violet-800/20 hover:from-violet-900/30 hover:to-violet-800/30 p-3 rounded-lg border border-violet-700/30 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center text-xs text-gray-400 mb-1">
                <Dumbbell className="w-3.5 h-3.5 mr-1 text-violet-400" />
                <span>Workouts</span>
              </div>
              <p className="font-semibold text-white">
                {program.workouts?.length || 0}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 hover:from-purple-900/30 hover:to-purple-800/30 p-3 rounded-lg border border-purple-700/30 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center text-xs text-gray-400 mb-1">
                <Calendar className="w-3.5 h-3.5 mr-1 text-purple-400" />
                <span>Days/Week</span>
              </div>
              <p className="font-semibold text-white">
                {program.sessions_per_week}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-900/20 to-indigo-800/20 hover:from-indigo-900/30 hover:to-indigo-800/30 p-3 rounded-lg border border-indigo-700/30 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center text-xs text-gray-400 mb-1">
                <Target className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                <span>Focus</span>
              </div>
              <div className="font-semibold text-white flex items-center justify-between">
                <span className="capitalize text-xs truncate">{program.focus?.split('_')[0] || 'General'}</span>
                {getFocusIcon(program.focus)}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-fuchsia-900/20 to-fuchsia-800/20 hover:from-fuchsia-900/30 hover:to-fuchsia-800/30 p-3 rounded-lg border border-fuchsia-700/30 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center text-xs text-gray-400 mb-1">
                <Users className="w-3.5 h-3.5 mr-1 text-fuchsia-400" />
                <span>Level</span>
              </div>
              <div className="font-semibold text-white flex items-center justify-between">
                <span className="text-xs truncate">{getDifficultyLabel(program.difficulty_level).text}</span>
                <span className="text-sm">{getDifficultyLabel(program.difficulty_level).icon}</span>
              </div>
            </div>
          </div>

          {/* Expanded View */}
          {isExpanded && (
            <div className="mt-4 space-y-4 animate-fadeIn">
              {/* Program Details Card */}
              <div className="bg-gray-800/70 p-3 rounded-lg border border-gray-700/50">
                <h5 className="font-medium text-gray-200 text-sm mb-2 flex items-center">
                  <BarChart className="w-4 h-4 mr-2 text-purple-400" />
                  Program Details
                </h5>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-400">Duration:</span>
                    <span className="ml-2 text-white">{program.estimated_completion_weeks} weeks</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400">Created:</span>
                    <span className="ml-2 text-white">{new Date(program.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Tags - Only show if they exist */}
                {program.tags && program.tags.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-400 mb-1">Tags:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {program.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-2 py-0.5 bg-purple-900/30 text-purple-400 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Workouts Summary */}
              {program.workouts && program.workouts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-200 text-sm flex items-center">
                      <Dumbbell className="w-4 h-4 mr-2 text-purple-400" />
                      Weekly Schedule
                    </h5>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {program.workouts.slice(0, 4).map((workout, index) => (
                      <div key={index} className="bg-gray-800/70 rounded-lg p-2 shadow-sm border border-gray-700/50 flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-900/30 text-purple-400 text-xs mr-2">
                            {workout.preferred_weekday + 1}
                          </span>
                          <span className="font-medium text-white text-sm">{workout.name}</span>
                        </div>
                        <span className="text-xs text-gray-400 flex items-center">
                          <Dumbbell className="w-3 h-3 mr-1" />
                          {workout.exercises?.length || 0}
                        </span>
                      </div>
                    ))}
                    
                    {program.workouts.length > 4 && (
                      <div className="text-center py-1 text-sm text-purple-400">
                        +{program.workouts.length - 4} more workouts
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* View Full Program Button */}
              <button 
                onClick={handleCardClick}
                className="w-full flex items-center justify-center gap-2 py-2 mt-2 bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg transition-all duration-300 text-sm font-medium border border-purple-500/30"
              >
                <Eye className="w-4 h-4" />
                View Full Program
              </button>
            </div>
          )}
          
          {/* Animated highlight line on hover */}
          <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 w-0 ${isHovered ? 'w-full' : ''} transition-all duration-700`}></div>
        </div>
      </div>

      {/* Modal component */}
      <ExpandableProgramModal
        programId={programId || program.id}
        initialProgramData={program}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onProgramSelect={onProgramSelect}
      />
    </>
  );
};

// EmptyState Component
const EmptyState = ({ onCreatePlan }) => (
  <div className="bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border border-gray-700/50 rounded-xl p-8 text-center">
    <div className="bg-purple-900/30 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
      <Dumbbell className="w-8 h-8 text-purple-400" />
    </div>
    <h3 className="text-xl font-medium text-white mb-2">Ready to start your journey?</h3>
    <p className="text-gray-300 mb-4 max-w-sm mx-auto">Create your first workout plan and start making progress toward your fitness goals</p>
    <button
      onClick={onCreatePlan}
      className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white px-5 py-2 rounded-lg transition-colors inline-flex items-center shadow-sm"
    >
      Create Your First Plan
    </button>
  </div>
);

// ProgramGrid Component - for rendering multiple cards
export const ProgramGrid = ({ 
  programs, 
  onSelect, 
  onDelete, 
  onToggleActive, 
  onCreatePlan, 
  onShare, 
  onFork, 
  onEdit,
  currentUser,
  singleColumn = false 
}) => {
  if (!programs || programs.length === 0) {
    return <EmptyState onCreatePlan={onCreatePlan} />;
  }
  
  // Use conditional class for grid columns
  const gridClass = singleColumn 
    ? "grid grid-cols-1 gap-4" 
    : "grid grid-cols-1 md:grid-cols-2 gap-4";

  return (
    <div className={gridClass}>
      {programs.map(program => (
        <ProgramCard
          key={program.id}
          program={program}
          currentUser={currentUser}
          canManage={true}
          onProgramSelect={onSelect}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
          onShare={onShare}
          onFork={onFork}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

export { ProgramCard };