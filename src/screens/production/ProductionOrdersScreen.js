import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    ScrollView,
    TextInput as RNTextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApi } from '../../contexts/ApiContext';

export default function ProductionOrdersScreen() {
    const navigation = useNavigation();
    const { api } = useApi();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [materials, setMaterials] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [outputs, setOutputs] = useState([]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/production_orders?include={"products":true}');
            setOrders(Array.isArray(response.data) ? response.data : response.data?.data || []);
        } catch (error) {
            console.error('Error fetching production orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredOrders = () => {
        return orders.filter(order => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = (
                order.code?.toLowerCase().includes(searchLower) ||
                order.products?.name?.toLowerCase().includes(searchLower)
            );
            const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    };

    const fetchOrderDetails = async (orderId) => {
        try {
            setLoadingDetails(true);
            // Simplified include to avoid complex nested queries
            const includeParam = JSON.stringify({
                products: true,
                product_specifications: true,
                units: true,
                warehouses: true,
                production_plans: true,
                teams: true,
            });

            const response = await api.get(
                `/api/production_orders/${orderId}?include=${includeParam}`
            );
            setOrderDetails(response.data);
        } catch (error) {
            console.error('Error fetching order details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleOrderPress = (order) => {
        setSelectedOrder(order);
        setModalVisible(true);
        // Fetch all related data
        fetchOrderDetails(order.id);
        fetchOrderMaterials(order.id);
        fetchOrderWorkers(order.id);
        fetchOrderOutputs(order.id);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedOrder(null);
        setOrderDetails(null);
        setMaterials([]);
        setWorkers([]);
        setOutputs([]);
    };

    const fetchOrderMaterials = async (orderId) => {
        try {
            const response = await api.get(
                `/api/production_order_materials?where=${JSON.stringify({ production_order_id: orderId })}&include=${JSON.stringify({ products: true, units: true })}`
            );
            setMaterials(Array.isArray(response.data) ? response.data : response.data?.data || []);
        } catch (error) {
            console.error('Error fetching materials:', error);
            setMaterials([]);
        }
    };

    const fetchOrderWorkers = async (orderId) => {
        try {
            const response = await api.get(
                `/api/production_workers?where=${JSON.stringify({ production_order_id: orderId })}`
            );
            setWorkers(Array.isArray(response.data) ? response.data : response.data?.data || []);
        } catch (error) {
            console.error('Error fetching workers:', error);
            setWorkers([]);
        }
    };

    const fetchOrderOutputs = async (orderId) => {
        try {
            const response = await api.get(
                `/api/production_outputs?where=${JSON.stringify({ production_order_id: orderId })}`
            );
            setOutputs(Array.isArray(response.data) ? response.data : response.data?.data || []);
        } catch (error) {
            console.error('Error fetching outputs:', error);
            setOutputs([]);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
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
                <Text style={[styles.statusText, { color: config.color }]}>
                    {config.label}
                </Text>
            </View>
        );
    };

    const getNextStatus = (currentStatus) => {
        const statusFlow = {
            draft: 'approved',
            approved: 'completed',
        };
        return statusFlow[currentStatus];
    };

    const getNextStatusLabel = (currentStatus) => {
        const labels = {
            draft: 'Xác nhận',
            approved: 'Hoàn thành',
        };
        return labels[currentStatus];
    };

    const getNextStatusColor = (currentStatus) => {
        const colors = {
            draft: '#10B981',
            approved: '#059669',
        };
        return colors[currentStatus] || '#6B7280';
    };

    const handleStatusChange = async (order, event) => {
        if (event) {
            event.stopPropagation();
        }

        const nextStatus = getNextStatus(order.status);
        if (!nextStatus) return;

        try {
            await api.put(`/api/production_orders/${order.id}`, {
                status: nextStatus,
            });
            await fetchOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Không thể cập nhật trạng thái');
        }
    };

    const renderOrder = ({ item }) => {
        const showStatusButton = item.status !== 'completed' && getNextStatus(item.status);

        return (
            <TouchableOpacity style={styles.card} onPress={() => handleOrderPress(item)}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardCode}>{item.code}</Text>
                    {getStatusBadge(item.status)}
                </View>
                <Text style={styles.cardTitle}>{item.products?.name || 'N/A'}</Text>
                <View style={styles.cardFooter}>
                    <View style={styles.cardInfo}>
                        <Ionicons name="cube-outline" size={14} color="#6B7280" />
                        <Text style={styles.cardInfoText}>
                            {item.ordered_quantity} {item.units?.name || ''}
                        </Text>
                    </View>
                    {showStatusButton && (
                        <TouchableOpacity
                            style={[
                                styles.statusChangeButton,
                                { backgroundColor: getNextStatusColor(item.status) },
                            ]}
                            onPress={(e) => handleStatusChange(item, e)}
                        >
                            <Ionicons name="arrow-forward" size={14} color="#fff" />
                            <Text style={styles.statusChangeButtonText}>
                                {getNextStatusLabel(item.status)}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderModalContent = () => {
        if (loadingDetails) {
            return (
                <View style={styles.modalLoadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.modalLoadingText}>Đang tải...</Text>
                </View>
            );
        }

        if (!orderDetails) {
            return (
                <View style={styles.modalErrorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text style={styles.modalErrorText}>Không thể tải thông tin lệnh sản xuất</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => selectedOrder && fetchOrderDetails(selectedOrder.id)}
                    >
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <ScrollView style={styles.modalScroll}>
                {/* Order Info Card */}
                <View style={styles.modalCard}>
                    <View style={styles.modalCardHeader}>
                        <Text style={styles.modalOrderCode}>{orderDetails.code}</Text>
                        {getStatusBadge(orderDetails.status)}
                    </View>

                    <Text style={styles.modalProductName}>{orderDetails.products?.name || 'N/A'}</Text>

                    {orderDetails.product_specifications && (
                        <Text style={styles.modalProductSpec}>
                            {orderDetails.product_specifications.spec_name}:{' '}
                            {orderDetails.product_specifications.spec_value}
                        </Text>
                    )}

                    <View style={styles.modalDivider} />

                    <View style={styles.modalInfoRow}>
                        <Ionicons name="cube" size={16} color="#6B7280" />
                        <Text style={styles.modalInfoLabel}>Số lượng đặt:</Text>
                        <Text style={styles.modalInfoValue}>
                            {orderDetails.ordered_quantity} {orderDetails.units?.name || ''}
                        </Text>
                    </View>

                    {orderDetails.remaining_quantity > 0 && (
                        <View style={styles.modalInfoRow}>
                            <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                            <Text style={styles.modalInfoLabel}>Còn lại:</Text>
                            <Text style={[styles.modalInfoValue, styles.warningText]}>
                                {orderDetails.remaining_quantity} {orderDetails.units?.name || ''}
                            </Text>
                        </View>
                    )}

                    {orderDetails.on_hand_quantity > 0 && (
                        <View style={styles.modalInfoRow}>
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            <Text style={styles.modalInfoLabel}>Đã sản xuất:</Text>
                            <Text style={[styles.modalInfoValue, styles.successText]}>
                                {orderDetails.on_hand_quantity} {orderDetails.units?.name || ''}
                            </Text>
                        </View>
                    )}

                    <View style={styles.modalInfoRow}>
                        <Ionicons name="home" size={16} color="#6B7280" />
                        <Text style={styles.modalInfoLabel}>Nhà kho:</Text>
                        <Text style={styles.modalInfoValue}>
                            {orderDetails.warehouses?.name || 'N/A'}
                        </Text>
                    </View>

                    {orderDetails.teams && (
                        <View style={styles.modalInfoRow}>
                            <Ionicons name="people" size={16} color="#6B7280" />
                            <Text style={styles.modalInfoLabel}>Tổ sản xuất:</Text>
                            <Text style={styles.modalInfoValue}>
                                {orderDetails.teams.name}
                            </Text>
                        </View>
                    )}

                    <View style={styles.modalDivider} />

                    <View style={styles.modalInfoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                        <Text style={styles.modalInfoLabel}>Ngày bắt đầu:</Text>
                        <Text style={styles.modalInfoValue}>
                            {formatDate(orderDetails.start_date)}
                        </Text>
                    </View>

                    {orderDetails.end_date && (
                        <View style={styles.modalInfoRow}>
                            <Ionicons name="calendar" size={16} color="#6B7280" />
                            <Text style={styles.modalInfoLabel}>Ngày kết thúc:</Text>
                            <Text style={styles.modalInfoValue}>
                                {formatDate(orderDetails.end_date)}
                            </Text>
                        </View>
                    )}

                    {orderDetails.production_plans && (
                        <View style={styles.modalInfoRow}>
                            <Ionicons name="document-text" size={16} color="#6B7280" />
                            <Text style={styles.modalInfoLabel}>Kế hoạch SX:</Text>
                            <Text style={styles.modalInfoValue}>
                                {orderDetails.production_plans.code}
                            </Text>
                        </View>
                    )}

                    {orderDetails.notes && (
                        <View style={styles.modalNotesBox}>
                            <Ionicons name="information-circle" size={14} color="#6B7280" />
                            <Text style={styles.modalNotesText}>{orderDetails.notes}</Text>
                        </View>
                    )}
                </View>

                {/* Materials Section */}
                {materials.length > 0 && (
                    <View style={styles.modalCard}>
                        <Text style={styles.modalSectionTitle}>
                            Nguyên vật liệu ({materials.length})
                        </Text>
                        {materials.map((material, index) => (
                            <View key={material.id || index} style={styles.modalItemCard}>
                                <Text style={styles.modalItemName}>
                                    {material.products?.name || 'N/A'}
                                </Text>
                                <View style={styles.modalItemDetails}>
                                    <View style={styles.modalItemDetailRow}>
                                        <Text style={styles.modalItemDetailLabel}>Số lượng:</Text>
                                        <Text style={styles.modalItemDetailValue}>
                                            {material.quantity_required} {material.units?.name || ''}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Workers Section */}
                {workers.length > 0 && (
                    <View style={styles.modalCard}>
                        <Text style={styles.modalSectionTitle}>
                            Nhân viên ({workers.length})
                        </Text>
                        {workers.map((worker, index) => (
                            <View key={worker.id || index} style={styles.modalItemCard}>
                                <Text style={styles.modalItemName}>
                                    Nhân viên ID: {worker.staff_id}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Outputs Section */}
                {outputs.length > 0 && (
                    <View style={styles.modalCard}>
                        <Text style={styles.modalSectionTitle}>
                            Đầu ra sản xuất ({outputs.length})
                        </Text>
                        {outputs.map((output, index) => (
                            <View key={output.id || index} style={styles.modalItemCard}>
                                <View style={styles.modalItemHeader}>
                                    <Text style={styles.modalItemName}>
                                        Sản phẩm ID: {output.product_id}
                                    </Text>
                                    <Text style={styles.modalItemDate}>
                                        {formatDate(output.output_date)}
                                    </Text>
                                </View>
                                <View style={styles.modalItemDetails}>
                                    <View style={styles.modalItemDetailRow}>
                                        <Text style={styles.modalItemDetailLabel}>Số lượng:</Text>
                                        <Text style={styles.modalItemDetailValue}>
                                            {output.quantity_produced}
                                        </Text>
                                    </View>
                                    <View style={styles.modalItemDetailRow}>
                                        <Text style={styles.modalItemDetailLabel}>Nhà kho ID:</Text>
                                        <Text style={styles.modalItemDetailValue}>
                                            {output.warehouse_id}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.modalBottomPadding} />
            </ScrollView>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    const StatusFilterButton = ({ status, label }) => (
        <TouchableOpacity
            style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus(status)}
        >
            <Text
                style={[
                    styles.filterButtonText,
                    filterStatus === status && styles.filterButtonTextActive,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

    const filteredOrders = getFilteredOrders();

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <RNTextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm theo mã, sản phẩm..."
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
                    <Text style={styles.statLabel}>Lệnh SX</Text>
                </View>
            </View>

            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderOrder}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>Chưa có lệnh sản xuất</Text>
                    </View>
                }
                onRefresh={fetchOrders}
                refreshing={loading}
            />

            {/* Production Order Detail Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderLeft}>
                                <Ionicons name="document-text" size={24} color="#10B981" />
                                <Text style={styles.modalHeaderTitle}>Chi tiết lệnh SX</Text>
                            </View>
                            <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Content */}
                        {renderModalContent()}

                        {/* Modal Footer */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.modalCloseButtonFooter} onPress={closeModal}>
                                <Text style={styles.modalCloseButtonText}>Đóng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    listContainer: { padding: 16 },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
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
        marginBottom: 8,
    },
    cardCode: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardInfoText: {
        fontSize: 13,
        color: '#6B7280',
    },
    remainingText: {
        fontSize: 12,
        color: '#F59E0B',
        fontWeight: '500',
    },
    statusChangeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    statusChangeButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 64,
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 12,
        textAlign: 'center',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#F9FAFB',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalScroll: {
        flex: 1,
    },
    modalLoadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    modalLoadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    modalErrorContainer: {
        padding: 40,
        alignItems: 'center',
    },
    modalErrorText: {
        marginTop: 12,
        marginBottom: 16,
        fontSize: 14,
        color: '#EF4444',
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    modalCard: {
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
    modalCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalOrderCode: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalProductName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    modalProductSpec: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    modalInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    modalInfoLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    modalInfoValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    successText: {
        color: '#10B981',
    },
    warningText: {
        color: '#F59E0B',
    },
    modalNotesBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 8,
        padding: 10,
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
    },
    modalNotesText: {
        flex: 1,
        fontSize: 13,
        color: '#92400E',
        lineHeight: 18,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    modalItemCard: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    modalItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    modalItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    modalItemDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    modalItemDetails: {
        gap: 4,
    },
    modalItemDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalItemDetailLabel: {
        fontSize: 13,
        color: '#6B7280',
    },
    modalItemDetailValue: {
        fontSize: 13,
        color: '#111827',
        fontWeight: '500',
    },
    modalBottomPadding: {
        height: 20,
    },
    modalFooter: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    modalCloseButtonFooter: {
        backgroundColor: '#6B7280',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});
