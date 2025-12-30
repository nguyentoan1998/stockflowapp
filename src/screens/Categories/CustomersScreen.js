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

export default function CustomersScreen() {
  const navigation = useNavigation();
  const { api } = useApi();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    description: '',
  });

  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [])
  );

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/customers');
      const customersData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.error('Lỗi', 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  };

  const handleAdd = () => {
    setFormData({ code: '', name: '', description: '' });
    setSelectedCustomer(null);
    setModalMode('create');
    setModalVisible(true);
  };

  const handleEdit = (customer) => {
    setFormData({
      code: customer.code || '',
      name: customer.name || '',
      description: customer.description || '',
    });
    setSelectedCustomer(customer);
    setModalMode('edit');
    setModalVisible(true);
  };

  const handleView = (customer) => {
    setFormData({
      code: customer.code || '',
      name: customer.name || '',
      description: customer.description || '',
    });
    setSelectedCustomer(customer);
    setModalMode('view');
    setModalVisible(true);
  };

  const handleDelete = (customerId) => {
    const customer = customers.find(u => u.id === customerId);
    Alert.confirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa khách hàng "${customer?.name}"?`,
      async () => {
        const customerToDelete = customers.find(u => u.id === customerId);
        setCustomers(customers.filter(u => u.id !== customerId));

        try {
          await api.delete(`/api/customers/${customerId}`);
          Alert.success('Xóa thành công!', `Khách hàng "${customerToDelete?.name}" đã được xóa.`);
        } catch (error) {
          if (customerToDelete) {
            setCustomers(prevCustomers => [...prevCustomers, customerToDelete]);
          }
          Alert.error('Lỗi', 'Không thể xóa khách hàng. Vui lòng thử lại.');
        }
      }
    );
  };

  const handleModalSubmit = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      Alert.error('Lỗi', 'Vui lòng nhập đầy đủ mã và tên khách hàng');
      return;
    }

    setModalLoading(true);

    try {
      const dataToSend = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description || null,
      };

      if (modalMode === 'edit') {
        await api.put(`/api/customers/${selectedCustomer.id}`, dataToSend);
        setCustomers(customers.map(u => u.id === selectedCustomer.id ? { ...u, ...dataToSend } : u));
        Alert.success('Cập nhật thành công!', 'Thông tin khách hàng đã được cập nhật.');
      } else {
        const response = await api.post('/api/customers', dataToSend);
        setCustomers([response.data, ...customers]);
        Alert.success('Tạo thành công!', 'Khách hàng mới đã được thêm vào hệ thống.');
      }

      setModalVisible(false);
      await fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      Alert.error('Lỗi', error.response?.data?.message || 'Không thể lưu thông tin khách hàng');
    } finally {
      setModalLoading(false);
    }
  };

  const getFilteredCustomers = () => {
    return customers.filter(customer => {
      const searchLower = searchQuery.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.code?.toLowerCase().includes(searchLower) ||
        customer.description?.toLowerCase().includes(searchLower)
      );
    });
  };

  const renderCustomerItem = ({ item: customer }) => (
    <ListCard
      title={customer.name}
      subtitle={customer.code}
      imageIcon="person-outline"
      details={[
        customer.description && {
          label: 'Mô tả',
          value: customer.description,
          icon: 'document-text-outline',
        },
      ].filter(Boolean)}
      actions={[
        { label: 'Xem', icon: 'eye', color: '#1976d2', onPress: () => handleView(customer) },
        { label: 'Sửa', icon: 'pencil', color: '#4CAF50', onPress: () => handleEdit(customer) },
        { label: 'Xóa', icon: 'delete', color: '#F44336', onPress: () => handleDelete(customer.id) },
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

  const filteredCustomers = getFilteredCustomers();

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <RNTextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm khách hàng..."
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
        data={filteredCustomers}
        renderItem={renderCustomerItem}
        keyExtractor={item => item.id?.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="person-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có khách hàng nào'}
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
                {modalMode === 'create' ? 'Thêm khách hàng' : modalMode === 'edit' ? 'Sửa khách hàng' : 'Chi tiết khách hàng'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Mã khách hàng *</Text>
              <RNTextInput
                style={styles.input}
                value={formData.code}
                onChangeText={(text) => setFormData({ ...formData, code: text })}
                placeholder="VD: KH001"
                editable={modalMode !== 'view'}
              />

              <Text style={styles.label}>Tên khách hàng *</Text>
              <RNTextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="VD: Công ty ABC"
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
