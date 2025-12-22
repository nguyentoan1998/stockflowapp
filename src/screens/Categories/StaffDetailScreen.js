import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import StaffFormScreen from './StaffFormScreen';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function StaffDetailScreen({ route, navigation }) {
  const { staffMember: initialStaffMember, positions = [], departments = [] } = route.params;
  const { width, height } = useWindowDimensions();
  const { api } = useApi();
  
  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [staffMember, setStaffMember] = useState(initialStaffMember);
  const [loading, setLoading] = useState(false);
  
  // Hero Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const avatarScale = useRef(new Animated.Value(0)).current;
  const modalSlide = useRef(new Animated.Value(height)).current;

  // Reload staff data
  const reloadStaffData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/staff/${initialStaffMember.id}`);
      if (response.data) {
        setStaffMember(response.data);
      }
    } catch (error) {
      console.error('Error reloading staff data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Hero entrance animation
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(avatarScale, {
        toValue: 1,
        delay: 200,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Get position name from position_id
  const positionName = staffMember.position || 
                       (staffMember.position_id && positions.find(p => p.id === staffMember.position_id)?.name) || 
                       '-';
  
  // Get department name from team_id
  const departmentName = staffMember.department || 
                         (staffMember.team_id && departments.find(d => d.id === staffMember.team_id)?.name) || 
                         '-';

  const getStatusConfig = (status) => {
    const configs = {
      'Chính thức': { color: '#4CAF50', icon: 'check-circle', label: 'Chính thức' },
      'Học việc': { color: '#2196F3', icon: 'school', label: 'Học việc' },
      'Nghỉ việc': { color: '#F44336', icon: 'close-circle', label: 'Nghỉ việc' },
    };
    return configs[status] || { color: '#9E9E9E', icon: 'help-circle', label: 'Chưa xác định' };
  };

  const statusConfig = getStatusConfig(staffMember.statuss);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <CustomAlert {...alertConfig} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header with gradient */}
        <LinearGradient
          colors={[statusConfig.color, statusConfig.color + 'CC']}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => {
              setShowEditModal(true);
              // Animate modal in
              Animated.spring(modalSlide, {
                toValue: 0,
                friction: 9,
                tension: 50,
                useNativeDriver: true,
              }).start();
            }}
          >
            <Icon name="pencil" size={22} color="#fff" />
          </TouchableOpacity>

          <Animated.View 
            style={[
              styles.avatarSection,
              { transform: [{ scale: avatarScale }] }
            ]}
          >
            {staffMember.image_url ? (
              <Image source={{ uri: staffMember.image_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                <Icon name="account" size={56} color="#fff" />
              </View>
            )}
          </Animated.View>

          <Text style={styles.name}>{staffMember.full_name || staffMember.name || 'Chưa có tên'}</Text>
          <Text style={styles.position}>{positionName}</Text>

          {/* Status Badge */}
          <View style={styles.statusBadgeContainer}>
            <Icon name={statusConfig.icon} size={16} color="#fff" />
            <Text style={styles.statusBadgeText}>{statusConfig.label}</Text>
          </View>
        </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Thông tin cá nhân */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          
          <InfoRow 
            icon="gender-male-female" 
            label="Giới tính" 
            value={staffMember.sex || '-'} 
          />
          <InfoRow 
            icon="cake-variant" 
            label="Ngày sinh" 
            value={staffMember.date ? new Date(staffMember.date).toLocaleDateString('vi-VN') : '-'} 
          />
          <InfoRow 
            icon="card-account-details" 
            label="CMND/CCCD" 
            value={staffMember.cmt || '-'} 
          />
          <InfoRow 
            icon="map-marker" 
            label="Địa chỉ" 
            value={staffMember.address || '-'} 
          />
        </View>

        {/* Thông tin liên hệ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
          
          <InfoRow 
            icon="phone" 
            label="Số điện thoại" 
            value={staffMember.phone || '-'} 
            link={staffMember.phone ? `tel:${staffMember.phone}` : null}
          />
          <InfoRow 
            icon="email" 
            label="Email" 
            value={staffMember.email || '-'} 
            link={staffMember.email ? `mailto:${staffMember.email}` : null}
          />
        </View>

        {/* Thông tin công việc */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin công việc</Text>
          
          <InfoRow 
            icon="briefcase" 
            label="Chức vụ" 
            value={positionName} 
          />
          <InfoRow 
            icon="account-group" 
            label="Phòng ban" 
            value={departmentName} 
          />
          <InfoRow 
            icon="clipboard-check" 
            label="Trạng thái" 
            value={staffMember.statuss || '-'} 
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Delete Button Only */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#F44336' }]}
          onPress={() => {
            Alert.confirm(
              'Xác nhận xóa',
              `Bạn có chắc chắn muốn xóa "${staffMember.full_name || staffMember.name}"?`,
              async () => {
                try {
                  // Call delete API here if available
                  await api.delete(`/api/staff/${staffMember.id}`);
                  Alert.success(
                    'Xóa thành công!',
                    `Nhân viên "${staffMember.full_name || staffMember.name}" đã được xóa khỏi hệ thống.`,
                    () => navigation.navigate('Staff', { refresh: Date.now() })
                  );
                } catch (error) {
                  Alert.error('Lỗi', 'Không thể xóa nhân viên');
                }
              }
            );
          }}
        >
          <Icon name="delete" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Xóa nhân viên</Text>
        </TouchableOpacity>
      </View>
      </SafeAreaView>

      {/* Edit Modal - Full Screen Responsive */}
      <Modal
        visible={showEditModal}
        animationType="none"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => {
          Animated.timing(modalSlide, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setShowEditModal(false));
        }}
      >
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: modalSlide }],
            }
          ]}
        >
          <StaffFormScreen
            route={{
              params: {
                staffMember,
                positions,
                departments,
                isModal: true,
                onClose: async () => {
                  // Animate modal out
                  Animated.timing(modalSlide, {
                    toValue: height,
                    duration: 300,
                    useNativeDriver: true,
                  }).start(async () => {
                    setShowEditModal(false);
                    // Reload staff data from API
                    await reloadStaffData();
                  });
                },
              }
            }}
            navigation={navigation}
          />
        </Animated.View>
      </Modal>
    </Animated.View>
  );
}

const InfoRow = ({ icon, label, value, link }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>
      <Icon name={icon} size={20} color="#666" />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 12,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  editButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  avatarSection: {
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  position: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: -16,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
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
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 20,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
