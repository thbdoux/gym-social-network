// exerciseData.ts - Enhanced with translation support and more exercises
import translations from '../../../utils/translations';

export type ExerciseItem = {
  id: string;
  nameKey: string; // Translation key for exercise name
  equipment?: string;
  equipmentKey?: string; // Translation key for equipment
  targetMuscle?: string;
  targetMuscleKey?: string; // Translation key for target muscle
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  favorite?: boolean;
};

export type ExerciseCategory = {
  id: string;
  displayNameKey: string; // Translation key for category display name
  iconName?: string; // Ionicons name
  exercises: ExerciseItem[];
};

export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  {
    id: 'chest',
    displayNameKey: 'category_chest',
    iconName: 'fitness-outline',
    exercises: [
      { id: 'c1', nameKey: 'exercise_bench_press', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_pectorals', difficulty: 'intermediate' },
      { id: 'c2', nameKey: 'exercise_incline_bench_press', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_upper_pectorals', difficulty: 'intermediate' },
      { id: 'c3', nameKey: 'exercise_dumbbell_flyes', equipmentKey: 'equipment_dumbbells', targetMuscleKey: 'muscle_pectorals', difficulty: 'intermediate' },
      { id: 'c4', nameKey: 'exercise_push_ups', equipmentKey: 'equipment_bodyweight', targetMuscleKey: 'muscle_pectorals', difficulty: 'beginner' },
      { id: 'c5', nameKey: 'exercise_cable_crossover', equipmentKey: 'equipment_cable_machine', targetMuscleKey: 'muscle_pectorals', difficulty: 'intermediate' },
      { id: 'c6', nameKey: 'exercise_chest_dips', equipmentKey: 'equipment_bodyweight', targetMuscleKey: 'muscle_lower_pectorals', difficulty: 'intermediate' },
      { id: 'c7', nameKey: 'exercise_decline_bench_press', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_lower_pectorals', difficulty: 'intermediate' },
      { id: 'c8', nameKey: 'exercise_pec_deck_machine', equipmentKey: 'equipment_machine', targetMuscleKey: 'muscle_pectorals', difficulty: 'beginner' },
      { id: 'c9', nameKey: 'exercise_dumbbell_bench_press', equipmentKey: 'equipment_dumbbells', targetMuscleKey: 'muscle_pectorals', difficulty: 'intermediate' },
      { id: 'c10', nameKey: 'exercise_landmine_press', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_pectorals', difficulty: 'advanced' },
      { id: 'c11', nameKey: 'exercise_svend_press', equipmentKey: 'equipment_plate', targetMuscleKey: 'muscle_pectorals', difficulty: 'intermediate' },
      { id: 'c12', nameKey: 'exercise_floor_press', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_pectorals', difficulty: 'intermediate' }
    ]
  },
  {
    id: 'back',
    displayNameKey: 'category_back',
    iconName: 'body-outline',
    exercises: [
      { id: 'b1', nameKey: 'exercise_pull_ups', equipmentKey: 'equipment_bodyweight', targetMuscleKey: 'muscle_latissimus_dorsi', difficulty: 'intermediate' },
      { id: 'b2', nameKey: 'exercise_lat_pulldown', equipmentKey: 'equipment_cable_machine', targetMuscleKey: 'muscle_latissimus_dorsi', difficulty: 'beginner' },
      { id: 'b3', nameKey: 'exercise_bent_over_row', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_upper_back', difficulty: 'intermediate' },
      { id: 'b4', nameKey: 'exercise_seated_cable_row', equipmentKey: 'equipment_cable_machine', targetMuscleKey: 'muscle_middle_back', difficulty: 'beginner' },
      { id: 'b5', nameKey: 'exercise_deadlift', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_lower_back', difficulty: 'advanced' },
      { id: 'b6', nameKey: 'exercise_t_bar_row', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_middle_back', difficulty: 'intermediate' },
      { id: 'b7', nameKey: 'exercise_single_arm_dumbbell_row', equipmentKey: 'equipment_dumbbell', targetMuscleKey: 'muscle_upper_back', difficulty: 'beginner' },
      { id: 'b8', nameKey: 'exercise_chin_ups', equipmentKey: 'equipment_bodyweight', targetMuscleKey: 'muscle_latissimus_dorsi', difficulty: 'intermediate' },
      { id: 'b9', nameKey: 'exercise_meadows_row', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_latissimus_dorsi', difficulty: 'advanced' },
      { id: 'b10', nameKey: 'exercise_chest_supported_row', equipmentKey: 'equipment_dumbbells', targetMuscleKey: 'muscle_upper_back', difficulty: 'intermediate' },
      { id: 'b11', nameKey: 'exercise_pendlay_row', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_upper_back', difficulty: 'intermediate' },
      { id: 'b12', nameKey: 'exercise_inverted_row', equipmentKey: 'equipment_bodyweight', targetMuscleKey: 'muscle_middle_back', difficulty: 'beginner' }
    ]
  },
  {
    id: 'shoulders',
    displayNameKey: 'category_shoulders',
    iconName: 'barbell-outline',
    exercises: [
      { id: 's1', nameKey: 'exercise_overhead_press', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_deltoids', difficulty: 'intermediate' },
      { id: 's2', nameKey: 'exercise_lateral_raises', equipmentKey: 'equipment_dumbbells', targetMuscleKey: 'muscle_lateral_deltoids', difficulty: 'beginner' },
      { id: 's3', nameKey: 'exercise_face_pulls', equipmentKey: 'equipment_cable_machine', targetMuscleKey: 'muscle_posterior_deltoids', difficulty: 'beginner' },
      { id: 's4', nameKey: 'exercise_front_raises', equipmentKey: 'equipment_dumbbells', targetMuscleKey: 'muscle_anterior_deltoids', difficulty: 'beginner' },
      { id: 's5', nameKey: 'exercise_shrugs', equipmentKey: 'equipment_dumbbells_barbell', targetMuscleKey: 'muscle_trapezius', difficulty: 'beginner' },
      { id: 's6', nameKey: 'exercise_arnold_press', equipmentKey: 'equipment_dumbbells', targetMuscleKey: 'muscle_deltoids', difficulty: 'intermediate' },
      { id: 's7', nameKey: 'exercise_upright_row', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_deltoids_trapezius', difficulty: 'intermediate' },
      { id: 's8', nameKey: 'exercise_reverse_flyes', equipmentKey: 'equipment_dumbbells', targetMuscleKey: 'muscle_posterior_deltoids', difficulty: 'beginner' },
      { id: 's9', nameKey: 'exercise_seated_dumbbell_press', equipmentKey: 'equipment_dumbbells', targetMuscleKey: 'muscle_deltoids', difficulty: 'intermediate' },
      { id: 's10', nameKey: 'exercise_push_press', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_deltoids', difficulty: 'advanced' },
      { id: 's11', nameKey: 'exercise_cable_lateral_raise', equipmentKey: 'equipment_cable_machine', targetMuscleKey: 'muscle_lateral_deltoids', difficulty: 'beginner' },
      { id: 's12', nameKey: 'exercise_landmine_lateral_raise', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_lateral_deltoids', difficulty: 'intermediate' }
    ]
  },
  {
    id: 'arms',
    displayNameKey: 'category_arms',
    iconName: 'speedometer-outline',
    exercises: [
      { id: 'a1', nameKey: 'exercise_bicep_curls', equipmentKey: 'equipment_dumbbells_barbell', targetMuscleKey: 'muscle_biceps', difficulty: 'beginner' },
      { id: 'a2', nameKey: 'exercise_tricep_pushdowns', equipmentKey: 'equipment_cable_machine', targetMuscleKey: 'muscle_triceps', difficulty: 'beginner' },
      { id: 'a3', nameKey: 'exercise_hammer_curls', equipmentKey: 'equipment_dumbbells', targetMuscleKey: 'muscle_brachialis_biceps', difficulty: 'beginner' },
      { id: 'a4', nameKey: 'exercise_skull_crushers', equipmentKey: 'equipment_barbell_ez_bar', targetMuscleKey: 'muscle_triceps', difficulty: 'intermediate' },
      { id: 'a5', nameKey: 'exercise_dips', equipmentKey: 'equipment_bodyweight', targetMuscleKey: 'muscle_triceps', difficulty: 'intermediate' },
      { id: 'a6', nameKey: 'exercise_preacher_curls', equipmentKey: 'equipment_barbell_ez_bar', targetMuscleKey: 'muscle_biceps', difficulty: 'intermediate' },
      { id: 'a7', nameKey: 'exercise_tricep_kickbacks', equipmentKey: 'equipment_dumbbells', targetMuscleKey: 'muscle_triceps', difficulty: 'beginner' },
      { id: 'a8', nameKey: 'exercise_concentration_curls', equipmentKey: 'equipment_dumbbell', targetMuscleKey: 'muscle_biceps', difficulty: 'beginner' },
      { id: 'a9', nameKey: 'exercise_close_grip_bench_press', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_triceps', difficulty: 'intermediate' },
      { id: 'a10', nameKey: 'exercise_chin_ups_biceps', equipmentKey: 'equipment_bodyweight', targetMuscleKey: 'muscle_biceps', difficulty: 'intermediate' },
      { id: 'a11', nameKey: 'exercise_overhead_tricep_extension', equipmentKey: 'equipment_dumbbells', targetMuscleKey: 'muscle_triceps', difficulty: 'beginner' },
      { id: 'a12', nameKey: 'exercise_spider_curls', equipmentKey: 'equipment_dumbbells', targetMuscleKey: 'muscle_biceps', difficulty: 'intermediate' }
    ]
  },
  {
    id: 'legs',
    displayNameKey: 'category_legs',
    iconName: 'walk-outline',
    exercises: [
      { id: 'l1', nameKey: 'exercise_squats', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_quadriceps_glutes', difficulty: 'intermediate' },
      { id: 'l2', nameKey: 'exercise_leg_press', equipmentKey: 'equipment_machine', targetMuscleKey: 'muscle_quadriceps_glutes', difficulty: 'beginner' },
      { id: 'l3', nameKey: 'exercise_lunges', equipmentKey: 'equipment_bodyweight_dumbbells', targetMuscleKey: 'muscle_quadriceps_glutes', difficulty: 'beginner' },
      { id: 'l4', nameKey: 'exercise_leg_extensions', equipmentKey: 'equipment_machine', targetMuscleKey: 'muscle_quadriceps', difficulty: 'beginner' },
      { id: 'l5', nameKey: 'exercise_leg_curls', equipmentKey: 'equipment_machine', targetMuscleKey: 'muscle_hamstrings', difficulty: 'beginner' },
      { id: 'l6', nameKey: 'exercise_romanian_deadlift', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_hamstrings_glutes', difficulty: 'intermediate' },
      { id: 'l7', nameKey: 'exercise_calf_raises', equipmentKey: 'equipment_machine_bodyweight', targetMuscleKey: 'muscle_calves', difficulty: 'beginner' },
      { id: 'l8', nameKey: 'exercise_hip_thrusts', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_glutes', difficulty: 'intermediate' },
      { id: 'l9', nameKey: 'exercise_split_squats', equipmentKey: 'equipment_dumbbells', targetMuscleKey: 'muscle_quadriceps_glutes', difficulty: 'intermediate' },
      { id: 'l10', nameKey: 'exercise_hack_squats', equipmentKey: 'equipment_machine', targetMuscleKey: 'muscle_quadriceps', difficulty: 'intermediate' },
      { id: 'l11', nameKey: 'exercise_good_mornings', equipmentKey: 'equipment_barbell', targetMuscleKey: 'muscle_hamstrings_lower_back', difficulty: 'advanced' },
      { id: 'l12', nameKey: 'exercise_goblet_squats', equipmentKey: 'equipment_dumbbell_kettlebell', targetMuscleKey: 'muscle_quadriceps_glutes', difficulty: 'beginner' }
    ]
  },
  {
    id: 'core',
    displayNameKey: 'category_core',
    iconName: 'grid-outline',
    exercises: [
      { id: 'ab1', nameKey: 'exercise_crunches', equipmentKey: 'equipment_bodyweight', targetMuscleKey: 'muscle_rectus_abdominis', difficulty: 'beginner' },
      { id: 'ab2', nameKey: 'exercise_plank', equipmentKey: 'equipment_bodyweight', targetMuscleKey: 'muscle_core', difficulty: 'beginner' },
      { id: 'ab3', nameKey: 'exercise_russian_twists', equipmentKey: 'equipment_bodyweight_weight', targetMuscleKey: 'muscle_obliques', difficulty: 'beginner' },
      { id: 'ab4', nameKey: 'exercise_leg_raises', equipmentKey: 'equipment_bodyweight', targetMuscleKey: 'muscle_lower_abs', difficulty: 'intermediate' },
      { id: 'ab5', nameKey: 'exercise_ab_rollout', equipmentKey: 'equipment_ab_wheel', targetMuscleKey: 'muscle_core', difficulty: 'advanced' },
      { id: 'ab6', nameKey: 'exercise_mountain_climbers', equipmentKey: 'equipment_bodyweight', targetMuscleKey: 'muscle_core_hip_flexors', difficulty: 'beginner' },
      { id: 'ab7', nameKey: 'exercise_bicycle_crunches', equipmentKey: 'equipment_bodyweight', targetMuscleKey: 'muscle_rectus_abdominis_obliques', difficulty: 'beginner' },
      { id: 'ab8', nameKey: 'exercise_dead_bug', equipmentKey: 'equipment_bodyweight', targetMuscleKey: 'muscle_deep_core_stabilizers', difficulty: 'beginner' },
      { id: 'ab9', nameKey: 'exercise_hanging_leg_raises', equipmentKey: 'equipment_pull_up_bar', targetMuscleKey: 'muscle_lower_abs', difficulty: 'advanced' },
      { id: 'ab10', nameKey: 'exercise_cable_wood_chops', equipmentKey: 'equipment_cable_machine', targetMuscleKey: 'muscle_obliques', difficulty: 'intermediate' },
      { id: 'ab11', nameKey: 'exercise_dragon_flag', equipmentKey: 'equipment_bench', targetMuscleKey: 'muscle_full_core', difficulty: 'advanced' },
      { id: 'ab12', nameKey: 'exercise_ab_wheel_rollout', equipmentKey: 'equipment_ab_wheel', targetMuscleKey: 'muscle_core', difficulty: 'advanced' }
    ]
  },
  {
    id: 'cardio',
    displayNameKey: 'category_cardio',
    iconName: 'heart-outline',
    exercises: [
      { id: 'ca1', nameKey: 'exercise_treadmill', equipmentKey: 'equipment_machine', targetMuscleKey: 'muscle_cardiovascular_system', difficulty: 'beginner' },
      { id: 'ca2', nameKey: 'exercise_rowing_machine', equipmentKey: 'equipment_machine', targetMuscleKey: 'muscle_cardiovascular_system_full_body', difficulty: 'beginner' },
      { id: 'ca3', nameKey: 'exercise_cycling', equipmentKey: 'equipment_machine_bicycle', targetMuscleKey: 'muscle_cardiovascular_system_legs', difficulty: 'beginner' },
      { id: 'ca4', nameKey: 'exercise_jumping_jacks', equipmentKey: 'equipment_bodyweight', targetMuscleKey: 'muscle_cardiovascular_system', difficulty: 'beginner' },
      { id: 'ca5', nameKey: 'exercise_jump_rope', equipmentKey: 'equipment_jump_rope', targetMuscleKey: 'muscle_cardiovascular_system', difficulty: 'beginner' },
      { id: 'ca6', nameKey: 'exercise_burpees', equipmentKey: 'equipment_bodyweight', targetMuscleKey: 'muscle_cardiovascular_system_full_body', difficulty: 'intermediate' },
      { id: 'ca7', nameKey: 'exercise_stair_climber', equipmentKey: 'equipment_machine', targetMuscleKey: 'muscle_cardiovascular_system_legs', difficulty: 'beginner' },
      { id: 'ca8', nameKey: 'exercise_elliptical_trainer', equipmentKey: 'equipment_machine', targetMuscleKey: 'muscle_cardiovascular_system', difficulty: 'beginner' },
      { id: 'ca9', nameKey: 'exercise_battle_ropes', equipmentKey: 'equipment_battle_ropes', targetMuscleKey: 'muscle_cardiovascular_system_upper_body', difficulty: 'intermediate' },
      { id: 'ca10', nameKey: 'exercise_box_jumps', equipmentKey: 'equipment_plyo_box', targetMuscleKey: 'muscle_cardiovascular_system_legs', difficulty: 'intermediate' },
      { id: 'ca11', nameKey: 'exercise_swimming', equipmentKey: 'equipment_pool', targetMuscleKey: 'muscle_cardiovascular_system_full_body', difficulty: 'intermediate' },
      { id: 'ca12', nameKey: 'exercise_sprints', equipmentKey: 'equipment_none', targetMuscleKey: 'muscle_cardiovascular_system_legs', difficulty: 'intermediate' }
    ]
  },
  {
    id: 'functional',
    displayNameKey: 'category_functional',
    iconName: 'cube-outline',
    exercises: [
      { id: 'f1', nameKey: 'exercise_kettlebell_swings', equipmentKey: 'equipment_kettlebell', targetMuscleKey: 'muscle_full_body', difficulty: 'intermediate' },
      { id: 'f2', nameKey: 'exercise_medicine_ball_slams', equipmentKey: 'equipment_medicine_ball', targetMuscleKey: 'muscle_full_body', difficulty: 'intermediate' },
      { id: 'f3', nameKey: 'exercise_battle_rope_waves', equipmentKey: 'equipment_battle_ropes', targetMuscleKey: 'muscle_shoulders_core', difficulty: 'intermediate' },
      { id: 'f4', nameKey: 'exercise_sled_push', equipmentKey: 'equipment_sled', targetMuscleKey: 'muscle_full_body', difficulty: 'advanced' },
      { id: 'f5', nameKey: 'exercise_tire_flips', equipmentKey: 'equipment_tire', targetMuscleKey: 'muscle_full_body', difficulty: 'advanced' },
      { id: 'f6', nameKey: 'exercise_farmers_walk', equipmentKey: 'equipment_dumbbells_kettlebells', targetMuscleKey: 'muscle_grip_core_legs', difficulty: 'intermediate' },
      { id: 'f7', nameKey: 'exercise_sandbag_carries', equipmentKey: 'equipment_sandbag', targetMuscleKey: 'muscle_full_body', difficulty: 'intermediate' },
      { id: 'f8', nameKey: 'exercise_turkish_getup', equipmentKey: 'equipment_kettlebell', targetMuscleKey: 'muscle_full_body', difficulty: 'advanced' },
      { id: 'f9', nameKey: 'exercise_slam_ball_throws', equipmentKey: 'equipment_slam_ball', targetMuscleKey: 'muscle_full_body', difficulty: 'intermediate' },
      { id: 'f10', nameKey: 'exercise_wall_balls', equipmentKey: 'equipment_medicine_ball', targetMuscleKey: 'muscle_full_body', difficulty: 'intermediate' },
      { id: 'f11', nameKey: 'exercise_prowler_push', equipmentKey: 'equipment_prowler', targetMuscleKey: 'muscle_full_body', difficulty: 'advanced' },
      { id: 'f12', nameKey: 'exercise_bear_crawl', equipmentKey: 'equipment_bodyweight', targetMuscleKey: 'muscle_full_body', difficulty: 'intermediate' }
    ]
  }
];

// Equipment types for filtering
export const EQUIPMENT_TYPES = [
  { id: 'barbell', nameKey: 'equipment_barbell', iconName: 'barbell-outline' },
  { id: 'dumbbell', nameKey: 'equipment_dumbbells', iconName: 'barbell-outline' },
  { id: 'kettlebell', nameKey: 'equipment_kettlebell', iconName: 'fitness-outline' },
  { id: 'machine', nameKey: 'equipment_machine', iconName: 'construct-outline' },
  { id: 'cable', nameKey: 'equipment_cable_machine', iconName: 'git-network-outline' },
  { id: 'bodyweight', nameKey: 'equipment_bodyweight', iconName: 'body-outline' },
  { id: 'resistance_bands', nameKey: 'equipment_resistance_bands', iconName: 'infinite-outline' },
  { id: 'medicine_ball', nameKey: 'equipment_medicine_ball', iconName: 'ellipse-outline' },
  { id: 'battle_ropes', nameKey: 'equipment_battle_ropes', iconName: 'pulse-outline' },
  { id: 'other', nameKey: 'equipment_other', iconName: 'add-circle-outline' }
];

// Difficulty levels for filtering
export const DIFFICULTY_LEVELS = [
  { id: 'beginner', nameKey: 'difficulty_beginner', color: '#4CAF50' },
  { id: 'intermediate', nameKey: 'difficulty_intermediate', color: '#FFC107' },
  { id: 'advanced', nameKey: 'difficulty_advanced', color: '#F44336' }
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
export const searchExercises = (query: string, language: string): ExerciseItem[] => {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];
  
  return getAllExercises().filter(exercise => {
    // Get translated names for search
    const exerciseName = translations[language]?.[exercise.nameKey] || 
                         translations['en'][exercise.nameKey] || 
                         exercise.nameKey;
                         
    const equipmentName = exercise.equipmentKey ? 
                          (translations[language]?.[exercise.equipmentKey] || 
                           translations['en'][exercise.equipmentKey] || 
                           exercise.equipmentKey) : '';
                           
    const targetMuscleName = exercise.targetMuscleKey ? 
                             (translations[language]?.[exercise.targetMuscleKey] || 
                              translations['en'][exercise.targetMuscleKey] || 
                              exercise.targetMuscleKey) : '';
    
    return exerciseName.toLowerCase().includes(normalizedQuery) ||
           equipmentName.toLowerCase().includes(normalizedQuery) ||
           targetMuscleName.toLowerCase().includes(normalizedQuery);
  });
};

// Helper function to get exercises by equipment type
export const getExercisesByEquipment = (equipmentId: string): ExerciseItem[] => {
  return getAllExercises().filter(exercise => 
    exercise.equipmentKey?.includes(equipmentId) || false
  );
};

// Helper function to get exercises by difficulty
export const getExercisesByDifficulty = (difficulty: 'beginner' | 'intermediate' | 'advanced'): ExerciseItem[] => {
  return getAllExercises().filter(exercise => exercise.difficulty === difficulty);
};

// Helper function to filter exercises by multiple criteria
export type FilterCriteria = {
  categoryIds?: string[];
  equipmentIds?: string[];
  difficultyLevels?: ('beginner' | 'intermediate' | 'advanced')[];
  searchQuery?: string;
  favorites?: boolean;
  language: string;
};

export const filterExercises = (criteria: FilterCriteria): ExerciseItem[] => {
  let filtered = getAllExercises();
  
  // Filter by categories
  if (criteria.categoryIds && criteria.categoryIds.length > 0) {
    filtered = filtered.filter(exercise => {
      const exerciseCategory = EXERCISE_CATEGORIES.find(cat => 
        cat.exercises.some(ex => ex.id === exercise.id)
      );
      return exerciseCategory ? criteria.categoryIds?.includes(exerciseCategory.id) : false;
    });
  }
  
  // Filter by equipment
  if (criteria.equipmentIds && criteria.equipmentIds.length > 0) {
    filtered = filtered.filter(exercise => {
      if (!exercise.equipmentKey) return false;
      
      return criteria.equipmentIds?.some(equipmentId => 
        exercise.equipmentKey?.includes(equipmentId)
      );
    });
  }
  
  // Filter by difficulty
  if (criteria.difficultyLevels && criteria.difficultyLevels.length > 0) {
    filtered = filtered.filter(exercise => 
      exercise.difficulty ? criteria.difficultyLevels?.includes(exercise.difficulty) : false
    );
  }
  
  // Filter by search query
  if (criteria.searchQuery && criteria.searchQuery.trim()) {
    const query = criteria.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(exercise => {
      // Get translated names for search
      const exerciseName = translations[criteria.language]?.[exercise.nameKey] || 
                           translations['en'][exercise.nameKey] || 
                           exercise.nameKey;
                           
      const equipmentName = exercise.equipmentKey ? 
                            (translations[criteria.language]?.[exercise.equipmentKey] || 
                             translations['en'][exercise.equipmentKey] || 
                             exercise.equipmentKey) : '';
                             
      const targetMuscleName = exercise.targetMuscleKey ? 
                               (translations[criteria.language]?.[exercise.targetMuscleKey] || 
                                translations['en'][exercise.targetMuscleKey] || 
                                exercise.targetMuscleKey) : '';
      
      return exerciseName.toLowerCase().includes(query) ||
             equipmentName.toLowerCase().includes(query) ||
             targetMuscleName.toLowerCase().includes(query);
    });
  }
  
  // Filter by favorites
  if (criteria.favorites) {
    filtered = filtered.filter(exercise => exercise.favorite === true);
  }
  
  return filtered;
};

// Helper function to toggle favorite status for an exercise
export const toggleFavorite = (exerciseId: string) => {
  for (const category of EXERCISE_CATEGORIES) {
    const exercise = category.exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      exercise.favorite = !exercise.favorite;
      return;
    }
  }
};

// Helper function to get translated name for an exercise
export const getExerciseName = (exercise: ExerciseItem, language: string): string => {
  return translations[language]?.[exercise.nameKey] || 
         translations['en'][exercise.nameKey] || 
         exercise.nameKey.replace('exercise_', '').split('_').join(' ');
};

// Helper function to get translated equipment name
export const getEquipmentName = (exercise: ExerciseItem, language: string): string => {
  if (!exercise.equipmentKey) return '';
  
  return translations[language]?.[exercise.equipmentKey] || 
         translations['en'][exercise.equipmentKey] || 
         exercise.equipmentKey.replace('equipment_', '').split('_').join(' ');
};

// Helper function to get translated target muscle name
export const getTargetMuscleName = (exercise: ExerciseItem, language: string): string => {
  if (!exercise.targetMuscleKey) return '';
  
  return translations[language]?.[exercise.targetMuscleKey] || 
         translations['en'][exercise.targetMuscleKey] || 
         exercise.targetMuscleKey.replace('muscle_', '').split('_').join(' ');
};

// Helper function to get translated category name
export const getCategoryName = (categoryId: string, language: string): string => {
  const category = EXERCISE_CATEGORIES.find(cat => cat.id === categoryId);
  if (!category) return categoryId;
  
  return translations[language]?.[category.displayNameKey] || 
         translations['en'][category.displayNameKey] || 
         category.displayNameKey.replace('category_', '').split('_').join(' ');
};