# GymBro API Documentation

[Previous sections remain unchanged...]

## Workouts API

[Previous Template and Program endpoints remain unchanged...]

### Workout Log Endpoints
```javascript
GET /workouts/logs/
Response: WorkoutLog[]

// Get next workout suggestion from active program
GET /workouts/logs/next_workout/
Response: {
  program: Program,
  next_workout: WorkoutInstance
}

// Create a workout log from a program instance
POST /workouts/logs/log_from_instance/
Request: {
  instance_id: number,
  date: string,
  gym_id?: number,
  notes?: string,
  mood_rating?: number,
  perceived_difficulty?: number,
  performance_notes?: string,
  media?: string[],
  completed?: boolean
}
Response: WorkoutLog

// Create a custom workout log
POST /workouts/logs/create_custom/
Request: {
  date: string,
  gym_id?: number,
  notes?: string,
  exercises: [{
    name: string,
    equipment?: string,
    notes?: string,
    order: number,
    sets: [{
      reps: number,
      weight: number,
      rest_time: number,
      order: number
    }]
  }],
  mood_rating?: number,
  perceived_difficulty?: number,
  performance_notes?: string,
  media?: string[],
  completed?: boolean
}
Response: WorkoutLog

POST /workouts/logs/{id}/update_exercise/
Request: {
  exercise_id: number,
  name?: string,
  equipment?: string,
  notes?: string,
  sets?: Set[]
}
Response: Exercise

GET /workouts/logs/stats/
Query: start_date?, end_date?
Response: {
  total_workouts: number,
  completed_workouts: number,
  completion_rate: number
}
```

### Types
```javascript
/**
 * @typedef {Object} WorkoutLog
 * @property {number} id
 * @property {number} user
 * @property {string} username
 * @property {number} [program]
 * @property {string} [program_name]
 * @property {number} [workout_instance]
 * @property {string} [workout_name]
 * @property {string} date
 * @property {number} [gym]
 * @property {string} [gym_name]
 * @property {string} [notes]
 * @property {number} [mood_rating] - Rating from 1-5
 * @property {number} [perceived_difficulty] - Rating from 1-5
 * @property {string} [performance_notes]
 * @property {string[]} media - Array of media URLs
 * @property {boolean} completed - Whether the workout was completed
 * @property {Exercise[]} exercises
 * @property {string} created_at
 */
```

[Rest of the documentation remains unchanged...]