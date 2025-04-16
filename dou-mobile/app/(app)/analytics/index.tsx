// app/(app)/analytics/index.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import { AnalyticsProvider } from './context/AnalyticsContext';
import { AnalyticsHeader } from './components/AnalyticsHeader';
import { AnalyticsFilter } from './components/AnalyticsFilter';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { useLanguage } from '../../../context/LanguageContext';
import { testCustomDateParsing } from './utils/debugUtils';
import { useUserLogs } from '../../../hooks/query/useLogQuery';

export default function AnalyticsScreen() {
  const { palette } = useTheme();
  const { requireAuth, user } = useAuth();
  const { t } = useLanguage();
  const [isReady, setIsReady] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const { data: logs, error: logsError } = useUserLogs(user?.username);
  
  // Run date parsing test when in debug mode
  useEffect(() => {
    if (isDebugMode) {
      testCustomDateParsing();
    }
  }, [isDebugMode]);
  
  // Add error check for specific date errors
  useEffect(() => {
    if (logsError) {
      console.error('Error fetching logs:', logsError);
      // Check if it's a date error
      if (logsError.toString().includes('Date')) {
        console.error('Possible date format issue detected in logs data');
      }
    }
  }, [logsError]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!requireAuth()) {
      return;
    }
    
    // Delay loading components to prevent initial render overload
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300); // Reduced delay for faster loading
    
    return () => clearTimeout(timer);
  }, [requireAuth]);
  
  // Debug info panel
  const renderDebugPanel = () => {
    if (!isDebugMode) return null;
    
    return (
      <View style={[styles.debugPanel, { backgroundColor: '#FF000030' }]}>
        <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Debug Mode</Text>
        <Text style={{ color: '#FFFFFF' }}>
          Logs: {logs ? logs.length : 'none'} {logsError ? '(Error: ' + logsError.toString().substring(0, 50) + '...)' : ''}
        </Text>
        <Text style={{ color: '#FFFFFF' }}>
          User: {user?.username || 'none'}
        </Text>
        <TouchableOpacity 
          onPress={testCustomDateParsing}
          style={{ backgroundColor: '#FFFFFF40', padding: 5, borderRadius: 3, marginTop: 5 }}
        >
          <Text style={{ color: '#FFFFFF' }}>Test Date Parsing</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.layout }}>
      <StatusBar barStyle="light-content" />
      
      <AnalyticsHeader />
      
      {/* Debug mode toggle - hidden in tap gesture */}
      <TouchableOpacity 
        style={styles.debugButton} 
        onPress={() => setIsDebugMode(!isDebugMode)}
      >
        <View style={{ width: 5, height: 5 }} />
      </TouchableOpacity>
      
      {renderDebugPanel()}
      
      <View style={[styles.container, { backgroundColor: palette.page_background }]}>
        {!isReady ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={palette.highlight} />
            <Text style={[styles.loadingText, { color: palette.text }]}>
              {t('loading_analytics')}
            </Text>
          </View>
        ) : (
          <AnalyticsProvider>
            <AnalyticsFilter />
            <AnalyticsCharts />
          </AnalyticsProvider>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0, // Removed extra top padding
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  debugButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    zIndex: 1000,
  },
  debugPanel: {
    padding: 10,
    margin: 5,
    borderRadius: 5,
  }
});