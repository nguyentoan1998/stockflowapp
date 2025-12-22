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

export default function CustomersScreen() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [menuVisible, setMenuVisible] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  
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
    credit_limit: 0,
  });

  const { api } = useApi();
  const { user } = useAuth();

  useEffect(() => {
    loadCustomers();
    
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
    filterCustomers();
  }, [searchQuery, customers, filterStatus, sortOrder]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/api/customers');
      
      // Handle different possible response formats
      if (Array.isArray(response.data)) {
        setCustomers(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setCustomers(response.data.data);
      } else if (response.data && response.data.customers && Array.isArray(response.data.customers)) {
        setCustomers(response.data.customers);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      Alert.error(
        'Lỗi kết nối',
        `Không thể kết nối tới server.\n\nMã lỗi: ${error.response?.status || 'Network'}\nEndpoint: /api/customers`
      );
      setCustomers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers.filter(customer => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.code.toLowerCase().includes(searchLower) ||
        (customer.phone && customer.phone.includes(searchQuery)) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
        (customer.contact_person && customer.contact_person.toLowerCase().includes(searchLower))
      );
      
      // Status filter
      let matchesStatus = true;
      if (filterStatus === 'active') {
        matchesStatus = customer.is_active === true || customer.is_active === 1;
      } else if (filterStatus === 'inactive') {
        matchesStatus = customer.is_active === false || customer.is_active === 0;
      }
      
      return matchesSearch && matchesStatus;
    });
    
    // Sort by name
    filtered.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB, 'vi') : nameB.localeCompare(nameA, 'vi');
    });
    
    setFilteredCustomers(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCustomers();
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setModalMode('create');
    setFormData({
      code: '',
      name: '',
      tax_code: '',
      address: '',
      phone: '',
      email: '',
      contact_person: '',
      credit_limit: 0,
    });
    setShowModal(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setModalMode('edit');
    setFormData({
      code: customer.code || '',
      name: customer.name || '',
      tax_code: customer.tax_code || '',
      address: customer.address || '',
      phone: customer.phone || '',
      email: customer.email || '',
      contact_person: customer.contact_person || '',
      credit_limit: customer.credit_limit || 0,
    });
    setShowModal(true);
    setMenuVisible({});
  };

  const handleDelete = (customerId) => {
    Alert.confirm(
      'Xác nhận xóa khách hàng',
      'Bạn có chắc chắn muốn xóa khách hàng này?\n\nHành động này không thể hoàn tác!',
      () => deleteCustomer(customerId)
    );
    setMenuVisible({});
  };

  const deleteCustomer = async (customerId) => {
    // Optimistic delete - xóa khỏi UI ngay lập tức
    const customerToDelete = customers.find(customer => customer.id === customerId);
    setCustomers(customers.filter(customer => customer.id !== customerId));
    
    try {
      const response = await api.delete(`/api/customers/${customerId}`);
      if (response.data.success || response.status === 200) {
        Alert.success(
          'Xóa thành công!',
          `Khách hàng "${customerToDelete?.name || ''}" đã được xóa khỏi hệ thống.`
        );
      }
    } catch (error) {
      // Rollback on error - khôi phục customer nếu API call thất bại
      if (customerToDelete) {
        setCustomers(prevCustomers => [...prevCustomers, customerToDelete]);
        Alert.error(
          'Lỗi xóa khách hàng',
          'Không thể xóa khách hàng. Vui lòng kiểm tra kết nối và thử lại.'
        );
      }
    }
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      Alert.error(
        'Thiếu thông tin',
        'Vui lòng nhập mã khách hàng để tiếp tục.'
      );
      return;
    }
    
    if (!formData.name.trim()) {
      Alert.error(
        'Thiếu thông tin',
        'Vui lòng nhập tên khách hàng để tiếp tục.'
      );
      return;
    }

    setSaveLoading(true);
    try {
      if (editingCustomer) {
        // Store editingCustomer ID before closing modal
        const editingId = editingCustomer.id;
        
        // Optimistic update - cập nhật UI ngay lập tức
        const optimisticCustomer = { ...editingCustomer, ...formData };
        setCustomers(customers.map(customer => 
          customer.id === editingCustomer.id ? optimisticCustomer : customer
        ));
        setShowModal(false);
        setEditingCustomer(null);
        
        // API call in background
        const response = await api.put(`/api/customers/${editingId}`, formData);
        if (response.data.success || response.status === 200) {
          Alert.success(
            'Cập nhật thành công!',
            `Thông tin khách hàng "${formData.name}" đã được cập nhật.`
          );
        }
      } else {
        // Optimistic update - thêm customer mới vào UI ngay
        const tempId = `temp_${Date.now()}`;
        const optimisticCustomer = {
          id: tempId,
          ...formData,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setCustomers([...customers, optimisticCustomer]);
        setShowModal(false);
        
        // API call in background
        const response = await api.post('/api/customers', formData);
        
        // Handle different response formats
        let newCustomerData = null;
        if (response.data?.success && response.data?.data) {
          newCustomerData = response.data.data;
        } else if (response.data?.id) {
          newCustomerData = response.data;
        } else if (response.status === 201 || response.status === 200) {
          newCustomerData = response.data;
        }
        
        if (newCustomerData) {
          // Replace optimistic customer with real data from server
          setCustomers(prevCustomers => prevCustomers.map(customer => 
            customer.id === tempId ? newCustomerData : customer
          ));
          Alert.success(
            'Thêm mới thành công!',
            `Khách hàng "${formData.name}" đã được thêm vào hệ thống.`
          );
        } else {
          Alert.success(
            'Thêm mới thành công!',
            `Khách hàng "${formData.name}" đã được thêm vào hệ thống.`
          );
        }
      }
    } catch (error) {
      Alert.error(
        'Lỗi lưu khách hàng',
        'Có lỗi xảy ra khi lưu khách hàng. Vui lòng kiểm tra thông tin và thử lại.'
      );
      loadCustomers();
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteInModal = () => {
    if (editingCustomer) {
      handleDelete(editingCustomer.id);
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

  const toggleMenu = (customerId) => {
    setMenuVisible(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
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
            Khách hàng
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Quản lý danh bạ và lịch sử giao dịch
          </Text>
        </View>
        
        <Searchbar
          placeholder="Tìm kiếm khách hàng..."
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
              Tất cả ({customers.length})
            </Chip>
            <Chip
              selected={filterStatus === 'active'}
              onPress={() => setFilterStatus('active')}
              style={[styles.filterChip, filterStatus === 'active' && styles.filterChipSelected]}
              textStyle={filterStatus === 'active' && styles.filterChipTextSelected}
              icon="check-circle"
            >
              Hoạt động ({customers.filter(c => c.is_active === true || c.is_active === 1).length})
            </Chip>
            <Chip
              selected={filterStatus === 'inactive'}
              onPress={() => setFilterStatus('inactive')}
              style={[styles.filterChip, filterStatus === 'inactive' && styles.filterChipSelected]}
              textStyle={filterStatus === 'inactive' && styles.filterChipTextSelected}
              icon="pause-circle"
            >
              Tạm dừng ({customers.filter(c => c.is_active === false || c.is_active === 0).length})
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

      {/* Customers Cards */}
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
          style={styles.customersContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredCustomers.map((customer, index) => {
            return (
              <ListCard
                key={customer.id}
                title={customer.name}
                subtitle={`#${customer.code}`}
                imageIcon="account-heart"
                badge={{
                  text: customer.is_active ? 'Hoạt động' : 'Ngừng',
                  color: customer.is_active ? '#4CAF50' : '#F44336',
                  bgColor: customer.is_active ? '#E8F5E9' : '#FFEBEE',
                  icon: customer.is_active ? 'check-circle' : 'close-circle',
                }}
                statusDot={{
                  color: customer.is_active ? '#4CAF50' : '#F44336',
                }}
                details={[
                  { 
                    icon: 'account', 
                    text: customer.contact_person || 'Chưa có người liên hệ',
                    color: customer.contact_person ? '#666' : '#999',
                  },
                  customer.phone && { 
                    icon: 'phone', 
                    text: customer.phone,
                  },
                  customer.email && { 
                    icon: 'email', 
                    text: customer.email,
                  },
                  customer.address && { 
                    icon: 'map-marker', 
                    text: customer.address,
                  },
                ].filter(Boolean)}
                actions={[
                  {
                    label: 'Sửa',
                    icon: 'pencil',
                    color: '#4CAF50',
                    onPress: () => handleEdit(customer),
                  },
                  {
                    label: 'Xóa',
                    icon: 'delete',
                    color: '#F44336',
                    onPress: () => handleDelete(customer.id),
                  },
                ]}
                onPress={() => handleEdit(customer)}
              />
            );
          })}
          
          {filteredCustomers.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="account-heart-outline" size={64} color="#ccc" />
              <Text variant="bodyLarge" style={styles.emptyText}>
                {searchQuery ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có khách hàng nào'}
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
        title={modalMode === 'create' ? 'Thêm khách hàng mới' : 'Sửa khách hàng'}
        icon="account-heart"
        onSubmit={handleSave}
        onDelete={modalMode === 'edit' ? handleDeleteInModal : null}
        loading={saveLoading}
      >
        {/* Basic Information Section */}
        <FormSection title="Thông tin cơ bản">
          <FormInput
            label="Mã khách hàng *"
            value={formData.code}
            onChangeText={(text) => setFormData({...formData, code: text.toUpperCase()})}
            icon="tag"
            placeholder="VD: KH001, CUST001"
            autoCapitalize="characters"
          />
          
          <FormInput
            label="Tên khách hàng *"
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
            icon="account-heart"
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

        {/* Contact Information Section */}
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

        {/* Tax Information Section */}
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
  customersContainer: {
    flex: 1,
  },
  customerCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  customerCardContent: {
    padding: 16,
  },
  customerCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
    marginRight: 12,
  },
  customerActions: {
    alignItems: 'flex-end',
  },
  customerName: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
    fontSize: 16,
  },
  customerCode: {
    color: '#3F51B5',
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  customerContact: {
    color: '#666',
    fontSize: 13,
  },
  customerDetails: {
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
  customerStats: {
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