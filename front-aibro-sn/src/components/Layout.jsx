import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900 ml-72 w-full text-gray-100">
      <div className="container mx-auto p-8">
        {children}
      </div>
    </div>
  );
};

export default Layout;