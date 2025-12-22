import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApi } from '../../contexts/ApiContext';
import { uploadImage } from '../../services/supabase';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function StaffFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { api } = useApi();
  
  const { mode, staff } = route.params || { mode: 'add' };
  const isEditMode = mode === 'edit';

  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  // Form data - match database schema
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    date: '', // date of birth in schema
    cmt: '', // ID card number
    sex: 'Nam', // Gender
    position_id: null,
    team_id: null,
    statuss: 'Chính thức',
    image_url: '',
  });

  // Dropdowns data
  const [positions, setPositions] = useState([]);
  const [teams, setTeams] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  
  // Modal states for custom pickers
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Status options
  const statusOptions = [
    { value: 'Chính thức', label: 'Chính thức', icon: 'checkmark-circle', color: '#4CAF50' },
    { value: 'Học việc', label: 'Học việc', icon: 'school', color: '#2196F3' },
    { value: 'Nghỉ việc', label: 'Nghỉ việc', icon: 'close-circle', color: '#F44336' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load positions and teams
      const [positionsRes, teamsRes] = await Promise.all([
        api.get('/api/positions'),
        api.get('/api/teams')
      ]);

      const positionsData = Array.isArray(positionsRes.data) 
        ? positionsRes.data 
        : (positionsRes.data?.positions || positionsRes.data?.data || []);
      const teamsData = Array.isArray(teamsRes.data) 
        ? teamsRes.data 
        : (teamsRes.data?.teams || teamsRes.data?.data || []);

      setPositions(positionsData);
      setTeams(teamsData);

      // If edit mode, load staff data
      if (isEditMode && staff) {
        setFormData({
          full_name: staff.full_name || '',
          email: staff.email || '',
          phone: staff.phone || '',
          address: staff.address || '',
          date: staff.date ? new Date(staff.date).toISOString().split('T')[0] : '',
          cmt: staff.cmt || '',
          sex: staff.sex || 'Nam',
          position_id: staff.position_id || null,
          team_id: staff.team_id || null,
          statuss: staff.statuss || 'Chính thức',
          image_url: staff.image_url || '',
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.error('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
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
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, image_url: result.assets[0].uri });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.full_name.trim()) {
      Alert.error('Lỗi', 'Vui lòng nhập họ và tên');
      return;
    }

    setSaving(true);

    try {
      // Upload image if it's a local file
      let uploadedImageUrl = formData.image_url;
      if (formData.image_url && formData.image_url.startsWith('file://')) {
        setImageUploading(true);
        const timestamp = Date.now();
        const filename = `staff_${Date.now()}_${timestamp}.jpg`;
        
        const uploadResult = await uploadImage(
          formData.image_url,
          'images',
          'staff',
          filename
        );

        if (uploadResult.success) {
          uploadedImageUrl = uploadResult.url;
        } else {
          Alert.warning('Cảnh báo', 'Không thể upload ảnh, sẽ lưu không có ảnh');
          uploadedImageUrl = '';
        }
        setImageUploading(false);
      }

      // Prepare data for API - match Prisma schema
      const dataToSend = {
        full_name: formData.full_name.trim(),
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        date: formData.date ? new Date(formData.date).toISOString() : null,
        cmt: formData.cmt || null,
        sex: formData.sex || null,
        position_id: formData.position_id || null,
        team_id: formData.team_id || null,
        statuss: formData.statuss,
        image_url: uploadedImageUrl || null,
      };

      if (isEditMode) {
        await api.put(`/api/staff/${staff.id}`, dataToSend);
        Alert.success(
          'Cập nhật thành công!', 
          `Nhân viên "${formData.full_name}" đã được cập nhật`,
          () => navigation.goBack()
        );
      } else {
        await api.post('/api/staff', dataToSend);
        Alert.success(
          'Thêm mới thành công!', 
          `Nhân viên "${formData.full_name}" đã được thêm vào hệ thống`,
          () => navigation.goBack()
        );
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      console.error('Error details:', error.response?.data);
      Alert.error(
        'Lỗi',
        error.response?.data?.message || error.response?.data?.error || 'Không thể lưu thông tin nhân viên'
      );
    } finally {
      setSaving(false);
      setImageUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ảnh đại diện</Text>
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            {formData.image_url ? (
              <Image source={{ uri: formData.image_url }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={40} color="#ccc" />
                <Text style={styles.imagePlaceholderText}>Chọn ảnh</Text>
              </View>
            )}
            {imageUploading && (
              <View style={styles.imageOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.uploadingText}>Đang upload...</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          
          <Text style={styles.label}>Họ và tên *</Text>
          <TextInput
            style={styles.input}
            value={formData.full_name}
            onChangeText={(text) => setFormData({ ...formData, full_name: text })}
            placeholder="VD: Nguyễn Văn A"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="email@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="0901234567"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Địa chỉ nhà"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Ngày sinh (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={formData.date}
            onChangeText={(text) => setFormData({ ...formData, date: text })}
            placeholder="1990-01-01"
          />

          <Text style={styles.label}>Số CMND/CCCD</Text>
          <TextInput
            style={styles.input}
            value={formData.cmt}
            onChangeText={(text) => setFormData({ ...formData, cmt: text })}
            placeholder="123456789"
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[styles.genderButton, formData.sex === 'Nam' && styles.genderButtonActive]}
              onPress={() => setFormData({ ...formData, sex: 'Nam' })}
            >
              <Text style={[styles.genderText, formData.sex === 'Nam' && styles.genderTextActive]}>
                Nam
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, formData.sex === 'Nữ' && styles.genderButtonActive]}
              onPress={() => setFormData({ ...formData, sex: 'Nữ' })}
            >
              <Text style={[styles.genderText, formData.sex === 'Nữ' && styles.genderTextActive]}>
                Nữ
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Work Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin công việc</Text>

          {/* Position Picker */}
          <Text style={styles.label}>Chức vụ</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowPositionPicker(true)}
          >
            <Ionicons name="briefcase" size={20} color="#666" />
            <Text style={[styles.selectText, !formData.position_id && styles.selectPlaceholder]}>
              {formData.position_id
                ? positions.find(p => p.id === formData.position_id)?.name || 'Chọn chức vụ'
                : 'Chọn chức vụ'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>

          {/* Team Picker */}
          <Text style={styles.label}>Đội nhóm</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowTeamPicker(true)}
          >
            <Ionicons name="people" size={20} color="#666" />
            <Text style={[styles.selectText, !formData.team_id && styles.selectPlaceholder]}>
              {formData.team_id
                ? teams.find(t => t.id === formData.team_id)?.name || 'Chọn đội nhóm'
                : 'Chọn đội nhóm'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>

          {/* Status Picker */}
          <Text style={styles.label}>Trạng thái</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowStatusPicker(true)}
          >
            <Ionicons 
              name={statusOptions.find(s => s.value === formData.statuss)?.icon || 'checkmark-circle'} 
              size={20} 
              color={statusOptions.find(s => s.value === formData.statuss)?.color || '#666'} 
            />
            <Text style={styles.selectText}>{formData.statuss}</Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSubmit}
          disabled={saving || imageUploading}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditMode ? 'Cập nhật' : 'Thêm mới'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Position Picker Modal */}
      <Modal
        visible={showPositionPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPositionPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn chức vụ</Text>
              <TouchableOpacity onPress={() => setShowPositionPicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  formData.position_id === null && styles.modalItemSelected
                ]}
                onPress={() => {
                  setFormData({ ...formData, position_id: null });
                  setShowPositionPicker(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  formData.position_id === null && styles.modalItemTextSelected
                ]}>
                  Chưa có chức vụ
                </Text>
                {formData.position_id === null && (
                  <Ionicons name="checkmark" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
              {positions.map(position => (
                <TouchableOpacity
                  key={position.id}
                  style={[
                    styles.modalItem,
                    formData.position_id === position.id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, position_id: position.id });
                    setShowPositionPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.position_id === position.id && styles.modalItemTextSelected
                  ]}>
                    {position.name}
                  </Text>
                  {formData.position_id === position.id && (
                    <Ionicons name="checkmark" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Team Picker Modal */}
      <Modal
        visible={showTeamPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTeamPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn đội nhóm</Text>
              <TouchableOpacity onPress={() => setShowTeamPicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  formData.team_id === null && styles.modalItemSelected
                ]}
                onPress={() => {
                  setFormData({ ...formData, team_id: null });
                  setShowTeamPicker(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  formData.team_id === null && styles.modalItemTextSelected
                ]}>
                  Chưa có team
                </Text>
                {formData.team_id === null && (
                  <Ionicons name="checkmark" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
              {teams.map(team => (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.modalItem,
                    formData.team_id === team.id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, team_id: team.id });
                    setShowTeamPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.team_id === team.id && styles.modalItemTextSelected
                  ]}>
                    {team.name}
                  </Text>
                  {formData.team_id === team.id && (
                    <Ionicons name="checkmark" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Status Picker Modal */}
      <Modal
        visible={showStatusPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn trạng thái</Text>
              <TouchableOpacity onPress={() => setShowStatusPicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {statusOptions.map(status => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.modalItem,
                    formData.statuss === status.value && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, statuss: status.value });
                    setShowStatusPicker(false);
                  }}
                >
                  <View style={styles.statusOption}>
                    <Ionicons name={status.icon} size={20} color={status.color} />
                    <Text style={[
                      styles.modalItemText,
                      formData.statuss === status.value && styles.modalItemTextSelected
                    ]}>
                      {status.label}
                    </Text>
                  </View>
                  {formData.statuss === status.value && (
                    <Ionicons name="checkmark" size={24} color={status.color} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  selectPlaceholder: {
    color: '#999',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  uploadingText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemTextSelected: {
    fontWeight: '600',
    color: '#4CAF50',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#fff',
  },
});
