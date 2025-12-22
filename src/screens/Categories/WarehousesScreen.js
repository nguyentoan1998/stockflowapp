import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  Portal,
  TextInput,
  Chip,
  Searchbar,
  Menu,
  IconButton,
} from 'react-native-paper';
import CRUDModal, { FormSection } from '../../components/CRUDModal';
import { FormInput } from '../../components/CRUDModal/FormInputs';
import ListCard from '../../components/ui/ListCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon, Ionicons } from '@expo/vector-icons';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';
import { useAuth } from '../../contexts/AuthContext';

export default function WarehousesScreen() {
  const [warehouses, setWarehouses] = useState([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [menuVisible, setMenuVisible] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('asc');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
  });

  const { api } = useApi();
  const { user } = useAuth();

  useEffect(() => {
    loadWarehouses();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    filterWarehouses();
  }, [searchQuery, warehouses, filterStatus, sortOrder]);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/api/warehouses');
      
      // Handle different possible response formats
      if (Array.isArray(response.data)) {
        setWarehouses(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setWarehouses(response.data.data);
      } else if (response.data && response.data.warehouses && Array.isArray(response.data.warehouses)) {
        setWarehouses(response.data.warehouses);
      } else {
        setWarehouses([]);
      }
    } catch (error) {
      Alert.error(
        'Lỗi kết nối',
        `Không thể kết nối tới server.\n\nMã lỗi: ${error.response?.status || 'Network'}\nEndpoint: /api/warehouses`
      );
      setWarehouses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterWarehouses = () => {
    let filtered = warehouses.filter(warehouse => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || (
        warehouse.name.toLowerCase().includes(searchLower) ||
        warehouse.code.toLowerCase().includes(searchLower) ||
        (warehouse.address && warehouse.address.toLowerCase().includes(searchLower))
      );
      
      let matchesStatus = true;
      if (filterStatus === 'active') {
        matchesStatus = warehouse.is_active === true || warehouse.is_active === 1;
      } else if (filterStatus === 'inactive') {
        matchesStatus = warehouse.is_active === false || warehouse.is_active === 0;
      }
      
      return matchesSearch && matchesStatus;
    });
    
    filtered.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB, 'vi') : nameB.localeCompare(nameA, 'vi');
    });
    
    setFilteredWarehouses(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWarehouses();
  };

  const handleAdd = () => {
    setEditingWarehouse(null);
    setModalMode('create');
    setFormData({
      code: '',
      name: '',
      address: '',
    });
    setShowModal(true);
  };

  const handleEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setModalMode('edit');
    setFormData({
      code: warehouse.code || '',
      name: warehouse.name || '',
      address: warehouse.address || '',
    });
    setShowModal(true);
    setMenuVisible({});
  };

  const handleDelete = (warehouseId) => {
    Alert.confirm(
      'Xác nhận xóa kho hàng',
      'Bạn có chắc chắn muốn xóa kho hàng này?\n\nHành động này không thể hoàn tác!',
      () => deleteWarehouse(warehouseId)
    );
    setMenuVisible({});
  };

  const deleteWarehouse = async (warehouseId) => {
    // Optimistic delete - xóa khỏi UI ngay lập tức
    const warehouseToDelete = warehouses.find(warehouse => warehouse.id === warehouseId);
    setWarehouses(warehouses.filter(warehouse => warehouse.id !== warehouseId));
    
    try {
      const response = await api.delete(`/api/warehouses/${warehouseId}`);
      if (response.data.success || response.status === 200) {
        Alert.success(
          'Xóa thành công!',
          `Kho hàng "${warehouseToDelete?.name || ''}" đã được xóa khỏi hệ thống.`
        );
      }
    } catch (error) {
      // Rollback on error - khôi phục warehouse nếu API call thất bại
      if (warehouseToDelete) {
        setWarehouses(prevWarehouses => [...prevWarehouses, warehouseToDelete]);
        Alert.error(
          'Lỗi xóa kho hàng',
          'Không thể xóa kho hàng. Vui lòng kiểm tra kết nối và thử lại.'
        );
      }
    }
  };

  const handleSave = async () => {
    console.log(formData)
    if (!formData.code.trim()) {
      Alert.error(
        'Thiếu thông tin',
        'Vui lòng nhập mã kho hàng để tiếp tục.'
      );
      return;
    }
    
    if (!formData.name.trim()) {
      Alert.error(
        'Thiếu thông tin',
        'Vui lòng nhập tên kho hàng để tiếp tục.'
      );
      return;
    }
    
    try {
      if (editingWarehouse) {
        // Store editing ID before closing modal
        const editingId = editingWarehouse.id;
        
        // Optimistic update - cập nhật UI ngay lập tức
        const optimisticWarehouse = { ...editingWarehouse, ...formData };
        setWarehouses(warehouses.map(warehouse => 
          warehouse.id === editingWarehouse.id ? optimisticWarehouse : warehouse
        ));
        setShowModal(false);
        setEditingWarehouse(null);
        
        // API call in background
        const response = await api.put(`/api/warehouses/${editingId}`, formData);
        if (response.data.success || response.status === 200) {
          Alert.success(
            'Cập nhật thành công!',
            `Thông tin kho hàng "${formData.name}" đã được cập nhật.`
          );
        }
      } else {
        // Optimistic update - thêm warehouse mới vào UI ngay
        const tempId = `temp_${Date.now()}`;
        const optimisticWarehouse = {
          id: tempId,
          ...formData,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setWarehouses([...warehouses, optimisticWarehouse]);
        setShowModal(false);
        
        // API call in background
        const response = await api.post('/api/warehouses', formData);
        
        // Handle different response formats
        let newWarehouseData = null;
        if (response.data?.success && response.data?.data) {
          newWarehouseData = response.data.data;
        } else if (response.data?.id) {
          newWarehouseData = response.data;
        } else if (response.status === 201 || response.status === 200) {
          newWarehouseData = response.data;
        }
        
        if (newWarehouseData) {
          // Replace optimistic warehouse with real data from server
          setWarehouses(prevWarehouses => prevWarehouses.map(warehouse => 
            warehouse.id === tempId ? newWarehouseData : warehouse
          ));
          Alert.success(
            'Thêm mới thành công!',
            `Kho hàng "${formData.name}" đã được thêm vào hệ thống.`
          );
        } else {
          Alert.success(
            'Thêm mới thành công!',
            `Kho hàng "${formData.name}" đã được thêm vào hệ thống.`
          );
        }
      }
    } catch (error) {
      Alert.error(
        'Lỗi lưu kho hàng',
        'Có lỗi xảy ra khi lưu kho hàng. Vui lòng kiểm tra thông tin và thử lại.'
      );
      loadWarehouses();
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteInModal = () => {
    if (editingWarehouse) {
      handleDelete(editingWarehouse.id);
      setShowModal(false);
    }
  };

  const getStatusChip = (isActive) => {
    return (
      <Chip
        mode="flat"
        textStyle={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}
        style={{ 
          backgroundColor: isActive ? '#4CAF50' : '#FF5722',
          elevation: 2,
        }}
        icon={isActive ? 'check-circle' : 'pause-circle'}
      >
        {isActive ? 'Hoạt động' : 'Tạm dừng'}
      </Chip>
    );
  };

  const toggleMenu = (warehouseId) => {
    setMenuVisible(prev => ({
      ...prev,
      [warehouseId]: !prev[warehouseId]
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Kho hàng
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Quản lý thông tin kho bãi và địa điểm lưu trữ
          </Text>
        </View>
        
        <Searchbar
          placeholder="Tìm kiếm kho hàng..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <Chip
              selected={filterStatus === 'all'}
              onPress={() => setFilterStatus('all')}
              style={[styles.filterChip, filterStatus === 'all' && styles.filterChipSelected]}
              textStyle={filterStatus === 'all' && styles.filterChipTextSelected}
            >
              Tất cả ({warehouses.length})
            </Chip>
            <Chip
              selected={filterStatus === 'active'}
              onPress={() => setFilterStatus('active')}
              style={[styles.filterChip, filterStatus === 'active' && styles.filterChipSelected]}
              textStyle={filterStatus === 'active' && styles.filterChipTextSelected}
              icon="check-circle"
            >
              Hoạt động ({warehouses.filter(w => w.is_active === true || w.is_active === 1).length})
            </Chip>
            <Chip
              selected={filterStatus === 'inactive'}
              onPress={() => setFilterStatus('inactive')}
              style={[styles.filterChip, filterStatus === 'inactive' && styles.filterChipSelected]}
              textStyle={filterStatus === 'inactive' && styles.filterChipTextSelected}
              icon="pause-circle"
            >
              Tạm dừng ({warehouses.filter(w => w.is_active === false || w.is_active === 0).length})
            </Chip>
          </ScrollView>
          
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <Icon 
              name={sortOrder === 'asc' ? 'sort-alphabetical-ascending' : 'sort-alphabetical-descending'} 
              size={24} 
              color="#FF9800" 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Warehouses Cards */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <ScrollView
          style={styles.warehousesContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredWarehouses.map((warehouse) => (
            <ListCard
              key={warehouse.id}
              title={warehouse.name}
              subtitle={`#${warehouse.code}`}
              imageIcon="warehouse"
              badge={{
                text: warehouse.is_active ? 'Hoạt động' : 'Ngừng',
                color: warehouse.is_active ? '#4CAF50' : '#F44336',
                bgColor: warehouse.is_active ? '#E8F5E9' : '#FFEBEE',
                icon: warehouse.is_active ? 'check-circle' : 'close-circle',
              }}
              statusDot={{
                color: warehouse.is_active ? '#4CAF50' : '#F44336',
              }}
              details={[
                warehouse.address && { 
                  icon: 'map-marker', 
                  text: warehouse.address,
                  color: '#666',
                },
              ].filter(Boolean)}
              actions={[
                {
                  label: 'Sửa',
                  icon: 'pencil',
                  color: '#4CAF50',
                  onPress: () => handleEdit(warehouse),
                },
                {
                  label: 'Xóa',
                  icon: 'delete',
                  color: '#F44336',
                  onPress: () => handleDelete(warehouse.id),
                },
              ]}
              onPress={() => handleEdit(warehouse)}
            />
          ))}
          
          {filteredWarehouses.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="warehouse" size={64} color="#ccc" />
              <Text variant="bodyLarge" style={styles.emptyText}>
                {searchQuery ? 'Không tìm thấy kho hàng phù hợp' : 'Chưa có kho hàng nào'}
              </Text>
            </View>
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <CRUDModal
        visible={showModal}
        onDismiss={() => setShowModal(false)}
        mode={modalMode}
        title={modalMode === 'create' ? 'Thêm kho hàng mới' : 'Sửa kho hàng'}
        icon="warehouse"
        onSubmit={handleSave}
        onDelete={modalMode === 'edit' ? handleDeleteInModal : null}
        loading={saveLoading}
      >
        <FormSection title="Thông tin kho hàng">
          <FormInput
            label="Mã kho hàng *"
            value={formData.code}
            onChangeText={(text) => setFormData({...formData, code: text.toUpperCase()})}
            icon="tag"
            placeholder="VD: WH001, MAIN_STORE"
            autoCapitalize="characters"
          />
          
          <FormInput
            label="Tên kho hàng *"
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
            icon="warehouse"
            placeholder="VD: Kho chính, Kho nguyên liệu"
          />
          
          <FormInput
            label="Địa chỉ"
            value={formData.address}
            onChangeText={(text) => setFormData({...formData, address: text})}
            icon="map-marker"
            multiline
            numberOfLines={2}
            placeholder="Nhập địa chỉ kho hàng..."
          />
        </FormSection>
      </CRUDModal>

      {/* Custom Alert */}
      <CustomAlert {...alertConfig} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerContent: {
    marginBottom: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#666',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
    marginBottom: 16,
  },
  searchInput: {
    fontSize: 14,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
  },
  filterRow: {
    flex: 1,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  filterChipSelected: {
    backgroundColor: '#FF9800',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  sortButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  warehousesContainer: {
    flex: 1,
  },
  warehouseCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  warehouseCardContent: {
    padding: 16,
  },
  warehouseCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  warehouseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  warehouseInfo: {
    flex: 1,
    marginRight: 12,
  },
  warehouseActions: {
    alignItems: 'flex-end',
  },
  warehouseName: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
    fontSize: 16,
  },
  warehouseCode: {
    color: '#FF9800',
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  warehouseAddress: {
    color: '#666',
    fontSize: 13,
  },
  warehouseDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  warehouseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  statText: {
    color: '#666',
    marginLeft: 6,
    fontSize: 12,
  },
  menuButton: {
    margin: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#999',
    marginTop: 16,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalKeyboardView: {
    maxHeight: '100%',
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  modalActions: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  input: {
    marginBottom: 12,
  },
});