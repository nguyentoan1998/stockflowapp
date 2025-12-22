import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, uploadMultipleImages } from '../../services/supabase';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function StaffFormScreen({ route, navigation }) {
  const { 
    staffMember, 
    positions = [], 
    departments = [],
    isModal = false,
    onClose = null 
  } = route.params || {};
  const isEditMode = !!staffMember;
  const { api } = useApi();

  // Form state
  const [formData, setFormData] = useState({
    full_name: staffMember?.full_name || staffMember?.name || '',
    sex: staffMember?.sex || 'Nam',
    date: staffMember?.date || '',
    cmt: staffMember?.cmt || '',
    address: staffMember?.address || '',
    phone: staffMember?.phone || '',
    email: staffMember?.email || '',
    position_id: staffMember?.position_id || null,
    team_id: staffMember?.team_id || null,
    statuss: staffMember?.statuss || 'Học việc',
    image_url: staffMember?.image_url || '',
    image_cmt: staffMember?.image_cmt || '',
  });

  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  const [loading, setLoading] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDateToDMY = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return '';
    }
  };

  const formatDateToYMD = (dateString) => {
    if (!dateString) return null;
    try {
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      // If in DD-MM-YYYY format, convert
      const parts = dateString.split('-');
      if (parts.length === 3 && parts[0].length <= 2) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
      
      // Try to parse as date
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      return null;
    } catch (e) {
      console.error('Date format error:', e);
      return null;
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.error('Lỗi', 'Cần quyền truy cập thư viện ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      updateField('image_url', result.assets[0].uri);
    }
  };

  const pickCMTImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.error('Lỗi', 'Cần quyền truy cập thư viện ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const images = result.assets.map(asset => asset.uri).join(',');
      updateField('image_cmt', images);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.full_name || !formData.full_name.trim()) {
      Alert.error('Lỗi', 'Vui lòng nhập tên nhân viên');
      return;
    }

    setLoading(true);
    try {
      let uploadedImageUrl = formData.image_url;
      let uploadedCmtImages = formData.image_cmt;

      // Upload avatar image if new (local URI)
      if (formData.image_url && formData.image_url.startsWith('file://')) {
        setUploadProgress('Đang upload ảnh đại diện...');
        const staffId = staffMember?.id || Date.now();
        const filename = `employee_${staffId}_${Date.now()}.jpg`;
        const result = await uploadImage(formData.image_url, 'images', 'employees', filename);
        
        if (result.success) {
          uploadedImageUrl = result.url;
          console.log('Avatar uploaded:', uploadedImageUrl);
        } else {
          setUploadProgress('');
          Alert.error('Lỗi', 'Không thể upload ảnh đại diện: ' + result.error);
          setLoading(false);
          return;
        }
      }

      // Upload CMT images if new (local URIs)
      if (formData.image_cmt && formData.image_cmt.includes('file://')) {
        const uris = formData.image_cmt.split(',').filter(uri => uri.trim());
        setUploadProgress(`Đang upload ảnh CMND (${uris.length} ảnh)...`);
        const staffId = staffMember?.id || Date.now();
        const prefix = `cmt_${staffId}`;
        const result = await uploadMultipleImages(uris, 'images', 'cmt', prefix);
        
        if (result.success) {
          uploadedCmtImages = result.urls.join(',');
          console.log('CMT images uploaded:', uploadedCmtImages);
        } else {
          setUploadProgress('');
          Alert.error('Lỗi', 'Không thể upload ảnh CMND: ' + result.error);
          setLoading(false);
          return;
        }
      }

      setUploadProgress('Đang lưu thông tin...');

      // Prepare data for API - match Prisma schema exactly
      const dataToSend = {
        full_name: formData.full_name.trim(),
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        cmt: formData.cmt || null,
        image_cmt: uploadedCmtImages || null,
        sex: formData.sex || null,
        date: formData.date ? new Date(formatDateToYMD(formData.date)).toISOString() : null,
        statuss: formData.statuss || 'Học việc',
        image_url: uploadedImageUrl || null,
        position_id: formData.position_id || null,
        team_id: formData.team_id || null,
      };

      console.log('Sending data:', dataToSend);

      let response;
      if (isEditMode) {
        response = await api.put(`/api/staff/${staffMember.id}`, dataToSend);
        console.log('Update response:', response.data);
      } else {
        response = await api.post('/api/staff', dataToSend);
        console.log('Create response:', response.data);
      }
      
      // Show success message and navigate back
      setShowSuccessMessage(true);
      setTimeout(() => {
        if (isModal && onClose) {
          // Modal mode: just close
          onClose();
        } else {
          // Navigation mode: pop screens
          if (isEditMode) {
            navigation.pop(2);
          } else {
            navigation.pop(1);
          }
        }
      }, 1500);
    } catch (error) {
      console.error('Save error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Không thể lưu thông tin';
      Alert.error('Lỗi', errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'Chính thức': { color: '#4CAF50', icon: 'check-circle' },
      'Học việc': { color: '#2196F3', icon: 'school' },
      'Nghỉ việc': { color: '#F44336', icon: 'close-circle' },
    };
    return configs[status] || { color: '#007AFF', icon: 'help-circle' };
  };

  const statusConfig = getStatusConfig(formData.statuss);

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />
      
      {/* Simple Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (isModal && onClose) {
              onClose();
            } else {
              navigation.goBack();
            }
          }}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isEditMode ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
        </Text>

        <View style={{width: 24}} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Thông tin cơ bản */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

              <TextInput
                label="Họ và tên *"
                value={formData.full_name}
                onChangeText={(text) => updateField('full_name', text)}
                style={styles.input}
                mode="outlined"
                outlineColor="#e0e0e0"
                activeOutlineColor={statusConfig.color}
                left={<TextInput.Icon icon="account" />}
              />

              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setShowGenderPicker(!showGenderPicker)}
              >
                <Icon name="gender-male-female" size={20} color="#666" />
                <Text style={styles.pickerButtonText}>
                  Giới tính: {formData.sex}
                </Text>
                <Icon name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              {showGenderPicker && (
                <View style={styles.pickerOptions}>
                  {['Nam', 'Nữ'].map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={styles.pickerOption}
                      onPress={() => {
                        updateField('sex', gender);
                        setShowGenderPicker(false);
                      }}
                    >
                      <View style={styles.statusOption}>
                        <Icon 
                          name={gender === 'Nam' ? 'gender-male' : 'gender-female'} 
                          size={20} 
                          color={gender === 'Nam' ? '#2196F3' : '#E91E63'} 
                        />
                        <Text style={styles.pickerOptionText}>{gender}</Text>
                      </View>
                      {formData.sex === gender && (
                        <Icon name="check" size={20} color={statusConfig.color} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TextInput
                label="Ngày sinh (DD-MM-YYYY)"
                value={formData.date ? formatDateToDMY(formData.date) : ''}
                onChangeText={(text) => {
                  // Store the formatted value directly
                  if (text.length === 0) {
                    updateField('date', null);
                  } else {
                    // Just store DD-MM-YYYY format, convert on save
                    updateField('date', text);
                  }
                }}
                onBlur={() => {
                  // Validate and convert on blur
                  if (formData.date) {
                    const converted = formatDateToYMD(formData.date);
                    if (converted) {
                      updateField('date', converted);
                    }
                  }
                }}
                style={styles.input}
                mode="outlined"
                placeholder="10-07-1998"
                keyboardType="numeric"
                outlineColor="#e0e0e0"
                activeOutlineColor={statusConfig.color}
                left={<TextInput.Icon icon="calendar" />}
              />

              {/* Avatar Image */}
              <TouchableOpacity 
                style={styles.imagePickerButton}
                onPress={pickImage}
              >
                <Icon name="camera" size={20} color="#666" />
                <Text style={styles.pickerButtonText}>
                  {formData.image_url ? 'Ảnh đại diện đã chọn' : 'Chọn ảnh đại diện'}
                </Text>
                {formData.image_url && (
                  <Image source={{ uri: formData.image_url }} style={styles.imagePreview} />
                )}
              </TouchableOpacity>

              {/* CMT Images */}
              <TouchableOpacity 
                style={styles.imagePickerButton}
                onPress={pickCMTImages}
              >
                <Icon name="card-account-details" size={20} color="#666" />
                <Text style={styles.pickerButtonText}>
                  {formData.image_cmt ? `Ảnh CMND (${formData.image_cmt.split(',').length})` : 'Chọn ảnh CMND (nhiều ảnh)'}
                </Text>
              </TouchableOpacity>

              {formData.image_cmt && (
                <View style={styles.imageGrid}>
                  {formData.image_cmt.split(',').map((uri, index) => (
                    <Image key={index} source={{ uri }} style={styles.cmtImage} />
                  ))}
                </View>
              )}

              <TextInput
                label="CMND/CCCD"
                value={formData.cmt}
                onChangeText={(text) => updateField('cmt', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                outlineColor="#e0e0e0"
                activeOutlineColor={statusConfig.color}
                left={<TextInput.Icon icon="card-account-details" />}
              />

              <TextInput
                label="Địa chỉ"
                value={formData.address}
                onChangeText={(text) => updateField('address', text)}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={2}
                outlineColor="#e0e0e0"
                activeOutlineColor={statusConfig.color}
                left={<TextInput.Icon icon="map-marker" />}
              />
            </View>

            {/* Thông tin liên hệ */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>

              <TextInput
                label="Số điện thoại"
                value={formData.phone}
                onChangeText={(text) => updateField('phone', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
                outlineColor="#e0e0e0"
                activeOutlineColor={statusConfig.color}
                left={<TextInput.Icon icon="phone" />}
              />

              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                outlineColor="#e0e0e0"
                activeOutlineColor={statusConfig.color}
                left={<TextInput.Icon icon="email" />}
              />
            </View>

            {/* Thông tin công việc */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin công việc</Text>

              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setShowPositionPicker(!showPositionPicker)}
              >
                <Icon name="briefcase" size={20} color="#666" />
                <Text style={styles.pickerButtonText}>
                  {formData.position_id 
                    ? positions.find(p => p.id === formData.position_id)?.name || 'Chọn chức vụ'
                    : 'Chọn chức vụ'}
                </Text>
                <Icon name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              {showPositionPicker && (
                <View style={styles.pickerOptions}>
                  {positions.map((position) => (
                    <TouchableOpacity
                      key={position.id}
                      style={styles.pickerOption}
                      onPress={() => {
                        updateField('position_id', position.id);
                        setShowPositionPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>{position.name}</Text>
                      {formData.position_id === position.id && (
                        <Icon name="check" size={20} color={statusConfig.color} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setShowDepartmentPicker(!showDepartmentPicker)}
              >
                <Icon name="account-group" size={20} color="#666" />
                <Text style={styles.pickerButtonText}>
                  {formData.team_id 
                    ? departments.find(d => d.id === formData.team_id)?.name || 'Chọn phòng ban'
                    : 'Chọn phòng ban'}
                </Text>
                <Icon name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              {showDepartmentPicker && (
                <View style={styles.pickerOptions}>
                  {departments.map((dept) => (
                    <TouchableOpacity
                      key={dept.id}
                      style={styles.pickerOption}
                      onPress={() => {
                        updateField('team_id', dept.id);
                        setShowDepartmentPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>{dept.name}</Text>
                      {formData.team_id === dept.id && (
                        <Icon name="check" size={20} color={statusConfig.color} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setShowStatusPicker(!showStatusPicker)}
              >
                <Icon name={statusConfig.icon} size={20} color={statusConfig.color} />
                <Text style={styles.pickerButtonText}>{formData.statuss}</Text>
                <Icon name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              {showStatusPicker && (
                <View style={styles.pickerOptions}>
                  {['Chính thức', 'Học việc', 'Nghỉ việc'].map((status) => {
                    const config = getStatusConfig(status);
                    return (
                      <TouchableOpacity
                        key={status}
                        style={styles.pickerOption}
                        onPress={() => {
                          updateField('statuss', status);
                          setShowStatusPicker(false);
                        }}
                      >
                        <View style={styles.statusOption}>
                          <Icon name={config.icon} size={18} color={config.color} />
                          <Text style={styles.pickerOptionText}>{status}</Text>
                        </View>
                        {formData.statuss === status && (
                          <Icon name="check" size={20} color={config.color} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.loadingGradient}
            >
              <Icon name="loading" size={48} color="#fff" />
              <Text style={styles.loadingText}>{uploadProgress || 'Đang xử lý...'}</Text>
            </LinearGradient>
          </View>
        </View>
      )}

      {/* Success Message Overlay */}
      {showSuccessMessage && (
        <Animated.View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconContainer}>
              <Icon name="check-circle" size={64} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>
              {isEditMode ? 'Cập nhật thành công!' : 'Thêm mới thành công!'}
            </Text>
            <Text style={styles.successMessage}>
              Đang quay lại...
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Fixed Footer with Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButtonFooter, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="checkmark" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>
                {isEditMode ? 'Cập nhật' : 'Thêm mới'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 100, // Space for footer
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  pickerOptions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  imagePreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginLeft: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  cmtImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    minWidth: 280,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingCard: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 20,
  },
  loadingGradient: {
    padding: 40,
    alignItems: 'center',
    minWidth: 280,
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  saveButtonFooter: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
