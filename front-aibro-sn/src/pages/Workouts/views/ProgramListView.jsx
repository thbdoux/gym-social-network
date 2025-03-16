import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Loader2, Search, X, AlertCircle, CheckCircle } from 'lucide-react';
import { ProgramGrid } from '../components/ProgramCard';
import EmptyState from '../components/EmptyState';
import ShareProgramModal from '../components/ShareProgramModal';

// Import React Query hooks
import { 
  usePrograms,
  useForkProgram, 
  useToggleProgramActive, 
  useDeleteProgram,
  useShareProgram
} from '../../../hooks/query/useProgramQuery';
import { useQueryClient } from '@tanstack/react-query';

const ProgramListView = ({ setView, user, onPlanSelect }) => {
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [programToShare, setProgramToShare] = useState(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);
  const [activeToggleLoading, setActiveToggleLoading] = useState(false);

  // React Query setup
  const queryClient = useQueryClient();

  // Fetch programs with React Query
  const { 
    data: workoutPlans = [], 
    isLoading, 
    isError 
  } = usePrograms();

  // Mutation hooks
  const forkProgramMutation = useForkProgram();
  const toggleActiveMutation = useToggleProgramActive();
  const deleteProgramMutation = useDeleteProgram();
  const shareProgramMutation = useShareProgram();

  // Derived state
  const hasPlans = workoutPlans.length > 0;
  
  // Check if there's any active program
  const activeProgram = workoutPlans.find(program => program.is_active);

  // Filter programs by search query and access permissions
  const getAccessiblePrograms = () => {
    const accessiblePlans = workoutPlans.filter(plan => 
      plan.is_owner || 
      plan.program_shares?.length > 0 || 
      plan.forked_from !== null
    );
    
    if (!searchQuery) return accessiblePlans;
    
    const query = searchQuery.toLowerCase();
    return accessiblePlans.filter(plan => 
      plan.name?.toLowerCase().includes(query) ||
      plan.description?.toLowerCase().includes(query) ||
      plan.creator_username?.toLowerCase().includes(query)
    );
  };

  // Event handlers
  const handlePlanSelection = (plan) => {
    if (!plan.is_owner && !plan.program_shares?.length && plan.forked_from === null) {
      console.error('Unauthorized access attempt to plan:', plan.id);
      alert('You do not have permission to view this program.');
      return;
    }
    
    onPlanSelect(plan);
  };
  
  const handleDeletePlan = async (planId) => {
    setProgramToDelete(planId);
    setIsConfirmingDelete(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteProgramMutation.mutateAsync(programToDelete);
      // No need to manually update state as React Query will handle cache updates
    } catch (err) {
      console.error('Error deleting plan:', err);
      alert('Failed to delete program. Please try again.');
    } finally {
      setIsConfirmingDelete(false);
      setProgramToDelete(null);
    }
  };

  const handleToggleActive = async (planId) => {
    try {
      setActiveToggleLoading(true);
      
      // Get the current state of the program
      const program = workoutPlans.find(p => p.id === planId);
      const isActivating = !program.is_active;
      
      if (isActivating && activeProgram) {
        // If we're activating a program and there's already an active one, first deactivate the current active program
        // This is handled by the backend, but we can do optimistic updates in the UI
        
        // Optimistic update for the UI - turn off all programs first
        queryClient.setQueryData(['programs', 'list'], old => {
          if (!old) return [];
          return old.map(p => ({
            ...p,
            is_active: false
          }));
        });
      }
      
      await toggleActiveMutation.mutateAsync(planId);
      
      // React Query will now update the cache with the latest data
    } catch (err) {
      console.error('Error toggling plan active state:', err);
      alert('Failed to toggle active status. Please try again.');
      
      // Reset cache in case our optimistic update failed
      queryClient.invalidateQueries(['programs', 'list']);
    } finally {
      setActiveToggleLoading(false);
    }
  };

  const handleShareProgram = (program) => {
    setProgramToShare(program);
    setShowShareModal(true);
  };

  const handleShareSubmit = async (programId, shareData) => {
    try {
      await shareProgramMutation.mutateAsync({ programId, shareData });
      setShowShareModal(false);
      setProgramToShare(null);
    } catch (err) {
      console.error('Error sharing program:', err);
      alert('Failed to share program. Please try again.');
    }
  };

  const handleForkProgram = async (program) => {
    try {
      if (window.confirm(`Do you want to fork "${program.name}" by ${program.creator_username}?`)) {
        const forkedProgram = await forkProgramMutation.mutateAsync(program.id);
        onPlanSelect(forkedProgram);
      }
    } catch (err) {
      console.error('Error forking program:', err);
      alert('Failed to fork program. Please try again.');
    }
  };

  const handleCreateProgram = () => {
    setView('create-plan');
  };

  // Loading state
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

  // Error state
  if (isError) {
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
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-6 py-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Error Loading Programs</h3>
          <p>We couldn't load your workout programs. Please try again later.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white"
          >
            Retry
          </button>
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
            onClick={handleCreateProgram}
            className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 
                      transition-all shadow-lg shadow-blue-700/20"
            title="Create New Program"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Active Program Banner - only show if there's an active program */}
      {activeProgram && (
        <div className="bg-green-900/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <div>
              <span className="font-medium">Active Program: </span>
              <span className="text-white">{activeProgram.name}</span>
            </div>
          </div>
          <button
            onClick={() => handleToggleActive(activeProgram.id)}
            className="px-3 py-1.5 bg-green-600/30 hover:bg-green-600/50 rounded-lg text-sm"
            disabled={activeToggleLoading}
          >
            {activeToggleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Deactivate'
            )}
          </button>
        </div>
      )}

      {/* Programs Grid */}
      {hasPlans ? (
        <ProgramGrid
          programs={getAccessiblePrograms()}
          onSelect={handlePlanSelection}
          onDelete={handleDeletePlan}
          onToggleActive={handleToggleActive}
          onCreatePlan={handleCreateProgram}
          onShare={handleShareProgram}
          onFork={handleForkProgram}
          onEdit={handlePlanSelection}
          currentUser={user?.username}
          activeProgram={activeProgram}
          isToggleLoading={activeToggleLoading}
        />
      ) : (
        <EmptyState
          title="No workout plans yet"
          description="Create your first workout plan to start tracking your fitness journey"
          action={{
            label: 'Create Workout Plan',
            onClick: handleCreateProgram
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
          onSubmit={handleShareSubmit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isConfirmingDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700/50">
            <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this program? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsConfirmingDelete(false);
                  setProgramToDelete(null);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramListView;