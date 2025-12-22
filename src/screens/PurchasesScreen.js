import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Chip, ActivityIndicator, FAB } from 'react-native-paper';
import { useApi } from '../contexts/ApiContext';

export default function PurchasesScreen() {
  const { api } = useApi();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      const response = await api.get('/api/purchase_orders?include={"suppliers":{"select":{"name":true}}}');
      setOrders(response.data.data || []);
    } catch (error) {
      console.log('Failed to load purchase orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPurchaseOrders();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FF9800';
      case 'approved':
        return '#2196F3';
      case 'received':
        return '#4CAF50';
      case 'cancelled':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const renderOrder = ({ item }) => (
    <Card style={styles.orderCard}>
      <Card.Content>
        <View style={styles.orderHeader}>
          <Text variant="titleMedium" style={styles.orderCode}>
            {item.code}
          </Text>
          <Chip 
            mode="flat" 
            textStyle={{ color: getStatusColor(item.status) }}
            style={{ backgroundColor: getStatusColor(item.status) + '20' }}
          >
            {item.status || 'Unknown'}
          </Chip>
        </View>
        
        <Text variant="bodyMedium" style={styles.supplier}>
          Supplier: {item.suppliers?.name || 'N/A'}
        </Text>
        
        <Text variant="bodySmall" style={styles.date}>
          Order Date: {new Date(item.order_date).toLocaleDateString()}
        </Text>
        
        {item.expected_date && (
          <Text variant="bodySmall" style={styles.date}>
            Expected: {new Date(item.expected_date).toLocaleDateString()}
          </Text>
        )}
        
        <View style={styles.orderFooter}>
          <Text variant="titleSmall" style={styles.totalAmount}>
            Total: ${item.total_amount?.toFixed(2) || '0.00'}
          </Text>
        </View>
        
        {item.notes && (
          <Text variant="bodySmall" style={styles.notes}>
            Notes: {item.notes}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading purchase orders...</Text>
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No purchase orders found</Text>
        }
      />
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // Navigate to create purchase order screen
          console.log('Create new purchase order');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderCode: {
    fontWeight: 'bold',
  },
  supplier: {
    color: '#666',
    marginBottom: 4,
  },
  date: {
    color: '#666',
    marginBottom: 2,
  },
  orderFooter: {
    marginTop: 8,
    marginBottom: 4,
  },
  totalAmount: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  notes: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 32,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});