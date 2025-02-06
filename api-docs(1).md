# GymBro API Documentation

## Base URL
```
http://localhost:8000/api/
```

## Authentication
All endpoints require JWT authentication:
```bash
Authorization: Bearer <token>
```

## Users API

### Endpoints
```typescript
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
```typescript
interface User {
  id: number
  username: string
  preferred_gym: number
  training_level: 'beginner' | 'intermediate' | 'advanced'
  personality_type: 'lone_wolf' | 'extrovert_bro' | 'casual' | 'competitor'
  fitness_goals: string
  current_program?: number
  bio: string
  avatar?: string
}

interface FriendRequest {
  id: number
  from_user: User
  to_user: User 
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}
```

## Gyms API

### Endpoints
```typescript
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
  total_members: number
  active_today: number
  workouts_this_week: number
}

POST /gyms/{id}/announce/
Request: {
  title: string
  content: string
  start_date: string
  end_date?: string
}
Response: Announcement
```

### Types
```typescript
interface Gym {
  id: number
  name: string
  location: string
  description: string
  amenities: Record<string, any>
  equipment: Record<string, any>
  opening_hours: Record<string, any>
  photos: string[]
  member_count: number
  active_users_today: number
  announcements: Announcement[]
}

interface Announcement {
  id: number
  title: string
  content: string
  start_date: string
  end_date?: string
  created_at: string
}
```

## Workouts API

### Template Endpoints
```typescript
GET /workouts/templates/
Response: WorkoutTemplate[]

POST /workouts/templates/
Request: WorkoutTemplate
Response: WorkoutTemplate

GET /workouts/templates/{id}/
Response: WorkoutTemplate

POST /workouts/templates/{id}/add_exercise/
Request: {
  name: string
  equipment?: string
  notes?: string
  order: number
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
```typescript
GET /workouts/programs/
Response: Program[]

POST /workouts/programs/
Request: Program
Response: Program

GET /workouts/programs/{id}/
Response: Program

POST /workouts/programs/{id}/add_workout/
Request: {
  template_id: number
  preferred_weekday: number
  order: number
}
Response: WorkoutInstance

POST /workouts/programs/{id}/remove_workout/
Request: { instance_id: number }

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
```typescript
GET /workouts/logs/
Response: WorkoutLog[]

POST /workouts/logs/log_from_instance/
Request: {
  instance_id: number
  date: string
  gym_id?: number
  notes?: string
}
Response: WorkoutLog

POST /workouts/logs/{id}/update_exercise/
Request: {
  exercise_id: number
  name?: string
  equipment?: string
  notes?: string
  sets?: Set[]
}
Response: Exercise

GET /workouts/logs/stats/
Query: start_date?, end_date?
Response: {
  total_workouts: number
  completed_workouts: number
  completion_rate: number
}
```

### Types
```typescript
interface WorkoutTemplate {
  id: number
  name: string
  description: string
  split_method: 'full_body' | 'push_pull_legs' | 'upper_lower' | 'custom'
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_duration: number
  equipment_required: string[]
  tags: string[]
  use_count: number
  exercises: Exercise[]
  is_public: boolean
  creator_username: string
}

interface Exercise {
  id: number
  name: string
  equipment?: string
  notes?: string
  order: number
  sets: Set[]
}

interface Set {
  id: number
  reps: number
  weight: number
  rest_time: number
  order: number
}

interface Program {
  id: number
  name: string
  description: string
  focus: string
  difficulty_level: string
  recommended_level: string
  required_equipment: string[]
  estimated_completion_weeks: number
  sessions_per_week: number
  workouts: WorkoutInstance[]
  tags: string[]
  is_active: boolean
  is_public: boolean
  likes_count: number
  forks_count: number
  is_liked: boolean
  creator_username: string
}

interface WorkoutInstance {
  instance_id: number
  id: number
  name: string
  description: string
  split_method: string
  preferred_weekday: number
  weekday_name: string
  order: number
  exercises: Exercise[]
}

interface WorkoutLog {
  id: number
  user: number
  username: string
  program?: number
  program_name?: string
  workout_instance?: number
  workout_name?: string
  date: string
  gym?: number
  gym_name?: string
  notes?: string
  mood_rating?: number
  perceived_difficulty?: number
  performance_notes?: string
  media: string[]
  completed: boolean
  exercises: Exercise[]
}
```

## Posts API

### Endpoints
```typescript
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

GET /posts/trending/
Response: Post[]

GET /posts/feed/
Response: Post[]
```

### Types
```typescript
interface Post {
  id: number
  content: string
  post_type: 'regular' | 'workout_log' | 'program' | 'workout_invite'
  workout_log?: number
  program?: number
  workout_instance?: number
  planned_date?: string
  invited_users?: number[]
  image?: string
  created_at: string
  user_username: string
  user_profile_picture?: string
  comments: Comment[]
  likes_count: number
  is_liked: boolean
}

interface Comment {
  id: number
  content: string
  created_at: string
  user_username: string
  user_profile_picture?: string
}
```