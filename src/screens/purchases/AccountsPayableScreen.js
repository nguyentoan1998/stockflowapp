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

export default function AccountsPayableScreen() {
    const navigation = useNavigation();
    const { api } = useApi();

    const [payables, setPayables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [alertConfig, setAlertConfig] = useState({ visible: false });
    const Alert = createAlertHelper(setAlertConfig);

    useFocusEffect(
        useCallback(() => {
            fetchPayables();
        }, [])
    );

    const fetchPayables = async () => {
        try {
            setLoading(true);

            // TODO: Replace with actual API endpoint /api/suppliers/payables when available
            // For now, fetch suppliers and mock payable data
            const response = await api.get('/api/suppliers');

            let suppliersData = Array.isArray(response.data)
                ? response.data
                : (response.data?.data || []);

            // Mock payable data - TODO: Get real data from API
            const payablesData = suppliersData.map(supplier => ({
                supplier_id: supplier.id,
                supplier_name: supplier.name,
                supplier_code: supplier.code,
                total_purchases: 0, // TODO: Calculate from purchase_receives
                total_paid: 0,      // TODO: Calculate from payables table
            }));

            setPayables(payablesData);
        } catch (error) {
            console.error('Error fetching payables:', error);
            Alert.error('Lỗi', 'Không thể tải danh sách công nợ');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPayables();
        setRefreshing(false);
    };

    const handleViewDetail = (supplier) => {
        navigation.navigate('PayableDetail', { supplierId: supplier.supplier_id });
    };

    const getFilteredPayables = () => {
        if (!searchQuery) return payables;

        const searchLower = searchQuery.toLowerCase();
        return payables.filter(item =>
            item.supplier_name?.toLowerCase().includes(searchLower) ||
            item.supplier_code?.toLowerCase().includes(searchLower)
        );
    };

    const formatCurrency = (amount) => {
        if (!amount) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const renderPayableCard = ({ item }) => {
        const balance = (item.total_purchases || 0) - (item.total_paid || 0);
        const paymentPercent = item.total_purchases > 0
            ? ((item.total_paid / item.total_purchases) * 100).toFixed(1)
            : 0;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => handleViewDetail(item)}
                activeOpacity={0.7}
            >
                <LinearGradient
                    colors={['#ffffff', '#f8f9fa']}
                    style={styles.cardGradient}
                >
                    {/* Header */}
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <View style={styles.supplierIcon}>
                                <Ionicons name="business" size={24} color="#EF4444" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.supplierName}>{item.supplier_name}</Text>
                                {item.supplier_code && (
                                    <Text style={styles.supplierCode}>{item.supplier_code}</Text>
                                )}
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </View>

                    {/* Balance Summary */}
                    <View style={styles.balanceContainer}>
                        <View style={[styles.balanceCard, styles.balanceCardDebt]}>
                            <Text style={styles.balanceLabel}>Tổng nợ</Text>
                            <Text style={[styles.balanceValue, styles.balanceValueDebt]}>
                                {formatCurrency(balance)}
                            </Text>
                        </View>
                    </View>

                    {/* Details */}
                    <View style={styles.detailsContainer}>
                        <View style={styles.detailRow}>
                            <Ionicons name="cart" size={16} color="#6B7280" />
                            <Text style={styles.detailLabel}>Tổng mua:</Text>
                            <Text style={styles.detailValue}>{formatCurrency(item.total_purchases)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            <Text style={styles.detailLabel}>Đã trả:</Text>
                            <Text style={[styles.detailValue, styles.detailValuePaid]}>
                                {formatCurrency(item.total_paid)}
                            </Text>
                        </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${Math.min(paymentPercent, 100)}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>{paymentPercent}% đã thanh toán</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Không có công nợ phải trả</Text>
            <Text style={styles.emptySubtext}>
                Danh sách công nợ với nhà cung cấp sẽ hiển thị ở đây
            </Text>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#EF4444" />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    const filteredPayables = getFilteredPayables();
    const totalBalance = filteredPayables.reduce((sum, item) =>
        sum + ((item.total_purchases || 0) - (item.total_paid || 0)), 0
    );
    const totalPurchases = filteredPayables.reduce((sum, item) =>
        sum + (item.total_purchases || 0), 0
    );
    const totalPaid = filteredPayables.reduce((sum, item) =>
        sum + (item.total_paid || 0), 0
    );

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <RNTextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm nhà cung cấp..."
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

            {/* Summary Stats */}
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, styles.statCardDebt]}>
                    <Ionicons name="alert-circle" size={20} color="#EF4444" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.statLabel}>Tổng Công Nợ</Text>
                        <Text style={[styles.statValue, styles.statValueDebt]}>
                            {formatCurrency(totalBalance)}
                        </Text>
                    </View>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="cart" size={18} color="#6B7280" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.statLabel}>Tổng Mua</Text>
                        <Text style={styles.statValue}>{formatCurrency(totalPurchases)}</Text>
                    </View>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.statLabel}>Đã Trả</Text>
                        <Text style={[styles.statValue, styles.statValuePaid]}>
                            {formatCurrency(totalPaid)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Payables List */}
            <FlatList
                data={filteredPayables}
                renderItem={renderPayableCard}
                keyExtractor={(item) => item.supplier_id?.toString() || Math.random().toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={renderEmptyList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#EF4444']}
                    />
                }
            />

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
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    statCard: {
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
    statCardDebt: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FEE2E2',
    },
    statLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    statValueDebt: {
        color: '#EF4444',
    },
    statValuePaid: {
        color: '#10B981',
    },
    listContainer: {
        padding: 16,
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
        marginBottom: 16,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    supplierIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    supplierName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    supplierCode: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    balanceContainer: {
        marginBottom: 12,
    },
    balanceCard: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
    },
    balanceCardDebt: {
        backgroundColor: '#FEF2F2',
    },
    balanceLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    balanceValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    balanceValueDebt: {
        color: '#EF4444',
    },
    detailsContainer: {
        gap: 8,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailLabel: {
        fontSize: 13,
        color: '#6B7280',
    },
    detailValue: {
        fontSize: 13,
        color: '#111827',
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    detailValuePaid: {
        color: '#10B981',
    },
    progressContainer: {
        marginTop: 8,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 11,
        color: '#6B7280',
        textAlign: 'right',
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
        fontWeight: '600',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
});
