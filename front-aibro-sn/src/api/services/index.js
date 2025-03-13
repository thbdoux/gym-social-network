// src/api/services/index.js
import workoutService from './workoutService';
import programService from './programService';
import logService from './logService';
import gymService from './gymService';
import postService from './postService';
import userService from './userService';

// Re-export services
export { default as workoutService } from './workoutService';
export { default as programService } from './programService';
export { default as logService } from './logService';
export { default as gymService } from './gymService';
export { default as postService } from './postService';
export { default as userService } from './userService';

// Also export as a combined object for legacy support
export default {
  workoutService,
  programService,
  logService,
  gymService,
  postService,
  userService
};