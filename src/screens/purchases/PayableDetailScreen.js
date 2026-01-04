import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function PayableDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { api } = useApi();
    const { supplierId } = route.params;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [supplier, setSupplier] = useState(null);
    const [purchases, setPurchases] = useState([]);
    const [payments, setPayments] = useState([]);
    const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' or 'payments'

    const [alertConfig, setAlertConfig] = useState({ visible: false });
    const Alert = createAlertHelper(setAlertConfig);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [supplierId])
    );

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch supplier info
            const supplierRes = await api.get(`/api/suppliers/${supplierId}`);
            setSupplier(supplierRes.data);

            // Fetch purchases
            const purchasesRes = await api.get(`/api/purchase_receives?where={\"supplier_id\":${supplierId}}&orderBy=[{\"receive_date\":\"desc\"}]`);
            setPurchases(Array.isArray(purchasesRes.data) ? purchasesRes.data : (purchasesRes.data?.data || []));

            // Fetch payments history
            const paymentsRes = await api.get(`/api/payments?where={"supplier_id":${supplierId}}&orderBy=[{"payment_date":"desc"}]`);
            setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data?.data || []));

        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.error('Lỗi', 'Không thể tải thông tin chi tiết');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handlePayment = () => {
        navigation.navigate('PaymentForm', { supplierId, supplierName: supplier?.name });
    };

    const formatCurrency = (amount) => {
        if (!amount) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const totalPurchases = purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const balance = totalPurchases - totalPayments;

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#EF4444" />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EF4444']} />
                }
            >
                {/* Supplier Header */}
                <View style={styles.header}>
                    <LinearGradient
                        colors={['#EF4444', '#DC2626']}
                        style={styles.headerGradient}
                    >
                        <View style={styles.supplierIcon}>
                            <Ionicons name="business" size={32} color="#fff" />
                        </View>
                        <Text style={styles.supplierName}>{supplier?.name || 'N/A'}</Text>
                        {supplier?.code && (
                            <Text style={styles.supplierCode}>{supplier.code}</Text>
                        )}
                    </LinearGradient>
                </View>

                {/* Balance Summary */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <Ionicons name="alert-circle" size={20} color="#EF4444" />
                            <Text style={styles.summaryTitle}>Công Nợ Hiện Tại</Text>
                        </View>
                        <Text style={styles.summaryAmount}>{formatCurrency(balance)}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Ionicons name="cart" size={18} color="#6B7280" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.summaryLabel}>Tổng Mua</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(totalPurchases)}</Text>
                            </View>
                        </View>
                        <View style={styles.summaryItem}>
                            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.summaryLabel}>Đã Trả</Text>
                                <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                                    {formatCurrency(totalPayments)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'purchases' && styles.tabActive]}
                        onPress={() => setActiveTab('purchases')}
                    >
                        <Ionicons name="cart" size={20} color={activeTab === 'purchases' ? '#3B82F6' : '#6B7280'} />
                        <Text style={[styles.tabText, activeTab === 'purchases' && styles.tabTextActive]}>
                            Mua Hàng ({purchases.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'payments' && styles.tabActive]}
                        onPress={() => setActiveTab('payments')}
                    >
                        <Ionicons name="cash" size={20} color={activeTab === 'payments' ? '#3B82F6' : '#6B7280'} />
                        <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
                            Thanh Toán ({payments.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Content */}
                <View style={styles.content}>
                    {activeTab === 'purchases' ? (
                        purchases.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="cart-outline" size={48} color="#D1D5DB" />
                                <Text style={styles.emptyText}>Chưa có giao dịch mua hàng</Text>
                            </View>
                        ) : (
                            purchases.map((purchase, index) => (
                                <View key={index} style={styles.transactionCard}>
                                    <View style={styles.transactionHeader}>
                                        <View style={styles.transactionIcon}>
                                            <Ionicons name="cart" size={20} color="#3B82F6" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.transactionTitle}>Phiếu nhập #{purchase.id}</Text>
                                            <Text style={styles.transactionDate}>{formatDate(purchase.receive_date)}</Text>
                                        </View>
                                        <Text style={styles.transactionAmount}>{formatCurrency(purchase.total_amount)}</Text>
                                    </View>
                                    {purchase.notes && (
                                        <Text style={styles.transactionNotes}>{purchase.notes}</Text>
                                    )}
                                </View>
                            ))
                        )
                    ) : (
                        payments.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="cash-outline" size={48} color="#D1D5DB" />
                                <Text style={styles.emptyText}>Chưa có thanh toán</Text>
                            </View>
                        ) : (
                            payments.map((payment, index) => (
                                <View key={index} style={styles.transactionCard}>
                                    <View style={styles.transactionHeader}>
                                        <View style={[styles.transactionIcon, { backgroundColor: '#D1FAE5' }]}>
                                            <Ionicons name="cash" size={20} color="#10B981" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.transactionTitle}>Thanh toán</Text>
                                            <Text style={styles.transactionDate}>{formatDate(payment.payment_date)}</Text>
                                            {payment.payment_method && (
                                                <Text style={styles.transactionMethod}>{payment.payment_method}</Text>
                                            )}
                                        </View>
                                        <Text style={[styles.transactionAmount, { color: '#10B981' }]}>
                                            -{formatCurrency(payment.amount)}
                                        </Text>
                                    </View>
                                    {payment.notes && (
                                        <Text style={styles.transactionNotes}>{payment.notes}</Text>
                                    )}
                                </View>
                            ))
                        )
                    )}
                </View>
            </ScrollView>

            {/* Payment Button */}
            {balance > 0 && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.paymentButtonGradient}
                        >
                            <Ionicons name="cash" size={22} color="#fff" />
                            <Text style={styles.paymentButtonText}>Thanh Toán</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

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
    header: {
        marginBottom: 16,
        overflow: 'hidden',
    },
    headerGradient: {
        paddingTop: 40,
        paddingBottom: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    supplierIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    supplierName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    supplierCode: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    summaryContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    summaryCard: {
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        marginBottom: 12,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    summaryTitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    summaryAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#EF4444',
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 12,
    },
    summaryItem: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 8,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tabActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    tabTextActive: {
        color: '#3B82F6',
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    transactionCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 12,
    },
    transactionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    transactionDate: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    transactionMethod: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    transactionNotes: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 8,
        fontStyle: 'italic',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#9CA3AF',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    paymentButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    paymentButtonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    paymentButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        letterSpacing: 0.3,
    },
});
