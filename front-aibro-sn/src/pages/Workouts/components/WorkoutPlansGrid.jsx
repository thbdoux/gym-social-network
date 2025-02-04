import React from 'react';
import { Trash2, Activity, Calendar, Target, ChevronRight, Users } from 'lucide-react';

const WorkoutPlanCard = ({ plan, onSelect, onDelete, onToggleActive }) => {
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

  return (
    <div className="group relative bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1">
      {/* Progress Bar Background */}
      <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${getProgressColor(plan.focus)} opacity-75`} />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
              {plan.name}
            </h3>
            <p className="text-gray-400 mt-1">{plan.description}</p>
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

        {/* View Details Button */}
        <button
          onClick={() => onSelect(plan)}
          className="w-full bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center group"
        >
          <span>View Details</span>
          <ChevronRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
        </button>
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

const WorkoutPlansGrid = ({ plans, onSelect, onDelete, onToggleActive, onCreatePlan }) => {
  if (!plans || plans.length === 0) {
    return <EmptyState onCreatePlan={onCreatePlan} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {plans.map(plan => (
        <WorkoutPlanCard
          key={plan.id}
          plan={plan}
          onSelect={onSelect}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
        />
      ))}
    </div>
  );
};

export default WorkoutPlansGrid;