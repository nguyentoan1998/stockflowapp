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
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';
import ListCard from '../../components/ui/ListCard';

export default function WarehousesScreen() {
  const navigation = useNavigation();
  const { api } = useApi();

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    description: '',
  });

  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useFocusEffect(
    useCallback(() => {
      fetchWarehouses();
    }, [])
  );

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/warehouses');
      const warehousesData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      Alert.error('Lỗi', 'Không thể tải danh sách kho');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWarehouses();
    setRefreshing(false);
  };

  const handleAdd = () => {
    setFormData({ code: '', name: '', location: '', description: '' });
    setSelectedWarehouse(null);
    setModalMode('create');
    setModalVisible(true);
  };

  const handleEdit = (warehouse) => {
    setFormData({
      code: warehouse.code || '',
      name: warehouse.name || '',
      location: warehouse.location || '',
      description: warehouse.description || '',
    });
    setSelectedWarehouse(warehouse);
    setModalMode('edit');
    setModalVisible(true);
  };

  const handleView = (warehouse) => {
    setFormData({
      code: warehouse.code || '',
      name: warehouse.name || '',
      location: warehouse.location || '',
      description: warehouse.description || '',
    });
    setSelectedWarehouse(warehouse);
    setModalMode('view');
    setModalVisible(true);
  };

  const handleDelete = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    Alert.confirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa kho "${warehouse?.name}"?`,
      async () => {
        const warehouseToDelete = warehouses.find(w => w.id === warehouseId);
        setWarehouses(warehouses.filter(w => w.id !== warehouseId));

        try {
          await api.delete(`/api/warehouses/${warehouseId}`);
          Alert.success('Xóa thành công!', `Kho "${warehouseToDelete?.name}" đã được xóa.`);
        } catch (error) {
          if (warehouseToDelete) {
            setWarehouses(prevWarehouses => [...prevWarehouses, warehouseToDelete]);
          }
          Alert.error('Lỗi', 'Không thể xóa kho. Vui lòng thử lại.');
        }
      }
    );
  };

  const handleModalSubmit = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      Alert.error('Lỗi', 'Vui lòng nhập đầy đủ mã và tên kho');
      return;
    }

    setModalLoading(true);

    try {
      const dataToSend = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        location: formData.location || null,
        description: formData.description || null,
      };

      if (modalMode === 'edit') {
        await api.put(`/api/warehouses/${selectedWarehouse.id}`, dataToSend);
        setWarehouses(warehouses.map(w => w.id === selectedWarehouse.id ? { ...w, ...dataToSend } : w));
        Alert.success('Cập nhật thành công!', 'Thông tin kho đã được cập nhật.');
      } else {
        const response = await api.post('/api/warehouses', dataToSend);
        setWarehouses([response.data, ...warehouses]);
        Alert.success('Tạo thành công!', 'Kho mới đã được thêm vào hệ thống.');
      }

      setModalVisible(false);
      await fetchWarehouses();
    } catch (error) {
      console.error('Error saving warehouse:', error);
      Alert.error('Lỗi', error.response?.data?.message || 'Không thể lưu thông tin kho');
    } finally {
      setModalLoading(false);
    }
  };

  const getFilteredWarehouses = () => {
    return warehouses.filter(warehouse => {
      const searchLower = searchQuery.toLowerCase();
      return (
        warehouse.name?.toLowerCase().includes(searchLower) ||
        warehouse.code?.toLowerCase().includes(searchLower) ||
        warehouse.location?.toLowerCase().includes(searchLower) ||
        warehouse.description?.toLowerCase().includes(searchLower)
      );
    });
  };

  const renderWarehouseItem = ({ item: warehouse }) => (
    <ListCard
      title={warehouse.name}
      subtitle={warehouse.code}
      imageIcon="home-outline"
      details={[
        warehouse.location && {
          label: 'Vị trí',
          value: warehouse.location,
          icon: 'location-outline',
        },
        warehouse.description && {
          label: 'Mô tả',
          value: warehouse.description,
          icon: 'document-text-outline',
        },
      ].filter(Boolean)}
      actions={[
        { label: 'Xem', icon: 'eye', color: '#1976d2', onPress: () => handleView(warehouse) },
        { label: 'Sửa', icon: 'pencil', color: '#4CAF50', onPress: () => handleEdit(warehouse) },
        { label: 'Xóa', icon: 'delete', color: '#F44336', onPress: () => handleDelete(warehouse.id) },
      ]}
    />
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const filteredWarehouses = getFilteredWarehouses();

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <RNTextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm kho..."
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

      {/* List */}
      <FlatList
        data={filteredWarehouses}
        renderItem={renderWarehouseItem}
        keyExtractor={item => item.id?.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có kho nào'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <LinearGradient colors={['#1976d2', '#1565c0']} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={modalMode === 'create' ? ['#4CAF50', '#66BB6A'] : modalMode === 'edit' ? ['#2196F3', '#42A5F5'] : ['#9C27B0', '#BA68C8']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'Thêm kho' : modalMode === 'edit' ? 'Sửa kho' : 'Chi tiết kho'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Mã kho *</Text>
              <RNTextInput
                style={styles.input}
                value={formData.code}
                onChangeText={(text) => setFormData({ ...formData, code: text })}
                placeholder="VD: WH01"
                editable={modalMode !== 'view'}
              />

              <Text style={styles.label}>Tên kho *</Text>
              <RNTextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="VD: Kho chính"
                editable={modalMode !== 'view'}
              />

              <Text style={styles.label}>Vị trí</Text>
              <RNTextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                placeholder="VD: Tầng 1, Tòa A"
                editable={modalMode !== 'view'}
              />

              <Text style={styles.label}>Mô tả</Text>
              <RNTextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Mô tả chi tiết..."
                multiline
                numberOfLines={3}
                editable={modalMode !== 'view'}
              />
            </ScrollView>

            {modalMode !== 'view' && (
              <View style={styles.modalFooter}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)} disabled={modalLoading}>
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleModalSubmit} disabled={modalLoading}>
                  {modalLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>{modalMode === 'create' ? 'Tạo' : 'Lưu'}</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  searchContainer: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: '#333' },
  listContent: { padding: 15 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#999' },
  fab: { position: 'absolute', bottom: 20, right: 20, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  fabGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxWidth: 500, maxHeight: '70%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  modalBody: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, color: '#333', backgroundColor: '#fff' },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', marginRight: 10 },
  saveButton: { backgroundColor: '#1976d2' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
