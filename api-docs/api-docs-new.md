# GymBro API Documentation

## Base URL
```
http://localhost:8000/api/
```

## Authentication
All endpoints except user registration and token endpoints require JWT authentication.

### Auth Endpoints
```
POST /users/token/
{
    "username": string,
    "password": string
}
Response: {
    "access": string,
    "refresh": string
}

POST /users/token/refresh/
{
    "refresh": string
}
Response: {
    "access": string
}
```

## Users API

### Endpoints
```
GET /users/me/
Response: User

PATCH /users/me/
{
    "bio": string?,
    "fitness_goals": string?,
    "training_level": "beginner" | "intermediate" | "advanced",
    "personality_type": "lone_wolf" | "extrovert_bro" | "casual" | "competitor",
    "avatar": file?,
    "preferred_gym": number
}

GET /users/{id}/
Response: User

POST /users/{id}/send_friend_request/
Response: FriendRequest

POST /users/{id}/respond_to_request/
{
    "response": "accept" | "reject"
}

GET /users/friends/
Response: User[]

GET /users/friend_requests/
Response: FriendRequest[]
```

### Types
```typescript
interface User {
    id: number;
    username: string;
    training_level: "beginner" | "intermediate" | "advanced";
    personality_type: "lone_wolf" | "extrovert_bro" | "casual" | "competitor";
    fitness_goals: string;
    bio: string;
    avatar?: string;
    preferred_gym?: number;
    current_program?: Program;
}

interface FriendRequest {
    id: number;
    from_user: User;
    to_user: User;
    status: "pending" | "accepted" | "rejected";
    created_at: string;
}
```

## Workouts API

### Template Endpoints
```
GET /workouts/templates/
Response: WorkoutTemplate[]

POST /workouts/templates/
Request: WorkoutTemplate
Response: WorkoutTemplate

GET /workouts/templates/{id}/
Response: WorkoutTemplate

POST /workouts/templates/{id}/add_exercise/
{
    "name": string,
    "equipment"?: string,
    "notes"?: string,
    "order": number,
    "sets": {
        "reps": number,
        "weight": number,
        "rest_time": number,
        "order": number
    }[]
}

POST /workouts/templates/{id}/copy/
Response: WorkoutTemplate
```

### Program Endpoints
```
GET /workouts/programs/
Response: Program[]

POST /workouts/programs/
Request: Program
Response: Program

GET /workouts/programs/{id}/
Response: Program

POST /workouts/programs/{id}/add_workout/
{
    "template_id": number,
    "preferred_weekday": number,
    "order": number
}

POST /workouts/programs/{id}/fork/
Response: Program

POST /workouts/programs/{id}/like/
Response: { liked: boolean }

POST /workouts/programs/{id}/share/
{
    "username": string
}
```

### Workout Log Endpoints
```
GET /workouts/logs/
Response: WorkoutLog[]

POST /workouts/logs/log_from_instance/
{
    "instance_id": number,
    "date": string,
    "gym_id"?: number,
    "notes"?: string,
    "mood_rating"?: number,
    "perceived_difficulty"?: number,
    "performance_notes"?: string,
    "completed": boolean
}

POST /workouts/logs/create_custom/
{
    "date": string,
    "gym_id"?: number,
    "notes"?: string,
    "exercises": {
        "name": string,
        "equipment"?: string,
        "notes"?: string,
        "order": number,
        "sets": {
            "reps": number,
            "weight": number,
            "rest_time": number,
            "order": number
        }[]
    }[],
    "mood_rating"?: number,
    "perceived_difficulty"?: number,
    "performance_notes"?: string,
    "completed": boolean
}
```

### Types
```typescript
interface WorkoutTemplate {
    id: number;
    name: string;
    description: string;
    split_method: "full_body" | "push_pull_legs" | "upper_lower" | "custom";
    difficulty_level: "beginner" | "intermediate" | "advanced";
    estimated_duration: number;
    equipment_required: string[];
    tags: string[];
    exercises: Exercise[];
    is_public: boolean;
    creator_username: string;
}

interface Exercise {
    id: number;
    name: string;
    equipment?: string;
    notes?: string;
    order: number;
    sets: Set[];
}

interface Set {
    id: number;
    reps: number;
    weight: number;
    rest_time: number;
    order: number;
}

interface Program {
    id: number;
    name: string;
    description: string;
    focus: string;
    sessions_per_week: number;
    workouts: WorkoutInstance[];
    difficulty_level: string;
    recommended_level: string;
    required_equipment: string[];
    estimated_completion_weeks: number;
    tags: string[];
    is_active: boolean;
    is_public: boolean;
    likes_count: number;
    forks_count: number;
    is_liked: boolean;
}

interface WorkoutInstance {
    id: number;
    name: string;
    description: string;
    split_method: string;
    preferred_weekday: number;
    weekday_name: string;
    order: number;
    exercises: Exercise[];
}

interface WorkoutLog {
    id: number;
    name: string;
    date: string;
    gym_id?: number;
    notes?: string;
    completed: boolean;
    mood_rating?: number;
    perceived_difficulty?: number;
    performance_notes?: string;
    exercises: Exercise[];
}
```

## Posts API

### Endpoints
```
GET /posts/
Response: Post[]

POST /posts/
Request: Post
Response: Post

POST /posts/{id}/comment/
{
    "content": string
}
Response: Comment

POST /posts/{id}/like/
Response: void

POST /posts/{id}/share/
{
    "content"?: string
}
Response: Post

GET /posts/feed/
Response: Post[]
```

### Types
```typescript
interface Post {
    id: number;
    content: string;
    image?: string;
    post_type: "regular" | "workout_log" | "program" | "workout_invite" | "shared";
    workout_log?: WorkoutLog;
    program?: Program;
    workout_instance?: WorkoutInstance;
    planned_date?: string;
    invited_users?: User[];
    created_at: string;
    user_username: string;
    comments: Comment[];
    likes_count: number;
    is_liked: boolean;
}

interface Comment {
    id: number;
    content: string;
    created_at: string;
    user_username: string;
}
```

## Gyms API

### Endpoints
```
GET /gyms/
Response: Gym[]

GET /gyms/{id}/
Response: Gym

GET /gyms/{id}/members/
Response: User[]

GET /gyms/{id}/stats/
Response: {
    total_members: number;
    active_today: number;
    workouts_this_week: number;
}
```

### Types
```typescript
interface Gym {
    id: number;
    name: string;
    location: string;
    description: string;
    amenities: object;
    equipment: object;
    opening_hours: object;
    photos: string[];
    member_count: number;
    active_users_today: number;
}
```