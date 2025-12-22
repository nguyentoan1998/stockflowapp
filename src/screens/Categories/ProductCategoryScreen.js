import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Portal,
  Modal,
  Chip,
  Searchbar,
  Menu,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon, Ionicons } from '@expo/vector-icons';
import { useApi } from '../../contexts/ApiContext';
import CustomDialog from '../../components/CustomDialog';

const ProductCategoryScreen = () => {
  const { api } = useApi();
  
  // State management
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState({});

  // Filter states
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    is_active: true,
  });

  // Custom Dialog states
  const [successDialog, setSuccessDialog] = useState({ visible: false, title: '', message: '' });
  const [errorDialog, setErrorDialog] = useState({ visible: false, title: '', message: '' });
  const [confirmDialog, setConfirmDialog] = useState({ 
    visible: false, 
    title: '', 
    message: '', 
    onConfirm: null 
  });
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Load categories
  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/product_category');
      
      if (response && response.data) {
        const categoriesData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.data && Array.isArray(response.data.data) ? response.data.data : []);
        
        console.log('Raw categories data:', categoriesData); // Debug log
        const validatedCategories = categoriesData.map((category, index) => {
          const categoryId = category.id || category._id || `category_${index}`;
          console.log('Category status data:', { // Debug log
            id: categoryId,
            name: category.name,
            is_active: category.is_active,
            status: category.status,
            statuss: category.statuss
          });
          return {
            id: categoryId,
            name: category.name || category.category_name || 'Unknown',
            description: category.description || '',
            code: category.code || categoryId,
            is_active: category.is_active !== undefined ? category.is_active : true,
            created_at: category.created_at || category.createdAt || new Date().toISOString(),
            updated_at: category.updated_at || category.updatedAt || new Date().toISOString(),
          };
        });
        setCategories(validatedCategories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Load categories error:', error);
      setCategories([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCategories();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handlers
  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      code: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      code: category.code || '',
      is_active: category.is_active !== undefined ? category.is_active : true,
    });
    setShowModal(true);
    setMenuVisible({});
  };

  const handleDelete = (category) => {
    setConfirmDialog({
      visible: true,
      title: '🗑️ Xác nhận xóa danh mục',
      message: `Bạn có chắc chắn muốn xóa danh mục "${category.name}"?\n\nHành động này không thể hoàn tác!`,
      onConfirm: () => performDelete(category)
    });
    setMenuVisible({});
  };

  const performDelete = async (category) => {
    // Optimistic delete
    const categoryToDelete = categories.find(c => c.id === category.id);
    setCategories(categories.filter(c => c.id !== category.id));
    
    try {
      const response = await api.delete(`/api/product_category/${category.id}`);
      if (response && (response.data.success || response.status === 200)) {
        setSuccessDialog({
          visible: true,
          title: '🎉 Xóa thành công!',
          message: 'Danh mục đã được xóa khỏi hệ thống.'
        });
      }
    } catch (error) {
      // Rollback on error
      if (categoryToDelete) {
        setCategories(prevCategories => [...prevCategories, categoryToDelete]);
        setErrorDialog({
          visible: true,
          title: '❌ Lỗi xóa danh mục',
          message: 'Không thể xóa danh mục. Vui lòng kiểm tra kết nối và thử lại.'
        });
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setErrorDialog({
        visible: true,
        title: '⚠️ Thiếu thông tin',
        message: 'Vui lòng nhập tên danh mục để tiếp tục.'
      });
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        code: formData.code.trim() || `CAT${Date.now()}`,
        is_active: formData.is_active,
      };

      if (editingCategory) {
        // Optimistic update
        const optimisticCategory = { ...editingCategory, ...payload };
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id ? optimisticCategory : cat
        ));
        setShowModal(false);
        setEditingCategory(null);
        
        const response = await api.put(`/api/product_category/${editingCategory.id}`, payload);
        if (response && (response.data.success || response.status === 200)) {
          setSuccessDialog({
            visible: true,
            title: '✅ Cập nhật thành công!',
            message: 'Thông tin danh mục đã được cập nhật.'
          });
        }
      } else {
        // Optimistic create
        const tempId = `temp_${Date.now()}`;
        const optimisticCategory = {
          id: tempId,
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setCategories([...categories, optimisticCategory]);
        setShowModal(false);
        
        const response = await api.post('/api/product_category', payload);
        
        let newCategoryData = null;
        if (response.data?.success && response.data?.data) {
          newCategoryData = response.data.data;
        } else if (response.data?.id) {
          newCategoryData = response.data;
        } else if (response.status === 201 || response.status === 200) {
          newCategoryData = response.data;
        }
        
        if (newCategoryData) {
          setCategories(prevCategories => prevCategories.map(cat => 
            cat.id === tempId ? newCategoryData : cat
          ));
        }
        
        setSuccessDialog({
          visible: true,
          title: '🎉 Tạo danh mục thành công!',
          message: 'Danh mục mới đã được thêm vào hệ thống.'
        });
      }
    } catch (error) {
      console.error('Save category error:', error);
      setErrorDialog({
        visible: true,
        title: '❌ Lỗi lưu danh mục',
        message: 'Có lỗi xảy ra khi lưu danh mục. Vui lòng kiểm tra thông tin và thử lại.'
      });
      loadCategories();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  // Filter and sort categories
  const getFilteredCategories = () => {
    let filtered = categories.filter(category => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (
        category.name.toLowerCase().includes(searchLower) ||
        category.code.toLowerCase().includes(searchLower) ||
        category.description.toLowerCase().includes(searchLower)
      );
      
      // Status filter
      let matchesStatus = true;
      if (filterStatus === 'active') {
        matchesStatus = category.is_active === true;
      } else if (filterStatus === 'inactive') {
        matchesStatus = category.is_active === false;
      }
      
      return matchesSearch && matchesStatus;
    });
    
    // Sort by name
    filtered.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB, 'vi');
      } else {
        return nameB.localeCompare(nameA, 'vi');
      }
    });
    
    return filtered;
  };

  const filteredCategories = getFilteredCategories();

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Đang tải danh mục sản phẩm...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header với Search */}
      <View style={styles.header}>
        <Searchbar
          placeholder="Tìm kiếm danh mục..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#6200EE"
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Chip
            selected={filterStatus === 'all'}
            onPress={() => setFilterStatus('all')}
            style={[styles.filterChip, filterStatus === 'all' && styles.filterChipSelected]}
            textStyle={filterStatus === 'all' && styles.filterChipTextSelected}
          >
            Tất cả ({categories.length})
          </Chip>
          <Chip
            selected={filterStatus === 'active'}
            onPress={() => setFilterStatus('active')}
            style={[styles.filterChip, filterStatus === 'active' && styles.filterChipSelected]}
            textStyle={filterStatus === 'active' && styles.filterChipTextSelected}
            icon="check-circle"
          >
            Hoạt động ({categories.filter(c => c.is_active === true).length})
          </Chip>
          <Chip
            selected={filterStatus === 'inactive'}
            onPress={() => setFilterStatus('inactive')}
            style={[styles.filterChip, filterStatus === 'inactive' && styles.filterChipSelected]}
            textStyle={filterStatus === 'inactive' && styles.filterChipTextSelected}
            icon="pause-circle"
          >
            Tạm dừng ({categories.filter(c => c.is_active === false).length})
          </Chip>
        </ScrollView>
        
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          <Icon 
            name={sortOrder === 'asc' ? 'sort-alphabetical-ascending' : 'sort-alphabetical-descending'} 
            size={24} 
            color="#6200EE" 
          />
        </TouchableOpacity>
      </View>

      {/* Categories List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Icon name="shape-outline" size={80} color="#6200EE" />
            </View>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              {searchQuery ? 'Không tìm thấy danh mục' : 'Chưa có danh mục nào'}
            </Text>
            <Text variant="bodyLarge" style={styles.emptySubtitle}>
              {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Nhấn nút + để thêm danh mục mới'}
            </Text>
          </View>
        ) : (
          filteredCategories.map((category, index) => {
            const cardAnim = new Animated.Value(0);
            
            // Stagger animation for each card
            Animated.timing(cardAnim, {
              toValue: 1,
              duration: 600,
              delay: index * 100,
              easing: Easing.out(Easing.back(1.1)),
              useNativeDriver: true,
            }).start();

            return (
              <Animated.View
                key={category.id}
                style={{
                  opacity: cardAnim,
                  transform: [{
                    translateY: cardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  }, {
                    scale: cardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  }]
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.95}
                  onPressIn={() => {
                    Animated.spring(cardAnim, {
                      toValue: 0.95,
                      useNativeDriver: true,
                    }).start();
                  }}
                  onPressOut={() => {
                    Animated.spring(cardAnim, {
                      toValue: 1,
                      useNativeDriver: true,
                    }).start();
                  }}
                >
                  <Card style={styles.categoryCard}>
                    <Card.Content style={styles.categoryCardContent}>
                      <View style={styles.categoryCardHeader}>
                        <View style={styles.categoryIcon}>
                          <Icon name="shape" size={24} color="#6200EE" />
                        </View>
                        <View style={styles.categoryInfo}>
                          <Text variant="titleMedium" style={styles.categoryName}>
                            {category.name}
                          </Text>
                          <Text variant="bodyMedium" style={styles.categoryCode}>
                            #{category.code}
                          </Text>
                          <Text variant="bodyMedium" style={styles.categoryDescription}>
                            {category.description || 'Chưa có mô tả'}
                          </Text>
                        </View>
                        <View style={styles.categoryActions}>
                          <Chip
                            mode="flat"
                            textStyle={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}
                            style={{ 
                              backgroundColor: category.is_active ? '#4CAF50' : '#FF5722',
                              elevation: 2,
                            }}
                            icon={category.is_active ? 'check-circle' : 'pause-circle'}
                          >
                            {category.is_active ? 'Hoạt động' : 'Tạm dừng'}
                          </Chip>
                          <Menu
                            visible={menuVisible[category.id]}
                            onDismiss={() => setMenuVisible({...menuVisible, [category.id]: false})}
                            anchor={
                              <IconButton
                                icon="dots-vertical"
                                onPress={() => setMenuVisible({...menuVisible, [category.id]: true})}
                                style={styles.menuButton}
                              />
                            }
                          >
                            <Menu.Item
                              onPress={() => handleEdit(category)}
                              title="Sửa"
                              leadingIcon="pencil"
                            />
                            <Menu.Item
                              onPress={() => handleDelete(category)}
                              title="Xóa"
                              leadingIcon="delete"
                            />
                          </Menu>
                        </View>
                      </View>
                      
                      <View style={styles.categoryStats}>
                        <View style={styles.statChip}>
                          <Icon name="calendar-plus" size={16} color="#FF9800" />
                          <Text variant="bodySmall" style={styles.statText}>
                            {new Date(category.created_at).toLocaleDateString('vi-VN')}
                          </Text>
                        </View>
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Card>
            <Card.Content>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
              </Text>

              <TextInput
                label="Tên danh mục *"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="shape" />}
                placeholder="VD: Điện tử, Thực phẩm"
              />

              <TextInput
                label="Mã danh mục"
                value={formData.code}
                onChangeText={(text) => setFormData({...formData, code: text.toUpperCase()})}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="tag" />}
                placeholder="VD: ELEC, FOOD"
                autoCapitalize="characters"
              />

              <TextInput
                label="Mô tả"
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
                left={<TextInput.Icon icon="text" />}
              />
            </Card.Content>
            
            <Card.Actions>
              <Button onPress={() => setShowModal(false)}>Hủy</Button>
              <Button mode="contained" onPress={handleSave} loading={loading}>
                {editingCategory ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>

      {/* Custom Dialogs */}
      <CustomDialog
        visible={successDialog.visible}
        type="success"
        title={successDialog.title}
        message={successDialog.message}
        onClose={() => setSuccessDialog({ visible: false, title: '', message: '' })}
        confirmText="Tuyệt vời!"
      />

      <CustomDialog
        visible={errorDialog.visible}
        type="error"
        title={errorDialog.title}
        message={errorDialog.message}
        onClose={() => setErrorDialog({ visible: false, title: '', message: '' })}
        confirmText="Đã hiểu"
      />

      <CustomDialog
        visible={confirmDialog.visible}
        type="confirm"
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          if (confirmDialog.onConfirm) confirmDialog.onConfirm();
          setConfirmDialog({ visible: false, title: '', message: '', onConfirm: null });
        }}
        onCancel={() => setConfirmDialog({ visible: false, title: '', message: '', onConfirm: null })}
        confirmText="Xác nhận"
        cancelText="Hủy bỏ"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f8f9fa',
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterRow: {
    flex: 1,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  filterChipSelected: {
    backgroundColor: '#6200EE',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  sortButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  categoryCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  categoryCardContent: {
    padding: 16,
  },
  categoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryName: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
    fontSize: 16,
  },
  categoryCode: {
    color: '#6200EE',
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryDescription: {
    color: '#666',
    lineHeight: 18,
    fontSize: 13,
  },
  categoryActions: {
    alignItems: 'flex-end',
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  statText: {
    color: '#666',
    marginLeft: 6,
    fontSize: 12,
  },
  menuButton: {
    margin: 0,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    marginBottom: 12,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
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
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  input: {
    marginBottom: 12,
  },
});

export default ProductCategoryScreen;