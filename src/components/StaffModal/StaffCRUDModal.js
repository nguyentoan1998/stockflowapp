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
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  TextInput,
  IconButton,
  Button,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { AnimatedLoadingSpinner } from '../LoadingSpinner';

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
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setFormData({
          full_name: initialData.full_name || '',
          employee_code: initialData.employee_code || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          address: initialData.address || '',
          date_of_birth: initialData.date_of_birth || '',
          hire_date: initialData.hire_date || '',
          position_id: initialData.position_id?.toString() || '',
          team_id: initialData.team_id?.toString() || '',
          statuss: initialData.statuss || 'Chính thức',
          avatar_url: initialData.avatar_url || null,
          image_url: initialData.image_url || null,
        });
        setAvatarUri(initialData.avatar_url || initialData.image_url);
      } else {
        resetForm();
      }
      startOpenAnimation();
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
    setErrors({});
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Họ và tên là bắt buộc';
    }

    if (!formData.employee_code.trim()) {
      newErrors.employee_code = 'Mã nhân viên là bắt buộc';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10-11 số)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    onSubmit({
      ...formData,
      avatarFile,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa nhân viên này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Thêm nhân viên mới';
      case 'edit': return 'Sửa nhân viên';
      case 'view': return 'Chi tiết nhân viên';
      default: return 'Nhân viên';
    }
  };

  const getModalIcon = () => {
    switch (mode) {
      case 'create': return 'account-plus';
      case 'edit': return 'account-edit';
      case 'view': return 'account-eye';
      default: return 'account';
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

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onDismiss}
    >
      <Animated.View
        style={[
          styles.modalOverlay,
          { opacity: fadeAnim }
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
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

            {/* Form Content */}
            <ScrollView 
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Avatar Section */}
              <Card style={styles.sectionCard}>
                <Card.Content>
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
                </Card.Content>
              </Card>

              {/* Basic Info */}
              <Card style={styles.sectionCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Thông tin cơ bản
                  </Text>

                  <TextInput
                    label="Họ và tên *"
                    value={formData.full_name}
                    onChangeText={(text) => setFormData({...formData, full_name: text})}
                    style={styles.input}
                    mode="outlined"
                    disabled={isReadOnly}
                    error={!!errors.full_name}
                    left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="account" size={24} color="#666" />} />}
                    placeholder="VD: Nguyễn Văn A"
                  />
                  {errors.full_name && (
                    <Text style={styles.errorText}>{errors.full_name}</Text>
                  )}

                  <TextInput
                    label="Mã nhân viên *"
                    value={formData.employee_code}
                    onChangeText={(text) => setFormData({...formData, employee_code: text.toUpperCase()})}
                    style={styles.input}
                    mode="outlined"
                    disabled={isReadOnly}
                    error={!!errors.employee_code}
                    left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="card-account-details" size={24} color="#666" />} />}
                    placeholder="VD: NV001"
                    autoCapitalize="characters"
                  />
                  {errors.employee_code && (
                    <Text style={styles.errorText}>{errors.employee_code}</Text>
                  )}

                  <View style={styles.rowInputs}>
                    <TextInput
                      label="Email"
                      value={formData.email}
                      onChangeText={(text) => setFormData({...formData, email: text})}
                      style={[styles.input, styles.halfWidth]}
                      mode="outlined"
                      disabled={isReadOnly}
                      error={!!errors.email}
                      left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="email" size={24} color="#666" />} />}
                      placeholder="email@company.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    
                    <TextInput
                      label="Số điện thoại"
                      value={formData.phone}
                      onChangeText={(text) => setFormData({...formData, phone: text})}
                      style={[styles.input, styles.halfWidth]}
                      mode="outlined"
                      disabled={isReadOnly}
                      error={!!errors.phone}
                      left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="phone" size={24} color="#666" />} />}
                      placeholder="0901234567"
                      keyboardType="phone-pad"
                    />
                  </View>
                  
                  {(errors.email || errors.phone) && (
                    <Text style={styles.errorText}>
                      {errors.email || errors.phone}
                    </Text>
                  )}

                  <TextInput
                    label="Địa chỉ"
                    value={formData.address}
                    onChangeText={(text) => setFormData({...formData, address: text})}
                    style={styles.input}
                    mode="outlined"
                    disabled={isReadOnly}
                    multiline
                    numberOfLines={2}
                    left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="map-marker" size={24} color="#666" />} />}
                    placeholder="Địa chỉ nhà"
                  />
                </Card.Content>
              </Card>

              {/* Work Info */}
              <Card style={styles.sectionCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Thông tin công việc
                  </Text>

                  {/* Status Selector */}
                  <View style={styles.categoryContainer}>
                    <Text variant="bodyMedium" style={styles.categoryLabel}>
                      Trạng thái nhân viên:
                    </Text>
                    <View style={styles.chipRow}>
                      {['Chính thức', 'Học việc', 'Nghỉ việc'].map((status) => (
                        <Chip
                          key={status}
                          mode={formData.statuss === status ? 'flat' : 'outlined'}
                          selected={formData.statuss === status}
                          onPress={() => !isReadOnly && setFormData({...formData, statuss: status})}
                          style={styles.statusChip}
                          disabled={isReadOnly}
                        >
                          {status}
                        </Chip>
                      ))}
                    </View>
                  </View>

                  {/* Position Selector */}
                  <View style={styles.categoryContainer}>
                    <Text variant="bodyMedium" style={styles.categoryLabel}>
                      Chức vụ:
                    </Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.categoryScroll}
                    >
                      <Chip
                        mode={formData.position_id === '' ? 'flat' : 'outlined'}
                        selected={formData.position_id === ''}
                        onPress={() => !isReadOnly && setFormData({...formData, position_id: ''})}
                        style={styles.categoryChip}
                        disabled={isReadOnly}
                      >
                        Chưa có chức vụ
                      </Chip>
                      {positions.map(position => (
                        <Chip
                          key={position.id}
                          mode={formData.position_id === position.id.toString() ? 'flat' : 'outlined'}
                          selected={formData.position_id === position.id.toString()}
                          onPress={() => !isReadOnly && setFormData({...formData, position_id: position.id.toString()})}
                          style={styles.categoryChip}
                          disabled={isReadOnly}
                        >
                          {position.name}
                        </Chip>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Team Selector */}
                  <View style={styles.categoryContainer}>
                    <Text variant="bodyMedium" style={styles.categoryLabel}>
                      Đội nhóm:
                    </Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.categoryScroll}
                    >
                      <Chip
                        mode={formData.team_id === '' ? 'flat' : 'outlined'}
                        selected={formData.team_id === ''}
                        onPress={() => !isReadOnly && setFormData({...formData, team_id: ''})}
                        style={styles.categoryChip}
                        disabled={isReadOnly}
                      >
                        Chưa có team
                      </Chip>
                      {teams.map(team => (
                        <Chip
                          key={team.id}
                          mode={formData.team_id === team.id.toString() ? 'flat' : 'outlined'}
                          selected={formData.team_id === team.id.toString()}
                          onPress={() => !isReadOnly && setFormData({...formData, team_id: team.id.toString()})}
                          style={styles.categoryChip}
                          disabled={isReadOnly}
                        >
                          {team.name}
                        </Chip>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.rowInputs}>
                    <TextInput
                      label="Ngày sinh"
                      value={formData.date_of_birth}
                      onChangeText={(text) => setFormData({...formData, date_of_birth: text})}
                      style={[styles.input, styles.halfWidth]}
                      mode="outlined"
                      disabled={isReadOnly}
                      left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="cake-variant" size={24} color="#666" />} />}
                      placeholder="DD/MM/YYYY"
                    />
                    
                    <TextInput
                      label="Ngày vào làm"
                      value={formData.hire_date}
                      onChangeText={(text) => setFormData({...formData, hire_date: text})}
                      style={[styles.input, styles.halfWidth]}
                      mode="outlined"
                      disabled={isReadOnly}
                      left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="calendar" size={24} color="#666" />} />}
                      placeholder="DD/MM/YYYY"
                    />
                  </View>
                </Card.Content>
              </Card>
            </ScrollView>

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
                      onPress={handleDelete}
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
          <AnimatedLoadingSpinner
            visible={loading}
            message={mode === 'create' ? 'Đang tạo nhân viên...' : 'Đang lưu thay đổi...'}
            type="pulse"
          />
        )}
      </Animated.View>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
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
  formContainer: {
    flex: 1,
    padding: 20,
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
  avatarSection: {
    alignItems: 'center',
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
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    color: '#666',
    marginBottom: 8,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  actionContainer: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#F8F9FA',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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

export default StaffCRUDModal;
