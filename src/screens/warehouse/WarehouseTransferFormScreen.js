import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput as RNTextInput,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import { useAuth } from '../../contexts/AuthContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';
import ProductFormTemplate from '../forms/ProductFormTemplate';
import SpecificationFormTemplate from '../forms/SpecificationFormTemplate';

export default function WarehouseTransferFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { api } = useApi();
  const { user } = useAuth();
  const { mode = 'create', transferId } = route.params || {};

  const [loading, setLoading] = useState(mode === 'edit' ? true : false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    source_warehouse_id: null,
    destination_warehouse_id: null,
    transaction_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [units, setUnits] = useState([]);

  const [sourceWarehouseModalVisible, setSourceWarehouseModalVisible] = useState(false);
  const [destinationWarehouseModalVisible, setDestinationWarehouseModalVisible] = useState(false);
  const [itemFormVisible, setItemFormVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [specModalVisible, setSpecModalVisible] = useState(false);
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [productFormVisible, setProductFormVisible] = useState(false);
  const [specFormVisible, setSpecFormVisible] = useState(false);

  const [itemForm, setItemForm] = useState({
    product_id: null,
    product_specification_id: null,
    quantity: '',
    cost: '',
    unit_id: null,
  });
  const [editingItemIndex, setEditingItemIndex] = useState(null);

  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [])
  );

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const [warehousesRes, productsRes, specsRes, unitsRes] = await Promise.all([
        api.get('/api/warehouses'),
        api.get('/api/products'),
        api.get('/api/product_specifications'),
        api.get('/api/units'),
      ]);

      setWarehouses(Array.isArray(warehousesRes.data) ? warehousesRes.data : warehousesRes.data?.data || []);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.data || []);
      setSpecifications(Array.isArray(specsRes.data) ? specsRes.data : specsRes.data?.data || []);
      setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : unitsRes.data?.data || []);

      if (mode === 'edit' && transferId) {
        console.log('Loading inventory_transaction ID:', transferId);
        const transferRes = await api.get(`/api/inventory_transactions/${transferId}?include={"inventory_transaction_logs":true}`);
        console.log('Loaded data:', transferRes.data);
        const transfer = transferRes.data;
        setFormData({
          source_warehouse_id: transfer.source_warehouse_id,
          destination_warehouse_id: transfer.destination_warehouse_id,
          transaction_date: transfer.transaction_date?.split('T')[0],
          notes: transfer.description || '',
        });
        setItems((transfer.inventory_transaction_logs || []).map(log => ({
          product_id: log.product_id,
          product_specification_id: log.product_specification_id,
          quantity: log.quantity,
          unit_id: log.unit_id,
          cost: log.cost,
        })));
      }
    } catch (error) {
      Alert.error('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = () => {
    if (!itemForm.product_id || !itemForm.product_specification_id || !itemForm.quantity || !itemForm.cost) {
      Alert.error('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    const newItem = {
      product_id: itemForm.product_id,
      product_specification_id: itemForm.product_specification_id,
      quantity: parseFloat(itemForm.quantity),
      cost: parseFloat(itemForm.cost),
      unit_id: itemForm.unit_id,
    };

    if (editingItemIndex !== null) {
      const updatedItems = [...items];
      updatedItems[editingItemIndex] = newItem;
      setItems(updatedItems);
    } else {
      setItems([...items, newItem]);
    }

    setItemFormVisible(false);
    setItemForm({ product_id: null, product_specification_id: null, quantity: '', cost: '', unit_id: null });
  };

  const handleSaveForm = async () => {
    if (!formData.source_warehouse_id || !formData.destination_warehouse_id || items.length === 0) {
      Alert.error('Lỗi', 'Vui lòng chọn kho đi, kho đến và thêm ít nhất 1 sản phẩm');
      return;
    }

    if (formData.source_warehouse_id === formData.destination_warehouse_id) {
      Alert.error('Lỗi', 'Kho đi và kho đến phải khác nhau');
      return;
    }

    setSaving(true);
    try {
      const year = new Date().getFullYear();
      const code = `PKH-${year}`; // Server will append count (PKH = Phiếu Kho Hàng)

      const dataToSend = {
        transaction_type: 'warehouse_transfer',
        source_warehouse_id: parseInt(formData.source_warehouse_id),
        destination_warehouse_id: parseInt(formData.destination_warehouse_id),
        transaction_date: new Date(formData.transaction_date).toISOString(),
        description: formData.notes,
        created_by: 1,
        code: code,
        inventory_transaction_logs: {
          create: items.map(item => ({
            product_id: parseInt(item.product_id),
            product_specification_id: parseInt(item.product_specification_id),
            quantity: parseFloat(item.quantity),
            unit_id: parseInt(item.unit_id),
            cost: parseFloat(item.cost),
          }))
        }
      };

      if (mode === 'edit') {
        await api.put(`/api/inventory_transactions/${transferId}`, dataToSend);
        Alert.success('Thành công!', 'Phiếu chuyển kho đã được cập nhật');
      } else {
        await api.post('/api/inventory_transactions', dataToSend);
        Alert.success('Thành công!', 'Phiếu chuyển kho đã được tạo');
      }

      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      console.error('Error saving:', error);
      Alert.error('Lỗi', error.response?.data?.detail || 'Không thể lưu');
    } finally {
      setSaving(false);
    }
  };

  const getWarehouseName = (id) => {
    return warehouses.find(w => w.id === id)?.name || 'Chọn...';
  };

  const getProductName = (id) => {
    return products.find(p => p.id === id)?.name || 'N/A';
  };

  const getUnitName = (id) => {
    return units.find(u => u.id === id)?.name || 'N/A';
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />

      <LinearGradient colors={['#1976d2', '#1565c0']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {mode === 'create' ? 'Tạo phiếu chuyển kho' : 'Sửa phiếu chuyển kho'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Kho đi *</Text>
          <TouchableOpacity
            style={styles.selectBtn}
            onPress={() => setSourceWarehouseModalVisible(true)}
          >
            <MaterialCommunityIcons name="warehouse" size={20} color="#666" />
            <Text style={styles.selectBtnText}>{getWarehouseName(formData.source_warehouse_id)}</Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Kho đến (tùy chọn)</Text>
          <TouchableOpacity
            style={styles.selectBtn}
            onPress={() => setDestinationWarehouseModalVisible(true)}
          >
            <MaterialCommunityIcons name="cube-outline" size={20} color="#999" />
            <Text style={styles.selectBtnText}>{getWarehouseName(formData.destination_warehouse_id)}</Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Ngày xuất *</Text>
          <RNTextInput
            style={styles.input}
            value={formData.transaction_date}
            onChangeText={(text) => setFormData({ ...formData, transaction_date: text })}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Ghi chú</Text>
          <RNTextInput
            style={[styles.input, styles.textarea]}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Nhập ghi chú..."
            multiline
          />
        </View>

        <View style={styles.section}>
          <View style={styles.itemsHeader}>
            <Text style={styles.label}>Sản phẩm xuất ({items.length})</Text>
            <TouchableOpacity onPress={() => { setItemForm({ product_id: null, product_specification_id: null, quantity: '', cost: '', unit_id: null }); setEditingItemIndex(null); setItemFormVisible(true); }}>
              <Text style={styles.addBtnText}>+ Thêm</Text>
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có sản phẩm nào</Text>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={items}
              renderItem={({ item, index }) => (
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{getProductName(item.product_id)}</Text>
                    <Text style={styles.itemMeta}>SL: {item.quantity} x {item.cost.toLocaleString('vi-VN')}₫</Text>
                  </View>
                  <TouchableOpacity onPress={() => setItems(items.filter((_, i) => i !== index))}>
                    <MaterialCommunityIcons name="delete" size={16} color="#f44336" />
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(_, i) => i.toString()}
            />
          )}
        </View>

        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Tổng tiền:</Text>
          <Text style={styles.totalValue}>{getTotalAmount().toLocaleString('vi-VN')}₫</Text>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => navigation.goBack()} disabled={saving}>
          <Text style={styles.btnCancelText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={handleSaveForm} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnSaveText}>Lưu</Text>}
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <Modal visible={sourceWarehouseModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn kho đi</Text>
            <FlatList
              data={warehouses.filter(w => w.id !== formData.destination_warehouse_id)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setFormData({ ...formData, source_warehouse_id: item.id }); setSourceWarehouseModalVisible(false); }}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id?.toString()}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSourceWarehouseModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={destinationWarehouseModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn kho đến</Text>
            <FlatList
              data={warehouses.filter(w => w.id !== formData.source_warehouse_id)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setFormData({ ...formData, destination_warehouse_id: item.id }); setDestinationWarehouseModalVisible(false); }}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id?.toString()}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setDestinationWarehouseModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={itemFormVisible} transparent animationType="slide">
        <View style={styles.itemModalOverlay}>
          <View style={styles.itemModalContent}>
            <View style={styles.itemModalHeader}>
              <Text style={styles.itemModalTitle}>Thêm sản phẩm</Text>
              <TouchableOpacity onPress={() => setItemFormVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.itemModalBody}>
              <View style={styles.section}>
                <Text style={styles.label}>Sản phẩm *</Text>
                <View style={styles.selectWithBtnRow}>
                  <TouchableOpacity style={[styles.selectBtn, { flex: 1 }]} onPress={() => setProductModalVisible(true)}>
                    <Text style={styles.selectBtnText}>{getProductName(itemForm.product_id) || 'Chọn sản phẩm...'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addBtn} onPress={() => setProductFormVisible(true)}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Quy cách *</Text>
                <View style={styles.selectWithBtnRow}>
                  <TouchableOpacity style={[styles.selectBtn, { flex: 1 }]} onPress={() => setSpecModalVisible(true)}>
                    <Text style={styles.selectBtnText}>
                      {itemForm.product_specification_id ? specifications.find(s => s.id === itemForm.product_specification_id)?.spec_name : 'Chọn quy cách...'}
                    </Text>
                  </TouchableOpacity>
                  {itemForm.product_id && (
                    <TouchableOpacity style={styles.addBtn} onPress={() => setSpecFormVisible(true)}>
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Đơn vị *</Text>
                <View style={[styles.selectBtn, { backgroundColor: '#f5f5f5' }]}>
                  <Text style={[styles.selectBtnText, { color: '#666', fontWeight: '500' }]}>
                    {getUnitName(itemForm.unit_id)} (mặc định)
                  </Text>
                </View>
              </View>

              <Text style={[styles.label, { marginTop: 12 }]}>Số lượng *</Text>
              <RNTextInput 
                style={styles.input} 
                value={itemForm.quantity ? parseFloat(itemForm.quantity).toLocaleString('vi-VN') : ''} 
                onChangeText={(text) => setItemForm({ ...itemForm, quantity: text.replace(/\D/g, '') })} 
                keyboardType="numeric"
                placeholder="0"
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Giá *</Text>
              <RNTextInput 
                style={styles.input} 
                value={itemForm.cost ? parseFloat(itemForm.cost).toLocaleString('vi-VN') : ''} 
                onChangeText={(text) => setItemForm({ ...itemForm, cost: text.replace(/\D/g, '') })} 
                keyboardType="numeric"
                placeholder="0"
              />
            </ScrollView>

            <View style={styles.itemModalFooter}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setItemFormVisible(false)}>
                <Text style={styles.btnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={handleSaveItem}>
                <Text style={styles.btnSaveText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={productModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn sản phẩm</Text>
            <FlatList
              data={products}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setItemForm({ ...itemForm, product_id: item.id, unit_id: item.base_unit_id }); setProductModalVisible(false); }}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id?.toString()}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setProductModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={specModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn quy cách</Text>
            <FlatList
              data={specifications}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setItemForm({ ...itemForm, product_specification_id: item.id }); setSpecModalVisible(false); }}>
                  <Text style={styles.modalItemText}>{item.spec_name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id?.toString()}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSpecModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ProductFormTemplate
        visible={productFormVisible}
        onClose={() => setProductFormVisible(false)}
        onProductAdded={(newProduct) => {
          setProducts([...products, newProduct]);
          setItemForm({ ...itemForm, product_id: newProduct.id, unit_id: newProduct.base_unit_id });
        }}
      />

      <SpecificationFormTemplate
        visible={specFormVisible}
        productId={itemForm.product_id}
        onClose={() => setSpecFormVisible(false)}
        onSpecificationAdded={(newSpec) => {
          setSpecifications([...specifications, newSpec]);
          setItemForm({ ...itemForm, product_specification_id: newSpec.id });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingVertical: 16, paddingHorizontal: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  section: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  textarea: { height: 80, textAlignVertical: 'top' },
  selectBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  selectBtnText: { flex: 1, fontSize: 14, color: '#333', marginHorizontal: 8 },
  selectWithBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addBtn: { width: 40, height: 40, backgroundColor: '#4CAF50', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtnText: { fontSize: 13, color: '#1976d2', fontWeight: '600' },
  emptyText: { fontSize: 13, color: '#999', fontStyle: 'italic', textAlign: 'center', marginVertical: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#333' },
  itemMeta: { fontSize: 11, color: '#999', marginTop: 2 },
  totalSection: { backgroundColor: '#f0f7ff', borderRadius: 8, padding: 12, marginBottom: 16 },
  totalLabel: { fontSize: 13, color: '#666', fontWeight: '500' },
  totalValue: { fontSize: 16, color: '#1976d2', fontWeight: '700', marginTop: 6 },
  actionBar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', gap: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnCancel: { backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ddd' },
  btnCancelText: { fontSize: 14, fontWeight: '600', color: '#666' },
  btnSave: { backgroundColor: '#1976d2' },
  btnSaveText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', maxHeight: '70%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#333', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemText: { fontSize: 14, color: '#333', fontWeight: '500' },
  modalCloseBtn: { padding: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#f5f5f5' },
  modalCloseBtnText: { fontSize: 14, fontWeight: '600', color: '#666' },
  itemModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  itemModalContent: { width: '100%', maxHeight: '95%', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  itemModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemModalTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  itemModalBody: { padding: 16 },
  itemModalFooter: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
});
