import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TextInput as RNTextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function SalesOrdersScreen() {
    const navigation = useNavigation();
    const { api } = useApi();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, draft, approved, completed, cancelled

    const [alertConfig, setAlertConfig] = useState({ visible: false });
    const Alert = createAlertHelper(setAlertConfig);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/sales_orders?include={"customers":{"select":{"name":true,"code":true}}}&orderBy=[{"order_date":"desc"}]');

            let ordersData = Array.isArray(response.data)
                ? response.data
                : (response.data?.data || []);

            setOrders(ordersData);
        } catch (error) {
            console.error('Error fetching sales orders:', error);
            Alert.error('Lỗi', 'Không thể tải danh sách đơn hàng bán');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    };

    const handleCreate = () => {
        navigation.navigate('SalesOrderForm', { mode: 'create' });
    };

    const handleView = (order) => {
        navigation.navigate('SalesOrderDetail', { orderId: order.id });
    };

    const handleEdit = (order) => {
        if (order.status !== 'draft') {
            Alert.error('Không thể sửa', 'Chỉ có thể sửa đơn hàng ở trạng thái Nháp');
            return;
        }
        navigation.navigate('SalesOrderForm', { mode: 'edit', orderId: order.id });
    };

    const handleDelete = (order) => {
        if (order.status !== 'draft') {
            Alert.error('Không thể xóa', 'Chỉ có thể xóa đơn hàng ở trạng thái Nháp');
            return;
        }

        Alert.confirm(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa đơn hàng "${order.code}" không?`,
            async () => {
                try {
                    await api.delete(`/api/sales_orders/${order.id}`);
                    Alert.success('Thành công!', 'Đơn hàng đã được xóa');
                    await fetchOrders();
                } catch (error) {
                    console.error('Error deleting order:', error);
                    Alert.error('Lỗi', 'Không thể xóa đơn hàng');
                }
            }
        );
    };

    const getFilteredOrders = () => {
        let filtered = orders.filter(order => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = (
                order.code?.toLowerCase().includes(searchLower) ||
                order.customers?.name?.toLowerCase().includes(searchLower) ||
                order.notes?.toLowerCase().includes(searchLower)
            );

            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        return filtered;
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

    const handleUpdateStatus = (order, newStatus) => {
        const statusLabels = {
            draft: 'chuyển về nháp',
            approved: 'xác nhận',
            cancelled: 'hủy',
        };

        const statusMessages = {
            draft: 'chuyển về nháp',
            approved: 'xác nhận',
            cancelled: 'hủy',
        };

        Alert.confirm(
            'Cập nhật trạng thái',
            `Bạn có chắc chắn muốn ${statusLabels[newStatus]} đơn hàng "${order.code}"?`,
            async () => {
                try {
                    await api.put(`/api/sales_orders/${order.id}`, {
                        status: newStatus,
                    });
                    Alert.success('Thành công!', `Đơn hàng đã được ${statusMessages[newStatus]}`);
                    await fetchOrders();
                } catch (error) {
                    console.error('Error updating status:', error);
                    Alert.error('Lỗi', 'Không thể cập nhật trạng thái');
                }
            }
        );
    };

    const renderOrderCard = ({ item: order }) => (
        <View style={styles.card}>
            <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.cardGradient}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <Text style={styles.cardCode}>{order.code}</Text>
                        {getStatusBadge(order.status)}
                    </View>
                    <View style={styles.cardActions}>
                        {/* View Button */}
                        <TouchableOpacity
                            onPress={(e) => {
                                e?.stopPropagation?.();
                                handleView(order);
                            }}
                            style={styles.iconButton}
                            activeOpacity={0.6}
                        >
                            <Ionicons name="eye-outline" size={20} color="#10B981" />
                        </TouchableOpacity>

                        {/* Edit Button - Only for draft */}
                        {order.status === 'draft' && (
                            <TouchableOpacity
                                onPress={(e) => {
                                    e?.stopPropagation?.();
                                    handleEdit(order);
                                }}
                                style={styles.iconButton}
                                activeOpacity={0.6}
                            >
                                <Ionicons name="pencil" size={20} color="#10B981" />
                            </TouchableOpacity>
                        )}

                        {/* Delete Button - Only for draft */}
                        {order.status === 'draft' && (
                            <TouchableOpacity
                                onPress={(e) => {
                                    e?.stopPropagation?.();
                                    handleDelete(order);
                                }}
                                style={styles.iconButton}
                                activeOpacity={0.6}
                            >
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Customer Info */}
                <View style={styles.cardRow}>
                    <Ionicons name="people" size={16} color="#6B7280" />
                    <Text style={styles.cardLabel}>Khách hàng:</Text>
                    <Text style={styles.cardValue}>{order.customers?.name || 'N/A'}</Text>
                </View>

                {/* Order Date */}
                <View style={styles.cardRow}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.cardLabel}>Ngày đặt:</Text>
                    <Text style={styles.cardValue}>{formatDate(order.order_date)}</Text>
                </View>

                {/* Expected Delivery Date */}
                {order.expected_delivery_date && (
                    <View style={styles.cardRow}>
                        <Ionicons name="time" size={16} color="#6B7280" />
                        <Text style={styles.cardLabel}>Dự kiến giao:</Text>
                        <Text style={styles.cardValue}>{formatDate(order.expected_delivery_date)}</Text>
                    </View>
                )}

                {/* Total Amount */}
                <View style={[styles.cardRow, styles.cardTotalRow]}>
                    <Ionicons name="cash" size={16} color="#10B981" />
                    <Text style={styles.cardLabel}>Tổng tiền:</Text>
                    <Text style={styles.cardTotalAmount}>{formatCurrency(order.final_amount)}</Text>
                </View>

                {/* Notes */}
                {order.notes && (
                    <View style={styles.cardNotes}>
                        <Text style={styles.cardNotesText} numberOfLines={2}>
                            {order.notes}
                        </Text>
                    </View>
                )}

                {/* Status Action Buttons */}
                {order.status === 'draft' && (
                    <View style={styles.cardActionButtons}>
                        <TouchableOpacity
                            style={[styles.cardActionButton, styles.confirmButton]}
                            onPress={(e) => {
                                e?.stopPropagation?.();
                                handleUpdateStatus(order, 'approved');
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                            <Text style={[styles.cardActionButtonText, styles.confirmButtonText]}>
                                Xác nhận đơn hàng
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {order.status === 'approved' && (
                    <View style={styles.cardActionButtons}>
                        <TouchableOpacity
                            style={[styles.cardActionButton, styles.draftButton]}
                            onPress={(e) => {
                                e?.stopPropagation?.();
                                handleUpdateStatus(order, 'draft');
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="create-outline" size={16} color="#6B7280" />
                            <Text style={[styles.cardActionButtonText, styles.draftButtonText]}>
                                Chuyển về nháp
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Completed status */}
                {order.status === 'completed' && (
                    <View style={styles.completedInfo}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.completedInfoText}>
                            Đơn hàng đã hoàn thành - Tự động cập nhật sau khi xuất hàng
                        </Text>
                    </View>
                )}
            </LinearGradient>
        </View>
    );

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Chưa có đơn hàng bán</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreate}>
                <Text style={styles.emptyButtonText}>Tạo đơn hàng đầu tiên</Text>
            </TouchableOpacity>
        </View>
    );

    const StatusFilterButton = ({ status, label }) => (
        <TouchableOpacity
            style={[
                styles.filterButton,
                statusFilter === status && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter(status)}
        >
            <Text
                style={[
                    styles.filterButtonText,
                    statusFilter === status && styles.filterButtonTextActive,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    const filteredOrders = getFilteredOrders();

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <RNTextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm theo mã đơn, khách hàng..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#9CA3AF"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Status Filters */}
            <View style={styles.filtersContainer}>
                <StatusFilterButton status="all" label="Tất cả" />
                <StatusFilterButton status="draft" label="Nháp" />
                <StatusFilterButton status="approved" label="Đã xác nhận" />
                <StatusFilterButton status="completed" label="Hoàn thành" />
            </View>

            {/* Summary Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{filteredOrders.length}</Text>
                    <Text style={styles.statLabel}>Đơn hàng</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                        {formatCurrency(
                            filteredOrders.reduce((sum, order) => sum + (order.final_amount || 0), 0)
                        )}
                    </Text>
                    <Text style={styles.statLabel}>Tổng giá trị</Text>
                </View>
            </View>

            {/* Orders List */}
            <FlatList
                data={filteredOrders}
                renderItem={renderOrderCard}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={renderEmptyList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#10B981']}
                    />
                }
            />

            {/* FAB - Create Button */}
            <TouchableOpacity style={styles.fab} onPress={handleCreate}>
                <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>

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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
    },
    filtersContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    filterButtonActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    filterButtonText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    filterButtonTextActive: {
        color: '#fff',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardGradient: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    cardCode: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    cardLabel: {
        fontSize: 13,
        color: '#6B7280',
    },
    cardValue: {
        fontSize: 13,
        color: '#111827',
        fontWeight: '500',
        flex: 1,
    },
    cardTotalRow: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    cardTotalAmount: {
        fontSize: 16,
        color: '#10B981',
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'right',
    },
    cardNotes: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    cardNotesText: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
    },
    cardActionButtons: {
        flexDirection: 'row',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 8,
    },
    cardActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        gap: 6,
    },
    confirmButton: {
        backgroundColor: '#D1FAE5',
        borderWidth: 1,
        borderColor: '#10B981',
    },
    confirmButtonText: {
        color: '#10B981',
    },
    draftButton: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#9CA3AF',
    },
    draftButtonText: {
        color: '#6B7280',
    },
    cardActionButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    completedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 6,
        backgroundColor: '#D1FAE5',
        padding: 8,
        borderRadius: 6,
    },
    completedInfoText: {
        fontSize: 12,
        color: '#10B981',
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 56,
        height: 56,
        borderRadius: 16,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
