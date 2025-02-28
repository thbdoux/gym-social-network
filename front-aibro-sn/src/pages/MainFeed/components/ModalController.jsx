import React, { createContext, useState, useContext } from 'react';

// Create a context for our modal controller
const ModalContext = createContext();

// Modal types
export const MODAL_TYPES = {
  PROGRAM: 'program',
  WORKOUT_LOG: 'workout_log',
};

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    props: {},
  });

  // Function to open a modal
  const openModal = (type, props = {}) => {
    setModalState({
      isOpen: true,
      type,
      props,
    });
  };

  // Function to close the current modal
  const closeModal = () => {
    setModalState({
      ...modalState,
      isOpen: false,
    });
  };

  return (
    <ModalContext.Provider
      value={{
        modalState,
        openModal,
        closeModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

// Hook to use the modal context
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export default ModalContext;