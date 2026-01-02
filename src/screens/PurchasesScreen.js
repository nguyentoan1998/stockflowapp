import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, ActivityIndicator, FAB, Searchbar, Menu, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApi } from '../contexts/ApiContext';

export default function PurchasesScreen() {
  const { api } = useApi();
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadPurchaseOrders();
    }, [])
  );

  const loadPurchaseOrders = async () => {
    try {
      const response = await api.get('/api/purchase_orders?include={"suppliers":{"select":{"name":true}}}');
      const data = response.data.data || [];
      setOrders(data);
      setFilteredOrders(data);
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

  const handleSearch = (query) => {
    setSearchQuery(query);
    filterOrders(query, filterStatus);
  };

  const handleFilterStatus = (status) => {
    setFilterStatus(status);
    setMenuVisible(false);
    filterOrders(searchQuery, status);
  };

  const filterOrders = (query, status) => {
    let filtered = [...orders];

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(order => 
        order.status?.toLowerCase() === status.toLowerCase()
      );
    }

    // Filter by search query
    if (query) {
      filtered = filtered.filter(order => 
        order.code?.toLowerCase().includes(query.toLowerCase()) ||
        order.suppliers?.name?.toLowerCase().includes(query.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return '#9E9E9E';
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

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Nháp',
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      received: 'Đã nhận',
      cancelled: 'Đã hủy',
    };
    return labels[status?.toLowerCase()] || status || 'Unknown';
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('PurchaseOrderDetail', { orderId: item.id })}
    >
      <Card style={styles.orderCard}>
        <Card.Content>
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <Ionicons name="document-text" size={20} color="#2196F3" />
              <Text variant="titleMedium" style={styles.orderCode}>
                {item.code}
              </Text>
            </View>
            <Chip 
              mode="flat" 
              textStyle={{ color: getStatusColor(item.status), fontSize: 12 }}
              style={{ backgroundColor: getStatusColor(item.status) + '20' }}
            >
              {getStatusLabel(item.status)}
            </Chip>
          </View>
          
          <View style={styles.orderInfo}>
            <Ionicons name="business" size={16} color="#666" />
            <Text variant="bodyMedium" style={styles.supplier}>
              {item.suppliers?.name || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.orderInfo}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text variant="bodySmall" style={styles.date}>
              {new Date(item.order_date).toLocaleDateString('vi-VN')}
            </Text>
          </View>
          
          {item.expected_date && (
            <View style={styles.orderInfo}>
              <Ionicons name="time" size={16} color="#666" />
              <Text variant="bodySmall" style={styles.date}>
                Dự kiến: {new Date(item.expected_date).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          )}
          
          <View style={styles.orderFooter}>
            <Text variant="titleSmall" style={styles.totalAmount}>
              {item.total_amount?.toLocaleString('vi-VN')} ₫
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
          
          {item.notes && (
            <Text variant="bodySmall" style={styles.notes} numberOfLines={2}>
              Ghi chú: {item.notes}
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải đơn mua hàng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Tìm theo mã đơn hoặc nhà cung cấp..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button 
              mode="outlined" 
              onPress={() => setMenuVisible(true)}
              style={styles.filterButton}
              icon="filter-variant"
            >
              {filterStatus === 'all' ? 'Tất cả' : getStatusLabel(filterStatus)}
            </Button>
          }
        >
          <Menu.Item onPress={() => handleFilterStatus('all')} title="Tất cả" />
          <Menu.Item onPress={() => handleFilterStatus('draft')} title="Nháp" />
          <Menu.Item onPress={() => handleFilterStatus('pending')} title="Chờ duyệt" />
          <Menu.Item onPress={() => handleFilterStatus('approved')} title="Đã duyệt" />
          <Menu.Item onPress={() => handleFilterStatus('received')} title="Đã nhận" />
          <Menu.Item onPress={() => handleFilterStatus('cancelled')} title="Đã hủy" />
        </Menu>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Không tìm thấy đơn mua hàng</Text>
          </View>
        }
      />
      
      <FAB
        icon="plus"
        style={styles.fab}
        label="Tạo đơn mới"
        onPress={() => navigation.navigate('PurchaseOrderForm')}
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchbar: {
    flex: 1,
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  filterButton: {
    borderColor: '#2196F3',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  orderCard: {
    marginBottom: 12,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  orderCode: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  supplier: {
    color: '#333',
    flex: 1,
  },
  date: {
    color: '#666',
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalAmount: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 16,
  },
  notes: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 16,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});