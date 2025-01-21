# Gym Social Network Backend

A Django REST API for a gym-focused social network application.

## Setup Instructions

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory with the following content:
```
SECRET_KEY=your-secret-key
DEBUG=True
```

4. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Create a superuser:
```bash
python manage.py createsuperuser
```

6. Run the development server:
```bash
python manage.py runserver
```

## API Endpoints

### Authentication
- POST `/api/auth/login/` - Obtain JWT token
- POST `/api/auth/refresh/` - Refresh JWT token

### Users
- GET `/api/auth/users/` - List users
- POST `/api/auth/users/` - Register new user
- GET `/api/auth/users/me/` - Get current user profile
- PUT `/api/auth/users/{id}/` - Update user profile
- POST `/api/auth/users/{id}/add_friend/` - Add friend

### Posts
- GET `/api/posts/` - List posts
- POST `/api/posts/` - Create post
- PUT `/api/posts/{id}/` - Update post
- DELETE `/api/posts/{id}/` - Delete post

### Workouts
- GET `/api/workouts/` - List workout sessions
- POST `/api/workouts/` - Create workout session
- GET `/api/workouts/{id}/` - Get workout details
- PUT `/api/workouts/{id}/` - Update workout
- DELETE `/api/workouts/{id}/` - Delete workout

## API Documentation
API documentation is available at `/swagger/` when the server is running.

