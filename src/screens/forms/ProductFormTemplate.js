import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput as RNTextInput,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

/**
 * ProductFormTemplate - Simple modal form to add new product
 * Can be used in multiple screens
 * 
 * Usage:
 * <ProductFormTemplate
 *   visible={modalVisible}
 *   onClose={() => setModalVisible(false)}
 *   onProductAdded={(newProduct) => {
 *     setProducts([...products, newProduct]);
 *     setItemForm({...itemForm, product_id: newProduct.id});
 *   }}
 * />
 */
export default function ProductFormTemplate({ visible, onClose, onProductAdded }) {
  const { api } = useApi();
  const [loading, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    base_unit_id: null,
    description: '',
    product_type: 'raw_material',
  });

  const [units, setUnits] = useState([]);
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);

  // Product types
  const productTypes = [
    { value: 'raw_material', label: 'Nguyên vật liệu' },
    { value: 'semi_finished', label: 'Bán thành phẩm' },
    { value: 'finished_product', label: 'Thành phẩm' },
    { value: 'accessory_kit', label: 'Bộ phụ kiện' },
  ];

  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  React.useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const response = await api.get('/api/units');
      const unitsData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setUnits(unitsData);
    } catch (error) {
      console.error('Error fetching units:', error);
      Alert.error('Lỗi', 'Không thể tải danh sách đơn vị tính');
    }
  };

  const getUnitName = () => {
    if (!formData.base_unit_id) return 'Chọn đơn vị...';
    const unit = units.find(u => u.id === formData.base_unit_id);
    return unit?.name || 'N/A';
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.name.trim() || !formData.base_unit_id) {
      Alert.error('Lỗi', 'Vui lòng nhập mã, tên sản phẩm và chọn đơn vị');
      return;
    }

    setSaving(true);
    try {
      const dataToSend = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        base_unit_id: formData.base_unit_id,
        description: formData.description.trim() || null,
        product_type: formData.product_type,
      };

      const response = await api.post('/api/products', dataToSend);
      Alert.success('Thành công!', 'Sản phẩm đã được tạo');
      
      // Reset form
      setFormData({ code: '', name: '', description: '', product_type: 'raw_material', base_unit_id: null });
      
      // Callback to parent screen with new product data
      onProductAdded?.(response.data);
      
      setTimeout(() => onClose?.(), 1000);
    } catch (error) {
      console.error('Error saving product:', error);
      console.error('Server response:', error.response?.data);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Không thể tạo sản phẩm';
      Alert.error('Lỗi', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        <CustomAlert {...alertConfig} />

        {/* Header */}
        <LinearGradient colors={['#1976d2', '#1565c0']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => onClose?.()} disabled={loading}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thêm sản phẩm</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.content}>
          {/* Code */}
          <View style={styles.section}>
            <Text style={styles.label}>Mã sản phẩm *</Text>
            <RNTextInput
              style={styles.input}
              placeholder="VD: SP001"
              value={formData.code}
              onChangeText={(text) => setFormData({ ...formData, code: text })}
              editable={!loading}
            />
          </View>

          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Tên sản phẩm *</Text>
            <RNTextInput
              style={styles.input}
              placeholder="VD: Sản phẩm A"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              editable={!loading}
            />
          </View>

          {/* Product Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Loại sản phẩm *</Text>
            <View style={styles.selectContainer}>
              <RNTextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Chọn loại sản phẩm..."
                value={productTypes.find(t => t.value === formData.product_type)?.label || ''}
                editable={false}
                pointerEvents="none"
              />
              <TouchableOpacity
                style={styles.selectDropdown}
                onPress={() => setTypeModalVisible(true)}
                disabled={loading}
              >
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Base Unit */}
          <View style={styles.section}>
            <Text style={styles.label}>Đơn vị tính *</Text>
            <View style={styles.selectContainer}>
              <RNTextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Chọn đơn vị..."
                value={getUnitName()}
                editable={false}
                pointerEvents="none"
              />
              <TouchableOpacity
                style={styles.selectDropdown}
                onPress={() => setUnitModalVisible(true)}
                disabled={loading}
              >
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Mô tả (tùy chọn)</Text>
            <RNTextInput
              style={[styles.input, styles.textarea]}
              placeholder="Mô tả chi tiết sản phẩm..."
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
              editable={!loading}
            />
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.btn, styles.btnCancel]}
            onPress={() => onClose?.()}
            disabled={loading}
          >
            <Text style={styles.btnCancelText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnSave]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnSaveText}>Tạo</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Product Type Selection Modal */}
      <Modal visible={typeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn loại sản phẩm</Text>
            <FlatList
              data={productTypes}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, product_type: item.value });
                    setTypeModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {formData.product_type === item.value && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={item => item.value}
            />
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setTypeModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Unit Selection Modal */}
      <Modal visible={unitModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn đơn vị tính</Text>
            <FlatList
              data={units}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, base_unit_id: item.id });
                    setUnitModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {formData.base_unit_id === item.id && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id?.toString()}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>Chưa có đơn vị tính nào</Text>
                </View>
              }
            />
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setUnitModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: { paddingVertical: 16, paddingHorizontal: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

  content: { flex: 1, paddingHorizontal: 16, paddingVertical: 16 },

  section: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#333' },
  textarea: { height: 100, textAlignVertical: 'top' },
  selectContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' },
  selectDropdown: { paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },

  actionBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', gap: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnCancel: { backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ddd' },
  btnCancelText: { fontSize: 14, fontWeight: '600', color: '#666' },
  btnSave: { backgroundColor: '#1976d2' },
  btnSaveText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', maxHeight: '60%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#333', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemText: { fontSize: 14, color: '#333', fontWeight: '500' },
  modalCloseBtn: { padding: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#f5f5f5' },
  modalCloseBtnText: { fontSize: 14, fontWeight: '600', color: '#666' },
  emptyList: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  emptyListText: { fontSize: 14, color: '#999' },
});
