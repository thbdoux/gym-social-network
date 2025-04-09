// app/(app)/ai-coach.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

// Mock data for AI coach features
const coachFeatures = [
  {
    id: 'workout-plan',
    title: 'Personalized Workout Plan',
    description: 'Get a customized workout plan based on your goals, equipment, and experience level.',
    icon: 'barbell',
    color: '#3B82F6',
  },
  {
    id: 'nutrition',
    title: 'Nutrition Guidance',
    description: 'Receive tailored nutrition advice and meal suggestions to support your fitness journey.',
    icon: 'nutrition',
    color: '#10B981',
  },
  {
    id: 'form-check',
    title: 'Exercise Form Check',
    description: 'Upload a video to get feedback on your exercise technique and form.',
    icon: 'videocam',
    color: '#F59E0B',
  },
  {
    id: 'progress',
    title: 'Progress Analysis',
    description: 'AI analysis of your workout data to track progress and suggest improvements.',
    icon: 'analytics',
    color: '#8B5CF6',
  },
];

const AICoachScreen = () => {
  const { t } = useLanguage();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const handleFeaturePress = (featureId: string) => {
    setSelectedFeature(featureId);
    // In a real app, this would navigate to the specific feature screen
    console.log(`Selected feature: ${featureId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>{t('ai_coach_title')}</Text>
          <Text style={styles.heroSubtitle}>
            {t('ai_coach_subtitle')}
          </Text>
          
          {/* Coach avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AI</Text>
            </View>
          </View>
        </View>

        {/* Feature Cards */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>{t('features')}</Text>
          
          {coachFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.featureCard}
              onPress={() => handleFeaturePress(feature.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
                <Ionicons name={feature.icon as any} size={24} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>{t('recent_activity')}</Text>
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={48} color="#4B5563" />
            <Text style={styles.emptyStateText}>
              {t('no_recent_activity')}
            </Text>
          </View>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity style={styles.getStartedButton} activeOpacity={0.8}>
          <Text style={styles.getStartedButtonText}>
            {t('get_started')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  heroSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#60A5FA',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  activityContainer: {
    marginBottom: 24,
  },
  emptyState: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },
  getStartedButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AICoachScreen;