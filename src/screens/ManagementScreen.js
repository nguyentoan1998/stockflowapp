import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '../theme';

const { width } = Dimensions.get('window');

export default function ManagementScreen() {
  const navigation = useNavigation();

  const managementGroups = [
    {
      title: 'Danh mục',
      icon: 'list',
      items: [
        { id: 'products', name: 'Sản phẩm', icon: 'cube', color: '#4A90E2', route: 'Products' },
        { id: 'customers', name: 'Khách hàng', icon: 'person', color: '#E74C3C', route: 'Customers' },
        { id: 'suppliers', name: 'Nhà cung cấp', icon: 'business', color: '#3498DB', route: 'Suppliers' },
        { id: 'units', name: 'Đơn vị tính', icon: 'fitness', color: '#9B59B6', route: 'Units' },
        { id: 'warehouses', name: 'Kho', icon: 'archive', color: '#F39C12', route: 'Warehouses' },
        { id: 'product-category', name: 'Loại sản phẩm', icon: 'pricetags', color: '#16A085', route: 'ProductCategory' },
        { id: 'staff', name: 'Nhân viên', icon: 'people', color: '#2ECC71', route: 'Staff' },
        { id: 'positions', name: 'Chức vụ', icon: 'ribbon', color: '#E67E22', route: 'Positions' },
        { id: 'teams', name: 'Phòng ban', icon: 'git-branch', color: '#1ABC9C', route: 'Teams' },
      ],
    },
    {
      title: 'Quỹ',
      icon: 'wallet',
      items: [
        { id: 'expense', name: 'Chi', icon: 'remove-circle', color: '#E74C3C', route: 'Expense' },
        { id: 'income', name: 'Thu', icon: 'add-circle', color: '#27AE60', route: 'Income' },
        { id: 'fund-report', name: 'Báo cáo', icon: 'stats-chart', color: '#3498DB', route: 'FundReport' },
      ],
    },
    {
      title: 'Mua hàng',
      icon: 'cart',
      items: [
        { id: 'purchase-orders', name: 'Đơn mua hàng', icon: 'document-text', color: '#5B9BF3', route: 'PurchaseOrders' },
        { id: 'purchasing', name: 'Mua hàng', icon: 'bag-handle', color: '#8E44AD', route: 'Purchasing' },
        { id: 'purchase-return', name: 'Trả hàng mua', icon: 'return-down-back', color: '#E85D75', route: 'ReturnError' },
        { id: 'payable', name: 'Công nợ phải trả', icon: 'card', color: '#C0392B', route: 'AccountsPayable' },
        { id: 'purchase-report', name: 'Báo cáo', icon: 'pie-chart', color: '#2980B9', route: 'Report' },
      ],
    },
    {
      title: 'Bán hàng',
      icon: 'storefront',
      items: [
        { id: 'sales-orders', name: 'Đơn đặt hàng', icon: 'clipboard', color: '#E67E22', route: 'SalesOrders' },
        { id: 'sales', name: 'Bán hàng', icon: 'cart', color: '#27AE60', route: 'Sales' },
        { id: 'warranty', name: 'Hàng bảo hành', icon: 'shield-checkmark', color: '#3498DB', route: 'Warranty' },
        { id: 'receivable', name: 'Công nợ phải thu', icon: 'cash', color: '#16A085', route: 'AccountsReceivable' },
        { id: 'sales-report', name: 'Báo cáo', icon: 'bar-chart', color: '#9B59B6', route: 'SalesReport' },
      ],
    },
    {
      title: 'Nghiệp vụ kho',
      icon: 'archive',
      items: [
        { id: 'inventory', name: 'Tồn kho', icon: 'layers', color: '#27AE60', route: 'Inventory' },
        { id: 'input', name: 'Nhập kho', icon: 'arrow-down-circle', color: '#3498DB', route: 'Input' },
        { id: 'output', name: 'Xuất kho', icon: 'arrow-up-circle', color: '#E85D75', route: 'Output' },
        { id: 'transfer', name: 'Chuyển kho', icon: 'swap-horizontal', color: '#9B59B6', route: 'Transfer' },
        { id: 'check', name: 'Kiểm kê', icon: 'checkmark-done', color: '#16A085', route: 'InventoryCheck' },
        { id: 'adjustment', name: 'Điều chỉnh', icon: 'build', color: '#F39C12', route: 'Adjustment' },
      ],
    },
    {
      title: 'Sản xuất',
      icon: 'construct',
      items: [
        { id: 'production-order', name: 'Lệnh sản xuất', icon: 'document', color: '#8E44AD', route: 'ProductionOrder' },
        { id: 'production-plan', name: 'Kế hoạch SX', icon: 'calendar', color: '#3498DB', route: 'ProductionPlan' },
        { id: 'material-request', name: 'Yêu cầu vật tư', icon: 'list', color: '#E67E22', route: 'MaterialRequest' },
        { id: 'production-report', name: 'Báo cáo SX', icon: 'stats-chart', color: '#27AE60', route: 'ProductionReport' },
      ],
    },
    {
      title: 'Lương',
      icon: 'cash',
      items: [
        { id: 'attendance', name: 'Chấm công', icon: 'time', color: '#3498DB', route: 'Attendance' },
        { id: 'product-summary', name: 'Tổng hợp SP', icon: 'cube', color: '#27AE60', route: 'ProductSummary' },
        { id: 'team-summary', name: 'Tổng hợp SP tổ', icon: 'people', color: '#1ABC9C', route: 'TeamSummary' },
        { id: 'salary', name: 'Tính lương', icon: 'calculator', color: '#E67E22', route: 'Salary' },
        { id: 'insurance', name: 'Bảo hiểm', icon: 'shield', color: '#9B59B6', route: 'Insurance' },
        { id: 'salary-report', name: 'Báo cáo', icon: 'document-text', color: '#2980B9', route: 'SalaryReport' },
      ],
    },
    {
      title: 'Hệ thống',
      icon: 'settings',
      items: [
        { id: 'users', name: 'Người dùng', icon: 'person-circle', color: '#34495E', route: 'Users' },
        { id: 'roles', name: 'Phân quyền', icon: 'shield-checkmark', color: '#7F8C8D', route: 'Roles' },
        { id: 'backup', name: 'Sao lưu', icon: 'cloud-download', color: '#3498DB', route: 'Backup' },
      ],
    },
  ];

  const renderCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.card}
      onPress={() => navigation.navigate(item.route)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[item.color, `${item.color}DD`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        <Ionicons name={item.icon} size={32} color={Colors.surface} />
      </LinearGradient>
      <Text style={styles.cardText} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderGroup = (group) => (
    <View key={group.title} style={styles.group}>
      <View style={styles.groupHeader}>
        <Ionicons name={group.icon} size={20} color={Colors.primary} />
        <Text style={styles.groupTitle}>{group.title}</Text>
        <View style={styles.groupLine} />
      </View>
      <View style={styles.grid}>
        {group.items.map(renderCard)}
      </View>
    </View>
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
        <Text style={styles.headerTitle}>Quản lý</Text>
        <Text style={styles.headerSubtitle}>Tổng quan chức năng hệ thống</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {managementGroups.map(renderGroup)}
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
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.surface,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.surface,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  group: {
    marginBottom: Spacing.xl,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  groupTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  groupLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  card: {
    width: (width - Spacing.lg * 2 - Spacing.xs * 4) / 2,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    margin: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    ...Shadows.card,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
});
