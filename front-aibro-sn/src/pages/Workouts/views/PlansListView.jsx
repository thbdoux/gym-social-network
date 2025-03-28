import React, { useState } from 'react';
import { Plus, ArrowLeft, Loader2, Search, X } from 'lucide-react';
import { ProgramCard, ProgramGrid } from '../components/ProgramCard';
import EmptyState from '../components/EmptyState';
import ShareProgramModal from '../components/ShareProgramModal';
import { programService } from '../../../api/services';

const PlansListView = ({
  workoutPlans,
  isLoading = false,
  onPlanSelect,
  setView,
  user,
  deletePlan,
  togglePlanActive,
  onShareProgram,
  onForkProgram,
  onEditProgram
}) => {
  // State management
  const [showShareModal, setShowShareModal] = useState(false);
  const [programToShare, setProgramToShare] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Check if there are any workout plans
  const hasPlans = workoutPlans.length > 0;

  // Add an access verification wrapper function
  const handlePlanSelection = (plan) => {
    // Double-check access permission based on ownership
    if (!plan.is_owner && !plan.program_shares?.length && plan.forked_from === null) {
      console.error('Unauthorized access attempt to plan:', plan.id);
      alert('You do not have permission to view this program.');
      return;
    }
    
    onPlanSelect(plan);
  };
  
  // Filter programs shown in the list to only those the user should see
  const getAccessiblePrograms = () => {
    // First filter for access permissions
    const accessiblePlans = workoutPlans.filter(plan => 
      plan.is_owner || 
      plan.program_shares?.length > 0 || 
      plan.forked_from !== null
    );
    
    // Then apply search filter if there's a query
    if (!searchQuery) return accessiblePlans;
    
    return accessiblePlans.filter(plan => 
      plan.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.creator_username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const handleDeletePlan = async (planId) => {
    try {
      await deletePlan(planId);
    } catch (err) {
      console.error('Error deleting plan:', err);
    }
  };

  const handleToggleActive = async (planId) => {
    try {
      setToggleLoading(true);
      await togglePlanActive(planId);
    } catch (err) {
      console.error('Error toggling plan active state:', err);
      alert('Failed to toggle active status. Please try again.');
    } finally {
      setToggleLoading(false);
    }
  };

  const handleShareProgram = (program) => {
    if (onShareProgram) {
      onShareProgram(program);
    } else {
      setProgramToShare(program);
      setShowShareModal(true);
    }
  };

  const handleForkProgram = async (program) => {
    if (onForkProgram) {
      onForkProgram(program);
    } else {
      try {
        if (window.confirm(`Do you want to fork "${program.name}" by ${program.creator_username}?`)) {
          // Use programService instead of direct API call
          const forkedProgram = await programService.forkProgram(program.id);
          // Redirect to the newly forked program
          onPlanSelect(forkedProgram);
        }
      } catch (err) {
        console.error('Error forking program:', err);
        alert('Failed to fork program. Please try again.');
      }
    }
  };

  const handleEditProgram = (plan) => {
    onPlanSelect(plan);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4 mb-2">
            <button
              onClick={() => setView('main')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Back to Workout Logs"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
            <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">Your Programs</h1>
          </div>
        </div>
        <div className="flex justify-center items-center p-12">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <div className="flex items-center">
            <button
              onClick={() => setView('main')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors mr-2"
              title="Back to Workout Logs"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
            <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">
              Your Programs
            </h1>
          </div>
          <p className="text-gray-400 ml-10 text-sm">Design structured fitness journeys to transform your body and mind.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Search bar */}
          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search programs..."
              className="pl-9 w-full bg-gray-800 rounded-lg py-2 text-white placeholder-gray-500 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm h-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setView('create-plan')}
            className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 
                     transition-all shadow-lg shadow-blue-700/20"
            title="Create New Program"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      {hasPlans ? (
        <ProgramGrid
          programs={getAccessiblePrograms()}
          onSelect={handlePlanSelection}
          onDelete={handleDeletePlan}
          onToggleActive={handleToggleActive}
          onCreatePlan={() => setView('create-plan')}
          onShare={handleShareProgram}
          onFork={handleForkProgram}
          onEdit={onEditProgram}
          currentUser={user?.username}
        />
      ) : (
        <EmptyState
          title="No workout plans yet"
          description="Create your first workout plan to start tracking your fitness journey"
          action={{
            label: 'Create Workout Plan',
            onClick: () => setView('create-plan')
          }}
        />
      )}

      {/* Share Program Modal */}
      {showShareModal && programToShare && (
        <ShareProgramModal 
          program={programToShare}
          onClose={() => {
            setShowShareModal(false);
            setProgramToShare(null);
          }}
        />
      )}
    </div>
  );
};

export default PlansListView;