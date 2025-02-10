import React from 'react';

const WelcomeHeader = ({ username }) => (
  <div className="mb-8">
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
      Welcome back, <span className="bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
    {username}
  </span>
    </h1>
    <p className="text-gray-400">Share your progress and connect with fellow gym enthusiasts</p>
  </div>
);

export default WelcomeHeader;