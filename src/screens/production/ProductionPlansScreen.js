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

export default function ProductionPlansScreen() {
    const navigation = useNavigation();
    const { api } = useApi();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [planDetails, setPlanDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/production_plans');
            setPlans(Array.isArray(response.data) ? response.data : response.data?.data || []);
        } catch (error) {
            console.error('Error fetching production plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredPlans = () => {
        return plans.filter(plan => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = (
                plan.code?.toLowerCase().includes(searchLower) ||
                plan.name?.toLowerCase().includes(searchLower) ||
                plan.description?.toLowerCase().includes(searchLower)
            );
            const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    };

    const fetchPlanDetails = async (planId) => {
        try {
            setLoadingDetails(true);
            const include = {
                production_plan_items: {
                    include: {
                        products: true,
                        product_specifications: true,
                        warehouses: true,
                        units: true,
                    },
                },
            };
            const response = await api.get(
                `/api/production_plans/${planId}?include=${JSON.stringify(include)}`
            );
            setPlanDetails(response.data);
        } catch (error) {
            console.error('Error fetching plan details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handlePlanPress = (plan) => {
        setSelectedPlan(plan);
        setModalVisible(true);
        fetchPlanDetails(plan.id);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedPlan(null);
        setPlanDetails(null);
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
            in_progress: { label: 'Đang thực hiện', color: '#3B82F6', bgColor: '#DBEAFE' },
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
            approved: 'in_progress',
            // No transition from in_progress - it stays there
        };
        return statusFlow[currentStatus];
    };

    const getNextStatusLabel = (currentStatus) => {
        const labels = {
            draft: 'Xác nhận',
            approved: 'Bắt đầu SX',
        };
        return labels[currentStatus];
    };

    const getNextStatusColor = (currentStatus) => {
        const colors = {
            draft: '#10B981',
            approved: '#3B82F6',
        };
        return colors[currentStatus] || '#6B7280';
    };

    const handleStatusChange = async (plan, event) => {
        // Prevent card click when clicking status button
        if (event) {
            event.stopPropagation();
        }

        const nextStatus = getNextStatus(plan.status);
        if (!nextStatus) return;

        try {
            // Special handling for starting production (approved -> in_progress)
            if (plan.status === 'approved' && nextStatus === 'in_progress') {
                console.log('🏭 Starting production for plan:', plan.code);

                // First create/update production orders
                const orderResult = await api.post('/api/create-production-orders', {
                    planId: plan.id,
                });

                console.log('✅ Production orders created/updated:', orderResult.data);

                // Show success message
                const ordersCount = orderResult.data.totalOrders || 0;
                alert(`Đã tạo ${ordersCount} lệnh sản xuất`);
            }

            // Update plan status
            await api.put(`/api/production_plans/${plan.id}`, {
                status: nextStatus,
            });

            // Refresh plans list
            await fetchPlans();
        } catch (error) {
            console.error('Error updating plan status:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Không thể cập nhật trạng thái';
            alert(errorMsg);
        }
    };

    const renderPlan = ({ item }) => {
        const nextStatus = getNextStatus(item.status);
        const showStatusButton = nextStatus && item.status !== 'completed' && item.status !== 'cancelled';

        return (
            <TouchableOpacity style={styles.card} onPress={() => handlePlanPress(item)}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardCode}>{item.code}</Text>
                    {getStatusBadge(item.status)}
                </View>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {item.description && (
                    <Text style={styles.cardDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}
                <View style={styles.cardFooter}>
                    <View style={styles.cardInfo}>
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text style={styles.cardInfoText}>
                            {formatDate(item.start_date)} - {formatDate(item.end_date)}
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

        if (!planDetails) {
            return (
                <View style={styles.modalErrorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text style={styles.modalErrorText}>Không thể tải thông tin kế hoạch</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => selectedPlan && fetchPlanDetails(selectedPlan.id)}
                    >
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <ScrollView style={styles.modalScroll}>
                {/* Plan Info Card */}
                <View style={styles.modalCard}>
                    <View style={styles.modalCardHeader}>
                        <Text style={styles.modalPlanCode}>{planDetails.code}</Text>
                        {getStatusBadge(planDetails.status)}
                    </View>

                    <Text style={styles.modalPlanName}>{planDetails.name}</Text>

                    {planDetails.description && (
                        <Text style={styles.modalPlanDescription}>{planDetails.description}</Text>
                    )}

                    <View style={styles.modalDivider} />

                    <View style={styles.modalInfoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                        <Text style={styles.modalInfoLabel}>Ngày bắt đầu:</Text>
                        <Text style={styles.modalInfoValue}>{formatDate(planDetails.start_date)}</Text>
                    </View>

                    <View style={styles.modalInfoRow}>
                        <Ionicons name="calendar" size={16} color="#6B7280" />
                        <Text style={styles.modalInfoLabel}>Ngày kết thúc:</Text>
                        <Text style={styles.modalInfoValue}>{formatDate(planDetails.end_date)}</Text>
                    </View>
                </View>

                {/* Production Plan Items */}
                <View style={styles.modalCard}>
                    <Text style={styles.modalSectionTitle}>
                        Danh sách sản phẩm ({planDetails.production_plan_items?.length || 0})
                    </Text>

                    {planDetails.production_plan_items && planDetails.production_plan_items.length > 0 ? (
                        planDetails.production_plan_items.map((item, index) => (
                            <View key={item.id || index} style={styles.modalItemCard}>
                                <View style={styles.modalItemHeader}>
                                    <Text style={styles.modalItemName}>
                                        {item.products?.name || 'N/A'}
                                    </Text>
                                    {item.product_specifications && (
                                        <Text style={styles.modalItemSpec}>
                                            {item.product_specifications.spec_name}:{' '}
                                            {item.product_specifications.spec_value}
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.modalItemDetails}>
                                    <View style={styles.modalItemDetailRow}>
                                        <Text style={styles.modalItemDetailLabel}>Số lượng đặt:</Text>
                                        <Text style={styles.modalItemDetailValue}>
                                            {item.ordered_quantity} {item.units?.name || ''}
                                        </Text>
                                    </View>

                                    {item.delivered_quantity > 0 && (
                                        <View style={styles.modalItemDetailRow}>
                                            <Text style={styles.modalItemDetailLabel}>Đã hoàn thành:</Text>
                                            <Text style={[styles.modalItemDetailValue, styles.successText]}>
                                                {item.delivered_quantity} {item.units?.name || ''}
                                            </Text>
                                        </View>
                                    )}

                                    {item.remaining_quantity > 0 && (
                                        <View style={styles.modalItemDetailRow}>
                                            <Text style={styles.modalItemDetailLabel}>Còn lại:</Text>
                                            <Text style={[styles.modalItemDetailValue, styles.warningText]}>
                                                {item.remaining_quantity} {item.units?.name || ''}
                                            </Text>
                                        </View>
                                    )}

                                    <View style={styles.modalItemDetailRow}>
                                        <Text style={styles.modalItemDetailLabel}>Nhà kho:</Text>
                                        <Text style={styles.modalItemDetailValue}>
                                            {item.warehouses?.name || 'N/A'}
                                        </Text>
                                    </View>

                                    {item.notes && (
                                        <View style={styles.modalItemNotes}>
                                            <Ionicons name="information-circle" size={14} color="#6B7280" />
                                            <Text style={styles.modalItemNotesText}>{item.notes}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.modalEmptyText}>Chưa có sản phẩm nào</Text>
                    )}
                </View>

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

    const filteredPlans = getFilteredPlans();

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <RNTextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm theo  mã, tên..."
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
                <StatusFilterButton status="in_progress" label="Đang thực hiện" />
            </View>

            {/* Summary Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{filteredPlans.length}</Text>
                    <Text style={styles.statLabel}>Kế hoạch</Text>
                </View>
            </View>

            <FlatList
                data={filteredPlans}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPlan}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>Chưa có kế hoạch sản xuất</Text>
                    </View>
                }
                onRefresh={fetchPlans}
                refreshing={loading}
            />

            {/* Production Plan Detail Modal */}
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
                                <Text style={styles.modalHeaderTitle}>Chi tiết kế hoạch</Text>
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
        color: '#10B981',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    cardFooter: {
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    cardInfoText: {
        fontSize: 13,
        color: '#6B7280',
    },
    statusChangeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusChangeButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
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
    modalPlanCode: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalPlanName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 8,
    },
    modalPlanDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
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
        marginBottom: 12,
    },
    modalItemHeader: {
        marginBottom: 8,
    },
    modalItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    modalItemSpec: {
        fontSize: 13,
        color: '#6B7280',
    },
    modalItemDetails: {
        gap: 6,
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
    successText: {
        color: '#10B981',
    },
    warningText: {
        color: '#F59E0B',
    },
    modalItemNotes: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
        marginTop: 4,
        padding: 8,
        backgroundColor: '#FEF3C7',
        borderRadius: 6,
    },
    modalItemNotesText: {
        flex: 1,
        fontSize: 12,
        color: '#92400E',
        lineHeight: 16,
    },
    modalEmptyText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#9CA3AF',
        paddingVertical: 20,
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
