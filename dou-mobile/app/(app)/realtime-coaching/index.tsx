import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { Worklets } from 'react-native-worklets-core';
import Svg, { Circle, Line } from 'react-native-svg';

// MoveNet keypoint indices and connections
const KEYPOINT_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
];

// Skeleton connections for drawing pose lines
const SKELETON_CONNECTIONS = [
  [5, 7], [7, 9], [6, 8], [8, 10], [5, 6], [5, 11], [6, 12], 
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [1, 3], 
  [2, 4], [0, 1], [0, 2]
];

interface Keypoint {
  x: number;
  y: number;
  confidence: number;
}

interface Pose {
  keypoints: Keypoint[];
  confidence: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function RealtimePoseDetection() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const { resize } = useResizePlugin();
  
  // Load MoveNet Lightning model directly from TensorFlow Hub (no metro config needed!)
  const poseModel = useTensorflowModel({
    url: 'https://tfhub.dev/google/lite-model/movenet/singlepose/lightning/tflite/float16/4?lite-format=tflite'
  });
  
  const [detectedPoses, setDetectedPoses] = useState<Pose[]>([]);
  const [frameSize, setFrameSize] = useState({ width: screenWidth, height: screenHeight });

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Create shared values for pose data using Worklets
  const sharedPoseData = Worklets.createSharedValue<Pose[]>([]);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    if (poseModel.state !== 'loaded') return;
    
    try {
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
      const outputs = poseModel.model!.runSync([resized]);
      
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
      
      // Calculate overall pose confidence (average of keypoint confidences)
      const poseConfidence = keypoints.reduce((sum, kp) => sum + kp.confidence, 0) / 17;
      
      const pose: Pose = {
        keypoints,
        confidence: poseConfidence,
      };
      
      // Update shared value - only include poses with reasonable confidence
      sharedPoseData.value = poseConfidence > 0.3 ? [pose] : [];
      
    } catch (error) {
      console.error('Pose detection error:', error);
    }
  }, [poseModel, frameSize]);

  // Update UI with detected poses
  useEffect(() => {
    const updatePoses = () => {
      setDetectedPoses(sharedPoseData.value);
    };
    
    const interval = setInterval(updatePoses, 100); // Update UI at 10 FPS
    return () => clearInterval(interval);
  }, []);

  const renderPoseOverlay = () => {
    if (detectedPoses.length === 0) return null;

    const pose = detectedPoses[0];
    const confidenceThreshold = 0.5;

    return (
      <Svg
        style={StyleSheet.absoluteFill}
        width={frameSize.width}
        height={frameSize.height}
      >
        {/* Draw skeleton lines */}
        {SKELETON_CONNECTIONS.map(([startIdx, endIdx], index) => {
          const startPoint = pose.keypoints[startIdx];
          const endPoint = pose.keypoints[endIdx];
          
          if (startPoint.confidence > confidenceThreshold && endPoint.confidence > confidenceThreshold) {
            return (
              <Line
                key={`line-${index}`}
                x1={startPoint.x}
                y1={startPoint.y}
                x2={endPoint.x}
                y2={endPoint.y}
                stroke="#FF0000"
                strokeWidth="3"
                strokeOpacity="0.8"
              />
            );
          }
          return null;
        })}

        {/* Draw keypoints */}
        {pose.keypoints.map((keypoint, index) => {
          if (keypoint.confidence > confidenceThreshold) {
            return (
              <Circle
                key={`point-${index}`}
                cx={keypoint.x}
                cy={keypoint.y}
                r="6"
                fill="#00FF00"
                fillOpacity="0.9"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            );
          }
          return null;
        })}
      </Svg>
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
          isActive={true}
          frameProcessor={frameProcessor}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setFrameSize({ width, height });
          }}
        />
        
        {/* Pose overlay */}
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
              { color: poseModel.state === 'loaded' ? '#00FF00' : '#FF0000' }
            ]}>
              {poseModel.state === 'loaded' ? '✅ Ready' : '⏳ Loading...'}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Poses Detected:</Text>
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

          {/* Keypoint details */}
          {detectedPoses.length > 0 && (
            <View style={styles.keypointsList}>
              <Text style={styles.keypointsTitle}>🎯 Active Keypoints:</Text>
              {detectedPoses[0].keypoints
                .map((kp, idx) => ({ ...kp, name: KEYPOINT_NAMES[idx] }))
                .filter(kp => kp.confidence > 0.5)
                .slice(0, 5) // Show only first 5 for space
                .map((kp, idx) => (
                  <Text key={idx} style={styles.keypointText}>
                    • {kp.name}: {(kp.confidence * 100).toFixed(0)}%
                  </Text>
                ))}
            </View>
          )}
        </View>
      </View>

      {/* Loading indicator */}
      {poseModel.state === 'loading' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>🚀 Loading AI Model...</Text>
          <Text style={styles.subloadingText}>This may take a moment on first use</Text>
        </View>
      )}

      {/* Error state */}
      {poseModel.state === 'error' && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>❌ Failed to load AI model</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  keypointsList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  keypointsTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  keypointText: {
    color: '#CCCCCC',
    fontSize: 13,
    marginBottom: 4,
    fontFamily: 'monospace',
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