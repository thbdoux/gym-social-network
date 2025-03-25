// components/navigation/HeaderLogo.tsx
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

const HeaderLogo = () => {
  return (
    <View style={styles.container}>
      {/* Use a text fallback since SVGs might require additional setup */}
      <Text style={styles.logoText}>dou</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    // Add slight gradient-like effect using text shadow
    textShadowColor: 'rgba(59, 130, 246, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  }
});

export default HeaderLogo;