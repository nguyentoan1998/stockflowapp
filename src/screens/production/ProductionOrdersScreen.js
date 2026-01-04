import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApi } from '../../contexts/ApiContext';

export default function ProductionOrdersScreen() {
    const navigation = useNavigation();
    const { api } = useApi();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/production_orders?include[]=products');
            setOrders(Array.isArray(response.data) ? response.data : response.data?.data || []);
        } catch (error) {
            console.error('Error fetching production orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderOrder = ({ item }) => (
        <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Lệnh SX #{item.id}</Text>
                <View style={[styles.statusBadge,
                {
                    backgroundColor: item.status === 'completed' ? '#D1FAE5' :
                        item.status === 'in_progress' ? '#FEF3C7' : '#DBEAFE'
                }]}>
                    <Text style={[styles.statusText,
                    {
                        color: item.status === 'completed' ? '#059669' :
                            item.status === 'in_progress' ? '#D97706' : '#1E40AF'
                    }]}>
                        {item.status === 'completed' ? 'Hoàn thành' :
                            item.status === 'in_progress' ? 'Đang SX' : 'Chờ SX'}
                    </Text>
                </View>
            </View>
            <Text style={styles.productText}>{item.products?.name || 'N/A'}</Text>
            <View style={styles.quantityRow}>
                <Text style={styles.quantityText}>
                    Đã SX: {item.quantity_produced || 0}/{item.quantity_planned}
                </Text>
                <Text style={[styles.progress,
                { color: item.quantity_produced >= item.quantity_planned ? '#059669' : '#D97706' }]}>
                    {item.quantity_planned > 0
                        ? `${Math.round((item.quantity_produced / item.quantity_planned) * 100)}%`
                        : '100%'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8E44AD" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={orders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderOrder}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>Chưa có lệnh sản xuất</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 16 },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: '600' },
    productText: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
    quantityRow: { flexDirection: 'row', justifyContent: 'space-between' },
    quantityText: { fontSize: 13, color: '#9CA3AF' },
    progress: { fontSize: 13, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: 64 },
    emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 12 },
});
