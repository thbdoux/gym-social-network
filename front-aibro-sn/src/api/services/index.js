// src/api/services/index.js
import workoutService from './workoutService';
import programService from './programService';
import logService from './logService';
import gymService from './gymService';

// Re-export services
export { default as workoutService } from './workoutService';
export { default as programService } from './programService';
export { default as logService } from './logService';
export { default as gymService } from './gymService';

// Also export as a combined object for legacy support
export default {
  workoutService,
  programService,
  logService,
  gymService
};