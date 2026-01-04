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

export default function WarrantyFormScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { api } = useApi();
    const warrantyItem = route.params?.warrantyItem;
    const isEditMode = !!warrantyItem;

    // State
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        warehouse_id: '',
        warranty_date: new Date().toISOString().split('T')[0],
        notes: '',
    });
    const [items, setItems] = useState([]);

    // Master data
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
        fetchMasterData();
        if (isEditMode && warrantyItem) {
            loadWarrantyData();
        }
    }, []);

    const fetchMasterData = async () => {
        try {
            const [warehousesRes, productsRes, unitsRes] = await Promise.all([
                api.get('/api/warehouses'),
                api.get('/api/products'),
                api.get('/api/units'),
            ]);

            const warehousesData = warehousesRes.data;
            const productsData = productsRes.data;
            const unitsData = unitsRes.data;

            const finalWarehouses = Array.isArray(warehousesData) ? warehousesData : (warehousesData?.data || []);
            const finalProducts = Array.isArray(productsData) ? productsData : (productsData?.data || []);
            const finalUnits = Array.isArray(unitsData) ? unitsData : (unitsData?.data || []);

            setWarehouses(finalWarehouses);
            setProducts(finalProducts);
            setUnits(finalUnits);

            // Fetch specifications
            try {
                const specsRes = await api.get('/api/product_specifications');
                const specsData = specsRes.data;
                const allSpecs = Array.isArray(specsData) ? specsData : (specsData?.data || []);

                if (allSpecs.length > 0) {
                    const productsWithSpecs = finalProducts.map(product => {
                        const productSpecs = allSpecs.filter(spec => spec.product_id === product.id);
                        return {
                            ...product,
                            product_specifications: productSpecs,
                        };
                    });
                    setProducts(productsWithSpecs);
                }
            } catch (specsError) {
                console.error('Error fetching specifications:', specsError);
            }
        } catch (error) {
            console.error('Error fetching master data:', error);
            Alert.error('Lỗi', 'Không thể tải dữ liệu');
        }
    };

    const loadWarrantyData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/inventory_transactions/${warrantyItem.id}?include={"inventory_transaction_logs":true}`);
            const data = response.data;

            setFormData({
                warehouse_id: data.source_warehouse_id || '',
                warranty_date: data.transaction_date ? new Date(data.transaction_date).toISOString().split('T')[0] : '',
                notes: data.description || '',
            });

            const loadedItems = (data.inventory_transaction_logs || []).map(log => ({
                product_id: log.product_id,
                product_specification_id: log.product_specification_id || null,
                quantity: log.quantity?.toString() || '',
                unit_id: log.unit_id || '',
                cost: log.cost?.toString() || '',
            }));

            setItems(loadedItems);
        } catch (error) {
            console.error('Error loading warranty data:', error);
            Alert.error('Lỗi', 'Không thể tải thông tin phiếu bảo hành');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectWarehouse = (warehouse) => {
        setFormData({ ...formData, warehouse_id: warehouse.id });
        setWarehouseModalVisible(false);
    };

    const handleAddItem = () => {
        setEditingItemIndex(null);
        setSelectedProductForItem(null);
        setItemForm({
            product_id: '',
            product_specification_id: null,
            quantity: '',
            unit_id: '',
            cost: '',
        });
        setItemFormModalVisible(true);
    };

    const handleEditItem = (index) => {
        const item = items[index];
        const product = products.find(p => p.id === item.product_id);

        setEditingItemIndex(index);
        setSelectedProductForItem(product || null);
        setItemForm({ ...item });
        setItemFormModalVisible(true);
    };

    const handleDeleteItem = (index) => {
        Alert.confirm(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa sản phẩm này?',
            () => {
                const newItems = [...items];
                newItems.splice(index, 1);
                setItems(newItems);
            }
        );
    };

    const handleSelectProductForItem = (product) => {
        console.log('📦 Selected product:', product.name);
        console.log('📦 Product has specifications:', product.product_specifications?.length || 0);
        if (product.product_specifications?.length > 0) {
            console.log('📦 Full spec objects:', JSON.stringify(product.product_specifications, null, 2));
            console.log('📦 Spec names:', product.product_specifications.map(s => s.name || s.specification_name || s.value || 'NO NAME'));
        }

        setSelectedProductForItem(product);
        setItemForm({
            ...itemForm,
            product_id: product.id,
            unit_id: product.unit_id || '',
            product_specification_id: null,
        });
        setProductModalVisible(false);
    };

    const handleSaveItem = () => {
        if (!itemForm.product_id) {
            Alert.error('Lỗi', 'Vui lòng chọn sản phẩm');
            return;
        }

        if (!itemForm.quantity || parseFloat(itemForm.quantity) <= 0) {
            Alert.error('Lỗi', 'Vui lòng nhập số lượng hợp lệ');
            return;
        }

        const newItem = { ...itemForm };
        const newItems = [...items];

        if (editingItemIndex !== null) {
            newItems[editingItemIndex] = newItem;
        } else {
            newItems.push(newItem);
        }

        setItems(newItems);
        setItemFormModalVisible(false);
    };

    const handleSave = async () => {
        // Validation
        if (!formData.warehouse_id) {
            Alert.error('Lỗi', 'Vui lòng chọn kho');
            return;
        }

        if (items.length === 0) {
            Alert.error('Lỗi', 'Vui lòng thêm ít nhất 1 sản phẩm');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                transaction_type: 'warranty',
                reference_type: 'warranty',
                source_warehouse_id: formData.warehouse_id,
                transaction_date: new Date(formData.warranty_date).toISOString(),
                description: formData.notes || null,
                code: `WR-${new Date().getFullYear()}-${Date.now()}`,
                inventory_transaction_logs: {
                    create: items.map(item => ({
                        product_id: item.product_id,
                        product_specification_id: item.product_specification_id,
                        quantity: parseFloat(item.quantity),
                        unit_id: item.unit_id || null,
                        cost: parseFloat(item.cost) || 0,
                        total: (parseFloat(item.quantity) || 0) * (parseFloat(item.cost) || 0),
                    })),
                },
            };

            if (isEditMode) {
                // Update existing
                await api.put(`/api/inventory_transactions/${warrantyItem.id}`, payload);
                Alert.success('Thành công!', 'Phiếu bảo hành đã được cập nhật', () => {
                    navigation.goBack();
                });
            } else {
                // Create new - 2 steps to avoid nested create issues
                // Step 1: Create transaction without logs
                const transactionPayload = {
                    transaction_type: 'warranty',
                    reference_type: 'warranty',
                    source_warehouse_id: formData.warehouse_id,
                    transaction_date: new Date(formData.warranty_date).toISOString(),
                    description: formData.notes || null,
                    code: `WR-${new Date().getFullYear()}-${Date.now()}`,
                };

                const response = await api.post('/api/inventory_transactions', transactionPayload);
                const transactionId = response.data.id;

                // Step 2: Create logs separately
                for (const item of items) {
                    await api.post('/api/inventory_transaction_logs', {
                        transaction_id: transactionId,
                        product_id: item.product_id,
                        product_specification_id: item.product_specification_id,
                        quantity: parseFloat(item.quantity),
                        unit_id: item.unit_id || null,
                        cost: parseFloat(item.cost) || 0,
                        total: (parseFloat(item.quantity) || 0) * (parseFloat(item.cost) || 0),
                        products: { connect: { id: item.product_id } },
                    });
                }

                Alert.success('Thành công!', 'Phiếu bảo hành đã được tạo', () => {
                    navigation.goBack();
                });
            }
        } catch (error) {
            console.error('Error saving warranty:', error);
            Alert.error('Lỗi', error.response?.data?.error || 'Không thể lưu phiếu bảo hành');
        } finally {
            setLoading(false);
        }
    };

    const selectedWarehouse = warehouses.find(w => w.id === formData.warehouse_id);

    const getFilteredProducts = () => {
        if (!productSearchQuery.trim()) return products;
        const searchLower = productSearchQuery.toLowerCase();
        return products.filter(p =>
            p.name?.toLowerCase().includes(searchLower) ||
            p.code?.toLowerCase().includes(searchLower)
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.headerCard}>
                    <LinearGradient colors={['#F97316', '#EA580C']} style={styles.headerGradient}>
                        <Ionicons name="construct" size={32} color="#fff" />
                        <Text style={styles.headerTitle}>
                            {isEditMode ? 'Sửa Phiếu Bảo Hành' : 'Tạo Phiếu Bảo Hành'}
                        </Text>
                    </LinearGradient>
                </View>

                {/* Warehouse Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Kho bảo hành *</Text>
                    <TouchableOpacity
                        style={styles.selectionButton}
                        onPress={() => setWarehouseModalVisible(true)}
                    >
                        <Ionicons name="home" size={20} color="#F97316" />
                        <Text style={selectedWarehouse ? styles.selectedText : styles.placeholderText}>
                            {selectedWarehouse ? selectedWarehouse.name : 'Chọn kho'}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* Warranty Date */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ngày tiếp nhận *</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="calendar" size={20} color="#6B7280" />
                        <RNTextInput
                            style={styles.input}
                            value={formData.warranty_date}
                            onChangeText={(text) => setFormData({ ...formData, warranty_date: text })}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>
                </View>

                {/* Items List */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Sản phẩm bảo hành *</Text>
                        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
                            <Ionicons name="add-circle" size={24} color="#F97316" />
                            <Text style={styles.addButtonText}>Thêm SP</Text>
                        </TouchableOpacity>
                    </View>

                    {items.length === 0 ? (
                        <View style={styles.emptyItems}>
                            <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyItemsText}>Chưa có sản phẩm nào</Text>
                        </View>
                    ) : (
                        items.map((item, index) => {
                            const product = products.find(p => p.id === item.product_id);
                            const unit = units.find(u => u.id === item.unit_id);
                            const spec = product?.product_specifications?.find(s => s.id === item.product_specification_id);

                            return (
                                <View key={index} style={styles.itemCard}>
                                    <View style={styles.itemHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemProductName}>{product?.name || 'N/A'}</Text>
                                            {spec && <Text style={styles.itemSpec}>{spec.spec_name || spec.spec_value}</Text>}
                                        </View>
                                        <View style={styles.itemActions}>
                                            <TouchableOpacity onPress={() => handleEditItem(index)} style={styles.itemActionButton}>
                                                <Ionicons name="pencil" size={18} color="#F97316" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDeleteItem(index)} style={styles.itemActionButton}>
                                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={styles.itemDetails}>
                                        <Text style={styles.itemDetailText}>SL: {item.quantity} {unit?.name || ''}</Text>
                                        {item.cost && <Text style={styles.itemDetailText}>Chi phí: {item.cost} ₫</Text>}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Notes */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ghi chú</Text>
                    <RNTextInput
                        style={[styles.inputContainer, styles.textArea]}
                        value={formData.notes}
                        onChangeText={(text) => setFormData({ ...formData, notes: text })}
                        placeholder="Nhập ghi chú (không bắt buộc)"
                        multiline
                        numberOfLines={4}
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
                    disabled={loading}
                >
                    <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <LinearGradient colors={['#F97316', '#EA580C']} style={styles.saveButtonGradient}>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.saveButtonText}>
                            {loading ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Tạo phiếu'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Warehouse Modal */}
            <Modal visible={warehouseModalVisible} animationType="slide" onRequestClose={() => setWarehouseModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Chọn Kho</Text>
                        <TouchableOpacity onPress={() => setWarehouseModalVisible(false)}>
                            <Ionicons name="close" size={28} color="#111827" />
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
                                <Text style={styles.modalItemName}>{item.name}</Text>
                                {formData.warehouse_id === item.id && (
                                    <Ionicons name="checkmark-circle" size={24} color="#F97316" />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>

            {/* Product Modal */}
            <Modal visible={productModalVisible} animationType="slide" onRequestClose={() => setProductModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Chọn Sản Phẩm</Text>
                        <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                            <Ionicons name="close" size={28} color="#111827" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalSearchContainer}>
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <RNTextInput
                            style={styles.modalSearchInput}
                            value={productSearchQuery}
                            onChangeText={setProductSearchQuery}
                            placeholder="Tìm kiếm sản phẩm..."
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <FlatList
                        data={getFilteredProducts()}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.modalItem}
                                onPress={() => handleSelectProductForItem(item)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.modalItemName}>{item.name}</Text>
                                    {item.code && <Text style={styles.modalItemCode}>{item.code}</Text>}
                                </View>
                                {selectedProductForItem?.id === item.id && (
                                    <Ionicons name="checkmark-circle" size={24} color="#F97316" />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>

            {/* Item Form Modal */}
            <Modal visible={itemFormModalVisible} animationType="slide" transparent onRequestClose={() => setItemFormModalVisible(false)}>
                <View style={styles.itemModalOverlay}>
                    <View style={styles.itemModalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingItemIndex !== null ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm'}</Text>
                            <TouchableOpacity onPress={() => setItemFormModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#111827" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.itemFormScroll}>
                            {/* Product Selection */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Sản phẩm *</Text>
                                <TouchableOpacity
                                    style={styles.selectionButton}
                                    onPress={() => setProductModalVisible(true)}
                                >
                                    <Ionicons name="cube" size={20} color="#F97316" />
                                    <Text style={selectedProductForItem ? styles.selectedText : styles.placeholderText}>
                                        {selectedProductForItem ? selectedProductForItem.name : 'Chọn sản phẩm'}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            {/* Specifications */}
                            {selectedProductForItem?.product_specifications?.length > 0 && (
                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Quy cách</Text>
                                    <View style={styles.specsContainer}>
                                        {/* None option */}
                                        <TouchableOpacity
                                            style={[
                                                styles.specButton,
                                                itemForm.product_specification_id === null && styles.specButtonActive,
                                            ]}
                                            onPress={() => {
                                                console.log('Selected: None');
                                                setItemForm({ ...itemForm, product_specification_id: null });
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.specButtonText,
                                                    itemForm.product_specification_id === null && styles.specButtonTextActive,
                                                ]}
                                            >
                                                Không
                                            </Text>
                                        </TouchableOpacity>

                                        {selectedProductForItem.product_specifications.map((spec) => (
                                            <TouchableOpacity
                                                key={spec.id}
                                                style={[
                                                    styles.specButton,
                                                    itemForm.product_specification_id === spec.id && styles.specButtonActive,
                                                ]}
                                                onPress={() => {
                                                    console.log('Selected spec:', spec.id, spec.spec_name || spec.spec_value);
                                                    console.log('Current itemForm.product_specification_id:', itemForm.product_specification_id);
                                                    setItemForm({ ...itemForm, product_specification_id: spec.id });
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.specButtonText,
                                                        itemForm.product_specification_id === spec.id && styles.specButtonTextActive,
                                                    ]}
                                                >
                                                    {spec.spec_name || spec.spec_value}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Quantity */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Số lượng *</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="layers" size={20} color="#6B7280" />
                                    <RNTextInput
                                        style={styles.input}
                                        value={itemForm.quantity}
                                        onChangeText={(text) => setItemForm({ ...itemForm, quantity: text })}
                                        placeholder="Nhập số lượng"
                                        keyboardType="numeric"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            {/* Cost */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Chi phí sửa chữa</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="cash" size={20} color="#6B7280" />
                                    <RNTextInput
                                        style={styles.input}
                                        value={itemForm.cost}
                                        onChangeText={(text) => setItemForm({ ...itemForm, cost: text })}
                                        placeholder="Nhập chi phí"
                                        keyboardType="numeric"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                    <Text style={styles.inputSuffix}>₫</Text>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.itemModalFooter}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setItemFormModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={handleSaveItem}
                            >
                                <LinearGradient colors={['#F97316', '#EA580C']} style={styles.saveButtonGradient}>
                                    <Text style={styles.saveButtonText}>Lưu</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
    scrollContent: {
        paddingBottom: 100,
    },
    headerCard: {
        margin: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    headerGradient: {
        padding: 20,
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F97316',
    },
    selectionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    selectedText: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },
    placeholderText: {
        flex: 1,
        fontSize: 15,
        color: '#9CA3AF',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        padding: 0,
    },
    inputSuffix: {
        fontSize: 15,
        color: '#6B7280',
    },
    textArea: {
        minHeight: 100,
        paddingVertical: 12,
        alignItems: 'flex-start',
    },
    emptyItems: {
        backgroundColor: '#fff',
        padding: 40,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    emptyItemsText: {
        marginTop: 12,
        fontSize: 14,
        color: '#9CA3AF',
    },
    itemCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    itemHeader: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    itemProductName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    itemSpec: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    itemActions: {
        flexDirection: 'row',
        gap: 8,
    },
    itemActionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemDetails: {
        flexDirection: 'row',
        gap: 16,
    },
    itemDetailText: {
        fontSize: 13,
        color: '#6B7280',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
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
        borderRadius: 12,
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 8,
    },
    modalSearchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    modalItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    modalItemCode: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    itemModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    itemModalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    itemFormScroll: {
        padding: 16,
    },
    formGroup: {
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    specsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    specButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    specButtonActive: {
        backgroundColor: '#FFEDD5',
        borderColor: '#F97316',
    },
    specButtonText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    specButtonTextActive: {
        color: '#F97316',
    },
    itemModalFooter: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12,
    },
});
