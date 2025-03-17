import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, ChevronDown, ChevronUp, Calendar, Target, 
  Activity, User, Users, Star, Trophy,
  Award, Download, Layers, BarChart, Trash2, Edit, Share2,
  CheckCircle, ToggleLeft, ToggleRight, Loader2, Check,
  Info
} from 'lucide-react';
import { getPostTypeDetails } from '../../../utils/postTypeUtils';
import { useProgram, usePrograms } from '../../../hooks/query/useProgramQuery';
import { useLanguage } from '../../../context/LanguageContext';

const ProgramCard = ({ 
  programId,
  program: initialProgramData,
  currentUser,
  inFeedMode = false,
  canManage = false,
  onDelete,
  onToggleActive,
  onShare,
  onEdit,
  onFork,
  onCreatePlan,
  onProgramSelect,
  singleColumn = false,
  compact = false
}) => {
  // Get translation function from language context
  const { t } = useLanguage();
  
  // State management
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [activeDay, setActiveDay] = useState(null);
  const [expandedWorkout, setExpandedWorkout] = useState(null);

  const [isForking, setIsForking] = useState(false);
  const [forkSuccess, setForkSuccess] = useState(false);

  const [hasForked, setHasForked] = useState(false);
  const [showForkWarning, setShowForkWarning] = useState(false);
  
  // Use React Query hooks
  const { data: fetchedProgram, isLoading, error } = useProgram(programId && !initialProgramData ? programId : null);
  const { data: userPrograms = [] } = usePrograms();
  
  // Use either the fetched program or the initial program passed as prop
  const program = initialProgramData || fetchedProgram;
  
  // For forked programs, fetch the original program
  const { data: originalProgram, isLoading: loadingOriginal } = useProgram(
    program?.forked_from || null
  );

  // Get program-specific colors
  const programColors = getPostTypeDetails('program').colors || {};

  // Empty state check
  if (!program && !programId && onCreatePlan) {
    return <EmptyState onCreatePlan={onCreatePlan} />;
  }
  
  // Loading state
  if (isLoading) {
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
        {error?.message || t("unable_to_load_program")}
      </div>
    );
  }
  
  // Helper functions and derived state
  const isForked = !!program.forked_from;
  const isCreator = program.creator_username === currentUser;
  const canForkProgram = !isCreator;
  // Permission checks
  const canEditProgram = canManage && isCreator;
  const canShareProgram = canManage && isCreator;
  const canDeleteProgram = canManage && isCreator;
  const canToggleActive = canManage;

  // Check if user has already forked this program
  useEffect(() => {
    if (!currentUser || isCreator) return;
    
    const alreadyForked = userPrograms.some(userProgram => 
      userProgram.forked_from === program.id
    );
    setHasForked(alreadyForked);
  }, [currentUser, program, isCreator, userPrograms]);

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
      case 'beginner': return { text: t('beginner'), icon: '🔰' };
      case 'intermediate': return { text: t('intermediate'), icon: '⚡' };
      case 'advanced': return { text: t('advanced'), icon: '💪' };
      case 'expert': return { text: t('expert'), icon: '🏆' };
      default: return { text: level || t('all_levels'), icon: '✓' };
    }
  };

  const getFocusDetails = () => {
    const focusMap = {
      'strength': { label: t('strength'), description: t('strength_description'), icon: <Trophy className="w-5 h-5" /> },
      'hypertrophy': { label: t('hypertrophy'), description: t('hypertrophy_description'), icon: <Layers className="w-5 h-5" /> },
      'endurance': { label: t('endurance'), description: t('endurance_description'), icon: <Activity className="w-5 h-5" /> },
      'weight_loss': { label: t('weight_loss'), description: t('weight_loss_description'), icon: <Award className="w-5 h-5" /> },
      'strength_hypertrophy': { label: t('strength_hypertrophy'), description: t('strength_hypertrophy_description'), icon: <Star className="w-5 h-5" /> },
      'general_fitness': { label: t('general_fitness'), description: t('general_fitness_description'), icon: <Target className="w-5 h-5" /> }
    };

    return focusMap[program.focus] || { 
      label: program.focus ? program.focus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : t('general_fitness'), 
      description: t('custom_workout_focus'),
      icon: <Target className="w-5 h-5" />
    };
  };

  // Group workouts by preferred weekday
  const WEEKDAYS = [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')];
  
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
    
    if (onProgramSelect) {
      onProgramSelect(program);
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

  const handleFork = async (e) => {
    e.stopPropagation();
    if (isForking) return;
    
    // If already forked, show warning first
    if (hasForked && !showForkWarning) {
      setShowForkWarning(true);
      return;
    }
    
    try {
      setIsForking(true);
      await onFork?.(program);
      setForkSuccess(true);
      setShowForkWarning(false);
      setHasForked(true);
      setTimeout(() => setForkSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to fork program:', err);
    } finally {
      setIsForking(false);
    }
  };
  
  const cancelFork = (e) => {
    e.stopPropagation();
    setShowForkWarning(false);
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
                
                {/* Active status badge */}
                {program.is_active && (
                  <span className="ml-2 flex items-center text-xs text-green-400 flex-shrink-0">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">{t('active')}</span>
                  </span>
                )}
              </div>
              
              <div className="flex items-center mt-1 text-sm text-gray-400 truncate">
                <User className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                <span className="truncate">{program.creator_username}</span>
                
                {/* Show forked information */}
                {isForked && (
                  <span className="ml-2 flex items-center flex-shrink-0">
                    <Download className="w-3 h-3 mx-1 text-purple-400" />
                    <span className="text-purple-400">{t('from')}</span>
                    <span className="ml-1 text-purple-300 font-medium truncate">
                      {loadingOriginal ? "..." : originalProgram?.creator_username || t('another_user')}
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
              aria-label={program.is_active ? t("deactivate_program") : t("set_active_program")}
              title={program.is_active ? t("deactivate_program") : t("set_active_program")}
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
                    aria-label={t("edit_program")}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                
                {canShareProgram && (
                  <button
                    onClick={(e) => handleButtonClick(e, () => onShare?.(program))}
                    className="p-1.5 text-gray-400 hover:text-purple-400 bg-transparent hover:bg-purple-900/20 rounded-md transition-colors"
                    aria-label={t("share_program")}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
                
                {canDeleteProgram && (
                  <button
                    onClick={(e) => handleButtonClick(e, () => {
                      if (window.confirm(t('confirm_delete_program_question', { name: program.name }))) {
                        onDelete?.(program.id);
                      }
                    })}
                    className="p-1.5 text-gray-400 hover:text-red-400 bg-transparent hover:bg-red-900/20 rounded-md transition-colors"
                    aria-label={t("delete_program")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            
            {canForkProgram && (
              <button
                onClick={handleFork}
                disabled={isForking}
                className={`p-1.5 mr-2 rounded-md transition-colors flex items-center 
                  ${isHovered ? 'opacity-100' : 'opacity-0'} 
                  ${isForking ? 'opacity-50 cursor-not-allowed' : ''}
                  ${hasForked 
                    ? 'text-orange-400 bg-transparent hover:text-orange-300 hover:bg-orange-900/20' 
                    : 'text-purple-400 bg-transparent hover:text-purple-300 hover:bg-purple-900/20'}`}
                aria-label={hasForked ? t("fork_again") : t("fork_program")}
                title={hasForked ? t("already_forked") : t("fork_program")}
              >
                {isForking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            )}

            {forkSuccess && (
              <div className="absolute bottom-4 right-4 bg-green-900/80 text-green-300 p-2 rounded-lg flex items-center animate-fadeIn shadow-lg border border-green-700/50">
                <Check className="w-4 h-4 mr-2" />
                <span className="text-sm">{t('program_forked_success')}</span>
              </div>
            )}

            {showForkWarning && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 p-4 rounded-lg shadow-lg border border-orange-500/50 z-10 w-80 animate-fadeIn">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-orange-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-white mb-2">{t('fork_again_question')}</h3>
                    <p className="text-gray-300 text-sm mb-4">{t('already_forked_message')}</p>
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={cancelFork} 
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-white transition-colors"
                      >
                        {t('cancel')}
                      </button>
                      <button 
                        onClick={handleFork}
                        className="px-3 py-1.5 bg-orange-600/70 hover:bg-orange-600 rounded-md text-sm text-white transition-colors"
                      >
                        {t('fork_again')}
                      </button>
                    </div>
                  </div>
                </div>
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
              <span>{t('workouts')}</span>
            </div>
            <p className="font-semibold text-white">
              {program.workouts?.length || 0}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 hover:from-purple-900/30 hover:to-purple-800/30 p-3 rounded-lg border border-purple-700/30 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center text-xs text-gray-400 mb-1">
              <Calendar className="w-3.5 h-3.5 mr-1 text-purple-400" />
              <span>{t('days_per_week')}</span>
            </div>
            <p className="font-semibold text-white">
              {program.sessions_per_week}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-900/20 to-indigo-800/20 hover:from-indigo-900/30 hover:to-indigo-800/30 p-3 rounded-lg border border-indigo-700/30 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center text-xs text-gray-400 mb-1">
              <Target className="w-3.5 h-3.5 mr-1 text-indigo-400" />
              <span>{t('focus')}</span>
            </div>
            <div className="font-semibold text-white flex items-center justify-between">
              <span className="capitalize text-xs truncate">{t(program.focus?.split('_')[0] || 'general')}</span>
              {getFocusIcon(program.focus)}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-fuchsia-900/20 to-fuchsia-800/20 hover:from-fuchsia-900/30 hover:to-fuchsia-800/30 p-3 rounded-lg border border-fuchsia-700/30 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center text-xs text-gray-400 mb-1">
              <Users className="w-3.5 h-3.5 mr-1 text-fuchsia-400" />
              <span>{t('level')}</span>
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
                {t('program_details')}
              </h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-800/80 rounded-lg border border-gray-700/30">
                  <span className="text-xs text-gray-400 block mb-1">{t('duration')}</span>
                  <span className="text-white font-medium">{program.estimated_completion_weeks} {t('weeks')}</span>
                </div>
                <div className="p-3 bg-gray-800/80 rounded-lg border border-gray-700/30">
                  <span className="text-xs text-gray-400 block mb-1">{t('created')}</span>
                  <span className="text-white font-medium">{new Date(program.created_at).toLocaleDateString()}</span>
                </div>
                
                {/* Tags - Only show if they exist */}
                {program.tags && program.tags.length > 0 && (
                  <div className="col-span-2 p-3 bg-gray-800/80 rounded-lg border border-gray-700/30">
                    <span className="text-xs text-gray-400 block mb-2">{t('tags')}</span>
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
                      <Download className="w-4 h-4 mr-1.5 text-purple-400" />
                      <span className="text-purple-300">
                        {t('forked_from', { name: originalProgram.name, creator: originalProgram.creator_username })}
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
                {t('weekly_schedule')}
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
                    {WEEKDAYS[activeDay]} {t('workouts')}
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
                              <span className="flex-shrink-0">{workout.exercises?.length || 0} {t('exercises')}</span>
                              {workout.estimated_duration && (
                                <>
                                  <span className="mx-1.5 flex-shrink-0">•</span>
                                  <span className="flex-shrink-0">{workout.estimated_duration} {t('mins')}</span>
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
                                      {set.reps} {t('reps')} × {set.weight || 0} kg
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
                <p className="text-gray-400 text-sm">{t('rest_day')}</p>
              </div>
            )}
          </div>
        )}
        
        {activeDay === null && program.workouts && program.workouts.length > 0 && (
          <p className="text-center text-gray-400 text-sm">{t('select_day_to_view_workouts')}</p>
        )}
      </div>

      {/* Program Description */}
      {program.description && (
        <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
          <h5 className="font-medium text-gray-200 text-sm mb-3 flex items-center">
            <Info className="w-4 h-4 mr-2 text-purple-400" />
            {t('about_this_program')}
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
const EmptyState = ({ onCreatePlan }) => {
  const { t } = useLanguage(); // Add this line to access translations
  
  return (
    <div className="bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border border-gray-700/50 rounded-xl p-8 text-center">
      <div className="bg-purple-900/30 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <Dumbbell className="w-8 h-8 text-purple-400" />
      </div>
      <h3 className="text-xl font-medium text-white mb-2">{t('ready_to_start_journey')}</h3>
      <p className="text-gray-300 mb-4 max-w-sm mx-auto">{t('create_first_plan_description')}</p>
      <button
        onClick={onCreatePlan}
        className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white px-5 py-2 rounded-lg transition-colors inline-flex items-center shadow-sm"
      >
        {t('create_first_plan')}
      </button>
    </div>
  );
};

// ProgramGrid Component
export const ProgramGrid = ({ 
  programs, 
  onSelect, 
  onDelete, 
  onToggleActive, 
  onCreatePlan, 
  onShare, 
  onEdit,
  onFork,
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
          onEdit={onEdit}
          onFork={onFork}
        />
      ))}
    </div>
  );
};

export { ProgramCard };