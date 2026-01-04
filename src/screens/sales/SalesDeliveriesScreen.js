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

export default function SalesDeliveriesScreen() {
    const navigation = useNavigation();
    const { api } = useApi();

    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [alertConfig, setAlertConfig] = useState({ visible: false });
    const Alert = createAlertHelper(setAlertConfig);

    useFocusEffect(
        useCallback(() => {
            fetchDeliveries();
        }, [])
    );

    const fetchDeliveries = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/sales_deliveries?include={"customers":{"select":{"name":true,"code":true}}}&orderBy=[{"delivery_date":"desc"}]');

            let deliveriesData = Array.isArray(response.data)
                ? response.data
                : (response.data?.data || []);

            setDeliveries(deliveriesData);
        } catch (error) {
            console.error('Error fetching sales deliveries:', error);
            Alert.error('Lỗi', 'Không thể tải danh sách phiếu xuất');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDeliveries();
        setRefreshing(false);
    };

    const handleCreate = () => {
        navigation.navigate('SalesDeliveryForm', { mode: 'create' });
    };

    const handleView = (delivery) => {
        navigation.navigate('SalesDeliveryDetail', { deliveryId: delivery.id });
    };

    const handleEdit = (delivery) => {
        if (delivery.status !== 'draft') {
            Alert.error('Không thể sửa', 'Chỉ có thể sửa phiếu xuất ở trạng thái Nháp');
            return;
        }
        navigation.navigate('SalesDeliveryForm', { mode: 'edit', deliveryId: delivery.id });
    };

    const handleDelete = (delivery) => {
        if (delivery.status !== 'draft') {
            Alert.error('Không thể xóa', 'Chỉ có thể xóa phiếu xuất ở trạng thái Nháp');
            return;
        }

        Alert.confirm(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa phiếu xuất "${delivery.code}" không?`,
            async () => {
                try {
                    await api.delete(`/api/sales_deliveries/${delivery.id}`);
                    Alert.success('Thành công!', 'Phiếu xuất đã được xóa');
                    await fetchDeliveries();
                } catch (error) {
                    console.error('Error deleting delivery:', error);
                    Alert.error('Lỗi', 'Không thể xóa phiếu xuất');
                }
            }
        );
    };

    const handleUpdateStatus = (delivery, newStatus) => {
        const statusLabels = {
            approved: 'xác nhận',
            draft: 'chuyển về nháp',
        };

        const statusMessages = {
            approved: 'xác nhận',
            draft: 'chuyển về nháp',
        };

        Alert.confirm(
            'Cập nhật trạng thái',
            `Bạn có chắc chắn muốn ${statusLabels[newStatus]} phiếu xuất "${delivery.code}"?`,
            async () => {
                try {
                    await api.put(`/api/sales_deliveries/${delivery.id}`, {
                        status: newStatus,
                    });
                    Alert.success('Thành công!', `Phiếu xuất đã được ${statusMessages[newStatus]}`);
                    await fetchDeliveries();
                } catch (error) {
                    console.error('Error updating status:', error);
                    Alert.error('Lỗi', 'Không thể cập nhật trạng thái');
                }
            }
        );
    };

    const getFilteredDeliveries = () => {
        let filtered = deliveries.filter(delivery => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = (
                delivery.code?.toLowerCase().includes(searchLower) ||
                delivery.customers?.name?.toLowerCase().includes(searchLower) ||
                delivery.notes?.toLowerCase().includes(searchLower)
            );

            const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        return filtered;
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { label: 'Nháp', color: '#6B7280', bgColor: '#F3F4F6' },
            approved: { label: 'Đã xác nhận', color: '#10B981', bgColor: '#D1FAE5' },
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

    const renderDeliveryCard = ({ item: delivery }) => (
        <View style={styles.card}>
            <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.cardGradient}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <Text style={styles.cardCode}>{delivery.code}</Text>
                        {getStatusBadge(delivery.status)}
                    </View>
                    <View style={styles.cardActions}>
                        <TouchableOpacity
                            onPress={() => handleView(delivery)}
                            style={styles.iconButton}
                        >
                            <Ionicons name="eye-outline" size={20} color="#10B981" />
                        </TouchableOpacity>

                        {delivery.status === 'draft' && (
                            <>
                                <TouchableOpacity
                                    onPress={() => handleEdit(delivery)}
                                    style={styles.iconButton}
                                >
                                    <Ionicons name="pencil" size={20} color="#10B981" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => handleDelete(delivery)}
                                    style={styles.iconButton}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>

                <View style={styles.cardRow}>
                    <Ionicons name="people" size={16} color="#6B7280" />
                    <Text style={styles.cardLabel}>Khách hàng:</Text>
                    <Text style={styles.cardValue}>{delivery.customers?.name || 'N/A'}</Text>
                </View>

                <View style={styles.cardRow}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.cardLabel}>Ngày xuất:</Text>
                    <Text style={styles.cardValue}>{formatDate(delivery.delivery_date)}</Text>
                </View>

                <View style={[styles.cardRow, styles.cardTotalRow]}>
                    <Ionicons name="cash" size={16} color="#10B981" />
                    <Text style={styles.cardLabel}>Tổng tiền:</Text>
                    <Text style={styles.cardTotalAmount}>{formatCurrency(delivery.total_amount)}</Text>
                </View>

                {delivery.notes && (
                    <View style={styles.cardNotes}>
                        <Text style={styles.cardNotesText} numberOfLines={2}>
                            {delivery.notes}
                        </Text>
                    </View>
                )}

                {/* Status Action Buttons */}
                {delivery.status === 'draft' && (
                    <View style={styles.cardActionButtons}>
                        <TouchableOpacity
                            style={[styles.cardActionButton, styles.confirmButton]}
                            onPress={() => handleUpdateStatus(delivery, 'approved')}
                        >
                            <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                            <Text style={[styles.cardActionButtonText, styles.confirmButtonText]}>
                                Xác nhận phiếu xuất
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {delivery.status === 'approved' && (
                    <View style={styles.cardActionButtons}>
                        <TouchableOpacity
                            style={[styles.cardActionButton, styles.draftButton]}
                            onPress={() => handleUpdateStatus(delivery, 'draft')}
                        >
                            <Ionicons name="create-outline" size={16} color="#6B7280" />
                            <Text style={[styles.cardActionButtonText, styles.draftButtonText]}>
                                Chuyển về nháp
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </LinearGradient>
        </View>
    );

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Chưa có phiếu xuất bán hàng</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreate}>
                <Text style={styles.emptyButtonText}>Tạo phiếu xuất đầu tiên</Text>
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

    const filteredDeliveries = getFilteredDeliveries();

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <RNTextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm theo mã phiếu, khách hàng..."
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

            <View style={styles.filtersContainer}>
                <StatusFilterButton status="all" label="Tất cả" />
                <StatusFilterButton status="draft" label="Nháp" />
                <StatusFilterButton status="approved" label="Đã xác nhận" />
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{filteredDeliveries.length}</Text>
                    <Text style={styles.statLabel}>Phiếu xuất</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                        {formatCurrency(
                            filteredDeliveries.reduce((sum, d) => sum + (d.total_amount || 0), 0)
                        )}
                    </Text>
                    <Text style={styles.statLabel}>Tổng giá trị</Text>
                </View>
            </View>

            <FlatList
                data={filteredDeliveries}
                renderItem={renderDeliveryCard}
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

            <TouchableOpacity style={styles.fab} onPress={handleCreate}>
                <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>

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
});
