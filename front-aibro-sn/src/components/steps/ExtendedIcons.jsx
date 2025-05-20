import React from 'react';

// Export icons from CustomIcons
export { ArrowRight, Trophy, Mountain, Sofa, Dumbbell, Football, Bike, Swimming } from './CustomIcons';

// Add new sports icons
export const Yoga = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 2a3 3 0 0 0-3 3c0 1.6 1.3 2.9 3 2.9s3-1.3 3-2.9a3 3 0 0 0-3-3z"></path>
    <path d="M12 2a3 3 0 0 0-3 3c0 1.6 1.3 2.9 3 2.9s3-1.3 3-2.9a3 3 0 0 0-3-3z"></path>
    <path d="M14 13.1 9 15.2"></path>
    <path d="M6 9.8v13.4"></path>
    <path d="M18 9.8v13.4"></path>
    <path d="M12 6.2v13.1"></path>
    <path d="M12 16.8H6.5a2 2 0 0 1-1.9-1.4 2 2 0 0 1 .5-2.2L9 10"></path>
    <path d="M15 10.1v.1"></path>
    <path d="m12 16.8 3.1-1.2A2 2 0 0 0 16 14a2 2 0 0 0-.5-2l-1.5-1.8"></path>
  </svg>
);

export const Running = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M13 4v6.5a2 2 0 0 1-2 2H6.5"></path>
    <path d="M9.7 15.4c-.9 1.6-1.7 3.1-1.7 5.1 0 2 .8 3.5 2 3.5s2-1.5 2-3.5c0-1.5-.5-2.5-1.2-4.2"></path>
    <path d="m13 4 3 2.5"></path>
    <path d="M9.7 15.4 6 12"></path>
    <circle cx="17.5" cy="5.5" r="3.5"></circle>
    <path d="M17.5 9a4.5 4.5 0 0 0-4.5 4.5v6"></path>
    <path d="M19.7 16a3 3 0 0 0-2.1 5.1l.1-.9.8-1.7a3 3 0 0 0 2.2-5L19 15"></path>
  </svg>
);

export const Boxing = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M8 8a4 4 0 0 0 4 4h8v1a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a2 2 0 0 1 2-2h4Zm7-6a2 2 0 0 1 2 2v10"></path>
    <circle cx="18" cy="6" r="3"></circle>
  </svg>
);

export const Basketball = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M4.9 4.9C8.2 8.2 8 15 4.7 19"></path>
    <path d="M19.1 19.1C15.8 15.8 16 9 19.3 5"></path>
    <path d="M12 4c3.8 3.8 4 12 0 16"></path>
    <path d="M12 4c-3.8 3.8-4 12 0 16"></path>
  </svg>
);

export const Dance = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m8 16 2-9 2 3h2.5"></path>
    <path d="M18 12h-5l1 3h4.5"></path>
    <circle cx="12" cy="4" r="2"></circle>
    <path d="m16.31 12.72 1.66 1.11a2 2 0 0 1 .45 2.65 2 2 0 0 1-2.91.55L12.5 15"></path>
    <path d="m8 8 1.5 4.5L5 16"></path>
    <path d="M4.5 19.5 8 22"></path>
  </svg>
);

export const Hiking = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m14 22-2-8-2 1v7"></path>
    <path d="M7 10v11"></path>
    <path d="m8 10 7-3"></path>
    <path d="M8 17.5a4 4 0 0 0 4 0"></path>
    <circle cx="12" cy="4" r="2"></circle>
    <path d="m13 10 5 1 1 3"></path>
  </svg>
);

// Add lifestyle icons
export const Gaming = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="6" y1="11" x2="10" y2="11"></line>
    <line x1="8" y1="9" x2="8" y2="13"></line>
    <line x1="15" y1="12" x2="15.01" y2="12"></line>
    <line x1="18" y1="10" x2="18.01" y2="10"></line>
    <path d="M17.32 5H6.68a4 4 0 0 0-3.978 4.5l1.323 8a3 3 0 0 0 2.91 2.5h9.495a3 3 0 0 0 2.91-2.5l1.323-8A4 4 0 0 0 17.32 5z"></path>
  </svg>
);

export const Chess = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 6h6v3H9z"></path>
    <path d="M7 9h10v3H7z"></path>
    <path d="m8 21 4-8 4 8"></path>
    <path d="M14 18h-4v3h4z"></path>
    <path d="M3 21h18"></path>
    <path d="M12 6V3"></path>
  </svg>
);

export const Cooking = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87"></path>
    <line x1="6" y1="17" x2="18" y2="17"></line>
    <path d="M6 20h12"></path>
  </svg>
);

export const Reading = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3z"></path>
  </svg>
);

export const Meditation = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 3a3 3 0 0 0-3 3"></path>
    <path d="M12 3a3 3 0 0 1 3 3"></path>
    <path d="M12 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4"></path>
    <path d="M12 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8"></path>
    <path d="M12 10V8"></path>
    <path d="M7.5 8a4.5 4.5 0 1 0-1.8 8.4"></path>
    <path d="M16.5 8a4.5 4.5 0 1 1 1.8 8.4"></path>
  </svg>
);

export const Music = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 18V5l12-2v13"></path>
    <circle cx="6" cy="18" r="3"></circle>
    <circle cx="18" cy="16" r="3"></circle>
  </svg>
);

export const Art = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="13.5" cy="6.5" r=".5"></circle>
    <circle cx="17.5" cy="10.5" r=".5"></circle>
    <circle cx="8.5" cy="7.5" r=".5"></circle>
    <circle cx="6.5" cy="12.5" r=".5"></circle>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
  </svg>
);

export const Photography = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
    <circle cx="12" cy="13" r="3"></circle>
  </svg>
);