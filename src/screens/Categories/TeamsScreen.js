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
  DataTable,
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

export default function TeamsScreen() {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingTeam, setEditingTeam] = useState(null);
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
  });

  const { api } = useApi();
  const { user } = useAuth();

  useEffect(() => {
    loadTeams();
    
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
    filterTeams();
  }, [searchQuery, teams, filterStatus, sortOrder]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/api/teams');
      
      // Handle different possible response formats
      if (Array.isArray(response.data)) {
        setTeams(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setTeams(response.data.data);
      } else if (response.data && response.data.teams && Array.isArray(response.data.teams)) {
        setTeams(response.data.teams);
      } else {
        setTeams([]);
      }
    } catch (error) {
      Alert.error(
        'Lỗi kết nối',
        `Không thể kết nối tới server.\n\nMã lỗi: ${error.response?.status || 'Network'}\nEndpoint: /api/teams`
      );
      setTeams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterTeams = () => {
    let filtered = teams.filter(team => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || (
        team.name?.toLowerCase().includes(searchLower) ||
        team.description?.toLowerCase().includes(searchLower) ||
        team.code?.toLowerCase().includes(searchLower)
      );
      
      let matchesStatus = true;
      if (filterStatus === 'active') {
        matchesStatus = team.is_active === true || team.is_active === 1;
      } else if (filterStatus === 'inactive') {
        matchesStatus = team.is_active === false || team.is_active === 0;
      }
      
      return matchesSearch && matchesStatus;
    });
    
    filtered.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB, 'vi') : nameB.localeCompare(nameA, 'vi');
    });
    
    setFilteredTeams(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTeams();
  };

  const handleAdd = () => {
    setEditingTeam(null);
    setModalMode('create');
    setFormData({
      code: '',
      name: '',
      description: '',
    });
    setShowModal(true);
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setModalMode('edit');
    setFormData({
      code: team.code || '',
      name: team.name || '',
      description: team.description || '',
    });
    setShowModal(true);
    setMenuVisible({});
  };

  const handleDelete = (teamId) => {
    Alert.confirm(
      'Xác nhận xóa team',
      'Bạn có chắc chắn muốn xóa team này?\n\nHành động này không thể hoàn tác!',
      () => deleteTeam(teamId)
    );
    setMenuVisible({});
  };

  const deleteTeam = async (teamId) => {
    // Optimistic delete - xóa khỏi UI ngay lập tức
    const teamToDelete = teams.find(team => team.id === teamId);
    setTeams(teams.filter(team => team.id !== teamId));
    
    try {
      const response = await api.delete(`/api/teams/${teamId}`);
      if (response.data.success || response.status === 200) {
        Alert.success(
          'Xóa thành công!',
          `Team "${teamToDelete?.name || ''}" đã được xóa khỏi hệ thống.`
        );
      }
    } catch (error) {
      // Rollback on error - khôi phục team nếu API call thất bại
      if (teamToDelete) {
        setTeams(prevTeams => [...prevTeams, teamToDelete]);
        Alert.error(
          'Lỗi xóa team',
          'Không thể xóa team. Vui lòng kiểm tra kết nối và thử lại.'
        );
      }
    }
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      Alert.error(
        'Thiếu thông tin',
        'Vui lòng nhập mã team để tiếp tục.'
      );
      return;
    }
    
    if (!formData.name.trim()) {
      Alert.error(
        'Thiếu thông tin',
        'Vui lòng nhập tên team để tiếp tục.'
      );
      return;
    }

    setSaveLoading(true);
    try {
      if (editingTeam) {
        // Optimistic update - cập nhật UI ngay lập tức
        const optimisticTeam = { ...editingTeam, ...formData };
        setTeams(teams.map(team => 
          team.id === editingTeam.id ? optimisticTeam : team
        ));
        setShowModal(false);
        
        // API call in background
        const response = await api.put(`/api/teams/${editingTeam.id}`, formData);
        if (response.data.success || response.status === 200) {
          Alert.success(
            'Cập nhật thành công!',
            `Thông tin team "${formData.name}" đã được cập nhật.`
          );
        }
      } else {
        // Optimistic update - thêm team mới vào UI ngay
        const tempId = `temp_${Date.now()}`;
        const optimisticTeam = {
          id: tempId,
          ...formData,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          staff: [],
        };
        setTeams([...teams, optimisticTeam]);
        setShowModal(false);
        
        // API call in background
        const response = await api.post('/api/teams', formData);
        
        // Handle different response formats
        let newTeamData = null;
        if (response.data?.success && response.data?.data) {
          newTeamData = response.data.data;
        } else if (response.data?.id) {
          newTeamData = response.data;
        } else if (response.status === 201 || response.status === 200) {
          newTeamData = response.data;
        }
        
        if (newTeamData) {
          // Replace optimistic team with real data from server
          setTeams(prevTeams => prevTeams.map(team => 
            team.id === tempId ? { ...newTeamData, staff: [] } : team
          ));
          Alert.success(
            'Thêm mới thành công!',
            `Team "${formData.name}" đã được thêm vào hệ thống.`
          );
        } else {
          // Keep optimistic update if no proper response
          Alert.success(
            'Thêm mới thành công!',
            `Team "${formData.name}" đã được thêm vào hệ thống.`
          );
        }
      }
    } catch (error) {
      Alert.error(
        'Lỗi lưu team',
        'Có lỗi xảy ra khi lưu team. Vui lòng kiểm tra thông tin và thử lại.'
      );
      // Reload data on error
      loadTeams();
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteInModal = () => {
    if (editingTeam) {
      handleDelete(editingTeam.id);
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

  const toggleMenu = (teamId) => {
    setMenuVisible(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
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
            Cơ cấu tổ chức
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Quản lý phòng ban và team
          </Text>
        </View>
        
        <Searchbar
          placeholder="Tìm kiếm team..."
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
              Tất cả ({teams.length})
            </Chip>
            <Chip
              selected={filterStatus === 'active'}
              onPress={() => setFilterStatus('active')}
              style={[styles.filterChip, filterStatus === 'active' && styles.filterChipSelected]}
              textStyle={filterStatus === 'active' && styles.filterChipTextSelected}
              icon="check-circle"
            >
              Hoạt động ({teams.filter(t => t.is_active === true || t.is_active === 1).length})
            </Chip>
            <Chip
              selected={filterStatus === 'inactive'}
              onPress={() => setFilterStatus('inactive')}
              style={[styles.filterChip, filterStatus === 'inactive' && styles.filterChipSelected]}
              textStyle={filterStatus === 'inactive' && styles.filterChipTextSelected}
              icon="pause-circle"
            >
              Tạm dừng ({teams.filter(t => t.is_active === false || t.is_active === 0).length})
            </Chip>
          </ScrollView>
          
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <Icon 
              name={sortOrder === 'asc' ? 'sort-alphabetical-ascending' : 'sort-alphabetical-descending'} 
              size={24} 
              color="#2196F3" 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Teams Cards */}
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
          style={styles.teamsContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredTeams.map((team) => (
            <ListCard
              key={team.id}
              title={team.name}
              subtitle={`#${team.code}`}
              imageIcon="account-group"
              badge={{
                text: team.is_active ? 'Hoạt động' : 'Ngừng',
                color: team.is_active ? '#4CAF50' : '#F44336',
                bgColor: team.is_active ? '#E8F5E9' : '#FFEBEE',
                icon: team.is_active ? 'check-circle' : 'close-circle',
              }}
              statusDot={{
                color: team.is_active ? '#4CAF50' : '#F44336',
              }}
              details={[
                { 
                  icon: 'text', 
                  text: team.description || 'Chưa có mô tả',
                  color: team.description ? '#666' : '#999',
                },
                { 
                  icon: 'account-multiple', 
                  text: `${team.staff?.length || 0} nhân viên`,
                  color: '#4CAF50',
                },
              ]}
              actions={[
                {
                  label: 'Sửa',
                  icon: 'pencil',
                  color: '#4CAF50',
                  onPress: () => handleEdit(team),
                },
                {
                  label: 'Xóa',
                  icon: 'delete',
                  color: '#F44336',
                  onPress: () => handleDelete(team.id),
                },
              ]}
              onPress={() => handleEdit(team)}
            />
          ))}
          
          {filteredTeams.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="account-group-outline" size={64} color="#ccc" />
              <Text variant="bodyLarge" style={styles.emptyText}>
                {searchQuery ? 'Không tìm thấy team phù hợp' : 'Chưa có team nào'}
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
        title={modalMode === 'create' ? 'Thêm team mới' : 'Sửa team'}
        icon="account-group"
        onSubmit={handleSave}
        onDelete={modalMode === 'edit' ? handleDeleteInModal : null}
        loading={saveLoading}
      >
        <FormSection title="Thông tin team">
          <FormInput
            label="Mã team *"
            value={formData.code}
            onChangeText={(text) => setFormData({...formData, code: text.toUpperCase()})}
            icon="tag"
            placeholder="VD: HR, IT, SALES"
            autoCapitalize="characters"
          />
          
          <FormInput
            label="Tên team *"
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
            icon="account-group"
            placeholder="VD: Phòng Nhân Sự"
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
    backgroundColor: '#2196F3',
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
  teamsContainer: {
    flex: 1,
  },
  teamCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  teamCardContent: {
    padding: 16,
  },
  teamCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teamInfo: {
    flex: 1,
    marginRight: 12,
  },
  teamActions: {
    alignItems: 'flex-end',
  },
  teamName: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
    fontSize: 16,
  },
  teamCode: {
    color: '#2196F3',
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  teamDescription: {
    color: '#666',
    lineHeight: 18,
    fontSize: 13,
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  teamMetaText: {
    color: '#666',
    marginLeft: 6,
  },
  teamStats: {
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
});