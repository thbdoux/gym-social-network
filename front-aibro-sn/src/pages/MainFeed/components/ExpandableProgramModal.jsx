import React, { useState, useEffect } from 'react';
import { 
  X, Target, Calendar, Dumbbell, Users, Clock, 
  ChevronDown, ChevronUp, ArrowRight, GitFork, User
} from 'lucide-react';
import api from '../../../api';

const FOCUS_OPTIONS = [
  { value: 'strength', label: 'Strength', description: 'Focus on building maximal strength' },
  { value: 'hypertrophy', label: 'Hypertrophy', description: 'Optimize muscle growth' },
  { value: 'endurance', label: 'Endurance', description: 'Improve stamina' },
  { value: 'weight_loss', label: 'Weight Loss', description: 'Combine strength and cardio' },
  { value: 'strength_hypertrophy', label: 'Strength & Hypertrophy', description: 'Balance strength and size' },
  { value: 'general_fitness', label: 'General Fitness', description: 'Well-rounded fitness' }
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
      // Navigate to the newly forked program
      if (onProgramSelect) {
        onProgramSelect(response.data);
      }
      onClose();
    } catch (err) {
      console.error('Error forking program:', err);
      setError('Failed to fork program');
    } finally {
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl animate-pulse">
          <div className="h-16 bg-gray-700 mb-4"></div>
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-700 rounded w-1/3"></div>
            <div className="h-24 bg-gray-700 rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl w-full max-w-4xl overflow-hidden shadow-xl">
          <div className="p-6 text-center">
            <div className="text-red-400 text-lg">{error || "Unable to load program"}</div>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg"
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

  // Get focus display details
  const getFocusDetails = () => {
    const focusOption = FOCUS_OPTIONS.find(option => option.value === program.focus) || {};
    return {
      label: focusOption.label || program.focus.replace(/_/g, ' '),
      description: focusOption.description || '',
      color: 
        program.focus === 'strength' ? 'from-red-500 to-orange-500' :
        program.focus === 'hypertrophy' ? 'from-blue-500 to-purple-500' :
        program.focus === 'endurance' ? 'from-green-500 to-emerald-500' :
        program.focus === 'weight_loss' ? 'from-yellow-500 to-orange-500' :
        program.focus === 'strength_hypertrophy' ? 'from-indigo-500 to-purple-500' :
        'from-blue-400 to-cyan-500'
    };
  };

  const focusDetails = getFocusDetails();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl mx-4 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-5 border-b border-gray-700 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${focusDetails.color} flex items-center justify-center`}>
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{program.name}</h2>
              <div className="flex items-center mt-1 text-sm text-gray-400">
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
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('workouts')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'workouts'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Workouts
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'schedule'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Weekly Schedule
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Focus Banner */}
                <div className={`p-4 rounded-xl bg-gradient-to-r ${focusDetails.color} bg-opacity-10`}>
                  <div className="flex items-center gap-3">
                    <Target className="w-6 h-6 text-white" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{focusDetails.label}</h3>
                      <p className="text-gray-200 text-sm">{focusDetails.description}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                  <p className="text-gray-300">{program.description || "No description provided."}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-800 p-4 rounded-xl">
                    <div className="flex items-center text-gray-400 mb-2">
                      <Calendar className="w-5 h-5 mr-2" />
                      <span>Frequency</span>
                    </div>
                    <p className="text-xl font-semibold text-white">{program.sessions_per_week}x weekly</p>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-xl">
                    <div className="flex items-center text-gray-400 mb-2">
                      <Clock className="w-5 h-5 mr-2" />
                      <span>Duration</span>
                    </div>
                    <p className="text-xl font-semibold text-white">{program.estimated_completion_weeks} weeks</p>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-xl">
                    <div className="flex items-center text-gray-400 mb-2">
                      <Users className="w-5 h-5 mr-2" />
                      <span>Difficulty</span>
                    </div>
                    <p className="text-xl font-semibold text-white capitalize">{program.difficulty_level}</p>
                  </div>
                </div>

                {/* Meta Information */}
                <div className="bg-gray-800 p-4 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-2">Program Details</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Created</span>
                      <span className="text-white">{new Date(program.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Workouts</span>
                      <span className="text-white">{program.workouts?.length || 0} total</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Likes</span>
                      <span className="text-white">{program.likes_count || 0}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Split Method</span>
                      <span className="text-white capitalize">{program.workouts?.[0]?.split_method?.replace(/_/g, ' ') || "Mixed"}</span>
                    </div>
                    {program.tags && program.tags.length > 0 && (
                      <div className="col-span-2 pt-2">
                        <span className="text-gray-400">Tags</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {program.tags.map(tag => (
                            <span 
                              key={tag} 
                              className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
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
                <h3 className="text-xl font-bold text-white mb-4">Workouts</h3>
                {program.workouts && program.workouts.length > 0 ? (
                  <div className="space-y-4">
                    {program.workouts.map((workout, index) => (
                      <div 
                        key={index} 
                        className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div 
                          className="p-4 cursor-pointer"
                          onClick={() => toggleWorkoutExpand(workout.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-500/20 p-2 rounded-lg">
                                <Dumbbell className="w-5 h-5 text-blue-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{workout.name}</h4>
                                <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                                  <span className="capitalize">{workout.split_method?.replace(/_/g, ' ')}</span>
                                  <span className="text-gray-600">•</span>
                                  <span>{workout.exercises?.length || 0} exercises</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-gray-700 text-sm rounded-lg text-gray-300">
                                {WEEKDAYS[workout.preferred_weekday || 0]}
                              </span>
                              {expandedWorkouts[workout.id] ? 
                                <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              }
                            </div>
                          </div>
                        </div>

                        {expandedWorkouts[workout.id] && workout.exercises && (
                          <div className="border-t border-gray-700 p-4 bg-gray-800/50">
                            <div className="space-y-4">
                              {workout.exercises.map((exercise, exIndex) => (
                                <div key={exIndex} className="bg-gray-700/50 rounded-lg p-4">
                                  <h5 className="font-medium text-white mb-2">{exercise.name}</h5>
                                  {exercise.equipment && (
                                    <p className="text-sm text-gray-400 mb-2">
                                      Equipment: {exercise.equipment}
                                    </p>
                                  )}
                                  
                                  {/* Sets Table */}
                                  {exercise.sets && exercise.sets.length > 0 && (
                                    <div className="mt-3 overflow-x-auto">
                                      <table className="w-full text-left text-sm">
                                        <thead>
                                          <tr className="border-b border-gray-700/50">
                                            <th className="pb-2 pr-4 font-medium text-gray-400">Set</th>
                                            <th className="pb-2 px-4 font-medium text-gray-400">Reps</th>
                                            <th className="pb-2 px-4 font-medium text-gray-400">Weight</th>
                                            <th className="pb-2 pl-4 font-medium text-gray-400">Rest</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {exercise.sets.map((set, setIdx) => (
                                            <tr key={setIdx} className="border-b border-gray-700/20 last:border-0">
                                              <td className="py-2 pr-4 text-gray-300">{setIdx + 1}</td>
                                              <td className="py-2 px-4 text-gray-300">{set.reps}</td>
                                              <td className="py-2 px-4 text-gray-300">{set.weight} kg</td>
                                              <td className="py-2 pl-4 text-gray-300">{set.rest_time} sec</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                  
                                  {exercise.notes && (
                                    <p className="mt-2 text-sm text-gray-400">{exercise.notes}</p>
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
                  <div className="text-center py-12 bg-gray-800 rounded-xl">
                    <p className="text-gray-400">No workouts available for this program.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4">Weekly Schedule</h3>
                <div className="grid grid-cols-7 gap-2">
                  {WEEKDAYS.map((day, index) => {
                    const dayWorkouts = program.workouts?.filter(w => w.preferred_weekday === index) || [];
                    return (
                      <div key={day} className="group">
                        <div className="text-center mb-2">
                          <div className="text-sm font-medium text-gray-400">{day}</div>
                        </div>
                        <div className={`bg-gray-800 rounded-xl p-4 h-full min-h-40 flex flex-col transition-colors ${
                          dayWorkouts.length ? 'border border-gray-700' : 'border border-dashed border-gray-700'
                        }`}>
                          {dayWorkouts.length ? (
                            <div className="space-y-3">
                              {dayWorkouts.map((workout, i) => (
                                <div key={i} className="p-3 bg-gray-700/50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Dumbbell className="w-4 h-4 text-blue-400" />
                                    <span className="font-medium text-white">{workout.name}</span>
                                  </div>
                                  <div className="mt-1 text-xs text-gray-400">
                                    {workout.exercises?.length || 0} exercises 
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full text-sm text-gray-500">
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
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700 flex justify-end gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
          
          {currentUser && program.creator_username !== currentUser.username && (
            <button
              onClick={handleForkProgram}
              disabled={isForkingProgram}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isForkingProgram ? (
                <>
                  <span>Forking...</span>
                </>
              ) : (
                <>
                  <GitFork className="w-4 h-4" />
                  <span>Fork Program</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpandableProgramModal;