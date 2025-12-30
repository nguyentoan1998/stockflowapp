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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function WarehouseInventoryScreen() {
  const navigation = useNavigation();
  const { api } = useApi();

  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [allInventories, setAllInventories] = useState([]);
  const [filteredInventories, setFilteredInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const warehousesRes = await api.get('/api/warehouses');
      const warehousesData = Array.isArray(warehousesRes.data)
        ? warehousesRes.data
        : (warehousesRes.data?.data || []);
      
      setWarehouses(warehousesData);
      
      if (warehousesData.length > 0) {
        const firstWarehouse = warehousesData[0];
        setSelectedWarehouse(firstWarehouse.id);
        await fetchInventories(firstWarehouse.id);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      Alert.error('Lỗi', 'Không thể tải danh sách kho');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchInventories = async (warehouseId) => {
    try {
      const res = await api.get(`/api/warehouse_inventory/warehouse/${warehouseId}`);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAllInventories(data);
      filterAndSearch(data, searchQuery);
    } catch (error) {
      console.error('Error fetching inventories:', error);
      setAllInventories([]);
      setFilteredInventories([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleWarehouseChange = async (warehouseId) => {
    setSelectedWarehouse(warehouseId);
    await fetchInventories(warehouseId);
  };

  const filterAndSearch = (data, query) => {
    const filtered = data.filter(inv => {
      const searchLower = query.toLowerCase();
      return (
        inv.products?.name?.toLowerCase().includes(searchLower) ||
        inv.products?.code?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredInventories(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    filterAndSearch(allInventories, text);
  };

  const getStatus = (quantity, quantityMin) => {
    const qty = parseFloat(quantity || 0);
    const minQty = parseFloat(quantityMin || 10);
    
    if (qty <= 0) return { label: 'Hết hàng', color: '#f44336', bgColor: '#ffebee' };
    if (qty < minQty) return { label: 'Sắp hết', color: '#ff9800', bgColor: '#fff3e0' };
    return { label: 'Còn hàng', color: '#4CAF50', bgColor: '#e8f5e9' };
  };

  const getStats = () => {
    return {
      total: allInventories.length,
      lowStock: allInventories.filter(i => {
        const qty = parseFloat(i.quantity || 0);
        const minQty = parseFloat(i.products?.quantity_min || 10);
        return qty > 0 && qty < minQty;
      }).length,
      outOfStock: allInventories.filter(i => parseFloat(i.quantity || 0) <= 0).length,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />

      {/* Warehouse Filter - 1 row */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {warehouses.map((warehouse) => (
            <TouchableOpacity
              key={warehouse.id}
              style={[
                styles.filterBtn,
                selectedWarehouse === warehouse.id && styles.filterBtnActive,
              ]}
              onPress={() => handleWarehouseChange(warehouse.id)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  selectedWarehouse === warehouse.id && styles.filterBtnTextActive,
                ]}
              >
                {warehouse.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 3 Stat Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📦</Text>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Sản phẩm</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⚠️</Text>
          <Text style={styles.statNumber}>{stats.lowStock}</Text>
          <Text style={styles.statLabel}>Sắp hết</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>❌</Text>
          <Text style={styles.statNumber}>{stats.outOfStock}</Text>
          <Text style={styles.statLabel}>Hết hàng</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <RNTextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Inventory List - Custom CardView Style */}
      <FlatList
        data={filteredInventories}
        renderItem={({ item }) => {
          const status = getStatus(item.quantity, item.products?.quantity_min);
          return (
            <View style={styles.productCard}>
              <View style={styles.cardLeft}>
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>📦</Text>
                </View>
              </View>

              <View style={styles.cardMiddle}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.products?.name}
                </Text>
                <Text style={styles.productCode} numberOfLines={1}>
                  {item.products?.code}
                </Text>
                <Text style={styles.specCode} numberOfLines={1}>
                  Quy cách: {item.product_specifications?.spec_name || 'N/A'}
                </Text>
                <Text style={styles.updatedText}>
                  Cập nhật: {new Date(item.updated_at || item.created_at).toLocaleDateString('vi-VN')}
                </Text>
                <Text style={styles.priceText}>
                  Tổng giá trị: {(parseFloat(item.quantity || 0) * (item.products?.sale_price || 0)).toLocaleString('vi-VN')}₫
                </Text>
              </View>

              <View style={styles.cardRight}>
                <View style={[styles.quantityBadge, { backgroundColor: status.bgColor }]}>
                  <Text style={[styles.quantityText, { color: status.color }]}>
                    {parseFloat(item.quantity).toFixed(0)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
                  <Text style={[styles.statusLabel, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="inbox" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy sản phẩm' : 'Không có dữ liệu'}
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

  filterSection: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 8, backgroundColor: '#fff' },
  filterBtnActive: { backgroundColor: '#1976d2', borderColor: '#1976d2' },
  filterBtnText: { fontSize: 12, color: '#666', fontWeight: '500' },
  filterBtnTextActive: { color: '#fff' },

  statsContainer: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  statCard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: '#f5f5f5', borderRadius: 8 },
  statIcon: { fontSize: 24 },
  statNumber: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#666', marginTop: 2 },

  searchContainer: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: '#333' },

  listContent: { paddingHorizontal: 12, paddingVertical: 12 },
  productCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, padding: 12, elevation: 2, gap: 12 },
  
  cardLeft: { alignItems: 'center', gap: 6 },
  imagePlaceholder: { width: 80, height: 80, backgroundColor: '#f5f5f5', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  imagePlaceholderText: { fontSize: 40 },

  cardMiddle: { flex: 1, justifyContent: 'space-between' },
  productName: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
  productCode: { fontSize: 10, fontWeight: '700', color: '#666', marginTop: 3 },
  specCode: { fontSize: 13, color: '#333', marginTop: 2 },
  updatedText: { fontSize: 13, color: '#666', marginTop: 3 },
  priceText: { fontSize: 12, fontWeight: '600', color: '#1976d2', marginTop: 4 },

  cardRight: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  quantityBadge: { width: 60, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  quantityText: { fontSize: 16, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusLabel: { fontSize: 11, fontWeight: '600' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#999' },
});
