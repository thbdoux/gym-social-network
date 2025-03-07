import React, { useState } from 'react';
import { 
  Trash2, Activity, Calendar, Target, ChevronDown, ChevronUp, 
  Users, Share2, GitFork, Dumbbell, User, 
  Edit, BarChart, CheckCircle, Award, Trophy, Layers, Star
} from 'lucide-react';
import { getPostTypeDetails } from '../../../utils/postTypeUtils';
import ExpandableProgramModal from '../../MainFeed/components/ExpandableProgramModal';

const programColors = getPostTypeDetails('program').colors;

const ProgramCard = ({ plan, onSelect, onDelete, onToggleActive, onShare, onFork, onEdit, currentUser }) => {
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
        className="w-full bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border border-gray-700/50 rounded-xl overflow-hidden shadow-sm transition-all duration-300 cursor-pointer group hover:shadow-lg hover:scale-[1.01]"
      >
        {/* Status Indicator Line - Subtle purple gradient */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-400 to-purple-500" />
        
        <div className="p-4">
          {/* Card Header - Simplified to focus on essentials */}
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {plan.name}
            </h4>
            
            {/* Active Program Indicator */}
            {plan.is_active && (
              <span className="flex items-center text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </span>
            )}
          </div>

          {/* Creator Info */}
          <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
            <User className="w-3.5 h-3.5 mr-1.5" />
            <span>{plan.creator_username}</span>
            {isForked && (
              <span className="ml-2 inline-flex items-center text-xs text-purple-600 dark:text-purple-400">
                <GitFork className="w-3 h-3 mr-1" />
                Forked
              </span>
            )}
          </div>
          
          {/* Description - Show only if it exists and keep it brief */}
          {plan.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{plan.description}</p>
          )}

          {/* Key Stats - Simplified grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Dumbbell className="w-3.5 h-3.5 mr-1 text-purple-500" />
                <span>Workouts</span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {plan.workouts?.length || 0}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Calendar className="w-3.5 h-3.5 mr-1 text-purple-500" />
                <span>Days/Week</span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {plan.sessions_per_week}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Target className="w-3.5 h-3.5 mr-1 text-purple-500" />
                <span>Focus</span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="capitalize truncate">{plan.focus?.split('_')[0] || 'General'}</span>
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Users className="w-3.5 h-3.5 mr-1 text-purple-500" />
                <span>Level</span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white capitalize truncate">
                {getDifficultyLabel(plan.difficulty_level)}
              </p>
            </div>
          </div>

          {/* Action Bar - Only revealed on hover for cleaner UI */}
          <div className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1">
              {canShare && (
                <button
                  onClick={(e) => handleButtonClick(e, () => onShare(plan))}
                  className="p-1.5 text-gray-400 hover:text-purple-500 rounded-md transition-colors"
                  title="Share Program"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
              
              {canFork && (
                <button
                  onClick={(e) => handleButtonClick(e, () => onFork(plan))}
                  className="p-1.5 text-gray-400 hover:text-purple-500 rounded-md transition-colors"
                  title="Fork Program"
                >
                  <GitFork className="w-4 h-4" />
                </button>
              )}

              {canEdit && onEdit && (
                <button
                  onClick={(e) => handleButtonClick(e, () => onEdit(plan))}
                  className="p-1.5 text-gray-400 hover:text-purple-500 rounded-md transition-colors"
                  title="Edit Program"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={(e) => handleButtonClick(e, () => {
                  if (window.confirm(`Are you sure you want to delete "${plan.name}"?`)) {
                    onDelete(plan.id);
                  }
                })}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                title="Delete Program"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            {!plan.is_active && (
              <button
                onClick={(e) => handleButtonClick(e, () => onToggleActive(plan.id))}
                className="text-xs text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 py-1 px-2 flex items-center rounded-full"
                title="Set as Active Program"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                <span>Set Active</span>
              </button>
            )}
            
            <button
              onClick={(e) => handleButtonClick(e, () => setIsExpanded(!isExpanded))}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-md transition-colors"
              aria-label={isExpanded ? "Show less" : "Show more"}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Expanded View - Simplified to only essential info */}
          {isExpanded && (
            <div className="mt-4 space-y-4 animate-fadeIn">
              {/* Program Details Card - More focused info */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-2">Program Details</h5>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{plan.estimated_completion_weeks} weeks</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400">Created:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{new Date(plan.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Tags - Only show if they exist */}
                {plan.tags && plan.tags.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tags:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Workouts List - Collapsed by default, simplified view */}
              {plan.workouts && plan.workouts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900 dark:text-white text-sm">Weekly Schedule</h5>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {plan.workouts.map((workout, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs mr-2">
                            {workout.preferred_weekday + 1}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{workout.name}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Dumbbell className="w-3 h-3 mr-1" />
                          {workout.exercises?.length || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal component - unchanged */}
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

// EmptyState redesigned to be more encouraging and cleaner
const EmptyState = ({ onCreatePlan }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
    <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
      <Dumbbell className="w-8 h-8 text-purple-600 dark:text-purple-400" />
    </div>
    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Ready to start your journey?</h3>
    <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-sm mx-auto">Create your first workout plan and start making progress toward your fitness goals</p>
    <button
      onClick={onCreatePlan}
      className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg transition-colors inline-flex items-center shadow-sm"
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
    ? "grid grid-cols-1 gap-4" 
    : "grid grid-cols-1 md:grid-cols-2 gap-4";

  return (
    <div className={gridClass}>
      {plans.map(plan => (
        <ProgramCard
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