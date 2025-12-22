import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from './CustomAlert';
import { createAlertHelper } from '../utils/alertHelper';

const ProductSpecifications = ({ specifications, onUpdate, warehouses }) => {
  const [specs, setSpecs] = useState(specifications || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentSpec, setCurrentSpec] = useState({
    spec_value: '', // Mã quy cách
    spec_name: '',
    price: '0',
    time: '0',
    isfinal: false,
    ware_id: null,
  });
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);

  // Normalize warehouses to always be an array
  const warehousesList = Array.isArray(warehouses) ? warehouses : (warehouses?.data || []);
  
  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  // Update local state when specifications prop changes
  useEffect(() => {
    setSpecs(specifications || []);
  }, [specifications]);


  const formatPrice = (value) => {
    if (!value) return '';
    const number = value.toString().replace(/,/g, '');
    if (isNaN(number)) return value;
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const parsePrice = (value) => {
    return value.toString().replace(/,/g, '');
  };

  const handleAdd = () => {
    setCurrentSpec({
      spec_value: '', // Mã quy cách
      spec_name: '',
      price: '0',
      time: '0',
      isfinal: false,
      ware_id: null,
    });
    setEditingIndex(null);
    setShowAddModal(true);
  };

  const handleEdit = (index) => {
    const spec = specs[index];
    setCurrentSpec({
      spec_value: spec.spec_value || '',
      spec_name: spec.spec_name || '',
      price: spec.price?.toString() || '0',
      time: spec.time?.toString() || '0',
      isfinal: spec.isfinal || false,
      ware_id: spec.ware_id || null,
    });
    setEditingIndex(index);
    setShowAddModal(true);
  };

  const handleDelete = (index) => {
    const newSpecs = specs.filter((_, i) => i !== index);
    setSpecs(newSpecs);
    onUpdate(newSpecs);
  };

  const handleSave = () => {
    if (!currentSpec.spec_value || !currentSpec.spec_value.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã quy cách');
      return;
    }

    if (!currentSpec.spec_name || !currentSpec.spec_name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên quy cách');
      return;
    }

    // Validate numeric fields
    const price = currentSpec.price?.toString().trim() || '0';
    const time = currentSpec.time?.toString().trim() || '0';
    
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      Alert.alert('Lỗi', 'Giá phải là số và không âm');
      return;
    }

    if (isNaN(parseFloat(time)) || parseFloat(time) < 0) {
      Alert.alert('Lỗi', 'Thời gian phải là số và không âm');
      return;
    }

    // Clean data before saving
    const cleanSpec = {
      spec_value: currentSpec.spec_value.trim(),
      spec_name: currentSpec.spec_name.trim(),
      price: parseFloat(price),
      time: parseFloat(time),
      isfinal: currentSpec.isfinal || false,
      ware_id: currentSpec.ware_id || null,
    };

    let newSpecs;
    if (editingIndex !== null) {
      newSpecs = specs.map((spec, i) => i === editingIndex ? cleanSpec : spec);
    } else {
      newSpecs = [...specs, cleanSpec];
    }

    setSpecs(newSpecs);
    onUpdate(newSpecs);
    setShowAddModal(false);
  };

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Ionicons name="list-outline" size={20} color="#666" />
          <Text style={styles.title}>Quy cách sản phẩm</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add-circle" size={28} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {specs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có quy cách nào</Text>
          <Text style={styles.emptySubtext}>Nhấn + để thêm quy cách mới</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {specs.map((spec, index) => (
            <View key={index} style={styles.specCard}>
              <View style={styles.specHeader}>
                <View style={styles.specInfo}>
                  <Text style={styles.specName}>{spec.spec_name}</Text>
                  <Text style={styles.specValue}>{spec.spec_value}</Text>
                </View>
                <View style={styles.specActions}>
                  <TouchableOpacity onPress={() => handleEdit(index)} style={styles.iconButton}>
                    <Ionicons name="create-outline" size={20} color="#FF9800" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(index)} style={styles.iconButton}>
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.specDetails}>
                <View style={styles.specDetail}>
                  <Text style={styles.detailLabel}>Giá:</Text>
                  <Text style={styles.detailValue}>{formatPrice(spec.price)} VNĐ</Text>
                </View>
                <View style={styles.specDetail}>
                  <Text style={styles.detailLabel}>Thời gian:</Text>
                  <Text style={styles.detailValue}>{spec.time}h</Text>
                </View>
                {spec.isfinal && (
                  <View style={styles.finalBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.finalText}>Final</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingIndex !== null ? 'Sửa quy cách' : 'Thêm quy cách'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScroll} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.label}>Mã quy cách *</Text>
              <TextInput
                style={styles.input}
                value={currentSpec.spec_value}
                onChangeText={(text) => setCurrentSpec({ ...currentSpec, spec_value: text })}
                placeholder="VD: QC001, SIZE-L, ..."
              />

              <Text style={styles.label}>Tên quy cách *</Text>
              <TextInput
                style={styles.input}
                value={currentSpec.spec_name}
                onChangeText={(text) => setCurrentSpec({ ...currentSpec, spec_name: text })}
                placeholder="VD: Kích thước, Màu sắc, ..."
              />

              <Text style={styles.label}>Giá (VNĐ)</Text>
              <TextInput
                style={styles.input}
                value={formatPrice(currentSpec.price)}
                onChangeText={(text) => setCurrentSpec({ ...currentSpec, price: parsePrice(text) })}
                keyboardType="numeric"
                placeholder="0"
              />

              <Text style={styles.label}>Thời gian (giờ)</Text>
              <TextInput
                style={styles.input}
                value={currentSpec.time?.toString()}
                onChangeText={(text) => setCurrentSpec({ ...currentSpec, time: text })}
                keyboardType="numeric"
                placeholder="0"
              />

              <View style={styles.switchRow}>
                <Text style={styles.label}>Quy cách cuối cùng</Text>
                <Switch
                  value={currentSpec.isfinal}
                  onValueChange={(value) => setCurrentSpec({ ...currentSpec, isfinal: value })}
                />
              </View>

              <Text style={styles.label}>Kho hàng</Text>
              <TouchableOpacity
                style={styles.selectButton}
                activeOpacity={0.7}
                onPress={() => setShowWarehouseDropdown(!showWarehouseDropdown)}
              >
                <Text style={[styles.selectText, !currentSpec.ware_id && styles.selectPlaceholder]}>
                  {currentSpec.ware_id
                    ? (warehousesList?.find(w => w.id === currentSpec.ware_id)?.name || '-- Chọn kho --')
                    : '-- Chọn kho --'}
                </Text>
                <Ionicons name={showWarehouseDropdown ? "chevron-up" : "chevron-down"} size={20} color="#999" />
              </TouchableOpacity>
              
              {/* Inline Dropdown */}
              {showWarehouseDropdown && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setCurrentSpec({ ...currentSpec, ware_id: null });
                        setShowWarehouseDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>-- Không chọn --</Text>
                    </TouchableOpacity>
                    {warehousesList && warehousesList.length > 0 ? (
                      warehousesList.map((warehouse) => (
                        <TouchableOpacity
                          key={warehouse.id}
                          style={[
                            styles.dropdownItem,
                            currentSpec.ware_id === warehouse.id && styles.dropdownItemSelected
                          ]}
                          onPress={() => {
                            setCurrentSpec({ ...currentSpec, ware_id: warehouse.id });
                            setShowWarehouseDropdown(false);
                          }}
                        >
                          <Text style={[
                            styles.dropdownItemText,
                            currentSpec.ware_id === warehouse.id && styles.dropdownItemTextSelected
                          ]}>
                            {warehouse.name}
                          </Text>
                          {currentSpec.ware_id === warehouse.id && (
                            <Ionicons name="checkmark-circle" size={20} color="#2196F3" />
                          )}
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.dropdownEmpty}>
                        <Text style={styles.dropdownEmptyText}>Không có kho hàng</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  addButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    marginVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9e9e9e',
    marginTop: 6,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  specCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  specHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  specInfo: {
    flex: 1,
  },
  specName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  specValue: {
    fontSize: 14,
    color: '#666',
  },
  specActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  specDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  finalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  finalText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScroll: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
    letterSpacing: 0.25,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: '#fafafa',
    minHeight: 48,
    color: '#212121',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    backgroundColor: '#fafafa',
    minHeight: 48,
  },
  selectText: {
    fontSize: 15,
    color: '#212121',
    flex: 1,
  },
  selectPlaceholder: {
    color: '#9e9e9e',
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 6,
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    elevation: 2,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  pickerItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerItemTextSelected: {
    fontWeight: '600',
    color: '#4CAF50',
  },
  emptyPicker: {
    padding: 40,
    alignItems: 'center',
  },
  emptyPickerText: {
    fontSize: 14,
    color: '#999',
  },
  // Inline Dropdown styles
  dropdownContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fff',
    maxHeight: 200,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#fff',
  },
  dropdownItemSelected: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#424242',
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: '#1976D2',
    fontWeight: '600',
  },
  dropdownEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 14,
    color: '#999',
  },
});

export default ProductSpecifications;
