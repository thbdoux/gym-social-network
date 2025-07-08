// components/pose/PoseDebugOverlay.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface PoseLandmark {
  x: number;
  y: number;
  score: number;
  name?: string;
}

interface PoseData {
  keypoints?: PoseLandmark[];
  score?: number;
}

interface PoseDebugOverlayProps {
  pose: PoseData | null;
  visible: boolean;
  fps: number;
}

const PoseDebugOverlay: React.FC<PoseDebugOverlayProps> = ({
  pose,
  visible,
  fps
}) => {
  const { palette } = useTheme();

  if (!visible) return null;

  const renderKeypointInfo = (keypoint: PoseLandmark, index: number) => {
    const keypointNames = [
      'nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar',
      'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow',
      'leftWrist', 'rightWrist', 'leftHip', 'rightHip',
      'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'
    ];

    return (
      <View key={index} style={styles.keypointRow}>
        <Text style={[styles.keypointName, { color: palette.text }]}>
          {keypointNames[index] || `Point ${index}`}
        </Text>
        <Text style={[styles.keypointData, { color: palette.text }]}>
          x: {keypoint.x.toFixed(3)}, y: {keypoint.y.toFixed(3)}
        </Text>
        <Text style={[
          styles.confidenceText, 
          { 
            color: keypoint.score > 0.7 ? '#4CAF50' : 
                   keypoint.score > 0.4 ? '#FF9800' : '#F44336'
          }
        ]}>
          {(keypoint.score * 100).toFixed(0)}%
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.card_background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text }]}>
          Pose Debug Info
        </Text>
        <Text style={[styles.fpsText, { color: palette.primary }]}>
          {fps} FPS
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {pose ? (
          <>
            {pose.score && (
              <View style={styles.overallScore}>
                <Text style={[styles.scoreLabel, { color: palette.text }]}>
                  Overall Pose Score:
                </Text>
                <Text style={[
                  styles.scoreValue,
                  { 
                    color: pose.score > 0.7 ? '#4CAF50' : 
                           pose.score > 0.4 ? '#FF9800' : '#F44336'
                  }
                ]}>
                  {(pose.score * 100).toFixed(1)}%
                </Text>
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              Keypoints ({pose.keypoints?.length || 0}):
            </Text>

            {pose.keypoints?.map((keypoint, index) => 
              renderKeypointInfo(keypoint, index)
            )}
          </>
        ) : (
          <Text style={[styles.noPoseText, { color: palette.gray }]}>
            No pose detected
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    right: 20,
    width: 280,
    maxHeight: 400,
    borderRadius: 12,
    padding: 15,
    opacity: 0.95,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  fpsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    maxHeight: 300,
  },
  overallScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 5,
  },
  keypointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginVertical: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 4,
  },
  keypointName: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    textTransform: 'capitalize',
  },
  keypointData: {
    fontSize: 10,
    fontFamily: 'monospace',
    flex: 1.5,
    textAlign: 'center',
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  noPoseText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
});