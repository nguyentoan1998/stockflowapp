import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';
// TODO: Implement ProductSpecifications, ProductUnitConversions, ProductBOM components
// import ProductSpecifications from '../../components/ProductSpecifications';
// import ProductUnitConversions from '../../components/ProductUnitConversions';
// import ProductBOM from '../../components/ProductBOM';

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { api } = useApi();
  
  const { productId } = route.params;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // info, specs, conversions, bom
  
  // Data for child components
  const [warehouses, setWarehouses] = useState([]);
  const [units, setUnits] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [unitConversions, setUnitConversions] = useState([]);
  const [bom, setBom] = useState([]);
  
  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useFocusEffect(
    useCallback(() => {
      fetchProduct();
      loadSupportData();
    }, [productId])
  );

  const loadSupportData = async () => {
    try {
      const [warehousesRes, unitsRes, productsRes] = await Promise.all([
        api.get('/api/warehouses'),
        api.get('/api/units'),
        api.get('/api/products'),
      ]);

      const warehousesData = Array.isArray(warehousesRes.data) ? warehousesRes.data : warehousesRes.data?.data || [];
      const unitsData = Array.isArray(unitsRes.data) ? unitsRes.data : unitsRes.data?.data || [];
      const productsData = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.data || [];

      setWarehouses(warehousesData);
      setUnits(unitsData);
      setAllProducts(productsData);
    } catch (error) {
      console.error('❌ Error loading support data:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/products/${productId}`);
      setProduct(response.data);
      
      // Load related data
      await loadRelatedData(productId);
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.error('Lỗi', 'Không thể tải thông tin sản phẩm', () => navigation.goBack());
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async (prodId) => {
    try {
      // Load specifications
      const specsRes = await api.get('/api/product_specifications', {
        params: {
          where: JSON.stringify({ product_id: prodId }),
        },
      });
      setSpecifications(Array.isArray(specsRes.data) ? specsRes.data : specsRes.data?.data || []);

      // Load unit conversions
      const convsRes = await api.get('/api/product_unit_conversions', {
        params: {
          where: JSON.stringify({ product_id: prodId }),
        },
      });
      setUnitConversions(Array.isArray(convsRes.data) ? convsRes.data : convsRes.data?.data || []);

      // Load BOM
      const bomRes = await api.get('/api/product_bom', {
        params: {
          where: JSON.stringify({ product_id: prodId }),
        },
      });
      setBom(Array.isArray(bomRes.data) ? bomRes.data : bomRes.data?.data || []);
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProduct();
    setRefreshing(false);
  };

  const handleEdit = () => {
    navigation.navigate('ProductForm', { mode: 'edit', product });
  };

  const handleDelete = () => {
    Alert.confirm(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa sản phẩm này?',
      async () => {
        try {
          await api.delete(`/api/products/${productId}`);
          Alert.success('Thành công', 'Đã xóa sản phẩm', () => navigation.goBack());
        } catch (error) {
          console.error('Error deleting product:', error);
          Alert.error('Lỗi', 'Không thể xóa sản phẩm');
        }
      },
      undefined,
      'Xóa',
      'Hủy'
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  const getProductTypeLabel = (type) => {
    const types = {
      raw_material: 'Nguyên vật liệu',
      semi_finished: 'Bán thành phẩm',
      finished_product: 'Thành phẩm',
      tool: 'Công cụ',
      asset: 'Tài sản',
      food: 'Thực phẩm',
      service: 'Dịch vụ',
    };
    return types[type] || type;
  };

  const handleUpdateSpecifications = async (updatedSpecs) => {
    try {
      const resultSpecs = [];
      const existingSpecIds = specifications.map(s => s.id).filter(id => id);
      const updatedSpecIds = [];

      // Update or create specifications
      for (const spec of updatedSpecs) {
        // Ensure all required fields are present and valid
        if (!spec.spec_name || !spec.spec_value) {
          continue;
        }

        const payload = {
          product_id: parseInt(productId),
          spec_name: String(spec.spec_name).trim(),
          spec_value: String(spec.spec_value).trim(),
          price: parseFloat(spec.price) || 0,
          time: parseFloat(spec.time) || 0,
          isfinal: Boolean(spec.isfinal),
          ware_id: spec.ware_id ? parseInt(spec.ware_id) : null,
        };

        if (spec.id) {
          // Update existing spec
          try {
            const response = await api.put(`/api/product_specifications/${spec.id}`, payload);
            resultSpecs.push(response.data);
            updatedSpecIds.push(spec.id);
          } catch (updateError) {
            // If update fails, try to keep the old one
            resultSpecs.push(spec);
            updatedSpecIds.push(spec.id);
          }
        } else {
          // Create new spec
          const response = await api.post('/api/product_specifications', payload);
          resultSpecs.push(response.data);
        }
      }

      // Delete specs that are no longer in the list (only if not referenced)
      for (const oldSpec of specifications) {
        if (oldSpec.id && !updatedSpecIds.includes(oldSpec.id)) {
          try {
            await api.delete(`/api/product_specifications/${oldSpec.id}`);
          } catch (deleteError) {
            // Keep the spec if it's being used
            resultSpecs.push(oldSpec);
          }
        }
      }

      setSpecifications(resultSpecs);
      Alert.success('Thành công', 'Đã cập nhật quy cách sản phẩm');
    } catch (error) {
      console.error('Error updating specifications:', error);
      Alert.error('Lỗi', `Không thể cập nhật quy cách: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleUpdateUnitConversions = async (updatedConvs) => {
    try {
      // Delete old conversions
      for (const conv of unitConversions) {
        await api.delete(`/api/product_unit_conversions/${conv.id}`);
      }

      // Create new conversions
      const createdConvs = [];
      for (const conv of updatedConvs) {
        const response = await api.post('/api/product_unit_conversions', {
          product_id: productId,
          from_unit_id: conv.from_unit_id,
          to_unit_id: conv.to_unit_id,
          conversion_factor: parseFloat(conv.conversion_factor),
        });
        createdConvs.push(response.data);
      }

      setUnitConversions(createdConvs);
      Alert.success('Thành công', 'Đã cập nhật đơn vị chuyển đổi');
    } catch (error) {
      console.error('Error updating unit conversions:', error);
      Alert.error('Lỗi', 'Không thể cập nhật đơn vị chuyển đổi');
    }
  };

  const handleUpdateBOM = async (updatedBom) => {
    try {
      // Delete old BOM items
      for (const item of bom) {
        await api.delete(`/api/product_bom/${item.id}`);
      }

      // Create new BOM items
      const createdBom = [];
      for (const item of updatedBom) {
        const response = await api.post('/api/product_bom', {
          product_id: productId,
          material_id: item.material_id,
          quantity: parseFloat(item.quantity),
          unit_id: item.unit_id,
        });
        createdBom.push(response.data);
      }

      setBom(createdBom);
      Alert.success('Thành công', 'Đã cập nhật định mức nguyên liệu');
    } catch (error) {
      console.error('Error updating BOM:', error);
      Alert.error('Lỗi', 'Không thể cập nhật định mức');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return renderInfoTab();
      case 'specs':
        return (
          <View style={styles.tabContentContainer}>
            <Text style={styles.comingSoonText}>Tính năng đang phát triển...</Text>
            {/* TODO: Implement ProductSpecifications component */}
          </View>
        );
      case 'conversions':
        return (
          <View style={styles.tabContentContainer}>
            <Text style={styles.comingSoonText}>Tính năng đang phát triển...</Text>
            {/* TODO: Implement ProductUnitConversions component */}
          </View>
        );
      case 'bom':
        return (
          <View style={styles.tabContentContainer}>
            <Text style={styles.comingSoonText}>Tính năng đang phát triển...</Text>
            {/* TODO: Implement ProductBOM component */}
          </View>
        );
      default:
        return null;
    }
  };

  const renderInfoTab = () => (
    <View style={styles.infoContainer}>
      {/* Image */}
      <View style={styles.imageSection}>
        <Image
          source={{ uri: product?.image_url || 'https://via.placeholder.com/300' }}
          style={styles.productImage}
        />
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mã sản phẩm:</Text>
          <Text style={styles.infoValue}>{product?.code}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tên sản phẩm:</Text>
          <Text style={styles.infoValue}>{product?.name}</Text>
        </View>

        {product?.description && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mô tả:</Text>
            <Text style={styles.infoValue}>{product.description}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Loại sản phẩm:</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {getProductTypeLabel(product?.product_type)}
            </Text>
          </View>
        </View>

        {product?.product_category && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Danh mục:</Text>
            <Text style={styles.infoValue}>{product.product_category.name}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Trạng thái:</Text>
          <View
            style={[
              styles.statusBadge,
              product?.is_active ? styles.statusActive : styles.statusInactive,
            ]}
          >
            <Text style={styles.statusText}>
              {product?.is_active ? 'Đang dùng' : 'Ngưng dùng'}
            </Text>
          </View>
        </View>
      </View>

      {/* Pricing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Giá</Text>
        
        <View style={styles.priceRow}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Giá mua</Text>
            <Text style={styles.priceValue}>
              {formatPrice(product?.purchase_price)}
            </Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Giá bán</Text>
            <Text style={styles.priceValue}>
              {formatPrice(product?.sale_price)}
            </Text>
          </View>
        </View>
      </View>

      {/* Timestamps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin khác</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày tạo:</Text>
          <Text style={styles.infoValue}>
            {product?.created_at
              ? new Date(product.created_at).toLocaleDateString('vi-VN')
              : 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cập nhật lần cuối:</Text>
          <Text style={styles.infoValue}>
            {product?.updated_at
              ? new Date(product.updated_at).toLocaleDateString('vi-VN')
              : 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>{product.name}</Text>
            <Text style={styles.headerSubtitle}>{product.code}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.tabActive]}
          onPress={() => setActiveTab('info')}
        >
          <Ionicons
            name="information-circle"
            size={20}
            color={activeTab === 'info' ? '#007AFF' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'info' && styles.tabTextActive,
            ]}
          >
            Thông tin
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'specs' && styles.tabActive]}
          onPress={() => setActiveTab('specs')}
        >
          <Ionicons
            name="list"
            size={20}
            color={activeTab === 'specs' ? '#007AFF' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'specs' && styles.tabTextActive,
            ]}
          >
            Quy cách
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'conversions' && styles.tabActive]}
          onPress={() => setActiveTab('conversions')}
        >
          <Ionicons
            name="swap-horizontal"
            size={20}
            color={activeTab === 'conversions' ? '#007AFF' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'conversions' && styles.tabTextActive,
            ]}
          >
            Đơn vị
          </Text>
        </TouchableOpacity>

        {/* Only show BOM tab for semi-finished and finished products */}
        {(product?.product_type === 'semi_finished' || product?.product_type === 'finished_product') && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bom' && styles.tabActive]}
            onPress={() => setActiveTab('bom')}
          >
            <Ionicons
              name="construct"
              size={20}
              color={activeTab === 'bom' ? '#007AFF' : '#666'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'bom' && styles.tabTextActive,
              ]}
            >
              Định mức
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>
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
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    paddingTop: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    marginLeft: 15,
    flex: 1,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e3f2fd',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  infoContainer: {
    padding: 15,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  productImage: {
    width: 300,
    height: 300,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    flex: 2,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#c8e6c9',
  },
  statusInactive: {
    backgroundColor: '#ffcdd2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceBox: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  tabContentContainer: {
    flex: 1,
    padding: 15,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});
