import { useState, useEffect } from 'react';
import * as api from '../../api/api';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    loadProfile();
    loadWorkouts();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/auth/users/me/');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadWorkouts = async () => {
    try {
      const response = await api.getWorkouts();
      setWorkouts(response.data.results);
    } catch (error) {
      console.error('Failed to load workouts:', error);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <p className="mt-1">{profile.username}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1">{profile.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <p className="mt-1">{profile.bio || 'No bio added yet'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Recent Workouts</h3>
        <div className="space-y-4">
          {workouts.map((workout) => (
            <div key={workout.id} className="border-b pb-4">
              <p className="font-medium">{new Date(workout.date).toLocaleDateString()}</p>
              <p className="text-gray-600">{workout.notes}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
