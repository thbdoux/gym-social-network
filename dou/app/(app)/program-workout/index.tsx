// app/(app)/program-workout/index.tsx
import { Redirect } from 'expo-router';

// This is a fallback in case someone tries to navigate to /program-workout without IDs
// Redirect to programs list
export default function ProgramWorkoutIndex() {
  return <Redirect href="/programs" />;
}