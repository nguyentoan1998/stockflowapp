import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  Animated,
  Alert,
  Dimensions 
} from 'react-native';
import { 
  Card, 
  Text, 
  Button, 
  FAB,
  Searchbar,
  Chip,
  IconButton,
  Menu
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../contexts/ApiContext';

const { width } = Dimensions.get('window');

export default function WarehouseManagementScreen() {
  const { api } = useApi();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState({});
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadWarehouses();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

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

  const toggleMenu = (warehouseId) => {
    setMenuVisible(prev => ({
      ...prev,
      [warehouseId]: !prev[warehouseId]
    }));
  };

  const handleDeleteWarehouse = async (warehouseId) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa kho hàng này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/warehouses/${warehouseId}`);
              setWarehouses(prev => prev.filter(w => w.id !== warehouseId));
              Alert.alert('Thành công', 'Đã xóa kho hàng');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa kho hàng');
            }
          }
        }
      ]
    );
  };

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    warehouse.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock inventory data for each warehouse
  const mockInventoryData = {
    total_products: Math.floor(Math.random() * 500) + 100,
    low_stock: Math.floor(Math.random() * 20) + 5,
    out_of_stock: Math.floor(Math.random() * 10),
    total_value: Math.floor(Math.random() * 1000000) + 500000,
  };

  const renderStatsHeader = () => (
    <LinearGradient
      colors={['#FF5722', '#FF7043']}
      style={styles.headerCard}
    >
      <View style={styles.headerContent}>
        <MaterialCommunityIcons name="warehouse" size={40} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Quản lý kho hàng</Text>
        <Text style={styles.headerSubtitle}>
          {warehouses.length} kho hàng đang hoạt động
        </Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {warehouses.reduce((sum, w) => sum + (mockInventoryData.total_products || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Sản phẩm</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {warehouses.reduce((sum, w) => sum + (mockInventoryData.total_value || 0), 0).toLocaleString('vi-VN')}₫
            </Text>
            <Text style={styles.statLabel}>Tổng giá trị</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  const renderWarehouseCard = (warehouse, index) => (
    <Animated.View
      key={warehouse.id}
      style={[
        styles.warehouseItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Card style={styles.warehouseCard} elevation={3}>
        <Card.Content style={styles.warehouseContent}>
          <View style={styles.warehouseHeader}>
            <View style={styles.warehouseInfo}>
              <View style={styles.warehouseTitleRow}>
                <MaterialCommunityIcons name="warehouse" size={24} color="#FF5722" />
                <Text variant="titleMedium" style={styles.warehouseName}>
                  {warehouse.name}
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.warehouseCode}>
                Mã kho: {warehouse.code}
              </Text>
            </View>
            
            <Menu
              visible={menuVisible[warehouse.id]}
              onDismiss={() => toggleMenu(warehouse.id)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => toggleMenu(warehouse.id)}
                />
              }
            >
              <Menu.Item
                leadingIcon="pencil"
                onPress={() => {
                  toggleMenu(warehouse.id);
                  Alert.alert('Chức năng', 'Sửa thông tin kho đang phát triển');
                }}
                title="Sửa"
              />
              <Menu.Item
                leadingIcon="eye"
                onPress={() => {
                  toggleMenu(warehouse.id);
                  Alert.alert('Chi tiết', `Xem chi tiết kho: ${warehouse.name}`);
                }}
                title="Xem chi tiết"
              />
              <Menu.Item
                leadingIcon="delete"
                onPress={() => {
                  toggleMenu(warehouse.id);
                  handleDeleteWarehouse(warehouse.id);
                }}
                title="Xóa"
              />
            </Menu>
          </View>

          {warehouse.description && (
            <Text style={styles.warehouseDescription}>
              {warehouse.description}
            </Text>
          )}

          {warehouse.address && (
            <View style={styles.addressRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
              <Text style={styles.addressText}>{warehouse.address}</Text>
            </View>
          )}

          {warehouse.phone && (
            <View style={styles.contactRow}>
              <MaterialCommunityIcons name="phone" size={16} color="#666" />
              <Text style={styles.contactText}>{warehouse.phone}</Text>
            </View>
          )}

          {/* Inventory Stats */}
          <View style={styles.inventoryStats}>
            <Text variant="titleSmall" style={styles.inventoryTitle}>
              Thống kê tồn kho
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.inventoryStatItem}>
                <MaterialCommunityIcons name="package-variant" size={20} color="#2196F3" />
                <Text style={styles.inventoryStatNumber}>{mockInventoryData.total_products}</Text>
                <Text style={styles.inventoryStatLabel}>Sản phẩm</Text>
              </View>
              
              <View style={styles.inventoryStatItem}>
                <MaterialCommunityIcons name="alert" size={20} color="#FF9800" />
                <Text style={styles.inventoryStatNumber}>{mockInventoryData.low_stock}</Text>
                <Text style={styles.inventoryStatLabel}>Sắp hết</Text>
              </View>
              
              <View style={styles.inventoryStatItem}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#f44336" />
                <Text style={styles.inventoryStatNumber}>{mockInventoryData.out_of_stock}</Text>
                <Text style={styles.inventoryStatLabel}>Hết hàng</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.warehouseActions}>
            <Button
              mode="outlined"
              compact
              icon="package-variant"
              onPress={() => navigation.navigate('InventoryCheckScreen', { warehouseId: warehouse.id, warehouseName: warehouse.name })}
              style={styles.actionButton}
            >
              Tồn kho
            </Button>
            
            <Button
              mode="contained"
              compact
              icon="transfer"
              onPress={() => Alert.alert('Chức năng', 'Nhập/xuất hàng đang phát triển')}
              style={styles.actionButton}
              buttonColor="#FF5722"
            >
              Nhập/Xuất
            </Button>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {renderStatsHeader()}

        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Tìm kiếm kho hàng..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
        </View>

        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          style={styles.warehousesList}
        >
          {filteredWarehouses.map(renderWarehouseCard)}
          
          {filteredWarehouses.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="warehouse" size={64} color="#DDD" />
              <Text style={styles.emptyText}>Không tìm thấy kho hàng</Text>
            </View>
          )}
        </ScrollView>

        <FAB
          icon="plus"
          label="Thêm kho"
          style={styles.fab}
          onPress={() => Alert.alert('Chức năng', 'Thêm kho hàng đang phát triển')}
          color="#FFFFFF"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerContent: {
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  headerSubtitle: {
    color: '#FFCCBC',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#FFCCBC',
    fontSize: 12,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchbar: {
    backgroundColor: '#FFFFFF',
  },
  warehousesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  warehouseItem: {
    marginBottom: 12,
  },
  warehouseCard: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  warehouseContent: {
    padding: 16,
  },
  warehouseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  warehouseInfo: {
    flex: 1,
  },
  warehouseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  warehouseName: {
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  warehouseCode: {
    color: '#666',
    marginLeft: 32,
  },
  warehouseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666',
  },
  inventoryStats: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  inventoryTitle: {
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  inventoryStatItem: {
    alignItems: 'center',
  },
  inventoryStatNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  inventoryStatLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  warehouseActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF5722',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
});