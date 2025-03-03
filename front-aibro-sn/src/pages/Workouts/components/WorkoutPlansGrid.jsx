import React, { useState } from 'react';
import { 
  Trash2, Activity, Calendar, Target, ChevronDown, ChevronUp, 
  Users, Share2, GitFork, Dumbbell, User, Clock, 
  Edit, BarChart, Eye, CheckCircle, X, Award, Trophy, Layers, Star
} from 'lucide-react';
import { getPostTypeDetails } from '../../../utils/postTypeUtils';
import ExpandableProgramModal from '../../MainFeed/components/ExpandableProgramModal';

const programColors = getPostTypeDetails('program').colors;

const WorkoutPlanCard = ({ plan, onSelect, onDelete, onToggleActive, onShare, onFork, onEdit, currentUser }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Check if current user is the creator of the plan
  const isCreator = plan.creator_username === currentUser;
  
  // Check if program has is_owner field directly from API
  const canShare = isCreator;
  const canFork = !isCreator;
  const canEdit = isCreator;
  
  // If the plan has a forked_from property, it means it was forked from another program
  const isForked = !!plan.forked_from;

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
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'advanced': return 'Advanced';
      case 'expert': return 'Expert';
      default: return level || 'All Levels';
    }
  };

  const handleCardClick = () => {
    setShowModal(true);
  };

  const handleButtonClick = (e, action) => {
    e.stopPropagation();
    action();
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="mt-4 bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer"
      >
        {/* Status Indicator Line */}
        <div className={`h-1 w-full bg-gradient-to-r ${programColors.gradient} opacity-75`} />
        
        <div className="p-4">
          {/* Header with basic info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={`${programColors.bg} p-2 rounded-lg`}>
                <Dumbbell className={`w-5 h-5 ${programColors.text}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold text-white">
                    {plan.name}
                  </h4>
                  {isForked && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <GitFork className="w-3 h-3" />
                      Forked
                    </span>
                  )}
                  <button
                    onClick={(e) => handleButtonClick(e, () => onToggleActive(plan.id))}
                    className={`p-1 rounded-md transition-colors ${
                      plan.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/30 text-gray-400'
                    }`}
                    title={plan.is_active ? "Active Program" : "Set as Active Program"}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center mt-1 text-sm text-gray-400">
                  <User className="w-4 h-4 mr-1" />
                  <span>by {plan.creator_username}</span>
                  {isForked && plan.forked_from && (
                    <span className="ml-2 text-xs text-gray-500">
                      (forked from {plan.forked_from.creator_username})
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {canShare && (
                <button
                  onClick={(e) => handleButtonClick(e, () => onShare(plan))}
                  className="p-2 hover:bg-purple-500/20 text-gray-400 hover:text-purple-400 rounded-lg transition-colors"
                  title="Share Program"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              )}
              
              {canFork && (
                <button
                  onClick={(e) => handleButtonClick(e, () => onFork(plan))}
                  className="p-2 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 rounded-lg transition-colors"
                  title="Fork Program"
                >
                  <GitFork className="w-5 h-5" />
                </button>
              )}

              {/* Add Edit button here */}
              {canEdit && onEdit && (
                <button
                  onClick={(e) => handleButtonClick(e, () => onEdit(plan))}
                  className="p-2 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 rounded-lg transition-colors"
                  title="Edit Program"
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={(e) => handleButtonClick(e, () => {
                  if (window.confirm(`Are you sure you want to delete "${plan.name}"?`)) {
                    onDelete(plan.id);
                  }
                })}
                className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                title="Delete Program"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              
              <button
                onClick={(e) => handleButtonClick(e, () => setIsExpanded(!isExpanded))}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                title={isExpanded ? "Collapse details" : "Expand details"}
              >
                {isExpanded ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </button>
            </div>
          </div>

          <p className="mt-2 text-sm text-gray-300 line-clamp-2">{plan.description}</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Activity className="w-4 h-4 mr-1 text-blue-400" />
                <span>Workouts</span>
              </div>
              <p className="text-white font-bold text-lg">
                {plan.workouts?.length || 0}
              </p>
            </div>
            
            <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Calendar className="w-4 h-4 mr-1 text-purple-400" />
                <span>Frequency</span>
              </div>
              <p className="text-white font-bold text-lg">
                {plan.sessions_per_week}<span className="text-sm font-normal">/week</span>
              </p>
            </div>
            
            <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Target className="w-4 h-4 mr-1 text-indigo-400" />
                <span>Focus</span>
              </div>
              <p className="text-white font-bold text-lg flex items-center">
                <span className="capitalize mr-1">{plan.focus.split('_')[0]}</span>
                {getFocusIcon(plan.focus)}
              </p>
            </div>
            
            <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Users className="w-4 h-4 mr-1 text-red-400" />
                <span>Difficulty</span>
              </div>
              <p className="text-white font-bold text-lg capitalize">
                {getDifficultyLabel(plan.difficulty_level)}
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
                    <span className="text-white">{plan.estimated_completion_weeks} weeks</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{new Date(plan.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400">Likes:</span>
                    <span className="text-white">{plan.likes_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-700/30">
                    <span className="text-gray-400">Split:</span>
                    <span className="text-white capitalize">{plan.workouts?.[0]?.split_method?.replace(/_/g, ' ') || "Various"}</span>
                  </div>
                </div>
                
                {plan.tags && plan.tags.length > 0 && (
                  <div className="mt-3">
                    <div className="text-gray-400 mb-2">Tags:</div>
                    <div className="flex flex-wrap gap-2">
                      {plan.tags.map(tag => (
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
              {plan.workouts && plan.workouts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-white">Weekly Workouts</h5>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                      {plan.workouts.length} total
                    </span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {plan.workouts.map((workout, index) => (
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
            </div>
          )}
        </div>
      </div>

      {/* Modal component */}
      <ExpandableProgramModal
        programId={plan.id}
        initialProgramData={plan}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onProgramSelect={onSelect}
      />
    </>
  );
};


const EmptyState = ({ onCreatePlan }) => (
  <div className="bg-gray-800 rounded-xl p-12 text-center">
    <div className="bg-gray-700/50 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
      <Users className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">No Workout Plans Yet</h3>
    <p className="text-gray-400 mb-6">Create your first workout plan to get started on your fitness journey</p>
    <button
      onClick={onCreatePlan}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center"
    >
      Create Your First Plan
    </button>
  </div>
);

const WorkoutPlansGrid = ({ 
  plans, 
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
  if (!plans || plans.length === 0) {
    return <EmptyState onCreatePlan={onCreatePlan} />;
  }
  // Use conditional class for grid columns
  const gridClass = singleColumn 
    ? "grid grid-cols-1 gap-6" 
    : "grid grid-cols-1 md:grid-cols-2 gap-6";

  return (
    <div className={gridClass}>
      {plans.map(plan => (
        <WorkoutPlanCard
          key={plan.id}
          plan={plan}
          onSelect={onSelect}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
          onShare={onShare}
          onFork={onFork}
          onEdit={onEdit}
          currentUser={currentUser}
        />
      ))}
    </div>
  );
};

export default WorkoutPlansGrid;