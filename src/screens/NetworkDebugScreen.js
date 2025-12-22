import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { useApi } from '../contexts/ApiContext';

export default function NetworkDebugScreen() {
  const { api, baseURL } = useApi();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (test, status, message, details = null) => {
    setResults(prev => [...prev, {
      test,
      status,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runNetworkTests = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: Health Check
    try {
      addResult('Health Check', 'testing', 'Testing server health...');
      const healthResponse = await api.get('/health');
      addResult('Health Check', 'success', `Server is healthy`, healthResponse.data);
    } catch (error) {
      addResult('Health Check', 'error', `Health check failed: ${error.message}`, {
        code: error.code,
        status: error.response?.status,
        url: error.config?.url
      });
    }

    // Test 2: Auth endpoint accessibility
    try {
      addResult('Auth Test', 'testing', 'Testing auth endpoint...');
      await api.post('/auth/login', { user: 'test', password: 'test' });
    } catch (error) {
      if (error.response) {
        addResult('Auth Test', 'success', `Auth endpoint accessible (status: ${error.response.status})`);
      } else {
        addResult('Auth Test', 'error', `Auth endpoint unreachable: ${error.message}`);
      }
    }

    // Test 3: API endpoints
    try {
      addResult('API Test', 'testing', 'Testing API endpoints...');
      const apiResponse = await api.get('/api/products?take=1');
      addResult('API Test', 'success', `API endpoints working`, { 
        status: apiResponse.status,
        dataLength: apiResponse.data?.data?.length || 0
      });
    } catch (error) {
      addResult('API Test', 'error', `API test failed: ${error.message}`, {
        status: error.response?.status,
        url: error.config?.url
      });
    }

    setTesting(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'error': return '#f44336';
      case 'testing': return '#FF9800';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'testing': return '🔄';
      default: return 'ℹ️';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>Network Debug</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Test connection to StockFlow server
          </Text>
          <Divider style={styles.divider} />
          <Text variant="bodySmall">
            Server URL: {baseURL}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.actionCard}>
        <Card.Content>
          <Button 
            mode="contained" 
            onPress={runNetworkTests}
            disabled={testing}
            loading={testing}
            icon="wifi"
          >
            {testing ? 'Running Tests...' : 'Run Network Tests'}
          </Button>
        </Card.Content>
      </Card>

      {results.length > 0 && (
        <Card style={styles.resultsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.resultsTitle}>Test Results</Text>
            <Divider style={styles.divider} />
            
            {results.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  <Text style={[styles.resultIcon, { color: getStatusColor(result.status) }]}>
                    {getStatusIcon(result.status)}
                  </Text>
                  <Text variant="titleSmall" style={styles.resultTest}>
                    {result.test}
                  </Text>
                  <Text variant="bodySmall" style={styles.resultTime}>
                    {result.timestamp}
                  </Text>
                </View>
                
                <Text 
                  variant="bodyMedium" 
                  style={[styles.resultMessage, { color: getStatusColor(result.status) }]}
                >
                  {result.message}
                </Text>
                
                {result.details && (
                  <Text variant="bodySmall" style={styles.resultDetails}>
                    {JSON.stringify(result.details, null, 2)}
                  </Text>
                )}
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleMedium">Troubleshooting Tips</Text>
          <Divider style={styles.divider} />
          <Text variant="bodySmall" style={styles.tipText}>
            • Make sure the server is running on port 3001{'\n'}
            • Check that you're on the same WiFi network{'\n'}
            • Verify the IP address in ApiContext.js{'\n'}
            • Try restarting the Expo development server{'\n'}
            • Check firewall settings on your computer
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  actionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  resultsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  resultsTitle: {
    fontWeight: 'bold',
  },
  resultItem: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  resultTest: {
    flex: 1,
    fontWeight: 'bold',
  },
  resultTime: {
    color: '#666',
  },
  resultMessage: {
    marginLeft: 24,
    marginBottom: 4,
  },
  resultDetails: {
    marginLeft: 24,
    color: '#666',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
  tipText: {
    color: '#666',
    lineHeight: 20,
  },
});