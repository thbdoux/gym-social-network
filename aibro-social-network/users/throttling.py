# users/throttling.py
from rest_framework.throttling import AnonRateThrottle

class RegistrationRateThrottle(AnonRateThrottle):
    scope = 'registration'
    rate = '5/day'