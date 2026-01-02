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
 * ProductUnitConversions - Component to manage product unit conversions (đơn vị chuyển đổi)
 * Shows list of unit conversions with add/edit/delete modal functionality
 */
export default function ProductUnitConversions({
  conversions = [],
  units = [],
  onUpdate,
  loading = false,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedConversion, setSelectedConversion] = useState(null);
  const [formData, setFormData] = useState({
    from_unit_id: null,
    to_unit_id: null,
    conversion_factor: '',
  });
  const [unitPickerVisible, setUnitPickerVisible] = useState(false);
  const [pickingField, setPickingField] = useState(null); // 'from' or 'to'

  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      from_unit_id: null,
      to_unit_id: null,
      conversion_factor: '',
    });
    setSelectedConversion(null);
    setModalVisible(true);
  };

  const openEditModal = (conversion) => {
    setModalMode('edit');
    setFormData({
      from_unit_id: conversion.from_unit_id,
      to_unit_id: conversion.to_unit_id,
      conversion_factor: conversion.conversion_factor?.toString() || '',
    });
    setSelectedConversion(conversion);
    setModalVisible(true);
  };

  const openViewModal = (conversion) => {
    setModalMode('view');
    setFormData({
      from_unit_id: conversion.from_unit_id,
      to_unit_id: conversion.to_unit_id,
      conversion_factor: conversion.conversion_factor?.toString() || '',
    });
    setSelectedConversion(conversion);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.from_unit_id || !formData.to_unit_id) {
      Alert.error('Lỗi', 'Vui lòng chọn đơn vị nguồn và đơn vị đích');
      return;
    }

    if (!formData.conversion_factor || parseFloat(formData.conversion_factor) <= 0) {
      Alert.error('Lỗi', 'Vui lòng nhập hệ số chuyển đổi hợp lệ');
      return;
    }

    if (formData.from_unit_id === formData.to_unit_id) {
      Alert.error('Lỗi', 'Đơn vị nguồn và đơn vị đích không được giống nhau');
      return;
    }

    const newConversion = {
      ...selectedConversion,
      from_unit_id: formData.from_unit_id,
      to_unit_id: formData.to_unit_id,
      conversion_factor: parseFloat(formData.conversion_factor),
    };

    let updatedConversions;
    if (modalMode === 'add') {
      updatedConversions = [...conversions, newConversion];
    } else {
      updatedConversions = conversions.map((c) =>
        c.id === selectedConversion.id ? newConversion : c
      );
    }

    onUpdate?.(updatedConversions);
    setModalVisible(false);
  };

  const handleDelete = (conversion) => {
    Alert.confirm(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa quy tắc chuyển đổi này?',
      () => {
        const updatedConversions = conversions.filter((c) => c.id !== conversion.id);
        onUpdate?.(updatedConversions);
      },
      undefined,
      'Xóa',
      'Hủy'
    );
  };

  const getUnitName = (unitId) => {
    const unit = units.find((u) => u.id === unitId);
    return unit ? unit.name : 'N/A';
  };

  const openUnitPicker = (field) => {
    setPickingField(field);
    setUnitPickerVisible(true);
  };

  const handleUnitSelect = (unitId) => {
    if (pickingField === 'from') {
      setFormData({ ...formData, from_unit_id: unitId });
    } else {
      setFormData({ ...formData, to_unit_id: unitId });
    }
    setUnitPickerVisible(false);
  };

  const renderConversionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.conversionItem}
      onPress={() => openViewModal(item)}
    >
      <View style={styles.conversionItemLeft}>
        <View style={styles.conversionRow}>
          <View style={styles.unitBox}>
            <Text style={styles.unitText}>{getUnitName(item.from_unit_id)}</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#666" style={styles.arrow} />
          <View style={styles.unitBox}>
            <Text style={styles.unitText}>{getUnitName(item.to_unit_id)}</Text>
          </View>
        </View>
        <Text style={styles.factorText}>
          1 {getUnitName(item.from_unit_id)} = {item.conversion_factor}{' '}
          {getUnitName(item.to_unit_id)}
        </Text>
      </View>
      <View style={styles.conversionItemRight}>
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

  const renderUnitPicker = () => (
    <Modal visible={unitPickerVisible} transparent animationType="fade">
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContent}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>
              Chọn {pickingField === 'from' ? 'đơn vị nguồn' : 'đơn vị đích'}
            </Text>
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
                <Text style={styles.pickerItemText}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.pickerItemDesc}>{item.description}</Text>
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
                ? 'Thêm quy tắc chuyển đổi'
                : modalMode === 'edit'
                ? 'Sửa quy tắc chuyển đổi'
                : 'Chi tiết chuyển đổi'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.modalForm}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Đơn vị nguồn *</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => modalMode !== 'view' && openUnitPicker('from')}
                disabled={modalMode === 'view'}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    !formData.from_unit_id && styles.placeholderText,
                  ]}
                >
                  {formData.from_unit_id
                    ? getUnitName(formData.from_unit_id)
                    : 'Chọn đơn vị'}
                </Text>
                {modalMode !== 'view' && (
                  <Ionicons name="chevron-down" size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.conversionPreview}>
              <Ionicons name="swap-vertical" size={32} color="#007AFF" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Đơn vị đích *</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => modalMode !== 'view' && openUnitPicker('to')}
                disabled={modalMode === 'view'}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    !formData.to_unit_id && styles.placeholderText,
                  ]}
                >
                  {formData.to_unit_id
                    ? getUnitName(formData.to_unit_id)
                    : 'Chọn đơn vị'}
                </Text>
                {modalMode !== 'view' && (
                  <Ionicons name="chevron-down" size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Hệ số chuyển đổi *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 1000 (1 kg = 1000 gram)"
                value={formData.conversion_factor}
                onChangeText={(text) =>
                  setFormData({ ...formData, conversion_factor: text })
                }
                keyboardType="numeric"
                editable={modalMode !== 'view'}
              />
              {formData.from_unit_id && formData.to_unit_id && formData.conversion_factor && (
                <Text style={styles.helperText}>
                  1 {getUnitName(formData.from_unit_id)} = {formData.conversion_factor}{' '}
                  {getUnitName(formData.to_unit_id)}
                </Text>
              )}
            </View>
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
          Đơn vị chuyển đổi ({conversions.length})
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {conversions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="swap-horizontal-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có quy tắc chuyển đổi nào</Text>
          <Text style={styles.emptySubtext}>
            Nhấn nút "Thêm" để tạo quy tắc chuyển đổi mới
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversions}
          renderItem={renderConversionItem}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Modals */}
      {renderModal()}
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
  conversionItem: {
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
  conversionItemLeft: {
    flex: 1,
  },
  conversionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  unitBox: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
  },
  arrow: {
    marginHorizontal: 10,
  },
  factorText: {
    fontSize: 13,
    color: '#666',
  },
  conversionItemRight: {
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
  placeholderText: {
    color: '#999',
  },
  conversionPreview: {
    alignItems: 'center',
    marginVertical: 10,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
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
    maxHeight: '60%',
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
  pickerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  pickerItemDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
