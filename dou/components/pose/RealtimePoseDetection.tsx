import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  AppState,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useFocusEffect } from '@react-navigation/native';
import { usePoseDetection } from '../context/PoseDetectionContext';

interface Keypoint {
  x: number;
  y: number;
  confidence: number;
}

interface Pose {
  keypoints: Keypoint[];
  confidence: number;
}

// MoveNet keypoint indices and connections
const KEYPOINT_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
];

const SKELETON_CONNECTIONS = [
  [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [5, 11], [6, 12], 
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [1, 3], 
  [2, 4], [0, 1], [0, 2]
];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function RealtimePoseDetection() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const { resize } = useResizePlugin();
  
  const {
    isModelLoaded,
    isModelLoading,
    modelError,
    detectedPoses,
    startDetection,
    stopDetection,
    isDetectionActive,
    getModelForProcessing,
    updateSharedPoses,
  } = usePoseDetection();
  
  const [frameSize, setFrameSize] = useState({ width: screenWidth, height: screenHeight });
  const [isScreenActive, setIsScreenActive] = useState(true);
  const lastProcessTime = useRef(0);
  const processingRef = useRef(false);

  // Handle screen focus/unfocus
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Pose detection screen focused');
      setIsScreenActive(true);
      
      return () => {
        console.log('📱 Pose detection screen unfocused');
        setIsScreenActive(false);
        stopDetection();
      };
    }, [stopDetection])
  );

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        stopDetection();
      }
    });

    return () => subscription?.remove();
  }, [stopDetection]);

  // Auto-start detection when model is ready and screen is active
  useEffect(() => {
    if (isModelLoaded && isScreenActive && hasPermission && !isDetectionActive) {
      setTimeout(() => {
        startDetection();
      }, 500); // Small delay to ensure everything is ready
    }
  }, [isModelLoaded, isScreenActive, hasPermission, isDetectionActive, startDetection]);

  // Optimized frame processor with throttling
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    if (!isDetectionActive || processingRef.current) return;
    
    const now = Date.now();
    if (now - lastProcessTime.current < 125) return; // Max 8 FPS
    
    lastProcessTime.current = now;
    processingRef.current = true;
    
    try {
      const modelData = getModelForProcessing();
      if (!modelData.isLoaded || !modelData.model) return;
      
      // Resize frame to 192x192 for MoveNet Lightning
      const resized = resize(frame, {
        scale: {
          width: 192,
          height: 192,
        },
        pixelFormat: 'rgb',
        dataType: 'uint8',
      });

      // Run pose detection
      const outputs = modelData.model.runSync([resized]);
      
      // MoveNet output format: [1, 1, 17, 3] where last dimension is [y, x, confidence]
      const predictions = outputs[0] as Float32Array;
      
      // Extract keypoints and scale to frame size
      const keypoints: Keypoint[] = [];
      for (let i = 0; i < 17; i++) {
        const y = predictions[i * 3] * frameSize.height;     // Scale to frame height
        const x = predictions[i * 3 + 1] * frameSize.width;  // Scale to frame width
        const confidence = predictions[i * 3 + 2];
        
        keypoints.push({ x, y, confidence });
      }
      
      // Calculate overall pose confidence
      const poseConfidence = keypoints.reduce((sum, kp) => sum + kp.confidence, 0) / 17;
      
      const pose: Pose = {
        keypoints,
        confidence: poseConfidence,
      };
      
      // Update shared value - only include poses with reasonable confidence
      const poses = poseConfidence > 0.3 ? [pose] : [];
      updateSharedPoses(poses);
      
    } catch (error) {
      console.error('Frame processing error:', error);
    } finally {
      processingRef.current = false;
    }
  }, [isDetectionActive, frameSize, getModelForProcessing, updateSharedPoses]);

  // Helper function to calculate line properties
  const calculateLineProps = (startPoint: Keypoint, endPoint: Keypoint) => {
    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    const centerX = (startPoint.x + endPoint.x) / 2;
    const centerY = (startPoint.y + endPoint.y) / 2;
    
    return {
      width: distance,
      left: centerX - distance / 2,
      top: centerY - 1.5,
      transform: [{ rotate: `${angle}deg` }],
    };
  };

  const renderPoseOverlay = () => {
    if (detectedPoses.length === 0) return null;

    const pose = detectedPoses[0];
    const confidenceThreshold = 0.5;

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Draw skeleton lines */}
        {SKELETON_CONNECTIONS.map(([startIdx, endIdx], index) => {
          const startPoint = pose.keypoints[startIdx];
          const endPoint = pose.keypoints[endIdx];
          
          if (startPoint.confidence > confidenceThreshold && endPoint.confidence > confidenceThreshold) {
            const lineProps = calculateLineProps(startPoint, endPoint);
            
            return (
              <View
                key={`line-${index}`}
                style={[
                  styles.skeletonLine,
                  {
                    position: 'absolute',
                    width: lineProps.width,
                    left: lineProps.left,
                    top: lineProps.top,
                    transform: lineProps.transform,
                  }
                ]}
              />
            );
          }
          return null;
        })}

        {/* Draw keypoints */}
        {pose.keypoints.map((keypoint, index) => {
          if (keypoint.confidence > confidenceThreshold) {
            return (
              <View
                key={`point-${index}`}
                style={[
                  styles.keypoint,
                  {
                    position: 'absolute',
                    left: keypoint.x - 6,
                    top: keypoint.y - 6,
                  }
                ]}
              />
            );
          }
          return null;
        })}
      </View>
    );
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission is required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          device={device}
          isActive={isScreenActive && hasPermission}
          frameProcessor={isDetectionActive ? frameProcessor : undefined}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setFrameSize({ width, height });
          }}
        />
        
        {renderPoseOverlay()}
      </View>

      {/* Status overlay */}
      <View style={styles.statusOverlay}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>🤖 AI Pose Detection</Text>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Model:</Text>
            <Text style={[
              styles.statusValue,
              { color: isModelLoaded ? '#00FF00' : isModelLoading ? '#FFA500' : '#FF0000' }
            ]}>
              {isModelLoaded ? '✅ Ready' : isModelLoading ? '⏳ Loading...' : '❌ Error'}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Detection:</Text>
            <Text style={[
              styles.statusValue,
              { color: isDetectionActive ? '#00FF00' : '#CCCCCC' }
            ]}>
              {isDetectionActive ? '🟢 Active' : '⭕ Inactive'}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Poses:</Text>
            <Text style={styles.statusValue}>{detectedPoses.length}</Text>
          </View>
          
          {detectedPoses.length > 0 && (
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Confidence:</Text>
              <Text style={styles.statusValue}>
                {(detectedPoses[0].confidence * 100).toFixed(1)}%
              </Text>
            </View>
          )}

          {/* Control buttons */}
          <View style={styles.controlButtons}>
            <TouchableOpacity 
              style={[styles.controlButton, { backgroundColor: isDetectionActive ? '#FF4444' : '#00AA00' }]}
              onPress={isDetectionActive ? stopDetection : startDetection}
              disabled={!isModelLoaded}
            >
              <Text style={styles.controlButtonText}>
                {isDetectionActive ? '⏹️ Stop' : '▶️ Start'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Loading indicator */}
      {isModelLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>🚀 Loading AI Model...</Text>
          <Text style={styles.subloadingText}>This may take a moment</Text>
        </View>
      )}

      {/* Error state */}
      {modelError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>❌ {modelError}</Text>
          <Text style={styles.errorSubtext}>Check your internet connection</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skeletonLine: {
    height: 3,
    backgroundColor: '#FF0000',
    opacity: 0.8,
    borderRadius: 1.5,
  },
  keypoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00FF00',
    opacity: 0.9,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  statusOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  statusCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    color: '#CCCCCC',
    fontSize: 15,
    fontWeight: '500',
  },
  statusValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  controlButtons: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  subloadingText: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#FFCCCC',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});