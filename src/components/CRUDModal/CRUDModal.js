import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedLoadingSpinner } from '../LoadingSpinner';

const { width, height } = Dimensions.get('window');

/**
 * Reusable CRUD Modal Component
 * @param {boolean} visible - Modal visibility
 * @param {function} onDismiss - Close modal callback
 * @param {string} mode - 'create', 'edit', 'view'
 * @param {string} title - Modal title
 * @param {string} icon - MaterialCommunityIcons icon name
 * @param {function} onSubmit - Submit handler
 * @param {function} onDelete - Delete handler (optional, for edit mode)
 * @param {boolean} loading - Loading state
 * @param {React.ReactNode} children - Form content
 * @param {object} customColors - Custom gradient colors { create, edit, view }
 */
const CRUDModal = ({
  visible,
  onDismiss,
  mode = 'create', // create, edit, view
  title,
  icon,
  onSubmit,
  onDelete,
  loading = false,
  children,
  customColors,
}) => {
  // Animation refs
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      startOpenAnimation();
    } else {
      startCloseAnimation();
    }
  }, [visible]);

  const startOpenAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startCloseAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getModalTitle = () => {
    if (title) return title;
    switch (mode) {
      case 'create': return 'Thêm mới';
      case 'edit': return 'Chỉnh sửa';
      case 'view': return 'Chi tiết';
      default: return '';
    }
  };

  const getModalIcon = () => {
    if (icon) return icon;
    switch (mode) {
      case 'create': return 'plus-circle';
      case 'edit': return 'pencil-circle';
      case 'view': return 'eye-circle';
      default: return 'file-document';
    }
  };

  const getHeaderColor = () => {
    if (customColors) {
      switch (mode) {
        case 'create': return customColors.create || ['#4CAF50', '#66BB6A'];
        case 'edit': return customColors.edit || ['#2196F3', '#42A5F5'];
        case 'view': return customColors.view || ['#9C27B0', '#BA68C8'];
      }
    }
    
    switch (mode) {
      case 'create': return ['#4CAF50', '#66BB6A'];
      case 'edit': return ['#2196F3', '#42A5F5'];
      case 'view': return ['#9C27B0', '#BA68C8'];
      default: return ['#1976D2', '#42A5F5'];
    }
  };

  const getLoadingMessage = () => {
    switch (mode) {
      case 'create': return 'Đang tạo mới...';
      case 'edit': return 'Đang lưu thay đổi...';
      default: return 'Đang xử lý...';
    }
  };

  const isReadOnly = mode === 'view';

  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            {/* Header */}
            <LinearGradient
              colors={getHeaderColor()}
              style={styles.modalHeader}
            >
              <View style={styles.headerContent}>
                <MaterialCommunityIcons 
                  name={getModalIcon()} 
                  size={32} 
                  color="#FFFFFF" 
                />
                <Text style={styles.modalTitle}>{getModalTitle()}</Text>
              </View>
              <IconButton
                icon="close"
                iconColor="#FFFFFF"
                size={24}
                onPress={onDismiss}
              />
            </LinearGradient>

            {/* Form Content with proper flex */}
            <View style={styles.formWrapper}>
              <ScrollView 
                style={styles.formContainer}
                contentContainerStyle={styles.formContentContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              {mode === 'view' ? (
                <View style={styles.viewActions}>
                  <Button
                    mode="contained"
                    onPress={onDismiss}
                    style={styles.actionButton}
                    buttonColor="#9C27B0"
                  >
                    Đóng
                  </Button>
                </View>
              ) : (
                <View style={styles.editActions}>
                  <Button
                    mode="outlined"
                    onPress={onDismiss}
                    style={styles.cancelButton}
                    disabled={loading}
                  >
                    Hủy
                  </Button>
                  
                  {mode === 'edit' && onDelete && (
                    <Button
                      mode="contained"
                      onPress={onDelete}
                      style={styles.deleteButton}
                      buttonColor="#f44336"
                      disabled={loading}
                    >
                      Xóa
                    </Button>
                  )}
                  
                  <Button
                    mode="contained"
                    onPress={onSubmit}
                    style={styles.submitButton}
                    buttonColor={mode === 'create' ? '#4CAF50' : '#2196F3'}
                    loading={loading}
                    disabled={loading}
                  >
                    {mode === 'create' ? 'Tạo' : 'Lưu'}
                  </Button>
                </View>
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <AnimatedLoadingSpinner
              visible={loading}
              message={getLoadingMessage()}
              type="pulse"
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

/**
 * Section Card Component for organizing form fields
 */
export const FormSection = ({ title, children, style }) => (
  <Card style={[styles.sectionCard, style]}>
    <Card.Content>
      {title && (
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {title}
        </Text>
      )}
      {children}
    </Card.Content>
  </Card>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: width > 600 ? 500 : width * 0.9,
    maxWidth: 500,
    height: height * 0.85,
    maxHeight: height * 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  formWrapper: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
  },
  formContentContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionContainer: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: '#F8F9FA',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  viewActions: {
    alignItems: 'center',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    minWidth: 120,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    marginHorizontal: 8,
    minWidth: 80,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default CRUDModal;
