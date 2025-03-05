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
  const [isHovered, setIsHovered] = useState(false);

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
        className={`mt-4 bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 rounded-xl overflow-hidden border border-gray-700/50 transition-all duration-300 cursor-pointer transform ${isHovered ? 'shadow-md scale-[1.01]' : ''}`}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Status Indicator Line - Purple gradient */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-400 to-purple-500" />
        
        <div className="p-4">
          {/* Card Header - Enhanced with icon and better visual styling */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Program Icon */}
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Dumbbell className="w-5 h-5 text-purple-400" />
              </div>
              
              <div>
                <div className="flex items-center">
                  <h4 className="text-lg font-medium text-white group-hover:text-purple-400 transition-colors mr-2">
                    {program.name}
                  </h4>
                  {isForked && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <GitFork className="w-3 h-3" />
                      Forked
                    </span>
                  )}
                </div>
                
                <div className="flex items-center mt-1 text-sm text-gray-400">
                  <User className="w-3.5 h-3.5 mr-1.5" />
                  <span>{program.creator_username}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleExpandClick}
              className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Description - Show only if it exists and keep it brief */}
          {program.description && (
            <p className="mt-2 text-sm text-gray-300 line-clamp-2">{program.description}</p>
          )}

          {/* Key Stats - Enhanced with gradients and hover effects */}
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
              <p className="font-semibold text-white flex items-center">
                <span className="capitalize truncate">{program.focus?.split('_')[0] || 'General'}</span>
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-fuchsia-900/20 to-fuchsia-800/20 hover:from-fuchsia-900/30 hover:to-fuchsia-800/30 p-3 rounded-lg border border-fuchsia-700/30 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center text-xs text-gray-400 mb-1">
                <Users className="w-3.5 h-3.5 mr-1 text-fuchsia-400" />
                <span>Level</span>
              </div>
              <p className="font-semibold text-white capitalize truncate">
                {getDifficultyLabel(program.difficulty_level)}
              </p>
            </div>
          </div>
          
          {/* Animated highlight line on hover */}
          <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 w-0 ${isHovered ? 'w-full' : ''} transition-all duration-700`}></div>

          {/* Expanded View - Simplified to only essential info */}
          {isExpanded && (
            <div className="mt-4 space-y-4 animate-fadeIn">
              {/* Program Details Card - More focused info */}
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

              {/* Workouts Summary - Reduced to just a brief overview */}
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