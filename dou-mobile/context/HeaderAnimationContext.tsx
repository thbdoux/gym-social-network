// context/HeaderAnimationContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { Animated } from 'react-native';

interface HeaderAnimationContextType {
  scrollY: Animated.Value;
  setScrollY: (scrollY: Animated.Value) => void;
}

const HeaderAnimationContext = createContext<HeaderAnimationContextType>({
  scrollY: new Animated.Value(0),
  setScrollY: () => {},
});

export const HeaderAnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scrollY] = useState(new Animated.Value(0));

  const setScrollY = (newScrollY: Animated.Value) => {
    // This function is a placeholder since we're using a single scrollY value
    // In a more complex app, you might need to update the scrollY value
  };

  return (
    <HeaderAnimationContext.Provider value={{ scrollY, setScrollY }}>
      {children}
    </HeaderAnimationContext.Provider>
  );
};

export const useHeaderAnimation = () => useContext(HeaderAnimationContext);