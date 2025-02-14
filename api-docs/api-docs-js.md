# GymBro API Documentation

## Base URL
```
http:ocalhost:8000/api/
```
# Authentication routes
POST /users/token/
Request: { username: string, password: string }
Response: { access: string, refresh: string }

GET /users/me/
Response: User

POST /users/token/refresh/
Request: { refresh: string }
Response: { access: string }

## Users API

### Endpoints

#### Update profile information

PATCH /api/users/me/
Content-Type: multipart/form-data

{
    "bio": "New bio",
    "fitness_goals": "New goals",
    "training_level": "advanced",
    "personality_type": "extrovert_bro",
    "avatar": <file>,
    "preferred_gym": 1
}

#### Change password
PATCH /api/users/me/
Content-Type: application/json

{
    "current_password": "your_current_password",
    "password": "your_new_password"
}

```javascript
GET /users/
Response: User[]

GET /users/{id}/
Response: User

POST /users/{id}/send_friend_request/
Response: FriendRequest

POST /users/{id}/respond_to_request/
Request: { response: 'accept' | 'reject' }
Response: { status: string }

GET /users/friends/
Response: Friend[]

GET /users/friend_requests/
Response: FriendRequest[]
```

### Types
```javascript
/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {number} preferred_gym
 * @property {'beginner' | 'intermediate' | 'advanced'} training_level
 * @property {'lone_wolf' | 'extrovert_bro' | 'casual' | 'competitor'} personality_type
 * @property {string} fitness_goals
 * @property {number} [current_program]
 * @property {string} bio
 * @property {string} [avatar]
 */

/**
 * @typedef {Object} FriendRequest
 * @property {number} id
 * @property {User} from_user
 * @property {User} to_user
 * @property {'pending' | 'accepted' | 'rejected'} status
 * @property {string} created_at
 */
```

## Gyms API

### Endpoints
```javascript
GET /gyms/
Response: Gym[]

GET /gyms/{id}/
Response: Gym

GET /gyms/{id}/members/
Response: User[]

GET /gyms/{id}/active_members/
Response: User[]

GET /gyms/{id}/stats/
Response: {
  total_members: number,
  active_today: number,
  workouts_this_week: number
}

POST /gyms/{id}/announce/
Request: {
  title: string,
  content: string,
  start_date: string,
  end_date?: string
}
Response: Announcement
```

### Types
```javascript
/**
 * @typedef {Object} Gym
 * @property {number} id
 * @property {string} name
 * @property {string} location
 * @property {string} description
 * @property {Object} amenities
 * @property {Object} equipment
 * @property {Object} opening_hours
 * @property {string[]} photos
 * @property {number} member_count
 * @property {number} active_users_today
 * @property {Announcement[]} announcements
 */

/**
 * @typedef {Object} Announcement
 * @property {number} id
 * @property {string} title
 * @property {string} content
 * @property {string} start_date
 * @property {string} [end_date]
 * @property {string} created_at
 */
```

## Workouts API

### Template Endpoints
```javascript
GET /workouts/templates/
Response: WorkoutTemplate[]

POST /workouts/templates/
Request: WorkoutTemplate
Response: WorkoutTemplate

GET /workouts/templates/{id}/
Response: WorkoutTemplate

POST /workouts/templates/{id}/add_exercise/
Request: {
  name: string,
  equipment?: string,
  notes?: string,
  order: number,
  sets: Set[]
}
Response: Exercise

POST /workouts/templates/{id}/update_workout/
Request: WorkoutTemplate
Response: WorkoutTemplate

POST /workouts/templates/{id}/copy/
Response: WorkoutTemplate

GET /workouts/templates/trending/
Response: WorkoutTemplate[]

GET /workouts/templates/by_equipment/?equipment=<type>
Response: WorkoutTemplate[]
```

### Program Endpoints
```javascript
GET /workouts/programs/
Response: Program[]

POST /workouts/programs/
Request: Program
Response: Program

GET /workouts/programs/{id}/
Response: Program

POST /workouts/programs/{id}/add_workout/
Request: {
  template_id: number,
  preferred_weekday: number,
  order: number
}
Response: WorkoutInstance

POST /workouts/programs/{id}/remove_workout/
Request: { instance_id: number }

POST /workouts/programs/{id}/duplicate_workout/
Request: { instance_id: number }
Response: WorkoutInstance

POST /workouts/programs/{id}/fork/
Response: Program

POST /workouts/programs/{id}/like/
Response: { liked: boolean }

POST /workouts/programs/{id}/share/
Request: { username: string }
Response: ProgramShare

GET /workouts/programs/shared_with_me/
Response: Program[]

GET /workouts/programs/recommend/
Response: Program[]
```

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

### Types
```javascript
/**
 * @typedef {Object} WorkoutTemplate
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {'full_body' | 'push_pull_legs' | 'upper_lower' | 'custom'} split_method
 * @property {'beginner' | 'intermediate' | 'advanced'} difficulty_level
 * @property {number} estimated_duration
 * @property {string[]} equipment_required
 * @property {string[]} tags
 * @property {number} use_count
 * @property {Exercise[]} exercises
 * @property {boolean} is_public
 * @property {string} creator_username
 */

/**
 * @typedef {Object} Exercise
 * @property {number} id
 * @property {string} name
 * @property {string} [equipment]
 * @property {string} [notes]
 * @property {number} order
 * @property {Set[]} sets
 */

/**
 * @typedef {Object} Set
 * @property {number} id
 * @property {number} reps
 * @property {number} weight
 * @property {number} rest_time
 * @property {number} order
 */

/**
 * @typedef {Object} Program
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {string} focus
 * @property {string} difficulty_level
 * @property {string} recommended_level
 * @property {string[]} required_equipment
 * @property {number} estimated_completion_weeks
 * @property {number} sessions_per_week
 * @property {WorkoutInstance[]} workouts
 * @property {string[]} tags
 * @property {boolean} is_active
 * @property {boolean} is_public
 * @property {number} likes_count
 * @property {number} forks_count
 * @property {boolean} is_liked
 * @property {string} creator_username
 */

/**
 * @typedef {Object} WorkoutInstance
 * @property {number} instance_id
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {string} split_method
 * @property {number} preferred_weekday
 * @property {string} weekday_name
 * @property {number} order
 * @property {Exercise[]} exercises
 */

## Posts API

### Endpoints
```javascript
GET /posts/
Response: Post[]

POST /posts/
Request: Post
Response: Post

POST /posts/{id}/comment/
Request: { content: string }
Response: Comment

POST /posts/{id}/like/
Response: void

Share a post
POST /api/posts/{post_id}/share/
Content-Type: application/json

{
    "content": "Optional share comment"
}

Update a post 

PUT /api/posts/{post_id}/
Content-Type: application/json

{
    "content": "Updated content",
    "post_type": "regular",
    ... other fields ...
}

Delete a post 

DELETE /api/posts/{post_id}/

GET /posts/trending/
Response: Post[]

GET /posts/feed/
Response: Post[]
```

### Types
```javascript
/**
 * @typedef {Object} Post
 * @property {number} id
 * @property {string} content
 * @property {'regular' | 'workout_log' | 'program' | 'workout_invite'} post_type
 * @property {number} [workout_log]
 * @property {number} [program]
 * @property {number} [workout_instance]
 * @property {string} [planned_date]
 * @property {number[]} [invited_users]
 * @property {string} [image]
 * @property {string} created_at
 * @property {string} user_username
 * @property {string} [user_profile_picture]
 * @property {Comment[]} comments
 * @property {number} likes_count
 * @property {boolean} is_liked
 */

/**
 * @typedef {Object} Comment
 * @property {number} id
 * @property {string} content
 * @property {string} created_at
 * @property {string} user_username
 * @property {string} [user_profile_picture]
 */
```