// api/services/index.ts
import workoutService from './workoutService';
import programService from './programService';
import logService from './logService';
import gymService from './gymService';
import postService from './postService';
import userService from './userService';
import profilePreviewService from './profilePreviewService';
import userCountService from './userCountService';
import notificationService from './notificationService';

// Re-export services
export { default as workoutService } from './workoutService';
export { default as programService } from './programService';
export { default as logService } from './logService';
export { default as gymService } from './gymService';
export { default as postService } from './postService';
export { default as userService } from './userService';
export { default as profilePreviewService } from './profilePreviewService';
export { default as userCountService } from './userCountService';
export { default as notificationService } from './notificationService';

// Also export as a combined object
export default {
  workoutService,
  programService,
  logService,
  gymService,
  postService,
  userService,
  profilePreviewService,
  userCountService,
  notificationService
};