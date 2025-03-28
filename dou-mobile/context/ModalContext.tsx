// context/ModalContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { View } from 'react-native'; // Import View component
import ProgramDetailModal from '../components/workouts/ProgramDetailModal';
import WorkoutLogDetailModal from '../components/workouts/WorkoutLogDetailModal';
import { useAuth } from '../hooks/useAuth';

// Program Types
interface Program {
  id: number;
  name: string;
  description?: string;
  focus: string;
  difficulty_level: string;
  creator_username: string;
  is_active: boolean;
  sessions_per_week: number;
  estimated_completion_weeks: number;
  created_at: string;
  workouts?: any[];
  tags?: string[];
  forked_from?: number;
  is_public?: boolean;
  is_shared_with_me?: boolean;
  activeWeekday?: number;
  activeWorkoutId?: number;
}

// WorkoutLog Types
interface Exercise {
  id: number;
  name: string;
  sets?: any[];
  note?: string;
}

interface WorkoutLog {
  id: number;
  name: string;
  workout_name?: string;
  date: string;
  duration?: number;
  completed: boolean;
  username?: string;
  gym_name?: string;
  gym_location?: string;
  gym?: number;
  program_name?: string;
  exercises?: Exercise[];
  exercise_count?: number;
  mood_rating?: number;
  perceived_difficulty?: number;
  notes?: string;
  activeExerciseId?: number;
}

// Modal Context Type
interface ModalContextType {
  // Program Detail Modal
  isProgramDetailOpen: boolean;
  currentProgram: Program | null;
  openProgramDetail: (program: Program) => void;
  closeProgramDetail: () => void;
  
  // Workout Log Detail Modal
  isWorkoutLogDetailOpen: boolean;
  currentWorkoutLog: WorkoutLog | null;
  openWorkoutLogDetail: (log: WorkoutLog) => void;
  closeWorkoutLogDetail: () => void;
}

// Create the context
const ModalContext = createContext<ModalContextType | undefined>(undefined);

// Provider component
export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentUsername = user?.username || '';
  
  // Program Detail Modal state
  const [isProgramDetailOpen, setIsProgramDetailOpen] = useState(false);
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
  
  // Workout Log Detail Modal state
  const [isWorkoutLogDetailOpen, setIsWorkoutLogDetailOpen] = useState(false);
  const [currentWorkoutLog, setCurrentWorkoutLog] = useState<WorkoutLog | null>(null);
  
  // Debug logs to help troubleshoot modal visibility issues
  useEffect(() => {
    console.log("Modal state changed:", { isProgramDetailOpen, isWorkoutLogDetailOpen });
    console.log("Current program:", currentProgram?.name);
  }, [isProgramDetailOpen, isWorkoutLogDetailOpen, currentProgram]);
  
  // Program Detail Modal handlers
  const openProgramDetail = (program: Program) => {
    console.log("Opening program detail for:", program.name);
    setCurrentProgram(program);
    
    // Use a short timeout to ensure the state updates before showing the modal
    // This helps prevent rendering issues
    setTimeout(() => {
      setIsProgramDetailOpen(true);
    }, 50);
  };
  
  const closeProgramDetail = () => {
    console.log("Closing program detail");
    setIsProgramDetailOpen(false);
    // Reset after animation finishes
    setTimeout(() => setCurrentProgram(null), 300);
  };
  
  // Workout Log Detail Modal handlers
  const openWorkoutLogDetail = (log: WorkoutLog) => {
    console.log("Opening workout log detail for:", log.name);
    setCurrentWorkoutLog(log);
    
    // Use a short timeout to ensure the state updates before showing the modal
    setTimeout(() => {
      setIsWorkoutLogDetailOpen(true);
    }, 50);
  };
  
  const closeWorkoutLogDetail = () => {
    console.log("Closing workout log detail");
    setIsWorkoutLogDetailOpen(false);
    // Reset after animation finishes
    setTimeout(() => setCurrentWorkoutLog(null), 300);
  };
  
  // Program Detail Modal callbacks
  const handleProgramEdit = (program: Program) => {
    // Add your edit logic here
    console.log("Edit program:", program.name);
    closeProgramDetail();
  };
  
  const handleProgramDelete = (programId: number) => {
    // Add your delete logic here
    console.log("Delete program:", programId);
    closeProgramDetail();
  };
  
  const handleProgramToggleActive = async (programId: number) => {
    // Add your toggle active logic here
    console.log("Toggle active program:", programId);
    return Promise.resolve();
  };
  
  const handleProgramShare = (program: Program) => {
    // Add your share logic here
    console.log("Share program:", program.name);
    closeProgramDetail();
  };
  
  const handleProgramFork = async (programId: number) => {
    // Add your fork logic here
    console.log("Fork program:", programId);
    closeProgramDetail();
    return Promise.resolve();
  };
  
  const handleWorkoutSelect = (workoutId: number) => {
    // Add your workout select logic here
    console.log("Select workout:", workoutId);
    closeProgramDetail();
  };
  
  // Workout Log Detail Modal callbacks
  const handleWorkoutLogEdit = (log: WorkoutLog) => {
    // Add your edit logic here
    console.log("Edit workout log:", log.name);
    closeWorkoutLogDetail();
  };
  
  const handleWorkoutLogDelete = (logId: number) => {
    // Add your delete logic here
    console.log("Delete workout log:", logId);
    closeWorkoutLogDetail();
  };
  
  const handleWorkoutLogFork = async (logId: number) => {
    // Add your fork logic here
    console.log("Fork workout log:", logId);
    closeWorkoutLogDetail();
    return Promise.resolve();
  };
  
  const handleExerciseSelect = (exerciseId: number) => {
    // Add your exercise select logic here
    console.log("Select exercise:", exerciseId);
    closeWorkoutLogDetail();
  };
  
  return (
    <ModalContext.Provider
      value={{
        isProgramDetailOpen,
        currentProgram,
        openProgramDetail,
        closeProgramDetail,
        isWorkoutLogDetailOpen,
        currentWorkoutLog,
        openWorkoutLogDetail,
        closeWorkoutLogDetail
      }}
    >
      {children}
      
      {/* Wrap modals in a View to prevent direct text rendering issues */}
      <View>
        {currentProgram && (
          <ProgramDetailModal
            visible={isProgramDetailOpen}
            program={currentProgram}
            onClose={closeProgramDetail}
            currentUser={currentUsername}
            onEdit={handleProgramEdit}
            onDelete={handleProgramDelete}
            onToggleActive={handleProgramToggleActive}
            onShare={handleProgramShare}
            onFork={handleProgramFork}
            onWorkoutSelect={handleWorkoutSelect}
          />
        )}
        
        {currentWorkoutLog && (
          <WorkoutLogDetailModal
            visible={isWorkoutLogDetailOpen}
            log={currentWorkoutLog}
            onClose={closeWorkoutLogDetail}
            currentUser={currentUsername}
            onEdit={handleWorkoutLogEdit}
            onDelete={handleWorkoutLogDelete}
            onFork={handleWorkoutLogFork}
            onExerciseSelect={handleExerciseSelect}
          />
        )}
      </View>
    </ModalContext.Provider>
  );
};

// Custom hook to use the modal context
export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};