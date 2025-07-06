// exerciseData.ts - Enhanced with effort_type support and language context integration

export type ExerciseItem = {
  id: string;
  nameKey: string; // Translation key for exercise name
  equipment?: string;
  equipmentKey?: string; // Translation key for equipment
  targetMuscleKey?: string; // Main/primary muscle translation key
  secondaryMuscleKeys?: string[]; // Secondary muscle translation keys
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  effort_type?: 'reps' | 'time' | 'distance'; // New field for exercise type
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
      { 
        id: 'c1', 
        nameKey: 'exercise_bench_press', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_pectorals', 
        secondaryMuscleKeys: ['muscle_triceps', 'muscle_anterior_deltoids'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'c2', 
        nameKey: 'exercise_incline_bench_press', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_upper_pectorals', 
        secondaryMuscleKeys: ['muscle_anterior_deltoids', 'muscle_triceps'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'c3', 
        nameKey: 'exercise_dumbbell_flyes', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_pectorals', 
        secondaryMuscleKeys: ['muscle_anterior_deltoids'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'c4', 
        nameKey: 'exercise_push_ups', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_pectorals', 
        secondaryMuscleKeys: ['muscle_triceps', 'muscle_anterior_deltoids'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'c5', 
        nameKey: 'exercise_cable_crossover', 
        equipmentKey: 'equipment_cable', 
        targetMuscleKey: 'muscle_pectorals', 
        secondaryMuscleKeys: ['muscle_anterior_deltoids'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'c6', 
        nameKey: 'exercise_chest_dips', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_lower_pectorals', 
        secondaryMuscleKeys: ['muscle_triceps', 'muscle_anterior_deltoids'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'c7', 
        nameKey: 'exercise_decline_bench_press', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_lower_pectorals', 
        secondaryMuscleKeys: ['muscle_triceps', 'muscle_anterior_deltoids'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'c8', 
        nameKey: 'exercise_pec_deck_machine', 
        equipmentKey: 'equipment_machine', 
        targetMuscleKey: 'muscle_pectorals', 
        secondaryMuscleKeys: [],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'c9', 
        nameKey: 'exercise_dumbbell_bench_press', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_pectorals', 
        secondaryMuscleKeys: ['muscle_triceps', 'muscle_anterior_deltoids'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'c10', 
        nameKey: 'exercise_landmine_press', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_pectorals', 
        secondaryMuscleKeys: ['muscle_anterior_deltoids', 'muscle_core'],
        difficulty: 'advanced',
        effort_type: 'reps'
      },
      { 
        id: 'c11', 
        nameKey: 'exercise_svend_press', 
        equipmentKey: 'equipment_plate', 
        targetMuscleKey: 'muscle_pectorals', 
        secondaryMuscleKeys: ['muscle_anterior_deltoids'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'c12', 
        nameKey: 'exercise_floor_press', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_pectorals', 
        secondaryMuscleKeys: ['muscle_triceps'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'c13', 
        nameKey: 'exercise_smith_machine_bench_press', 
        equipmentKey: 'equipment_smith_machine', 
        targetMuscleKey: 'muscle_pectorals', 
        secondaryMuscleKeys: ['muscle_triceps', 'muscle_anterior_deltoids'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'c14', 
        nameKey: 'exercise_smith_machine_incline_press', 
        equipmentKey: 'equipment_smith_machine', 
        targetMuscleKey: 'muscle_upper_pectorals', 
        secondaryMuscleKeys: ['muscle_anterior_deltoids', 'muscle_triceps'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'c15', 
        nameKey: 'exercise_cable_flyes', 
        equipmentKey: 'equipment_cable', 
        targetMuscleKey: 'muscle_pectorals', 
        secondaryMuscleKeys: ['muscle_anterior_deltoids'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      }
    ]
  },
  {
    id: 'back',
    displayNameKey: 'category_back',
    iconName: 'body-outline',
    exercises: [
      { 
        id: 'b1', 
        nameKey: 'exercise_pull_ups', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_latissimus_dorsi', 
        secondaryMuscleKeys: ['muscle_biceps', 'muscle_posterior_deltoids', 'muscle_rhomboids'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'b2', 
        nameKey: 'exercise_lat_pulldown', 
        equipmentKey: 'equipment_cable', 
        targetMuscleKey: 'muscle_latissimus_dorsi', 
        secondaryMuscleKeys: ['muscle_biceps', 'muscle_posterior_deltoids'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'b3', 
        nameKey: 'exercise_bent_over_row', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_upper_back', 
        secondaryMuscleKeys: ['muscle_biceps', 'muscle_posterior_deltoids', 'muscle_latissimus_dorsi'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'b4', 
        nameKey: 'exercise_seated_cable_row', 
        equipmentKey: 'equipment_cable', 
        targetMuscleKey: 'muscle_middle_back', 
        secondaryMuscleKeys: ['muscle_biceps', 'muscle_posterior_deltoids'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'b5', 
        nameKey: 'exercise_deadlift', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_lower_back', 
        secondaryMuscleKeys: ['muscle_hamstrings', 'muscle_glutes', 'muscle_trapezius', 'muscle_core'],
        difficulty: 'advanced',
        effort_type: 'reps'
      },
      { 
        id: 'b6', 
        nameKey: 'exercise_t_bar_row', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_middle_back', 
        secondaryMuscleKeys: ['muscle_biceps', 'muscle_latissimus_dorsi'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'b7', 
        nameKey: 'exercise_single_arm_dumbbell_row', 
        equipmentKey: 'equipment_dumbbell', 
        targetMuscleKey: 'muscle_upper_back', 
        secondaryMuscleKeys: ['muscle_biceps', 'muscle_latissimus_dorsi'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'b8', 
        nameKey: 'exercise_chin_ups', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_latissimus_dorsi', 
        secondaryMuscleKeys: ['muscle_biceps', 'muscle_posterior_deltoids'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'b9', 
        nameKey: 'exercise_meadows_row', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_latissimus_dorsi', 
        secondaryMuscleKeys: ['muscle_biceps', 'muscle_posterior_deltoids'],
        difficulty: 'advanced',
        effort_type: 'reps'
      },
      { 
        id: 'b10', 
        nameKey: 'exercise_chest_supported_row', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_upper_back', 
        secondaryMuscleKeys: ['muscle_biceps', 'muscle_posterior_deltoids'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'b11', 
        nameKey: 'exercise_pendlay_row', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_upper_back', 
        secondaryMuscleKeys: ['muscle_biceps', 'muscle_latissimus_dorsi'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'b12', 
        nameKey: 'exercise_inverted_row', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_middle_back', 
        secondaryMuscleKeys: ['muscle_biceps', 'muscle_posterior_deltoids'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'b13', 
        nameKey: 'exercise_smith_machine_bent_over_row', 
        equipmentKey: 'equipment_smith_machine', 
        targetMuscleKey: 'muscle_upper_back', 
        secondaryMuscleKeys: ['muscle_biceps', 'muscle_posterior_deltoids', 'muscle_latissimus_dorsi'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'b14', 
        nameKey: 'exercise_wide_grip_lat_pulldown', 
        equipmentKey: 'equipment_cable', 
        targetMuscleKey: 'muscle_latissimus_dorsi', 
        secondaryMuscleKeys: ['muscle_biceps', 'muscle_posterior_deltoids'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'b15', 
        nameKey: 'exercise_cable_reverse_flyes', 
        equipmentKey: 'equipment_cable', 
        targetMuscleKey: 'muscle_posterior_deltoids', 
        secondaryMuscleKeys: ['muscle_rhomboids', 'muscle_middle_back'],
        difficulty: 'beginner',
        effort_type: 'reps'
      }
    ]
  },
  {
    id: 'shoulders',
    displayNameKey: 'category_shoulders',
    iconName: 'barbell-outline',
    exercises: [
      { 
        id: 's1', 
        nameKey: 'exercise_overhead_press', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_deltoids', 
        secondaryMuscleKeys: ['muscle_triceps', 'muscle_upper_pectorals', 'muscle_core'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 's2', 
        nameKey: 'exercise_lateral_raises', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_lateral_deltoids', 
        secondaryMuscleKeys: ['muscle_trapezius'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 's3', 
        nameKey: 'exercise_face_pulls', 
        equipmentKey: 'equipment_cable', 
        targetMuscleKey: 'muscle_posterior_deltoids', 
        secondaryMuscleKeys: ['muscle_rhomboids', 'muscle_middle_back'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 's4', 
        nameKey: 'exercise_front_raises', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_anterior_deltoids', 
        secondaryMuscleKeys: ['muscle_upper_pectorals'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 's5', 
        nameKey: 'exercise_shrugs', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_trapezius', 
        secondaryMuscleKeys: ['muscle_rhomboids'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 's6', 
        nameKey: 'exercise_arnold_press', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_deltoids', 
        secondaryMuscleKeys: ['muscle_triceps', 'muscle_upper_pectorals'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 's7', 
        nameKey: 'exercise_upright_row', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_deltoids_trapezius', 
        secondaryMuscleKeys: ['muscle_biceps'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 's8', 
        nameKey: 'exercise_reverse_flyes', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_posterior_deltoids', 
        secondaryMuscleKeys: ['muscle_rhomboids', 'muscle_middle_back'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 's9', 
        nameKey: 'exercise_seated_dumbbell_press', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_deltoids', 
        secondaryMuscleKeys: ['muscle_triceps', 'muscle_upper_pectorals'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 's10', 
        nameKey: 'exercise_push_press', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_deltoids', 
        secondaryMuscleKeys: ['muscle_triceps', 'muscle_core', 'muscle_legs'],
        difficulty: 'advanced',
        effort_type: 'reps'
      },
      { 
        id: 's11', 
        nameKey: 'exercise_cable_lateral_raise', 
        equipmentKey: 'equipment_cable', 
        targetMuscleKey: 'muscle_lateral_deltoids', 
        secondaryMuscleKeys: ['muscle_trapezius'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 's12', 
        nameKey: 'exercise_landmine_lateral_raise', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_lateral_deltoids', 
        secondaryMuscleKeys: ['muscle_core'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 's13', 
        nameKey: 'exercise_smith_machine_shoulder_press', 
        equipmentKey: 'equipment_smith_machine', 
        targetMuscleKey: 'muscle_deltoids', 
        secondaryMuscleKeys: ['muscle_triceps', 'muscle_upper_pectorals'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 's14', 
        nameKey: 'exercise_rear_delt_machine', 
        equipmentKey: 'equipment_machine', 
        targetMuscleKey: 'muscle_posterior_deltoids', 
        secondaryMuscleKeys: ['muscle_rhomboids'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 's15', 
        nameKey: 'exercise_cable_front_raise', 
        equipmentKey: 'equipment_cable', 
        targetMuscleKey: 'muscle_anterior_deltoids', 
        secondaryMuscleKeys: ['muscle_upper_pectorals'],
        difficulty: 'beginner',
        effort_type: 'reps'
      }
    ]
  },
  {
    id: 'arms',
    displayNameKey: 'category_arms',
    iconName: 'speedometer-outline',
    exercises: [
      { 
        id: 'a1', 
        nameKey: 'exercise_bicep_curls', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_biceps', 
        secondaryMuscleKeys: ['muscle_forearms'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'a2', 
        nameKey: 'exercise_tricep_pushdowns', 
        equipmentKey: 'equipment_cable', 
        targetMuscleKey: 'muscle_triceps', 
        secondaryMuscleKeys: [],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'a3', 
        nameKey: 'exercise_hammer_curls', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_brachialis_biceps', 
        secondaryMuscleKeys: ['muscle_forearms'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'a4', 
        nameKey: 'exercise_skull_crushers', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_triceps', 
        secondaryMuscleKeys: [],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'a5', 
        nameKey: 'exercise_dips', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_triceps', 
        secondaryMuscleKeys: ['muscle_lower_pectorals', 'muscle_anterior_deltoids'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'a6', 
        nameKey: 'exercise_preacher_curls', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_biceps', 
        secondaryMuscleKeys: [],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'a7', 
        nameKey: 'exercise_tricep_kickbacks', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_triceps', 
        secondaryMuscleKeys: [],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'a8', 
        nameKey: 'exercise_concentration_curls', 
        equipmentKey: 'equipment_dumbbell', 
        targetMuscleKey: 'muscle_biceps', 
        secondaryMuscleKeys: [],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'a9', 
        nameKey: 'exercise_close_grip_bench_press', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_triceps', 
        secondaryMuscleKeys: ['muscle_pectorals', 'muscle_anterior_deltoids'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'a10', 
        nameKey: 'exercise_chin_ups_biceps', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_biceps', 
        secondaryMuscleKeys: ['muscle_latissimus_dorsi', 'muscle_posterior_deltoids'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'a11', 
        nameKey: 'exercise_overhead_tricep_extension', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_triceps', 
        secondaryMuscleKeys: [],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'a12', 
        nameKey: 'exercise_spider_curls', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_biceps', 
        secondaryMuscleKeys: [],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'a13', 
        nameKey: 'exercise_cable_bicep_curls', 
        equipmentKey: 'equipment_cable', 
        targetMuscleKey: 'muscle_biceps', 
        secondaryMuscleKeys: ['muscle_forearms'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'a14', 
        nameKey: 'exercise_diamond_push_ups', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_triceps', 
        secondaryMuscleKeys: ['muscle_pectorals', 'muscle_anterior_deltoids'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'a15', 
        nameKey: 'exercise_wrist_curls', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_forearms', 
        secondaryMuscleKeys: [],
        difficulty: 'beginner',
        effort_type: 'reps'
      }
    ]
  },
  {
    id: 'legs',
    displayNameKey: 'category_legs',
    iconName: 'walk-outline',
    exercises: [
      { 
        id: 'l1', 
        nameKey: 'exercise_squats', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_quadriceps_glutes', 
        secondaryMuscleKeys: ['muscle_hamstrings', 'muscle_calves', 'muscle_core'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'l2', 
        nameKey: 'exercise_leg_press', 
        equipmentKey: 'equipment_machine', 
        targetMuscleKey: 'muscle_quadriceps_glutes', 
        secondaryMuscleKeys: ['muscle_hamstrings'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'l3', 
        nameKey: 'exercise_lunges', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_quadriceps_glutes', 
        secondaryMuscleKeys: ['muscle_hamstrings', 'muscle_calves', 'muscle_core'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'l4', 
        nameKey: 'exercise_leg_extensions', 
        equipmentKey: 'equipment_machine', 
        targetMuscleKey: 'muscle_quadriceps', 
        secondaryMuscleKeys: [],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'l5', 
        nameKey: 'exercise_leg_curls', 
        equipmentKey: 'equipment_machine', 
        targetMuscleKey: 'muscle_hamstrings', 
        secondaryMuscleKeys: [],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'l6', 
        nameKey: 'exercise_romanian_deadlift', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_hamstrings_glutes', 
        secondaryMuscleKeys: ['muscle_lower_back', 'muscle_core'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'l7', 
        nameKey: 'exercise_calf_raises', 
        equipmentKey: 'equipment_machine', 
        targetMuscleKey: 'muscle_calves', 
        secondaryMuscleKeys: [],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'l8', 
        nameKey: 'exercise_hip_thrusts', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_glutes', 
        secondaryMuscleKeys: ['muscle_hamstrings', 'muscle_core'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'l9', 
        nameKey: 'exercise_split_squats', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_quadriceps_glutes', 
        secondaryMuscleKeys: ['muscle_hamstrings', 'muscle_calves', 'muscle_core'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'l10', 
        nameKey: 'exercise_hack_squats', 
        equipmentKey: 'equipment_machine', 
        targetMuscleKey: 'muscle_quadriceps', 
        secondaryMuscleKeys: ['muscle_glutes'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'l11', 
        nameKey: 'exercise_good_mornings', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_hamstrings_lower_back', 
        secondaryMuscleKeys: ['muscle_glutes', 'muscle_core'],
        difficulty: 'advanced',
        effort_type: 'reps'
      },
      { 
        id: 'l12', 
        nameKey: 'exercise_goblet_squats', 
        equipmentKey: 'equipment_dumbbell', 
        targetMuscleKey: 'muscle_quadriceps_glutes', 
        secondaryMuscleKeys: ['muscle_hamstrings', 'muscle_core'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'l13', 
        nameKey: 'exercise_smith_machine_squats', 
        equipmentKey: 'equipment_smith_machine', 
        targetMuscleKey: 'muscle_quadriceps_glutes', 
        secondaryMuscleKeys: ['muscle_hamstrings', 'muscle_calves'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'l14', 
        nameKey: 'exercise_smith_machine_lunges', 
        equipmentKey: 'equipment_smith_machine', 
        targetMuscleKey: 'muscle_quadriceps_glutes', 
        secondaryMuscleKeys: ['muscle_hamstrings', 'muscle_calves'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'l15', 
        nameKey: 'exercise_smith_machine_calf_raises', 
        equipmentKey: 'equipment_smith_machine', 
        targetMuscleKey: 'muscle_calves', 
        secondaryMuscleKeys: [],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'l16', 
        nameKey: 'exercise_front_squats', 
        equipmentKey: 'equipment_barbell', 
        targetMuscleKey: 'muscle_quadriceps', 
        secondaryMuscleKeys: ['muscle_glutes', 'muscle_core'],
        difficulty: 'advanced',
        effort_type: 'reps'
      },
      { 
        id: 'l17', 
        nameKey: 'exercise_bulgarian_split_squats', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_quadriceps_glutes', 
        secondaryMuscleKeys: ['muscle_hamstrings', 'muscle_core'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'l18', 
        nameKey: 'exercise_step_ups', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_quadriceps_glutes', 
        secondaryMuscleKeys: ['muscle_hamstrings', 'muscle_calves'],
        difficulty: 'beginner',
        effort_type: 'reps'
      }
    ]
  },
  {
    id: 'core',
    displayNameKey: 'category_core',
    iconName: 'grid-outline',
    exercises: [
      { 
        id: 'ab1', 
        nameKey: 'exercise_crunches', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_rectus_abdominis', 
        secondaryMuscleKeys: [],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'ab2', 
        nameKey: 'exercise_plank', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_core', 
        secondaryMuscleKeys: ['muscle_shoulders', 'muscle_glutes'],
        difficulty: 'beginner',
        effort_type: 'time'
      },
      { 
        id: 'ab3', 
        nameKey: 'exercise_russian_twists', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_obliques', 
        secondaryMuscleKeys: ['muscle_rectus_abdominis'],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'ab4', 
        nameKey: 'exercise_leg_raises', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_lower_abs', 
        secondaryMuscleKeys: ['muscle_hip_flexors'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'ab5', 
        nameKey: 'exercise_ab_rollout', 
        equipmentKey: 'equipment_ab_wheel', 
        targetMuscleKey: 'muscle_core', 
        secondaryMuscleKeys: ['muscle_shoulders', 'muscle_latissimus_dorsi'],
        difficulty: 'advanced',
        effort_type: 'reps'
      },
      { 
        id: 'ab6', 
        nameKey: 'exercise_mountain_climbers', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_core_hip_flexors', 
        secondaryMuscleKeys: ['muscle_shoulders', 'muscle_legs'],
        difficulty: 'beginner',
        effort_type: 'time'
      },
      { 
        id: 'ab7', 
        nameKey: 'exercise_bicycle_crunches', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_rectus_abdominis_obliques', 
        secondaryMuscleKeys: [],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'ab8', 
        nameKey: 'exercise_dead_bug', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_deep_core_stabilizers', 
        secondaryMuscleKeys: [],
        difficulty: 'beginner',
        effort_type: 'reps'
      },
      { 
        id: 'ab9', 
        nameKey: 'exercise_hanging_leg_raises', 
        equipmentKey: 'equipment_pull_up_bar', 
        targetMuscleKey: 'muscle_lower_abs', 
        secondaryMuscleKeys: ['muscle_hip_flexors', 'muscle_forearms'],
        difficulty: 'advanced',
        effort_type: 'reps'
      },
      { 
        id: 'ab10', 
        nameKey: 'exercise_cable_wood_chops', 
        equipmentKey: 'equipment_cable', 
        targetMuscleKey: 'muscle_obliques', 
        secondaryMuscleKeys: ['muscle_core', 'muscle_shoulders'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'ab11', 
        nameKey: 'exercise_dragon_flag', 
        equipmentKey: 'equipment_bench', 
        targetMuscleKey: 'muscle_full_core', 
        secondaryMuscleKeys: ['muscle_shoulders', 'muscle_latissimus_dorsi'],
        difficulty: 'advanced',
        effort_type: 'reps'
      },
      { 
        id: 'ab12', 
        nameKey: 'exercise_ab_wheel_rollout', 
        equipmentKey: 'equipment_ab_wheel', 
        targetMuscleKey: 'muscle_core', 
        secondaryMuscleKeys: ['muscle_shoulders', 'muscle_latissimus_dorsi'],
        difficulty: 'advanced',
        effort_type: 'reps'
      },
      { 
        id: 'ab13', 
        nameKey: 'exercise_side_plank', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_obliques', 
        secondaryMuscleKeys: ['muscle_core', 'muscle_shoulders'],
        difficulty: 'intermediate',
        effort_type: 'time'
      },
      { 
        id: 'ab14', 
        nameKey: 'exercise_v_ups', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_rectus_abdominis', 
        secondaryMuscleKeys: ['muscle_hip_flexors'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'ab15', 
        nameKey: 'exercise_cable_crunches', 
        equipmentKey: 'equipment_cable', 
        targetMuscleKey: 'muscle_rectus_abdominis', 
        secondaryMuscleKeys: [],
        difficulty: 'beginner',
        effort_type: 'reps'
      }
    ]
  },
  {
    id: 'cardio',
    displayNameKey: 'category_cardio',
    iconName: 'heart-outline',
    exercises: [
      { 
        id: 'ca1', 
        nameKey: 'exercise_treadmill', 
        equipmentKey: 'equipment_machine', 
        targetMuscleKey: 'muscle_cardiovascular_system', 
        secondaryMuscleKeys: ['muscle_legs'],
        difficulty: 'beginner',
        effort_type: 'time'
      },
      { 
        id: 'ca2', 
        nameKey: 'exercise_rowing_machine', 
        equipmentKey: 'equipment_machine', 
        targetMuscleKey: 'muscle_cardiovascular_system_full_body', 
        secondaryMuscleKeys: ['muscle_back', 'muscle_legs', 'muscle_biceps'],
        difficulty: 'beginner',
        effort_type: 'time'
      },
      { 
        id: 'ca3', 
        nameKey: 'exercise_cycling', 
        equipmentKey: 'equipment_machine', 
        targetMuscleKey: 'muscle_cardiovascular_system_legs', 
        secondaryMuscleKeys: ['muscle_glutes', 'muscle_calves'],
        difficulty: 'beginner',
        effort_type: 'time'
      },
      { 
        id: 'ca4', 
        nameKey: 'exercise_jumping_jacks', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_cardiovascular_system', 
        secondaryMuscleKeys: ['muscle_legs', 'muscle_shoulders'],
        difficulty: 'beginner',
        effort_type: 'time'
      },
      { 
        id: 'ca5', 
        nameKey: 'exercise_jump_rope', 
        equipmentKey: 'equipment_jump_rope', 
        targetMuscleKey: 'muscle_cardiovascular_system', 
        secondaryMuscleKeys: ['muscle_calves', 'muscle_shoulders'],
        difficulty: 'beginner',
        effort_type: 'time'
      },
      { 
        id: 'ca6', 
        nameKey: 'exercise_burpees', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_cardiovascular_system_full_body', 
        secondaryMuscleKeys: ['muscle_legs', 'muscle_pectorals', 'muscle_shoulders', 'muscle_core'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'ca7', 
        nameKey: 'exercise_stair_climber', 
        equipmentKey: 'equipment_machine', 
        targetMuscleKey: 'muscle_cardiovascular_system_legs', 
        secondaryMuscleKeys: ['muscle_glutes', 'muscle_calves'],
        difficulty: 'beginner',
        effort_type: 'time'
      },
      { 
        id: 'ca8', 
        nameKey: 'exercise_elliptical_trainer', 
        equipmentKey: 'equipment_machine', 
        targetMuscleKey: 'muscle_cardiovascular_system', 
        secondaryMuscleKeys: ['muscle_legs', 'muscle_arms'],
        difficulty: 'beginner',
        effort_type: 'time'
      },
      { 
        id: 'ca9', 
        nameKey: 'exercise_battle_ropes', 
        equipmentKey: 'equipment_battle_ropes', 
        targetMuscleKey: 'muscle_cardiovascular_system_upper_body', 
        secondaryMuscleKeys: ['muscle_shoulders', 'muscle_arms', 'muscle_core'],
        difficulty: 'intermediate',
        effort_type: 'time'
      },
      { 
        id: 'ca10', 
        nameKey: 'exercise_box_jumps', 
        equipmentKey: 'equipment_plyo_box', 
        targetMuscleKey: 'muscle_cardiovascular_system_legs', 
        secondaryMuscleKeys: ['muscle_glutes', 'muscle_calves', 'muscle_core'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'ca11', 
        nameKey: 'exercise_swimming', 
        equipmentKey: 'equipment_pool', 
        targetMuscleKey: 'muscle_cardiovascular_system_full_body', 
        secondaryMuscleKeys: ['muscle_shoulders', 'muscle_back', 'muscle_legs', 'muscle_core'],
        difficulty: 'intermediate',
        effort_type: 'distance'
      },
      { 
        id: 'ca12', 
        nameKey: 'exercise_sprints', 
        equipmentKey: 'equipment_none', 
        targetMuscleKey: 'muscle_cardiovascular_system_legs', 
        secondaryMuscleKeys: ['muscle_glutes', 'muscle_hamstrings', 'muscle_calves'],
        difficulty: 'intermediate',
        effort_type: 'distance'
      },
      { 
        id: 'ca13', 
        nameKey: 'exercise_high_knees', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_cardiovascular_system', 
        secondaryMuscleKeys: ['muscle_legs', 'muscle_core'],
        difficulty: 'beginner',
        effort_type: 'time'
      },
      { 
        id: 'ca14', 
        nameKey: 'exercise_stationary_bike', 
        equipmentKey: 'equipment_machine', 
        targetMuscleKey: 'muscle_cardiovascular_system_legs', 
        secondaryMuscleKeys: ['muscle_glutes', 'muscle_calves'],
        difficulty: 'beginner',
        effort_type: 'time'
      },
      { 
        id: 'ca15', 
        nameKey: 'exercise_stair_running', 
        equipmentKey: 'equipment_none', 
        targetMuscleKey: 'muscle_cardiovascular_system_legs', 
        secondaryMuscleKeys: ['muscle_glutes', 'muscle_calves', 'muscle_core'],
        difficulty: 'intermediate',
        effort_type: 'time'
      }
    ]
  },
  {
    id: 'functional',
    displayNameKey: 'category_functional',
    iconName: 'cube-outline',
    exercises: [
      { 
        id: 'f1', 
        nameKey: 'exercise_kettlebell_swings', 
        equipmentKey: 'equipment_kettlebell', 
        targetMuscleKey: 'muscle_full_body', 
        secondaryMuscleKeys: ['muscle_glutes', 'muscle_hamstrings', 'muscle_shoulders', 'muscle_core'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'f2', 
        nameKey: 'exercise_medicine_ball_slams', 
        equipmentKey: 'equipment_medicine_ball', 
        targetMuscleKey: 'muscle_full_body', 
        secondaryMuscleKeys: ['muscle_shoulders', 'muscle_core', 'muscle_latissimus_dorsi'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'f3', 
        nameKey: 'exercise_battle_rope_waves', 
        equipmentKey: 'equipment_battle_ropes', 
        targetMuscleKey: 'muscle_shoulders_core', 
        secondaryMuscleKeys: ['muscle_arms', 'muscle_back'],
        difficulty: 'intermediate',
        effort_type: 'time'
      },
      { 
        id: 'f4', 
        nameKey: 'exercise_sled_push', 
        equipmentKey: 'equipment_sled', 
        targetMuscleKey: 'muscle_full_body', 
        secondaryMuscleKeys: ['muscle_legs', 'muscle_shoulders', 'muscle_core'],
        difficulty: 'advanced',
        effort_type: 'distance'
      },
      { 
        id: 'f5', 
        nameKey: 'exercise_tire_flips', 
        equipmentKey: 'equipment_tire', 
        targetMuscleKey: 'muscle_full_body', 
        secondaryMuscleKeys: ['muscle_legs', 'muscle_back', 'muscle_shoulders', 'muscle_core'],
        difficulty: 'advanced',
        effort_type: 'reps'
      },
      { 
        id: 'f6', 
        nameKey: 'exercise_farmers_walk', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_grip_core_legs', 
        secondaryMuscleKeys: ['muscle_shoulders', 'muscle_back', 'muscle_forearms'],
        difficulty: 'intermediate',
        effort_type: 'distance'
      },
      { 
        id: 'f7', 
        nameKey: 'exercise_sandbag_carries', 
        equipmentKey: 'equipment_sandbag', 
        targetMuscleKey: 'muscle_full_body', 
        secondaryMuscleKeys: ['muscle_core', 'muscle_shoulders', 'muscle_legs'],
        difficulty: 'intermediate',
        effort_type: 'distance'
      },
      { 
        id: 'f8', 
        nameKey: 'exercise_turkish_getup', 
        equipmentKey: 'equipment_kettlebell', 
        targetMuscleKey: 'muscle_full_body', 
        secondaryMuscleKeys: ['muscle_shoulders', 'muscle_core', 'muscle_legs'],
        difficulty: 'advanced',
        effort_type: 'reps'
      },
      { 
        id: 'f9', 
        nameKey: 'exercise_slam_ball_throws', 
        equipmentKey: 'equipment_slam_ball', 
        targetMuscleKey: 'muscle_full_body', 
        secondaryMuscleKeys: ['muscle_shoulders', 'muscle_core', 'muscle_latissimus_dorsi'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'f10', 
        nameKey: 'exercise_wall_balls', 
        equipmentKey: 'equipment_medicine_ball', 
        targetMuscleKey: 'muscle_full_body', 
        secondaryMuscleKeys: ['muscle_legs', 'muscle_shoulders', 'muscle_core'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'f11', 
        nameKey: 'exercise_prowler_push', 
        equipmentKey: 'equipment_prowler', 
        targetMuscleKey: 'muscle_full_body', 
        secondaryMuscleKeys: ['muscle_legs', 'muscle_shoulders', 'muscle_core'],
        difficulty: 'advanced',
        effort_type: 'distance'
      },
      { 
        id: 'f12', 
        nameKey: 'exercise_bear_crawl', 
        equipmentKey: 'equipment_bodyweight', 
        targetMuscleKey: 'muscle_full_body', 
        secondaryMuscleKeys: ['muscle_shoulders', 'muscle_core', 'muscle_legs'],
        difficulty: 'intermediate',
        effort_type: 'distance'
      },
      { 
        id: 'f13', 
        nameKey: 'exercise_man_makers', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_full_body', 
        secondaryMuscleKeys: ['muscle_shoulders', 'muscle_pectorals', 'muscle_core', 'muscle_legs'],
        difficulty: 'advanced',
        effort_type: 'reps'
      },
      { 
        id: 'f14', 
        nameKey: 'exercise_thrusters', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_full_body', 
        secondaryMuscleKeys: ['muscle_legs', 'muscle_shoulders', 'muscle_core'],
        difficulty: 'intermediate',
        effort_type: 'reps'
      },
      { 
        id: 'f15', 
        nameKey: 'exercise_overhead_carry', 
        equipmentKey: 'equipment_dumbbells', 
        targetMuscleKey: 'muscle_shoulders_core', 
        secondaryMuscleKeys: ['muscle_back', 'muscle_legs'],
        difficulty: 'intermediate',
        effort_type: 'distance'
      }
    ]
  }
];

// Enhanced equipment types with Smith Machine
export const EQUIPMENT_TYPES = [
  { id: 'barbell', nameKey: 'equipment_barbell', iconName: 'barbell-outline' },
  { id: 'dumbbells', nameKey: 'equipment_dumbbells', iconName: 'barbell-outline' },
  { id: 'dumbbell', nameKey: 'equipment_dumbbell', iconName: 'barbell-outline' },
  { id: 'kettlebell', nameKey: 'equipment_kettlebell', iconName: 'fitness-outline' },
  { id: 'kettlebells', nameKey: 'equipment_kettlebells', iconName: 'fitness-outline' },
  { id: 'machine', nameKey: 'equipment_machine', iconName: 'construct-outline' },
  { id: 'cable', nameKey: 'equipment_cable', iconName: 'git-network-outline' },
  { id: 'smith_machine', nameKey: 'equipment_smith_machine', iconName: 'grid-outline' },
  { id: 'bodyweight', nameKey: 'equipment_bodyweight', iconName: 'body-outline' },
  { id: 'resistance_bands', nameKey: 'equipment_resistance_bands', iconName: 'infinite-outline' },
  { id: 'medicine_ball', nameKey: 'equipment_medicine_ball', iconName: 'ellipse-outline' },
  { id: 'battle_ropes', nameKey: 'equipment_battle_ropes', iconName: 'pulse-outline' },
  { id: 'other', nameKey: 'equipment_other', iconName: 'add-circle-outline' }
];

export const DIFFICULTY_LEVELS = [
  { id: 'beginner', nameKey: 'difficulty_beginner', color: '#4CAF50' },
  { id: 'intermediate', nameKey: 'difficulty_intermediate', color: '#FFC107' },
  { id: 'advanced', nameKey: 'difficulty_advanced', color: '#F44336' }
];

// Helper functions that work with the language context
export const getAllExercises = (): ExerciseItem[] => {
  return EXERCISE_CATEGORIES.flatMap(category => category.exercises);
};

export const getExercisesByCategory = (categoryId: string): ExerciseItem[] => {
  const category = EXERCISE_CATEGORIES.find(cat => cat.id === categoryId);
  return category ? category.exercises : [];
};

export const getExercisesByEquipment = (equipmentId: string): ExerciseItem[] => {
  return getAllExercises().filter(exercise => 
    exercise.equipmentKey?.includes(equipmentId) || false
  );
};

export const getExercisesByDifficulty = (difficulty: 'beginner' | 'intermediate' | 'advanced'): ExerciseItem[] => {
  return getAllExercises().filter(exercise => exercise.difficulty === difficulty);
};

export const toggleFavorite = (exerciseId: string) => {
  for (const category of EXERCISE_CATEGORIES) {
    const exercise = category.exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      exercise.favorite = !exercise.favorite;
      return;
    }
  }
};

export const getAllMuscleGroupsForExercise = (exercise: ExerciseItem): string[] => {
  const muscles: string[] = [];
  
  if (exercise.targetMuscleKey) {
    muscles.push(exercise.targetMuscleKey);
  }
  
  if (exercise.secondaryMuscleKeys) {
    muscles.push(...exercise.secondaryMuscleKeys);
  }
  
  return muscles;
};

// Functions that require the useLanguage hook context
// These should be used within components that have access to the LanguageContext

export const useExerciseHelpers = () => {
  return {
    searchExercises: (query: string, t: (key: string) => string): ExerciseItem[] => {
      const normalizedQuery = query.toLowerCase().trim();
      if (!normalizedQuery) return [];
      
      return getAllExercises().filter(exercise => {
        const exerciseName = t(exercise.nameKey);
        const equipmentName = exercise.equipmentKey ? t(exercise.equipmentKey) : '';
        const targetMuscleName = exercise.targetMuscleKey ? t(exercise.targetMuscleKey) : '';
        
        return exerciseName.toLowerCase().includes(normalizedQuery) ||
               equipmentName.toLowerCase().includes(normalizedQuery) ||
               targetMuscleName.toLowerCase().includes(normalizedQuery);
      });
    },

    filterExercises: (criteria: {
      categoryIds?: string[];
      equipmentIds?: string[];
      difficultyLevels?: ('beginner' | 'intermediate' | 'advanced')[];
      searchQuery?: string;
      favorites?: boolean;
    }, t: (key: string) => string): ExerciseItem[] => {
      let filtered = getAllExercises();
      
      if (criteria.categoryIds && criteria.categoryIds.length > 0) {
        filtered = filtered.filter(exercise => {
          const exerciseCategory = EXERCISE_CATEGORIES.find(cat => 
            cat.exercises.some(ex => ex.id === exercise.id)
          );
          return exerciseCategory ? criteria.categoryIds?.includes(exerciseCategory.id) : false;
        });
      }
      
      if (criteria.equipmentIds && criteria.equipmentIds.length > 0) {
        filtered = filtered.filter(exercise => {
          if (!exercise.equipmentKey) return false;
          
          return criteria.equipmentIds?.some(equipmentId => 
            exercise.equipmentKey?.includes(equipmentId)
          );
        });
      }
      
      if (criteria.difficultyLevels && criteria.difficultyLevels.length > 0) {
        filtered = filtered.filter(exercise => 
          exercise.difficulty ? criteria.difficultyLevels?.includes(exercise.difficulty) : false
        );
      }
      
      if (criteria.searchQuery && criteria.searchQuery.trim()) {
        const query = criteria.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(exercise => {
          const exerciseName = t(exercise.nameKey);
          const equipmentName = exercise.equipmentKey ? t(exercise.equipmentKey) : '';
          const targetMuscleName = exercise.targetMuscleKey ? t(exercise.targetMuscleKey) : '';
          
          return exerciseName.toLowerCase().includes(query) ||
                 equipmentName.toLowerCase().includes(query) ||
                 targetMuscleName.toLowerCase().includes(query);
        });
      }
      
      if (criteria.favorites) {
        filtered = filtered.filter(exercise => exercise.favorite === true);
      }
      
      return filtered;
    },

    getExerciseName: (exercise: ExerciseItem, t: (key: string) => string): string => {
      return t(exercise.nameKey);
    },

    getEquipmentName: (exercise: ExerciseItem, t: (key: string) => string): string => {
      if (!exercise.equipmentKey) return '';
      return t(exercise.equipmentKey);
    },

    getTargetMuscleName: (exercise: ExerciseItem, t: (key: string) => string): string => {
      if (!exercise.targetMuscleKey) return '';
      return t(exercise.targetMuscleKey);
    },

    getSecondaryMuscleNames: (exercise: ExerciseItem, t: (key: string) => string): string[] => {
      if (!exercise.secondaryMuscleKeys || exercise.secondaryMuscleKeys.length === 0) return [];
      
      return exercise.secondaryMuscleKeys.map(muscleKey => t(muscleKey));
    },

    getCategoryName: (categoryId: string, t: (key: string) => string): string => {
      const category = EXERCISE_CATEGORIES.find(cat => cat.id === categoryId);
      if (!category) return categoryId;
      
      return t(category.displayNameKey);
    },

    calculateMuscleGroupContribution: (exerciseName: string, setCount: number, t: (key: string) => string): Record<string, number> => {
      const exercise = getAllExercises().find(ex => t(ex.nameKey).toLowerCase() === exerciseName.toLowerCase());
      
      if (!exercise) {
        return { 'other': setCount };
      }
      
      const contribution: Record<string, number> = {};
      
      if (exercise.targetMuscleKey) {
        const primaryMuscle = exercise.targetMuscleKey.replace('muscle_', '');
        contribution[primaryMuscle] = setCount;
      }
      
      if (exercise.secondaryMuscleKeys && exercise.secondaryMuscleKeys.length > 0) {
        exercise.secondaryMuscleKeys.forEach(muscleKey => {
          const secondaryMuscle = muscleKey.replace('muscle_', '');
          contribution[secondaryMuscle] = (contribution[secondaryMuscle] || 0) + (setCount * 0.5);
        });
      }
      
      return contribution;
    }
  };
};