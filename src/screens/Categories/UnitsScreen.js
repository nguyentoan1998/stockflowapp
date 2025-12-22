import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
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

export default function UnitsScreen() {
  const [units, setUnits] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingUnit, setEditingUnit] = useState(null);
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
    description: '',
  });

  const { api } = useApi();
  const { user } = useAuth();

  useEffect(() => {
    loadUnits();
    
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
    filterUnits();
  }, [searchQuery, units, filterStatus, sortOrder]);

  const loadUnits = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/api/units');
      
      // Handle different possible response formats
      if (Array.isArray(response.data)) {
        setUnits(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setUnits(response.data.data);
      } else if (response.data && response.data.units && Array.isArray(response.data.units)) {
        setUnits(response.data.units);
      } else {
        setUnits([]);
      }
    } catch (error) {
      Alert.error(
        'Lỗi kết nối',
        `Không thể kết nối tới server.\n\nMã lỗi: ${error.response?.status || 'Network'}\nEndpoint: /api/units`
      );
      setUnits([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterUnits = () => {
    let filtered = units.filter(unit => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || (
        unit.name.toLowerCase().includes(searchLower) ||
        unit.code.toLowerCase().includes(searchLower) ||
        (unit.symbol && unit.symbol.toLowerCase().includes(searchLower)) ||
        (unit.description && unit.description.toLowerCase().includes(searchLower))
      );
      
      let matchesStatus = true;
      if (filterStatus === 'active') {
        matchesStatus = unit.is_active === true || unit.is_active === 1;
      } else if (filterStatus === 'inactive') {
        matchesStatus = unit.is_active === false || unit.is_active === 0;
      }
      
      return matchesSearch && matchesStatus;
    });
    
    filtered.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB, 'vi') : nameB.localeCompare(nameA, 'vi');
    });
    
    setFilteredUnits(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUnits();
  };

  const handleAdd = () => {
    setEditingUnit(null);
    setModalMode('create');
    setFormData({
      code: '',
      name: '',
      description: '',
    });
    setShowModal(true);
  };

  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setModalMode('edit');
    setFormData({
      code: unit.code || '',
      name: unit.name || '',
      description: unit.description || '',
    });
    setShowModal(true);
    setMenuVisible({});
  };

  const handleDelete = (unitId) => {
    Alert.confirm(
      'Xác nhận xóa đơn vị',
      'Bạn có chắc chắn muốn xóa đơn vị này?\n\nHành động này không thể hoàn tác!',
      () => deleteUnit(unitId)
    );
    setMenuVisible({});
  };

  const deleteUnit = async (unitId) => {
    // Optimistic delete - xóa khỏi UI ngay lập tức
    const unitToDelete = units.find(unit => unit.id === unitId);
    setUnits(units.filter(unit => unit.id !== unitId));
    
    try {
      const response = await api.delete(`/api/units/${unitId}`);
      if (response.data.success || response.status === 200) {
        Alert.success(
          'Xóa thành công!',
          `Đơn vị "${unitToDelete?.name || ''}" đã được xóa khỏi hệ thống.`
        );
      }
    } catch (error) {
      // Rollback on error - khôi phục unit nếu API call thất bại
      if (unitToDelete) {
        setUnits(prevUnits => [...prevUnits, unitToDelete]);
        Alert.error(
          'Lỗi xóa đơn vị',
          'Không thể xóa đơn vị. Vui lòng kiểm tra kết nối và thử lại.'
        );
      }
    }
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      Alert.error(
        'Thiếu thông tin',
        'Vui lòng nhập mã đơn vị để tiếp tục.'
      );
      return;
    }
    
    if (!formData.name.trim()) {
      Alert.error(
        'Thiếu thông tin',
        'Vui lòng nhập tên đơn vị để tiếp tục.'
      );
      return;
    }
    
    setSaveLoading(true);
    try {
      if (editingUnit) {
        // Store editingUnit ID before closing modal
        const editingId = editingUnit.id;
        
        // Optimistic update - cập nhật UI ngay lập tức
        const optimisticUnit = { ...editingUnit, ...formData };
        setUnits(units.map(unit => 
          unit.id === editingUnit.id ? optimisticUnit : unit
        ));
        setShowModal(false);
        setEditingUnit(null);
        
        // API call in background
        const response = await api.put(`/api/units/${editingId}`, formData);
        if (response.data.success || response.status === 200) {
          Alert.success(
            'Cập nhật thành công!',
            `Thông tin đơn vị "${formData.name}" đã được cập nhật.`
          );
        }
      } else {
        // Optimistic update - thêm unit mới vào UI ngay
        const tempId = `temp_${Date.now()}`;
        const optimisticUnit = {
          id: tempId,
          ...formData,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUnits([...units, optimisticUnit]);
        setShowModal(false);
        
        // API call in background
        const response = await api.post('/api/units', formData);
        
        // Handle different response formats
        let newUnitData = null;
        if (response.data?.success && response.data?.data) {
          newUnitData = response.data.data;
        } else if (response.data?.id) {
          newUnitData = response.data;
        } else if (response.status === 201 || response.status === 200) {
          newUnitData = response.data;
        }
        
        if (newUnitData) {
          // Replace optimistic unit with real data from server
          setUnits(prevUnits => prevUnits.map(unit => 
            unit.id === tempId ? newUnitData : unit
          ));
          Alert.success(
            'Thêm mới thành công!',
            `Đơn vị "${formData.name}" đã được thêm vào hệ thống.`
          );
        } else {
          Alert.success(
            'Thêm mới thành công!',
            `Đơn vị "${formData.name}" đã được thêm vào hệ thống.`
          );
        }
      }
    } catch (error) {
      Alert.error(
        'Lỗi lưu đơn vị',
        'Có lỗi xảy ra khi lưu đơn vị. Vui lòng kiểm tra thông tin và thử lại.'
      );
      loadUnits();
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteInModal = () => {
    if (editingUnit) {
      handleDelete(editingUnit.id);
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

  const toggleMenu = (unitId) => {
    setMenuVisible(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
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
            Đơn vị
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Quản lý đơn vị đo lường sản phẩm
          </Text>
        </View>
        
        <Searchbar
          placeholder="Tìm kiếm đơn vị..."
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
              Tất cả ({units.length})
            </Chip>
            <Chip
              selected={filterStatus === 'active'}
              onPress={() => setFilterStatus('active')}
              style={[styles.filterChip, filterStatus === 'active' && styles.filterChipSelected]}
              textStyle={filterStatus === 'active' && styles.filterChipTextSelected}
              icon="check-circle"
            >
              Hoạt động ({units.filter(u => u.is_active === true || u.is_active === 1).length})
            </Chip>
            <Chip
              selected={filterStatus === 'inactive'}
              onPress={() => setFilterStatus('inactive')}
              style={[styles.filterChip, filterStatus === 'inactive' && styles.filterChipSelected]}
              textStyle={filterStatus === 'inactive' && styles.filterChipTextSelected}
              icon="pause-circle"
            >
              Tạm dừng ({units.filter(u => u.is_active === false || u.is_active === 0).length})
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

      {/* Units Cards */}
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
          style={styles.unitsContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredUnits.map((unit) => (
            <ListCard
              key={unit.id}
              title={unit.name}
              subtitle={`#${unit.code}`}
              imageIcon="ruler"
              badge={{
                text: unit.is_active ? 'Hoạt động' : 'Ngừng',
                color: unit.is_active ? '#4CAF50' : '#F44336',
                bgColor: unit.is_active ? '#E8F5E9' : '#FFEBEE',
                icon: unit.is_active ? 'check-circle' : 'close-circle',
              }}
              statusDot={{
                color: unit.is_active ? '#4CAF50' : '#F44336',
              }}
              details={[
                unit.description && { 
                  icon: 'text', 
                  text: unit.description,
                  color: '#666',
                },
                unit.symbol && {
                  icon: 'format-letter-case',
                  text: `Ký hiệu: ${unit.symbol}`,
                  color: '#4CAF50',
                },
              ].filter(Boolean)}
              actions={[
                {
                  label: 'Sửa',
                  icon: 'pencil',
                  color: '#4CAF50',
                  onPress: () => handleEdit(unit),
                },
                {
                  label: 'Xóa',
                  icon: 'delete',
                  color: '#F44336',
                  onPress: () => handleDelete(unit.id),
                },
              ]}
              onPress={() => handleEdit(unit)}
            />
          ))}
          
          {filteredUnits.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="ruler-square" size={64} color="#ccc" />
              <Text variant="bodyLarge" style={styles.emptyText}>
                {searchQuery ? 'Không tìm thấy đơn vị phù hợp' : 'Chưa có đơn vị nào'}
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
        title={modalMode === 'create' ? 'Thêm đơn vị mới' : 'Sửa đơn vị'}
        icon="package-variant"
        onSubmit={handleSave}
        onDelete={modalMode === 'edit' ? handleDeleteInModal : null}
        loading={saveLoading}
      >
        <FormSection title="Thông tin đơn vị">
          <FormInput
            label="Mã đơn vị *"
            value={formData.code}
            onChangeText={(text) => setFormData({...formData, code: text.toUpperCase()})}
            icon="tag"
            placeholder="VD: KG, M, L"
            autoCapitalize="characters"
          />
          
          <FormInput
            label="Tên đơn vị *"
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
            icon="ruler"
            placeholder="VD: Kilogram, Mét, Lít"
          />
          
          <FormInput
            label="Mô tả"
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
            icon="text"
            multiline
            numberOfLines={3}
            placeholder="Mô tả chi tiết về đơn vị..."
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
  unitsContainer: {
    flex: 1,
  },
  unitCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  unitCardContent: {
    padding: 16,
  },
  unitCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  unitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  unitInfo: {
    flex: 1,
    marginRight: 12,
  },
  unitActions: {
    alignItems: 'flex-end',
  },
  unitName: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
    fontSize: 16,
  },
  unitCode: {
    color: '#3F51B5',
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  unitSymbol: {
    color: '#666',
    fontSize: 13,
  },
  unitDetails: {
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
  unitStats: {
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
    maxHeight: '80%',
  },
  modalKeyboardView: {
    maxHeight: '100%',
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  modalActions: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  input: {
    marginBottom: 12,
  },
});