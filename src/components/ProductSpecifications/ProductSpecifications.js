import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

/**
 * ProductSpecifications - Component to manage product specifications (quy cách)
 * Shows list of specifications with add/edit/delete modal functionality
 */
export default function ProductSpecifications({
  specifications = [],
  warehouses = [],
  onUpdate,
  loading = false,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [formData, setFormData] = useState({
    spec_name: '',
    spec_value: '',
    price: '',
    time: '',
    isfinal: false,
    ware_id: null,
  });

  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      spec_name: '',
      spec_value: '',
      price: '',
      time: '',
      isfinal: false,
      ware_id: null,
    });
    setSelectedSpec(null);
    setModalVisible(true);
  };

  const openEditModal = (spec) => {
    setModalMode('edit');
    setFormData({
      spec_name: spec.spec_name || '',
      spec_value: spec.spec_value || '',
      price: spec.price?.toString() || '',
      time: spec.time?.toString() || '',
      isfinal: spec.isfinal || false,
      ware_id: spec.ware_id || null,
    });
    setSelectedSpec(spec);
    setModalVisible(true);
  };

  const openViewModal = (spec) => {
    setModalMode('view');
    setFormData({
      spec_name: spec.spec_name || '',
      spec_value: spec.spec_value || '',
      price: spec.price?.toString() || '',
      time: spec.time?.toString() || '',
      isfinal: spec.isfinal || false,
      ware_id: spec.ware_id || null,
    });
    setSelectedSpec(spec);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.spec_name.trim() || !formData.spec_value.trim()) {
      Alert.error('Lỗi', 'Vui lòng nhập tên và giá trị quy cách');
      return;
    }

    const newSpec = {
      ...selectedSpec,
      spec_name: formData.spec_name.trim(),
      spec_value: formData.spec_value.trim(),
      price: parseFloat(formData.price) || 0,
      time: parseFloat(formData.time) || 0,
      isfinal: formData.isfinal,
      ware_id: formData.ware_id,
    };

    let updatedSpecs;
    if (modalMode === 'add') {
      updatedSpecs = [...specifications, newSpec];
    } else {
      updatedSpecs = specifications.map((s) =>
        s.id === selectedSpec.id ? newSpec : s
      );
    }

    onUpdate?.(updatedSpecs);
    setModalVisible(false);
  };

  const handleDelete = (spec) => {
    Alert.confirm(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa quy cách này?',
      () => {
        const updatedSpecs = specifications.filter((s) => s.id !== spec.id);
        onUpdate?.(updatedSpecs);
      },
      undefined,
      'Xóa',
      'Hủy'
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  const getWarehouseName = (wareId) => {
    const warehouse = warehouses.find((w) => w.id === wareId);
    return warehouse ? warehouse.name : 'Chưa chọn';
  };

  const renderSpecItem = ({ item }) => (
    <TouchableOpacity
      style={styles.specItem}
      onPress={() => openViewModal(item)}
    >
      <View style={styles.specItemLeft}>
        <Text style={styles.specName}>{item.spec_name}</Text>
        <Text style={styles.specValue}>Giá trị: {item.spec_value}</Text>
        {item.price > 0 && (
          <Text style={styles.specPrice}>{formatPrice(item.price)}</Text>
        )}
      </View>
      <View style={styles.specItemRight}>
        {item.isfinal && (
          <View style={styles.finalBadge}>
            <Text style={styles.finalBadgeText}>Thành phẩm</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderModal = () => (
    <Modal visible={modalVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <CustomAlert {...alertConfig} />
          
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {modalMode === 'add'
                ? 'Thêm quy cách'
                : modalMode === 'edit'
                ? 'Sửa quy cách'
                : 'Chi tiết quy cách'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.modalForm}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tên quy cách *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Kích cỡ, Màu sắc"
                value={formData.spec_name}
                onChangeText={(text) =>
                  setFormData({ ...formData, spec_name: text })
                }
                editable={modalMode !== 'view'}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Giá trị *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: L, XL, Đỏ, Xanh"
                value={formData.spec_value}
                onChangeText={(text) =>
                  setFormData({ ...formData, spec_value: text })
                }
                editable={modalMode !== 'view'}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Giá</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={formData.price}
                onChangeText={(text) =>
                  setFormData({ ...formData, price: text })
                }
                keyboardType="numeric"
                editable={modalMode !== 'view'}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Thời gian (phút)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={formData.time}
                onChangeText={(text) =>
                  setFormData({ ...formData, time: text })
                }
                keyboardType="numeric"
                editable={modalMode !== 'view'}
              />
            </View>

            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() =>
                  modalMode !== 'view' &&
                  setFormData({ ...formData, isfinal: !formData.isfinal })
                }
                disabled={modalMode === 'view'}
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.isfinal && styles.checkboxChecked,
                  ]}
                >
                  {formData.isfinal && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Là thành phẩm</Text>
              </TouchableOpacity>
            </View>

            {warehouses.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Kho</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => {
                    /* TODO: Show warehouse picker */
                  }}
                  disabled={modalMode === 'view'}
                >
                  <Text style={styles.selectButtonText}>
                    {getWarehouseName(formData.ware_id)}
                  </Text>
                  {modalMode !== 'view' && (
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Actions */}
          {modalMode !== 'view' && (
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleSave}
              >
                <Text style={styles.buttonSaveText}>
                  {modalMode === 'add' ? 'Thêm' : 'Lưu'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Quy cách sản phẩm ({specifications.length})
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {specifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có quy cách nào</Text>
          <Text style={styles.emptySubtext}>
            Nhấn nút "Thêm" để tạo quy cách mới
          </Text>
        </View>
      ) : (
        <FlatList
          data={specifications}
          renderItem={renderSpecItem}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Modal */}
      {renderModal()}
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
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    padding: 15,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  specItemLeft: {
    flex: 1,
  },
  specName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  specValue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  specPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  specItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  finalBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  finalBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalForm: {
    padding: 15,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  selectButtonText: {
    fontSize: 14,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  buttonSave: {
    backgroundColor: '#007AFF',
  },
  buttonSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
