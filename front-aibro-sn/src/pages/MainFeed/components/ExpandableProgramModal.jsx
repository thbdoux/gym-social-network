import React, { useState, useEffect } from 'react';
import { 
  X, Target, Calendar, Dumbbell, Users, Clock, 
  ChevronDown, ChevronUp, ArrowRight, GitFork, User,
  Heart, Award, Star, Layers, Copy, CheckCircle
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

const ExpandableProgramModal = ({ programId, initialProgramData, isOpen, onClose, onProgramSelect }) => {
  const [program, setProgram] = useState(initialProgramData);
  const [loading, setLoading] = useState(!initialProgramData);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedWorkouts, setExpandedWorkouts] = useState({});
  const [isForkingProgram, setIsForkingProgram] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
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

    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/users/me/');
        setCurrentUser(response.data);
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };

    if (isOpen) {
      fetchProgramDetails();
      fetchCurrentUser();
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
        <div className="bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl animate-pulse">
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
        <div className="bg-gray-900 rounded-xl w-full max-w-4xl overflow-hidden shadow-xl">
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

  // Get focus display details - preserve the icon and descriptions but use program colors
  const getFocusDetails = () => {
    const focusOption = FOCUS_OPTIONS.find(option => option.value === program.focus) || {};
    return {
      label: focusOption.label || program.focus.replace(/_/g, ' '),
      description: focusOption.description || '',
      icon: focusOption.icon || <Target className="w-5 h-5" />
    };
  };

  const focusDetails = getFocusDetails();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto py-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl mx-4 flex flex-col border border-gray-700">
        {/* Header with program-specific gradient */}
        <div className={`px-6 py-5 bg-gradient-to-r ${programColors.gradient} flex justify-between items-center sticky top-0 z-10`}>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-lg">
              <Dumbbell className="w-7 h-7 text-white" />
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

        {/* Tabs */}
        <div className="flex bg-gray-800 border-b border-gray-700 px-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-4 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === 'overview'
                ? `text-white bg-gray-900 border-t-2 border-l border-r border-gray-700 ${programColors.active}`
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('workouts')}
            className={`px-5 py-4 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === 'workouts'
                ? `text-white bg-gray-900 border-t-2 border-l border-r border-gray-700 ${programColors.active}`
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            Workouts
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-5 py-4 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === 'schedule'
                ? `text-white bg-gray-900 border-t-2 border-l border-r border-gray-700 ${programColors.active}`
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            Weekly Schedule
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-900">
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Focus Banner - using program colors */}
                <div className={`p-5 rounded-xl ${programColors.lightBg} shadow-md border ${programColors.border} hover:border-gray-700 transition-colors`}>
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

                {/* Description */}
                <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                  <p className="text-gray-300 leading-relaxed">{program.description || "No description provided."}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors hover:bg-gray-800">
                    <div className="flex items-center text-gray-400 mb-3">
                      <Calendar className={`w-5 h-5 mr-2 ${programColors.text}`} />
                      <span className="text-gray-300">Frequency</span>
                    </div>
                    <p className="text-xl font-bold text-white">{program.sessions_per_week}x weekly</p>
                  </div>
                  
                  <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors hover:bg-gray-800">
                    <div className="flex items-center text-gray-400 mb-3">
                      <Clock className={`w-5 h-5 mr-2 ${programColors.text}`} />
                      <span className="text-gray-300">Duration</span>
                    </div>
                    <p className="text-xl font-bold text-white">{program.estimated_completion_weeks} weeks</p>
                  </div>
                  
                  <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors hover:bg-gray-800">
                    <div className="flex items-center text-gray-400 mb-3">
                      <Users className={`w-5 h-5 mr-2 ${programColors.text}`} />
                      <span className="text-gray-300">Difficulty</span>
                    </div>
                    <p className="text-xl font-bold text-white capitalize">{program.difficulty_level}</p>
                  </div>
                </div>

                {/* Meta Information */}
                <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3">Program Details</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-700/50">
                      <span className="text-gray-400">Created</span>
                      <span className="text-white">{new Date(program.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-700/50">
                      <span className="text-gray-400">Workouts</span>
                      <span className="text-white font-medium">{program.workouts?.length || 0} total</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-700/50">
                      <span className="text-gray-400">Likes</span>
                      <span className="text-white flex items-center">
                        <Heart className="w-4 h-4 mr-1 text-red-400" />
                        {program.likes_count || 0}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-700/50">
                      <span className="text-gray-400">Split Method</span>
                      <span className="text-white capitalize">{program.workouts?.[0]?.split_method?.replace(/_/g, ' ') || "Mixed"}</span>
                    </div>
                    {program.tags && program.tags.length > 0 && (
                      <div className="col-span-2 pt-3">
                        <span className="text-gray-400 block mb-2">Tags</span>
                        <div className="flex flex-wrap gap-2">
                          {program.tags.map(tag => (
                            <span 
                              key={tag} 
                              className="px-3 py-1 bg-gray-700/70 text-gray-300 rounded-full text-sm hover:bg-gray-700 transition-colors cursor-pointer"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'workouts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Workouts</h3>
                  <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-sm border border-gray-700">
                    {program.workouts?.length || 0} total
                  </span>
                </div>
                {program.workouts && program.workouts.length > 0 ? (
                  <div className="space-y-4">
                    {program.workouts.map((workout, index) => (
                      <div 
                        key={index} 
                        className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all hover:shadow-md group"
                      >
                        <div 
                          className="p-4 cursor-pointer"
                          onClick={() => toggleWorkoutExpand(workout.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`p-3 rounded-lg bg-gradient-to-br ${programColors.gradient} group-hover:scale-110 transition-transform`}>
                                <Dumbbell className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white text-lg">{workout.name}</h4>
                                <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                                  <span className="capitalize">{workout.split_method?.replace(/_/g, ' ')}</span>
                                  <span className="text-gray-600">•</span>
                                  <span>{workout.exercises?.length || 0} exercises</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-gray-700/70 text-sm rounded-lg text-gray-300 group-hover:bg-gray-700 transition-colors">
                                {WEEKDAYS[workout.preferred_weekday || 0]}
                              </span>
                              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700/50 group-hover:bg-gray-700 transition-colors">
                                {expandedWorkouts[workout.id] ? 
                                  <ChevronUp className="w-5 h-5 text-gray-300" /> : 
                                  <ChevronDown className="w-5 h-5 text-gray-300" />
                                }
                              </div>
                            </div>
                          </div>
                        </div>

                        {expandedWorkouts[workout.id] && workout.exercises && (
                          <div className="border-t border-gray-700 p-5 bg-gray-800/80">
                            <div className="space-y-4">
                              {workout.exercises.map((exercise, exIndex) => (
                                <div key={exIndex} className="bg-gray-700/40 hover:bg-gray-700/60 transition-colors rounded-lg p-4 border border-gray-700/50">
                                  <h5 className="font-medium text-white text-lg mb-2">{exercise.name}</h5>
                                  {exercise.equipment && (
                                    <p className="text-sm text-gray-400 mb-3 flex items-center">
                                      <Dumbbell className="w-4 h-4 mr-1" />
                                      Equipment: {exercise.equipment}
                                    </p>
                                  )}
                                  
                                  {/* Sets Table */}
                                  {exercise.sets && exercise.sets.length > 0 && (
                                    <div className="mt-3 overflow-x-auto rounded-lg border border-gray-600/30">
                                      <table className="w-full text-left text-sm bg-gray-800/50">
                                        <thead>
                                          <tr className="border-b border-gray-700/50 bg-gray-700/30">
                                            <th className="py-2 px-4 font-medium text-gray-300">Set</th>
                                            <th className="py-2 px-4 font-medium text-gray-300">Reps</th>
                                            <th className="py-2 px-4 font-medium text-gray-300">Weight</th>
                                            <th className="py-2 px-4 font-medium text-gray-300">Rest</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {exercise.sets.map((set, setIdx) => (
                                            <tr key={setIdx} className="border-b border-gray-700/20 last:border-0 hover:bg-gray-700/20 transition-colors">
                                              <td className="py-2 px-4 text-gray-300">{setIdx + 1}</td>
                                              <td className="py-2 px-4 text-gray-300">{set.reps}</td>
                                              <td className="py-2 px-4 text-gray-300">{set.weight} kg</td>
                                              <td className="py-2 px-4 text-gray-300">{set.rest_time} sec</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                  
                                  {exercise.notes && (
                                    <div className="mt-3 p-3 bg-gray-800/70 rounded-lg border border-gray-700/30">
                                      <p className="text-sm text-gray-300">
                                        <span className="font-medium text-gray-200">Notes: </span>
                                        {exercise.notes}
                                      </p>
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
                  <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700 mt-4">
                    <p className="text-gray-400">No workouts available for this program.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4">Weekly Schedule</h3>
                <div className="grid grid-cols-7 gap-3">
                  {WEEKDAYS.map((day, index) => {
                    const dayWorkouts = program.workouts?.filter(w => w.preferred_weekday === index) || [];
                    return (
                      <div key={day} className="group">
                        <div className="text-center mb-2">
                          <div className="inline-block px-2 py-1 rounded-lg bg-gray-800 text-sm font-medium text-gray-300 group-hover:bg-gray-700 transition-colors">{day}</div>
                        </div>
                        <div className={`bg-gray-800/40 rounded-xl p-4 h-full min-h-48 flex flex-col transition-all group-hover:bg-gray-800/70 group-hover:shadow-md ${
                          dayWorkouts.length ? 'border border-gray-700' : 'border border-dashed border-gray-700'
                        }`}>
                          {dayWorkouts.length ? (
                            <div className="space-y-3">
                              {dayWorkouts.map((workout, i) => (
                                <div key={i} className="p-3 bg-gray-700/40 hover:bg-gray-700/70 transition-colors rounded-lg border border-gray-600/30 group-hover:border-gray-600/70">
                                  <div className="flex items-center gap-2">
                                    <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${programColors.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                      <Dumbbell className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="font-medium text-white">{workout.name}</span>
                                  </div>
                                  <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                                    <Layers className="w-3 h-3" />
                                    {workout.exercises?.length || 0} exercises 
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                              Rest Day
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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