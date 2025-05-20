// app/(app)/group-workout/WorkoutTemplate.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import WorkoutCard from '../../../components/workouts/WorkoutCard';

interface WorkoutTemplateProps {
  workoutTemplate: any;
  workoutTemplateId: number;
  colors: any;
  user: string | undefined;
}

const WorkoutTemplate: React.FC<WorkoutTemplateProps> = ({
  workoutTemplate,
  workoutTemplateId,
  colors,
  user
}) => {
  const { t } = useLanguage();
  
  return (
    <View style={styles.templateSection}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        {t('workout_plan')}
      </Text>
      
      <WorkoutCard
        workoutId={workoutTemplateId}
        workout={workoutTemplate}
        isTemplate={true}
        user={user}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  templateSection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  }
});

export default WorkoutTemplate;