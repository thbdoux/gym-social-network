import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../api/api';

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { access } = await api.login(credentials);
      login(access);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-center text-3xl font-bold">Sign in</h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            className="w-full px-3 py-2 border rounded"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-3 py-2 border rounded"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}