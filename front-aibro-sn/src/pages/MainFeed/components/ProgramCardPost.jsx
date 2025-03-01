import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, ChevronDown, ChevronUp, Calendar, Target, 
  Activity, GitFork, User, Clock, Users, Star, Trophy,
  Award, Layers, BarChart, Eye
} from 'lucide-react';
import api from '../../../api';
import ExpandableProgramModal from './ExpandableProgramModal';
import { getPostTypeDetails } from '../../../utils/postTypeUtils';


const programColors = getPostTypeDetails('program').colors;

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

  const getProgressColor = () => programColors.gradient;
  
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

  // Check if the program was forked
  const isForked = !!program.forked_from;

  const handleCardClick = (e) => {
    e.stopPropagation();
    setShowModal(true);
  };

  const handleExpandClick = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Handle program selection
  const handleProgramSelect = (selectedProgram) => {
    if (onProgramSelect) {
      onProgramSelect(selectedProgram);
    }
  };

  // Get difficulty label
  const getDifficultyLabel = (level) => {
    switch(level?.toLowerCase()) {
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'advanced': return 'Advanced';
      case 'expert': return 'Expert';
      default: return level || 'All Levels';
    }
  };

  return (
    <>
      <div 
        className="mt-4 bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Status Indicator Line */}
        <div className={`h-1 w-full bg-gradient-to-r ${programColors.gradient} opacity-75`} />
        
        <div className="p-4">
          {/* Header with basic info */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
              <div className={`${programColors.bg} p-2 rounded-lg`}>
                <Dumbbell className={`w-5 h-5 ${programColors.text}`} />
              </div>
                <h4 className="text-lg font-semibold text-white">
                  {program.name}
                </h4>
                {isForked && (
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-md flex items-center gap-1">
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
              <p className="mt-2 text-sm text-gray-300 line-clamp-2">{program.description}</p>
            </div>
            
            <button
              onClick={handleExpandClick}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors group"
              aria-label={isExpanded ? "Collapse program details" : "Expand program details"}
            >
              {isExpanded ? 
                <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-white" /> : 
                <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-white" />
              }
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Activity className="w-4 h-4 mr-1 text-blue-400" />
                <span>Workouts</span>
              </div>
              <p className="text-white font-bold text-lg">
                {program.workouts?.length || 0}
              </p>
            </div>
            
            <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Calendar className="w-4 h-4 mr-1 text-purple-400" />
                <span>Frequency</span>
              </div>
              <p className="text-white font-bold text-lg">
                {program.sessions_per_week}<span className="text-sm font-normal">/week</span>
              </p>
            </div>
            
            <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Target className="w-4 h-4 mr-1 text-indigo-400" />
                <span>Focus</span>
              </div>
              <p className="text-white font-bold text-lg flex items-center">
                <span className="capitalize mr-1">{program.focus.split('_')[0]}</span>
                {getFocusIcon(program.focus)}
              </p>
            </div>
            
            <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Users className="w-4 h-4 mr-1 text-red-400" />
                <span>Difficulty</span>
              </div>
              <p className="text-white font-bold text-lg capitalize">
                {getDifficultyLabel(program.difficulty_level)}
              </p>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-4 space-y-4">
              {/* Program Details Card */}
              <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700/50">
                <h5 className="font-medium text-white mb-3 flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-blue-400" />
                  Program Details
                </h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">{program.estimated_completion_weeks} weeks</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{new Date(program.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400">Likes:</span>
                    <span className="text-white">{program.likes_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400">Split:</span>
                    <span className="text-white capitalize">{program.workouts?.[0]?.split_method?.replace(/_/g, ' ') || "Various"}</span>
                  </div>
                </div>
                
                {program.tags && program.tags.length > 0 && (
                  <div className="mt-3">
                    <div className="text-gray-400 mb-2">Tags:</div>
                    <div className="flex flex-wrap gap-2">
                      {program.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-2 py-0.5 bg-gray-700/70 text-gray-300 rounded-md text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Workouts List */}
              {program.workouts && program.workouts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-white">Weekly Workouts</h5>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                      {program.workouts.length} total
                    </span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {program.workouts.map((workout, index) => (
                      <div key={index} className="bg-gray-800/80 rounded-lg p-3 border border-gray-700/50 hover:border-gray-600/50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${programColors.bg}`}>
                              <Dumbbell className={`w-4 h-4 ${programColors.text}`} />
                            </div>
                            <h6 className="font-medium text-white">{workout.name}</h6>
                          </div>
                          <span className="text-xs bg-gray-700/70 text-gray-300 px-2 py-1 rounded">
                            Day {workout.preferred_weekday + 1}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-400 flex items-center gap-3">
                          <span className="capitalize">{workout.split_method?.replace(/_/g, ' ') || "General"}</span>
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {workout.exercises?.length || 0} exercises
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* View Full Program Button */}
              <div className="text-center mt-2">
                <button 
                  className={`flex items-center gap-2 px-4 py-2 ${programColors.darkBg} ${programColors.hoverBg} ${programColors.text} rounded-lg transition-colors text-sm font-medium mx-auto`}
                  onClick={handleCardClick}
                >
                  <Eye className="w-4 h-4" />
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