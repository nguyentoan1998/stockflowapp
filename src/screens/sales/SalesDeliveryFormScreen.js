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

export default function SalesDeliveryFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { api } = useApi();
  const { mode, deliveryId, orderId } = route.params || {};
  const isEditMode = mode === 'edit' && deliveryId;

  // Loading states
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  // Data states
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    sales_order_id: orderId || null,
    customer_id: null,
    warehouse_id: null,
    delivery_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [items, setItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);

  // Modal states
  const [salesOrderModalVisible, setSalesOrderModalVisible] = useState(false);
  const [warehouseModalVisible, setWarehouseModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [itemFormModalVisible, setItemFormModalVisible] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [selectedProductForItem, setSelectedProductForItem] = useState(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Item form state
  const [itemForm, setItemForm] = useState({
    product_id: '',
    product_specification_id: null,
    quantity: '',
    unit_id: 1, // Default unit
    unit_price: '',
  });

  // Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [customersRes, warehousesRes, productsRes, salesOrdersRes] = await Promise.all([
        api.get('/api/customers'),
        api.get('/api/warehouses'),
        api.get('/api/products?include={"product_specifications":true}'),
        api.get('/api/sales_orders?filter={"status":"approved"}&include={"customers":true,"sales_order_items":{"include":{"products":true,"product_specifications":true}}}'),
      ]);

      setCustomers(Array.isArray(customersRes.data) ? customersRes.data : (customersRes.data?.data || []));
      setWarehouses(Array.isArray(warehousesRes.data) ? warehousesRes.data : (warehousesRes.data?.data || []));
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.data || []));
      setSalesOrders(Array.isArray(salesOrdersRes.data) ? salesOrdersRes.data : (salesOrdersRes.data?.data || []));

      if (isEditMode) {
        await loadExistingDelivery();
      } else if (orderId) {
        // Auto-load order if orderId provided
        const order = (Array.isArray(salesOrdersRes.data) ? salesOrdersRes.data : (salesOrdersRes.data?.data || [])).find(o => o.id === orderId);
        if (order) {
          await handleSelectSalesOrder(order);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.error('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingDelivery = async () => {
    try {
      const response = await api.get(
        `/api/sales_deliveries/${deliveryId}?include={"customers":true,"warehouses":true,"sales_delivery_items":{"include":{"products":true,"product_specifications":true}}}`
      );
      const delivery = response.data;

      setFormData({
        sales_order_id: delivery.sales_order_id,
        customer_id: delivery.customer_id,
        warehouse_id: delivery.warehouse_id,
        delivery_date: delivery.delivery_date?.split('T')[0] || '',
        notes: delivery.notes || '',
      });

      setSelectedCustomer(delivery.customers);
      setSelectedWarehouse(delivery.warehouses);

      const loadedItems = (delivery.sales_delivery_items || []).map(item => ({
        product_id: item.product_id,
        product_specification_id: item.product_specification_id,
        quantity: item.quantity?.toString() || '',
        unit_price: item.unit_price?.toString() || '',
        product: item.products,
        specification: item.product_specifications,
      }));

      setItems(loadedItems);
    } catch (error) {
      console.error('Error loading delivery:', error);
      Alert.error('Lỗi', 'Không thể tải thông tin phiếu xuất');
      navigation.goBack();
    }
  };

  const handleSelectSalesOrder = async (salesOrder) => {
    try {
      setSelectedSalesOrder(salesOrder);
      setFormData({
        ...formData,
        sales_order_id: salesOrder.id,
        customer_id: salesOrder.customer_id,
      });

      const customer = customers.find(c => c.id === salesOrder.customer_id);
      if (customer) {
        setSelectedCustomer(customer);
      }

      // Load items from sales order
      const orderItems = salesOrder.sales_order_items || [];
      const loadedItems = orderItems.map(item => ({
        product_id: item.product_id,
        product_specification_id: item.product_specification_id,
        quantity: item.quantity?.toString() || '',
        unit_id: item.unit_id || 1,
        unit_price: item.unit_price?.toString() || '',
        product: item.products,
        specification: item.product_specifications,
      }));

      setItems(loadedItems);
      setSalesOrderModalVisible(false);
      Alert.success('Thành công', 'Đã tải sản phẩm từ đơn hàng');
    } catch (error) {
      console.error('Error selecting sales order:', error);
      Alert.error('Lỗi', 'Không thể tải dữ liệu đơn hàng');
    }
  };

  const handleSelectWarehouse = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormData({ ...formData, warehouse_id: warehouse.id });
    setWarehouseModalVisible(false);
  };

  const handleAddItem = () => {
    setEditingItemIndex(null);
    setProductModalVisible(true);
    setProductSearchQuery('');
    setItemForm({
      product_id: '',
      product_specification_id: null,
      quantity: '',
      unit_id: 1,
      unit_price: '',
    });
  };

  const handleSelectProduct = (product) => {
    setSelectedProductForItem(product);
    setProductModalVisible(false);

    setItemForm({
      ...itemForm,
      product_id: product.id,
      unit_id: product.unit_id || 1,
      unit_price: '',
      product_specification_id: product.product_specifications?.[0]?.id || null,
    });

    setItemFormModalVisible(true);
  };

  const handleEditItem = (index) => {
    const item = items[index];
    const product = products.find(p => p.id === item.product_id);

    setEditingItemIndex(index);
    setSelectedProductForItem(product || item.product);
    setItemForm({
      product_id: item.product_id,
      product_specification_id: item.product_specification_id,
      quantity: item.quantity,
      unit_id: item.unit_id || 1,
      unit_price: item.unit_price,
    });
    setItemFormModalVisible(true);
  };

  const handleSaveItem = () => {
    if (!itemForm.quantity || !itemForm.unit_price) {
      Alert.error('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const newItem = {
      product_id: itemForm.product_id,
      product_specification_id: itemForm.product_specification_id,
      quantity: itemForm.quantity,
      unit_id: itemForm.unit_id,
      unit_price: itemForm.unit_price,
      product: selectedProductForItem,
      specification: selectedProductForItem?.product_specifications?.find(s => s.id === itemForm.product_specification_id),
    };

    if (editingItemIndex !== null) {
      const updatedItems = [...items];
      updatedItems[editingItemIndex] = newItem;
      setItems(updatedItems);
    } else {
      setItems([...items, newItem]);
    }

    setItemFormModalVisible(false);
    setSelectedProductForItem(null);
  };

  const handleDeleteItem = (index) => {
    Alert.confirm(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa sản phẩm này?',
      () => {
        const updatedItems = items.filter((_, i) => i !== index);
        setItems(updatedItems);
      }
    );
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    }, 0);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.customer_id) {
      Alert.error('Lỗi', 'Vui lòng chọn khách hàng');
      return;
    }

    if (!formData.warehouse_id) {
      Alert.error('Lỗi', 'Vui lòng chọn kho xuất');
      return;
    }

    if (!formData.delivery_date) {
      Alert.error('Lỗi', 'Vui lòng nhập ngày xuất');
      return;
    }

    if (items.length === 0) {
      Alert.error('Lỗi', 'Vui lòng thêm ít nhất một sản phẩm');
      return;
    }

    try {
      setSaving(true);

      const totalAmount = calculateTotal();

      const deliveryData = {
        code: formData.code || `PX-${new Date().getFullYear()}-${Date.now()}`, // Auto-generate code if not exist
        sales_order_id: formData.sales_order_id,
        customer_id: formData.customer_id,
        warehouse_id: formData.warehouse_id,
        delivery_date: new Date(formData.delivery_date).toISOString(),
        total_amount: totalAmount,
        notes: formData.notes,
        sales_delivery_items: {
          create: items.map(item => {
            const itemData = {
              products: { connect: { id: item.product_id } },
              quantity: parseFloat(item.quantity),
              unit_id: item.unit_id || 1,
              unit_price: parseFloat(item.unit_price),
            };

            // Only add product_specifications if it exists
            if (item.product_specification_id) {
              itemData.product_specifications = {
                connect: { id: item.product_specification_id }
              };
            }

            return itemData;
          })
        },
      };

      if (isEditMode) {
        await api.put(`/api/sales_deliveries/${deliveryId}`, deliveryData);
        Alert.success('Thành công!', 'Phiếu xuất đã được cập nhật', () => {
          navigation.goBack();
        });
      } else {
        await api.post('/api/sales_deliveries', deliveryData);
        Alert.success('Thành công!', 'Phiếu xuất đã được tạo', () => {
          navigation.goBack();
        });
      }
    } catch (error) {
      console.error('Error saving delivery:', error);
      Alert.error('Lỗi', 'Không thể lưu phiếu xuất');
    } finally {
      setSaving(false);
    }
  };

  const getFilteredProducts = () => {
    if (!productSearchQuery) return products;
    const searchLower = productSearchQuery.toLowerCase();
    return products.filter(product =>
      product.name?.toLowerCase().includes(searchLower) ||
      product.code?.toLowerCase().includes(searchLower)
    );
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // ========== MODAL RENDERS ==========

  const renderSalesOrderModal = () => (
    <Modal
      visible={salesOrderModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setSalesOrderModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn Đơn Hàng Bán</Text>
            <TouchableOpacity onPress={() => setSalesOrderModalVisible(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={salesOrders}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleSelectSalesOrder(item)}
              >
                <View>
                  <Text style={styles.modalItemTitle}>{item.code}</Text>
                  <Text style={styles.modalItemSubtitle}>{item.customers?.name}</Text>
                  <Text style={styles.modalItemSubtitle}>{formatCurrency(item.final_amount)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không có đơn hàng đã xác nhận</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );

  const renderWarehouseModal = () => (
    <Modal
      visible={warehouseModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setWarehouseModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn Kho Xuất</Text>
            <TouchableOpacity onPress={() => setWarehouseModalVisible(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={warehouses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleSelectWarehouse(item)}
              >
                <View>
                  <Text style={styles.modalItemTitle}>{item.name}</Text>
                  {item.code && <Text style={styles.modalItemSubtitle}>{item.code}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderProductModal = () => (
    <Modal
      visible={productModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setProductModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn Sản Phẩm</Text>
            <TouchableOpacity onPress={() => setProductModalVisible(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm sản phẩm..."
              value={productSearchQuery}
              onChangeText={setProductSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <FlatList
            data={getFilteredProducts()}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.modalBody}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleSelectProduct(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalItemTitle}>{item.name}</Text>
                  {item.code && <Text style={styles.modalItemSubtitle}>{item.code}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderItemFormModal = () => {
    if (!selectedProductForItem) return null;

    const hasSpecs = selectedProductForItem.product_specifications && selectedProductForItem.product_specifications.length > 0;

    return (
      <Modal
        visible={itemFormModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setItemFormModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thông Tin Sản Phẩm</Text>
              <TouchableOpacity onPress={() => setItemFormModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.selectedProductInfo}>
                <Text style={styles.selectedProductName}>{selectedProductForItem.name}</Text>
                {selectedProductForItem.code && (
                  <Text style={styles.selectedProductCode}>{selectedProductForItem.code}</Text>
                )}
              </View>

              {hasSpecs && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quy cách</Text>
                  {selectedProductForItem.product_specifications.map((spec) => (
                    <TouchableOpacity
                      key={spec.id}
                      style={[
                        styles.specificationOption,
                        itemForm.product_specification_id === spec.id && styles.specificationOptionActive
                      ]}
                      onPress={() => setItemForm({ ...itemForm, product_specification_id: spec.id })}
                    >
                      <View style={styles.radioButton}>
                        {itemForm.product_specification_id === spec.id && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                      <Text style={styles.specificationText}>
                        {spec.spec_name}: {spec.spec_value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số lượng *</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={itemForm.quantity}
                    onChangeText={(text) => setItemForm({ ...itemForm, quantity: text })}
                    keyboardType="numeric"
                    placeholder="Nhập số lượng"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Đơn giá *</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={itemForm.unit_price}
                    onChangeText={(text) => setItemForm({ ...itemForm, unit_price: text })}
                    keyboardType="numeric"
                    placeholder="Nhập đơn giá"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveItemButton} onPress={handleSaveItem}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>Thêm vào danh sách</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const totalAmount = calculateTotal();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Sales Order Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đơn Hàng (Optional)</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setSalesOrderModalVisible(true)}
          >
            <View style={{ flex: 1 }}>
              <Text style={selectedSalesOrder ? styles.selectorTextSelected : styles.selectorText}>
                {selectedSalesOrder ? selectedSalesOrder.code : 'Chọn đơn hàng bán'}
              </Text>
              {selectedSalesOrder?.customers && (
                <Text style={styles.selectorSubtext}>{selectedSalesOrder.customers.name}</Text>
              )}
            </View>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Customer (auto from order or manual) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Khách Hàng *</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {selectedCustomer ? selectedCustomer.name : 'Tự động từ đơn hàng'}
            </Text>
          </View>
        </View>

        {/* Warehouse Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kho Xuất *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setWarehouseModalVisible(true)}
          >
            <View style={{ flex: 1 }}>
              <Text style={selectedWarehouse ? styles.selectorTextSelected : styles.selectorText}>
                {selectedWarehouse ? selectedWarehouse.name : 'Chọn kho xuất'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Delivery Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ngày xuất *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar" size={20} color="#6B7280" />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={formData.delivery_date}
              onChangeText={(text) => setFormData({ ...formData, delivery_date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Items List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danh Sách Sản Phẩm</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
              <Ionicons name="add-circle" size={24} color="#10B981" />
              <Text style={styles.addButtonText}>Thêm SP</Text>
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyItems}>
              <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyItemsText}>Chưa có sản phẩm nào</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              renderItem={({ item, index }) => (
                <View style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.product?.name || 'N/A'}</Text>
                    <View style={styles.itemActions}>
                      <TouchableOpacity onPress={() => handleEditItem(index)} style={styles.itemActionBtn}>
                        <Ionicons name="pencil" size={18} color="#10B981" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteItem(index)} style={styles.itemActionBtn}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {item.specification && (
                    <Text style={styles.itemSpec}>
                      {item.specification.spec_name}: {item.specification.spec_value}
                    </Text>
                  )}

                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDetailText}>SL: {item.quantity}</Text>
                    <Text style={styles.itemDetailText}>Đơn giá: {formatCurrency(parseFloat(item.unit_price))}</Text>
                  </View>

                  <Text style={styles.itemTotal}>
                    Thành tiền: {formatCurrency(parseFloat(item.quantity) * parseFloat(item.unit_price))}
                  </Text>
                </View>
              )}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Summary */}
        {items.length > 0 && (
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Tổng tiền:</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Nhập ghi chú (không bắt buộc)"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.saveButtonGradient}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Đang lưu...' : isEditMode ? 'C ập nhật' : 'Tạo phiếu xuất'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderSalesOrderModal()}
      {renderWarehouseModal()}
      {renderProductModal()}
      {renderItemFormModal()}

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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectorText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  selectorTextSelected: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  selectorSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#6B7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 40,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  itemActionBtn: {
    padding: 4,
  },
  itemSpec: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemDetailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'right',
  },
  summarySection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  footer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Modal styles
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
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalBody: {
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  modalItemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  selectedProductInfo: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  selectedProductCode: {
    fontSize: 13,
    color: '#6B7280',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  specificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    gap: 12,
  },
  specificationOptionActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
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
    backgroundColor: '#10B981',
  },
  specificationText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  saveItemButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
});
