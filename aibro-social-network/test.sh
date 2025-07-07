# curl -X DELETE http://localhost:8000/api/workouts/logs/79/ \
#      -H "Content-Type: application/json" \
#      -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQ1MzI0MTI3LCJpYXQiOjE3NDUzMjA1MjcsImp0aSI6IjQyYzk1MWIwNDE3MDQyMDY5OTI2MTNiMTg1YmUzNjBjIiwidXNlcl9pZCI6MX0.gkUT5HKQ0ZRqp1V1CJBStlzODqzGGo4yw6zxC7gaWhE" \



curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"thbdoux","password":"thbdoux"}' \
  "https://dou-mobile/api/users/token/"


# curl -X POST http://localhost:8000/api/users/register/ \
#   -H "Content-Type: application/json" \
#   -d '{
#     "username": "testuser123",
#     "password": "SecurePassword123!",
#     "email": "testuser@example.com",
#     "training_level": "beginner",
#     "personality_type": "versatile",
#     "language_preference": "en",
#     "fitness_goals": "Get stronger and improve endurance",
#     "bio": "Fitness enthusiast looking to connect with like-minded people"
#   }'

