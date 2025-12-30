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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

/**
 * SpecificationFormTemplate - Simple modal form to add new specification/variant
 * Can be used in multiple screens
 * 
 * Usage:
 * <SpecificationFormTemplate
 *   visible={modalVisible}
 *   onClose={() => setModalVisible(false)}
 *   onSpecificationAdded={(newSpec) => {
 *     setSpecifications([...specifications, newSpec]);
 *     setItemForm({...itemForm, product_specification_id: newSpec.id});
 *   }}
 * />
 */
export default function SpecificationFormTemplate({ visible, onClose, onSpecificationAdded, productId }) {
  const { api } = useApi();
  const [loading, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    spec_code: '',
    spec_name: '',
    description: '',
  });

  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  const handleSave = async () => {
    if (!formData.spec_code.trim() || !formData.spec_name.trim()) {
      Alert.error('Lỗi', 'Vui lòng nhập mã và tên quy cách');
      return;
    }

    setSaving(true);
    try {
      // product_specifications requires product_id and spec_value
      if (!productId) {
        Alert.error('Lỗi', 'Không có sản phẩm được chọn');
        setSaving(false);
        return;
      }

      const dataToSend = {
        spec_name: formData.spec_name.trim(),
        spec_value: formData.spec_code.trim(), // Use spec_code as spec_value
        product_id: productId,
      };

      const response = await api.post('/api/product_specifications', dataToSend);
      Alert.success('Thành công!', 'Quy cách đã được tạo');
      
      // Reset form
      setFormData({ spec_code: '', spec_name: '', description: '' });
      
      // Callback to parent screen with new spec data
      onSpecificationAdded?.(response.data);
      
      setTimeout(() => onClose?.(), 1000);
    } catch (error) {
      console.error('Error saving specification:', error);
      console.error('Server response:', error.response?.data);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Không thể tạo quy cách';
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
        <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => onClose?.()} disabled={loading}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thêm quy cách</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.content}>
        {/* Code */}
        <View style={styles.section}>
          <Text style={styles.label}>Mã quy cách *</Text>
          <RNTextInput
            style={styles.input}
            placeholder="VD: L, XL, M"
            value={formData.spec_code}
            onChangeText={(text) => setFormData({ ...formData, spec_code: text })}
            editable={!loading}
          />
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Tên quy cách *</Text>
          <RNTextInput
            style={styles.input}
            placeholder="VD: Kích cỡ Large"
            value={formData.spec_name}
            onChangeText={(text) => setFormData({ ...formData, spec_name: text })}
            editable={!loading}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Mô tả (tùy chọn)</Text>
          <RNTextInput
            style={[styles.input, styles.textarea]}
            placeholder="Mô tả chi tiết quy cách..."
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

  actionBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', gap: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnCancel: { backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ddd' },
  btnCancelText: { fontSize: 14, fontWeight: '600', color: '#666' },
  btnSave: { backgroundColor: '#FF9800' },
  btnSaveText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
