import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
import {
  Text,
  Card,
  Portal,
  Modal,
  TextInput,
  Button,
  Chip,
  Searchbar,
  Menu,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon, Ionicons } from '@expo/vector-icons';
import { useApi } from '../../contexts/ApiContext';
import CustomDialog from '../../components/CustomDialog';
import { useAuth } from '../../contexts/AuthContext';

export default function MaterialGroupsScreen() {
  const [materialGroups, setMaterialGroups] = useState([]);
  const [filteredMaterialGroups, setFilteredMaterialGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterialGroup, setEditingMaterialGroup] = useState(null);
  const [menuVisible, setMenuVisible] = useState({});
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('asc');
  
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

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  });

  const { api } = useApi();
  const { user } = useAuth();

  useEffect(() => {
    loadMaterialGroups();
    
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
    filterMaterialGroups();
  }, [searchQuery, materialGroups, filterStatus, sortOrder]);

  const loadMaterialGroups = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/api/product_category');
      
      // Handle different possible response formats
      if (Array.isArray(response.data)) {
        setMaterialGroups(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setMaterialGroups(response.data.data);
      } else if (response.data && response.data.product_category && Array.isArray(response.data.product_category)) {
        setMaterialGroups(response.data.product_category);
      } else {
        setMaterialGroups([]);
      }
    } catch (error) {
      setErrorDialog({
        visible: true,
        title: '🌐 Lỗi kết nối',
        message: `Không thể kết nối tới server.\n\nMã lỗi: ${error.response?.status || 'Network'}\nEndpoint: /api/product_category`
      });
      setMaterialGroups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterMaterialGroups = () => {
    let filtered = materialGroups.filter(group => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || (
        group.name.toLowerCase().includes(searchLower) ||
        group.code.toLowerCase().includes(searchLower) ||
        (group.description && group.description.toLowerCase().includes(searchLower))
      );
      
      let matchesStatus = true;
      if (filterStatus === 'active') {
        matchesStatus = group.is_active === true || group.is_active === 1;
      } else if (filterStatus === 'inactive') {
        matchesStatus = group.is_active === false || group.is_active === 0;
      }
      
      return matchesSearch && matchesStatus;
    });
    
    filtered.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB, 'vi') : nameB.localeCompare(nameA, 'vi');
    });
    
    setFilteredMaterialGroups(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMaterialGroups();
  };

  const handleAdd = () => {
    setEditingMaterialGroup(null);
    setFormData({
      code: '',
      name: '',
      description: '',
    });
    setShowModal(true);
  };

  const handleEdit = (group) => {
    setEditingMaterialGroup(group);
    setFormData({
      code: group.code || '',
      name: group.name || '',
      description: group.description || '',
    });
    setShowModal(true);
    setMenuVisible({});
  };

  const handleDelete = (groupId) => {
    setConfirmDialog({
      visible: true,
      title: '🗑️ Xác nhận xóa nhóm vật tư',
      message: 'Bạn có chắc chắn muốn xóa nhóm vật tư này?\n\nHành động này không thể hoàn tác!',
      onConfirm: () => deleteMaterialGroup(groupId)
    });
    setMenuVisible({});
  };

  const deleteMaterialGroup = async (groupId) => {
    // Optimistic delete - xóa khỏi UI ngay lập tức
    const groupToDelete = materialGroups.find(group => group.id === groupId);
    setMaterialGroups(materialGroups.filter(group => group.id !== groupId));
    
    try {
      const response = await api.delete(`/api/product_category/${groupId}`);
      if (response.data.success || response.status === 200) {
        setSuccessDialog({
          visible: true,
          title: '🎉 Xóa thành công!',
          message: 'Nhóm vật tư đã được xóa khỏi hệ thống.'
        });
      }
    } catch (error) {
      // Rollback on error - khôi phục group nếu API call thất bại
      if (groupToDelete) {
        setMaterialGroups(prevGroups => [...prevGroups, groupToDelete]);
        setErrorDialog({
          visible: true,
          title: '❌ Lỗi xóa nhóm vật tư',
          message: 'Không thể xóa nhóm vật tư. Vui lòng kiểm tra kết nối và thử lại.'
        });
      }
    }
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      setErrorDialog({
        visible: true,
        title: '⚠️ Thiếu thông tin',
        message: 'Vui lòng nhập mã nhóm vật tư để tiếp tục.'
      });
      return;
    }
    
    if (!formData.name.trim()) {
      setErrorDialog({
        visible: true,
        title: '⚠️ Thiếu thông tin',
        message: 'Vui lòng nhập tên nhóm vật tư để tiếp tục.'
      });
      return;
    }
    
    try {
      if (editingMaterialGroup) {
        // Store editing ID before closing modal
        const editingId = editingMaterialGroup.id;
        
        // Optimistic update - cập nhật UI ngay lập tức
        const optimisticGroup = { ...editingMaterialGroup, ...formData };
        setMaterialGroups(materialGroups.map(group => 
          group.id === editingMaterialGroup.id ? optimisticGroup : group
        ));
        setShowModal(false);
        setEditingMaterialGroup(null);
        
        // API call in background
        const response = await api.put(`/api/product_category/${editingId}`, formData);
        if (response.data.success || response.status === 200) {
          setSuccessDialog({
            visible: true,
            title: '✅ Cập nhật thành công!',
            message: 'Thông tin nhóm vật tư đã được cập nhật.'
          });
        }
      } else {
        // Optimistic update - thêm group mới vào UI ngay
        const tempId = `temp_${Date.now()}`;
        const optimisticGroup = {
          id: tempId,
          ...formData,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setMaterialGroups([...materialGroups, optimisticGroup]);
        setShowModal(false);
        
        // API call in background
        const response = await api.post('/api/product_category', formData);
        
        // Handle different response formats
        let newGroupData = null;
        if (response.data?.success && response.data?.data) {
          newGroupData = response.data.data;
        } else if (response.data?.id) {
          newGroupData = response.data;
        } else if (response.status === 201 || response.status === 200) {
          newGroupData = response.data;
        }
        
        if (newGroupData) {
          // Replace optimistic group with real data from server
          setMaterialGroups(prevGroups => prevGroups.map(group => 
            group.id === tempId ? newGroupData : group
          ));
          setSuccessDialog({
            visible: true,
            title: '🎉 Tạo nhóm vật tư thành công!',
            message: 'Nhóm vật tư mới đã được thêm vào hệ thống.'
          });
        } else {
          setSuccessDialog({
            visible: true,
            title: '🎉 Tạo nhóm vật tư thành công!',
            message: 'Nhóm vật tư mới đã được thêm vào hệ thống.'
          });
        }
      }
    } catch (error) {
      setErrorDialog({
        visible: true,
        title: '❌ Lỗi lưu nhóm vật tư',
        message: 'Có lỗi xảy ra khi lưu nhóm vật tư. Vui lòng kiểm tra thông tin và thử lại.'
      });
      loadMaterialGroups();
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

  const toggleMenu = (groupId) => {
    setMenuVisible(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
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
            Nhóm vật tư
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Quản lý phân loại và nhóm vật tư, nguyên liệu
          </Text>
        </View>
        
        <Searchbar
          placeholder="Tìm kiếm nhóm vật tư..."
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
              Tất cả ({materialGroups.length})
            </Chip>
            <Chip
              selected={filterStatus === 'active'}
              onPress={() => setFilterStatus('active')}
              style={[styles.filterChip, filterStatus === 'active' && styles.filterChipSelected]}
              textStyle={filterStatus === 'active' && styles.filterChipTextSelected}
              icon="check-circle"
            >
              Hoạt động ({materialGroups.filter(g => g.is_active === true || g.is_active === 1).length})
            </Chip>
            <Chip
              selected={filterStatus === 'inactive'}
              onPress={() => setFilterStatus('inactive')}
              style={[styles.filterChip, filterStatus === 'inactive' && styles.filterChipSelected]}
              textStyle={filterStatus === 'inactive' && styles.filterChipTextSelected}
              icon="pause-circle"
            >
              Tạm dừng ({materialGroups.filter(g => g.is_active === false || g.is_active === 0).length})
            </Chip>
          </ScrollView>
          
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <Icon 
              name={sortOrder === 'asc' ? 'sort-alphabetical-ascending' : 'sort-alphabetical-descending'} 
              size={24} 
              color="#4CAF50" 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Material Groups Cards */}
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
          style={styles.groupsContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredMaterialGroups.map((group, index) => {
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
                key={group.id}
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
                  <Card style={styles.groupCard}>
                    <Card.Content style={styles.groupCardContent}>
                      <View style={styles.groupCardHeader}>
                        <View style={styles.groupIcon}>
                          <Icon name="folder-multiple" size={24} color="#4CAF50" />
                        </View>
                        <View style={styles.groupInfo}>
                          <Text variant="titleMedium" style={styles.groupName}>
                            {group.name}
                          </Text>
                          <Text variant="bodyMedium" style={styles.groupCode}>
                            #{group.code}
                          </Text>
                        </View>
                        <View style={styles.groupActions}>
                          {getStatusChip(group.is_active)}
                          <Menu
                            visible={menuVisible[group.id]}
                            onDismiss={() => toggleMenu(group.id)}
                            anchor={
                              <IconButton
                                icon="dots-vertical"
                                onPress={() => toggleMenu(group.id)}
                                style={styles.menuButton}
                              />
                            }
                          >
                            <Menu.Item 
                              onPress={() => handleEdit(group)} 
                              title="Sửa"
                              leadingIcon="pencil"
                            />
                            <Menu.Item 
                              onPress={() => handleDelete(group.id)} 
                              title="Xóa"
                              leadingIcon="delete"
                            />
                          </Menu>
                        </View>
                      </View>
                      
                      {group.description && (
                        <View style={styles.groupDetails}>
                          <View style={styles.detailRow}>
                            <Icon name="text" size={14} color="#666" />
                            <Text variant="bodySmall" style={styles.detailText}>
                              {group.description}
                            </Text>
                          </View>
                        </View>
                      )}
                      
                      <View style={styles.groupStats}>
                        <View style={styles.statChip}>
                          <Icon name="calendar-plus" size={16} color="#FF9800" />
                          <Text variant="bodySmall" style={styles.statText}>
                            {new Date(group.created_at).toLocaleDateString('vi-VN')}
                          </Text>
                        </View>
                        <View style={styles.statChip}>
                          <Icon name="tag" size={16} color="#4CAF50" />
                          <Text variant="bodySmall" style={styles.statText}>
                            {group.code}
                          </Text>
                        </View>
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
          
          {filteredMaterialGroups.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="folder-multiple" size={64} color="#ccc" />
              <Text variant="bodyLarge" style={styles.emptyText}>
                {searchQuery ? 'Không tìm thấy nhóm vật tư phù hợp' : 'Chưa có nhóm vật tư nào'}
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
      <Portal>
        <Modal visible={showModal} onDismiss={() => setShowModal(false)} contentContainerStyle={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Card>
              <Card.Content>
                <Text variant="titleLarge" style={styles.modalTitle}>
                  {editingMaterialGroup ? 'Sửa nhóm vật tư' : 'Thêm nhóm vật tư mới'}
                </Text>
                
                <TextInput
                  label="Mã nhóm *"
                  value={formData.code}
                  onChangeText={(text) => setFormData({...formData, code: text.toUpperCase()})}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="tag" />}
                  placeholder="VD: RAW_MATERIAL, CHEMICAL, TOOL"
                  autoCapitalize="characters"
                />
                
                <TextInput
                  label="Tên nhóm vật tư *"
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="folder-multiple" />}
                  placeholder="VD: Nguyên liệu thô, Hóa chất, Dụng cụ"
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
                  placeholder="Mô tả chi tiết về nhóm vật tư..."
                />
              </Card.Content>
              
              <Card.Actions>
                <Button onPress={() => setShowModal(false)}>Hủy</Button>
                <Button mode="contained" onPress={handleSave} loading={loading}>
                  {editingMaterialGroup ? 'Cập nhật' : 'Tạo mới'}
                </Button>
              </Card.Actions>
            </Card>
          </ScrollView>
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
    backgroundColor: '#4CAF50',
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
  groupsContainer: {
    flex: 1,
  },
  groupCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  groupCardContent: {
    padding: 16,
  },
  groupCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
    marginRight: 12,
  },
  groupActions: {
    alignItems: 'flex-end',
  },
  groupName: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
    fontSize: 16,
  },
  groupCode: {
    color: '#4CAF50',
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  groupDetails: {
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
  groupStats: {
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