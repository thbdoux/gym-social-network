import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, ChevronDown, ChevronUp, Calendar, Target, 
  Activity, GitFork, User, Users, Star, Trophy,
  Award, Layers, BarChart, Trash2, Edit, Share2,
  CheckCircle, ToggleLeft, ToggleRight, Loader2,
  Book, Info
} from 'lucide-react';
import { programService } from '../../../api/services';
import { getPostTypeDetails } from '../../../utils/postTypeUtils';

const ProgramCard = ({ 
  programId,
  program: initialProgramData,
  singleColumn = false,
  currentUser,
  inFeedMode = false,
  canManage = false,
  onProgramSelect,
  onDelete,
  onToggleActive,
  onShare,
  onFork,
  onEdit,
  onCreatePlan,
  userPrograms = []
}) => {
  // State management
  const [program, setProgram] = useState(initialProgramData);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(!initialProgramData);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [originalProgram, setOriginalProgram] = useState(null);
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const [activeDay, setActiveDay] = useState(null);
  const [expandedWorkout, setExpandedWorkout] = useState(null);

  // Get program-specific colors
  const programColors = getPostTypeDetails('program').colors || {};

  // Empty state check
  if (!program && !programId && onCreatePlan) {
    return <EmptyState onCreatePlan={onCreatePlan} />;
  }

  // Update program when initialProgramData changes
  useEffect(() => {
    setProgram(initialProgramData);
  }, [initialProgramData]);

  // Fetch program details and original program if forked
  useEffect(() => {
    const fetchProgramDetails = async () => {
      if (programId && !program) {
        try {
          setLoading(true);
          const programData = await programService.getProgramById(programId);
          setProgram(programData);
          
          // If program is forked, fetch original program
          if (programData.forked_from) {
            fetchOriginalProgram(programData.forked_from);
          }
        } catch (err) {
          console.error('Error fetching program details:', err);
          setError('Failed to load program details');
        } finally {
          setLoading(false);
        }
      } else if (program?.forked_from && !originalProgram && !loadingOriginal) {
        // If we have a program with forked_from but no originalProgram
        fetchOriginalProgram(program.forked_from);
      }
    };

    const fetchOriginalProgram = async (originalProgramId) => {
      if (!originalProgramId) return;
      
      try {
        setLoadingOriginal(true);
        const originalProgramData = await programService.getProgramById(originalProgramId);
        setOriginalProgram(originalProgramData);
      } catch (err) {
        console.error('Error fetching original program details:', err);
      } finally {
        setLoadingOriginal(false);
      }
    };

    fetchProgramDetails();
  }, [programId, program, originalProgram, loadingOriginal]);

  // Loading state
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

  // Error state
  if (error || !program) {
    return (
      <div className="mt-4 bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-xl">
        {error || "Unable to load program"}
      </div>
    );
  }
  
  // Helper functions and derived state
  const isForked = !!program.forked_from;
  const isCreator = program.creator_username === currentUser;
  
  // Permission checks
  const canEditProgram = canManage && isCreator;
  const canShareProgram = canManage && isCreator;
  const canForkProgram = canManage && !isCreator;
  const canDeleteProgram = canManage && isCreator;
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

  const getDifficultyLabel = (level) => {
    switch(level?.toLowerCase()) {
      case 'beginner': return { text: 'Beginner', icon: '🔰' };
      case 'intermediate': return { text: 'Intermediate', icon: '⚡' };
      case 'advanced': return { text: 'Advanced', icon: '💪' };
      case 'expert': return { text: 'Expert', icon: '🏆' };
      default: return { text: level || 'All Levels', icon: '✓' };
    }
  };

  const getFocusDetails = () => {
    const focusMap = {
      'strength': { label: 'Strength', description: 'Focus on building maximal strength', icon: <Trophy className="w-5 h-5" /> },
      'hypertrophy': { label: 'Hypertrophy', description: 'Optimize muscle growth', icon: <Layers className="w-5 h-5" /> },
      'endurance': { label: 'Endurance', description: 'Improve stamina', icon: <Activity className="w-5 h-5" /> },
      'weight_loss': { label: 'Weight Loss', description: 'Combine strength and cardio', icon: <Award className="w-5 h-5" /> },
      'strength_hypertrophy': { label: 'Strength & Hypertrophy', description: 'Balance strength and size', icon: <Star className="w-5 h-5" /> },
      'general_fitness': { label: 'General Fitness', description: 'Well-rounded fitness', icon: <Target className="w-5 h-5" /> }
    };

    return focusMap[program.focus] || { 
      label: program.focus ? program.focus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'General Fitness', 
      description: 'Custom workout focus',
      icon: <Target className="w-5 h-5" />
    };
  };

  // Group workouts by preferred weekday
  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const getWorkoutsByDay = () => {
    return WEEKDAYS.map((day, index) => ({
      day,
      dayIndex: index,
      workouts: program.workouts?.filter(w => w.preferred_weekday === index) || []
    }));
  };

  const workoutsByDay = getWorkoutsByDay();

  // Event handlers
  // Modified to always expand the card when clicked (unless in feed mode)
  const handleCardClick = (e) => {
    e.stopPropagation();
    if (!inFeedMode && !isExpanded) {
      setIsExpanded(true);
    }
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

  const handleDaySelect = (index) => {
    setActiveDay(index === activeDay ? null : index);
  };

  const handleWorkoutExpand = (workoutId) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
  };

  return (
    <div 
      className={`mt-4 bg-gradient-to-br ${program.is_active ? 'from-purple-900/30 via-gray-800/95 to-gray-900/95 border-purple-500/50' : 'from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50'} border rounded-xl overflow-hidden transition-all duration-300 
        ${isExpanded ? 'shadow-lg' : ''} 
        ${isHovered && !isExpanded ? 'shadow-md scale-[1.01]' : ''} 
        ${inFeedMode ? '' : 'cursor-pointer'} relative`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status Indicator Line */}
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
                
                {/* Show forked information */}
                {isForked && (
                  <span className="ml-2 flex items-center flex-shrink-0">
                    <GitFork className="w-3 h-3 mx-1 text-purple-400" />
                    <span className="text-purple-400">from</span>
                    <span className="ml-1 text-purple-300 font-medium truncate">
                      {loadingOriginal ? "..." : originalProgram?.creator_username || "another user"}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Toggle Active button - Only visible on hover */}
          {canToggleActive && (
            <button
              onClick={handleToggleActive}
              disabled={isToggling}
              className={`p-1.5 mr-2 rounded-md transition-colors flex items-center bg-transparent 
                ${isHovered ? 'opacity-100' : 'opacity-0'} 
                ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}
                ${program.is_active 
                  ? 'text-green-400 hover:text-green-300 hover:bg-green-900/20' 
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'}`}
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
          
          {/* Action buttons - Only visible on hover */}
          <div className="flex items-center flex-shrink-0">
            {/* Management actions */}
            {canManage && (
              <div className={`flex items-center space-x-1 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 mr-2`}>
                {canEditProgram && (
                  <button
                    onClick={(e) => handleButtonClick(e, () => onEdit?.(program))}
                    className="p-1.5 text-gray-400 hover:text-white bg-transparent hover:bg-gray-700/50 rounded-md transition-colors"
                    aria-label="Edit program"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                
                {canShareProgram && (
                  <button
                    onClick={(e) => handleButtonClick(e, () => onShare?.(program))}
                    className="p-1.5 text-gray-400 hover:text-purple-400 bg-transparent hover:bg-purple-900/20 rounded-md transition-colors"
                    aria-label="Share program"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
                
                {canForkProgram && (
                  <button
                    onClick={(e) => handleButtonClick(e, () => onFork?.(program))}
                    className="p-1.5 text-gray-400 hover:text-purple-400 bg-transparent hover:bg-purple-900/20 rounded-md transition-colors"
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
                    className="p-1.5 text-gray-400 hover:text-red-400 bg-transparent hover:bg-red-900/20 rounded-md transition-colors"
                    aria-label="Delete program"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            
            <button
              onClick={handleExpandClick}
              className={`p-1.5 bg-transparent rounded-md transition-colors 
                ${isHovered || isExpanded ? 'opacity-100' : 'opacity-0'} 
                ${isExpanded ? 'text-purple-400 bg-purple-900/20' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Description - Show only if it exists */}
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

        {/* Expanded View - Program Details */}
        {isExpanded && (
          <div className="mt-6 space-y-6 animate-fadeIn">
            {/* Focus Highlight */}
            <div className={`p-4 rounded-xl ${programColors.lightBg || 'bg-purple-900/20'} shadow-md border ${programColors.border || 'border-purple-700/30'} flex items-center gap-4`}>
              <div className={`h-12 w-12 rounded-full ${programColors.bg || 'bg-purple-900/40'} flex items-center justify-center flex-shrink-0`}>
                {getFocusDetails().icon}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <h3 className="text-lg font-bold text-white truncate">{getFocusDetails().label}</h3>
                <p className="text-gray-300 text-sm mt-0.5 truncate">{getFocusDetails().description}</p>
              </div>
            </div>
            
            {/* Program Details */}
            <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
              <h5 className="font-medium text-gray-200 text-sm mb-3 flex items-center">
                <BarChart className="w-4 h-4 mr-2 text-purple-400" />
                Program Details
              </h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-800/80 rounded-lg border border-gray-700/30">
                  <span className="text-xs text-gray-400 block mb-1">Duration</span>
                  <span className="text-white font-medium">{program.estimated_completion_weeks} weeks</span>
                </div>
                <div className="p-3 bg-gray-800/80 rounded-lg border border-gray-700/30">
                  <span className="text-xs text-gray-400 block mb-1">Created</span>
                  <span className="text-white font-medium">{new Date(program.created_at).toLocaleDateString()}</span>
                </div>
                
                {/* Tags - Only show if they exist */}
                {program.tags && program.tags.length > 0 && (
                  <div className="col-span-2 p-3 bg-gray-800/80 rounded-lg border border-gray-700/30">
                    <span className="text-xs text-gray-400 block mb-2">Tags</span>
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
                
                {/* Original program info for forked programs */}
                {isForked && originalProgram && (
                  <div className="col-span-2 bg-purple-900/20 p-3 rounded-lg border border-purple-700/30">
                    <div className="flex items-center">
                      <GitFork className="w-4 h-4 mr-1.5 text-purple-400" />
                      <span className="text-purple-300">
                        Forked from{" "}
                        <span className="font-medium">{originalProgram.name}</span>
                        {" "}by{" "}
                        <span className="font-medium">{originalProgram.creator_username}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Schedule Navigation */}
            <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
              <h5 className="font-medium text-gray-200 text-sm mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                Weekly Schedule
              </h5>
              
              <div className="grid grid-cols-7 gap-2 mb-4">
                {WEEKDAYS.map((day, index) => (
                  <button 
                    key={day} 
                    onClick={() => handleDaySelect(index)}
                    className={`text-center py-2 px-1 rounded-lg transition-all ${
                      workoutsByDay[index].workouts.length > 0 
                        ? activeDay === index
                          ? `${programColors.lightBg || 'bg-purple-900/20'} ${programColors.border || 'border-purple-700/30'} border font-medium`
                          : `bg-gray-800 border border-gray-700 font-medium hover:border-purple-600/40 hover:bg-gray-750`
                        : 'bg-gray-800/50 text-gray-500 cursor-default'
                    }`}
                  >
                    <span className="block sm:hidden">{day.substring(0, 1)}</span>
                    <span className="hidden sm:block">{day.substring(0, 3)}</span>
                  </button>
                ))}
              </div>
              
              {/* Selected Day's Workouts */}
              {activeDay !== null && (
                <div>
                  <h6 className="text-sm font-medium text-white mb-3">
                    {WEEKDAYS[activeDay]} Workouts
                  </h6>
                  
                  {workoutsByDay[activeDay].workouts.length > 0 ? (
                    <div className="space-y-3">
                      {workoutsByDay[activeDay].workouts.map((workout, index) => (
                        <div 
                          key={workout.id || index} 
                          className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-700/40 transition-all duration-300"
                        >
                          <div 
                            className="p-3 cursor-pointer hover:bg-gray-750 transition-colors"
                            onClick={() => handleWorkoutExpand(workout.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 min-w-0 overflow-hidden flex-1">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600/20 to-indigo-600/20 flex items-center justify-center border border-purple-700/30 flex-shrink-0">
                                  <Dumbbell className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="min-w-0 overflow-hidden">
                                  <h4 className="font-medium text-white text-sm truncate">{workout.name}</h4>
                                  <div className="flex items-center text-xs text-gray-400 mt-0.5">
                                    <span className="flex-shrink-0">{workout.exercises?.length || 0} exercises</span>
                                    {workout.estimated_duration && (
                                      <>
                                        <span className="mx-1.5 flex-shrink-0">•</span>
                                        <span className="flex-shrink-0">{workout.estimated_duration} min</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex-shrink-0 ml-2">
                                {expandedWorkout === workout.id ? 
                                  <ChevronUp className="w-4 h-4 text-purple-400" /> : 
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                }
                              </div>
                            </div>
                          </div>
                          
                          {/* Expanded Workout View */}
                          {expandedWorkout === workout.id && workout.exercises && (
                            <div className="border-t border-gray-700 p-4 bg-gray-800/80">
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {workout.exercises.map((exercise, exIndex) => (
                                  <div 
                                    key={exIndex} 
                                    className="p-3 bg-gray-700/40 rounded-lg"
                                  >
                                    <div className="flex items-center min-w-0 overflow-hidden">
                                      <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center mr-2 flex-shrink-0">
                                        <span className="text-white text-xs">{exIndex + 1}</span>
                                      </div>
                                      <div className="min-w-0 overflow-hidden">
                                      <h6 className="font-medium text-white text-xs truncate">{exercise.name}</h6>
                                        {exercise.equipment && (
                                          <p className="text-xs text-gray-400 truncate">{exercise.equipment}</p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Exercise Sets Summary */}
                                    {exercise.sets && exercise.sets.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                        {exercise.sets.map((set, setIdx) => (
                                          <div key={setIdx} className="px-2 py-0.5 bg-gray-700 text-xs text-gray-300 rounded border border-gray-600/30">
                                            {set.reps} reps × {set.weight || 0} kg
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700/50 flex flex-col items-center justify-center text-center">
                      <Calendar className="w-8 h-8 text-gray-600 mb-2" />
                      <p className="text-gray-400 text-sm">Rest day</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeDay === null && program.workouts && program.workouts.length > 0 && (
                <p className="text-center text-gray-400 text-sm">Select a day to view workouts</p>
              )}
            </div>

            {/* Program Description */}
            {program.description && (
              <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
                <h5 className="font-medium text-gray-200 text-sm mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-purple-400" />
                  About this Program
                </h5>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{program.description}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Animated highlight line on hover */}
        <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 w-0 ${isHovered ? 'w-full' : ''} transition-all duration-700`}></div>
      </div>
    </div>
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

// ProgramGrid Component
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