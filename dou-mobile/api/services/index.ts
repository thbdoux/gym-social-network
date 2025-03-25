// api/services/index.ts
import workoutService from './workoutService';
import postService from './postService';
import userService from './userService';

// Re-export services
export { default as workoutService } from './workoutService';
export { default as postService } from './postService';
export { default as userService } from './userService';

// Also export as a combined object
export default {
  workoutService,
  postService,
  userService,
};