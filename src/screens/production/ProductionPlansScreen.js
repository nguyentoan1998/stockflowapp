import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApi } from '../../contexts/ApiContext';

export default function ProductionPlansScreen() {
    const navigation = useNavigation();
    const { api } = useApi();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/production_plans?include[]=customers&include[]=production_plan_items');
            setPlans(Array.isArray(response.data) ? response.data : response.data?.data || []);
        } catch (error) {
            console.error('Error fetching production plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    const renderPlan = ({ item }) => (
        <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Kế hoạch tháng {formatDate(item.plan_month)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? '#D1FAE5' : '#DBEAFE' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'completed' ? '#059669' : '#1E40AF' }]}>
                        {item.status === 'completed' ? 'Hoàn thành' : item.status === 'in_progress' ? 'Đang SX' : 'Kế hoạch'}
                    </Text>
                </View>
            </View>
            <Text style={styles.customerText}>Khách hàng: {item.customers?.name || 'N/A'}</Text>
            <Text style={styles.itemsText}>{item.production_plan_items?.length || 0} sản phẩm</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498DB" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={plans}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPlan}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>Chưa có kế hoạch sản xuất</Text>
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
    customerText: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
    itemsText: { fontSize: 13, color: '#9CA3AF' },
    emptyContainer: { alignItems: 'center', marginTop: 64 },
    emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 12 },
});
