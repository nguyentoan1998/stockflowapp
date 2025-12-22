import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Card,
  Text,
  TextInput,
  Button,
  IconButton,
  Chip,
  SegmentedButtons,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import { AnimatedLoadingSpinner } from '../LoadingSpinner';

const { width, height } = Dimensions.get('window');

const ProductCRUDModal = ({
  visible,
  onDismiss,
  mode = 'create', // create, edit, view
  product = null,
  onSuccess,
}) => {
  const { api } = useApi();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    sale_price: '',
    cost_price: '',
    stock: '',
    unit: '',
    product_category_id: '',
  });
  const [errors, setErrors] = useState({});

  // Animation refs
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      loadCategories();
      if (product && mode !== 'create') {
        setFormData({
          name: product.name || '',
          code: product.code || '',
          description: product.description || '',
          sale_price: product.sale_price?.toString() || '',
          cost_price: product.cost_price?.toString() || '',
          stock: product.stock?.toString() || '',
          unit: product.unit || '',
          product_category_id: product.product_category_id?.toString() || '',
        });
      }
      startOpenAnimation();
    } else {
      startCloseAnimation();
    }
  }, [visible, product]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/api/product_categories');
      setCategories(response.data.data || []);
    } catch (error) {

    }
  };

  const startOpenAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startCloseAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      resetForm();
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      sale_price: '',
      cost_price: '',
      stock: '',
      unit: '',
      product_category_id: '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên sản phẩm là bắt buộc';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Mã sản phẩm là bắt buộc';
    }

    if (!formData.sale_price || isNaN(parseFloat(formData.sale_price))) {
      newErrors.sale_price = 'Giá bán phải là số hợp lệ';
    }

    if (!formData.cost_price || isNaN(parseFloat(formData.cost_price))) {
      newErrors.cost_price = 'Giá vốn phải là số hợp lệ';
    }

    if (formData.stock && isNaN(parseInt(formData.stock))) {
      newErrors.stock = 'Số lượng tồn phải là số hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        sale_price: parseFloat(formData.sale_price),
        cost_price: parseFloat(formData.cost_price),
        stock: parseInt(formData.stock) || 0,
        product_category_id: formData.product_category_id 
          ? parseInt(formData.product_category_id) 
          : null,
      };

      let response;
      if (mode === 'create') {
        response = await api.post('/api/products', submitData);
        Alert.alert('Thành công', 'Đã tạo sản phẩm mới');
      } else if (mode === 'edit') {
        response = await api.put(`/api/products/${product.id}`, submitData);
        Alert.alert('Thành công', 'Đã cập nhật sản phẩm');
      }

      onSuccess && onSuccess(response.data);
      onDismiss();
    } catch (error) {

      Alert.alert('Lỗi', error.response?.data?.error || 'Không thể lưu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa sản phẩm này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.delete(`/api/products/${product.id}`);
              Alert.alert('Thành công', 'Đã xóa sản phẩm');
              onSuccess && onSuccess();
              onDismiss();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa sản phẩm');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Thêm sản phẩm mới';
      case 'edit': return 'Sửa sản phẩm';
      case 'view': return 'Chi tiết sản phẩm';
      default: return 'Sản phẩm';
    }
  };

  const getModalIcon = () => {
    switch (mode) {
      case 'create': return 'plus-circle';
      case 'edit': return 'pencil-circle';
      case 'view': return 'eye-circle';
      default: return 'package-variant';
    }
  };

  const getHeaderColor = () => {
    switch (mode) {
      case 'create': return ['#4CAF50', '#66BB6A'];
      case 'edit': return ['#2196F3', '#42A5F5'];
      case 'view': return ['#9C27B0', '#BA68C8'];
      default: return ['#1976D2', '#42A5F5'];
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onDismiss}
    >
      <Animated.View
        style={[
          styles.modalOverlay,
          { opacity: fadeAnim }
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            {/* Header */}
            <LinearGradient
              colors={getHeaderColor()}
              style={styles.modalHeader}
            >
              <View style={styles.headerContent}>
                <MaterialCommunityIcons 
                  name={getModalIcon()} 
                  size={32} 
                  color="#FFFFFF" 
                />
                <Text style={styles.modalTitle}>{getModalTitle()}</Text>
              </View>
              <IconButton
                icon="close"
                iconColor="#FFFFFF"
                size={24}
                onPress={onDismiss}
              />
            </LinearGradient>

            {/* Form Content */}
            <ScrollView 
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Basic Information */}
              <Card style={styles.sectionCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Thông tin cơ bản
                  </Text>

                  <TextInput
                    label="Tên sản phẩm *"
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    style={styles.input}
                    mode="outlined"
                    disabled={isReadOnly}
                    error={!!errors.name}
                    left={<TextInput.Icon icon="tag" />}
                  />
                  {errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}

                  <TextInput
                    label="Mã sản phẩm *"
                    value={formData.code}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, code: text }))}
                    style={styles.input}
                    mode="outlined"
                    disabled={isReadOnly}
                    error={!!errors.code}
                    left={<TextInput.Icon icon="barcode" />}
                  />
                  {errors.code && (
                    <Text style={styles.errorText}>{errors.code}</Text>
                  )}

                  <TextInput
                    label="Mô tả"
                    value={formData.description}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                    style={styles.input}
                    mode="outlined"
                    disabled={isReadOnly}
                    multiline
                    numberOfLines={3}
                    left={<TextInput.Icon icon="text" />}
                  />
                </Card.Content>
              </Card>

              {/* Category & Unit */}
              <Card style={styles.sectionCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Phân loại
                  </Text>

                  <View style={styles.categoryContainer}>
                    <Text variant="bodyMedium" style={styles.categoryLabel}>
                      Danh mục sản phẩm:
                    </Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.categoryScroll}
                    >
                      <Chip
                        mode={formData.product_category_id === '' ? 'flat' : 'outlined'}
                        selected={formData.product_category_id === ''}
                        onPress={() => !isReadOnly && setFormData(prev => ({ 
                          ...prev, 
                          product_category_id: '' 
                        }))}
                        style={styles.categoryChip}
                        disabled={isReadOnly}
                      >
                        Chưa phân loại
                      </Chip>
                      {categories.map(category => (
                        <Chip
                          key={category.id}
                          mode={formData.product_category_id === category.id.toString() ? 'flat' : 'outlined'}
                          selected={formData.product_category_id === category.id.toString()}
                          onPress={() => !isReadOnly && setFormData(prev => ({ 
                            ...prev, 
                            product_category_id: category.id.toString() 
                          }))}
                          style={styles.categoryChip}
                          disabled={isReadOnly}
                        >
                          {category.name}
                        </Chip>
                      ))}
                    </ScrollView>
                  </View>

                  <TextInput
                    label="Đơn vị tính"
                    value={formData.unit}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, unit: text }))}
                    style={styles.input}
                    mode="outlined"
                    disabled={isReadOnly}
                    left={<TextInput.Icon icon="scale" />}
                  />
                </Card.Content>
              </Card>

              {/* Pricing & Stock */}
              <Card style={styles.sectionCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Giá & Tồn kho
                  </Text>

                  <View style={styles.priceRow}>
                    <TextInput
                      label="Giá bán *"
                      value={formData.sale_price}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, sale_price: text }))}
                      style={[styles.input, styles.halfWidth]}
                      mode="outlined"
                      disabled={isReadOnly}
                      keyboardType="numeric"
                      error={!!errors.sale_price}
                      left={<TextInput.Icon icon="cash" />}
                      right={<TextInput.Affix text="₫" />}
                    />
                    
                    <TextInput
                      label="Giá vốn *"
                      value={formData.cost_price}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, cost_price: text }))}
                      style={[styles.input, styles.halfWidth]}
                      mode="outlined"
                      disabled={isReadOnly}
                      keyboardType="numeric"
                      error={!!errors.cost_price}
                      left={<TextInput.Icon icon="calculator" />}
                      right={<TextInput.Affix text="₫" />}
                    />
                  </View>

                  {errors.sale_price && (
                    <Text style={styles.errorText}>{errors.sale_price}</Text>
                  )}
                  {errors.cost_price && (
                    <Text style={styles.errorText}>{errors.cost_price}</Text>
                  )}

                  <TextInput
                    label="Số lượng tồn kho"
                    value={formData.stock}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, stock: text }))}
                    style={styles.input}
                    mode="outlined"
                    disabled={isReadOnly}
                    keyboardType="numeric"
                    error={!!errors.stock}
                    left={<TextInput.Icon icon="cube" />}
                  />
                  {errors.stock && (
                    <Text style={styles.errorText}>{errors.stock}</Text>
                  )}
                </Card.Content>
              </Card>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              {mode === 'view' ? (
                <View style={styles.viewActions}>
                  <Button
                    mode="contained"
                    onPress={onDismiss}
                    style={styles.actionButton}
                    buttonColor="#9C27B0"
                  >
                    Đóng
                  </Button>
                </View>
              ) : (
                <View style={styles.editActions}>
                  <Button
                    mode="outlined"
                    onPress={onDismiss}
                    style={styles.cancelButton}
                    disabled={loading}
                  >
                    Hủy
                  </Button>
                  
                  {mode === 'edit' && (
                    <Button
                      mode="contained"
                      onPress={handleDelete}
                      style={styles.deleteButton}
                      buttonColor="#f44336"
                      disabled={loading}
                    >
                      Xóa
                    </Button>
                  )}
                  
                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    style={styles.submitButton}
                    buttonColor={mode === 'create' ? '#4CAF50' : '#2196F3'}
                    loading={loading}
                    disabled={loading}
                  >
                    {mode === 'create' ? 'Tạo' : 'Lưu'}
                  </Button>
                </View>
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>

        {loading && (
          <AnimatedLoadingSpinner
            visible={loading}
            message={mode === 'create' ? 'Đang tạo sản phẩm...' : 'Đang lưu thay đổi...'}
            type="pulse"
          />
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    color: '#666',
    marginBottom: 8,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 8,
  },
  actionContainer: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#F8F9FA',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  viewActions: {
    alignItems: 'center',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    minWidth: 120,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    marginHorizontal: 8,
    minWidth: 80,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default ProductCRUDModal;