import React, { useState, useEffect } from 'react';
import { 
  X, Target, Calendar, Dumbbell, Users, Clock, 
  ChevronDown, ChevronUp, GitFork, User,
  Award, Star, Layers, Copy, CheckCircle,
  Info, Book, Trophy, ArrowLeft
} from 'lucide-react';
import { getPostTypeDetails } from '../../../utils/postTypeUtils';
import { programService } from '../../../api/services';

const FOCUS_OPTIONS = [
  { value: 'strength', label: 'Strength', description: 'Focus on building maximal strength', icon: <Award className="w-5 h-5" /> },
  { value: 'hypertrophy', label: 'Hypertrophy', description: 'Optimize muscle growth', icon: <Layers className="w-5 h-5" /> },
  { value: 'endurance', label: 'Endurance', description: 'Improve stamina', icon: <Clock className="w-5 h-5" /> },
  { value: 'weight_loss', label: 'Weight Loss', description: 'Combine strength and cardio', icon: <Users className="w-5 h-5" /> },
  { value: 'strength_hypertrophy', label: 'Strength & Hypertrophy', description: 'Balance strength and size', icon: <Star className="w-5 h-5" /> },
  { value: 'general_fitness', label: 'General Fitness', description: 'Well-rounded fitness', icon: <Target className="w-5 h-5" /> }
];

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ExpandableProgramModal = ({ programId, initialProgramData = null, isOpen, onClose, onProgramSelect, currentUser = null }) => {
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState(null);
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [isForkingProgram, setIsForkingProgram] = useState(false);
  const [forkSuccess, setForkSuccess] = useState(false);

  // Get program-specific colors
  const programColors = getPostTypeDetails('program').colors;

  useEffect(() => {
    const fetchProgramDetails = async () => {
      if (!programId) return;
      
      try {
        setLoading(true);
        
        // Always fetch complete data from the API to ensure we have all details
        const programData = await programService.getProgramById(programId);
        setProgram(programData);
        
        // Set the first day with workouts as active by default
        if (programData?.workouts) {
          const firstDayWithWorkouts = WEEKDAYS.findIndex((_, index) => 
            programData.workouts.some(w => w.preferred_weekday === index)
          );
          
          if (firstDayWithWorkouts !== -1) {
            setActiveDay(firstDayWithWorkouts);
          }
        }
      } catch (err) {
        console.error('Error fetching program details:', err);
        setError('Failed to load program details');
      } finally {
        setLoading(false);
      }
    };

    // If we're open and either don't have initialProgramData or it's incomplete, fetch the data
    if (isOpen) {
      if (!initialProgramData || !initialProgramData.workouts) {
        fetchProgramDetails();
      } else {
        // Use the provided initialProgramData if it seems complete
        setProgram(initialProgramData);
        setLoading(false);
        
        // Set the first day with workouts as active by default
        if (initialProgramData.workouts) {
          const firstDayWithWorkouts = WEEKDAYS.findIndex((_, index) => 
            initialProgramData.workouts.some(w => w.preferred_weekday === index)
          );
          
          if (firstDayWithWorkouts !== -1) {
            setActiveDay(firstDayWithWorkouts);
          }
        }
      }
    }
  }, [programId, isOpen, initialProgramData]);

  const handleForkProgram = async () => {
    if (isForkingProgram) return;
    
    try {
      setIsForkingProgram(true);
      // Use programService instead of direct API call
      const forkedProgram = await programService.forkProgram(program.id);
      setForkSuccess(true);
      
      // Navigate to the newly forked program after a brief delay
      setTimeout(() => {
        if (onProgramSelect) {
          onProgramSelect(forkedProgram);
        }
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error forking program:', err);
      setError('Failed to fork program');
      setIsForkingProgram(false);
    }
  };

  // Format focus name
  const formatFocus = (focus) => {
    if (!focus) return 'General Fitness';
    return focus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get focus display details
  const getFocusDetails = () => {
    const focusOption = FOCUS_OPTIONS.find(option => option.value === program?.focus) || {};
    return {
      label: focusOption.label || (program?.focus ? formatFocus(program.focus) : 'General Fitness'),
      description: focusOption.description || '',
      icon: focusOption.icon || <Target className="w-5 h-5" />
    };
  };

  // Group workouts by preferred weekday
  const getWorkoutsByDay = () => {
    return WEEKDAYS.map((day, index) => ({
      day,
      dayIndex: index,
      workouts: program?.workouts?.filter(w => w.preferred_weekday === index) || []
    }));
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl w-full max-w-md overflow-hidden shadow-xl animate-pulse p-6">
          <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="h-16 bg-gray-800 rounded"></div>
            <div className="h-16 bg-gray-800 rounded"></div>
            <div className="h-16 bg-gray-800 rounded"></div>
          </div>
          <div className="h-32 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl w-full max-w-md overflow-hidden shadow-xl p-6 text-center">
          <div className="text-red-400 text-lg mb-4">{error || "Unable to load program"}</div>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const focusDetails = getFocusDetails();
  const workoutsByDay = getWorkoutsByDay();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col border border-gray-800">
        {/* Header */}
        <div className={`px-6 py-5 bg-gradient-to-r ${programColors.gradient} relative flex justify-between items-center`}>
          <div className="flex items-center gap-3 min-w-0 overflow-hidden">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-lg flex-shrink-0">
              <Book className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0 overflow-hidden">
              <h2 className="text-2xl font-bold text-white tracking-tight truncate">{program.name}</h2>
              <div className="flex items-center mt-1 text-sm text-white/80">
                <User className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">by {program.creator_username}</span>
                {program.forked_from && (
                  <span className="flex items-center ml-2 flex-shrink-0">
                    <GitFork className="w-3 h-3 mx-1" />
                    <span>forked</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Program Overview */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex flex-col md:flex-row gap-5">
            {/* Focus Highlight */}
            <div className={`p-4 rounded-xl ${programColors.lightBg} shadow-md border ${programColors.border} flex items-center gap-4 flex-1`}>
              <div className={`h-12 w-12 rounded-full ${programColors.bg} flex items-center justify-center flex-shrink-0`}>
                {focusDetails.icon}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <h3 className="text-lg font-bold text-white truncate">{focusDetails.label}</h3>
                <p className="text-gray-300 text-sm mt-0.5 truncate">{focusDetails.description}</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 md:w-1/2">
              <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
                <p className="text-gray-400 text-xs mb-1">Frequency</p>
                <p className="text-xl font-bold text-white">{program.sessions_per_week}×</p>
                <p className="text-xs text-gray-500">per week</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
                <p className="text-gray-400 text-xs mb-1">Duration</p>
                <p className="text-xl font-bold text-white">{program.estimated_completion_weeks}</p>
                <p className="text-xs text-gray-500">weeks</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
                <p className="text-gray-400 text-xs mb-1">Level</p>
                <p className="text-xl font-bold text-white capitalize">{
                  program.difficulty_level === 'beginner' ? 'Beg' : 
                  program.difficulty_level === 'intermediate' ? 'Int' : 
                  program.difficulty_level === 'advanced' ? 'Adv' : 
                  program.difficulty_level || 'All'
                }</p>
                <p className="text-xs text-gray-500">difficulty</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Weekday Navigation */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {WEEKDAYS.map((day, index) => (
                <button 
                  key={day} 
                  onClick={() => setActiveDay(index)}
                  className={`text-center py-2 px-1 rounded-lg transition-all ${
                    workoutsByDay[index].workouts.length > 0 
                      ? activeDay === index
                        ? `${programColors.lightBg} ${programColors.border} border-2 font-medium shadow-md`
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
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-4">
                  {WEEKDAYS[activeDay]} Workouts
                </h3>
                
                {workoutsByDay[activeDay].workouts.length > 0 ? (
                  <div className="space-y-4">
                    {workoutsByDay[activeDay].workouts.map((workout, index) => (
                      <div 
                        key={workout.id || index} 
                        className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-700/40 transition-all duration-300"
                      >
                        <div 
                          className="p-4 cursor-pointer hover:bg-gray-750 transition-colors"
                          onClick={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 overflow-hidden flex-1">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600/20 to-indigo-600/20 flex items-center justify-center border border-purple-700/30 flex-shrink-0">
                                <Dumbbell className="w-5 h-5 text-purple-400" />
                              </div>
                              <div className="min-w-0 overflow-hidden">
                                <h4 className="font-medium text-white truncate">{workout.name}</h4>
                                <div className="flex items-center text-sm text-gray-400 mt-0.5">
                                  <span className="flex-shrink-0">{workout.exercises?.length || 0} exercises</span>
                                  {workout.estimated_duration && (
                                    <>
                                      <span className="mx-2 flex-shrink-0">•</span>
                                      <span className="flex-shrink-0">{workout.estimated_duration} min</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                              {expandedWorkout === workout.id ? 
                                <ChevronUp className="w-5 h-5 text-purple-400" /> : 
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              }
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded Workout View */}
                        {expandedWorkout === workout.id && workout.exercises && (
                          <div className="border-t border-gray-700 p-5 bg-gray-850">
                            <h5 className="text-sm font-medium text-gray-300 mb-3">Exercises</h5>
                            
                            <div className="space-y-3">
                              {workout.exercises.map((exercise, exIndex) => (
                                <div 
                                  key={exIndex} 
                                  className="p-3 bg-gray-800/80 rounded-lg border border-gray-700/50"
                                >
                                  <div className="flex items-center min-w-0 overflow-hidden">
                                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mr-3 flex-shrink-0">
                                      <span className="text-white text-xs">{exIndex + 1}</span>
                                    </div>
                                    <div className="min-w-0 overflow-hidden">
                                      <h6 className="font-medium text-white text-sm truncate">{exercise.name}</h6>
                                      {exercise.equipment && (
                                        <p className="text-xs text-gray-400 truncate">{exercise.equipment}</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Exercise Sets Summary */}
                                  {exercise.sets && exercise.sets.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {exercise.sets.map((set, setIdx) => (
                                        <div key={setIdx} className="px-2 py-1 bg-gray-700/50 text-xs text-gray-300 rounded border border-gray-600/30">
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
                  <div className="bg-gray-800 rounded-xl p-8 border border-gray-700/50 flex flex-col items-center justify-center text-center">
                    <Calendar className="w-10 h-10 text-gray-600 mb-2" />
                    <p className="text-gray-400">Rest day</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Program Description */}
            {program.description && (
              <div className="mt-8 bg-gray-800 p-5 rounded-xl border border-gray-700">
                <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-purple-400" />
                  About this Program
                </h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">{program.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-gray-850 border-t border-gray-800 p-4 flex justify-between items-center">
          <div className="text-sm text-gray-400 flex items-center min-w-0 overflow-hidden">
            <Users className="w-4 h-4 mr-1.5 flex-shrink-0" /> 
            <span className="truncate">{program.users_count || 0} users following</span>
          </div>
          
          <div className="flex gap-2 flex-shrink-0 ml-2">
            {currentUser && program.creator_username !== currentUser.username && (
              <button
                onClick={handleForkProgram}
                disabled={isForkingProgram || forkSuccess}
                className={`px-4 py-2 text-white rounded-lg transition-all flex items-center ${
                  forkSuccess ? 
                  'bg-green-600' : 
                  programColors.button + ' hover:bg-opacity-90 active:scale-95'
                } disabled:opacity-50 whitespace-nowrap`}
              >
                {forkSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    <span>Forked!</span>
                  </>
                ) : isForkingProgram ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-1.5"></div>
                    <span>Forking...</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" />
                    <span>Fork Program</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandableProgramModal;