import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Portal,
  Modal,
  TextInput,
  Switch,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../contexts/ApiContext';
import { ModernCard, GlassCard } from '../components/ui/GradientCard';
import { FadeIn, SlideUp, ScaleIn } from '../components/animations';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../theme';

// Memoized components
const StatItem = memo(({ value, label, color = Colors.primary }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
));

const SettingItem = memo(({ icon, title, subtitle, onPress, rightComponent, showChevron = true }) => (
  <TouchableOpacity 
    style={styles.settingItem} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.settingIconWrapper}>
      <Icon name={icon} size={22} color={Colors.primary} />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {rightComponent || (showChevron && <Icon name="chevron-right" size={22} color={Colors.textLight} />)}
  </TouchableOpacity>
));

const InfoRow = memo(({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
));

export default function ProfileScreen() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [userStats, setUserStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const { user, logout } = useAuth();
  const { api } = useApi();

  // Animations
  const headerScale = useRef(new Animated.Value(0.9)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadUserStats = useCallback(async () => {
    try {
      setUserStats({
        totalAttendance: 22,
        totalHours: 176,
        completedTasks: 45,
        pendingTasks: 3,
        lastLogin: new Date().toISOString(),
        joinDate: '2023-06-15',
      });
    } catch (error) {
      console.log('Error loading user stats:', error);
    }
  }, []);

  useEffect(() => {
    loadUserStats();
    setEditForm({
      fullName: user?.fullName || user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || '',
    });
  }, [user, loadUserStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserStats();
    setRefreshing(false);
  }, [loadUserStats]);

  const handleEditProfile = async () => {
    try {
      setLoading(true);
      const response = await api.put(`/users/${user.id}`, editForm);
      
      if (response.data.success) {
        Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
        setShowEditModal(false);
      }
    } catch (error) {
      Alert.alert('Loi', 'Khong the cap nhat thong tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Loi', 'Mat khau xac nhan khong khop!');
      return;
    }

    try {
      setLoading(true);
      const response = await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.data.success) {
        Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Mật khẩu hiện tại không đúng.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: logout }
      ]
    );
  };

  const getRoleBadge = (role) => {
    const config = {
      admin: { bg: Colors.error, label: 'Quản trị viên', icon: 'shield-crown' },
      manager: { bg: Colors.warning, label: 'Quản lý', icon: 'shield-account' },
      staff: { bg: Colors.success, label: 'Nhân viên', icon: 'account' },
    };
    const { bg, label, icon } = config[role] || config.staff;
    
    return (
      <View style={[styles.roleBadge, { backgroundColor: bg }]}>
        <Icon name={icon} size={14} color="#FFFFFF" />
        <Text style={styles.roleBadgeText}>{label}</Text>
      </View>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Profile Header */}
        <Animated.View 
          style={[
            styles.headerWrapper,
            {
              opacity: headerOpacity,
              transform: [{ scale: headerScale }],
            }
          ]}
        >
          <View style={styles.headerCard}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.editAvatarBtn}>
                  <Icon name="camera" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user?.fullName || user?.username || 'Nguoi dung'}
                </Text>
                <Text style={styles.userEmail}>
                  {user?.email || 'user@stockflow.com'}
                </Text>
                {getRoleBadge(user?.role)}
              </View>
              
              <TouchableOpacity 
                style={styles.editProfileBtn}
                onPress={() => setShowEditModal(true)}
              >
                <Icon name="pencil" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Statistics */}
        <SlideUp delay={100}>
          <ModernCard style={styles.statsCard} elevated>
            <Text style={styles.sectionTitle}>Thong ke</Text>
            <View style={styles.statsGrid}>
              <StatItem value={userStats.totalAttendance || 0} label="Ngay lam" />
              <StatItem value={`${userStats.totalHours || 0}h`} label="Tong gio" color={Colors.accent} />
              <StatItem value={userStats.completedTasks || 0} label="Hoan thanh" color={Colors.success} />
              <StatItem value={userStats.pendingTasks || 0} label="Dang xu ly" color={Colors.warning} />
            </View>
          </ModernCard>
        </SlideUp>

        {/* Account Info */}
        <SlideUp delay={200}>
          <ModernCard style={styles.infoCard} elevated>
            <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
            <InfoRow label="Ngày tham gia" value={formatDate(userStats.joinDate || new Date())} />
            <InfoRow label="Đăng nhập cuối" value={formatDate(userStats.lastLogin || new Date())} />
            <InfoRow label="ID nhân viên" value={`#${user?.id || '000'}`} />
          </ModernCard>
        </SlideUp>

        {/* Settings */}
        <SlideUp delay={300}>
          <ModernCard style={styles.settingsCard} elevated>
            <Text style={styles.sectionTitle}>Cài đặt</Text>
            
            <SettingItem
              icon="lock-outline"
              title="Đổi mật khẩu"
              subtitle="Cập nhật mật khẩu bảo mật"
              onPress={() => setShowPasswordModal(true)}
            />
            
            <SettingItem
              icon="bell-outline"
              title="Thong bao"
              subtitle="Nhan thong bao tu ung dung"
              showChevron={false}
              rightComponent={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  color={Colors.primary}
                />
              }
            />
            
            <SettingItem
              icon="brightness-6"
              title="Che do toi"
              subtitle="Giao dien toi cho mat"
              showChevron={false}
              rightComponent={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  color={Colors.primary}
                />
              }
            />
            
            <SettingItem
              icon="information-outline"
              title="Về ứng dụng"
              subtitle="Phiên bản 1.0.0"
              onPress={() => Alert.alert('StockFlow', 'Phiên bản 1.0.0\nQuản lý kho hàng thông minh')}
            />
          </ModernCard>
        </SlideUp>

        {/* Logout */}
        <SlideUp delay={400}>
          <Button
            mode="outlined"
            icon="logout"
            onPress={handleLogout}
            style={styles.logoutBtn}
          >
            Đăng xuất
          </Button>
        </SlideUp>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Portal>
        <Modal 
          visible={showEditModal} 
          onDismiss={() => setShowEditModal(false)} 
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
            
            <TextInput
              label="Họ và tên"
              value={editForm.fullName}
              onChangeText={(text) => setEditForm({...editForm, fullName: text})}
              mode="outlined"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
            
            <TextInput
              label="Email"
              value={editForm.email}
              onChangeText={(text) => setEditForm({...editForm, email: text})}
              mode="outlined"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
            
            <TextInput
              label="Số điện thoại"
              value={editForm.phone}
              onChangeText={(text) => setEditForm({...editForm, phone: text})}
              mode="outlined"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
            
            <TextInput
              label="Phong ban"
              value={editForm.department}
              onChangeText={(text) => setEditForm({...editForm, department: text})}
              mode="outlined"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
            
            <View style={styles.modalActions}>
              <Button 
                mode="outlined"
                onPress={() => setShowEditModal(false)}
                style={{ flex: 1, marginRight: 8 }}
              >
                Hủy
              </Button>
              <Button 
                mode="contained"
                onPress={handleEditProfile} 
                loading={loading}
                style={{ flex: 1 }}
              >
                Lưu
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

      {/* Change Password Modal */}
      <Portal>
        <Modal 
          visible={showPasswordModal} 
          onDismiss={() => setShowPasswordModal(false)} 
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            
            <TextInput
              label="Mật khẩu hiện tại"
              value={passwordForm.currentPassword}
              onChangeText={(text) => setPasswordForm({...passwordForm, currentPassword: text})}
              secureTextEntry
              mode="outlined"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
            
            <TextInput
              label="Mật khẩu mới"
              value={passwordForm.newPassword}
              onChangeText={(text) => setPasswordForm({...passwordForm, newPassword: text})}
              secureTextEntry
              mode="outlined"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
            
            <TextInput
              label="Xác nhận mật khẩu"
              value={passwordForm.confirmPassword}
              onChangeText={(text) => setPasswordForm({...passwordForm, confirmPassword: text})}
              secureTextEntry
              mode="outlined"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
            
            <View style={styles.modalActions}>
              <Button 
                mode="outlined"
                onPress={() => setShowPasswordModal(false)}
                style={{ flex: 1, marginRight: 8 }}
              >
                Hủy
              </Button>
              <Button 
                mode="contained"
                onPress={handleChangePassword} 
                loading={loading}
                style={{ flex: 1 }}
              >
                Đổi mật khẩu
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  // Header
  headerWrapper: {
    marginBottom: Spacing.md,
  },
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.h2,
    color: '#FFFFFF',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    ...Typography.h3,
    color: Colors.text,
  },
  userEmail: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  roleBadgeText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  editProfileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Stats Card
  statsCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...Typography.h2,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  // Info Card
  infoCard: {
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  // Settings Card
  settingsCard: {
    marginBottom: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  settingSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Logout
  logoutBtn: {
    marginTop: Spacing.sm,
  },
  // Modal
  modal: {
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  modalContent: {
    padding: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  input: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
});
