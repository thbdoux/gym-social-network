import React from 'react';

const WelcomeHeader = ({ username }) => (
  <div className="mb-8">
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
      What's up, <span className="bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
    {username}
  </span> ?
    </h1>
  </div>
);

export default WelcomeHeader;