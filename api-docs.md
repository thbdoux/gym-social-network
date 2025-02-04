# GymBro API Documentation

## Base URL
```
http://localhost:8000/api/workouts/
```

## Authentication
All endpoints require JWT authentication. Include the token in requests:
```javascript
headers: {
  'Authorization': 'Bearer <your_token>'
}
```

## Core Concepts

### Workout Templates
Templates are the building blocks of workouts. They contain exercises and their sets.
- Can be private or public
- Can be copied
- Contain exercises and sets

### Programs
Programs are collections of workout templates organized into a routine.
- Can be public or private
- Can be shared with specific users
- Can be liked and forked
- Contains workout instances (specific occurrences of templates)

### Workout Logs
Records of performed workouts, linked to program instances.
- Track actual performance
- Can vary from the template
- Include exercise and set details

## Endpoints

### Workout Templates

#### Get All Templates
```javascript
GET /templates/

// Response
[{
  id: number,
  name: string,
  description: string,
  split_method: "full_body" | "push_pull_legs" | "upper_lower" | "custom",
  creator_username: string,
  is_public: boolean,
  exercises: [{
    id: number,
    name: string,
    equipment: string,
    notes: string,
    order: number,
    sets: [{
      id: number,
      reps: number,
      weight: number,
      rest_time: number,
      order: number
    }]
  }],
  created_at: string,
  updated_at: string
}]
```

#### Create Template
```javascript
POST /templates/
{
  name: string,
  description?: string,
  split_method: string,
  is_public: boolean
}
```

#### Add Exercise to Template
```javascript
POST /templates/{template_id}/add_exercise/
{
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
}
```

#### Update a template

POST /api/workouts/templates/{template_id}/update_workout/
{
    "name": "Updated Workout Name",
    "description": "Updated description",
    "split_method": "push_pull_legs",
    "is_public": true,
    "exercises": [
        {
            "id": 1,  // Existing exercise - will update
            "name": "Updated Bench Press",
            "equipment": "Barbell",
            "notes": "Updated notes",
            "order": 1,
            "sets": [
                {
                    "id": 1,  // Existing set - will update
                    "reps": 10,
                    "weight": 75,
                    "rest_time": 90,
                    "order": 1
                },
                {   // No ID - will create new set
                    "reps": 8,
                    "weight": 80,
                    "rest_time": 90,
                    "order": 2
                }
            ]
        },
        {   // No ID - will create new exercise
            "name": "New Exercise",
            "equipment": "Dumbbells",
            "order": 2,
            "sets": [
                {
                    "reps": 12,
                    "weight": 20,
                    "rest_time": 60,
                    "order": 1
                }
            ]
        }
    ]
}

#### Copy Template
```javascript
POST /templates/{template_id}/copy/
// Creates a new template with copied exercises and sets
```

### Programs

#### Get All Programs
```javascript
GET /programs/

// Response includes available, shared, and public programs
[{
  id: number,
  name: string,
  description: string,
  focus: "strength" | "hypertrophy" | "endurance" | "weight_loss" | "strength_hypertrophy" | "general_fitness",
  sessions_per_week: number,
  workouts: [{
    instance_id: number,    // Important: Use this ID for instance operations
    id: number,             // Original template ID
    name: string,
    description: string,
    split_method: string,
    preferred_weekday: number,  // 0-6 (Mon-Sun)
    weekday_name: string,
    order: number,
    exercises: [/* ... */]
  }],
  creator_username: string,
  is_active: boolean,
  is_public: boolean,
  likes_count: number,
  forks_count: number,
  is_liked: boolean,
  forked_from?: number,
  created_at: string,
  updated_at: string
}]
```

#### Create Program
```javascript
POST /programs/
{
  name: string,
  description?: string,
  focus: string,
  sessions_per_week: number,
  is_public?: boolean
}
```

#### Add Workout to Program
```javascript
POST /programs/{program_id}/add_workout/
{
  template_id: number,
  preferred_weekday: number,  // 0-6 (Mon-Sun)
  order: number
}
```

#### Remove Workout from Program
```javascript
POST /programs/{program_id}/remove_workout/
{
  instance_id: number
}
```

// Update weekday
POST /api/workouts/programs/{program_id}/update_workout/
{
    "instance_id": 123,
    "preferred_weekday": 2  // Wednesday
}

// Update order
POST /api/workouts/programs/{program_id}/update_workout/
{
    "instance_id": 123,
    "order": 4  // Move to position 4
}

// Update both
POST /api/workouts/programs/{program_id}/update_workout/
{
    "instance_id": 123,
    "preferred_weekday": 2,
    "order": 4
}

#### Social Features
```javascript
// Fork program
POST /programs/{program_id}/fork/

// Like/unlike program
POST /programs/{program_id}/like/

// Share program
POST /programs/{program_id}/share/
{
  username: string
}

// Get shared programs
GET /programs/shared_with_me/

// Get my programs
GET /programs/my_programs/
```

### Workout Logs

#### Create Log from Program Instance
```javascript
POST /logs/log_from_instance/
{
  instance_id: number,
  date: string,        // YYYY-MM-DD
  gym_id?: number,
  notes?: string
}

// Response
{
  id: number,
  user: number,
  username: string,
  program: number,
  program_name: string,
  workout_instance: number,
  workout_name: string,
  date: string,
  gym?: number,
  gym_name?: string,
  notes: string,
  completed: boolean,
  exercises: [{
    id: number,
    template: number,
    template_name: string,
    name: string,
    equipment: string,
    notes: string,
    order: number,
    sets: [{
      id: number,
      template: number,
      reps: number,
      weight: number,
      rest_time: number,
      order: number
    }]
  }],
  created_at: string
}
```

#### Update Exercise in Log
```javascript
POST /logs/{log_id}/update_exercise/
{
  exercise_id: number,
  name?: string,
  equipment?: string,
  notes?: string,
  sets?: [{
    reps: number,
    weight: number,
    rest_time: number,
    order: number
  }]
}
```

#### Get User Statistics
```javascript
GET /logs/stats/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD

// Response
{
  total_workouts: number,
  completed_workouts: number,
  completion_rate: number
}
```

## Best Practices

1. **Instance IDs vs Template IDs**
   - Use `instance_id` when working with program workouts
   - Use template `id` when referencing templates directly

2. **Error Handling**
   - All endpoints return appropriate HTTP status codes
   - Error responses include a `detail` field with explanation

3. **Performance Tips**
   - Use appropriate filters and search parameters
   - Fetch only needed data using query parameters
   - Cache frequently accessed templates and programs

4. **Social Features**
   - Check `is_public` before displaying programs
   - Use `forked_from` to show program lineage
   - Handle shared programs appropriately in UI

5. **Workout Logging**
   - Always create logs from instances for proper tracking
   - Update exercises individually for better performance
   - Use the stats endpoint for progress visualization