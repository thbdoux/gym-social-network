# curl -X POST http://localhost:8000/api/gyms/ \
#   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM4MTU3OTYzLCJpYXQiOjE3MzgxNTQzNjMsImp0aSI6IjVkYzNmNWQ2OWVmZDRhYmI4ZmI2N2M5NWEyNzVkYmYyIiwidXNlcl9pZCI6Mn0.mWZB1gT4-BzOGjJdrtODn07A96pedocb8U0w3ixHRpY" \
#   -H "Content-Type: application/json" \
#   -d '{"name": "Fitness Park", "location": "Downtown"}'

# TOKEN = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM4MTU3OTYzLCJpYXQiOjE3MzgxNTQzNjMsImp0aSI6IjVkYzNmNWQ2OWVmZDRhYmI4ZmI2N2M5NWEyNzVkYmYyIiwidXNlcl9pZCI6Mn0.mWZB1gT4-BzOGjJdrtODn07A96pedocb8U0w3ixHRpY

# create a workout

# curl -X POST http://localhost:8000/api/workouts/workouts/ \
#   -H "Authorization: Bearer $TOKEN" \
#   -H "Content-Type: application/json" \
#   -d '{"name": "Push Day", "split_method": "push_pull_legs", "frequency": "2 times per week"}'

# adds an exercice to the workout 

# curl -X POST http://localhost:8000/api/workouts/workouts/1/add_exercise/ \
#   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM4MTU3OTYzLCJpYXQiOjE3MzgxNTQzNjMsImp0aSI6IjVkYzNmNWQ2OWVmZDRhYmI4ZmI2N2M5NWEyNzVkYmYyIiwidXNlcl9pZCI6Mn0.mWZB1gT4-BzOGjJdrtODn07A96pedocb8U0w3ixHRpY" \
#   -H "Content-Type: application/json" \
#   -d '{"name": "Tractions", "equipment": "bodyweight", "order": 1}'

# # make a post 
# curl -X POST http://localhost:8000/api/posts/ \
#   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM4MTU3OTYzLCJpYXQiOjE3MzgxNTQzNjMsImp0aSI6IjVkYzNmNWQ2OWVmZDRhYmI4ZmI2N2M5NWEyNzVkYmYyIiwidXNlcl9pZCI6Mn0.mWZB1gT4-BzOGjJdrtODn07A96pedocb8U0w3ixHRpY" \
#   -H "Content-Type: application/json" \
#   -d '{"content": "Just crushed my back day bro 💪"}'

# curl -X POST http://localhost:8000/api/users/token/ \
#   -H "Content-Type: application/json" \
#   -d '{"username": "brofitness", "password": "strongpassword123"}'

# get posts
curl http://localhost:8000/api/posts/feed/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM4MTY3OTQ4LCJpYXQiOjE3MzgxNjQzNDgsImp0aSI6IjA1OThlY2JlNDg2MDQ0NTNhNzZkMmE0ODBlMTk2MGE3IiwidXNlcl9pZCI6Mn0.wmFOxn2G4M8LHLX-T5d6xlY6i0AL4Zgi5NqTjI6jhZM" 