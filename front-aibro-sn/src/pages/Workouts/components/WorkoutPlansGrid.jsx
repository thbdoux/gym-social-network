import React from 'react';
import { Trash2, Activity, Calendar, Target, ChevronRight, Users, Share2, GitFork } from 'lucide-react';

const WorkoutPlanCard = ({ plan, onSelect, onDelete, onToggleActive, onShare, onFork, currentUser }) => {
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

  // Check if current user is the creator of the plan
  const isCreator = plan.creator_username === currentUser;
  
  // Check if program has is_owner field directly from API
  const canShare = isCreator;
  const canFork = !isCreator;
  
  // If the plan has a forked_from property, it means it was forked from another program
  const isForked = !!plan.forked_from;

  return (
    <div className="group relative bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1">
      {/* Progress Bar Background */}
      <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${getProgressColor(plan.focus)} opacity-75`} />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                {plan.name}
              </h3>
              {isForked && (
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-md flex items-center gap-1">
                  <GitFork className="w-3 h-3" />
                  Forked
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">by {plan.creator_username}</p>
            <p className="text-gray-400 mt-1">{plan.description}</p>
            {isForked && plan.forked_from && (
              <p className="text-xs text-gray-500 mt-1">
                Forked from {plan.forked_from.creator_username || "another user"}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleActive(plan.id);
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300
                ${plan.is_active 
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'}`}
            >
              {plan.is_active ? 'Active' : 'Inactive'}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(plan.id);
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center text-gray-400 mb-1">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm">Frequency</span>
            </div>
            <p className="text-lg font-semibold text-white">
              {plan.sessions_per_week}x weekly
            </p>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center text-gray-400 mb-1">
              <Target className="w-4 h-4 mr-2" />
              <span className="text-sm">Focus</span>
            </div>
            <p className="text-lg font-semibold text-white capitalize">
              {plan.focus.replace(/_/g, ' ')}
            </p>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center text-gray-400 mb-1">
              <Activity className="w-4 h-4 mr-2" />
              <span className="text-sm">Workouts</span>
            </div>
            <p className="text-lg font-semibold text-white">
              {plan.workouts?.length || 0} exercises
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Share Button - Only show if user is creator */}
          {canShare && onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(plan);
              }}
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          )}
          
          {/* Fork Button - Only show if user is NOT the creator */}
          {canFork && onFork && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFork(plan);
              }}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <GitFork className="w-4 h-4" />
              <span>Fork Program</span>
            </button>
          )}
          
          {/* View Details Button - Make it full width if there's only one button */}
          <button
            onClick={() => onSelect(plan)}
            className={`bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center group ${((!canShare && !canFork) || (!onShare && !onFork)) ? "col-span-2" : ""}`}
          >
            <span>View Details</span>
            <ChevronRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
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
          currentUser={currentUser}
        />
      ))}
    </div>
  );
};

export default WorkoutPlansGrid;