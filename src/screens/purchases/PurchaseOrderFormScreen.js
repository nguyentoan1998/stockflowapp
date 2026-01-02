import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
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

export default function PurchaseOrderFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { api } = useApi();
  const { mode, orderId } = route.params || {};
  const isEditMode = mode === 'edit' && orderId;

  // Loading states
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  // Data states
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    supplier_id: null,
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    notes: '',
  });

  const [items, setItems] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Modal states
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [specificationModalVisible, setSpecificationModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerField, setDatePickerField] = useState(null); // 'order_date' or 'expected_delivery_date'
  const [currentItemIndex, setCurrentItemIndex] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load suppliers, products, units in parallel
      const [suppliersRes, productsRes, unitsRes] = await Promise.all([
        api.get('/api/suppliers'),
        api.get('/api/products?include={"product_specifications":true}'),
        api.get('/api/units'),
      ]);

      setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : (suppliersRes.data?.data || []));
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.data || []));
      setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : (unitsRes.data?.data || []));

      // If edit mode, load existing order
      if (isEditMode) {
        await loadExistingOrder();
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.error('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingOrder = async () => {
    try {
      const response = await api.get(
        `/api/purchase_orders/${orderId}?include={"suppliers":true,"purchase_order_items":{"include":{"products":true,"product_specifications":true}}}`
      );
      const order = response.data;

      setFormData({
        supplier_id: order.supplier_id,
        order_date: order.order_date?.split('T')[0] || '',
        expected_delivery_date: order.expected_delivery_date?.split('T')[0] || '',
        notes: order.notes || '',
      });

      setSelectedSupplier(order.suppliers);

      // Convert order items to form items
      const loadedItems = (order.purchase_order_items || []).map(item => ({
        product_id: item.product_id,
        product_specification_id: item.product_specification_id,
        quantity: item.quantity?.toString() || '',
        unit_id: item.unit_id,
        unit_price: item.unit_price?.toString() || '',
        discount_percentage: item.discount_percentage?.toString() || '0',
        tax_percentage: item.tax_percentage?.toString() || '0',
        product: item.products,
        specification: item.product_specifications,
        unit: item.units,
      }));

      setItems(loadedItems);
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.error('Lỗi', 'Không thể tải thông tin đơn hàng');
      navigation.goBack();
    }
  };

  // ==================== HANDLERS ====================

  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({ ...formData, supplier_id: supplier.id });
    setSupplierModalVisible(false);
  };

  const handleOpenDatePicker = (field) => {
    setDatePickerField(field);
    setDatePickerVisible(true);
  };

  const handleSelectDate = (dateString) => {
    if (datePickerField) {
      setFormData({ ...formData, [datePickerField]: dateString });
    }
    setDatePickerVisible(false);
    setDatePickerField(null);
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const handleAddItem = () => {
    setCurrentItemIndex(null);
    setProductModalVisible(true);
  };

  const handleSelectProduct = (product) => {
    // Only allow products WITH specifications
    if (!product.product_specifications || product.product_specifications.length === 0) {
      Alert.error('Không thể thêm', 'Chỉ có thể thêm sản phẩm có mã quy cách');
      return;
    }

    // Open specification modal
    setSelectedProduct(product);
    setProductModalVisible(false);
    setSpecificationModalVisible(true);
  };

  const addItemWithSpecification = (product, specification) => {
    const newItem = {
      product_id: product.id,
      product_specification_id: specification?.id || null,
      quantity: '',
      unit_id: product.unit_id || (units[0]?.id || null),
      unit_price: '',
      discount_percentage: '0',
      tax_percentage: '0',
      product: product,
      specification: specification,
      unit: units.find(u => u.id === product.unit_id) || units[0],
    };

    if (currentItemIndex !== null) {
      // Update existing item
      const updatedItems = [...items];
      updatedItems[currentItemIndex] = newItem;
      setItems(updatedItems);
    } else {
      // Add new item
      setItems([...items, newItem]);
    }

    setSpecificationModalVisible(false);
    setSelectedProduct(null);
  };

  const handleUpdateItem = (index, field, value) => {
    // Validate numeric fields
    if ((field === 'quantity' || field === 'unit_price') && value) {
      const numValue = parseFloat(value);
      if (numValue > 999999999) {
        Alert.error('Giá trị quá lớn', `${field === 'quantity' ? 'Số lượng' : 'Đơn giá'} không được vượt quá 999,999,999`);
        return;
      }
    }

    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    Alert.confirm(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa sản phẩm này?',
      () => {
        const updatedItems = items.filter((_, i) => i !== index);
        setItems(updatedItems);
      }
    );
  };

  // ==================== CALCULATIONS ====================

  const calculateItemTotal = (item) => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unit_price) || 0;
    const discount = parseFloat(item.discount_percentage) || 0;
    const tax = parseFloat(item.tax_percentage) || 0;

    const subtotal = quantity * unitPrice;
    const discountAmount = (subtotal * discount) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * tax) / 100;
    const total = afterDiscount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
    };
  };

  const calculateOrderTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    items.forEach(item => {
      const calc = calculateItemTotal(item);
      subtotal += calc.subtotal;
      totalDiscount += calc.discountAmount;
      totalTax += calc.taxAmount;
    });

    const finalAmount = subtotal - totalDiscount + totalTax;

    return {
      subtotal,
      totalDiscount,
      totalTax,
      finalAmount,
    };
  };

  // ==================== VALIDATION ====================

  const validateForm = () => {
    // Validate supplier
    if (!formData.supplier_id) {
      Alert.error(
        '🏢 Chưa chọn nhà cung cấp', 
        'Vui lòng chọn nhà cung cấp để tiếp tục.\n\nNhà cung cấp là thông tin bắt buộc cho đơn hàng.'
      );
      return false;
    }

    // Validate order date
    if (!formData.order_date) {
      Alert.error(
        '📅 Chưa chọn ngày đặt hàng',
        'Vui lòng chọn ngày đặt hàng để tiếp tục.\n\nNgày đặt hàng là thông tin bắt buộc.'
      );
      return false;
    }

    // Validate items
    if (items.length === 0) {
      Alert.error(
        '📦 Chưa có sản phẩm',
        'Vui lòng thêm ít nhất 1 sản phẩm vào đơn hàng.\n\nClick nút "Thêm sản phẩm" ở phía dưới để bắt đầu.'
      );
      return false;
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemNumber = i + 1;
      const productName = item.product?.name || `Sản phẩm ${itemNumber}`;
      
      // Validate quantity
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        Alert.error(
          `❌ Lỗi sản phẩm ${itemNumber}`,
          `Số lượng của "${productName}" không hợp lệ.\n\nVui lòng nhập số lượng lớn hơn 0.`
        );
        return false;
      }

      // Validate unit price
      if (!item.unit_price || parseFloat(item.unit_price) < 0) {
        Alert.error(
          `❌ Lỗi sản phẩm ${itemNumber}`,
          `Đơn giá của "${productName}" không hợp lệ.\n\nVui lòng nhập đơn giá hợp lệ (≥ 0).`
        );
        return false;
      }

      // Validate discount
      const discount = parseFloat(item.discount_percentage) || 0;
      if (discount < 0 || discount > 100) {
        Alert.error(
          `❌ Lỗi sản phẩm ${itemNumber}`,
          `Giảm giá của "${productName}" không hợp lệ.\n\nGiảm giá phải từ 0% đến 100%.`
        );
        return false;
      }

      // Validate tax
      const tax = parseFloat(item.tax_percentage) || 0;
      if (tax < 0 || tax > 100) {
        Alert.error(
          `❌ Lỗi sản phẩm ${itemNumber}`,
          `Thuế của "${productName}" không hợp lệ.\n\nThuế phải từ 0% đến 100%.`
        );
        return false;
      }
    }

    return true;
  };

  // ==================== SAVE & SUBMIT ====================

  const handleSave = async (status = 'draft') => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const totals = calculateOrderTotals();
      
      // Prepare order data
      const orderData = {
        supplier_id: formData.supplier_id,
        order_date: formData.order_date,
        expected_delivery_date: formData.expected_delivery_date || null,
        notes: formData.notes || null,
        total_amount: totals.subtotal,
        discount_amount: totals.totalDiscount,
        tax_amount: totals.totalTax,
        final_amount: totals.finalAmount,
        status: status,
      };

      // Prepare items data
      const itemsData = items.map(item => {
        const calc = calculateItemTotal(item);
        return {
          product_id: item.product_id,
          product_specification_id: item.product_specification_id,
          quantity: parseFloat(item.quantity),
          unit_id: item.unit_id,
          unit_price: parseFloat(item.unit_price),
          discount_percentage: parseFloat(item.discount_percentage) || 0,
          tax_percentage: parseFloat(item.tax_percentage) || 0,
          total_amount: calc.total,
          received_quantity: 0,
          status: 'pending',
        };
      });

      let savedOrder;

      if (isEditMode) {
        // Update existing order
        savedOrder = await api.put(`/api/purchase_orders/${orderId}`, orderData);

        // Delete old items and create new ones
        const oldItems = await api.get(`/api/purchase_order_items?where={"purchase_order_id":${orderId}}`);
        const oldItemsList = Array.isArray(oldItems.data) ? oldItems.data : (oldItems.data?.data || []);
        
        for (const oldItem of oldItemsList) {
          await api.delete(`/api/purchase_order_items/${oldItem.id}`);
        }

        for (const itemData of itemsData) {
          await api.post('/api/purchase_order_items', {
            ...itemData,
            purchase_order_id: orderId,
          });
        }
      } else {
        // Create new order
        savedOrder = await api.post('/api/purchase_orders', orderData);
        const newOrderId = savedOrder.data.id;

        // Create items
        for (const itemData of itemsData) {
          await api.post('/api/purchase_order_items', {
            ...itemData,
            purchase_order_id: newOrderId,
          });
        }
      }

      Alert.success(
        'Thành công!',
        status === 'draft' 
          ? 'Đơn hàng đã được lưu nháp'
          : 'Đơn hàng đã được xác nhận',
        () => {
          navigation.goBack();
        }
      );
    } catch (error) {
      console.error('Error saving order:', error);
      Alert.error('Lỗi', 'Không thể lưu đơn hàng');
    } finally {
      setSaving(false);
    }
  };

  // Removed handleSubmit - not needed anymore since default status is draft

  // ==================== RENDER ====================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const totals = calculateOrderTotals();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Supplier Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nhà cung cấp *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setSupplierModalVisible(true)}
          >
            <View style={styles.pickerContent}>
              <Ionicons name="business" size={20} color="#6B7280" />
              <Text style={selectedSupplier ? styles.pickerSelectedText : styles.pickerPlaceholder}>
                {selectedSupplier ? selectedSupplier.name : 'Chọn nhà cung cấp'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Dates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ngày đặt hàng *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => handleOpenDatePicker('order_date')}
          >
            <View style={styles.pickerContent}>
              <Ionicons name="calendar" size={20} color="#6B7280" />
              <Text style={formData.order_date ? styles.pickerSelectedText : styles.pickerPlaceholder}>
                {formData.order_date ? formatDateDisplay(formData.order_date) : 'Chọn ngày đặt hàng'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ngày dự kiến giao</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => handleOpenDatePicker('expected_delivery_date')}
          >
            <View style={styles.pickerContent}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={formData.expected_delivery_date ? styles.pickerSelectedText : styles.pickerPlaceholder}>
                {formData.expected_delivery_date ? formatDateDisplay(formData.expected_delivery_date) : 'Chọn ngày giao hàng (tùy chọn)'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sản phẩm *</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
              <Ionicons name="add-circle" size={24} color="#3B82F6" />
              <Text style={styles.addButtonText}>Thêm sản phẩm</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => renderItem(item, index))}

          {items.length === 0 && (
            <View style={styles.emptyItems}>
              <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyItemsText}>Chưa có sản phẩm nào</Text>
            </View>
          )}
        </View>

        {/* Summary Section */}
        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tổng cộng</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tạm tính:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totals.subtotal)}</Text>
              </View>

              {totals.totalDiscount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Giảm giá:</Text>
                  <Text style={[styles.summaryValue, styles.discountValue]}>
                    -{formatCurrency(totals.totalDiscount)}
                  </Text>
                </View>
              )}

              {totals.totalTax > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Thuế:</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(totals.totalTax)}</Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Tổng tiền:</Text>
                <Text style={styles.totalValue}>{formatCurrency(totals.finalAmount)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Nhập ghi chú..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton, { flex: 1 }]}
          onPress={() => handleSave('draft')}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                {isEditMode ? 'Cập nhật' : 'Lưu'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Supplier Modal */}
      {renderSupplierModal()}

      {/* Product Modal */}
      {renderProductModal()}

      {/* Specification Modal */}
      {renderSpecificationModal()}

      {/* Date Picker Modal */}
      {renderDatePickerModal()}

      {/* Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        onClose={alertConfig.onClose}
      />
    </View>
  );

  // ==================== RENDER ITEM ====================
  
  function renderItem(item, index) {
    const calc = calculateItemTotal(item);

    return (
      <View key={index} style={styles.itemCard}>
        {/* Item Header */}
        <View style={styles.itemHeader}>
          <View style={styles.itemHeaderLeft}>
            <Text style={styles.itemName}>{item.product?.name || 'N/A'}</Text>
            {item.specification && (
              <Text style={styles.itemSpec}>
                {item.specification.spec_name || item.specification.name}: {item.specification.spec_value || ''}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(index)}
          >
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Quantity & Unit */}
        <View style={styles.itemRow}>
          <View style={styles.itemField}>
            <Text style={styles.itemFieldLabel}>Số lượng *</Text>
            <TextInput
              style={styles.itemInput}
              value={item.quantity}
              onChangeText={(text) => handleUpdateItem(index, 'quantity', text)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.itemField}>
            <Text style={styles.itemFieldLabel}>Đơn vị</Text>
            <Text style={styles.itemInputReadonly}>
              {item.unit?.name || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Unit Price */}
        <View style={styles.itemField}>
          <Text style={styles.itemFieldLabel}>Đơn giá *</Text>
          <TextInput
            style={styles.itemInput}
            value={item.unit_price}
            onChangeText={(text) => handleUpdateItem(index, 'unit_price', text)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Item Total */}
        <View style={styles.itemTotal}>
          <Text style={styles.itemTotalLabel}>Thành tiền:</Text>
          <Text style={styles.itemTotalValue}>{formatCurrency(calc.total)}</Text>
        </View>
      </View>
    );
  }

  // ==================== RENDER MODALS ====================

  function renderSupplierModal() {
    return (
      <Modal
        visible={supplierModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSupplierModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn nhà cung cấp</Text>
              <TouchableOpacity onPress={() => setSupplierModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={suppliers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectSupplier(item)}
                >
                  <Ionicons name="business" size={20} color="#3B82F6" />
                  <View style={styles.modalItemContent}>
                    <Text style={styles.modalItemName}>{item.name}</Text>
                    <Text style={styles.modalItemSubtext}>Mã: {item.code}</Text>
                  </View>
                  {selectedSupplier?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.modalEmpty}>Không có nhà cung cấp</Text>
              }
            />
          </View>
        </View>
      </Modal>
    );
  }

  function renderProductModal() {
    return (
      <Modal
        visible={productModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setProductModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn sản phẩm</Text>
              <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={products.filter(p => p.product_specifications && p.product_specifications.length > 0)}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectProduct(item)}
                >
                  <Ionicons name="cube" size={20} color="#3B82F6" />
                  <View style={styles.modalItemContent}>
                    <Text style={styles.modalItemName}>{item.name}</Text>
                    <Text style={styles.modalItemSubtext}>Mã: {item.code}</Text>
                    <Text style={styles.modalItemBadge}>
                      {item.product_specifications.length} quy cách
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.modalEmptyContainer}>
                  <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.modalEmpty}>Chỉ hiển thị sản phẩm có mã quy cách</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    );
  }

  function renderSpecificationModal() {
    if (!selectedProduct) return null;

    const specs = selectedProduct.product_specifications || [];

    return (
      <Modal
        visible={specificationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setSpecificationModalVisible(false);
          setSelectedProduct(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Chọn quy cách</Text>
                <Text style={styles.modalSubtitle}>{selectedProduct.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSpecificationModalVisible(false);
                  setSelectedProduct(null);
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={specs}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => addItemWithSpecification(selectedProduct, item)}
                >
                  <Ionicons name="pricetag" size={20} color="#10B981" />
                  <View style={styles.modalItemContent}>
                    <Text style={styles.modalItemName}>
                      {item.spec_name || item.name}: {item.spec_value || ''}
                    </Text>
                    {item.price && item.price > 0 && (
                      <Text style={styles.modalItemSubtext}>
                        Giá: {formatCurrency(item.price)}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.modalEmptyContainer}>
                  <Ionicons name="pricetag-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.modalEmpty}>Sản phẩm này không có quy cách</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    );
  }

  // ==================== HELPERS ====================

  function formatCurrency(amount) {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  function renderDatePickerModal() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // Generate quick date options
    const quickDates = [
      { label: 'Hôm nay', date: today },
      { label: 'Ngày mai', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1) },
      { label: '+3 ngày', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3) },
      { label: '+7 ngày', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7) },
      { label: '+14 ngày', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14) },
      { label: '+30 ngày', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30) },
    ];

    return (
      <Modal
        visible={datePickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setDatePickerVisible(false);
          setDatePickerField(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {datePickerField === 'order_date' ? 'Chọn ngày đặt hàng' : 'Chọn ngày giao hàng'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setDatePickerVisible(false);
                  setDatePickerField(null);
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.datePickerContent}>
              {quickDates.map((item, index) => {
                const dateString = item.date.toISOString().split('T')[0];
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.datePickerOption}
                    onPress={() => handleSelectDate(dateString)}
                  >
                    <View style={styles.datePickerOptionContent}>
                      <Text style={styles.datePickerOptionLabel}>{item.label}</Text>
                      <Text style={styles.datePickerOptionDate}>
                        {item.date.toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                );
              })}

              {datePickerField === 'expected_delivery_date' && (
                <TouchableOpacity
                  style={[styles.datePickerOption, styles.datePickerClear]}
                  onPress={() => handleSelectDate('')}
                >
                  <View style={styles.datePickerOptionContent}>
                    <Text style={styles.datePickerClearText}>Xóa ngày giao</Text>
                  </View>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }
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
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pickerPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  pickerSelectedText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyItemsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  itemCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemHeaderLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemSpec: {
    fontSize: 13,
    color: '#6B7280',
  },
  removeButton: {
    padding: 4,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  itemField: {
    flex: 1,
  },
  itemFieldLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  itemInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
    color: '#111827',
  },
  itemInputReadonly: {
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
    color: '#6B7280',
  },
  itemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  itemTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  itemTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  discountValue: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  bottomPadding: {
    height: 100,
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#3B82F6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  modalItemSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  modalItemBadge: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
    fontWeight: '500',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  modalEmpty: {
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 14,
    color: '#9CA3AF',
  },
  modalEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalEmptyButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalEmptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  datePickerContent: {
    maxHeight: 400,
  },
  datePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  datePickerOptionContent: {
    flex: 1,
  },
  datePickerOptionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  datePickerOptionDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  datePickerClear: {
    backgroundColor: '#FEE2E2',
  },
  datePickerClearText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#EF4444',
  },
});
