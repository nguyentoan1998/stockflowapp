import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApi } from '../../contexts/ApiContext';
import { uploadImage } from '../../services/supabase';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function ProductFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { api } = useApi();
  
  const { mode, product } = route.params || { mode: 'add' };
  const isEditMode = mode === 'edit';

  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  // Form data
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category_id: null,
    base_unit_id: null,
    purchase_price: '0',
    sale_price: '0',
    product_type: 'raw_material',
    is_active: true,
    image_url: '',
  });

  // Dropdowns data
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  
  // Modal states for custom pickers
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'specs', 'units', 'bom'
  
  // Additional data
  const [warehouses, setWarehouses] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  
  // Child component data
  const [specifications, setSpecifications] = useState([]);
  const [unitConversions, setUnitConversions] = useState([]);
  const [bom, setBom] = useState([]);

  // Product types
  const productTypes = [
    { value: 'raw_material', label: 'Nguyên vật liệu' },
    { value: 'semi_finished', label: 'Bán thành phẩm' },
    { value: 'finished_product', label: 'Thành phẩm' },
    { value: 'tool', label: 'Công cụ' },
    { value: 'asset', label: 'Tài sản' },
    { value: 'food', label: 'Thực phẩm' },
    { value: 'service', label: 'Dịch vụ' },
  ];

  // Format number with thousand separators
  const formatPrice = (value) => {
    if (!value) return '';
    const number = value.toString().replace(/,/g, '');
    if (isNaN(number)) return value;
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Parse formatted price to number
  const parsePrice = (value) => {
    return value.toString().replace(/,/g, '');
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all required data
      const [categoriesRes, unitsRes, warehousesRes, productsRes] = await Promise.all([
        api.get('/api/product_category'),
        api.get('/api/units'),
        api.get('/api/warehouses'),
        api.get('/api/products'),
      ]);

      // Handle different response formats
      const categoriesData = Array.isArray(categoriesRes.data) 
        ? categoriesRes.data 
        : (categoriesRes.data?.data || []);
      const unitsData = Array.isArray(unitsRes.data) 
        ? unitsRes.data 
        : (unitsRes.data?.data || []);
      const warehousesData = Array.isArray(warehousesRes.data) 
        ? warehousesRes.data 
        : (warehousesRes.data?.data || []);
      const productsData = Array.isArray(productsRes.data) 
        ? productsRes.data 
        : (productsRes.data?.data || []);

      console.log('Categories loaded:', categoriesData.length);
      console.log('Units loaded:', unitsData.length);
      console.log('Warehouses loaded:', warehousesData.length);
      console.log('Products loaded:', productsData.length);
      
      setCategories(categoriesData);
      setUnits(unitsData);
      setWarehouses(warehousesData);
      setAllProducts(productsData);

      // If edit mode, load product data including specifications, conversions, and bom
      if (isEditMode && product) {
        setFormData({
          code: product.code || '',
          name: product.name || '',
          description: product.description || '',
          category_id: product.category_id,
          base_unit_id: product.base_unit_id,
          purchase_price: String(product.purchase_price || 0),
          sale_price: String(product.sale_price || 0),
          product_type: product.product_type || 'raw_material',
          is_active: product.is_active !== false,
          image_url: product.image_url || '',
        });
        
        // Load related data if exists
        if (product.specifications) setSpecifications(product.specifications);
        if (product.unit_conversions) setUnitConversions(product.unit_conversions);
        if (product.bom) setBom(product.bom);
      } else {
        // Set default unit if available
        if (unitsData.length > 0) {
          setFormData((prev) => ({ ...prev, base_unit_id: unitsData[0].id }));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.error('Lỗi', `Không thể tải dữ liệu. ${error.response?.status === 404 ? 'Endpoint không tồn tại.' : error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setFormData({ ...formData, image_url: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.error('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.code.trim()) {
      Alert.error('Lỗi', 'Vui lòng nhập mã sản phẩm');
      return;
    }
    if (!formData.name.trim()) {
      Alert.error('Lỗi', 'Vui lòng nhập tên sản phẩm');
      return;
    }
    if (!formData.category_id) {
      Alert.error('Lỗi', 'Vui lòng chọn danh mục');
      return;
    }
    if (!formData.base_unit_id) {
      Alert.error('Lỗi', 'Vui lòng chọn đơn vị tính');
      return;
    }

    setSaving(true);

    try {
      // Upload image if it's a local file
      let uploadedImageUrl = formData.image_url;
      if (formData.image_url && formData.image_url.startsWith('file://')) {
        setImageUploading(true);
        const timestamp = Date.now();
        const filename = `product_${formData.code}_${timestamp}.jpg`;
        
        const uploadResult = await uploadImage(
          formData.image_url,
          'images',
          'products',
          filename
        );

        if (uploadResult.success) {
          uploadedImageUrl = uploadResult.url;
          console.log('Image uploaded:', uploadedImageUrl);
        } else {
          console.error('Image upload failed:', uploadResult.error);
          Alert.warning('Cảnh báo', 'Không thể upload ảnh, sẽ lưu không có ảnh');
          uploadedImageUrl = '';
        }
        setImageUploading(false);
      }

      // Prepare data for API
      const dataToSend = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category_id: formData.category_id || null,
        base_unit_id: formData.base_unit_id,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        product_type: formData.product_type,
        is_active: formData.is_active,
        image_url: uploadedImageUrl || null,
      };

      if (isEditMode) {
        await api.put(`/api/products/${product.id}`, dataToSend);
        Alert.success(
          'Cập nhật thành công!', 
          `Sản phẩm "${formData.name}" đã được cập nhật`,
          () => navigation.goBack()
        );
      } else {
        await api.post('/api/products', dataToSend);
        Alert.success(
          'Thêm mới thành công!', 
          `Sản phẩm "${formData.name}" đã được thêm vào hệ thống`,
          () => navigation.goBack()
        );
      }
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.error(
        'Lỗi',
        error.response?.data?.message || 'Không thể lưu sản phẩm'
      );
    } finally {
      setSaving(false);
      setImageUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ảnh sản phẩm</Text>
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            {formData.image_url ? (
              <Image source={{ uri: formData.image_url }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={40} color="#ccc" />
                <Text style={styles.imagePlaceholderText}>Chọn ảnh</Text>
              </View>
            )}
            {imageUploading && (
              <View style={styles.imageOverlay}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.uploadingText}>Đang upload...</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          
          <Text style={styles.label}>
            Mã sản phẩm <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.code}
            onChangeText={(text) => setFormData({ ...formData, code: text })}
            placeholder="Ví dụ: SP001"
            editable={!isEditMode}
          />

          <Text style={styles.label}>
            Tên sản phẩm <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Nhập tên sản phẩm"
          />

          <Text style={styles.label}>Mô tả</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Mô tả sản phẩm"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Category & Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phân loại</Text>
          
          {/* Category Select */}
          <Text style={styles.label}>
            Danh mục <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity 
            style={styles.selectButton}
            onPress={() => setShowCategoryPicker(true)}
          >
            <View style={styles.selectContent}>
              <Ionicons name="pricetag-outline" size={20} color="#666" />
              <Text style={[styles.selectText, !formData.category_id && styles.selectPlaceholder]}>
                {formData.category_id 
                  ? categories.find(c => c.id === formData.category_id)?.name 
                  : '-- Chọn danh mục --'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>

          {/* Product Type Select */}
          <Text style={styles.label}>
            Loại sản phẩm <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity 
            style={styles.selectButton}
            onPress={() => setShowTypePicker(true)}
          >
            <View style={styles.selectContent}>
              <Ionicons name="cube-outline" size={20} color="#666" />
              <Text style={styles.selectText}>
                {productTypes.find(t => t.value === formData.product_type)?.label}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>

          {/* Unit Select */}
          <Text style={styles.label}>
            Đơn vị tính <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity 
            style={styles.selectButton}
            onPress={() => setShowUnitPicker(true)}
          >
            <View style={styles.selectContent}>
              <Ionicons name="resize-outline" size={20} color="#666" />
              <Text style={[styles.selectText, !formData.base_unit_id && styles.selectPlaceholder]}>
                {formData.base_unit_id 
                  ? units.find(u => u.id === formData.base_unit_id)?.name 
                  : '-- Chọn đơn vị --'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giá</Text>
          
          <Text style={styles.label}>Giá mua (VNĐ)</Text>
          <TextInput
            style={styles.input}
            value={formatPrice(formData.purchase_price)}
            onChangeText={(text) => {
              const parsed = parsePrice(text);
              setFormData({ ...formData, purchase_price: parsed });
            }}
            placeholder="0"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Giá bán (VNĐ)</Text>
          <TextInput
            style={styles.input}
            value={formatPrice(formData.sale_price)}
            onChangeText={(text) => {
              const parsed = parsePrice(text);
              setFormData({ ...formData, sale_price: parsed });
            }}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        {/* Status */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Đang sử dụng</Text>
            <Switch
              value={formData.is_active}
              onValueChange={(value) =>
                setFormData({ ...formData, is_active: value })
              }
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={formData.is_active ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Note for additional features */}
        {isEditMode && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              Để quản lý quy cách, đơn vị chuyển đổi và định mức vật tư, vui lòng vào
              chi tiết sản phẩm sau khi lưu.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSubmit}
          disabled={saving || imageUploading}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditMode ? 'Cập nhật' : 'Thêm mới'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn danh mục</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.modalItem,
                    formData.category_id === cat.id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, category_id: cat.id });
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.category_id === cat.id && styles.modalItemTextSelected
                  ]}>
                    {cat.name}
                  </Text>
                  {formData.category_id === cat.id && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Product Type Picker Modal */}
      <Modal
        visible={showTypePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn loại sản phẩm</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {productTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.modalItem,
                    formData.product_type === type.value && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, product_type: type.value });
                    setShowTypePicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.product_type === type.value && styles.modalItemTextSelected
                  ]}>
                    {type.label}
                  </Text>
                  {formData.product_type === type.value && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn đơn vị tính</Text>
              <TouchableOpacity onPress={() => setShowUnitPicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {units.map((unit) => (
                <TouchableOpacity
                  key={unit.id}
                  style={[
                    styles.modalItem,
                    formData.base_unit_id === unit.id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, base_unit_id: unit.id });
                    setShowUnitPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.base_unit_id === unit.id && styles.modalItemTextSelected
                  ]}>
                    {unit.name} {unit.code && `(${unit.code})`}
                  </Text>
                  {formData.base_unit_id === unit.id && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  required: {
    color: '#f44336',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  selectPlaceholder: {
    color: '#999',
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
    maxHeight: '70%',
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
  modalScroll: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemTextSelected: {
    fontWeight: '600',
    color: '#4CAF50',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  uploadingText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1976d2',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
