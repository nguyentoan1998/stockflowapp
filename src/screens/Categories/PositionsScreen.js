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
import CRUDModal, { FormSection } from '../../components/CRUDModal';
import { FormInput } from '../../components/CRUDModal/FormInputs';
import ListCard from '../../components/ui/ListCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon, Ionicons } from '@expo/vector-icons';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';
import { useAuth } from '../../contexts/AuthContext';

export default function PositionsScreen() {
  const [positions, setPositions] = useState([]);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingPosition, setEditingPosition] = useState(null);
  const [menuVisible, setMenuVisible] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('asc');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    level: 1,
  });

  const { api } = useApi();
  const { user } = useAuth();

  useEffect(() => {
    loadPositions();
    
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
    filterPositions();
  }, [searchQuery, positions, filterStatus, sortOrder]);

  const loadPositions = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/api/positions');
      
      // Handle different possible response formats
      if (Array.isArray(response.data)) {
        setPositions(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setPositions(response.data.data);
      } else if (response.data && response.data.positions && Array.isArray(response.data.positions)) {
        setPositions(response.data.positions);
      } else {
        setPositions([]);
      }
    } catch (error) {
      Alert.error(
        'Lỗi kết nối',
        `Không thể kết nối tới server.\n\nMã lỗi: ${error.response?.status || 'Network'}\nEndpoint: /api/positions`
      );
      setPositions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterPositions = () => {
    let filtered = positions.filter(position => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || (
        position.name.toLowerCase().includes(searchLower) ||
        position.code.toLowerCase().includes(searchLower) ||
        (position.description && position.description.toLowerCase().includes(searchLower))
      );
      
      let matchesStatus = true;
      if (filterStatus === 'active') {
        matchesStatus = position.is_active === true || position.is_active === 1;
      } else if (filterStatus === 'inactive') {
        matchesStatus = position.is_active === false || position.is_active === 0;
      }
      
      return matchesSearch && matchesStatus;
    });
    
    filtered.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB, 'vi') : nameB.localeCompare(nameA, 'vi');
    });
    
    setFilteredPositions(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPositions();
  };

  const handleAdd = () => {
    setEditingPosition(null);
    setModalMode('create');
    setFormData({
      code: '',
      name: '',
      description: '',
      level: 1,
    });
    setShowModal(true);
  };

  const handleEdit = (position) => {
    setEditingPosition(position);
    setModalMode('edit');
    setFormData({
      code: position.code || '',
      name: position.name || '',
      description: position.description || '',
      level: position.level || 1,
    });
    setShowModal(true);
    setMenuVisible({});
  };

  const handleDelete = (positionId) => {
    Alert.confirm(
      'Xác nhận xóa chức vụ',
      'Bạn có chắc chắn muốn xóa chức vụ này?\n\nHành động này không thể hoàn tác!',
      () => deletePosition(positionId)
    );
    setMenuVisible({});
  };

  const deletePosition = async (positionId) => {
    // Optimistic delete - xóa khỏi UI ngay lập tức
    const positionToDelete = positions.find(position => position.id === positionId);
    setPositions(positions.filter(position => position.id !== positionId));
    
    try {
      const response = await api.delete(`/api/positions/${positionId}`);
      if (response.data.success || response.status === 200) {
        Alert.success(
          'Xóa thành công!',
          `Chức vụ "${positionToDelete?.name || ''}" đã được xóa khỏi hệ thống.`
        );
      }
    } catch (error) {
      // Rollback on error - khôi phục position nếu API call thất bại
      if (positionToDelete) {
        setPositions(prevPositions => [...prevPositions, positionToDelete]);
        Alert.error(
          'Lỗi xóa chức vụ',
          'Không thể xóa chức vụ. Vui lòng kiểm tra kết nối và thử lại.'
        );
      }
    }
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      Alert.error(
        'Thiếu thông tin',
        'Vui lòng nhập mã chức vụ để tiếp tục.'
      );
      return;
    }
    
    if (!formData.name.trim()) {
      Alert.error(
        'Thiếu thông tin',
        'Vui lòng nhập tên chức vụ để tiếp tục.'
      );
      return;
    }

    setSaveLoading(true);
    try {
      setLoading(true);
      if (editingPosition) {
        // Store editingPosition ID before closing modal
        const editingId = editingPosition.id;
        
        // Optimistic update - cập nhật UI ngay lập tức
        const optimisticPosition = { ...editingPosition, ...formData };
        setPositions(positions.map(position => 
          position.id === editingPosition.id ? optimisticPosition : position
        ));
        setShowModal(false);
        setEditingPosition(null);
        
        // API call in background
        const response = await api.put(`/api/positions/${editingId}`, formData);
        if (response.data.success || response.status === 200) {
          Alert.success(
            'Cập nhật thành công!',
            `Thông tin chức vụ "${formData.name}" đã được cập nhật.`
          );
        }
      } else {
        // Optimistic update - thêm position mới vào UI ngay
        const tempId = `temp_${Date.now()}`;
        const optimisticPosition = {
          id: tempId,
          ...formData,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setPositions([...positions, optimisticPosition]);
        setShowModal(false);
        
        // API call in background
        const response = await api.post('/api/positions', formData);
        
        // Handle different response formats
        let newPositionData = null;
        if (response.data?.success && response.data?.data) {
          newPositionData = response.data.data;
        } else if (response.data?.id) {
          newPositionData = response.data;
        } else if (response.status === 201 || response.status === 200) {
          newPositionData = response.data;
        }
        
        if (newPositionData) {
          // Replace optimistic position with real data from server
          setPositions(prevPositions => prevPositions.map(position => 
            position.id === tempId ? newPositionData : position
          ));
          Alert.success(
            'Thêm mới thành công!',
            `Chức vụ "${formData.name}" đã được thêm vào hệ thống.`
          );
        } else {
          Alert.success(
            'Thêm mới thành công!',
            `Chức vụ "${formData.name}" đã được thêm vào hệ thống.`
          );
        }
      }
    } catch (error) {
      Alert.error(
        'Lỗi lưu chức vụ',
        'Có lỗi xảy ra khi lưu chức vụ. Vui lòng kiểm tra thông tin và thử lại.'
      );
      loadPositions();
    } finally {
      setLoading(false);
      setSaveLoading(false);
    }
  };

  const handleDeleteInModal = () => {
    if (editingPosition) {
      handleDelete(editingPosition.id);
      setShowModal(false);
    }
  };

  const getStatusChip = (isActive) => {
    return (
      <Animated.View
        style={{
          transform: [{
            scale: new Animated.Value(1)
          }]
        }}
      >
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
      </Animated.View>
    );
  };


  const toggleMenu = (positionId) => {
    setMenuVisible(prev => ({
      ...prev,
      [positionId]: !prev[positionId]
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
            Chức vụ
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Quản lý vị trí và cấp bậc công việc
          </Text>
        </View>
        
        <Searchbar
          placeholder="Tìm kiếm chức vụ..."
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
              Tất cả ({positions.length})
            </Chip>
            <Chip
              selected={filterStatus === 'active'}
              onPress={() => setFilterStatus('active')}
              style={[styles.filterChip, filterStatus === 'active' && styles.filterChipSelected]}
              textStyle={filterStatus === 'active' && styles.filterChipTextSelected}
              icon="check-circle"
            >
              Hoạt động ({positions.filter(p => p.is_active === true || p.is_active === 1).length})
            </Chip>
            <Chip
              selected={filterStatus === 'inactive'}
              onPress={() => setFilterStatus('inactive')}
              style={[styles.filterChip, filterStatus === 'inactive' && styles.filterChipSelected]}
              textStyle={filterStatus === 'inactive' && styles.filterChipTextSelected}
              icon="pause-circle"
            >
              Tạm dừng ({positions.filter(p => p.is_active === false || p.is_active === 0).length})
            </Chip>
          </ScrollView>
          
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <Icon 
              name={sortOrder === 'asc' ? 'sort-alphabetical-ascending' : 'sort-alphabetical-descending'} 
              size={24} 
              color="#9C27B0" 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Positions Cards */}
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
          style={styles.positionsContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredPositions.map((position) => (
            <ListCard
              key={position.id}
              title={position.name}
              subtitle={`#${position.code}`}
              imageIcon="account-tie"
              badge={{
                text: position.is_active ? 'Hoạt động' : 'Ngừng',
                color: position.is_active ? '#4CAF50' : '#F44336',
                bgColor: position.is_active ? '#E8F5E9' : '#FFEBEE',
                icon: position.is_active ? 'check-circle' : 'close-circle',
              }}
              statusDot={{
                color: position.is_active ? '#4CAF50' : '#F44336',
              }}
              details={[
                { 
                  icon: 'text', 
                  text: position.description || 'Chưa có mô tả',
                  color: position.description ? '#666' : '#999',
                },
                { 
                  icon: 'account-multiple', 
                  text: `${position.staff?.length || 0} nhân viên`,
                  color: '#4CAF50',
                },
              ]}
              actions={[
                {
                  label: 'Sửa',
                  icon: 'pencil',
                  color: '#4CAF50',
                  onPress: () => handleEdit(position),
                },
                {
                  label: 'Xóa',
                  icon: 'delete',
                  color: '#F44336',
                  onPress: () => handleDelete(position.id),
                },
              ]}
              onPress={() => handleEdit(position)}
            />
          ))}
          
          {filteredPositions.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="account-tie-outline" size={64} color="#ccc" />
              <Text variant="bodyLarge" style={styles.emptyText}>
                {searchQuery ? 'Không tìm thấy chức vụ phù hợp' : 'Chưa có chức vụ nào'}
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
        title={modalMode === 'create' ? 'Thêm chức vụ mới' : 'Sửa chức vụ'}
        icon="account-tie"
        onSubmit={handleSave}
        onDelete={modalMode === 'edit' ? handleDeleteInModal : null}
        loading={saveLoading}
      >
        <FormSection title="Thông tin chức vụ">
          <FormInput
            label="Mã chức vụ *"
            value={formData.code}
            onChangeText={(text) => setFormData({...formData, code: text.toUpperCase()})}
            icon="tag"
            placeholder="VD: MGR, DEV, ADMIN"
            autoCapitalize="characters"
          />
          
          <FormInput
            label="Tên chức vụ *"
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
            icon="account-tie"
            placeholder="VD: Quản lý, Nhân viên"
          />
          
          <FormInput
            label="Mô tả"
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
            icon="text"
            multiline
            numberOfLines={3}
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
    backgroundColor: '#9C27B0',
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
  positionsContainer: {
    flex: 1,
  },
  positionCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  positionCardContent: {
    padding: 16,
  },
  positionCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  positionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  positionInfo: {
    flex: 1,
    marginRight: 12,
  },
  positionActions: {
    alignItems: 'flex-end',
  },
  positionName: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
    fontSize: 16,
  },
  positionCode: {
    color: '#9C27B0',
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  positionDescription: {
    color: '#666',
    lineHeight: 18,
    fontSize: 13,
  },
  positionStats: {
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
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  input: {
    marginBottom: 12,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  salaryInput: {
    width: '48%',
  },
});