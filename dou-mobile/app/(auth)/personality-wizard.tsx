// app/(auth)/personality-wizard.tsx
import React from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PersonalityWizard from '../../components/wizard/PersonalityWizard';

export default function PersonalityWizardScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top }
    ]}>
      <StatusBar barStyle="light-content" backgroundColor="#080f19" />
      <PersonalityWizard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080f19',
  },
});