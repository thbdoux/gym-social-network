export default function RealtimeCoachingScreen() {
    const [isActive, setIsActive] = useState(true);
    const { poseModel, isLoaded } = usePoseDetection();
    const { feedback, exerciseMetrics } = useCoachingEngine();
    
    return (
      <SafeAreaView style={styles.container}>
        <PoseCamera 
          isActive={isActive}
          model={poseModel}
          onPoseDetected={handlePoseDetected}
        />
        <CoachingFeedback feedback={feedback} />
        <PerformanceMonitor metrics={exerciseMetrics} />
      </SafeAreaView>
    );
  }