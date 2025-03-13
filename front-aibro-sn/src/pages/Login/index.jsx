import React, { useState, useContext } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { userService } from '../../api/services';
import { Dumbbell, User, Mail, Lock, ArrowRight } from 'lucide-react';

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
          // Use the service instead of direct API call
          await userService.registerUser({
            username: formData.username,
            password: formData.password,
            email: formData.email,
            training_level: 'beginner',
            personality_type: 'casual'
          });
          
          // If registration successful, try to login
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
    <div className="min-h-screen flex bg-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl"></div>
      {/* Left Column - Image/Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-gray-800 to-gray-900 p-12 items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <div className="p-4 bg-blue-500/20 rounded-full">
              <Dumbbell size={64} className="text-blue-400" />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
            GymBro
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Track your workouts, connect with fitness enthusiasts, and reach your goals faster.
          </p>
          <div className="space-y-6">
            <div className="flex items-center bg-gray-800/50 p-4 rounded-xl">
              <div className="mr-4 p-2 bg-blue-500/20 rounded-full">
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                    <path d="M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path>
                    <path d="M21 9V8a2 2 0 0 0-2-2h-2"></path>
                    <path d="M3 9V8a2 2 0 0 1 2-2h2"></path>
                    <path d="M12 16v-4"></path>
                    <path d="M8 12H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4"></path>
                    <path d="M20 12h-4"></path>
                    <path d="M15 16h5a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-5"></path>
                    <path d="M4 21v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </div>
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold">Personalized Workout Plans</h3>
                <p className="text-gray-400 text-sm">Create custom programs tailored to your goals</p>
              </div>
            </div>
            <div className="flex items-center bg-gray-800/50 p-4 rounded-xl">
              <div className="mr-4 p-2 bg-blue-500/20 rounded-full">
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                    <path d="M2 12h5"></path>
                    <path d="M17 12h5"></path>
                    <path d="M9 12h6"></path>
                    <path d="M3 9v6l3-3-3-3Z"></path>
                    <path d="M21 9v6l-3-3 3-3Z"></path>
                  </svg>
                </div>
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold">Progress Tracking</h3>
                <p className="text-gray-400 text-sm">Visualize gains and monitor your fitness journey</p>
              </div>
            </div>
            <div className="flex items-center bg-gray-800/50 p-4 rounded-xl">
              <div className="mr-4 p-2 bg-blue-500/20 rounded-full">
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                    <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-2"></path>
                    <path d="M9 14h9.8"></path>
                    <path d="M9 10h9.8"></path>
                    <path d="M18 13V7a2 2 0 0 1 2-2h2"></path>
                    <path d="M8 21v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <path d="M21 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
                  </svg>
                </div>
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold">Community Support</h3>
                <p className="text-gray-400 text-sm">Share achievements and motivate each other</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Login/Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex justify-center">
            <div className="p-4 bg-blue-500/20 rounded-full">
              <Dumbbell size={48} className="text-blue-400" />
            </div>
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-2 text-white">Welcome to GymBro</h2>
          <p className="text-gray-400 text-center mb-8">Your personal fitness companion</p>

          <div className="bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-700/50 relative overflow-hidden group">
            {/* Animated background elements */}
            <div className="absolute -top-24 -right-24 w-40 h-40 bg-blue-500/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-20 -left-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl"></div>
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent opacity-30"></div>
            <div className="bg-gray-700/30 p-1 rounded-lg mb-6">
              <div className="relative flex">
                {/* Background slider */}
                <div 
                  className={`absolute top-1 bottom-1 ${isLogin ? 'left-1' : 'left-1/2 -translate-x-1'} w-1/2 bg-gradient-to-r from-blue-600/80 to-indigo-600/80 rounded-md transition-all duration-300 ease-in-out shadow-md`}
                ></div>
                
                {/* Buttons */}
                <button
                  onClick={() => setIsLogin(true)}
                  className={`z-10 flex-1 py-3 px-2 text-center rounded-md transition-all duration-300 font-medium flex items-center justify-center space-x-2 ${
                    isLogin 
                      ? 'text-white' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <User size={isLogin ? 18 : 16} className={`transition-all duration-300 ${isLogin ? '' : 'opacity-70'}`} />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`z-10 flex-1 py-3 px-2 text-center rounded-md transition-all duration-300 font-medium flex items-center justify-center space-x-2 ${
                    !isLogin 
                      ? 'text-white' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${!isLogin ? 'w-[18px] h-[18px]' : 'w-4 h-4 opacity-70'}`}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <line x1="19" x2="19" y1="8" y2="14"></line>
                    <line x1="22" x2="16" y1="11" y2="11"></line>
                  </svg>
                  <span>Register</span>
                </button>
              </div>
            </div>

                          {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6 whitespace-pre-line animate-fadeIn relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-900/0 via-red-900/30 to-red-900/0 animate-shimmer"></div>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full pl-10 px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 hover:border-gray-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Password
                  </label>
                  {isLogin && (
                    <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 hover:border-gray-500"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium text-lg flex items-center justify-center space-x-2
                  ${loading 
                    ? 'bg-blue-500/50 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/20 transform hover:-translate-y-1'} 
                  transition-all duration-300 shadow-md overflow-hidden relative z-10`}
              >
                {/* Background shine effect */}
                <span className={`absolute top-0 -inset-full h-full w-1/2 z-5 block transform ${loading ? '' : 'group-hover:animate-shine'} bg-gradient-to-r from-transparent via-white/10 to-transparent`}></span>
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{isLogin ? 'Logging in...' : 'Registering...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isLogin ? 'Log in' : 'Register'}</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
              {isLogin ? (
                <p>Don't have an account? <button 
                  onClick={() => setIsLogin(false)} 
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors relative group"
                >
                  Register now
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
                </button></p>
              ) : (
                <p>Already have an account? <button 
                  onClick={() => setIsLogin(true)} 
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors relative group"
                >
                  Log in
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
                </button></p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;