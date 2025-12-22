import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from './CustomAlert';
import { createAlertHelper } from '../utils/alertHelper';

const ProductUnitConversions = ({ conversions, onUpdate, units, baseUnitId }) => {
  const [convs, setConvs] = useState(conversions || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentConv, setCurrentConv] = useState({
    from_unit_id: baseUnitId || null,
    to_unit_id: null,
    conversion_factor: '1',
  });
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  // Normalize units to always be an array
  const unitsList = Array.isArray(units) ? units : (units?.data || []);
  
  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  // Update local state when conversions prop changes
  useEffect(() => {
    setConvs(conversions || []);
  }, [conversions]);

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getUnitName = (unitId) => {
    const unit = unitsList.find(u => u.id === unitId);
    return unit ? `${unit.name} (${unit.code})` : 'N/A';
  };

  const handleAdd = () => {
    setCurrentConv({
      from_unit_id: baseUnitId, // Always use baseUnitId as from_unit
      to_unit_id: null,
      conversion_factor: '1',
    });
    setEditingIndex(null);
    setShowAddModal(true);
  };

  const handleEdit = (index) => {
    setCurrentConv({ ...convs[index] });
    setEditingIndex(index);
    setShowAddModal(true);
  };

  const handleDelete = (index) => {
    const newConvs = convs.filter((_, i) => i !== index);
    setConvs(newConvs);
    onUpdate(newConvs);
  };

  const handleSave = () => {
    if (!currentConv.to_unit_id) {
      Alert.alert('Lỗi', 'Vui lòng chọn đơn vị chuyển đổi');
      return;
    }

    if (baseUnitId && currentConv.to_unit_id === baseUnitId) {
      Alert.alert('Lỗi', 'Đơn vị chuyển đổi không thể trùng với đơn vị cơ bản');
      return;
    }

    const factor = parseFloat(currentConv.conversion_factor);
    if (isNaN(factor) || factor <= 0) {
      Alert.alert('Lỗi', 'Hệ số chuyển đổi phải là số dương');
      return;
    }

    // Check for duplicate conversion (same to_unit_id since from_unit_id is always baseUnitId)
    const isDuplicate = convs.some((conv, idx) => 
      idx !== editingIndex && 
      conv.to_unit_id === currentConv.to_unit_id
    );

    if (isDuplicate) {
      Alert.alert('Lỗi', 'Chuyển đổi này đã tồn tại');
      return;
    }

    let newConvs;
    if (editingIndex !== null) {
      newConvs = convs.map((conv, i) => i === editingIndex ? currentConv : conv);
    } else {
      newConvs = [...convs, currentConv];
    }

    setConvs(newConvs);
    onUpdate(newConvs);
    setShowAddModal(false);
  };

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Ionicons name="swap-horizontal-outline" size={20} color="#666" />
          <Text style={styles.title}>Đơn vị chuyển đổi</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add-circle" size={28} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {convs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="swap-horizontal-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có chuyển đổi nào</Text>
          <Text style={styles.emptySubtext}>Nhấn + để thêm chuyển đổi đơn vị</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {convs.map((conv, index) => (
            <Animated.View 
              key={index} 
              style={[
                styles.convCard,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.convContent}>
                <View style={styles.convRow}>
                  <View style={styles.unitBox}>
                    <Text style={styles.unitLabel}>Từ</Text>
                    <Text style={styles.unitText}>{getUnitName(conv.from_unit_id)}</Text>
                  </View>
                  
                  <View style={styles.arrowContainer}>
                    <Ionicons name="arrow-forward" size={24} color="#2196F3" />
                    <Text style={styles.factorText}>x{conv.conversion_factor}</Text>
                  </View>
                  
                  <View style={styles.unitBox}>
                    <Text style={styles.unitLabel}>Đến</Text>
                    <Text style={styles.unitText}>{getUnitName(conv.to_unit_id)}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.convActions}>
                <TouchableOpacity onPress={() => handleEdit(index)} style={styles.iconButton}>
                  <Ionicons name="create-outline" size={20} color="#FF9800" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(index)} style={styles.iconButton}>
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            </Animated.View>
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
                {editingIndex !== null ? 'Sửa chuyển đổi' : 'Thêm chuyển đổi'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Đơn vị chuyển đổi *</Text>
              <TouchableOpacity
                style={styles.selectButton}
                activeOpacity={0.7}
                onPress={() => setShowUnitDropdown(!showUnitDropdown)}
              >
                <Text style={[styles.selectText, !currentConv.to_unit_id && styles.selectPlaceholder]}>
                  {currentConv.to_unit_id
                    ? getUnitName(currentConv.to_unit_id)
                    : '-- Chọn đơn vị --'}
                </Text>
                <Ionicons name={showUnitDropdown ? "chevron-up" : "chevron-down"} size={20} color="#999" />
              </TouchableOpacity>

              {/* Inline Dropdown */}
              {showUnitDropdown && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {unitsList && unitsList.length > 0 ? (
                      unitsList
                        .filter(unit => !unit.is_base_unit && unit.id !== baseUnitId)
                        .map((unit) => (
                          <TouchableOpacity
                            key={unit.id}
                            style={[
                              styles.dropdownItem,
                              currentConv.to_unit_id === unit.id && styles.dropdownItemSelected
                            ]}
                            onPress={() => {
                              setCurrentConv({ ...currentConv, to_unit_id: unit.id, from_unit_id: baseUnitId });
                              setShowUnitDropdown(false);
                            }}
                          >
                            <Text style={[
                              styles.dropdownItemText,
                              currentConv.to_unit_id === unit.id && styles.dropdownItemTextSelected
                            ]}>
                              {unit.name} ({unit.code})
                            </Text>
                            {currentConv.to_unit_id === unit.id && (
                              <Ionicons name="checkmark-circle" size={20} color="#2196F3" />
                            )}
                          </TouchableOpacity>
                        ))
                    ) : (
                      <View style={styles.dropdownEmpty}>
                        <Text style={styles.dropdownEmptyText}>Không có đơn vị</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.label}>Hệ số chuyển đổi *</Text>
              <TextInput
                style={styles.input}
                value={currentConv.conversion_factor?.toString()}
                onChangeText={(text) => setCurrentConv({ ...currentConv, conversion_factor: text })}
                keyboardType="numeric"
                placeholder="1"
              />

              {baseUnitId && (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={18} color="#666" />
                  <Text style={styles.infoText}>
                    Từ đơn vị: <Text style={styles.infoTextBold}>{getUnitName(baseUnitId)}</Text>
                  </Text>
                </View>
              )}

              <View style={styles.exampleBox}>
                <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
                <Text style={styles.exampleText}>
                  VD: 1 Thùng = 12 Chai (hệ số = 12)
                </Text>
              </View>
            </View>

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
    color: '#424242',
    marginLeft: 8,
    letterSpacing: 0.25,
  },
  addButton: {
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
  convCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  convContent: {
    flex: 1,
  },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitBox: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  unitLabel: {
    fontSize: 10,
    color: '#9e9e9e',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  arrowContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  factorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2196F3',
    marginTop: 2,
  },
  convActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
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
    maxHeight: '75%',
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
  modalBody: {
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
    color: '#212121',
    minHeight: 48,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
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
  exampleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  exampleText: {
    fontSize: 13,
    color: '#2196F3',
    marginLeft: 8,
    flex: 1,
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
  pickerContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
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
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerItemTextSelected: {
    fontWeight: '600',
    color: '#1976D2',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  infoTextBold: {
    fontWeight: '600',
    color: '#333',
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

export default ProductUnitConversions;
