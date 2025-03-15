/**
 * This file provides legacy hooks that maintain the same API but use React Query internally.
 * This helps with backward compatibility while we transition to React Query.
 */

 import { useWorkoutTemplatesLegacy } from '../query/useWorkoutTemplatesQuery';
 import { useWorkoutPlansLegacy } from '../query/useWorkoutPlansQuery';
 import { useWorkoutLogsLegacy } from '../query/useWorkoutLogsQuery';
 import { useGymsLegacy } from '../query/useGymsQuery';
 
 // Export hooks with their original names
 export const useWorkoutTemplates = useWorkoutTemplatesLegacy;
 export const useWorkoutPlans = useWorkoutPlansLegacy;
 export const useWorkoutLogs = useWorkoutLogsLegacy;
 export const useGyms = useGymsLegacy;