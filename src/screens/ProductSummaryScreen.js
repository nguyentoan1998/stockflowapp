import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Animated, 
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { ModernCard } from '../components/ui/GradientCard';
import { FadeIn, SlideUp, Skeleton } from '../components/animations';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../theme';

const { width } = Dimensions.get('window');

// Memoized Product Card
const ProductCard = memo(({ name, sku, stock, status, color, delay }) => (
  <SlideUp delay={delay}>
    <View style={styles.productCard}>
      <View style={[styles.productIcon, { backgroundColor: color + '20' }]}>
        <Icon name="package-variant" size={24} color={color} />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{name}</Text>
        <Text style={styles.productSku}>SKU: {sku}</Text>
      </View>
      <View style={styles.productStock}>
        <Text style={[styles.stockValue, stock < 10 && { color: Colors.error }]}>
          {stock}
        </Text>
        <Text style={styles.stockLabel}>ton kho</Text>
      </View>
    </View>
  </SlideUp>
));

// Stats Summary Card
const StatsSummary = memo(({ icon, title, value, color, trend }) => (
  <View style={styles.statsItem}>
    <View style={[styles.statsIcon, { backgroundColor: color + '20' }]}>
      <Icon name={icon} size={24} color={color} />
    </View>
    <Text style={styles.statsValue}>{value}</Text>
    <Text style={styles.statsTitle}>{title}</Text>
    {trend && (
      <View style={[styles.trendBadge, { backgroundColor: trend > 0 ? Colors.success + '20' : Colors.error + '20' }]}>
        <Icon 
          name={trend > 0 ? 'trending-up' : 'trending-down'} 
          size={12} 
          color={trend > 0 ? Colors.success : Colors.error} 
        />
        <Text style={[styles.trendText, { color: trend > 0 ? Colors.success : Colors.error }]}>
          {Math.abs(trend)}%
        </Text>
      </View>
    )}
  </View>
));

export default function ProductSummaryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslate, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Simulate loading
    setTimeout(() => setLoading(false), 800);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    setTimeout(() => {
      setRefreshing(false);
      setLoading(false);
    }, 1000);
  }, []);

  // Sample data
  const statsData = [
    { icon: 'package-variant-closed', title: 'Tong SP', value: '245', color: Colors.primary, trend: 12 },
    { icon: 'alert-outline', title: 'Sap het', value: '18', color: Colors.warning, trend: -5 },
    { icon: 'close-circle-outline', title: 'Het hang', value: '3', color: Colors.error },
    { icon: 'check-circle-outline', title: 'Du hang', value: '224', color: Colors.success, trend: 8 },
  ];

  const recentProducts = [
    { name: 'Thep tam SS400', sku: 'TT-001', stock: 156, status: 'in_stock', color: Colors.primary },
    { name: 'Ong thep D50', sku: 'OT-002', stock: 8, status: 'low_stock', color: Colors.warning },
    { name: 'Inox 304 tam', sku: 'IN-003', stock: 0, status: 'out_of_stock', color: Colors.error },
    { name: 'Nhom tam 5mm', sku: 'NH-004', stock: 42, status: 'in_stock', color: Colors.success },
    { name: 'Dong la 0.5mm', sku: 'DL-005', stock: 23, status: 'in_stock', color: Colors.accent },
  ];

  const renderSkeletons = () => (
    <>
      <Skeleton width="100%" height={120} style={{ marginBottom: Spacing.md }} borderRadius={BorderRadius.lg} />
      <Skeleton width="100%" height={80} style={{ marginBottom: Spacing.sm }} borderRadius={BorderRadius.md} />
      <Skeleton width="100%" height={80} style={{ marginBottom: Spacing.sm }} borderRadius={BorderRadius.md} />
      <Skeleton width="100%" height={80} style={{ marginBottom: Spacing.sm }} borderRadius={BorderRadius.md} />
    </>
  );

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
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslate }],
            }
          ]}
        >
          <Text style={styles.headerTitle}>Tổng Hợp Sản Phẩm</Text>
          <Text style={styles.headerSubtitle}>Cập nhật: {new Date().toLocaleTimeString('vi-VN')}</Text>
        </Animated.View>

        {loading ? renderSkeletons() : (
          <>
            {/* Stats Overview */}
            <FadeIn>
              <ModernCard style={styles.statsCard} elevated>
                <View style={styles.statsGrid}>
                  {statsData.map((stat, index) => (
                    <StatsSummary key={index} {...stat} />
                  ))}
                </View>
              </ModernCard>
            </FadeIn>

            {/* Quick Actions */}
            <SlideUp delay={100}>
              <View style={styles.actionsRow}>
                <ActionButton icon="barcode-scan" label="Quét mã" color={Colors.primary} />
                <ActionButton icon="plus-circle" label="Thêm mới" color={Colors.success} />
                <ActionButton icon="file-export" label="Xuất file" color={Colors.accent} />
                <ActionButton icon="filter" label="Lọc" color={Colors.secondary} />
              </View>
            </SlideUp>

            {/* Recent Products */}
            <SlideUp delay={200}>
              <ModernCard style={styles.productsCard} elevated>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Sản phẩm gần đây</Text>
                  <Text style={styles.seeAll}>Xem tất cả</Text>
                </View>
                
                {recentProducts.map((product, index) => (
                  <ProductCard key={index} {...product} delay={300 + index * 60} />
                ))}
              </ModernCard>
            </SlideUp>

            {/* Charts Placeholder */}
            <SlideUp delay={400}>
              <ModernCard style={styles.chartCard} elevated>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Bieu do ton kho</Text>
                </View>
                <View style={styles.chartPlaceholder}>
                  <Icon name="chart-bar" size={48} color={Colors.textLight} />
                  <Text style={styles.placeholderText}>Bieu do dang phat trien</Text>
                </View>
              </ModernCard>
            </SlideUp>
          </>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Action Button Component
const ActionButton = memo(({ icon, label, color }) => (
  <View style={styles.actionButton}>
    <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
      <Icon name={icon} size={22} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </View>
));

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
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Stats Card
  statsCard: {
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsItem: {
    width: '48%',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  statsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statsValue: {
    ...Typography.h2,
    color: Colors.text,
  },
  statsTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 4,
    gap: 2,
  },
  trendText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  // Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  actionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  // Products Card
  productsCard: {
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
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  productSku: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  productStock: {
    alignItems: 'flex-end',
  },
  stockValue: {
    ...Typography.h3,
    color: Colors.text,
  },
  stockLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  // Chart Card
  chartCard: {
    marginBottom: Spacing.md,
  },
  chartPlaceholder: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
  },
  placeholderText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});
