// context/HeaderContext.tsx
import React, { createContext, useState, ReactNode } from 'react';

interface HeaderContextType {
  isHeaderVisible: boolean;
  setHeaderVisible: (visible: boolean) => void;
}

export const HeaderContext = createContext<HeaderContextType>({
  isHeaderVisible: true,
  setHeaderVisible: () => {},
});

interface HeaderProviderProps {
  children: ReactNode;
}

export const HeaderProvider: React.FC<HeaderProviderProps> = ({ children }) => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const setHeaderVisible = (visible: boolean) => {
    setIsHeaderVisible(visible);
  };

  return (
    <HeaderContext.Provider value={{ isHeaderVisible, setHeaderVisible }}>
      {children}
    </HeaderContext.Provider>
  );
};