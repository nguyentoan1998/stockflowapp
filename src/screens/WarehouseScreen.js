import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, ActivityIndicator, Searchbar, Button } from 'react-native-paper';
import { useApi } from '../contexts/ApiContext';

export default function WarehouseScreen() {
  const { api } = useApi();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const response = await api.get('/api/warehouses');
      setWarehouses(response.data.data || []);
    } catch (error) {
      console.log('Failed to load warehouses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWarehouses();
  };

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    warehouse.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderWarehouse = ({ item }) => (
    <Card style={styles.warehouseCard}>
      <Card.Content>
        <View style={styles.warehouseHeader}>
          <Text variant="titleMedium" style={styles.warehouseName}>
            {item.name}
          </Text>
          <Text variant="bodySmall" style={styles.warehouseCode}>
            {item.code}
          </Text>
        </View>
        
        <Text variant="bodyMedium" style={styles.warehouseDescription}>
          {item.description || 'No description available'}
        </Text>
        
        {item.address && (
          <Text variant="bodySmall" style={styles.address}>
            📍 {item.address}
          </Text>
        )}
        
        {item.phone && (
          <Text variant="bodySmall" style={styles.contact}>
            📞 {item.phone}
          </Text>
        )}
        
        <View style={styles.warehouseActions}>
          <Button mode="outlined" compact onPress={() => console.log('View inventory')}>
            View Inventory
          </Button>
          <Button mode="outlined" compact onPress={() => console.log('Manage stock')}>
            Manage Stock
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading warehouses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search warehouses..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>
      
      <FlatList
        data={filteredWarehouses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderWarehouse}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No warehouses found</Text>
        }
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
  searchContainer: {
    padding: 16,
  },
  searchbar: {
    backgroundColor: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  warehouseCard: {
    marginBottom: 12,
  },
  warehouseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  warehouseName: {
    flex: 1,
    fontWeight: 'bold',
  },
  warehouseCode: {
    color: '#666',
  },
  warehouseDescription: {
    color: '#666',
    marginBottom: 8,
  },
  address: {
    color: '#666',
    marginBottom: 4,
  },
  contact: {
    color: '#666',
    marginBottom: 8,
  },
  warehouseActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 32,
  },
});