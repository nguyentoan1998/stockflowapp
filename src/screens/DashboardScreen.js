import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../contexts/ApiContext';
import Card from '../components/ui/Card';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '../theme';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { api } = useApi();

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStaff: 0,
    lowStockItems: 0,
    pendingOrders: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch basic stats
      const [productsRes, staffRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/staff'),
      ]);

      setStats({
        totalProducts: Array.isArray(productsRes.data) ? productsRes.data.length : 0,
        totalStaff: Array.isArray(staffRes.data) ? staffRes.data.length : 0,
        lowStockItems: 0, // TODO: Implement low stock logic
        pendingOrders: 0, // TODO: Implement pending orders
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const quickActions = [
    {
      id: 'products',
      title: 'Sản phẩm',
      icon: 'cube',
      color: Colors.primary,
      gradient: Colors.gradients.primary,
      route: 'Products',
    },
    {
      id: 'inventory',
      title: 'Kho hàng',
      icon: 'archive',
      color: Colors.secondary,
      gradient: Colors.gradients.secondary,
      route: 'Warehouse',
    },
    {
      id: 'staff',
      title: 'Nhân viên',
      icon: 'people',
      color: Colors.accent,
      gradient: Colors.gradients.warm,
      route: 'Staff',
    },
    {
      id: 'reports',
      title: 'Báo cáo',
      icon: 'bar-chart',
      color: Colors.secondary,
      gradient: Colors.gradients.cool,
      route: 'Reports',
    },
  ];

  const statCards = [
    {
      id: 'products',
      title: 'Sản phẩm',
      value: stats.totalProducts,
      icon: 'cube-outline',
      color: Colors.primary,
      change: '+12%',
      changePositive: true,
    },
    {
      id: 'staff',
      title: 'Nhân viên',
      value: stats.totalStaff,
      icon: 'people-outline',
      color: Colors.secondary,
      change: '+5%',
      changePositive: true,
    },
    {
      id: 'lowstock',
      title: 'Hàng sắp hết',
      value: stats.lowStockItems,
      icon: 'alert-circle-outline',
      color: Colors.warning,
      change: '-3',
      changePositive: true,
    },
    {
      id: 'orders',
      title: 'Đơn chờ xử lý',
      value: stats.pendingOrders,
      icon: 'time-outline',
      color: Colors.info,
      change: '+8',
      changePositive: false,
    },
  ];

  const renderStatCard = (stat) => (
    <Card key={stat.id} style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
          <Ionicons name={stat.icon} size={24} color={stat.color} />
        </View>
        <View style={[styles.changeContainer, stat.changePositive ? styles.changePositive : styles.changeNegative]}>
          <Ionicons
            name={stat.changePositive ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={stat.changePositive ? Colors.success : Colors.error}
          />
          <Text style={[styles.changeText, stat.changePositive ? styles.changeTextPositive : styles.changeTextNegative]}>
            {stat.change}
          </Text>
        </View>
      </View>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statTitle}>{stat.title}</Text>
    </Card>
  );

  const renderQuickAction = (action) => (
    <TouchableOpacity
      key={action.id}
      style={styles.quickActionButton}
      onPress={() => navigation.navigate(action.route)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={action.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quickActionGradient}
      >
        <Ionicons name={action.icon} size={28} color={Colors.surface} />
      </LinearGradient>
      <Text style={styles.quickActionText}>{action.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradients.sunset}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.surface} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tổng quan</Text>
          <View style={styles.statsGrid}>
            {statCards.map(renderStatCard)}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          
          <Card style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: `${Colors.success}15` }]}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Nhập kho thành công</Text>
                <Text style={styles.activityTime}>5 phút trước</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: `${Colors.primary}15` }]}>
                <Ionicons name="cube" size={20} color={Colors.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Thêm sản phẩm mới</Text>
                <Text style={styles.activityTime}>1 giờ trước</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: `${Colors.secondary}15` }]}>
                <Ionicons name="person-add" size={20} color={Colors.secondary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Thêm nhân viên mới</Text>
                <Text style={styles.activityTime}>2 giờ trước</Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    ...Typography.body,
    color: Colors.surface,
    opacity: 0.9,
  },
  userName: {
    ...Typography.h2,
    color: Colors.surface,
    marginTop: Spacing.xs,
  },
  notificationButton: {
    position: 'relative',
    padding: Spacing.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    ...Typography.caption,
    color: Colors.text,
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: Spacing.lg,
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
    marginBottom: Spacing.md,
  },
  seeAllText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  statCard: {
    width: (width - Spacing.lg * 2 - Spacing.xs * 2) / 2,
    margin: Spacing.xs,
    padding: Spacing.md,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changePositive: {
    backgroundColor: `${Colors.success}15`,
  },
  changeNegative: {
    backgroundColor: `${Colors.error}15`,
  },
  changeText: {
    ...Typography.caption,
    marginLeft: 2,
    fontWeight: '600',
  },
  changeTextPositive: {
    color: Colors.success,
  },
  changeTextNegative: {
    color: Colors.error,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  statTitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  quickActionButton: {
    width: (width - Spacing.lg * 2 - Spacing.xs * 2) / 4,
    alignItems: 'center',
    margin: Spacing.xs,
  },
  quickActionGradient: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.md,
  },
  quickActionText: {
    ...Typography.caption,
    color: Colors.text,
    textAlign: 'center',
  },
  activityCard: {
    padding: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: 2,
  },
  activityTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
