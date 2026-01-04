import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApi } from '../../contexts/ApiContext';

export default function MaterialRequestsScreen() {
    const navigation = useNavigation();
    const { api } = useApi();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/material_requests?include[]=products');
            setRequests(Array.isArray(response.data) ? response.data : response.data?.data || []);
        } catch (error) {
            console.error('Error fetching material requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderRequest = ({ item }) => (
        <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Yêu cầu #{item.id}</Text>
                <View style={[styles.statusBadge,
                {
                    backgroundColor: item.status === 'fulfilled' ? '#D1FAE5' :
                        item.status === 'approved' ? '#FEF3C7' : '#DBEAFE'
                }]}>
                    <Text style={[styles.statusText,
                    {
                        color: item.status === 'fulfilled' ? '#059669' :
                            item.status === 'approved' ? '#D97706' : '#1E40AF'
                    }]}>
                        {item.status === 'fulfilled' ? 'Đã đáp ứng' :
                            item.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                    </Text>
                </View>
            </View>
            <Text style={styles.materialText}>{item.products?.name || 'N/A'}</Text>
            <Text style={styles.quantityText}>Số lượng: {item.quantity_requested}</Text>
            {item.reason && <Text style={styles.reasonText} numberOfLines={2}>{item.reason}</Text>}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E67E22" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={requests}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderRequest}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="list-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>Chưa có yêu cầu vật tư</Text>
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
    materialText: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
    quantityText: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
    reasonText: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' },
    emptyContainer: { alignItems: 'center', marginTop: 64 },
    emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 12 },
});
