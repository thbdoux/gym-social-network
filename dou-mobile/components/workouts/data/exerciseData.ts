// exerciseData.ts - Centralized data for exercise categories and exercises
export type ExerciseItem = {
    id: string;
    name: string;
    equipment?: string;
    targetMuscle?: string;
  };
  
  export type ExerciseCategory = {
    id: string;
    displayName: string;
    exercises: ExerciseItem[];
  };
  
  export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
    {
      id: 'chest',
      displayName: 'Chest',
      exercises: [
        { id: 'c1', name: 'Bench Press', equipment: 'Barbell', targetMuscle: 'Pectorals' },
        { id: 'c2', name: 'Incline Bench Press', equipment: 'Barbell', targetMuscle: 'Upper Pectorals' },
        { id: 'c3', name: 'Dumbbell Flyes', equipment: 'Dumbbells', targetMuscle: 'Pectorals' },
        { id: 'c4', name: 'Push-Ups', equipment: 'Bodyweight', targetMuscle: 'Pectorals' },
        { id: 'c5', name: 'Cable Crossover', equipment: 'Cable Machine', targetMuscle: 'Pectorals' },
        { id: 'c6', name: 'Chest Dips', equipment: 'Bodyweight', targetMuscle: 'Lower Pectorals' },
        { id: 'c7', name: 'Decline Bench Press', equipment: 'Barbell', targetMuscle: 'Lower Pectorals' },
        { id: 'c8', name: 'Pec Deck Machine', equipment: 'Machine', targetMuscle: 'Pectorals' }
      ]
    },
    {
      id: 'back',
      displayName: 'Back',
      exercises: [
        { id: 'b1', name: 'Pull-Ups', equipment: 'Bodyweight', targetMuscle: 'Latissimus Dorsi' },
        { id: 'b2', name: 'Lat Pulldown', equipment: 'Cable Machine', targetMuscle: 'Latissimus Dorsi' },
        { id: 'b3', name: 'Bent Over Row', equipment: 'Barbell', targetMuscle: 'Upper Back' },
        { id: 'b4', name: 'Seated Cable Row', equipment: 'Cable Machine', targetMuscle: 'Middle Back' },
        { id: 'b5', name: 'Deadlift', equipment: 'Barbell', targetMuscle: 'Lower Back' },
        { id: 'b6', name: 'T-Bar Row', equipment: 'Barbell', targetMuscle: 'Middle Back' },
        { id: 'b7', name: 'Single-Arm Dumbbell Row', equipment: 'Dumbbell', targetMuscle: 'Upper Back' },
        { id: 'b8', name: 'Chin-Ups', equipment: 'Bodyweight', targetMuscle: 'Latissimus Dorsi' }
      ]
    },
    {
      id: 'shoulders',
      displayName: 'Shoulders',
      exercises: [
        { id: 's1', name: 'Overhead Press', equipment: 'Barbell', targetMuscle: 'Deltoids' },
        { id: 's2', name: 'Lateral Raises', equipment: 'Dumbbells', targetMuscle: 'Lateral Deltoids' },
        { id: 's3', name: 'Face Pulls', equipment: 'Cable Machine', targetMuscle: 'Posterior Deltoids' },
        { id: 's4', name: 'Front Raises', equipment: 'Dumbbells', targetMuscle: 'Anterior Deltoids' },
        { id: 's5', name: 'Shrugs', equipment: 'Dumbbells/Barbell', targetMuscle: 'Trapezius' },
        { id: 's6', name: 'Arnold Press', equipment: 'Dumbbells', targetMuscle: 'Deltoids' },
        { id: 's7', name: 'Upright Row', equipment: 'Barbell', targetMuscle: 'Deltoids, Trapezius' },
        { id: 's8', name: 'Reverse Flyes', equipment: 'Dumbbells', targetMuscle: 'Posterior Deltoids' }
      ]
    },
    {
      id: 'arms',
      displayName: 'Arms',
      exercises: [
        { id: 'a1', name: 'Bicep Curls', equipment: 'Dumbbells/Barbell', targetMuscle: 'Biceps' },
        { id: 'a2', name: 'Tricep Pushdowns', equipment: 'Cable Machine', targetMuscle: 'Triceps' },
        { id: 'a3', name: 'Hammer Curls', equipment: 'Dumbbells', targetMuscle: 'Brachialis, Biceps' },
        { id: 'a4', name: 'Skull Crushers', equipment: 'Barbell/EZ Bar', targetMuscle: 'Triceps' },
        { id: 'a5', name: 'Dips', equipment: 'Bodyweight', targetMuscle: 'Triceps' },
        { id: 'a6', name: 'Preacher Curls', equipment: 'Barbell/EZ Bar', targetMuscle: 'Biceps' },
        { id: 'a7', name: 'Tricep Kickbacks', equipment: 'Dumbbells', targetMuscle: 'Triceps' },
        { id: 'a8', name: 'Concentration Curls', equipment: 'Dumbbell', targetMuscle: 'Biceps' }
      ]
    },
    {
      id: 'legs',
      displayName: 'Legs',
      exercises: [
        { id: 'l1', name: 'Squats', equipment: 'Barbell', targetMuscle: 'Quadriceps, Glutes' },
        { id: 'l2', name: 'Leg Press', equipment: 'Machine', targetMuscle: 'Quadriceps, Glutes' },
        { id: 'l3', name: 'Lunges', equipment: 'Bodyweight/Dumbbells', targetMuscle: 'Quadriceps, Glutes' },
        { id: 'l4', name: 'Leg Extensions', equipment: 'Machine', targetMuscle: 'Quadriceps' },
        { id: 'l5', name: 'Leg Curls', equipment: 'Machine', targetMuscle: 'Hamstrings' },
        { id: 'l6', name: 'Romanian Deadlift', equipment: 'Barbell', targetMuscle: 'Hamstrings, Glutes' },
        { id: 'l7', name: 'Calf Raises', equipment: 'Machine/Bodyweight', targetMuscle: 'Calves' },
        { id: 'l8', name: 'Hip Thrusts', equipment: 'Barbell', targetMuscle: 'Glutes' }
      ]
    },
    {
      id: 'core',
      displayName: 'Core',
      exercises: [
        { id: 'ab1', name: 'Crunches', equipment: 'Bodyweight', targetMuscle: 'Rectus Abdominis' },
        { id: 'ab2', name: 'Plank', equipment: 'Bodyweight', targetMuscle: 'Core' },
        { id: 'ab3', name: 'Russian Twists', equipment: 'Bodyweight/Weight', targetMuscle: 'Obliques' },
        { id: 'ab4', name: 'Leg Raises', equipment: 'Bodyweight', targetMuscle: 'Lower Abs' },
        { id: 'ab5', name: 'Ab Rollout', equipment: 'Ab Wheel', targetMuscle: 'Core' },
        { id: 'ab6', name: 'Mountain Climbers', equipment: 'Bodyweight', targetMuscle: 'Core, Hip Flexors' },
        { id: 'ab7', name: 'Bicycle Crunches', equipment: 'Bodyweight', targetMuscle: 'Rectus Abdominis, Obliques' },
        { id: 'ab8', name: 'Dead Bug', equipment: 'Bodyweight', targetMuscle: 'Deep Core Stabilizers' }
      ]
    },
    {
      id: 'cardio',
      displayName: 'Cardio',
      exercises: [
        { id: 'ca1', name: 'Treadmill', equipment: 'Machine', targetMuscle: 'Cardiovascular System' },
        { id: 'ca2', name: 'Rowing Machine', equipment: 'Machine', targetMuscle: 'Cardiovascular System, Full Body' },
        { id: 'ca3', name: 'Cycling', equipment: 'Machine/Bicycle', targetMuscle: 'Cardiovascular System, Legs' },
        { id: 'ca4', name: 'Jumping Jacks', equipment: 'Bodyweight', targetMuscle: 'Cardiovascular System' },
        { id: 'ca5', name: 'Jump Rope', equipment: 'Jump Rope', targetMuscle: 'Cardiovascular System' },
        { id: 'ca6', name: 'Burpees', equipment: 'Bodyweight', targetMuscle: 'Cardiovascular System, Full Body' },
        { id: 'ca7', name: 'Stair Climber', equipment: 'Machine', targetMuscle: 'Cardiovascular System, Legs' },
        { id: 'ca8', name: 'Elliptical Trainer', equipment: 'Machine', targetMuscle: 'Cardiovascular System' }
      ]
    }
  ];
  
  // Helper function to get all exercises in a flat list
  export const getAllExercises = (): ExerciseItem[] => {
    return EXERCISE_CATEGORIES.flatMap(category => category.exercises);
  };
  
  // Helper function to get exercises by category id
  export const getExercisesByCategory = (categoryId: string): ExerciseItem[] => {
    const category = EXERCISE_CATEGORIES.find(cat => cat.id === categoryId);
    return category ? category.exercises : [];
  };
  
  // Helper function to search exercises
  export const searchExercises = (query: string): ExerciseItem[] => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];
    
    return getAllExercises().filter(exercise => 
      exercise.name.toLowerCase().includes(normalizedQuery) ||
      (exercise.equipment && exercise.equipment.toLowerCase().includes(normalizedQuery)) ||
      (exercise.targetMuscle && exercise.targetMuscle.toLowerCase().includes(normalizedQuery))
    );
  };