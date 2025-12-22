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

const ProductBOM = ({ bom, onUpdate, products, units }) => {
  const [bomItems, setBomItems] = useState(bom || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentBom, setCurrentBom] = useState({
    material_id: null,
    quantity: '1',
    unit_id: null,
  });
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  
  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  // Update local state when bom prop changes
  useEffect(() => {
    setBomItems(bom || []);
  }, [bom]);

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

  const getMaterialName = (materialId) => {
    const product = products.find(p => p.id === materialId);
    return product ? `${product.name} (${product.code})` : 'N/A';
  };

  const getUnitName = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    return unit ? `${unit.name} (${unit.code})` : 'N/A';
  };

  const handleAdd = () => {
    setCurrentBom({
      material_id: null,
      quantity: '1',
      unit_id: null,
    });
    setEditingIndex(null);
    setShowAddModal(true);
  };

  const handleEdit = (index) => {
    setCurrentBom({ ...bomItems[index] });
    setEditingIndex(index);
    setShowAddModal(true);
  };

  const handleDelete = (index) => {
    const newBom = bomItems.filter((_, i) => i !== index);
    setBomItems(newBom);
    onUpdate(newBom);
  };

  const handleSave = () => {
    if (!currentBom.material_id || !currentBom.unit_id) {
      Alert.alert('Lỗi', 'Vui lòng chọn nguyên liệu và đơn vị');
      return;
    }

    const quantity = parseFloat(currentBom.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Lỗi', 'Số lượng phải là số dương');
      return;
    }

    // Check for duplicate material
    const isDuplicate = bomItems.some((item, idx) => 
      idx !== editingIndex && 
      item.material_id === currentBom.material_id
    );

    if (isDuplicate) {
      Alert.alert('Lỗi', 'Nguyên liệu này đã có trong danh sách');
      return;
    }

    let newBom;
    if (editingIndex !== null) {
      newBom = bomItems.map((item, i) => i === editingIndex ? currentBom : item);
    } else {
      newBom = [...bomItems, currentBom];
    }

    setBomItems(newBom);
    onUpdate(newBom);
    setShowAddModal(false);
  };

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Ionicons name="construct-outline" size={20} color="#666" />
          <Text style={styles.title}>Định mức nguyên liệu (BOM)</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add-circle" size={28} color="#FF9800" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={18} color="#2196F3" />
        <Text style={styles.infoText}>
          Danh sách nguyên liệu cần thiết để sản xuất sản phẩm này
        </Text>
      </View>

      {bomItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="construct-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có định mức nào</Text>
          <Text style={styles.emptySubtext}>Nhấn + để thêm nguyên liệu</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {bomItems.map((item, index) => (
            <Animated.View 
              key={index} 
              style={[
                styles.bomCard,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.bomHeader}>
                <View style={styles.materialIcon}>
                  <Ionicons name="cube" size={22} color="#FF9800" />
                </View>
                <View style={styles.bomInfo}>
                  <Text style={styles.materialName}>{getMaterialName(item.material_id)}</Text>
                  <View style={styles.quantityRow}>
                    <Text style={styles.quantityLabel}>Số lượng:</Text>
                    <Text style={styles.quantityValue}>
                      {item.quantity} {getUnitName(item.unit_id)}
                    </Text>
                  </View>
                </View>
                <View style={styles.bomActions}>
                  <TouchableOpacity onPress={() => handleEdit(index)} style={styles.iconButton}>
                    <Ionicons name="create-outline" size={20} color="#FF9800" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(index)} style={styles.iconButton}>
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
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
                {editingIndex !== null ? 'Sửa định mức' : 'Thêm định mức'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Nguyên liệu *</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowMaterialPicker(true)}
              >
                <Text style={[styles.selectText, !currentBom.material_id && styles.selectPlaceholder]}>
                  {currentBom.material_id
                    ? getMaterialName(currentBom.material_id)
                    : '-- Chọn nguyên liệu --'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>

              <Text style={styles.label}>Số lượng *</Text>
              <TextInput
                style={styles.input}
                value={currentBom.quantity?.toString()}
                onChangeText={(text) => setCurrentBom({ ...currentBom, quantity: text })}
                keyboardType="numeric"
                placeholder="1"
              />

              <Text style={styles.label}>Đơn vị *</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowUnitPicker(true)}
              >
                <Text style={[styles.selectText, !currentBom.unit_id && styles.selectPlaceholder]}>
                  {currentBom.unit_id
                    ? getUnitName(currentBom.unit_id)
                    : '-- Chọn đơn vị --'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
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

      {/* Material Picker Modal */}
      <Modal
        visible={showMaterialPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMaterialPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn nguyên liệu</Text>
              <TouchableOpacity onPress={() => setShowMaterialPicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {products.filter(p => p.product_type === 'raw_material').map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.pickerItem,
                    currentBom.material_id === product.id && styles.pickerItemSelected
                  ]}
                  onPress={() => {
                    setCurrentBom({ ...currentBom, material_id: product.id });
                    setShowMaterialPicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    currentBom.material_id === product.id && styles.pickerItemTextSelected
                  ]}>
                    {product.name} (#{product.code})
                  </Text>
                  {currentBom.material_id === product.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#FF9800" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Unit Picker Modal */}
      <Modal
        visible={showUnitPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUnitPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn đơn vị</Text>
              <TouchableOpacity onPress={() => setShowUnitPicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {units.map((unit) => (
                <TouchableOpacity
                  key={unit.id}
                  style={[
                    styles.pickerItem,
                    currentBom.unit_id === unit.id && styles.pickerItemSelected
                  ]}
                  onPress={() => {
                    setCurrentBom({ ...currentBom, unit_id: unit.id });
                    setShowUnitPicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    currentBom.unit_id === unit.id && styles.pickerItemTextSelected
                  ]}>
                    {unit.name} ({unit.code})
                  </Text>
                  {currentBom.unit_id === unit.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#FF9800" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    fontSize: 13,
    color: '#2196F3',
    marginLeft: 8,
    flex: 1,
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
  bomCard: {
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
  bomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  materialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFE0B2',
  },
  bomInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 11,
    color: '#9e9e9e',
    marginRight: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF9800',
  },
  bomActions: {
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
    backgroundColor: '#FF9800',
    elevation: 2,
    shadowColor: '#FF9800',
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
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerItemTextSelected: {
    fontWeight: '600',
    color: '#F57C00',
  },
});

export default ProductBOM;
