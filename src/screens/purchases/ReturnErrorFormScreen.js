import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function ReturnErrorFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { api } = useApi();
  const returnItem = route.params?.returnItem;
  const isEditMode = !!returnItem;

  // State
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    warehouse_id: '',
    return_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [items, setItems] = useState([]);

  // Master data - Initialize with empty arrays
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);

  // Modals
  const [warehouseModalVisible, setWarehouseModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [selectedProductForItem, setSelectedProductForItem] = useState(null);
  const [itemFormModalVisible, setItemFormModalVisible] = useState(false);
  const [itemForm, setItemForm] = useState({
    product_id: '',
    product_specification_id: null,
    quantity: '',
    unit_id: '',
    cost: '',
  });

  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useEffect(() => {
    console.log('🔵 Component mounted');
    console.log('🔵 isEditMode:', isEditMode);
    console.log('🔵 returnItem:', returnItem);
    
    fetchMasterData();
    if (isEditMode && returnItem) {
      console.log('🔵 Calling loadReturnData...');
      loadReturnData();
    } else {
      console.log('🔵 NOT calling loadReturnData (create mode or no returnItem)');
    }
  }, []);

  const fetchMasterData = async () => {
    try {
      console.log('🔄 Fetching master data...');
      
      // Fetch basic data first
      const [warehousesRes, productsRes, unitsRes] = await Promise.all([
        api.get('/api/warehouses'),
        api.get('/api/products'),
        api.get('/api/units'),
      ]);
      
      // Process arrays
      const warehousesData = warehousesRes.data;
      const productsData = productsRes.data;
      const unitsData = unitsRes.data;
      
      const finalWarehouses = Array.isArray(warehousesData) ? warehousesData : (warehousesData?.data || []);
      const finalProducts = Array.isArray(productsData) ? productsData : (productsData?.data || []);
      const finalUnits = Array.isArray(unitsData) ? unitsData : (unitsData?.data || []);
      
      console.log('✅ Warehouses loaded:', finalWarehouses.length);
      console.log('✅ Products loaded:', finalProducts.length);
      console.log('✅ Units loaded:', finalUnits.length);
      
      // Set basic data first
      setWarehouses(finalWarehouses);
      setProducts(finalProducts);
      setUnits(finalUnits);
      
      // Then fetch ALL specifications for ALL products in one go
      console.log('🔄 Fetching specifications...');
      try {
        const specsRes = await api.get('/api/product_specifications');
        const specsData = specsRes.data;
        const allSpecs = Array.isArray(specsData) ? specsData : (specsData?.data || []);
        
        console.log('✅ All specifications:', allSpecs.length);
        
        if (allSpecs.length > 0) {
          // Merge specs into products
          const productsWithSpecs = finalProducts.map(product => {
            const productSpecs = allSpecs.filter(spec => spec.product_id === product.id);
            console.log(`  Product ${product.id}: ${productSpecs.length} specs`);
            return {
              ...product,
              product_specifications: productSpecs,
            };
          });
          
          setProducts(productsWithSpecs);
          console.log('✅ Merged specifications into products');
        } else {
          console.log('⚠️ No specifications found - products will have no specs');
        }
      } catch (specsError) {
        console.error('❌ Error fetching specifications:', specsError.message);
        // Continue without specs
      }
      
    } catch (error) {
      console.error('❌ Error fetching master data:', error);
      Alert.error('Lỗi', 'Không thể tải dữ liệu');
      setWarehouses([]);
      setProducts([]);
      setUnits([]);
    }
  };

  const loadReturnData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/inventory_transactions/${returnItem.id}?include={"inventory_transaction_logs":true}`);
      const data = response.data;
      
      console.log('📦 Loaded return data:', data);
      console.log('📦 supplier_id from data:', data.supplier_id);
      console.log('📦 reference_id from data:', data.reference_id);
      
      setFormData({
        warehouse_id: data.source_warehouse_id || '',
        return_date: data.transaction_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        notes: data.description || '',
      });

      if (data.inventory_transaction_logs) {
        const itemsData = data.inventory_transaction_logs.map(log => ({
          product_id: log.product_id,
          product_specification_id: log.product_specification_id,
          quantity: log.quantity?.toString() || '',
          unit_id: log.unit_id,
          cost: log.cost?.toString() || '',
        }));
        setItems(itemsData);
        console.log('Loaded items:', itemsData);
      }
    } catch (error) {
      console.error('Error loading return data:', error);
      Alert.error('Lỗi', 'Không thể tải thông tin phiếu trả hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setEditingItemIndex(null);
    setSelectedProductForItem(null);
    setProductSearchQuery('');
    setItemForm({
      product_id: '',
      product_specification_id: null,
      quantity: '',
      unit_id: '',
      cost: '',
    });
    setProductModalVisible(true);
  };

  const handleEditItem = (index) => {
    const item = items[index];
    const product = productsArray.find(p => p.id === item.product_id);
    setEditingItemIndex(index);
    setSelectedProductForItem(product);
    setItemForm({
      product_id: item.product_id,
      product_specification_id: item.product_specification_id,
      quantity: item.quantity,
      unit_id: item.unit_id,
      cost: item.cost,
    });
    setItemFormModalVisible(true);
  };
  
  const handleSelectProductForItem = (product) => {
    console.log('📦 Selected product:', product.name);
    console.log('   Product ID:', product.id);
    console.log('   Product unit_id:', product.unit_id);
    console.log('   Product object:', JSON.stringify(product));
    
    // Try to find unit_id from product
    const defaultUnitId = product.unit_id || product.unit || unitsArray[0]?.id || '';
    console.log('   Using unit_id:', defaultUnitId);
    
    setSelectedProductForItem(product);
    setItemForm({
      ...itemForm,
      product_id: product.id,
      product_specification_id: null,
      unit_id: defaultUnitId,
    });
    setProductModalVisible(false);
    setItemFormModalVisible(true);
  };

  const handleDeleteItem = (index) => {
    Alert.confirm(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa sản phẩm này?',
      () => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
      }
    );
  };

  const handleSaveItem = () => {
    if (!itemForm.product_id || !itemForm.quantity || !itemForm.unit_id) {
      Alert.error('Lỗi', 'Vui lòng điền đầy đủ thông tin sản phẩm');
      return;
    }

    const newItems = [...items];
    if (editingItemIndex !== null) {
      newItems[editingItemIndex] = itemForm;
    } else {
      newItems.push(itemForm);
    }
    setItems(newItems);
    setItemFormModalVisible(false);
    setSelectedProductForItem(null);
  };
  
  const getFilteredProducts = () => {
    if (!productSearchQuery) return productsArray;
    const query = productSearchQuery.toLowerCase();
    return productsArray.filter(p => 
      p.name?.toLowerCase().includes(query) ||
      p.code?.toLowerCase().includes(query)
    );
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const cost = parseFloat(item.cost) || 0;
      return sum + (quantity * cost);
    }, 0);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.warehouse_id) {
      Alert.error('Lỗi', 'Vui lòng chọn kho xuất');
      return;
    }
    if (items.length === 0) {
      Alert.error('Lỗi', 'Vui lòng thêm ít nhất 1 sản phẩm');
      return;
    }

    try {
      setLoading(true);
      
      // Convert date to ISO-8601 DateTime
      const returnDateTime = new Date(formData.return_date);
      if (isNaN(returnDateTime.getTime())) {
        // If invalid date, use today
        returnDateTime.setHours(0, 0, 0, 0);
      }
      
      // Generate code: PR-YYYY-### (get next sequence number)
      let code;
      if (isEditMode) {
        code = returnItem.code;
      } else {
        const year = returnDateTime.getFullYear();
        try {
          // Get the latest return for this year to determine next sequence
          const latestReturns = await api.get('/api/inventory_transactions', {
            params: {
              reference_type: 'purchase_return',
              transaction_type: 'warehouse_output',
            }
          });
          
          const returnsData = Array.isArray(latestReturns.data) ? latestReturns.data : (latestReturns.data?.data || []);
          const thisYearReturns = returnsData.filter(r => r.code?.startsWith(`PR-${year}-`));
          
          let nextSequence = 1;
          if (thisYearReturns.length > 0) {
            // Extract sequence numbers and find max
            const sequences = thisYearReturns.map(r => {
              const match = r.code?.match(/PR-\d{4}-(\d+)/);
              return match ? parseInt(match[1]) : 0;
            });
            nextSequence = Math.max(...sequences) + 1;
          }
          
          code = `PR-${year}-${nextSequence.toString().padStart(3, '0')}`;
          console.log('Generated code:', code);
        } catch (error) {
          console.error('Error generating code:', error);
          // Fallback to timestamp if error
          code = `PR-${year}-${Date.now().toString().slice(-6)}`;
        }
      }
      
      // Prepare logs data
      const logsData = items.map(item => ({
        product_id: item.product_id,
        product_specification_id: item.product_specification_id || null,
        quantity: parseFloat(item.quantity),
        unit_id: item.unit_id,
        cost: parseFloat(item.cost) || 0,
        total: (parseFloat(item.quantity) || 0) * (parseFloat(item.cost) || 0),
      }));

      const transactionData = {
        transaction_type: 'warehouse_output',
        reference_type: 'purchase_return',
        transaction_date: returnDateTime.toISOString(),
        source_warehouse_id: formData.warehouse_id,
        description: formData.notes || 'Trả hàng mua',
        code: code,
        inventory_transaction_logs: {
          create: logsData  // Prisma nested relation format
        },
      };

      console.log('📤 Sending transaction data:', JSON.stringify(transactionData, null, 2));

      let transactionId;

      if (isEditMode) {
        await api.put(`/api/inventory_transactions/${returnItem.id}`, transactionData);
        transactionId = returnItem.id;
        
        // Delete old logs
        if (returnItem.inventory_transaction_logs) {
          for (const log of returnItem.inventory_transaction_logs) {
            await api.delete(`/api/inventory_transaction_logs/${log.id}`);
          }
        }
        
        // Create new logs
        for (const logData of logsData) {
          await api.post('/api/inventory_transaction_logs', {
            transaction_id: transactionId,
            ...logData,
          });
        }
      } else {
        // For create, send logs together with transaction
        const response = await api.post('/api/inventory_transactions', transactionData);
        transactionId = response.data.id;
        console.log('✅ Transaction created with ID:', transactionId);
      }

      Alert.success(
        'Thành công!',
        isEditMode ? 'Đã cập nhật phiếu trả hàng' : 'Đã tạo phiếu trả hàng',
        () => navigation.goBack()
      );
    } catch (error) {
      console.error('Error saving return:', error);
      Alert.error('Lỗi', 'Không thể lưu phiếu trả hàng');
    } finally {
      setLoading(false);
    }
  };

  // Ensure arrays before using .find() - MUST BE BEFORE RETURN
  const warehousesArray = Array.isArray(warehouses) ? warehouses : [];
  const productsArray = Array.isArray(products) ? products : [];
  const unitsArray = Array.isArray(units) ? units : [];
  
  const selectedWarehouse = warehousesArray.find(w => w.id === formData.warehouse_id);
  const totalAmount = calculateTotal();

  if (loading && isEditMode) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Warehouse */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kho xuất *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setWarehouseModalVisible(true)}
          >
            <Ionicons name="home" size={20} color="#6B7280" />
            <Text style={[styles.selectButtonText, !selectedWarehouse && styles.placeholder]}>
              {selectedWarehouse ? selectedWarehouse.name : 'Chọn kho'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Return Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ngày trả hàng *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar" size={20} color="#6B7280" />
            <RNTextInput
              style={styles.input}
              value={formData.return_date}
              onChangeText={(text) => setFormData({ ...formData, return_date: text })}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <RNTextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Nhập ghi chú..."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danh sách sản phẩm *</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
              <Ionicons name="add-circle" size={24} color="#EF4444" />
              <Text style={styles.addButtonText}>Thêm</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => {
            const product = productsArray.find(p => p.id === item.product_id);
            const spec = product?.product_specifications?.find(s => s.id === item.product_specification_id);
            const unit = unitsArray.find(u => u.id === item.unit_id);
            const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.cost) || 0);

            return (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>
                      {product?.code ? `[${product.code}] ` : ''}{product?.name || 'N/A'}
                    </Text>
                    {spec && (
                      <Text style={styles.itemSpec}>Quy cách: {spec.name}</Text>
                    )}
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity onPress={() => handleEditItem(index)}>
                      <Ionicons name="pencil" size={20} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteItem(index)}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemDetailText}>SL: {item.quantity} {unit?.name || ''}</Text>
                  <Text style={styles.itemDetailText}>Giá: {parseFloat(item.cost || 0).toLocaleString('vi-VN')} ₫</Text>
                  <Text style={styles.itemDetailText}>Thành tiền: {itemTotal.toLocaleString('vi-VN')} ₫</Text>
                </View>
              </View>
            );
          })}

          {items.length === 0 && (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyItemsText}>Chưa có sản phẩm nào</Text>
            </View>
          )}
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalValue}>{totalAmount.toLocaleString('vi-VN')} ₫</Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            style={styles.saveButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {isEditMode ? 'Cập nhật' : 'Tạo phiếu trả'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Warehouse Modal */}
      <Modal
        visible={warehouseModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWarehouseModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setWarehouseModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn kho</Text>
              <TouchableOpacity onPress={() => setWarehouseModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={warehousesArray}
              keyExtractor={(item) => item.id.toString()}
              style={styles.modalBody}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formData.warehouse_id === item.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, warehouse_id: item.id });
                    setWarehouseModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      formData.warehouse_id === item.id && styles.modalItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Product Selection Modal */}
      <Modal
        visible={productModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProductModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProductModalVisible(false)}
        >
          <View style={[styles.modalContent, { maxHeight: '85%' }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn sản phẩm</Text>
              <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {/* Search Bar */}
            <View style={styles.modalSearchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <RNTextInput
                style={styles.modalSearchInput}
                placeholder="Tìm sản phẩm theo tên hoặc mã..."
                value={productSearchQuery}
                onChangeText={setProductSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
              {productSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setProductSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Product List */}
            <FlatList
              data={getFilteredProducts()}
              keyExtractor={(item) => item.id.toString()}
              style={styles.modalBody}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productItem}
                  onPress={() => handleSelectProductForItem(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.productItemIcon}>
                    <Ionicons name="cube" size={24} color="#EF4444" />
                  </View>
                  <View style={styles.productItemContent}>
                    {item.code && (
                      <Text style={styles.productItemCode}>[{item.code}]</Text>
                    )}
                    <Text style={styles.productItemName}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.productItemDescription} numberOfLines={1}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>Không tìm thấy sản phẩm</Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Item Form Modal (Quantity, Unit, Cost) */}
      <Modal
        visible={itemFormModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setItemFormModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItemIndex !== null ? 'Sửa thông tin' : 'Nhập thông tin'}
              </Text>
              <TouchableOpacity onPress={() => setItemFormModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 16 }}>
              {/* Selected Product Info */}
              {selectedProductForItem && (
                <View style={styles.selectedProductInfo}>
                  <View style={styles.selectedProductIcon}>
                    <Ionicons name="cube" size={20} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedProductCode}>
                      {selectedProductForItem.code ? `[${selectedProductForItem.code}]` : ''}
                    </Text>
                    <Text style={styles.selectedProductName}>{selectedProductForItem.name}</Text>
                  </View>
                </View>
              )}

              {/* Specifications (if product has any) */}
              {selectedProductForItem?.product_specifications?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Mã quy cách</Text>
                  <View style={styles.selectButton}>
                    <Ionicons name="options" size={20} color="#6B7280" />
                    <View style={{ flex: 1 }}>
                      {selectedProductForItem.product_specifications.map((spec, index) => {
                        console.log(`Rendering spec ${index}:`, spec);
                        return (
                          <TouchableOpacity
                            key={spec.id || index}
                            style={[
                              styles.specificationOption,
                              itemForm.product_specification_id === spec.id && styles.specificationOptionSelected,
                            ]}
                            onPress={() => {
                              console.log('Selected spec:', spec);
                              setItemForm({ ...itemForm, product_specification_id: spec.id });
                            }}
                          >
                            <View style={styles.radioButton}>
                              {itemForm.product_specification_id === spec.id && (
                                <View style={styles.radioButtonInner} />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.specificationOptionText,
                                itemForm.product_specification_id === spec.id && styles.specificationOptionTextSelected,
                              ]}
                            >
                              {spec.spec_name || spec.name || spec.specification_name || spec.description || `Quy cách #${spec.id}`}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}

              {/* Quantity */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Số lượng *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="calculator" size={20} color="#6B7280" />
                  <RNTextInput
                    style={styles.input}
                    value={itemForm.quantity}
                    onChangeText={(text) => setItemForm({ ...itemForm, quantity: text })}
                    placeholder="Nhập số lượng"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Unit - Can select or use default */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Đơn vị *</Text>
                {itemForm.unit_id ? (
                  <View>
                    <View style={styles.inputContainer}>
                      <Ionicons name="cube-outline" size={20} color="#6B7280" />
                      <Text style={styles.input}>
                        {unitsArray.find(u => u.id === itemForm.unit_id)?.name || 'Chưa chọn'}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.changeUnitButton}
                      onPress={() => setItemForm({ ...itemForm, unit_id: '' })}
                    >
                      <Text style={styles.changeUnitText}>Đổi đơn vị</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {unitsArray.map((unit) => (
                      <TouchableOpacity
                        key={unit.id}
                        style={styles.filterButton}
                        onPress={() => setItemForm({ ...itemForm, unit_id: unit.id })}
                      >
                        <Text style={styles.filterButtonText}>
                          {unit.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Cost */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Đơn giá</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="cash" size={20} color="#6B7280" />
                  <RNTextInput
                    style={styles.input}
                    value={itemForm.cost}
                    onChangeText={(text) => setItemForm({ ...itemForm, cost: text })}
                    placeholder="Nhập đơn giá"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, { marginTop: 16 }]}
                onPress={handleSaveItem}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.saveButtonGradient}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>
                    {editingItemIndex !== null ? 'Cập nhật' : 'Thêm vào danh sách'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={alertConfig.onClose}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  selectButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  placeholder: {
    color: '#9CA3AF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  itemSpec: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  itemDetails: {
    gap: 6,
  },
  itemDetailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyItems: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyItemsText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FEE2E2',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalBody: {
    maxHeight: 400,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemSelected: {
    backgroundColor: '#FEF2F2',
  },
  modalItemText: {
    fontSize: 15,
    color: '#111827',
  },
  modalItemTextSelected: {
    color: '#EF4444',
    fontWeight: '600',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  productItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productItemContent: {
    flex: 1,
  },
  productItemCode: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginBottom: 4,
  },
  productItemName: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 2,
  },
  productItemDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  selectedProductInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  selectedProductIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedProductCode: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedProductName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  specificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  specificationOptionSelected: {
    backgroundColor: '#FEF2F2',
  },
  specificationOptionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  specificationOptionTextSelected: {
    color: '#EF4444',
    fontWeight: '500',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  changeUnitButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  changeUnitText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
});
