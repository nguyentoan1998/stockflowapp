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

export default function ProductCategoryScreen() {
  const navigation = useNavigation();
  const { api } = useApi();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true,
  });

  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/product_category');
      const categoriesData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.error('Lỗi', 'Không thể tải danh sách loại sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true,
    });
    setSelectedCategory(null);
    setModalMode('create');
    setModalVisible(true);
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name || '',
      code: category.code || '',
      description: category.description || '',
      is_active: category.is_active !== false,
    });
    setSelectedCategory(category);
    setModalMode('edit');
    setModalVisible(true);
  };

  const handleView = (category) => {
    setFormData({
      name: category.name || '',
      code: category.code || '',
      description: category.description || '',
      is_active: category.is_active !== false,
    });
    setSelectedCategory(category);
    setModalMode('view');
    setModalVisible(true);
  };

  const handleDelete = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    Alert.confirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa loại sản phẩm "${category?.name}"?\n\nHành động này không thể hoàn tác!`,
      async () => {
        const categoryToDelete = categories.find(c => c.id === categoryId);
        setCategories(categories.filter(c => c.id !== categoryId));

        try {
          await api.delete(`/api/product_category/${categoryId}`);
          Alert.success(
            'Xóa thành công!',
            `Loại sản phẩm "${categoryToDelete?.name}" đã được xóa.`
          );
        } catch (error) {
          if (categoryToDelete) {
            setCategories(prevCategories => [...prevCategories, categoryToDelete]);
          }
          Alert.error('Lỗi', 'Không thể xóa loại sản phẩm. Vui lòng thử lại.');
        }
      }
    );
  };

  const handleModalSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.error('Lỗi', 'Vui lòng nhập tên loại sản phẩm');
      return;
    }

    setModalLoading(true);

    try {
      const dataToSend = {
        name: formData.name.trim(),
        code: formData.code.trim() || `CAT${Date.now()}`,
        description: formData.description || null,
        is_active: formData.is_active,
      };

      if (modalMode === 'edit') {
        await api.put(`/api/product_category/${selectedCategory.id}`, dataToSend);
        setCategories(categories.map(c =>
          c.id === selectedCategory.id
            ? { ...c, ...dataToSend }
            : c
        ));
        Alert.success('Cập nhật thành công!', 'Thông tin loại sản phẩm đã được cập nhật.');
      } else {
        const response = await api.post('/api/product_category', dataToSend);
        setCategories([response.data, ...categories]);
        Alert.success('Tạo thành công!', 'Loại sản phẩm mới đã được thêm vào hệ thống.');
      }

      setModalVisible(false);
      await fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.error('Lỗi', error.response?.data?.message || 'Không thể lưu thông tin loại sản phẩm');
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalDismiss = () => {
    setModalVisible(false);
    setSelectedCategory(null);
  };

  const getFilteredCategories = () => {
    return categories.filter(category => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (
        category.name?.toLowerCase().includes(searchLower) ||
        category.code?.toLowerCase().includes(searchLower) ||
        category.description?.toLowerCase().includes(searchLower)
      );

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && category.is_active) ||
        (filterStatus === 'inactive' && !category.is_active);

      return matchesSearch && matchesStatus;
    });
  };

  const renderCategoryItem = ({ item: category }) => {
    const statusConfig = category.is_active
      ? { text: 'Hoạt động', color: '#4CAF50', bg: '#E8F5E9', icon: 'check-circle' }
      : { text: 'Tạm dừng', color: '#FF9800', bg: '#FFF3E0', icon: 'pause-circle' };

    return (
      <ListCard
        title={category.name}
        subtitle={category.code}
      imageIcon="format-list-bulleted"
        badge={{
          text: statusConfig.text,
          color: statusConfig.color,
          bgColor: statusConfig.bg,
          icon: statusConfig.icon,
        }}
        details={[
          category.description && {
            label: 'Mô tả',
            value: category.description,
            icon: 'document-text-outline',
          },
        ].filter(Boolean)}
        actions={[
          {
            label: 'Xem',
            icon: 'eye',
            color: '#1976d2',
            onPress: () => handleView(category),
          },
          {
            label: 'Sửa',
            icon: 'pencil',
            color: '#4CAF50',
            onPress: () => handleEdit(category),
          },
          {
            label: 'Xóa',
            icon: 'delete',
            color: '#F44336',
            onPress: () => handleDelete(category.id),
          },
        ]}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const filteredCategories = getFilteredCategories();

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <RNTextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm loại sản phẩm..."
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'all' && styles.filterChipTextActive]}>
              Tất cả ({categories.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'active' && styles.filterChipActive]}
            onPress={() => setFilterStatus('active')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'active' && styles.filterChipTextActive]}>
              Hoạt động ({categories.filter(c => c.is_active).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'inactive' && styles.filterChipActive]}
            onPress={() => setFilterStatus('inactive')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'inactive' && styles.filterChipTextActive]}>
              Tạm dừng ({categories.filter(c => !c.is_active).length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Category List */}
      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id?.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="list" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có loại sản phẩm nào'}
            </Text>
          </View>
        }
      />

      {/* FAB Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <LinearGradient
          colors={['#1976d2', '#1565c0']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleModalDismiss}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <LinearGradient
              colors={
                modalMode === 'create' ? ['#4CAF50', '#66BB6A'] :
                modalMode === 'edit' ? ['#2196F3', '#42A5F5'] :
                ['#9C27B0', '#BA68C8']
              }
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'Thêm loại sản phẩm' :
                 modalMode === 'edit' ? 'Sửa loại sản phẩm' :
                 'Chi tiết loại sản phẩm'}
              </Text>
              <TouchableOpacity onPress={handleModalDismiss}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Tên loại sản phẩm *</Text>
              <RNTextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="VD: Điện tử"
                editable={modalMode !== 'view'}
              />

              <Text style={styles.label}>Mã loại sản phẩm</Text>
              <RNTextInput
                style={styles.input}
                value={formData.code}
                onChangeText={(text) => setFormData({ ...formData, code: text })}
                placeholder="VD: CAT001"
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

              <View style={styles.switchContainer}>
                <Text style={styles.label}>Trạng thái hoạt động</Text>
                <TouchableOpacity
                  style={[styles.switch, formData.is_active && styles.switchActive]}
                  onPress={() => modalMode !== 'view' && setFormData({ ...formData, is_active: !formData.is_active })}
                  disabled={modalMode === 'view'}
                >
                  <View style={[styles.switchThumb, formData.is_active && styles.switchThumbActive]} />
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            {modalMode !== 'view' && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleModalDismiss}
                  disabled={modalLoading}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleModalSubmit}
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {modalMode === 'create' ? 'Tạo' : 'Lưu'}
                    </Text>
                  )}
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1976d2',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#4CAF50',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#1976d2',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
