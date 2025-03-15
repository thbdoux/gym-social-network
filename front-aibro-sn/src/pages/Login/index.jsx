import React, { useState, useContext } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { userService } from '../../api/services';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import douLogo from '../../assets/dou.svg';
import douPlusLogo from '../../assets/dou-plus.svg';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      if (!formData.email) {
        setError('Email is required');
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        const success = await login(formData.username, formData.password);
        if (success) {
          navigate('/feed');
        } else {
          setError('Invalid username or password');
        }
      } else {
        try {
          await userService.registerUser({
            username: formData.username,
            password: formData.password,
            email: formData.email,
            training_level: 'beginner',
            personality_type: 'casual'
          });
          
          const success = await login(formData.username, formData.password);
          if (success) {
            navigate('/feed');
          }
        } catch (err) {
          if (err.response?.data?.username) {
            setError('This username is already taken. Please choose another one.');
          } else if (err.response?.data?.email) {
            setError('This email is already registered.');
          } else {
            setError(Object.values(err.response?.data || {}).flat().join('\n') || 'Registration failed');
          }
        }
      }
    } catch (err) {
      setError(`An error occurred during ${isLogin ? 'login' : 'registration'}`);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/feed" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/3 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/3 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-600/2 rounded-full blur-3xl"></div>
      
      {/* Main content */}
      <div className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-2 flex justify-center">
            <img src={douLogo} alt="dou logo" className="h-32" />
          </div>
          
          {/* Form container */}
          <div className="backdrop-blur-sm p-6 rounded-2xl border border-gray-800/30 relative overflow-hidden">
            {/* Mode title - simple text instead of tabs */}
            <h2 className="text-xl font-bold text-center text-white mb-6">
              {isLogin ? 'Welcome back!' : 'Create an account'}
            </h2>

            {/* Error display */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full pl-10 px-4 py-3 rounded-lg bg-gray-800/40 text-white border border-gray-700/30 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors placeholder-gray-500"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="text-gray-500" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 px-4 py-3 rounded-lg bg-gray-800/40 text-white border border-gray-700/30 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all duration-300 placeholder-gray-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-500" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 px-4 py-3 rounded-lg bg-gray-800/40 text-white border border-gray-700/30 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors placeholder-gray-500"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={16} className="text-gray-500" />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 px-4 py-3 rounded-lg bg-gray-800/40 text-white border border-gray-700/30 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all duration-300 placeholder-gray-500"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Forgot password link */}
              {isLogin && (
                <div className="flex justify-end">
                  <a href="#" className="text-xs text-gray-400 hover:text-blue-400 transition-colors">
                    Forgot password?
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-2 py-3 px-4 rounded-lg text-white font-medium text-md flex items-center justify-center space-x-2
                  ${loading 
                    ? 'bg-blue-500/30 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-700/90 hover:to-indigo-700/90 hover:shadow-lg hover:shadow-blue-500/10'} 
                  transition-all duration-300 shadow-sm`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-2">{isLogin ? 'Logging in...' : 'Registering...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isLogin ? 'Continue' : 'Create account'}</span>
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </button>
            </form>

            {/* Account toggle text */}
            <div className="mt-6 text-center text-gray-500 text-sm">
              {isLogin ? (
                <p>Don't have an account? <button 
                  onClick={() => setIsLogin(false)} 
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Register
                </button></p>
              ) : (
                <p>Already have an account? <button 
                  onClick={() => setIsLogin(true)} 
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Log in
                </button></p>
              )}
            </div>
          </div>
          
          {/* dou+ Upgrade CTA */}
          <div className="mt-6 flex justify-center">
            <div className="backdrop-blur-sm rounded-xl p-3 border border-gray-800/30 max-w-sm">
              <div className="flex items-center space-x-3">
                <img src={douPlusLogo} alt="dou+ logo" className="h-8" />
                <button className="text-xs text-gray-300 hover:text-white transition-colors flex items-center">
                  <span>Upgrade to premium</span>
                  <span className="ml-2 text-xs">✨</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-6 text-center text-gray-600 text-xs">
            <p>© 2025 dou</p>
            <div className="mt-1 flex justify-center space-x-4">
              <a href="#" className="text-gray-600 hover:text-blue-400 transition-colors">Terms</a>
              <a href="#" className="text-gray-600 hover:text-blue-400 transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;