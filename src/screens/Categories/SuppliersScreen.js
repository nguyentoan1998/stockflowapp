import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
import {
  Text,
  Card,
  Portal,
  TextInput,
  Chip,
  Searchbar,
  Menu,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon, Ionicons } from '@expo/vector-icons';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';
import { useAuth } from '../../contexts/AuthContext';
import CRUDModal, { FormSection } from '../../components/CRUDModal';
import { FormInput } from '../../components/CRUDModal/FormInputs';
import ListCard from '../../components/ui/ListCard';

export default function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [menuVisible, setMenuVisible] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    tax_code: '',
    address: '',
    phone: '',
    email: '',
    contact_person: '',
  });

  const { api } = useApi();
  const { user } = useAuth();

  useEffect(() => {
    loadSuppliers();
    
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

  useEffect(() => {
    filterSuppliers();
  }, [searchQuery, suppliers]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/api/suppliers');
      
      // Handle different possible response formats
      if (Array.isArray(response.data)) {
        setSuppliers(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setSuppliers(response.data.data);
      } else if (response.data && response.data.suppliers && Array.isArray(response.data.suppliers)) {
        setSuppliers(response.data.suppliers);
      } else {
        setSuppliers([]);
      }
    } catch (error) {
      Alert.error(
        'Lỗi kết nối',
        `Không thể kết nối tới server.\n\nMã lỗi: ${error.response?.status || 'Network'}\nEndpoint: /api/suppliers`
      );
      setSuppliers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterSuppliers = () => {
    let filtered = suppliers.filter(supplier => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || (
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.code.toLowerCase().includes(searchLower) ||
        (supplier.phone && supplier.phone.includes(searchQuery)) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchLower)) ||
        (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchLower))
      );
      
      let matchesStatus = true;
      if (filterStatus === 'active') {
        matchesStatus = supplier.is_active === true || supplier.is_active === 1;
      } else if (filterStatus === 'inactive') {
        matchesStatus = supplier.is_active === false || supplier.is_active === 0;
      }
      
      return matchesSearch && matchesStatus;
    });
    
    filtered.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB, 'vi') : nameB.localeCompare(nameA, 'vi');
    });
    
    setFilteredSuppliers(filtered);
  };

  useEffect(() => {
    filterSuppliers();
  }, [searchQuery, suppliers, filterStatus, sortOrder]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSuppliers();
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    setModalMode('create');
    setFormData({
      code: '',
      name: '',
      tax_code: '',
      address: '',
      phone: '',
      email: '',
      contact_person: '',
    });
    setShowModal(true);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setModalMode('edit');
    setFormData({
      code: supplier.code || '',
      name: supplier.name || '',
      tax_code: supplier.tax_code || '',
      address: supplier.address || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      contact_person: supplier.contact_person || '',
    });
    setShowModal(true);
    setMenuVisible({});
  };

  const handleDelete = (supplierId) => {
    Alert.confirm(
      'Xác nhận xóa nhà cung cấp',
      'Bạn có chắc chắn muốn xóa nhà cung cấp này?\n\nHành động này không thể hoàn tác!',
      () => deleteSupplier(supplierId)
    );
    setMenuVisible({});
  };

  const deleteSupplier = async (supplierId) => {
    // Optimistic delete - xóa khỏi UI ngay lập tức
    const supplierToDelete = suppliers.find(supplier => supplier.id === supplierId);
    setSuppliers(suppliers.filter(supplier => supplier.id !== supplierId));
    
    try {
      const response = await api.delete(`/api/suppliers/${supplierId}`);
      if (response.data.success || response.status === 200) {
        Alert.success(
          'Xóa thành công!',
          `Nhà cung cấp "${supplierToDelete?.name || ''}" đã được xóa khỏi hệ thống.`
        );
      }
    } catch (error) {
      // Rollback on error - khôi phục supplier nếu API call thất bại
      if (supplierToDelete) {
        setSuppliers(prevSuppliers => [...prevSuppliers, supplierToDelete]);
        Alert.error(
          'Lỗi xóa nhà cung cấp',
          'Không thể xóa nhà cung cấp. Vui lòng kiểm tra kết nối và thử lại.'
        );
      }
    }
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      Alert.error(
        'Thiếu thông tin',
        'Vui lòng nhập mã nhà cung cấp để tiếp tục.'
      );
      return;
    }
    
    if (!formData.name.trim()) {
      Alert.error(
        'Thiếu thông tin',
        'Vui lòng nhập tên nhà cung cấp để tiếp tục.'
      );
      return;
    }
    setSaveLoading(true);
    try {
      if (editingSupplier) {
        // Store editingSupplier ID before closing modal
        const editingId = editingSupplier.id;
        
        // Optimistic update - cập nhật UI ngay lập tức
        const optimisticSupplier = { ...editingSupplier, ...formData };
        setSuppliers(suppliers.map(supplier => 
          supplier.id === editingSupplier.id ? optimisticSupplier : supplier
        ));
        setShowModal(false);
        setEditingSupplier(null);
        
        // API call in background
        const response = await api.put(`/api/suppliers/${editingId}`, formData);
        if (response.data.success || response.status === 200) {
          Alert.success(
            'Cập nhật thành công!',
            `Thông tin nhà cung cấp "${formData.name}" đã được cập nhật.`
          );
        }
      } else {
        // Optimistic update - thêm supplier mới vào UI ngay
        const tempId = `temp_${Date.now()}`;
        const optimisticSupplier = {
          id: tempId,
          ...formData,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setSuppliers([...suppliers, optimisticSupplier]);
        setShowModal(false);
        
        // API call in background
        const response = await api.post('/api/suppliers', formData);
        // Handle different response formats
        let newSupplierData = null;
        if (response.data?.success && response.data?.data) {
          newSupplierData = response.data.data;
        } else if (response.data?.id) {
          newSupplierData = response.data;
        } else if (response.status === 201 || response.status === 200) {
          newSupplierData = response.data;
        }
        
        if (newSupplierData) {
          // Replace optimistic supplier with real data from server
          setSuppliers(prevSuppliers => prevSuppliers.map(supplier => 
            supplier.id === tempId ? newSupplierData : supplier
          ));
          Alert.success(
            'Thêm mới thành công!',
            `Nhà cung cấp "${formData.name}" đã được thêm vào hệ thống.`
          );
        } else {
          Alert.success(
            'Thêm mới thành công!',
            `Nhà cung cấp "${formData.name}" đã được thêm vào hệ thống.`
          );
        }
      }
    } catch (error) {
      Alert.error(
        'Lỗi lưu nhà cung cấp',
        'Có lỗi xảy ra khi lưu nhà cung cấp. Vui lòng kiểm tra thông tin và thử lại.'
      );
      loadSuppliers();
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteInModal = () => {
    if (editingSupplier) {
      handleDelete(editingSupplier.id);
      setShowModal(false);
    }
  };

  const getStatusChip = (isActive) => {
    return (
      <Chip
        mode="flat"
        textStyle={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}
        style={{ 
          backgroundColor: isActive ? '#4CAF50' : '#FF5722',
          elevation: 2,
        }}
        icon={isActive ? 'check-circle' : 'pause-circle'}
      >
        {isActive ? 'Hoạt động' : 'Tạm dừng'}
      </Chip>
    );
  };

  const toggleMenu = (supplierId) => {
    setMenuVisible(prev => ({
      ...prev,
      [supplierId]: !prev[supplierId]
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Nhà cung cấp
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Quản lý thông tin các đơn vị cung cấp hàng hóa
          </Text>
        </View>
        
        <Searchbar
          placeholder="Tìm kiếm nhà cung cấp..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <Chip
              selected={filterStatus === 'all'}
              onPress={() => setFilterStatus('all')}
              style={[styles.filterChip, filterStatus === 'all' && styles.filterChipSelected]}
              textStyle={filterStatus === 'all' && styles.filterChipTextSelected}
            >
              Tất cả ({suppliers.length})
            </Chip>
            <Chip
              selected={filterStatus === 'active'}
              onPress={() => setFilterStatus('active')}
              style={[styles.filterChip, filterStatus === 'active' && styles.filterChipSelected]}
              textStyle={filterStatus === 'active' && styles.filterChipTextSelected}
              icon="check-circle"
            >
              Hoạt động ({suppliers.filter(s => s.is_active === true || s.is_active === 1).length})
            </Chip>
            <Chip
              selected={filterStatus === 'inactive'}
              onPress={() => setFilterStatus('inactive')}
              style={[styles.filterChip, filterStatus === 'inactive' && styles.filterChipSelected]}
              textStyle={filterStatus === 'inactive' && styles.filterChipTextSelected}
              icon="pause-circle"
            >
              Tạm dừng ({suppliers.filter(s => s.is_active === false || s.is_active === 0).length})
            </Chip>
          </ScrollView>
          
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <Icon 
              name={sortOrder === 'asc' ? 'sort-alphabetical-ascending' : 'sort-alphabetical-descending'} 
              size={24} 
              color="#3F51B5" 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* suppliers Cards */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <ScrollView
          style={styles.suppliersContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredSuppliers.map((supplier) => (
            <ListCard
              key={supplier.id}
              title={supplier.name}
              subtitle={`#${supplier.code}`}
              imageIcon="truck-delivery"
              badge={{
                text: supplier.is_active ? 'Hoạt động' : 'Ngừng',
                color: supplier.is_active ? '#4CAF50' : '#F44336',
                bgColor: supplier.is_active ? '#E8F5E9' : '#FFEBEE',
                icon: supplier.is_active ? 'check-circle' : 'close-circle',
              }}
              statusDot={{
                color: supplier.is_active ? '#4CAF50' : '#F44336',
              }}
              details={[
                { 
                  icon: 'account', 
                  text: supplier.contact_person || 'Chưa có người liên hệ',
                  color: supplier.contact_person ? '#666' : '#999',
                },
                supplier.phone && { icon: 'phone', text: supplier.phone },
                supplier.email && { icon: 'email', text: supplier.email },
                supplier.address && { icon: 'map-marker', text: supplier.address },
              ].filter(Boolean)}
              actions={[
                {
                  label: 'Sửa',
                  icon: 'pencil',
                  color: '#4CAF50',
                  onPress: () => handleEdit(supplier),
                },
                {
                  label: 'Xóa',
                  icon: 'delete',
                  color: '#F44336',
                  onPress: () => handleDelete(supplier.id),
                },
              ]}
              onPress={() => handleEdit(supplier)}
            />
          ))}
          
          {filteredSuppliers.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="account-heart-outline" size={64} color="#ccc" />
              <Text variant="bodyLarge" style={styles.emptyText}>
                {searchQuery ? 'Không tìm thấy nhà cung cấp phù hợp' : 'Chưa có nhà cung cấp nào'}
              </Text>
            </View>
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <CRUDModal
        visible={showModal}
        onDismiss={() => setShowModal(false)}
        mode={modalMode}
        title={modalMode === 'create' ? 'Thêm nhà cung cấp mới' : 'Sửa nhà cung cấp'}
        icon="truck-delivery"
        onSubmit={handleSave}
        onDelete={modalMode === 'edit' ? handleDeleteInModal : null}
        loading={saveLoading}
      >
        <FormSection title="Thông tin cơ bản">
          <FormInput
            label="Mã nhà cung cấp *"
            value={formData.code}
            onChangeText={(text) => setFormData({...formData, code: text.toUpperCase()})}
            icon="tag"
            placeholder="VD: NCC001, SUP001"
            autoCapitalize="characters"
          />
          
          <FormInput
            label="Tên nhà cung cấp *"
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
            icon="truck-delivery"
            placeholder="VD: Công ty ABC"
          />
          
          <FormInput
            label="Người liên hệ"
            value={formData.contact_person}
            onChangeText={(text) => setFormData({...formData, contact_person: text})}
            icon="account"
            placeholder="VD: Nguyễn Văn A"
          />
        </FormSection>

        <FormSection title="Thông tin liên hệ">
          <FormInput
            label="Số điện thoại"
            value={formData.phone}
            onChangeText={(text) => setFormData({...formData, phone: text})}
            icon="phone"
            placeholder="VD: 0901234567"
            keyboardType="phone-pad"
          />
          
          <FormInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            icon="email"
            placeholder="VD: info@company.com"
            keyboardType="email-address"
          />
          
          <FormInput
            label="Địa chỉ"
            value={formData.address}
            onChangeText={(text) => setFormData({...formData, address: text})}
            icon="map-marker"
            multiline
            numberOfLines={3}
          />
        </FormSection>

        <FormSection title="Thông tin thuế">
          <FormInput
            label="Mã số thuế"
            value={formData.tax_code}
            onChangeText={(text) => setFormData({...formData, tax_code: text})}
            icon="file-document"
            placeholder="VD: 0123456789"
          />
        </FormSection>
      </CRUDModal>

      {/* Custom Alert */}
      <CustomAlert {...alertConfig} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerContent: {
    marginBottom: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#666',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
    marginBottom: 16,
  },
  searchInput: {
    fontSize: 14,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
  },
  filterRow: {
    flex: 1,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  filterChipSelected: {
    backgroundColor: '#3F51B5',
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
  suppliersContainer: {
    flex: 1,
  },
  supplierCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  supplierCardContent: {
    padding: 16,
  },
  supplierCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  supplierIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  supplierInfo: {
    flex: 1,
    marginRight: 12,
  },
  supplierActions: {
    alignItems: 'flex-end',
  },
  supplierName: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
    fontSize: 16,
  },
  supplierCode: {
    color: '#3F51B5',
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  supplierContact: {
    color: '#666',
    fontSize: 13,
  },
  supplierDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  supplierStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#999',
    marginTop: 16,
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
    maxHeight: '90%',
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
