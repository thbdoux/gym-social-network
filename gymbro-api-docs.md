# GymBro Social Network API Documentation

## Authentication

Authentication uses JWT tokens:
- `POST /users/token/` - Obtain token pair
- `POST /users/token/refresh/` - Refresh token

## User Management

### Endpoints

- `GET /users/me/` - Current user profile
- `PATCH /users/me/` - Update current user profile
- `GET /users/` - List all users
- `GET /users/{id}/` - Get user details
- `POST /users/` - Create new user (registration)
- `PUT /users/{id}/` - Update user
- `DELETE /users/{id}/` - Delete user

### User Model

```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "training_level": "beginner|intermediate|advanced",
  "personality_type": "lone_wolf|extrovert_bro|casual|competitor",
  "fitness_goals": "string",
  "bio": "string",
  "avatar": "string (URL)",
  "preferred_gym": "gym_id",
  "current_program": {
    "id": 1,
    "name": "string",
    "focus": "string",
    "sessions_per_week": 0,
    "difficulty_level": "string"
  }
}
```

### Social Features

- `POST /users/{id}/send_friend_request/` - Send friend request
- `POST /users/{id}/respond_to_request/` - Accept/reject request (data: `{"response": "accept"|"reject"}`)
- `GET /users/friends/` - List friends
- `GET /users/friend_requests/` - List friend requests
- `POST /users/{id}/remove_friend/` - Remove friend

## Gyms

### Endpoints

- `GET /gyms/` - List gyms
- `GET /gyms/{id}/` - Get gym details
- `POST /gyms/` - Create new gym
- `PUT /gyms/{id}/` - Update gym
- `DELETE /gyms/{id}/` - Delete gym

### Gym Model

```json
{
  "id": 1,
  "name": "string",
  "location": "string",
  "description": "string",
  "amenities": {},
  "equipment": {},
  "opening_hours": {},
  "photos": [],
  "member_count": 0,
  "active_users_today": 0,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Gym Features

- `GET /gyms/{id}/members/` - List gym members
- `GET /gyms/{id}/active_members/` - List currently active members
- `GET /gyms/{id}/stats/` - Get gym statistics
  ```json
  {
    "total_members": 0,
    "active_today": 0,
    "workouts_this_week": 0
  }
  ```
- `POST /gyms/{id}/announce/` - Create gym announcement

## Workouts

### Templates

- `GET /workouts/templates/` - List workout templates
- `POST /workouts/templates/` - Create workout template
- `GET /workouts/templates/{id}/` - Get template details
- `PUT /workouts/templates/{id}/` - Update template
- `DELETE /workouts/templates/{id}/` - Delete template
- `POST /workouts/templates/{id}/add_exercise/` - Add exercise to template
- Various operations for exercises via `/workouts/templates/{id}/exercises/{exercise_id}`

### Template Model

```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "split_method": "full_body|push_pull_legs|upper_lower|custom",
  "creator_username": "string",
  "is_public": false,
  "exercises": [
    {
      "id": 1,
      "name": "string",
      "equipment": "string",
      "notes": "string",
      "order": 0,
      "sets": [
        {
          "id": 1,
          "reps": 0,
          "weight": 0,
          "rest_time": 0,
          "order": 0
        }
      ]
    }
  ],
  "difficulty_level": "beginner|intermediate|advanced",
  "estimated_duration": 0,
  "equipment_required": [],
  "tags": [],
  "use_count": 0,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Programs

- `GET /workouts/programs/` - List programs
- `POST /workouts/programs/` - Create program
- `GET /workouts/programs/{id}/` - Get program details
- `PUT /workouts/programs/{id}/` - Update program
- `DELETE /workouts/programs/{id}/` - Delete program
- `POST /workouts/programs/{id}/add_workout/` - Add workout to program
- `POST /workouts/programs/{id}/toggle_active/` - Activate/deactivate program
- `POST /workouts/programs/{id}/fork/` - Fork a program
- `POST /workouts/programs/{id}/like/` - Like/unlike a program
- `POST /workouts/programs/{id}/share/` - Share program with user

### Program Model

```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "focus": "strength|hypertrophy|endurance|weight_loss|strength_hypertrophy|general_fitness",
  "sessions_per_week": 0,
  "workouts": [], 
  "creator_username": "string",
  "is_active": true,
  "is_public": false,
  "likes_count": 0,
  "difficulty_level": "string",
  "recommended_level": "string",
  "required_equipment": [],
  "estimated_completion_weeks": 0,
  "tags": [],
  "forks_count": 0,
  "is_liked": false,
  "forked_from": null,
  "created_at": "datetime",
  "updated_at": "datetime",
  "is_owner": true
}
```

### Workout Logs

- `GET /workouts/logs/` - List workout logs
- `POST /workouts/logs/` - Create workout log
- `GET /workouts/logs/{id}/` - Get log details
- `PUT /workouts/logs/{id}/` - Update log
- `DELETE /workouts/logs/{id}/` - Delete log
- `POST /workouts/logs/log_from_instance/` - Create log from workout instance
- `POST /workouts/logs/{id}/update_exercise/` - Update exercise in log
- `GET /workouts/logs/{id}/shared/` - Access shared workout log
- `GET /workouts/logs/stats/` - Get workout statistics

### Workout Log Model

```json
{
  "id": 1,
  "name": "string",
  "user": 1,
  "username": "string",
  "program": 1,
  "program_name": "string",
  "based_on_instance_id": 1,
  "date": "datetime",
  "gym": 1,
  "gym_name": "string",
  "notes": "string",
  "completed": true,
  "mood_rating": 0,
  "perceived_difficulty": 0,
  "performance_notes": "string",
  "media": [],
  "exercises": [
    {
      "id": 1,
      "name": "string",
      "equipment": "string",
      "notes": "string",
      "order": 0,
      "sets": [
        {
          "id": 1,
          "reps": 0,
          "weight": 0,
          "rest_time": 0,
          "order": 0
        }
      ],
      "based_on_instance_id": 1
    }
  ],
  "created_at": "datetime"
}
```

## Posts

### Endpoints

- `GET /posts/` - List posts
- `POST /posts/` - Create post
- `GET /posts/{id}/` - Get post details
- `PUT /posts/{id}/` - Update post
- `DELETE /posts/{id}/` - Delete post

### Post Model

```json
{
  "id": 1,
  "content": "string",
  "image": "string (URL)",
  "created_at": "datetime",
  "post_type": "regular|workout_log|program|workout_invite|shared",
  "workout_log": 1,
  "program": 1,
  "updated_at": "datetime",
  "user_username": "string",
  "user_profile_picture": "string (URL)",
  "comments": [
    {
      "id": 1,
      "content": "string",
      "created_at": "datetime",
      "user_username": "string",
      "user_profile_picture": "string (URL)"
    }
  ],
  "likes_count": 0,
  "is_liked": false,
  "workout_log_details": {}, 
  "program_details": {},
  "workout_invite_details": {},
  "invited_users_details": [],
  "is_share": false,
  "original_post": 1,
  "shares_count": 0,
  "original_post_details": {},
  "shared_by": {
    "username": "string",
    "id": 1
  }
}
```

### Post Features

- `POST /posts/{id}/comment/` - Add comment to post
- `POST /posts/{id}/share/` - Share a post
- `POST /posts/{id}/like/` - Like a post
- `DELETE /posts/{id}/like/` - Unlike a post
- `GET /posts/trending/` - Get trending posts
- `GET /posts/feed/` - Get user's personalized feed

## Models & Relationships

Key relations:
- Users have workout logs, posts, and can belong to gyms
- Programs contain workout instances
- Workout logs reference program and instances
- Posts can reference workout logs or programs
- Gyms track members and their activity

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 204: No Content
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

Error responses include descriptive messages:

```json
{
  "error": "Error type",
  "details": {"field": ["Error details"]}
}
```
