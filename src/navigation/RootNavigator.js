import React from 'react';
import { View } from 'react-native';
import { useApi } from '../contexts/ApiContext';
import { ConnectionDialog } from '../components/ConnectionDialog';
import AppNavigator from './AppNavigator';

/**
 * RootNavigator - Wrapper với ConnectionDialog
 * 
 * Hiển thị ConnectionDialog khi API call fail
 * Auto retry connection và đóng dialog khi thành công
 */
export default function RootNavigator() {
  const {
    showConnectionDialog,
    isRetryingConnection,
    connectionError,
    handleRetryConnection,
  } = useApi();

  return (
    <View style={{ flex: 1 }}>
      {/* Main Navigation */}
      <AppNavigator />

      {/* Connection Dialog - Overlay */}
      <ConnectionDialog
        visible={showConnectionDialog}
        isRetrying={isRetryingConnection}
        onRetry={handleRetryConnection}
        onManualSettings={() => {
          // TODO: Navigate to settings screen
          console.log('Open settings');
        }}
        errorMessage={connectionError}
      />
    </View>
  );
}
