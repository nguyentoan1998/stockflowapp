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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

/**
 * ProductBOM - Component to manage product Bill of Materials (định mức nguyên liệu)
 * Shows list of materials required with add/edit/delete modal functionality
 */
export default function ProductBOM({
  bom = [],
  materials = [],
  units = [],
  onUpdate,
  loading = false,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    material_id: null,
    quantity: '',
    unit_id: null,
  });
  const [materialPickerVisible, setMaterialPickerVisible] = useState(false);
  const [unitPickerVisible, setUnitPickerVisible] = useState(false);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');

  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      material_id: null,
      quantity: '',
      unit_id: null,
    });
    setSelectedItem(null);
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setFormData({
      material_id: item.material_id,
      quantity: item.quantity?.toString() || '',
      unit_id: item.unit_id,
    });
    setSelectedItem(item);
    setModalVisible(true);
  };

  const openViewModal = (item) => {
    setModalMode('view');
    setFormData({
      material_id: item.material_id,
      quantity: item.quantity?.toString() || '',
      unit_id: item.unit_id,
    });
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.material_id) {
      Alert.error('Lỗi', 'Vui lòng chọn nguyên liệu');
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      Alert.error('Lỗi', 'Vui lòng nhập số lượng hợp lệ');
      return;
    }

    if (!formData.unit_id) {
      Alert.error('Lỗi', 'Vui lòng chọn đơn vị tính');
      return;
    }

    // Check if material already exists in BOM (when adding)
    if (modalMode === 'add') {
      const existingItem = bom.find((item) => item.material_id === formData.material_id);
      if (existingItem) {
        Alert.error('Lỗi', 'Nguyên liệu này đã có trong danh sách định mức');
        return;
      }
    }

    const newItem = {
      ...selectedItem,
      material_id: formData.material_id,
      quantity: parseFloat(formData.quantity),
      unit_id: formData.unit_id,
    };

    let updatedBOM;
    if (modalMode === 'add') {
      updatedBOM = [...bom, newItem];
    } else {
      updatedBOM = bom.map((item) =>
        item.id === selectedItem.id ? newItem : item
      );
    }

    onUpdate?.(updatedBOM);
    setModalVisible(false);
  };

  const handleDelete = (item) => {
    Alert.confirm(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa nguyên liệu này khỏi định mức?',
      () => {
        const updatedBOM = bom.filter((bomItem) => bomItem.id !== item.id);
        onUpdate?.(updatedBOM);
      },
      undefined,
      'Xóa',
      'Hủy'
    );
  };

  const getMaterialName = (materialId) => {
    const material = materials.find((m) => m.id === materialId);
    return material ? material.name : 'N/A';
  };

  const getMaterialCode = (materialId) => {
    const material = materials.find((m) => m.id === materialId);
    return material ? material.code : '';
  };

  const getUnitName = (unitId) => {
    const unit = units.find((u) => u.id === unitId);
    return unit ? unit.name : 'N/A';
  };

  const handleMaterialSelect = (materialId) => {
    setFormData({ ...formData, material_id: materialId });
    setMaterialPickerVisible(false);
    setMaterialSearchQuery('');
  };

  const handleUnitSelect = (unitId) => {
    setFormData({ ...formData, unit_id: unitId });
    setUnitPickerVisible(false);
  };

  const getFilteredMaterials = () => {
    if (!materialSearchQuery.trim()) return materials;
    
    const query = materialSearchQuery.toLowerCase();
    return materials.filter(
      (m) =>
        m.name?.toLowerCase().includes(query) ||
        m.code?.toLowerCase().includes(query)
    );
  };

  const renderBOMItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bomItem}
      onPress={() => openViewModal(item)}
    >
      <View style={styles.bomItemLeft}>
        <Text style={styles.materialName}>{getMaterialName(item.material_id)}</Text>
        <Text style={styles.materialCode}>{getMaterialCode(item.material_id)}</Text>
        <View style={styles.quantityRow}>
          <Text style={styles.quantityText}>
            Số lượng: {item.quantity} {getUnitName(item.unit_id)}
          </Text>
        </View>
      </View>
      <View style={styles.bomItemRight}>
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

  const renderMaterialPicker = () => {
    const filteredMaterials = getFilteredMaterials();
    
    return (
      <Modal visible={materialPickerVisible} transparent animationType="fade">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Chọn nguyên liệu</Text>
              <TouchableOpacity onPress={() => {
                setMaterialPickerVisible(false);
                setMaterialSearchQuery('');
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm nguyên liệu..."
                value={materialSearchQuery}
                onChangeText={setMaterialSearchQuery}
              />
            </View>

            <FlatList
              data={filteredMaterials}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => handleMaterialSelect(item.id)}
                >
                  <View>
                    <Text style={styles.pickerItemText}>{item.name}</Text>
                    <Text style={styles.pickerItemCode}>{item.code}</Text>
                  </View>
                  {formData.material_id === item.id && (
                    <Ionicons name="checkmark" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>Không tìm thấy nguyên liệu</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    );
  };

  const renderUnitPicker = () => (
    <Modal visible={unitPickerVisible} transparent animationType="fade">
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContent}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Chọn đơn vị tính</Text>
            <TouchableOpacity onPress={() => setUnitPickerVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={units}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => handleUnitSelect(item.id)}
              >
                <View>
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.pickerItemDesc}>{item.description}</Text>
                  )}
                </View>
                {formData.unit_id === item.id && (
                  <Ionicons name="checkmark" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>
      </View>
    </Modal>
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
                ? 'Thêm nguyên liệu'
                : modalMode === 'edit'
                ? 'Sửa nguyên liệu'
                : 'Chi tiết nguyên liệu'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.modalForm}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nguyên liệu *</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => modalMode !== 'view' && setMaterialPickerVisible(true)}
                disabled={modalMode === 'view'}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.selectButtonText,
                      !formData.material_id && styles.placeholderText,
                    ]}
                  >
                    {formData.material_id
                      ? getMaterialName(formData.material_id)
                      : 'Chọn nguyên liệu'}
                  </Text>
                  {formData.material_id && (
                    <Text style={styles.selectButtonSubtext}>
                      {getMaterialCode(formData.material_id)}
                    </Text>
                  )}
                </View>
                {modalMode !== 'view' && (
                  <Ionicons name="chevron-down" size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Số lượng *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập số lượng"
                value={formData.quantity}
                onChangeText={(text) =>
                  setFormData({ ...formData, quantity: text })
                }
                keyboardType="numeric"
                editable={modalMode !== 'view'}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Đơn vị tính *</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => modalMode !== 'view' && setUnitPickerVisible(true)}
                disabled={modalMode === 'view'}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    !formData.unit_id && styles.placeholderText,
                  ]}
                >
                  {formData.unit_id
                    ? getUnitName(formData.unit_id)
                    : 'Chọn đơn vị'}
                </Text>
                {modalMode !== 'view' && (
                  <Ionicons name="chevron-down" size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>

            {formData.material_id && formData.quantity && formData.unit_id && (
              <View style={styles.summaryBox}>
                <Ionicons name="information-circle" size={20} color="#007AFF" />
                <Text style={styles.summaryText}>
                  {formData.quantity} {getUnitName(formData.unit_id)} của{' '}
                  {getMaterialName(formData.material_id)}
                </Text>
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
          Định mức nguyên liệu ({bom.length})
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {bom.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="construct-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có định mức nguyên liệu nào</Text>
          <Text style={styles.emptySubtext}>
            Nhấn nút "Thêm" để thêm nguyên liệu vào định mức
          </Text>
        </View>
      ) : (
        <FlatList
          data={bom}
          renderItem={renderBOMItem}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Modals */}
      {renderModal()}
      {renderMaterialPicker()}
      {renderUnitPicker()}
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
  bomItem: {
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
  bomItemLeft: {
    flex: 1,
  },
  materialName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  materialCode: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  bomItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
  selectButtonSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  placeholderText: {
    color: '#999',
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 8,
    flex: 1,
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
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContent: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  pickerItemCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  pickerItemDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyList: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 14,
    color: '#999',
  },
});
