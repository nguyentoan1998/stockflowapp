import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function SalesOrderDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { api } = useApi();
    const { orderId } = route.params;

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false });
    const Alert = createAlertHelper(setAlertConfig);

    useEffect(() => {
        fetchOrderDetail();
    }, [orderId]);

    const fetchOrderDetail = async () => {
        try {
            setLoading(true);
            const response = await api.get(
                `/api/sales_orders/${orderId}?include={"customers":true,"sales_order_items":{"include":{"products":true,"product_specifications":true}}}`
            );
            setOrder(response.data);
        } catch (error) {
            console.error('Error fetching order detail:', error);
            Alert.error('Lỗi', 'Không thể tải thông tin đơn hàng');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        if (order.status !== 'draft') {
            Alert.error('Không thể sửa', 'Chỉ có thể sửa đơn hàng ở trạng thái Nháp');
            return;
        }
        navigation.navigate('SalesOrderForm', { mode: 'edit', orderId: order.id });
    };

    const handleApprove = () => {
        console.log('🔵 handleApprove CALLED - START');
        console.log('🔵 Order status:', order.status);

        if (order.status !== 'draft') {
            Alert.error('Không thể xác nhận', 'Đơn hàng không ở trạng thái Nháp');
            return;
        }

        Alert.confirm(
            'Xác nhận đơn hàng',
            'Bạn có chắc chắn muốn xác nhận đơn hàng này? Sau khi xác nhận sẽ không thể chỉnh sửa.',
            async () => {
                console.log('🔵 User confirmed! Starting approval process...');
                try {
                    // 1. Update order status
                    console.log('🔵 Step 1: Updating order status to approved...');
                    await api.put(`/api/sales_orders/${order.id}`, {
                        status: 'approved',
                    });
                    console.log('✅ Order status updated successfully');

                    // 2. Trigger production automation
                    console.log('🏭 Step 2: Triggering production automation...');
                    try {
                        const automationResult = await api.post('/api/trigger-production-automation', {
                            salesOrderId: order.id,
                        });
                        console.log('✅ Production automation completed:', automationResult.data);
                    } catch (autoError) {
                        console.error('⚠️ Production automation failed (non-blocking):', autoError);
                        console.error('⚠️ Error details:', autoError.response?.data);
                        // Don't block order approval if automation fails
                    }

                    Alert.success('Thành công!', 'Đơn hàng đã được xác nhận');
                    await fetchOrderDetail();
                } catch (error) {
                    console.error('❌ Error approving order:', error);
                    Alert.error('Lỗi', 'Không thể xác nhận đơn hàng');
                }
            }
        );
    };

    const handleCancel = () => {
        if (order.status === 'completed') {
            Alert.error('Không thể hủy', 'Đơn hàng đã hoàn thành không thể hủy');
            return;
        }

        Alert.confirm(
            'Hủy đơn hàng',
            `Bạn có chắc chắn muốn hủy đơn hàng "${order.code}"? Hành động này không thể hoàn tác.`,
            async () => {
                try {
                    await api.delete(`/api/sales_orders/${order.id}`);
                    Alert.success('Thành công!', 'Đơn hàng đã được hủy (xóa)', () => {
                        navigation.goBack();
                    });
                } catch (error) {
                    console.error('Error cancelling order:', error);
                    Alert.error('Lỗi', 'Không thể hủy đơn hàng');
                }
            }
        );
    };

    const handleCreateDelivery = () => {
        if (order.status !== 'approved') {
            Alert.error('Không thể xuất hàng', 'Đơn hàng phải được xác nhận trước khi xuất hàng');
            return;
        }
        navigation.navigate('SalesDeliveryForm', { orderId: order.id });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { label: 'Nháp', color: '#6B7280', bgColor: '#F3F4F6' },
            approved: { label: 'Đã xác nhận', color: '#10B981', bgColor: '#D1FAE5' },
            completed: { label: 'Hoàn thành', color: '#059669', bgColor: '#A7F3D0' },
            cancelled: { label: 'Đã hủy', color: '#EF4444', bgColor: '#FEE2E2' },
        };

        const config = statusConfig[status] || statusConfig.draft;

        return (
            <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
                <Text style={[styles.statusBadgeText, { color: config.color }]}>
                    {config.label}
                </Text>
            </View>
        );
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>
            </View>
        );
    }

    const items = order.sales_order_items || [];

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Header Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.orderCode}>{order.code}</Text>
                        {getStatusBadge(order.status)}
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={16} color="#6B7280" />
                        <Text style={styles.infoLabel}>Ngày đặt:</Text>
                        <Text style={styles.infoValue}>{formatDate(order.order_date)}</Text>
                    </View>

                    {order.expected_delivery_date && (
                        <View style={styles.infoRow}>
                            <Ionicons name="time" size={16} color="#6B7280" />
                            <Text style={styles.infoLabel}>Dự kiến giao:</Text>
                            <Text style={styles.infoValue}>{formatDate(order.expected_delivery_date)}</Text>
                        </View>
                    )}
                </View>

                {/* Customer Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Khách hàng</Text>
                    <View style={styles.customerInfo}>
                        <Ionicons name="people" size={20} color="#10B981" />
                        <View style={styles.customerDetails}>
                            <Text style={styles.customerName}>{order.customers?.name || 'N/A'}</Text>
                            <Text style={styles.customerCode}>Mã: {order.customers?.code || 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                {/* Items Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Danh sách sản phẩm</Text>
                    {items.map((item, index) => (
                        <View key={item.id || index} style={styles.itemCard}>
                            <View style={styles.itemHeader}>
                                <Text style={styles.itemName}>{item.products?.name || 'N/A'}</Text>
                                {item.product_specifications && (
                                    <Text style={styles.itemSpec}>
                                        {item.product_specifications.spec_name}: {item.product_specifications.spec_value}
                                    </Text>
                                )}
                            </View>

                            <View style={styles.itemDetails}>
                                <View style={styles.itemDetailRow}>
                                    <Text style={styles.itemDetailLabel}>Số lượng:</Text>
                                    <Text style={styles.itemDetailValue}>
                                        {item.quantity}
                                    </Text>
                                </View>

                                <View style={styles.itemDetailRow}>
                                    <Text style={styles.itemDetailLabel}>Đơn giá:</Text>
                                    <Text style={styles.itemDetailValue}>
                                        {formatCurrency(item.unit_price)}
                                    </Text>
                                </View>

                                {item.discount_percentage > 0 && (
                                    <View style={styles.itemDetailRow}>
                                        <Text style={styles.itemDetailLabel}>Giảm giá:</Text>
                                        <Text style={styles.itemDetailValue}>
                                            {item.discount_percentage}%
                                        </Text>
                                    </View>
                                )}

                                {item.tax_percentage > 0 && (
                                    <View style={styles.itemDetailRow}>
                                        <Text style={styles.itemDetailLabel}>Thuế:</Text>
                                        <Text style={styles.itemDetailValue}>
                                            {item.tax_percentage}%
                                        </Text>
                                    </View>
                                )}

                                <View style={[styles.itemDetailRow, styles.itemTotalRow]}>
                                    <Text style={styles.itemTotalLabel}>Thành tiền:</Text>
                                    <Text style={styles.itemTotalValue}>
                                        {formatCurrency(item.total_amount)}
                                    </Text>
                                </View>

                                {item.delivered_quantity > 0 && (
                                    <View style={styles.deliveredInfo}>
                                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                        <Text style={styles.deliveredText}>
                                            Đã xuất: {item.delivered_quantity}/{item.quantity}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                {/* Summary Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Tổng cộng</Text>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tạm tính:</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(order.total_amount)}</Text>
                    </View>

                    {order.discount_amount > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Giảm giá:</Text>
                            <Text style={[styles.summaryValue, styles.discountValue]}>
                                -{formatCurrency(order.discount_amount)}
                            </Text>
                        </View>
                    )}

                    {order.tax_amount > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Thuế:</Text>
                            <Text style={styles.summaryValue}>
                                {formatCurrency(order.tax_amount)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Tổng tiền:</Text>
                        <Text style={styles.totalValue}>
                            {formatCurrency(order.final_amount)}
                        </Text>
                    </View>
                </View>

                {/* Notes Card */}
                {order.notes && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Ghi chú</Text>
                        <Text style={styles.notesText}>{order.notes}</Text>
                    </View>
                )}

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionBar}>
                {order.status === 'draft' && (
                    <>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.secondaryButton]}
                            onPress={handleEdit}
                        >
                            <Ionicons name="pencil" size={20} color="#10B981" />
                            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                                Sửa
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.primaryButton]}
                            onPress={handleApprove}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Xác nhận</Text>
                        </TouchableOpacity>
                    </>
                )}

                {order.status === 'approved' && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.primaryButton, { flex: 1 }]}
                        onPress={handleCreateDelivery}
                    >
                        <Ionicons name="cube" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Xuất hàng</Text>
                    </TouchableOpacity>
                )}

                {order.status !== 'completed' && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.dangerButton]}
                        onPress={handleCancel}
                    >
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Xóa đơn</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Alert */}
            <CustomAlert
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={alertConfig.onClose}
                onConfirm={alertConfig.onConfirm}
                onCancel={alertConfig.onCancel}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#EF4444',
    },
    scrollView: {
        flex: 1,
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    orderCode: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    infoValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    customerDetails: {
        flex: 1,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    customerCode: {
        fontSize: 13,
        color: '#6B7280',
    },
    itemCard: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    itemHeader: {
        marginBottom: 8,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    itemSpec: {
        fontSize: 13,
        color: '#6B7280',
    },
    itemDetails: {
        gap: 6,
    },
    itemDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    itemDetailLabel: {
        fontSize: 13,
        color: '#6B7280',
    },
    itemDetailValue: {
        fontSize: 13,
        color: '#111827',
        fontWeight: '500',
    },
    itemTotalRow: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    itemTotalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    itemTotalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#10B981',
    },
    deliveredInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    deliveredText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '500',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    summaryValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    discountValue: {
        color: '#EF4444',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10B981',
    },
    notesText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    bottomPadding: {
        height: 100,
    },
    actionBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 4,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 6,
    },
    primaryButton: {
        backgroundColor: '#10B981',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#10B981',
    },
    dangerButton: {
        backgroundColor: '#EF4444',
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    secondaryButtonText: {
        color: '#10B981',
    },
});
