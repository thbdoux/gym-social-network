export function PoseCamera({ isActive, model, onPoseDetected }) {
    const device = useCameraDevice('front');
    const { resize } = useResizePlugin();
    
    const frameProcessor = useSkiaFrameProcessor((frame) => {
      'worklet';
      if (!model || !isActive) return;
      
      frame.render();
      
      // Resize frame to model input (192x192 for MoveNet)
      const resized = resize(frame, {
        scale: { width: 192, height: 192 },
        pixelFormat: 'rgb',
        dataType: 'uint8',
      });
      
      // Run TensorFlow Lite inference
      const outputs = model.runSync([resized]);
      const poses = interpretPoseOutput(outputs[0]);
      
      // Draw skeleton overlay
      drawPoseSkeleton(frame, poses);
      
      // Update coaching engine on main thread
      runOnJS(onPoseDetected)(poses);
    }, [model, isActive]);
    
    return (
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
        pixelFormat="rgb"
        fps={30}
      />
    );
  }