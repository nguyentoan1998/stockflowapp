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
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function WarehouseInventoryDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { api } = useApi();
  const warehouseId = route.params?.warehouseId;
  const warehouseName = route.params?.warehouseName;

  const [warehouse, setWarehouse] = useState(null);
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, in-stock, low, out

  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useFocusEffect(
    useCallback(() => {
      fetchWarehouseDetails();
      fetchInventories();
    }, [warehouseId])
  );

  const fetchWarehouseDetails = async () => {
    try {
      const response = await api.get(`/api/warehouses/${warehouseId}`);
      setWarehouse(response.data);
    } catch (error) {
      console.error('Error fetching warehouse:', error);
      Alert.error('Lỗi', 'Không thể tải thông tin kho hàng');
    }
  };

  const fetchInventories = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/warehouse_inventory?where={"warehouse_id":${warehouseId}}&include={"products":true,"product_specifications":true}`
      );
      const inventoriesData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);
      setInventories(inventoriesData);
    } catch (error) {
      console.error('Error fetching inventories:', error);
      Alert.error('Lỗi', 'Không thể tải tồn kho');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInventories();
  };

  const getFilteredInventories = () => {
    let filtered = inventories.filter(inventory => {
      const searchLower = searchQuery.toLowerCase();
      return (
        inventory.products?.name?.toLowerCase().includes(searchLower) ||
        inventory.products?.code?.toLowerCase().includes(searchLower)
      );
    });

    // Apply status filter
    filtered = filtered.filter(inventory => {
      const qty = parseFloat(inventory.quantity || 0);
      if (filterType === 'all') return true;
      if (filterType === 'in-stock') return qty >= 10;
      if (filterType === 'low') return qty > 0 && qty < 10;
      if (filterType === 'out') return qty === 0;
      return true;
    });

    return filtered;
  };

  const getStats = () => {
    return {
      total: inventories.length,
      inStock: inventories.filter(i => parseFloat(i.quantity || 0) >= 10).length,
      lowStock: inventories.filter(i => parseFloat(i.quantity || 0) > 0 && parseFloat(i.quantity || 0) < 10).length,
      outOfStock: inventories.filter(i => parseFloat(i.quantity || 0) === 0).length,
      totalValue: inventories.reduce((sum, inv) => {
        const qty = parseFloat(inv.quantity || 0);
        const price = parseFloat(inv.products?.sale_price || 0);
        return sum + (qty * price);
      }, 0),
    };
  };

  const renderFilterButton = (type, label, icon, color) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterType === type && styles.filterButtonActive,
        filterType === type && { backgroundColor: color }
      ]}
      onPress={() => setFilterType(type)}
    >
      <MaterialCommunityIcons
        name={icon}
        size={16}
        color={filterType === type ? '#fff' : color}
      />
      <Text style={[
        styles.filterButtonText,
        filterType === type && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderInventoryItem = ({ item: inventory }) => {
    const quantity = parseFloat(inventory.quantity || 0);
    let statusColor = '#4CAF50';
    let statusLabel = 'Còn hàng';
    let statusIcon = 'check-circle';

    if (quantity === 0) {
      statusColor = '#f44336';
      statusLabel = 'Hết hàng';
      statusIcon = 'close-circle';
    } else if (quantity < 10) {
      statusColor = '#ff9800';
      statusLabel = 'Sắp hết';
      statusIcon = 'alert-circle';
    }

    return (
      <TouchableOpacity style={styles.inventoryItem}>
        <View style={styles.itemHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {inventory.products?.name || 'N/A'}
            </Text>
            <Text style={styles.productCode}>
              Mã: {inventory.products?.code || 'N/A'}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <MaterialCommunityIcons name={statusIcon} size={14} color="#fff" />
            <Text style={styles.statusLabel}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Số lượng:</Text>
            <Text style={[styles.detailValue, { color: statusColor, fontWeight: '700' }]}>
              {quantity.toFixed(2)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Đơn vị:</Text>
            <Text style={styles.detailValue}>
              {inventory.product_specifications?.spec_name || 'N/A'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Giá:</Text>
            <Text style={styles.detailValue}>
              {(inventory.products?.sale_price || 0).toLocaleString('vi-VN')}₫
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Tổng giá trị:</Text>
            <Text style={[styles.detailValue, { fontWeight: '700', color: '#1976d2' }]}>
              {(quantity * parseFloat(inventory.products?.sale_price || 0)).toLocaleString('vi-VN')}₫
            </Text>
          </View>
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="pencil" size={16} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Cập nhật</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="history" size={16} color="#2196F3" />
            <Text style={styles.actionButtonText}>Lịch sử</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !warehouse) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const stats = getStats();
  const filteredInventories = getFilteredInventories();

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />

      {/* Header */}
      <LinearGradient colors={['#1976d2', '#1565c0']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <Text style={styles.warehouseTitle}>{warehouseName || 'Chi tiết kho hàng'}</Text>
              <Text style={styles.warehouseSubtitle}>{stats.total} sản phẩm</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <MaterialCommunityIcons name="dots-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsSection}>
        <View style={[styles.statCard, { borderLeftColor: '#4CAF50' }]}>
          <Text style={styles.statNumber}>{stats.inStock}</Text>
          <Text style={styles.statLabel}>Còn hàng</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#ff9800' }]}>
          <Text style={styles.statNumber}>{stats.lowStock}</Text>
          <Text style={styles.statLabel}>Sắp hết</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#f44336' }]}>
          <Text style={styles.statNumber}>{stats.outOfStock}</Text>
          <Text style={styles.statLabel}>Hết hàng</Text>
        </View>
      </View>

      {/* Total Value */}
      <View style={styles.totalValueCard}>
        <View>
          <Text style={styles.totalValueLabel}>Tổng giá trị tồn kho</Text>
          <Text style={styles.totalValueAmount}>
            {stats.totalValue.toLocaleString('vi-VN')}₫
          </Text>
        </View>
        <MaterialCommunityIcons name="trending-up" size={32} color="#4CAF50" />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterButton('all', 'Tất cả', 'layers', '#666')}
          {renderFilterButton('in-stock', 'Còn hàng', 'check-circle', '#4CAF50')}
          {renderFilterButton('low', 'Sắp hết', 'alert-circle', '#ff9800')}
          {renderFilterButton('out', 'Hết hàng', 'close-circle', '#f44336')}
        </ScrollView>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <RNTextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Inventory List */}
      <FlatList
        data={filteredInventories}
        renderItem={renderInventoryItem}
        keyExtractor={item => item.id?.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có sản phẩm'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },

  header: { paddingTop: 12, paddingBottom: 16, paddingHorizontal: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerTitle: { marginLeft: 12, flex: 1 },
  warehouseTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  warehouseSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  moreButton: { padding: 8 },

  statsSection: { flexDirection: 'row', paddingHorizontal: 12, marginVertical: 12, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 12, borderLeftWidth: 4, elevation: 2 },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 4 },

  totalValueCard: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 12, borderRadius: 8, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  totalValueLabel: { fontSize: 12, color: '#666' },
  totalValueAmount: { fontSize: 20, fontWeight: 'bold', color: '#1976d2', marginTop: 4 },

  filterSection: { paddingHorizontal: 12, marginBottom: 12 },
  filterButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  filterButtonActive: { borderColor: 'transparent' },
  filterButtonText: { fontSize: 12, color: '#666', marginLeft: 6, fontWeight: '500' },
  filterButtonTextActive: { color: '#fff' },

  searchContainer: { paddingHorizontal: 12, paddingVertical: 8 },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: '#333' },

  listContent: { paddingHorizontal: 12, paddingBottom: 20 },
  inventoryItem: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, overflow: 'hidden', elevation: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
  productCode: { fontSize: 11, color: '#999' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, flexDirection: 'row', alignItems: 'center' },
  statusLabel: { fontSize: 10, color: '#fff', marginLeft: 4, fontWeight: '600' },

  itemDetails: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f9f9f9', borderTopWidth: 1, borderTopColor: '#eee' },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' },
  detailLabel: { fontSize: 11, color: '#666' },
  detailValue: { fontSize: 11, color: '#333', fontWeight: '500', textAlign: 'right' },

  itemActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee' },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  actionButtonText: { fontSize: 12, color: '#1976d2', marginLeft: 6, fontWeight: '500' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#999' },
});
