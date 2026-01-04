import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

const { width } = Dimensions.get('window');

export default function PurchaseReportsScreen() {
    const { api } = useApi();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reportData, setReportData] = useState({
        overview: {
            totalOrders: 0,
            totalPurchases: 0,
            totalReturns: 0,
            totalValue: 0,
        },
        suppliers: [],
        products: [],
    });
    const [dateRange, setDateRange] = useState('month'); // 'week', 'month', 'quarter', 'year'

    const [alertConfig, setAlertConfig] = useState({ visible: false });
    const Alert = createAlertHelper(setAlertConfig);

    useFocusEffect(
        useCallback(() => {
            fetchReports();
        }, [dateRange])
    );

    const fetchReports = async () => {
        try {
            setLoading(true);

            // TODO: Replace with real API endpoints when available
            // For now, using mock data

            // Fetch purchase orders
            const ordersRes = await api.get('/api/purchase_orders');
            const orders = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.data || []);

            // Fetch purchase receives  
            const purchasesRes = await api.get('/api/purchase_receives');
            const purchases = Array.isArray(purchasesRes.data) ? purchasesRes.data : (purchasesRes.data?.data || []);

            // Calculate overview
            const totalValue = purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);

            setReportData({
                overview: {
                    totalOrders: orders.length,
                    totalPurchases: purchases.length,
                    totalReturns: 0, // TODO: Get from return_purchases
                    totalValue,
                },
                suppliers: [], // TODO: Group by supplier
                products: [],  // TODO: Group by product
            });

        } catch (error) {
            console.error('Error fetching reports:', error);
            Alert.error('Lỗi', 'Không thể tải báo cáo');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchReports();
        setRefreshing(false);
    };

    const formatCurrency = (amount) => {
        if (!amount) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const DateRangeButton = ({ range, label }) => (
        <TouchableOpacity
            style={[
                styles.dateRangeButton,
                dateRange === range && styles.dateRangeButtonActive,
            ]}
            onPress={() => setDateRange(range)}
        >
            <Text
                style={[
                    styles.dateRangeText,
                    dateRange === range && styles.dateRangeTextActive,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Đang tải báo cáo...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
                }
            >
                {/* Date Range Filter */}
                <View style={styles.filterContainer}>
                    <DateRangeButton range="week" label="Tuần" />
                    <DateRangeButton range="month" label="Tháng" />
                    <DateRangeButton range="quarter" label="Quý" />
                    <DateRangeButton range="year" label="Năm" />
                </View>

                {/* Overview Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tổng Quan</Text>

                    <View style={styles.statsGrid}>
                        {/* Total Value */}
                        <View style={[styles.statCard, styles.statCardLarge]}>
                            <LinearGradient
                                colors={['#3B82F6', '#2563EB']}
                                style={styles.statGradient}
                            >
                                <Ionicons name="cash" size={32} color="#fff" />
                                <Text style={styles.statLabel}>Tổng Giá Trị Mua</Text>
                                <Text style={styles.statValue}>{formatCurrency(reportData.overview.totalValue)}</Text>
                            </LinearGradient>
                        </View>

                        {/* Total Orders */}
                        <View style={styles.statCard}>
                            <View style={styles.statContent}>
                                <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                                    <Ionicons name="document-text" size={24} color="#3B82F6" />
                                </View>
                                <Text style={styles.statNumber}>{reportData.overview.totalOrders}</Text>
                                <Text style={styles.statTitle}>Đơn Đặt Hàng</Text>
                            </View>
                        </View>

                        {/* Total Purchases */}
                        <View style={styles.statCard}>
                            <View style={styles.statContent}>
                                <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                                    <Ionicons name="cart" size={24} color="#10B981" />
                                </View>
                                <Text style={styles.statNumber}>{reportData.overview.totalPurchases}</Text>
                                <Text style={styles.statTitle}>Phiếu Nhập</Text>
                            </View>
                        </View>

                        {/* Total Returns */}
                        <View style={styles.statCard}>
                            <View style={styles.statContent}>
                                <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
                                    <Ionicons name="return-up-back" size={24} color="#EF4444" />
                                </View>
                                <Text style={styles.statNumber}>{reportData.overview.totalReturns}</Text>
                                <Text style={styles.statTitle}>Phiếu Trả</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Top Suppliers */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Nhà Cung Cấp Hàng Đầu</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>

                    {reportData.suppliers.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="business-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>Chưa có dữ liệu nhà cung cấp</Text>
                        </View>
                    ) : (
                        reportData.suppliers.slice(0, 5).map((supplier, index) => (
                            <View key={index} style={styles.rankCard}>
                                <View style={styles.rankBadge}>
                                    <Text style={styles.rankText}>#{index + 1}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.rankName}>{supplier.name}</Text>
                                    <Text style={styles.rankSubtext}>{supplier.count} đơn hàng</Text>
                                </View>
                                <Text style={styles.rankValue}>{formatCurrency(supplier.value)}</Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Top Products */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Sản Phẩm Mua Nhiều</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>

                    {reportData.products.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>Chưa có dữ liệu sản phẩm</Text>
                        </View>
                    ) : (
                        reportData.products.slice(0, 5).map((product, index) => (
                            <View key={index} style={styles.rankCard}>
                                <View style={styles.rankBadge}>
                                    <Text style={styles.rankText}>#{index + 1}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.rankName}>{product.name}</Text>
                                    <Text style={styles.rankSubtext}>{product.quantity} đơn vị</Text>
                                </View>
                                <Text style={styles.rankValue}>{formatCurrency(product.value)}</Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Info Note */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text style={styles.infoText}>
                        Báo cáo chi tiết với biểu đồ xu hướng sẽ được cập nhật sau khi API backend hoàn thành.
                    </Text>
                </View>
            </ScrollView>

            {/* Alert */}
            <CustomAlert
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onConfirm={alertConfig.onConfirm}
                onCancel={alertConfig.onCancel}
                onClose={alertConfig.onClose}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    dateRangeButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    dateRangeButtonActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    dateRangeText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
    },
    dateRangeTextActive: {
        color: '#fff',
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    seeAllText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '500',
    },
    statsGrid: {
        gap: 12,
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    statCardLarge: {
        marginBottom: 4,
    },
    statGradient: {
        padding: 20,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 14,
        color: '#fff',
        marginTop: 12,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    statContent: {
        padding: 16,
        alignItems: 'center',
    },
    statIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 13,
        color: '#6B7280',
    },
    rankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 12,
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3B82F6',
    },
    rankName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    rankSubtext: {
        fontSize: 12,
        color: '#6B7280',
    },
    rankValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111827',
    },
    emptyCard: {
        backgroundColor: '#fff',
        padding: 40,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#9CA3AF',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        marginHorizontal: 16,
        marginBottom: 24,
        padding: 16,
        borderRadius: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#1E40AF',
        lineHeight: 18,
    },
});
