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

export default function WarrantyListScreen() {
    const navigation = useNavigation();
    const { api } = useApi();

    const [warranties, setWarranties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [alertConfig, setAlertConfig] = useState({ visible: false });
    const Alert = createAlertHelper(setAlertConfig);

    useFocusEffect(
        useCallback(() => {
            fetchWarranties();
        }, [])
    );

    const fetchWarranties = async () => {
        try {
            setLoading(true);
            // Warranty uses inventory_transactions with reference_type='warranty'
            const response = await api.get('/api/inventory_transactions?include={"inventory_transaction_logs":{"include":{"products":{"select":{"name":true,"code":true}}}}}&orderBy=[{"transaction_date":"desc"}]', {
                params: {
                    reference_type: 'warranty',
                },
            });

            const data = response.data;
            let warrantiesData = Array.isArray(data) ? data : (data?.data || []);

            setWarranties(warrantiesData);
        } catch (error) {
            console.error('Error fetching warranties:', error);
            Alert.error('Lỗi', 'Không thể tải danh sách phiếu bảo hành');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchWarranties();
        setRefreshing(false);
    };

    const handleCreate = () => {
        navigation.navigate('WarrantyForm', { mode: 'create' });
    };

    const handleView = (warranty) => {
        navigation.navigate('WarrantyDetail', { warrantyId: warranty.id });
    };

    const handleEdit = (warranty) => {
        navigation.navigate('WarrantyForm', { mode: 'edit', warrantyId: warranty.id });
    };

    const handleDelete = (warranty) => {
        Alert.confirm(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa phiếu bảo hành "${warranty.code}" không?`,
            async () => {
                try {
                    await api.delete(`/api/inventory_transactions/${warranty.id}`);
                    Alert.success('Thành công!', 'Phiếu bảo hành đã được xóa');
                    await fetchWarranties();
                } catch (error) {
                    console.error('Error deleting warranty:', error);
                    Alert.error('Lỗi', 'Không thể xóa phiếu bảo hành');
                }
            }
        );
    };

    const getFilteredWarranties = () => {
        let filtered = warranties.filter(warranty => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = (
                warranty.code?.toLowerCase().includes(searchLower) ||
                warranty.description?.toLowerCase().includes(searchLower)
            );

            return matchesSearch;
        });

        return filtered;
    };



    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const renderWarrantyCard = ({ item: warranty }) => {
        const itemCount = warranty.inventory_transaction_logs?.length || 0;
        const firstProduct = warranty.inventory_transaction_logs?.[0]?.products;

        return (
            <View style={styles.card}>
                <LinearGradient
                    colors={['#ffffff', '#f8f9fa']}
                    style={styles.cardGradient}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <Text style={styles.cardCode}>{warranty.code}</Text>
                            <Text style={styles.cardDate}>{formatDate(warranty.transaction_date)}</Text>
                        </View>
                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                onPress={() => handleView(warranty)}
                                style={styles.iconButton}
                            >
                                <Ionicons name="eye-outline" size={20} color="#F97316" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleEdit(warranty)}
                                style={styles.iconButton}
                            >
                                <Ionicons name="pencil" size={20} color="#F97316" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleDelete(warranty)}
                                style={styles.iconButton}
                            >
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.cardRow}>
                        <Ionicons name="cube" size={16} color="#6B7280" />
                        <Text style={styles.cardLabel}>Sản phẩm:</Text>
                        <Text style={styles.cardValue}>{firstProduct?.name || 'N/A'}</Text>
                    </View>

                    <View style={styles.cardRow}>
                        <Ionicons name="layers" size={16} color="#6B7280" />
                        <Text style={styles.cardLabel}>Số sản phẩm:</Text>
                        <Text style={styles.cardValue}>{itemCount}</Text>
                    </View>

                    {warranty.description && (
                        <View style={styles.cardProblem}>
                            <Text style={styles.cardProblemText} numberOfLines={2}>
                                {warranty.description}
                            </Text>
                        </View>
                    )}
                </LinearGradient>
            </View>
        );
    };

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Chưa có phiếu bảo hành nào</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreate}>
                <Text style={styles.emptyButtonText}>Tạo phiếu đầu tiên</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    const filteredWarranties = getFilteredWarranties();

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <RNTextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm theo mã, khách hàng, sản phẩm..."
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



            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{filteredWarranties.length}</Text>
                    <Text style={styles.statLabel}>Phiếu bảo hành</Text>
                </View>
            </View>

            <FlatList
                data={filteredWarranties}
                renderItem={renderWarrantyCard}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={renderEmptyList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#F97316']}
                    />
                }
            />

            <TouchableOpacity style={styles.fab} onPress={handleCreate}>
                <LinearGradient
                    colors={['#F97316', '#EA580C']}
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
        backgroundColor: '#F97316',
        borderColor: '#F97316',
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
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    statCard: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#F97316',
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
    cardProblem: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    cardProblemText: {
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
        backgroundColor: '#F97316',
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
        shadowColor: '#F97316',
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
