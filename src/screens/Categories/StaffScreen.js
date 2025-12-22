import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';
import ListCard from '../../components/ui/ListCard';

export default function StaffScreen() {
  const navigation = useNavigation();
  const { api } = useApi();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'Chính thức', 'Học việc', 'Nghỉ việc'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useFocusEffect(
    useCallback(() => {
      fetchStaff();
    }, [])
  );

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/staff');
      // Handle both array and object responses
      let staffData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.staff || response.data?.data || []);
      
      // Load position and team names from IDs
      const [positionsRes, teamsRes] = await Promise.all([
        api.get('/api/positions').catch(() => ({ data: [] })),
        api.get('/api/teams').catch(() => ({ data: [] }))
      ]);
      
      // Handle different response formats
      const positionsData = Array.isArray(positionsRes.data) 
        ? positionsRes.data 
        : (positionsRes.data?.positions || positionsRes.data?.data || []);
      const teamsData = Array.isArray(teamsRes.data) 
        ? teamsRes.data 
        : (teamsRes.data?.teams || teamsRes.data?.data || []);
      
      // Map position and team names
      staffData = staffData.map(staff => {
        const position = staff.position_id 
          ? positionsData.find(p => p.id === staff.position_id)
          : null;
        
        const team = staff.team_id
          ? teamsData.find(t => t.id === staff.team_id)
          : null;
        
        return {
          ...staff,
          position: position || staff.position || { name: 'Chưa có chức vụ' },
          team: team || staff.team || { name: 'Chưa có team' }
        };
      });
      
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff:', error);
      Alert.error('Lỗi kết nối', 'Không thể tải danh sách nhân viên');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStaff();
    setRefreshing(false);
  };

  const handleView = (staffMember) => {
    navigation.navigate('StaffDetail', { staffId: staffMember.id });
  };

  const handleEdit = (staffMember) => {
    navigation.navigate('StaffForm', { mode: 'edit', staff: staffMember });
  };

  const handleDelete = (staffId) => {
    const staffMember = staff.find(s => s.id === staffId);
    Alert.confirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa nhân viên "${staffMember?.full_name}"?\n\nHành động này không thể hoàn tác!`,
      async () => {
        // Optimistic delete
        const staffToDelete = staff.find(s => s.id === staffId);
        setStaff(staff.filter(s => s.id !== staffId));

        try {
          await api.delete(`/api/staff/${staffId}`);
          Alert.success(
            'Xóa thành công!',
            `Nhân viên "${staffToDelete?.full_name}" đã được xóa khỏi hệ thống.`
          );
        } catch (error) {
          // Rollback on error
          if (staffToDelete) {
            setStaff(prevStaff => [...prevStaff, staffToDelete]);
          }
          Alert.error('Lỗi xóa nhân viên', 'Không thể xóa nhân viên. Vui lòng thử lại.');
        }
      }
    );
  };

  const handleAdd = () => {
    navigation.navigate('StaffForm', { mode: 'add' });
  };

  const getStatusConfig = (status) => {
    // Normalize status - handle both old format (active/intern/inactive) and new format (Chính thức/Học việc/Nghỉ việc)
    const normalizedStatus = status?.toLowerCase();
    
    const configs = {
      'active': { color: '#4CAF50', bg: '#E8F5E9', text: 'Chính thức', icon: 'check-circle', value: 'Chính thức' },
      'chính thức': { color: '#4CAF50', bg: '#E8F5E9', text: 'Chính thức', icon: 'check-circle', value: 'Chính thức' },
      'intern': { color: '#2196F3', bg: '#E3F2FD', text: 'Học việc', icon: 'school', value: 'Học việc' },
      'học việc': { color: '#2196F3', bg: '#E3F2FD', text: 'Học việc', icon: 'school', value: 'Học việc' },
      'inactive': { color: '#F44336', bg: '#FFEBEE', text: 'Nghỉ việc', icon: 'close-circle', value: 'Nghỉ việc' },
      'nghỉ việc': { color: '#F44336', bg: '#FFEBEE', text: 'Nghỉ việc', icon: 'close-circle', value: 'Nghỉ việc' },
    };
    
    return configs[normalizedStatus] || configs['active'];
  };

  // Filter and sort staff
  const staffArray = Array.isArray(staff) ? staff : [];
  const filteredStaff = staffArray
    .filter(member => {
      const matchesSearch = member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           member.phone?.includes(searchQuery);
      
      // Normalize status for filtering - handle both formats
      const normalizedMemberStatus = member.statuss?.toLowerCase();
      const normalizedFilterStatus = filterStatus?.toLowerCase();
      
      const matchesStatus = filterStatus === 'all' || 
                           normalizedMemberStatus === normalizedFilterStatus ||
                           (normalizedFilterStatus === 'chính thức' && normalizedMemberStatus === 'active') ||
                           (normalizedFilterStatus === 'học việc' && normalizedMemberStatus === 'intern') ||
                           (normalizedFilterStatus === 'nghỉ việc' && normalizedMemberStatus === 'inactive');
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const nameA = (a.full_name || a.name || '').toLowerCase();
      const nameB = (b.full_name || b.name || '').toLowerCase();
      
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB, 'vi');
      } else {
        return nameB.localeCompare(nameA, 'vi');
      }
    });

  const renderStaffItem = ({ item: staffMember }) => {
    const statusInfo = getStatusConfig(staffMember.statuss);

    return (
      <ListCard
        title={staffMember.full_name || staffMember.name}
        subtitle={staffMember.employee_code ? `#${staffMember.employee_code}` : null}
        imageUrl={staffMember.avatar_url || staffMember.image_url}
        imageIcon="account"
        badge={{
          text: statusInfo.text,
          color: statusInfo.color,
          bgColor: statusInfo.bg,
          icon: statusInfo.icon,
        }}
        details={[
          {
            icon: 'briefcase',
            text: staffMember.position?.name || staffMember.position?.code || (staffMember.position_id ? `ID: ${staffMember.position_id}` : 'Chưa có chức vụ'),
            color: '#666',
          },
          {
            icon: 'account-group',
            text: staffMember.team?.name || staffMember.team?.code || (staffMember.team_id ? `ID: ${staffMember.team_id}` : 'Chưa có team'),
            color: '#666',
          },
          staffMember.phone && {
            icon: 'phone',
            text: staffMember.phone,
            color: '#666',
          },
          staffMember.email && {
            icon: 'email',
            text: staffMember.email,
            color: '#666',
          },
        ].filter(Boolean)}
        actions={[
          {
            label: 'Xem',
            icon: 'eye',
            color: '#1976d2',
            onPress: () => handleView(staffMember),
          },
          {
            label: 'Sửa',
            icon: 'pencil',
            color: '#4CAF50',
            onPress: () => handleEdit(staffMember),
          },
          {
            label: 'Xóa',
            icon: 'delete',
            color: '#F44336',
            onPress: () => handleDelete(staffMember.id),
          },
        ]}
        onPress={() => handleView(staffMember)}
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar with Sort */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm nhân viên..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Sort Button */}
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          <Ionicons 
            name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
            size={20} 
            color="#1976d2" 
          />
          <Text style={styles.sortText}>A-Z</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterBtn, filterStatus === 'all' && styles.filterBtnActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>
            Tất cả ({staffArray.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filterStatus === 'Chính thức' && styles.filterBtnActive]}
          onPress={() => setFilterStatus('Chính thức')}
        >
          <Text style={[styles.filterText, filterStatus === 'Chính thức' && styles.filterTextActive]}>
            Chính thức ({staffArray.filter(s => {
              const st = s.statuss?.toLowerCase();
              return st === 'chính thức' || st === 'active';
            }).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filterStatus === 'Học việc' && styles.filterBtnActive]}
          onPress={() => setFilterStatus('Học việc')}
        >
          <Text style={[styles.filterText, filterStatus === 'Học việc' && styles.filterTextActive]}>
            Học việc ({staffArray.filter(s => {
              const st = s.statuss?.toLowerCase();
              return st === 'học việc' || st === 'intern';
            }).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filterStatus === 'Nghỉ việc' && styles.filterBtnActive]}
          onPress={() => setFilterStatus('Nghỉ việc')}
        >
          <Text style={[styles.filterText, filterStatus === 'Nghỉ việc' && styles.filterTextActive]}>
            Nghỉ việc ({staffArray.filter(s => {
              const st = s.statuss?.toLowerCase();
              return st === 'nghỉ việc' || st === 'inactive';
            }).length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>
        {searchQuery || filterStatus !== 'all' ? 'Không tìm thấy nhân viên' : 'Chưa có nhân viên nào'}
      </Text>
      {!searchQuery && filterStatus === 'all' && (
        <TouchableOpacity style={styles.emptyButton} onPress={handleAdd}>
          <Text style={styles.emptyButtonText}>Thêm nhân viên đầu tiên</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Đang tải danh sách nhân viên...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />

      {/* List */}
      <FlatList
        data={filteredStaff}
        renderItem={renderStaffItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={filteredStaff.length === 0 ? styles.flatListEmpty : styles.flatList}
      />

      {/* FAB Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <LinearGradient
          colors={['#1976d2', '#1565c0']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  sortText: {
    fontSize: 13,
    color: '#1976d2',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterBtnActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  flatList: {
    paddingBottom: 80,
    paddingTop: 8,
  },
  flatListEmpty: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
  },
  viewBtn: {
    backgroundColor: 'transparent',
  },
  editBtn: {
    backgroundColor: 'transparent',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
