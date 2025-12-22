import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  IconButton,
  Button,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { AnimatedLoadingSpinner } from '../LoadingSpinner';
import { FormInput } from '../CRUDModal/FormInputs';

const { width, height } = Dimensions.get('window');

/**
 * Staff CRUD Modal with Image Upload
 */
const StaffCRUDModal = ({
  visible,
  onDismiss,
  mode = 'create', // create, edit, view
  initialData = null,
  onSubmit,
  onDelete,
  loading = false,
  teams = [],
  positions = [],
}) => {
  // Animation refs
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    employee_code: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    hire_date: '',
    position_id: '',
    team_id: '',
    statuss: 'Chính thức',
    avatar_url: null,
    image_url: null,
  });

  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (visible) {
      startOpenAnimation();
      if (initialData) {
        setFormData({
          full_name: initialData.full_name || '',
          employee_code: initialData.employee_code || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          address: initialData.address || '',
          date_of_birth: initialData.date_of_birth || '',
          hire_date: initialData.hire_date || '',
          position_id: initialData.position_id || '',
          team_id: initialData.team_id || '',
          statuss: initialData.statuss || 'Chính thức',
          avatar_url: initialData.avatar_url || null,
          image_url: initialData.image_url || null,
        });
        setAvatarUri(initialData.avatar_url || initialData.image_url);
      } else {
        resetForm();
      }
    } else {
      startCloseAnimation();
    }
  }, [visible, initialData]);

  const resetForm = () => {
    setFormData({
      full_name: '',
      employee_code: '',
      email: '',
      phone: '',
      address: '',
      date_of_birth: '',
      hire_date: '',
      position_id: '',
      team_id: '',
      statuss: 'Chính thức',
      avatar_url: null,
      image_url: null,
    });
    setAvatarUri(null);
    setAvatarFile(null);
  };

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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Cần quyền truy cập thư viện ảnh!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
      setAvatarFile(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Cần quyền truy cập camera!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
      setAvatarFile(result.assets[0]);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      avatarFile,
    });
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Thêm nhân viên mới';
      case 'edit': return 'Chỉnh sửa nhân viên';
      case 'view': return 'Thông tin nhân viên';
      default: return '';
    }
  };

  const getHeaderColor = () => {
    switch (mode) {
      case 'create': return ['#4CAF50', '#66BB6A'];
      case 'edit': return ['#2196F3', '#42A5F5'];
      case 'view': return ['#9C27B0', '#BA68C8'];
      default: return ['#1976D2', '#42A5F5'];
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
                  name="account-plus" 
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

            {/* Form Content */}
            <View style={styles.formWrapper}>
              <ScrollView 
                style={styles.formContainer}
                contentContainerStyle={styles.formContentContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                  <View style={styles.avatarContainer}>
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <MaterialCommunityIcons name="account" size={64} color="#999" />
                      </View>
                    )}
                  </View>
                  
                  {!isReadOnly && (
                    <View style={styles.avatarActions}>
                      <TouchableOpacity style={styles.avatarBtn} onPress={pickImage}>
                        <MaterialCommunityIcons name="image" size={20} color="#2196F3" />
                        <Text style={styles.avatarBtnText}>Thư viện</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.avatarBtn} onPress={takePhoto}>
                        <MaterialCommunityIcons name="camera" size={20} color="#2196F3" />
                        <Text style={styles.avatarBtnText}>Chụp ảnh</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Basic Info */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
                  
                  <FormInput
                    label="Họ và tên *"
                    value={formData.full_name}
                    onChangeText={(text) => setFormData({...formData, full_name: text})}
                    icon="account"
                    disabled={isReadOnly}
                    placeholder="VD: Nguyễn Văn A"
                  />
                  
                  <FormInput
                    label="Mã nhân viên *"
                    value={formData.employee_code}
                    onChangeText={(text) => setFormData({...formData, employee_code: text.toUpperCase()})}
                    icon="card-account-details"
                    disabled={isReadOnly}
                    placeholder="VD: NV001"
                    autoCapitalize="characters"
                  />
                  
                  <FormInput
                    label="Email"
                    value={formData.email}
                    onChangeText={(text) => setFormData({...formData, email: text})}
                    icon="email"
                    disabled={isReadOnly}
                    placeholder="VD: nhanvien@company.com"
                    keyboardType="email-address"
                  />
                  
                  <FormInput
                    label="Số điện thoại"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({...formData, phone: text})}
                    icon="phone"
                    disabled={isReadOnly}
                    placeholder="VD: 0901234567"
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Work Info */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Thông tin công việc</Text>
                  
                  {/* Status Picker - Simplified for now */}
                  <View style={styles.statusPicker}>
                    <Text style={styles.statusLabel}>Trạng thái *</Text>
                    <View style={styles.statusOptions}>
                      {['Chính thức', 'Học việc', 'Nghỉ việc'].map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.statusOption,
                            formData.statuss === status && styles.statusOptionActive,
                            isReadOnly && styles.statusOptionDisabled,
                          ]}
                          onPress={() => !isReadOnly && setFormData({...formData, statuss: status})}
                          disabled={isReadOnly}
                        >
                          <Text
                            style={[
                              styles.statusOptionText,
                              formData.statuss === status && styles.statusOptionTextActive,
                            ]}
                          >
                            {status}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <FormInput
                    label="Địa chỉ"
                    value={formData.address}
                    onChangeText={(text) => setFormData({...formData, address: text})}
                    icon="map-marker"
                    disabled={isReadOnly}
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </ScrollView>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              {mode === 'view' ? (
                <Button
                  mode="contained"
                  onPress={onDismiss}
                  style={styles.actionButton}
                  buttonColor="#9C27B0"
                >
                  Đóng
                </Button>
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
                    onPress={handleSubmit}
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
              message={mode === 'create' ? 'Đang tạo mới...' : 'Đang lưu thay đổi...'}
              type="pulse"
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#2196F3',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e0e0e0',
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  avatarBtnText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  statusPicker: {
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  statusOptionDisabled: {
    opacity: 0.6,
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  statusOptionTextActive: {
    color: '#fff',
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

export default StaffCRUDModal;
