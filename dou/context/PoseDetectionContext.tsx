// context/PoseDetectionContext.tsx
import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { Worklets } from 'react-native-worklets-core';

interface Keypoint {
  x: number;
  y: number;
  confidence: number;
}

interface Pose {
  keypoints: Keypoint[];
  confidence: number;
}

interface PoseDetectionContextType {
  isModelLoaded: boolean;
  isModelLoading: boolean;
  modelError: string | null;
  detectedPoses: Pose[];
  startDetection: () => void;
  stopDetection: () => void;
  isDetectionActive: boolean;
  getModelForProcessing: () => {
    model: any;
    isLoaded: boolean;
    sharedData: any;
  };
  updateSharedPoses: (poses: Pose[]) => void;
}

const PoseDetectionContext = createContext<PoseDetectionContextType | null>(null);

export const usePoseDetection = () => {
  const context = useContext(PoseDetectionContext);
  if (!context) {
    throw new Error('usePoseDetection must be used within PoseDetectionProvider');
  }
  return context;
};

export const PoseDetectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDetectionActive, setIsDetectionActive] = useState(false);
  const [detectedPoses, setDetectedPoses] = useState<Pose[]>([]);
  const [modelError, setModelError] = useState<string | null>(null);
  
  // Load model only when needed
  const poseModel = useTensorflowModel({
    url: 'https://tfhub.dev/google/lite-model/movenet/singlepose/lightning/tflite/float16/4?lite-format=tflite'
  });

  // Shared values for pose data
  const sharedPoseData = useRef(Worklets.createSharedValue<Pose[]>([]));
  const lastProcessTime = useRef(0);
  const processingInProgress = useRef(false);

  // Throttle processing to max 8 FPS for better performance
  const PROCESSING_INTERVAL = 125; // 125ms = 8 FPS

  // Expose model and shared data for frame processing
  const getModelForProcessing = useCallback(() => {
    return {
      model: poseModel.model,
      isLoaded: poseModel.state === 'loaded',
      sharedData: sharedPoseData.current,
    };
  }, [poseModel.model, poseModel.state]);

  const updateSharedPoses = useCallback((poses: Pose[]) => {
    'worklet';
    sharedPoseData.current.value = poses;
  }, []);

  const startDetection = useCallback(() => {
    console.log('🤖 Starting pose detection...');
    setIsDetectionActive(true);
    setModelError(null);
  }, []);

  const stopDetection = useCallback(() => {
    console.log('⏹️ Stopping pose detection...');
    setIsDetectionActive(false);
    setDetectedPoses([]);
    sharedPoseData.current.value = [];
  }, []);

  // Update poses from shared values
  useEffect(() => {
    if (!isDetectionActive) return;

    const updatePoses = () => {
      try {
        setDetectedPoses(sharedPoseData.current.value);
      } catch (error) {
        console.error('Error updating poses:', error);
      }
    };
    
    const interval = setInterval(updatePoses, 125); // Update UI at 8 FPS to match processing
    return () => clearInterval(interval);
  }, [isDetectionActive]);

  // Handle model state changes
  useEffect(() => {
    if (poseModel.state === 'error') {
      setModelError('Failed to load pose detection model');
      console.error('❌ Model loading failed');
    } else if (poseModel.state === 'loaded') {
      console.log('✅ Pose detection model loaded successfully');
    }
  }, [poseModel.state]);

  const contextValue: PoseDetectionContextType = {
    isModelLoaded: poseModel.state === 'loaded',
    isModelLoading: poseModel.state === 'loading',
    modelError,
    detectedPoses,
    startDetection,
    stopDetection,
    isDetectionActive,
    getModelForProcessing,
    updateSharedPoses,
  };

  return (
    <PoseDetectionContext.Provider value={contextValue}>
      {children}
    </PoseDetectionContext.Provider>
  );
};
