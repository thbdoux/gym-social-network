import React, { useState, useEffect } from 'react';
import { 
  X, Target, Calendar, Dumbbell, Users, Clock, 
  ChevronDown, ChevronUp, ArrowRight, GitFork, User,
  Heart, Award, Star, Layers, Copy, CheckCircle,
  Info, Book, BarChart2, Trophy, List, Calendar as CalendarIcon
} from 'lucide-react';
import api from '../../../api';
import { getPostTypeDetails } from '../../../utils/postTypeUtils';

const FOCUS_OPTIONS = [
  { value: 'strength', label: 'Strength', description: 'Focus on building maximal strength', icon: <Award className="w-5 h-5" /> },
  { value: 'hypertrophy', label: 'Hypertrophy', description: 'Optimize muscle growth', icon: <Layers className="w-5 h-5" /> },
  { value: 'endurance', label: 'Endurance', description: 'Improve stamina', icon: <Clock className="w-5 h-5" /> },
  { value: 'weight_loss', label: 'Weight Loss', description: 'Combine strength and cardio', icon: <Users className="w-5 h-5" /> },
  { value: 'strength_hypertrophy', label: 'Strength & Hypertrophy', description: 'Balance strength and size', icon: <Star className="w-5 h-5" /> },
  { value: 'general_fitness', label: 'General Fitness', description: 'Well-rounded fitness', icon: <Target className="w-5 h-5" /> }
];

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ExpandableProgramModal = ({ programId, initialProgramData, isOpen, onClose, onProgramSelect, currentUser = null }) => {
  const [program, setProgram] = useState();
  const [loading, setLoading] = useState(!initialProgramData);
  const [error, setError] = useState(null);
  const [expandedWorkouts, setExpandedWorkouts] = useState({});
  const [expandedExercises, setExpandedExercises] = useState({});
  const [isForkingProgram, setIsForkingProgram] = useState(false);
  const [forkSuccess, setForkSuccess] = useState(false);

  // Get program-specific colors
  const programColors = getPostTypeDetails('program').colors;

  useEffect(() => {
    const fetchProgramDetails = async () => {
      if (programId && !program) {
        try {
          setLoading(true);
          const response = await api.get(`/workouts/programs/${programId}/`);
          setProgram(response.data);
        } catch (err) {
          console.error('Error fetching program details:', err);
          setError('Failed to load program details');
        } finally {
          setLoading(false);
        }
      }
    };

    if (isOpen) {
      fetchProgramDetails();
    }
  }, [programId, program, isOpen]);

  const handleForkProgram = async () => {
    if (isForkingProgram) return;
    
    try {
      setIsForkingProgram(true);
      const response = await api.post(`/workouts/programs/${program.id}/fork/`);
      setForkSuccess(true);
      
      // Navigate to the newly forked program after a brief delay to show success animation
      setTimeout(() => {
        if (onProgramSelect) {
          onProgramSelect(response.data);
        }
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error forking program:', err);
      setError('Failed to fork program');
      setIsForkingProgram(false);
    }
  };

  const handleGoToProgramDetail = () => {
    if (onProgramSelect) {
      onProgramSelect(program);
    }
    onClose();
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-xl animate-pulse">
          <div className="h-16 bg-gray-800 mb-4"></div>
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-800 rounded w-1/3"></div>
            <div className="h-24 bg-gray-800 rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-gray-800 rounded"></div>
              <div className="h-20 bg-gray-800 rounded"></div>
              <div className="h-20 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl w-full max-w-5xl overflow-hidden shadow-xl">
          <div className="p-6 text-center">
            <div className="text-red-400 text-lg">{error || "Unable to load program"}</div>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const toggleWorkoutExpand = (workoutId) => {
    setExpandedWorkouts(prev => ({
      ...prev,
      [workoutId]: !prev[workoutId]
    }));
  };

  const toggleExerciseExpand = (exerciseId) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  // Get focus display details
  const getFocusDetails = () => {
    const focusOption = FOCUS_OPTIONS.find(option => option.value === program.focus) || {};
    return {
      label: focusOption.label || program.focus.replace(/_/g, ' '),
      description: focusOption.description || '',
      icon: focusOption.icon || <Target className="w-5 h-5" />
    };
  };

  const focusDetails = getFocusDetails();

  // Group workouts by preferred weekday
  const workoutsByDay = WEEKDAYS.map((day, index) => {
    return {
      day: day,
      dayIndex: index,
      workouts: program.workouts?.filter(w => w.preferred_weekday === index) || []
    };
  });

  // Find days with workouts
  const activeDays = workoutsByDay.filter(day => day.workouts.length > 0);
  console.log(program);
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto py-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-xl mx-4 flex flex-col border border-gray-700">
        {/* Header with program-specific gradient */}
        <div className={`px-6 py-5 bg-gradient-to-r ${programColors.gradient} flex justify-between items-center sticky top-0 z-10`}>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-lg">
              <Book className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{program.name}</h2>
              <div className="flex items-center mt-1 text-sm text-white/80">
                <User className="w-4 h-4 mr-1" />
                <span>by {program.creator_username}</span>
                {program.forked_from && (
                  <span className="flex items-center ml-2">
                    <GitFork className="w-3 h-3 mx-1" />
                    <span>forked from {program.forked_from.creator_username}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-900">
          <div className="p-6">
            {/* Program Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Left Column - Info */}
              <div className="lg:col-span-1">
                {/* Program Focus Banner */}
                <div className={`p-5 rounded-xl ${programColors.lightBg} shadow-md border ${programColors.border} mb-6`}>
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full ${programColors.bg} flex items-center justify-center`}>
                      {focusDetails.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{focusDetails.label}</h3>
                      <p className="text-gray-300 text-sm mt-1">{focusDetails.description}</p>
                    </div>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Info className="w-5 h-5 mr-2 text-blue-400" />
                    Program Info
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-700/30">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-green-400" />
                        <span className="text-gray-300">Frequency</span>
                      </div>
                      <span className="text-white font-medium">{program.sessions_per_week}x weekly</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-gray-700/30">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-amber-400" />
                        <span className="text-gray-300">Duration</span>
                      </div>
                      <span className="text-white font-medium">{program.estimated_completion_weeks} weeks</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-gray-700/30">
                      <div className="flex items-center">
                        <Trophy className="w-4 h-4 mr-2 text-purple-400" />
                        <span className="text-gray-300">Difficulty</span>
                      </div>
                      <span className="text-white font-medium capitalize">{program.difficulty_level}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-gray-700/30">
                      <div className="flex items-center">
                        <Dumbbell className="w-4 h-4 mr-2 text-pink-400" />
                        <span className="text-gray-300">Workouts</span>
                      </div>
                      <span className="text-white font-medium">{program.workouts?.length || 0} total</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-gray-700/30">
                      <div className="flex items-center">
                        <BarChart2 className="w-4 h-4 mr-2 text-indigo-400" />
                        <span className="text-gray-300">Split Method</span>
                      </div>
                      <span className="text-white font-medium capitalize">
                        {program.workouts?.[0]?.split_method?.replace(/_/g, ' ') || "Mixed"}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-blue-400" />
                        <span className="text-gray-300">Following</span>
                      </div>
                      <span className="text-white font-medium">{program.users_count || 0} users</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {program.description && (
                  <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <Book className="w-5 h-5 mr-2 text-violet-400" />
                      Description
                    </h3>
                    <p className="text-gray-300 leading-relaxed">{program.description}</p>
                  </div>
                )}
              </div>

              {/* Right Column - Weekly Calendar View */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-5">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2 text-blue-400" />
                    Weekly Training Schedule
                  </h3>
                  
                  {/* Weekly Calendar */}
                  <div className="grid grid-cols-7 gap-2 mb-6">
                    {WEEKDAYS.map((day, index) => (
                      <div key={day} className="text-center">
                        <div className={`px-2 py-1 rounded-lg ${
                          workoutsByDay[index].workouts.length > 0 
                            ? `${programColors.lightBg} ${programColors.border} border font-medium`
                            : 'bg-gray-800/50 text-gray-400'
                        }`}>
                          {day.substring(0, 3)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Training Days */}
                  <div className="space-y-4">
                    {activeDays.map((dayData) => (
                      <div key={dayData.day} className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
                        <div className="bg-gray-700/60 px-4 py-2 flex items-center">
                          <div className={`w-8 h-8 rounded-full ${programColors.bg} flex items-center justify-center mr-3`}>
                            <CalendarIcon className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="text-lg font-medium text-white">{dayData.day}</h4>
                        </div>
                        
                        <div className="p-4 space-y-3">
                          {dayData.workouts.map((workout, index) => (
                            <div key={workout.id || index} className="border border-gray-700/50 rounded-lg overflow-hidden">
                              <div 
                                className="bg-gray-700/40 px-4 py-3 cursor-pointer flex items-center justify-between"
                                onClick={() => toggleWorkoutExpand(workout.id || `day-${dayData.dayIndex}-workout-${index}`)}
                              >
                                <div className="flex items-center">
                                  <div className={`p-2 rounded-lg bg-gradient-to-br ${programColors.gradient} mr-3`}>
                                    <Dumbbell className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-white">{workout.name}</h5>
                                    <p className="text-sm text-gray-400">
                                      {workout.exercises?.length || 0} exercises • {workout.estimated_duration || 45} min
                                    </p>
                                  </div>
                                </div>
                                <div className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-800 transition-colors">
                                  {expandedWorkouts[workout.id || `day-${dayData.dayIndex}-workout-${index}`] ? 
                                    <ChevronUp className="w-5 h-5 text-gray-300" /> : 
                                    <ChevronDown className="w-5 h-5 text-gray-300" />}
                                </div>
                              </div>
                              
                              {expandedWorkouts[workout.id || `day-${dayData.dayIndex}-workout-${index}`] && workout.exercises && (
                                <div className="bg-gray-800/30 p-4">
                                  <div className="space-y-3">
                                    {workout.exercises.map((exercise, exIndex) => (
                                      <div key={exIndex} className="bg-gray-700/30 rounded-lg border border-gray-700/50 overflow-hidden">
                                        <div 
                                          className="p-3 cursor-pointer flex items-center justify-between"
                                          onClick={() => toggleExerciseExpand(`${workout.id}-ex-${exIndex}`)}
                                        >
                                          <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-3">
                                              <span className="text-white font-medium">{exIndex + 1}</span>
                                            </div>
                                            <div>
                                              <h6 className="font-medium text-white">{exercise.name}</h6>
                                              {exercise.equipment && (
                                                <p className="text-xs text-gray-400">{exercise.equipment}</p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center">
                                            <span className="text-white text-sm mr-3">
                                              {exercise.sets?.length || "4"} sets
                                            </span>
                                            <div className="p-1 rounded-full bg-gray-600/50 hover:bg-gray-600 transition-colors">
                                              {expandedExercises[`${workout.id}-ex-${exIndex}`] ? 
                                                <ChevronUp className="w-4 h-4 text-gray-300" /> : 
                                                <ChevronDown className="w-4 h-4 text-gray-300" />}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {expandedExercises[`${workout.id}-ex-${exIndex}`] && exercise.sets && exercise.sets.length > 0 && (
                                          <div className="border-t border-gray-700/50 p-3">
                                            <div className="bg-gray-800/70 rounded-lg overflow-hidden">
                                              <table className="w-full text-left text-sm">
                                                <thead>
                                                  <tr className="border-b border-gray-700/30 bg-gray-700/30">
                                                    <th className="p-2 font-medium text-gray-300">Set</th>
                                                    <th className="p-2 font-medium text-gray-300">Reps</th>
                                                    <th className="p-2 font-medium text-gray-300">Weight</th>
                                                    <th className="p-2 font-medium text-gray-300">Rest</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {exercise.sets.map((set, setIdx) => (
                                                    <tr key={setIdx} className="border-b border-gray-700/20 last:border-0">
                                                      <td className="p-2 text-gray-300">{setIdx + 1}</td>
                                                      <td className="p-2 text-gray-300">{set.reps}</td>
                                                      <td className="p-2 text-gray-300">{set.weight} kg</td>
                                                      <td className="p-2 text-gray-300">{set.rest_time} sec</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                            
                                            {exercise.notes && (
                                              <div className="mt-3 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700/30">
                                                <p className="text-xs text-gray-300">
                                                  <span className="font-medium text-gray-200">Technique Notes: </span>
                                                  {exercise.notes}
                                                </p>
                                              </div>
                                            )}
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
                      </div>
                    ))}
                    
                    {/* Rest Days */}
                    {workoutsByDay.filter(day => day.workouts.length === 0).length > 0 && (
                      <div className="bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden">
                        <div className="bg-gray-700/30 px-4 py-2">
                          <h4 className="text-lg font-medium text-gray-300">Rest Days</h4>
                        </div>
                        <div className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {workoutsByDay
                              .filter(day => day.workouts.length === 0)
                              .map(day => (
                                <span key={day.day} className="px-3 py-1 bg-gray-800 text-gray-400 rounded-lg text-sm">
                                  {day.day}
                                </span>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700 flex justify-between items-center sticky bottom-0">
          <div>
            <span className="text-gray-400 text-sm flex items-center">
              <Users className="w-4 h-4 mr-1" /> 
              <span>{program.users_count || 0} users following this program</span>
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              Close
            </button>
            {currentUser && program.creator_username !== currentUser.username && (
              <button
                onClick={handleForkProgram}
                disabled={isForkingProgram || forkSuccess}
                className={`px-4 py-2 text-white rounded-lg transition-all flex items-center gap-2 ${
                  forkSuccess ? 
                  'bg-green-600' : 
                  programColors.button + ' active:scale-95'
                } disabled:opacity-50`}
              >
                {forkSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Forked!</span>
                  </>
                ) : isForkingProgram ? (
                  <>
                    <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    <span>Forking...</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Fork Program</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandableProgramModal;