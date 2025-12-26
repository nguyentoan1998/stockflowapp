import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../contexts/ApiContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const { 
    isConnected, 
    testConnection, 
    baseUrl, 
    productionUrl,
    handleRetryConnection, // From ConnectionDialog context
  } = useApi();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'connected', 'reconnecting', 'failed'

  useEffect(() => {
    checkServerConnection();
  }, []);

  // Load saved email on component mount
  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('savedEmail');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error loading saved email:', error);
      }
    };
    loadSavedEmail();
  }, []);

  const checkServerConnection = async () => {
    setServerStatus('checking');
    const connected = await testConnection();
    
    if (connected) {
      setServerStatus('connected');
    } else {
      // Try to wake up server
      setServerStatus('reconnecting');
      await wakeUpServer();
    }
  };

  const wakeUpServer = async () => {
    try {
      // Ping production server to wake it up
      const response = await fetch('https://api.tinphatmetech.online/health', {
        method: 'GET',
        timeout: 10000,
      });
      
      if (response.ok) {
        // Wait a bit for server to fully start
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test connection again
        const connected = await testConnection();
        setServerStatus(connected ? 'connected' : 'failed');
      } else {
        setServerStatus('failed');
      }
    } catch (error) {
      console.error('Failed to wake up server:', error);
      setServerStatus('failed');
    }
  };

  const handleRetryConnectionLocal = () => {
    checkServerConnection();
  };

  // Wrapper to call both local check and ConnectionDialog handler
  const handleRetryConnectionClick = () => {
    handleRetryConnectionLocal();
    // Also trigger ConnectionDialog retry
    if (handleRetryConnection) {
      handleRetryConnection();
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Email không hợp lệ');
      return;
    }

    if (!isConnected) {
      setError('Vui lòng đợi kết nối với server');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(trimmedEmail, trimmedPassword);
      if (result.success) {
        // Save login info if remember me is checked
        if (rememberMe) {
          await AsyncStorage.setItem('savedEmail', trimmedEmail);
        } else {
          await AsyncStorage.removeItem('savedEmail');
        }
        // Navigation handled by AuthContext
      } else {
        setError(result.error || 'Đăng nhập thất bại');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Background decoration */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="cube" size={48} color={Colors.primary} />
              </View>
              <Text style={styles.appName}>StockFlow</Text>
              <Text style={styles.tagline}>Quản lý kho hàng thông minh</Text>
            </View>

            {/* Login Card */}
            <Card style={styles.loginCard}>
              <Text style={styles.welcomeText}>Chào mừng trở lại!</Text>
              <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.formContainer}>
                <Input
                  label="Email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon="mail-outline"
                />

                <Input
                  label="Mật khẩu"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  icon="lock-closed-outline"
                  onSubmitEditing={handleLogin}
                  returnKeyType="go"
                />

                <TouchableOpacity 
                  style={styles.rememberMeContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && (
                      <Ionicons name="checkmark" size={16} color={Colors.surface} />
                    )}
                  </View>
                  <Text style={styles.rememberMeText}>Lưu thông tin đăng nhập</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                </TouchableOpacity>

                <Button
                  variant="primary"
                  size="large"
                  onPress={handleLogin}
                  loading={loading}
                  style={styles.loginButton}
                  disabled={serverStatus === 'checking' || serverStatus === 'reconnecting'}
                >
                  Đăng nhập
                </Button>

                {/* Server Status */}
                <View style={styles.serverStatusContainer}>
                  {serverStatus === 'checking' && (
                    <View style={styles.statusRow}>
                      <ActivityIndicator size="small" color="#666" />
                      <Text style={styles.statusText}>Đang kiểm tra kết nối...</Text>
                    </View>
                  )}
                  
                  {serverStatus === 'reconnecting' && (
                    <View style={styles.statusRow}>
                      <ActivityIndicator size="small" color="#FF9800" />
                      <Text style={[styles.statusText, { color: '#FF9800' }]}>
                        Đang kích hoạt server...
                      </Text>
                    </View>
                  )}
                  
                  {serverStatus === 'connected' && (
                    <View style={styles.statusRow}>
                      <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                      <Text style={[styles.statusText, { color: '#4CAF50' }]}>
                        Kết nối thành công
                      </Text>
                    </View>
                  )}
                  
                  {serverStatus === 'failed' && (
                    <View style={styles.statusColumn}>
                      <View style={styles.statusRow}>
                        <Ionicons name="close-circle" size={18} color="#F44336" />
                        <Text style={[styles.statusText, { color: '#F44336' }]}>
                          Không thể kết nối server
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={handleRetryConnectionClick}
                      >
                        <Ionicons name="refresh" size={16} color="#2196F3" />
                        <Text style={styles.retryText}>Thử lại</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </Card>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.1,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: Colors.primary,
    top: -150,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: Colors.secondary,
    bottom: -80,
    left: -50,
  },
  circle3: {
    width: 150,
    height: 150,
    backgroundColor: Colors.accent,
    top: '40%',
    left: -75,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  appName: {
    ...Typography.h1,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  loginCard: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing.xl,
  },
  welcomeText: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  errorContainer: {
    backgroundColor: `${Colors.error}15`,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
  },
  formContainer: {
    width: '100%',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
  },
  rememberMeText: {
    ...Typography.bodySmall,
    color: Colors.text,
    flex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    width: '100%',
    marginTop: Spacing.md,
  },
  serverStatusContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusColumn: {
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    marginTop: 4,
  },
  retryText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  signupText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
  },
});
