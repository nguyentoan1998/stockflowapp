import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Searchbar, ActivityIndicator, Chip } from 'react-native-paper';
import { useApi } from '../contexts/ApiContext';

export default function InventoryScreen() {
  const { api } = useApi();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.get('/api/products?include={"product_categories":{"select":{"name":true}}}');
      setProducts(response.data.data || []);
    } catch (error) {
      console.log('Failed to load products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProduct = ({ item }) => (
    <Card style={styles.productCard}>
      <Card.Content>
        <View style={styles.productHeader}>
          <Text variant="titleMedium" style={styles.productName}>
            {item.name}
          </Text>
          <Chip mode="outlined" compact>
            {item.code}
          </Chip>
        </View>
        <Text variant="bodyMedium" style={styles.productDescription}>
          {item.description || 'No description'}
        </Text>
        <View style={styles.productInfo}>
          <Text variant="bodySmall">
            Category: {item.product_categories?.name || 'N/A'}
          </Text>
          <Text variant="bodySmall">
            Unit: {item.unit || 'N/A'}
          </Text>
        </View>
        <View style={styles.priceInfo}>
          <Text variant="titleSmall" style={styles.price}>
            ${item.sale_price?.toFixed(2) || '0.00'}
          </Text>
          <Text variant="bodySmall" style={styles.costPrice}>
            Cost: ${item.cost_price?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search products..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>
      
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No products found</Text>
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
  productCard: {
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    flex: 1,
    fontWeight: 'bold',
  },
  productDescription: {
    color: '#666',
    marginBottom: 8,
  },
  productInfo: {
    marginBottom: 8,
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  costPrice: {
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 32,
  },
});