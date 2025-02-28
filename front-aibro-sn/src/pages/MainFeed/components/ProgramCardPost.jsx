import React, { useState, useEffect } from 'react';
import { Dumbbell, ChevronDown, ChevronUp, Calendar, Target, Activity, GitFork, User, Clock } from 'lucide-react';
import api from '../../../api';
import ExpandableProgramModal from './ExpandableProgramModal';

const ProgramCardPost = ({ programId, initialProgramData, onProgramSelect }) => {
  const [program, setProgram] = useState(initialProgramData);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(!initialProgramData);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

    fetchProgramDetails();
  }, [programId, program]);

  if (loading) {
    return (
      <div className="mt-4 bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/4"></div>
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

  const progressColors = {
    strength: 'from-red-500 to-orange-500',
    hypertrophy: 'from-blue-500 to-purple-500',
    endurance: 'from-green-500 to-emerald-500',
    weight_loss: 'from-yellow-500 to-orange-500',
    general_fitness: 'from-blue-400 to-cyan-500',
    strength_hypertrophy: 'from-indigo-500 to-purple-500'
  };

  const getProgressColor = (focus) => {
    return progressColors[focus] || 'from-gray-500 to-slate-500';
  };

  // Check if the program was forked
  const isForked = !!program.forked_from;

  const handleCardClick = (e) => {
    // Open the modal instead of the previous behavior
    e.stopPropagation();
    setShowModal(true);
  };

  const handleExpandClick = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Handle program selection (either navigating to details or handling fork)
  const handleProgramSelect = (selectedProgram) => {
    if (onProgramSelect) {
      onProgramSelect(selectedProgram);
    }
  };

  return (
    <>
      <div 
        className="mt-4 bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Status Indicator Line */}
        <div className={`h-1 w-full bg-gradient-to-r ${getProgressColor(program.focus)}`} />
        
        <div className="p-4">
          {/* Header with basic info */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-purple-400" />
                <h4 className="text-lg font-semibold text-white">
                  {program.name}
                </h4>
                {isForked && (
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <GitFork className="w-3 h-3" />
                    Forked
                  </span>
                )}
              </div>
              <div className="flex items-center mt-1 text-sm text-gray-400">
                <User className="w-4 h-4 mr-1" />
                <span>by {program.creator_username}</span>
                {isForked && program.forked_from && (
                  <span className="ml-2 text-xs text-gray-500">
                    (forked from {program.forked_from.creator_username})
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-300">{program.description}</p>
            </div>
            
            <button
              onClick={handleExpandClick}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              {isExpanded ? 
                <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                <ChevronDown className="w-5 h-5 text-gray-400" />
              }
            </button>
          </div>

          {/* Stats Grid - Always visible */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Activity className="w-4 h-4 mr-1" />
                <span>Workouts</span>
              </div>
              <p className="text-white font-medium">
                {program.workouts?.length || 0} total
              </p>
            </div>
            
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Calendar className="w-4 h-4 mr-1" />
                <span>Frequency</span>
              </div>
              <p className="text-white font-medium">
                {program.sessions_per_week}x weekly
              </p>
            </div>
            
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Target className="w-4 h-4 mr-1" />
                <span>Focus</span>
              </div>
              <p className="text-white font-medium capitalize">
                {program.focus.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {/* Expanded Content - Only visible when expanded */}
          {isExpanded && (
            <div className="mt-4 space-y-4">
              <div className="p-3 bg-gray-800/70 rounded-lg">
                <h5 className="font-medium text-white mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Program Details
                </h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">{program.estimated_completion_weeks} weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Difficulty:</span>
                    <span className="text-white capitalize">{program.difficulty_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{new Date(program.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Likes:</span>
                    <span className="text-white">{program.likes_count || 0}</span>
                  </div>
                </div>
              </div>

              {/* Workouts List Preview */}
              {program.workouts && program.workouts.length > 0 && (
                <div>
                  <h5 className="font-medium text-white mb-2">Included Workouts</h5>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {program.workouts.map((workout, index) => (
                      <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <h6 className="font-medium text-white">{workout.name}</h6>
                          <span className="text-xs bg-gray-600 px-2 py-0.5 rounded text-gray-300">
                            Day {workout.preferred_weekday + 1}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-400 flex items-center gap-2">
                          <span>{workout.split_method?.replace(/_/g, ' ')}</span>
                          <span>•</span>
                          <span>{workout.exercises?.length || 0} exercises</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-center mt-4">
                <button 
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors text-sm font-medium"
                  onClick={handleCardClick}
                >
                  View Full Program
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal component */}
      <ExpandableProgramModal
        programId={programId}
        initialProgramData={program}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onProgramSelect={handleProgramSelect}
      />
    </>
  );
};

export default ProgramCardPost;