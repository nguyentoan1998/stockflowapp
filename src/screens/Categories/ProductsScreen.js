import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Chip from '../../components/ui/Chip';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '../../theme';

export default function ProductsScreen() {
  const navigation = useNavigation();
  const { api } = useApi();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'code', 'price_asc', 'price_desc'

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/products');

      // Handle different response formats
      let productsData = [];
      if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (response.data?.products && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      }

      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      console.error('Error details:', error.response?.data);
      Alert.error('Lỗi', `Không thể tải danh sách sản phẩm: ${error.response?.status || error.message}`);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/product_category');

      // Handle different response formats
      let categoriesData = [];
      if (Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
      }

      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
      fetchCategories();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  // Filter and sort products
  useEffect(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category_id === selectedCategory
      );
    }

    // Sort products
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'vi');
        case 'code':
          return a.code.localeCompare(b.code);
        case 'price_asc':
          return (a.sale_price || 0) - (b.sale_price || 0);
        case 'price_desc':
          return (b.sale_price || 0) - (a.sale_price || 0);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products, sortBy]);

  const handleAddProduct = () => {

    console.log('Navigation state:', navigation.getState());
    try {
      navigation.navigate('ProductForm', { mode: 'add' });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.error('Lỗi', 'Không thể mở form thêm sản phẩm. Vui lòng restart app.');
    }
  };

  const handleEditProduct = (product) => {

    try {
      navigation.navigate('ProductForm', { mode: 'edit', product });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.error('Lỗi', 'Không thể mở form sửa sản phẩm. Vui lòng restart app.');
    }
  };

  const handleViewProduct = (product) => {

    try {
      navigation.navigate('ProductDetail', { productId: product.id });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.error('Lỗi', 'Không thể xem chi tiết sản phẩm. Vui lòng restart app.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    Alert.confirm(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa sản phẩm này?',
      async () => {
        try {
          await api.delete(`/api/products/${productId}`);
          fetchProducts();
          Alert.success('Thành công', 'Đã xóa sản phẩm');
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

  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : 'Không có';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  const getProductTypeLabel = (type) => {
    const types = {
      raw_material: 'Nguyên liệu',
      semi_finished: 'Bán thành phẩm',
      finished: 'Thành phẩm',
      tool: 'Công cụ',
      other: 'Khác',
    };
    return types[type] || type;
  };

  const renderProductItem = ({ item, index }) => {
    return (
      <View>
        <TouchableOpacity
          onPress={() => handleViewProduct(item)}
          activeOpacity={0.95}
        >
          <Card style={styles.productCard}>
            <View style={styles.productHeader}>
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: item.image_url || 'https://via.placeholder.com/80' }}
                  style={styles.productImage}
                />
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: item.is_active ? '#4CAF50' : '#F44336' }
                ]}>
                  <Ionicons 
                    name={item.is_active ? 'checkmark' : 'close'} 
                    size={12} 
                    color="#fff" 
                  />
                </View>
              </View>
              <View style={styles.productInfo}>
                <View style={styles.productTopRow}>
                  <Text style={styles.productCode}>#{item.code}</Text>
                  <Badge variant="primary" size="small">
                    {getProductTypeLabel(item.product_type)}
                  </Badge>
                </View>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.category_id && (
                  <View style={styles.categoryBadge}>
                    <Ionicons name="pricetag" size={12} color={Colors.textSecondary} />
                    <Text style={styles.categoryText}>
                      {getCategoryName(item.category_id)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.productDetails}>
              <LinearGradient
                colors={['#FFF3E0', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.priceContainer}
              >
                <View style={styles.priceItem}>
                  <View style={[styles.priceIconBg, { backgroundColor: '#FFE0B2' }]}>
                    <Ionicons name="download-outline" size={14} color="#F57C00" />
                  </View>
                  <View style={styles.priceContent}>
                    <Text style={styles.priceLabel}>Giá mua</Text>
                    <Text style={[styles.priceValue, { color: '#F57C00' }]}>
                      {formatPrice(item.purchase_price)}
                    </Text>
                  </View>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceItem}>
                  <View style={[styles.priceIconBg, { backgroundColor: '#C8E6C9' }]}>
                    <Ionicons name="trending-up-outline" size={14} color="#388E3C" />
                  </View>
                  <View style={styles.priceContent}>
                    <Text style={styles.priceLabel}>Giá bán</Text>
                    <Text style={[styles.priceValue, { color: '#388E3C' }]}>
                      {formatPrice(item.sale_price)}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleViewProduct(item);
                }}
              >
                <Ionicons name="eye-outline" size={16} color="#2196F3" />
                <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>Xem</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleEditProduct(item);
                }}
              >
                <Ionicons name="create-outline" size={16} color="#FF9800" />
                <Text style={[styles.actionButtonText, { color: '#FF9800' }]}>Sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteProduct(item.id);
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#F44336" />
                <Text style={[styles.actionButtonText, { color: '#F44336' }]}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </TouchableOpacity>
      </View>
    );
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
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo mã hoặc tên sản phẩm..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter & Sort */}
      <View style={styles.filterContainer}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterLabel}>Danh mục:</Text>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => {
              const sortOptions = ['name', 'code', 'price_asc', 'price_desc'];
              const currentIndex = sortOptions.indexOf(sortBy);
              const nextIndex = (currentIndex + 1) % sortOptions.length;
              setSortBy(sortOptions[nextIndex]);
            }}
          >
            <Ionicons name="swap-vertical" size={18} color={Colors.primary} />
            <Text style={styles.sortText}>
              {sortBy === 'name' && 'A-Z'}
              {sortBy === 'code' && 'Mã'}
              {sortBy === 'price_asc' && 'Giá ↑'}
              {sortBy === 'price_desc' && 'Giá ↓'}
            </Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: 'Tất cả' }, ...categories]}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCategory === item.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === item.id && styles.filterChipTextActive,
                ]}
              >
                {item.name}
              </Text>
              {selectedCategory === item.id && categories.length > 0 && (
                <Text style={styles.filterCount}>
                  {products.filter(p => item.id ? p.category_id === item.id : true).length}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có sản phẩm nào</Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  filterContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingLeft: Spacing.md,
    marginBottom: Spacing.xs,
    ...Shadows.sm,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingRight: Spacing.md,
  },
  filterLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: Spacing.xs,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    gap: 4,
  },
  sortText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.primary,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.surface,
    fontWeight: '600',
  },
  filterCount: {
    ...Typography.caption,
    color: Colors.surface,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 10,
  },
  listContainer: {
    padding: Spacing.md,
  },
  productCard: {
    marginBottom: Spacing.md,
    padding: 0,
    overflow: 'hidden',
    borderRadius: 16,
    elevation: 4,
  },
  productHeader: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: '#FAFAFA',
  },
  imageWrapper: {
    position: 'relative',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.surfaceVariant,
  },
  statusBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  productInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  productTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  productCode: {
    ...Typography.caption,
    color: '#6200EE',
    fontWeight: '700',
    letterSpacing: 0.5,
    fontSize: 13,
  },
  productName: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    fontSize: 16,
    lineHeight: 22,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 4,
    fontSize: 11,
  },
  productDetails: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  priceContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 12,
    ...Shadows.sm,
  },
  priceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceContent: {
    flex: 1,
  },
  priceDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  priceLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
    fontSize: 11,
  },
  priceValue: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: '#E3F2FD',
  },
  editButton: {
    backgroundColor: '#FFF3E0',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.colored('#4CAF50'),
  },
});
