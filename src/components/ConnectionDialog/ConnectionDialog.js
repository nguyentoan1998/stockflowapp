import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedLoadingSpinner from '../LoadingSpinner/AnimatedLoadingSpinner';

export function ConnectionDialog({
  visible,
  isRetrying,
  onRetry,
  onManualSettings,
  errorMessage,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Kết Nối Server</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Loading Spinner */}
              <View style={styles.spinnerContainer}>
                <AnimatedLoadingSpinner size={60} color="#007AFF" />
              </View>

              {/* Status Text */}
              <Text style={styles.statusText}>
                {isRetrying ? 'Đang kết nối lại...' : 'Đang kết nối...'}
              </Text>

              {/* Error Message */}
              {errorMessage && (
                <Text style={styles.errorText}>
                  {errorMessage}
                </Text>
              )}

              {/* Info */}
              <Text style={styles.infoText}>
                Vui lòng chờ khi chúng tôi kết nối đến server
              </Text>
            </View>

            {/* Actions */}
            {isRetrying && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={onRetry}
                >
                  <Text style={styles.retryButtonText}>Thử Lại</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={onManualSettings}
                >
                  <Text style={styles.settingsButtonText}>Cài Đặt</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
  content: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  spinnerContainer: {
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#dc3545',
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  retryButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  settingsButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
});
