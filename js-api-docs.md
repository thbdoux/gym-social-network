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

### Programs

#### Get All Programs
```javascript
GET /workouts/programs/

Query Parameters:
active: Boolean  // Filter by active status

Response:
[
  {
    id: Number,
    name: String,
    description: String,
    focus: String,      // One of: "strength", "hypertrophy", "endurance", "weight_loss", "strength_hypertrophy", "general_fitness"
    sessions_per_week: Number,
    is_active: Boolean,
    workouts: [         // Direct list of workout templates in this program
      {
        id: Number,
        name: String,
        description: String,
        split_method: String,
        preferred_weekday: Number,  // 0-6 (Monday-Sunday)
        weekday_name: String,      // Monday-Sunday
        order: Number,             // Position in program's rotation
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
    ],
    created_at: String,
    updated_at: String
  }
]
```

#### Create Program
```javascript
POST /workouts/programs/
Content-Type: application/json

Request Body:
{
  name: String,
  description: String,     // Optional
  focus: String,          // One of: "strength", "hypertrophy", "endurance", "weight_loss", "strength_hypertrophy", "general_fitness"
  sessions_per_week: Number,
  is_active: Boolean      // Optional, defaults to true
}
```

#### Add Workout to Program
```javascript
POST /workouts/programs/{program_id}/add_workout/
Content-Type: application/json

Request Body:
// Option 1: Using existing template
{
  template_id: Number,
  preferred_weekday: Number,   // 0-6 (Monday-Sunday)
  order: Number               // Position in program's rotation
}

// Option 2: Creating new template
{
  name: String,
  description: String,
  split_method: String,       // One of: "full_body", "push_pull_legs", "upper_lower", "custom"
  preferred_weekday: Number,  // 0-6 (Monday-Sunday)
  order: Number              // Position in program's rotation
}

Response: WorkoutTemplate object
```

#### Remove Workout from Program 
```javascript
POST /workouts/programs/{program_id}/remove_workout/
Content-Type: application/json

Request Body:
{
  template_id: Number
}
```

### Workout templates

#### Get all templates 
```javascript
GET /workouts/templates/

Response:
[
  {
    id: Number,
    name: String,
    description: String,
    split_method: String,  // One of: "full_body", "push_pull_legs", "upper_lower", "custom"
    program: Number,       // Program ID if assigned to a program, null otherwise
    program_name: String,  // Name of the program if assigned
    preferred_weekday: Number,  // 0-6 if in a program, null otherwise
    weekday_name: String,      // Monday-Sunday if in a program
    order: Number,             // Position in program if assigned
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
    ],
    created_at: String,
    updated_at: String
  }
]
```

#### Create templates
```javascript
POST /workouts/templates/
Content-Type: application/json

Request Body:
{
  name: String,
  description: String,  // Optional
  split_method: String, // One of: "full_body", "push_pull_legs", "upper_lower", "custom"
  program: Number,      // Optional - Program ID if creating directly in a program
  preferred_weekday: Number,  // Optional - Required if program is specified
  order: Number        // Optional - Required if program is specified
}
```

#### Update templates

```javascript
PATCH /workouts/templates/{template_id}/update_details/
Content-Type: application/json

Request Body:
{
  name?: String,
  description?: String,
  split_method?: String,    // One of: "full_body", "push_pull_legs", "upper_lower", "custom"
  preferred_weekday?: Number,  // 0-6 (Monday-Sunday)
  order?: Number
}
```
#### add exercise to template

```javascript
POST /workouts/templates/{template_id}/add_exercise/
Content-Type: application/json

Request Body:
{
  name: String,
  equipment: String,      // Optional
  notes: String,         // Optional
  order: Number,
  sets: [                // Optional
    {
      reps: Number,
      weight: Number,
      rest_time: Number,  // in seconds
      order: Number
    }
  ]
}
```

#### Delete exercise

```javascript
DELETE /workouts/templates/{template_id}/remove_exercise/
Content-Type: application/json

Request Body:
{
  exercise_id: Number
}

```

### Workout Logs

#### Get All Logs
```javascript
GET /workouts/logs/

Response:
[
  {
    id: Number,
    workout_template: Number,
    template_name: String,
    program: Number,
    program_name: String,
    date: String,         // YYYY-MM-DD
    gym: Number,
    gym_name: String,
    notes: String,
    completed: Boolean,
    exercises: [
      {
        id: Number,
        template: Number,
        template_name: String,
        name: String,
        equipment: String,
        notes: String,
        order: Number,
        sets: [
          {
            id: Number,
            template: Number,
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

#### Create Log from Template
```javascript
POST /workouts/logs/log_from_template/
Content-Type: application/json

Request Body:
{
  template_id: Number,
  program_id: Number,    // Optional
  date: String,          // YYYY-MM-DD
  gym_id: Number,        // Optional
  notes: String          // Optional
}
```

#### Log Exercise
```javascript
POST /workouts/logs/{log_id}/log_exercise/
Content-Type: application/json

Request Body:
{
  template: Number,      // Optional - ExerciseTemplate ID
  name: String,
  equipment: String,     // Optional
  notes: String,         // Optional
  order: Number,
  sets: [
    {
      template: Number,  // Optional - SetTemplate ID
      reps: Number,
      weight: Number,
      rest_time: Number,
      order: Number
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


### Workouts

```javascript
// Create a workout template with exercises
const createTemplate = async (templateData) => {
  try {
    // Create template
    const template = await axios.post('/workouts/templates/', {
      name: "Upper Body Strength",
      description: "Focus on chest and shoulders",
      split_method: "upper_lower"
    });

    // Add exercises
    await axios.post(`/workouts/templates/${template.data.id}/add_exercise/`, {
      name: "Bench Press",
      equipment: "Barbell",
      order: 1,
      sets: [
        { reps: 8, weight: 60, rest_time: 90, order: 1 },
        { reps: 8, weight: 62.5, rest_time: 90, order: 2 },
        { reps: 8, weight: 65, rest_time: 90, order: 3 }
      ]
    });

    return template.data;
  } catch (error) {
    console.error('Failed to create template:', error);
    throw error;
  }
};


const createProgram = async () => {
  try {
    // Create program
    const program = await axios.post('/workouts/programs/', {
      name: "Strength Focus",
      description: "4-day split focusing on compound movements",
      focus: "strength",
      sessions_per_week: 4
    });

    // Add workouts to program using existing template
    await axios.post(`/workouts/programs/${program.data.id}/add_workout/`, {
      template_id: 1,  // ID of existing workout template
      preferred_weekday: 1,  // Monday
      order: 1
    });

    // Or create and add a new workout directly
    await axios.post(`/workouts/programs/${program.data.id}/add_workout/`, {
      name: "Upper Body Strength",
      description: "Chest, shoulders, and triceps focus",
      split_method: "upper_lower",
      preferred_weekday: 3,  // Wednesday
      order: 2
    });

    return program.data;
  } catch (error) {
    console.error('Failed to create program:', error);
    throw error;
  }
};

// Example usage with TypeScript types for clarity
interface CreateProgramData {
  name: string;
  description?: string;
  focus: 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'strength_hypertrophy' | 'general_fitness';
  sessions_per_week: number;
  is_active?: boolean;
}

interface AddWorkoutData {
  // When using existing template
  template_id?: number;
  // When creating new template
  name?: string;
  description?: string;
  split_method?: 'full_body' | 'push_pull_legs' | 'upper_lower' | 'custom';
  // Required for both cases
  preferred_weekday: number;  // 0-6 (Monday-Sunday)
  order: number;
}

// Add workout to program
const addWorkoutToProgram = async (programId, workoutData) => {
  try {
    const response = await axios.post(
      `/workouts/programs/${programId}/add_workout/`,
      workoutData
    );
    return response.data;
  } catch (error) {
    console.error('Failed to add workout to program:', error);
    throw error;
  }
};

// Remove workout from program
const removeWorkoutFromProgram = async (programId, templateId) => {
  try {
    await axios.post(`/workouts/programs/${programId}/remove_workout/`, {
      template_id: templateId
    });
  } catch (error) {
    console.error('Failed to remove workout from program:', error);
    throw error;
  }
};

// Get program with workouts
const getProgram = async (programId) => {
  try {
    const response = await axios.get(`/workouts/programs/${programId}/`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch program:', error);
    throw error;
  }
};

// Log a workout from template
const logWorkout = async () => {
  try {
    const log = await axios.post('/workouts/logs/log_from_template/', {
      template_id: 1,
      program_id: 1,
      date: '2025-01-30',
      gym_id: 1,
      notes: "Feeling strong today"
    });

    return log.data;
  } catch (error) {
    console.error('Failed to log workout:', error);
    throw error;
  }
};
```
