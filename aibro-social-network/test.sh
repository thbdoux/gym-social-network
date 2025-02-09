# curl -X POST http://localhost:8000/api/gyms/ \
#   -H "Authorization: Bearer $TOKEN" \
#   -H "Content-Type: application/json" \
#   -d '{"name": "Fitness Park", "location": "Downtown"}'

# TOKEN = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM4MTU3OTYzLCJpYXQiOjE3MzgxNTQzNjMsImp0aSI6IjVkYzNmNWQ2OWVmZDRhYmI4ZmI2N2M5NWEyNzVkYmYyIiwidXNlcl9pZCI6Mn0.mWZB1gT4-BzOGjJdrtODn07A96pedocb8U0w3ixHRpY


# # make a post 
# curl -X POST http://localhost:8000/api/posts/ \
#   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM4MTU3OTYzLCJpYXQiOjE3MzgxNTQzNjMsImp0aSI6IjVkYzNmNWQ2OWVmZDRhYmI4ZmI2N2M5NWEyNzVkYmYyIiwidXNlcl9pZCI6Mn0.mWZB1gT4-BzOGjJdrtODn07A96pedocb8U0w3ixHRpY" \
#   -H "Content-Type: application/json" \
#   -d '{"content": "Just crushed my back day bro 💪"}'

# curl -X POST http://localhost:8000/api/users/token/ \
#   -H "Content-Type: application/json" \
#   -d '{"username": "brofitness", "password": "strongpassword123"}'


# curl -X POST http://localhost:8000/api/users/token/ \
#   -H "Content-Type: application/json" \
#   -d '{
#     "username": "thbdoux",
#     "password": "T0k2j7m3toubounou*"
#   }'

# TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM4MjQ3MTkwLCJpYXQiOjE3MzgyNDM1OTAsImp0aSI6ImY1MzZjZWYyMDNiMDQ2ODU4NmY3YTVlZGI3YjI5Y2NiIiwidXNlcl9pZCI6MX0.m5R2iqNNbPDuKuLnLood2YSihz2ZtG_xb-gGbJ3EYNU"
# # create a workout

# curl -X POST http://localhost:8000/api/workouts/workouts/ \
#   -H "Authorization: Bearer $TOKEN" \
#   -H "Content-Type: application/json" \
#   -d '{"name": "Upper 1", "split_method": "upper_lower", "frequency": "1/week"}'

# # # # adds an exercice to the workout 

# curl -X POST http://localhost:8000/api/workouts/workouts/1/add_exercise/ \
#   -H "Authorization: Bearer $TOKEN" \
#   -H "Content-Type: application/json" \
#   -d '{"name": "Tractions", "equipment": "bodyweight", "order": 1}'

# # # creates plan

# curl -X POST http://localhost:8000/api/workouts/plans/ \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer $TOKEN" \
#   -d '{
#     "name": "Zero to Hero",
#     "description": "3-day split focusing on strength and hypertrophy",
#     "focus": "strength_hypertrophy",
#     "sessions_per_week": 3
#   }'

# # adds workout to plan 

# curl -X POST http://localhost:8000/api/workouts/plans/1/add_workout/ \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer $TOKEN" \
#   -d '{
#     "workout": 6,
#     "preferred_weekday": 0,
#     "order": 2,
#     "notes": "Upper body focus - Start with bench press"
#   }'

curl -X POST http://localhost:8000/api/users/ \
-H "Content-Type: application/json" \
-d '{
    "username": "testuser",
    "password": "testpassword123",
    "email": "test@example.com",
    "training_level": "beginner",
    "personality_type": "casual"
}' 