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

export default function SalesOrderFormScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { api } = useApi();
    const { mode, orderId } = route.params || {};
    const isEditMode = mode === 'edit' && orderId;

    // Loading states
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);

    // Data states
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [units, setUnits] = useState([]);

    // Form data
    const [formData, setFormData] = useState({
        customer_id: null,
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        notes: '',
    });

    const [items, setItems] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Modal states
    const [customerModalVisible, setCustomerModalVisible] = useState(false);
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
        unit_id: '',
        unit_price: '',
        discount_percentage: '0',
        tax_percentage: '0',
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

            const [customersRes, productsRes, unitsRes] = await Promise.all([
                api.get('/api/customers'),
                api.get('/api/products?include={"product_specifications":true}'),
                api.get('/api/units'),
            ]);

            const customersData = Array.isArray(customersRes.data) ? customersRes.data : (customersRes.data?.data || []);
            const productsData = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.data || []);
            const unitsData = Array.isArray(unitsRes.data) ? unitsRes.data : (unitsRes.data?.data || []);

            setCustomers(customersData);
            setProducts(productsData);
            setUnits(unitsData);

            if (isEditMode) {
                await loadExistingOrder();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.error('Lỗi', 'Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const loadExistingOrder = async () => {
        try {
            const response = await api.get(`/api/sales_orders/${orderId}?include={"customers":true,"sales_order_items":{"include":{"products":true,"product_specifications":true}}}`);
            const order = response.data;

            setFormData({
                customer_id: order.customer_id,
                order_date: order.order_date?.split('T')[0] || '',
                expected_delivery_date: order.expected_delivery_date?.split('T')[0] || '',
                notes: order.notes || '',
            });

            setSelectedCustomer(order.customers);

            if (order.sales_order_items) {
                const loadedItems = order.sales_order_items.map(item => ({
                    product_id: item.product_id,
                    product_specification_id: item.product_specification_id,
                    product_name: item.products?.name || '',
                    specification: item.product_specifications,
                    quantity: item.quantity.toString(),
                    unit_id: item.unit_id,
                    unit_price: item.unit_price.toString(),
                    discount_percentage: item.discount_percentage?.toString() || '0',
                    tax_percentage: item.tax_percentage?.toString() || '0',
                }));
                setItems(loadedItems);
            }
        } catch (error) {
            console.error('Error loading order:', error);
            Alert.error('Lỗi', 'Không thể tải đơn hàng');
        }
    };

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setFormData({ ...formData, customer_id: customer.id });
        setCustomerModalVisible(false);
    };

    const handleAddItem = () => {
        setEditingItemIndex(null);
        setProductModalVisible(true);
        setProductSearchQuery('');
        // Reset item form
        setItemForm({
            product_id: '',
            product_specification_id: null,
            quantity: '',
            unit_id: '',
            unit_price: '',
            discount_percentage: '0',
            tax_percentage: '0',
        });
    };

    const handleSelectProduct = (product) => {
        setSelectedProductForItem(product);
        setProductModalVisible(false);

        // Pre-fill item form
        setItemForm({
            ...itemForm,
            product_id: product.id,
            unit_id: product.unit_id || '',
            unit_price: '',
            product_specification_id: product.product_specifications?.[0]?.id || null,
        });

        setItemFormModalVisible(true);
    };

    const handleEditItem = (index) => {
        const item = items[index];
        const product = products.find(p => p.id === item.product_id);

        setEditingItemIndex(index);
        setSelectedProductForItem(product);
        setItemForm({
            product_id: item.product_id,
            product_specification_id: item.product_specification_id,
            quantity: item.quantity,
            unit_id: item.unit_id,
            unit_price: item.unit_price,
            discount_percentage: item.discount_percentage || '0',
            tax_percentage: item.tax_percentage || '0',
        });
        setItemFormModalVisible(true);
    };

    const handleSaveItem = () => {
        if (!itemForm.quantity || !itemForm.unit_price) {
            Alert.error('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }

        const quantity = parseFloat(itemForm.quantity);
        const unitPrice = parseFloat(itemForm.unit_price);
        const discountPct = parseFloat(itemForm.discount_percentage || 0);
        const taxPct = parseFloat(itemForm.tax_percentage || 0);

        const subtotal = quantity * unitPrice;
        const discountAmount = subtotal * (discountPct / 100);
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * (taxPct / 100);
        const totalAmount = taxableAmount + taxAmount;

        const newItem = {
            product_id: itemForm.product_id,
            product_specification_id: itemForm.product_specification_id,
            product_name: selectedProductForItem?.name || '',
            specification: selectedProductForItem?.product_specifications?.find(s => s.id === itemForm.product_specification_id),
            quantity: itemForm.quantity,
            unit_id: itemForm.unit_id,
            unit_price: itemForm.unit_price,
            discount_percentage: itemForm.discount_percentage,
            tax_percentage: itemForm.tax_percentage,
            total_amount: totalAmount,
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

    const calculateTotals = () => {
        let totalAmount = 0;
        let totalDiscount = 0;
        let totalTax = 0;

        items.forEach(item => {
            const quantity = parseFloat(item.quantity);
            const unitPrice = parseFloat(item.unit_price);
            const discountPct = parseFloat(item.discount_percentage || 0);
            const taxPct = parseFloat(item.tax_percentage || 0);

            const subtotal = quantity * unitPrice;
            const discountAmount = subtotal * (discountPct / 100);
            const taxableAmount = subtotal - discountAmount;
            const taxAmount = taxableAmount * (taxPct / 100);

            totalAmount += subtotal;
            totalDiscount += discountAmount;
            totalTax += taxAmount;
        });

        const finalAmount = totalAmount - totalDiscount + totalTax;

        return {
            totalAmount,
            discountAmount: totalDiscount,
            taxAmount: totalTax,
            finalAmount,
        };
    };

    const handleSave = async () => {
        // Validation
        if (!formData.customer_id) {
            Alert.error('Lỗi', 'Vui lòng chọn khách hàng');
            return;
        }

        if (!formData.order_date) {
            Alert.error('Lỗi', 'Vui lòng nhập ngày đặt hàng');
            return;
        }

        if (items.length === 0) {
            Alert.error('Lỗi', 'Vui lòng thêm ít nhất một sản phẩm');
            return;
        }

        try {
            setSaving(true);

            const totals = calculateTotals();

            const orderData = {
                customer_id: formData.customer_id,
                order_date: formData.order_date ? new Date(formData.order_date).toISOString() : new Date().toISOString(),
                expected_delivery_date: formData.expected_delivery_date ? new Date(formData.expected_delivery_date).toISOString() : null,
                total_amount: totals.totalAmount,
                discount_amount: totals.discountAmount,
                tax_amount: totals.taxAmount,
                final_amount: totals.finalAmount,
                status: 'draft',
                notes: formData.notes,
                sales_order_items: {
                    create: items.map(item => ({
                        products: {
                            connect: { id: item.product_id }
                        },
                        quantity: parseFloat(item.quantity),
                        unit_id: item.unit_id ? parseInt(item.unit_id) : 1, // Default to unit 1 if not set
                        unit_price: parseFloat(item.unit_price),
                        discount_percentage: parseFloat(item.discount_percentage || 0),
                        tax_percentage: parseFloat(item.tax_percentage || 0),
                        total_amount: item.total_amount,
                    }))
                },
            };

            if (isEditMode) {
                await api.put(`/api/sales_orders/${orderId}`, orderData);
                Alert.success('Thành công!', 'Đơn hàng đã được cập nhật', () => {
                    navigation.goBack();
                });
            } else {
                await api.post('/api/sales_orders', orderData);
                Alert.success('Thành công!', 'Đơn hàng đã được tạo', () => {
                    navigation.goBack();
                });
            }
        } catch (error) {
            console.error('Error saving order:', error);
            Alert.error('Lỗi', 'Không thể lưu đơn hàng');
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

    const getUnitName = (unitId) => {
        const unit = units.find(u => u.id === unitId);
        return unit?.name || 'N/A';
    };

    const renderItem = ({ item, index }) => (
        <View style={styles.itemCard}>
            <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.product_name}</Text>
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
                <Text style={styles.itemDetailText}>SL: {item.quantity} {getUnitName(item.unit_id)}</Text>
                <Text style={styles.itemDetailText}>Đơn giá: {formatCurrency(parseFloat(item.unit_price))}</Text>
            </View>

            {(parseFloat(item.discount_percentage) > 0 || parseFloat(item.tax_percentage) > 0) && (
                <View style={styles.itemDetails}>
                    {parseFloat(item.discount_percentage) > 0 && (
                        <Text style={styles.itemDetailText}>Giảm: {item.discount_percentage}%</Text>
                    )}
                    {parseFloat(item.tax_percentage) > 0 && (
                        <Text style={styles.itemDetailText}>Thuế: {item.tax_percentage}%</Text>
                    )}
                </View>
            )}

            <Text style={styles.itemTotal}>Thành tiền: {formatCurrency(item.total_amount)}</Text>
        </View>
    );

    const renderCustomerModal = () => (
        <Modal
            visible={customerModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setCustomerModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Chọn Khách Hàng</Text>
                        <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={customers}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.modalItem}
                                onPress={() => handleSelectCustomer(item)}
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

                    <View style={styles.modalSearchContainer}>
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            style={styles.modalSearchInput}
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
        </Modal >
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
                            {/* Selected Product Info */}
                            <View style={styles.selectedProductInfo}>
                                <Text style={styles.selectedProductName}>{selectedProductForItem.name}</Text>
                                {selectedProductForItem.code && (
                                    <Text style={styles.selectedProductCode}>{selectedProductForItem.code}</Text>
                                )}
                            </View>

                            {/* Specification Selection */}
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

                            {/* Quantity */}
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

                            {/* Unit Price */}
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

                            {/* Discount */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Chiết khấu (%)</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        value={itemForm.discount_percentage}
                                        onChangeText={(text) => setItemForm({ ...itemForm, discount_percentage: text })}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            {/* Tax */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Thuế (%)</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        value={itemForm.tax_percentage}
                                        onChangeText={(text) => setItemForm({ ...itemForm, tax_percentage: text })}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            {/* Save Button */}
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

    const totals = calculateTotals();

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Customer Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Khách Hàng *</Text>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => setCustomerModalVisible(true)}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={selectedCustomer ? styles.selectorTextSelected : styles.selectorText}>
                                {selectedCustomer ? selectedCustomer.name : 'Chọn khách hàng'}
                            </Text>
                            {selectedCustomer?.code && (
                                <Text style={styles.selectorSubtext}>{selectedCustomer.code}</Text>
                            )}
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* Order Date */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ngày đặt hàng *</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="calendar" size={20} color="#6B7280" />
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            value={formData.order_date}
                            onChangeText={(text) => setFormData({ ...formData, order_date: text })}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>
                </View>

                {/* Expected Delivery Date */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ngày dự kiến giao</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="time" size={20} color="#6B7280" />
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            value={formData.expected_delivery_date}
                            onChangeText={(text) => setFormData({ ...formData, expected_delivery_date: text })}
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
                            renderItem={renderItem}
                            keyExtractor={(item, index) => index.toString()}
                            scrollEnabled={false}
                        />
                    )}
                </View>

                {/* Summary */}
                {items.length > 0 && (
                    <View style={styles.summarySection}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tổng tiền hàng:</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(totals.totalAmount)}</Text>
                        </View>
                        {totals.discountAmount > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Chiết khấu:</Text>
                                <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                                    -{formatCurrency(totals.discountAmount)}
                                </Text>
                            </View>
                        )}
                        {totals.taxAmount > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Thuế:</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(totals.taxAmount)}</Text>
                            </View>
                        )}
                        <View style={[styles.summaryRow, styles.summaryTotal]}>
                            <Text style={styles.summaryTotalLabel}>Tổng cộng:</Text>
                            <Text style={styles.summaryTotalValue}>{formatCurrency(totals.finalAmount)}</Text>
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
                            {saving ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Tạo đơn hàng'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Modals */}
            {renderCustomerModal()}
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
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
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
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
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
        marginTop: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingHorizontal: 12,
        gap: 8,
    },
    input: {
        paddingVertical: 12,
        fontSize: 15,
        color: '#111827',
    },
    textArea: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingHorizontal: 12,
        paddingVertical: 12,
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
        marginBottom: 8,
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
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    itemSpec: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 8,
    },
    itemDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemDetailText: {
        fontSize: 13,
        color: '#6B7280',
    },
    itemTotal: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10B981',
        marginTop: 8,
        textAlign: 'right',
    },
    summarySection: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
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
        fontWeight: '500',
        color: '#111827',
    },
    summaryTotal: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    summaryTotalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    summaryTotalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10B981',
    },
    footer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12,
    },
    button: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    saveButton: {
        flex: 2,
    },
    saveButtonGradient: {
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        width: '100%',
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
        padding: 16,
    },
    modalSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 8,
    },
    modalSearchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 15,
        color: '#111827',
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalItemTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#111827',
    },
    modalItemSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    selectedProductInfo: {
        backgroundColor: '#D1FAE5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    selectedProductName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    selectedProductCode: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 8,
    },
    specificationOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 12,
    },
    specificationOptionActive: {
        backgroundColor: '#D1FAE5',
        borderColor: '#10B981',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#10B981',
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
        marginTop: 16,
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});
