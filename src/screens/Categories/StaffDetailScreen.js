import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function StaffDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { api } = useApi();
  
  const { staffId } = route.params;

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useFocusEffect(
    useCallback(() => {
      fetchStaff();
    }, [staffId])
  );

  const fetchStaff = async () => {
    try {
      setLoading(true);
      // Include relations: positions and teams
      const include = JSON.stringify({
        positions: true,
        teams: true
      });
      const response = await api.get(`/api/staff/${staffId}?include=${encodeURIComponent(include)}`);
      
      // Map relations to match expected format
      const staffData = response.data;
      if (staffData.positions) {
        staffData.position = staffData.positions;
      }
      if (staffData.teams) {
        staffData.team = staffData.teams;
      }
      
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff:', error);
      Alert.error('Lỗi', 'Không thể tải thông tin nhân viên', () => navigation.goBack());
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStaff();
    setRefreshing(false);
  };

  const handleEdit = () => {
    navigation.navigate('StaffForm', { mode: 'edit', staff });
  };

  const handleDelete = () => {
    Alert.confirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa nhân viên "${staff?.full_name}"?\n\nHành động này không thể hoàn tác!`,
      async () => {
        try {
          await api.delete(`/api/staff/${staffId}`);
          Alert.success(
            'Xóa thành công!',
            `Nhân viên "${staff?.full_name}" đã được xóa khỏi hệ thống.`,
            () => navigation.goBack()
          );
        } catch (error) {
          console.error('Error deleting staff:', error);
          Alert.error('Lỗi', 'Không thể xóa nhân viên. Vui lòng thử lại.');
        }
      }
    );
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'Chính thức': { color: '#4CAF50', bg: '#E8F5E9', icon: 'checkmark-circle' },
      'Học việc': { color: '#2196F3', bg: '#E3F2FD', icon: 'school' },
      'Nghỉ việc': { color: '#F44336', bg: '#FFEBEE', icon: 'close-circle' },
    };
    return statusMap[status] || statusMap['Chính thức'];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch (e) {
      return 'N/A';
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

  if (!staff) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Không tìm thấy nhân viên</Text>
      </View>
    );
  }

  const statusInfo = getStatusInfo(staff.statuss);

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: statusInfo.color }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>{staff.full_name}</Text>
            <Text style={styles.headerSubtitle}>
              {staff.position?.name || 'Chưa có chức vụ'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          {staff.image_url ? (
            <Image source={{ uri: staff.image_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={80} color="#ccc" />
            </View>
          )}
        </View>

        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Ionicons name={statusInfo.icon} size={18} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {staff.statuss}
            </Text>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Họ và tên:</Text>
            <Text style={styles.infoValue}>{staff.full_name || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{staff.email || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số điện thoại:</Text>
            <Text style={styles.infoValue}>{staff.phone || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Địa chỉ:</Text>
            <Text style={styles.infoValue}>{staff.address || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày sinh:</Text>
            <Text style={styles.infoValue}>{formatDate(staff.date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Giới tính:</Text>
            <Text style={styles.infoValue}>{staff.sex || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CMND/CCCD:</Text>
            <Text style={styles.infoValue}>{staff.cmt || 'N/A'}</Text>
          </View>
        </View>

        {/* Work Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin công việc</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Chức vụ:</Text>
            <Text style={styles.infoValue}>
              {staff.position?.name || 'Chưa có chức vụ'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Đội nhóm:</Text>
            <Text style={styles.infoValue}>
              {staff.team?.name || 'Chưa có team'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạng thái:</Text>
            <View style={[styles.inlineStatusBadge, { backgroundColor: statusInfo.bg }]}>
              <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
              <Text style={[styles.inlineStatusText, { color: statusInfo.color }]}>
                {staff.statuss}
              </Text>
            </View>
          </View>
        </View>

        {/* Timestamps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khác</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày tạo:</Text>
            <Text style={styles.infoValue}>{formatDate(staff.created_at)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cập nhật lần cuối:</Text>
            <Text style={styles.infoValue}>{formatDate(staff.updated_at)}</Text>
          </View>
        </View>
      </ScrollView>
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
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    flex: 2,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  inlineStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  inlineStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
