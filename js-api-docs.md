# AiBro Social Network - API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication
The API uses JWT (JSON Web Token) authentication. Include the token in all requests (except login and registration) using the Authorization header:
```
Authorization: Bearer <your_token>
```

### Authentication Endpoints

#### Register
```javascript
POST /users/
Content-Type: application/json

Request Body:
{
  username: String,
  email: String,
  password: String,
  first_name: String,  // Optional
  last_name: String,   // Optional
  fitness_practice: String,  // One of: "bodybuilding", "crossfit", "powerlifting", "hyrox"
  training_level: String,    // One of: "beginner", "intermediate", "advanced"
  personality: String,       // One of: "lone_wolf", "extrovert", "mentor", "student"
  goals: String             // Optional
}
```

#### Login
```javascript
POST /users/token/
Content-Type: application/json

Request Body:
{
  username: String,
  password: String
}

Response:
{
  access: String,    // JWT access token
  refresh: String    // JWT refresh token
}
```

#### Refresh Token
```javascript
POST /users/token/refresh/
Content-Type: application/json

Request Body:
{
  refresh: String    // Your refresh token
}
```

## User Management

### Get Current User Profile
```javascript
GET /users/me/

Response:
{
  id: Number,
  username: String,
  email: String,
  first_name: String,
  last_name: String,
  surname: String,
  bio: String,
  profile_picture: String || null,
  gym: Number || null,
  fitness_practice: String,
  training_level: String,
  personality: String,
  goals: String,
  schedule: [
    {
      id: Number,
      day: Number,
      day_name: String,
      preferred_time: String
    }
  ],
  friends_count: Number,
  friends: []  // Array of User objects, only in detailed view
}
```

### Friend Management
```javascript
// Add Friend
POST /users/{user_id}/add_friend/

// Remove Friend
POST /users/{user_id}/remove_friend/
```

## Gyms

### Get All Gyms
```javascript
GET /gyms/

Response:
[
  {
    id: Number,
    name: String,
    location: String,
    description: String,
    amenities: Object,
    member_count: Number
  }
]
```

### Search Gyms
```javascript
GET /gyms/search/?q=search_term

Response: Same as Get All Gyms
```

## Posts

### Get Feed
```javascript
GET /posts/feed/

Response:
[
  {
    id: Number,
    content: String,
    image: String || null,
    created_at: String,
    updated_at: String,
    user_username: String,
    user_profile_picture: String,
    comments: [
      {
        id: Number,
        content: String,
        created_at: String,
        user_username: String,
        user_profile_picture: String
      }
    ],
    likes_count: Number,
    is_liked: Boolean,
    workout_log: Number || undefined
  }
]
```

### Create Post
```javascript
POST /posts/
Content-Type: application/json

Request Body:
{
  content: String,
  image: File,        // Multipart form data if including image
  workout_log: Number // Optional workout reference
}
```

### Post Interactions
```javascript
// Like a post
POST /posts/{post_id}/like/

// Unlike a post
DELETE /posts/{post_id}/like/

// Comment on a post
POST /posts/{post_id}/comment/
{
  content: String
}
```

## Workouts

### Get User's Workouts
```javascript
GET /workouts/workouts/

Response:
[
  {
    id: Number,
    name: String,
    description: String,
    frequency: String,
    split_method: String,
    is_template: Boolean,
    exercises: [
      {
        id: Number,
        name: String,
        equipment: String,
        notes: String,
        order: Number,
        sets: [
          {
            id: Number,
            reps: Number,
            weight: Number,
            rest_time: Number,
            order: Number
          }
        ]
      }
    ]
  }
]
```

## Workouts

### Create Workout
```javascript
POST /workouts/workouts/
Content-Type: application/json

Request Body:
{
  name: String,
  description: String,  // Optional
  frequency: String,
  split_method: String, // One of: "full_body", "push_pull_legs", "upper_lower", "custom"
  is_template: Boolean  // Optional
}
```

### Workout Plans

#### Create Plan
```javascript
POST /workouts/plans/
Content-Type: application/json

Request Body:
{
  name: String,
  description: String,  // Optional
  focus: String,       // One of: "strength", "hypertrophy", "endurance", "weight_loss", "strength_hypertrophy", "general_fitness"
  sessions_per_week: Number,
  is_active: Boolean   // Optional, defaults to true
}

Response:
{
  id: Number,
  name: String,
  description: String,
  focus: String,
  sessions_per_week: Number,
  is_active: Boolean,
  created_at: String,
  updated_at: String,
  plan_workouts: []
}
```

#### Get All Plans
```javascript
GET /workouts/plans/

Query Parameters:
active: Boolean  // Filter by active status

Response:
[
  {
    id: Number,
    name: String,
    description: String,
    focus: String,
    sessions_per_week: Number,
    is_active: Boolean,
    created_at: String,
    updated_at: String,
    plan_workouts: [
      {
        id: Number,
        workout: Number,
        workout_name: String,
        preferred_weekday: Number,
        weekday_name: String,
        order: Number,
        notes: String
      }
    ]
  }
]
```

#### Add Workout to Plan
```javascript
POST /workouts/plans/{plan_id}/add_workout/
Content-Type: application/json

Request Body:
{
  workout: Number,           // Workout ID
  preferred_weekday: Number, // 0-6 (Monday-Sunday)
  order: Number,            // Order in the week's rotation
  notes: String             // Optional
}

Response:
{
  id: Number,
  workout: Number,
  workout_name: String,
  preferred_weekday: Number,
  weekday_name: String,
  order: Number,
  notes: String
}
```

#### Toggle Plan Status
```javascript
POST /workouts/plans/{plan_id}/toggle_active/

Response:
{
  id: Number,
  name: String,
  is_active: Boolean,
  // ... other plan fields
}
```

### Log a Workout
```javascript
POST /workouts/logs/
Content-Type: application/json

Request Body:
{
  workout: Number,    // Workout ID
  plan: Number,      // Optional - WorkoutPlan ID if following a plan
  date: String,      // YYYY-MM-DD
  gym: Number,       // Gym ID (Optional)
  notes: String,     // Optional
  completed: Boolean
}

Response:
{
  id: Number,
  workout: Number,
  workout_name: String,
  plan: Number,
  plan_name: String,
  date: String,
  gym: Number,
  gym_name: String,
  notes: String,
  completed: Boolean,
  logged_sets: [
    {
      id: Number,
      exercise_name: String,
      reps: Number,
      weight: Number,
      order: Number
    }
  ]
}
```
### Get Workout Statistics
```javascript
GET /workouts/logs/stats/

Response:
{
  total_workouts: Number,
  completed_workouts: Number,
  workouts_by_type: [
    {
      split_method: String,
      count: Number
    }
  ],
  workouts_by_gym: [
    {
      gym_name: String,
      count: Number
    }
  ]
}
```

## Important Notes for Frontend Development

1. **Image Uploads**
   - Use multipart/form-data for requests with image uploads
   - Supported in profile pictures and post images

2. **Error Handling**
   - All endpoints return appropriate HTTP status codes
   - Error responses include a message field explaining the error

3. **Date Formats**
   - API expects dates in ISO format (YYYY-MM-DD)
   - Times should be in 24-hour format (HH:MM:SS)

4. **Pagination**
   - List endpoints return paginated results
   - Default page size is 10 items
   - Response includes next/previous page URLs

## Example Frontend Implementation Snippets

### Authentication Setup
```javascript
// axios setup with interceptor
import axios from 'axios';

// Base URL
axios.defaults.baseURL = 'http://localhost:8000/api';

// Add token to all requests
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Login Implementation
```javascript
const login = async (username, password) => {
  try {
    const response = await axios.post('/users/token/', { username, password });
    localStorage.setItem('token', response.data.access);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
```

### Feed Implementation
```javascript
const fetchFeed = async () => {
  try {
    const response = await axios.get('/posts/feed/');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch feed:', error);
    throw error;
  }
};
```

### Workout Logging
```javascript
const logWorkout = async (workoutData) => {
  try {
    const response = await axios.post('/workouts/logs/', workoutData);
    return response.data;
  } catch (error) {
    console.error('Failed to log workout:', error);
    throw error;
  }
};
```

### Image Upload Example
```javascript
const uploadPostWithImage = async (content, image) => {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('image', image);

  try {
    const response = await axios.post('/posts/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to create post:', error);
    throw error;
  }
};
```