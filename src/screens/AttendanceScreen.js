import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Easing,
  Dimensions,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../contexts/ApiContext';
import { ModernButton } from '../components/ui/ModernButton';
import { ModernCard } from '../components/ui/GradientCard';
import { FadeIn, SlideUp, ScaleIn, AnimatedNumber, Pulse } from '../components/animations';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../theme';

const { width } = Dimensions.get('window');

// Memoized components for performance
const StatusBadge = memo(({ status }) => {
  const config = {
    checked_in: { bg: Colors.success + '20', color: Colors.success, text: 'Dang lam viec', icon: 'check-circle' },
    checked_out: { bg: Colors.info + '20', color: Colors.info, text: 'Hoan thanh', icon: 'check-circle-outline' },
    not_checked_in: { bg: Colors.textLight + '20', color: Colors.textSecondary, text: 'Chua cham cong', icon: 'circle-outline' },
  };
  const { bg, color, text, icon } = config[status] || config.not_checked_in;
  
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <Icon name={icon} size={16} color={color} />
      <Text style={[styles.statusText, { color }]}>{text}</Text>
    </View>
  );
});

const TimeCard = memo(({ icon, label, value, color }) => (
  <View style={styles.timeCard}>
    <View style={[styles.timeIconWrapper, { backgroundColor: color + '20' }]}>
      <Icon name={icon} size={24} color={color} />
    </View>
    <Text style={styles.timeLabel}>{label}</Text>
    <Text style={styles.timeValue}>{value}</Text>
  </View>
));

const StatCard = memo(({ value, label, delay }) => (
  <SlideUp delay={delay} style={styles.statCard}>
    <View style={styles.statCardInner}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </SlideUp>
));

const HistoryItem = memo(({ date, subDate, timeRange, hours, index }) => (
  <SlideUp delay={400 + index * 80}>
    <View style={styles.historyItem}>
      <View style={styles.historyLeft}>
        <Text style={styles.historyDate}>{date}</Text>
        <Text style={styles.historySubDate}>{subDate}</Text>
      </View>
      <View style={styles.historyCenter}>
        <Text style={styles.historyTime}>{timeRange}</Text>
        <Text style={styles.historyHours}>{hours}</Text>
      </View>
      <View style={[styles.historyStatus, { backgroundColor: Colors.success + '20' }]}>
        <Icon name="check" size={16} color={Colors.success} />
      </View>
    </View>
  </SlideUp>
));

export default function AttendanceScreen() {
  const [attendanceStatus, setAttendanceStatus] = useState('not_checked_in');
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [todayHours, setTodayHours] = useState('0:00');
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState('checkin');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuth();
  const { api } = useApi();

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fabScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // FAB entrance animation
    Animated.spring(fabScale, {
      toValue: 1,
      friction: 6,
      tension: 100,
      delay: 600,
      useNativeDriver: true,
    }).start();

    // Pulse animation for FAB
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    
    return () => pulse.stop();
  }, []);

  const loadTodayAttendance = useCallback(async () => {
    try {
      console.log('Attendance API not implemented yet');
    } catch (error) {
      console.log('Error loading attendance:', error);
    }
  }, []);

  useEffect(() => {
    loadTodayAttendance();
  }, [loadTodayAttendance]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTodayAttendance();
    setRefreshing(false);
  }, [loadTodayAttendance]);

  const handleCheckIn = () => {
    setDialogType('checkin');
    setShowDialog(true);
  };

  const handleCheckOut = () => {
    setDialogType('checkout');
    setShowDialog(true);
  };

  const confirmAttendance = async () => {
    try {
      setLoading(true);
      const endpoint = dialogType === 'checkin' ? '/api/attendance/checkin' : '/api/attendance/checkout';
      
      const response = await api.post(endpoint, {
        userId: user.id,
        timestamp: new Date().toISOString()
      });

      if (response.data.success) {
        await loadTodayAttendance();
        Alert.alert(
          'Thành công',
          `${dialogType === 'checkin' ? 'Chấm công vào' : 'Chấm công ra'} thành công!`
        );
      }
    } catch (error) {
      Alert.alert('Loi', 'Khong the cham cong. Vui long thu lai.');
    } finally {
      setLoading(false);
      setShowDialog(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    return new Date(timeString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const historyData = [
    { date: 'Hôm qua', subDate: new Date(Date.now() - 86400000).toLocaleDateString('vi-VN'), timeRange: '08:30 - 17:30', hours: '8h 30m' },
    { date: '2 ngày trước', subDate: new Date(Date.now() - 172800000).toLocaleDateString('vi-VN'), timeRange: '08:15 - 17:45', hours: '9h 15m' },
    { date: '3 ngày trước', subDate: new Date(Date.now() - 259200000).toLocaleDateString('vi-VN'), timeRange: '08:00 - 17:30', hours: '9h 00m' },
  ];

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
        {/* Header Card */}
        <FadeIn>
          <ModernCard style={styles.headerCard} elevated>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>Trang thai hom nay</Text>
                <Text style={styles.headerDate}>
                  {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
              </View>
              <StatusBadge status={attendanceStatus} />
            </View>

            <View style={styles.timeRow}>
              <TimeCard 
                icon="login" 
                label="Vao lam" 
                value={formatTime(checkInTime)} 
                color={Colors.success} 
              />
              <TimeCard 
                icon="logout" 
                label="Ra ve" 
                value={formatTime(checkOutTime)} 
                color={Colors.error} 
              />
              <TimeCard 
                icon="clock-outline" 
                label="Tong gio" 
                value={todayHours} 
                color={Colors.primary} 
              />
            </View>
          </ModernCard>
        </FadeIn>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatCard value="22" label="Ngay lam viec" delay={200} />
          <StatCard value="176h" label="Tong gio thang" delay={280} />
        </View>

        {/* History Section */}
        <SlideUp delay={350}>
          <ModernCard style={styles.historyCard} elevated>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Lịch sử gần đây</Text>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </View>
            
            {historyData.map((item, index) => (
              <HistoryItem key={index} {...item} index={index} />
            ))}
          </ModernCard>
        </SlideUp>

        {/* Bottom spacing for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      {attendanceStatus !== 'checked_out' && (
        <Animated.View 
          style={[
            styles.fabContainer,
            { 
              transform: [
                { scale: Animated.multiply(fabScale, pulseAnim) }
              ] 
            }
          ]}
        >
          <ModernButton
            title={attendanceStatus === 'not_checked_in' ? 'Chấm công vào' : 'Chấm công ra'}
            icon={attendanceStatus === 'not_checked_in' ? 'login' : 'logout'}
            onPress={attendanceStatus === 'not_checked_in' ? handleCheckIn : handleCheckOut}
            variant={attendanceStatus === 'not_checked_in' ? 'primary' : 'secondary'}
            size="large"
            style={styles.fab}
          />
        </Animated.View>
      )}

      {/* Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>
            {dialogType === 'checkin' ? 'Xác nhận chấm công vào' : 'Xác nhận chấm công ra'}
          </Dialog.Title>
          <Dialog.Content>
            <View style={styles.dialogContent}>
              <View style={[styles.dialogIcon, { backgroundColor: dialogType === 'checkin' ? Colors.success + '20' : Colors.error + '20' }]}>
                <Icon 
                  name={dialogType === 'checkin' ? 'login' : 'logout'} 
                  size={40} 
                  color={dialogType === 'checkin' ? Colors.success : Colors.error} 
                />
              </View>
              <Text style={styles.dialogTime}>
                {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={styles.dialogText}>
                Ban co chac muon {dialogType === 'checkin' ? 'cham cong vao' : 'cham cong ra'} khong?
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button onPress={() => setShowDialog(false)} textColor={Colors.textSecondary}>
              Hủy
            </Button>
            <ModernButton 
              title="Xác nhận" 
              onPress={confirmAttendance} 
              loading={loading}
              size="small"
            />
          </Dialog.Actions>
        </Dialog>
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
  // Header Card
  headerCard: {
    marginBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  headerDate: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  // Time Cards
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeCard: {
    alignItems: 'center',
    flex: 1,
  },
  timeIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  timeLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  timeValue: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: 2,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statCardInner: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.primary,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // History
  historyCard: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  seeAll: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  historySubDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyCenter: {
    alignItems: 'center',
    flex: 1,
  },
  historyTime: {
    ...Typography.body,
    color: Colors.text,
  },
  historyHours: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.md,
    right: Spacing.md,
  },
  fab: {
    borderRadius: BorderRadius.lg,
  },
  // Dialog
  dialog: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
  },
  dialogTitle: {
    ...Typography.h3,
    textAlign: 'center',
  },
  dialogContent: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  dialogIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dialogTime: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  dialogText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  dialogActions: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
});
