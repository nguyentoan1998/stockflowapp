import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput as RNTextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function ReturnErrorScreen() {
  const navigation = useNavigation();
  const { api } = useApi();

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, this_week, this_month, last_month
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  const [warehouses, setWarehouses] = useState([]);

  useFocusEffect(
    useCallback(() => {
      fetchReturns();
      fetchWarehouses();
    }, [])
  );

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/inventory_transactions?include={"inventory_transaction_logs":true}&orderBy=[{"transaction_date":"desc"}]', {
        params: {
          reference_type: 'purchase_return',
          transaction_type: 'warehouse_output',
        },
      });
      const data = response.data;
      if (Array.isArray(data)) {
        setReturns(data);
      } else if (data && Array.isArray(data.data)) {
        setReturns(data.data);
      } else {
        setReturns([]);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
      Alert.error('Lỗi', 'Không thể tải danh sách trả hàng');
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/api/warehouses');
      const data = response.data;
      const warehousesArray = Array.isArray(data) ? data : (data?.data || []);
      setWarehouses(warehousesArray);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      setWarehouses([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReturns();
    setRefreshing(false);
  };

  const handleCreate = () => {
    navigation.navigate('ReturnErrorForm');
  };

  const handleView = (returnItem) => {
    // TODO: Navigate to detail screen when ready
    navigation.navigate('ReturnErrorForm', { returnItem });
  };

  const handleEdit = (returnItem) => {
    navigation.navigate('ReturnErrorForm', { returnItem });
  };

  const handleDelete = (returnItem) => {
    Alert.confirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa phiếu trả hàng "${returnItem.code}" không?`,
      async () => {
        try {
          await api.delete(`/api/inventory_transactions/${returnItem.id}`);
          Alert.success('Thành công!', 'Phiếu trả hàng đã được xóa');
          await fetchReturns();
        } catch (error) {
          console.error('Error deleting return:', error);
          Alert.error('Lỗi', 'Không thể xóa phiếu trả hàng');
        }
      }
    );
  };

  // Status update removed - inventory_transactions doesn't have status field

  const getFilteredReturns = () => {
    return (returns || []).filter(item => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (
        item.code?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );

      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all' && item.transaction_date) {
        const itemDate = new Date(item.transaction_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case 'today':
            matchesDate = itemDate >= today;
            break;
          case 'this_week':
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            matchesDate = itemDate >= weekAgo;
            break;
          case 'this_month':
            matchesDate = itemDate.getMonth() === today.getMonth() && 
                         itemDate.getFullYear() === today.getFullYear();
            break;
          case 'last_month':
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            matchesDate = itemDate >= lastMonth && itemDate <= lastMonthEnd;
            break;
        }
      }

      return matchesSearch && matchesDate;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Note: inventory_transactions doesn't have status field
  // All returns are considered completed when created

  const renderReturnCard = ({ item }) => {
    const warehousesArray = Array.isArray(warehouses) ? warehouses : [];
    const warehouse = warehousesArray.find((w) => w.id === item.source_warehouse_id);
    const itemCount = item.inventory_transaction_logs?.length || 0;
    
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleView(item)}
        style={styles.cardContainer}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F9FAFB']}
          style={styles.card}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardCode}>{item.code}</Text>
              <Text style={styles.cardDate}>{formatDate(item.transaction_date)}</Text>
            </View>
            <View style={styles.cardActions}>
              {/* View Button */}
              <TouchableOpacity
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleView(item);
                }}
                style={styles.iconButton}
                activeOpacity={0.6}
              >
                <Ionicons name="eye-outline" size={20} color="#10B981" />
              </TouchableOpacity>

              {/* Edit Button */}
              <TouchableOpacity
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleEdit(item);
                }}
                style={styles.iconButton}
                activeOpacity={0.6}
              >
                <Ionicons name="pencil" size={20} color="#3B82F6" />
              </TouchableOpacity>

              {/* Delete Button */}
              <TouchableOpacity
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleDelete(item);
                }}
                style={styles.iconButton}
                activeOpacity={0.6}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Warehouse */}
          <View style={styles.cardRow}>
            <Ionicons name="home" size={16} color="#6B7280" />
            <Text style={styles.cardLabel}>Kho xuất:</Text>
            <Text style={styles.cardValue}>{warehouse?.name || 'N/A'}</Text>
          </View>

          {/* Item Count */}
          <View style={styles.cardRow}>
            <Ionicons name="cube" size={16} color="#6B7280" />
            <Text style={styles.cardLabel}>Số sản phẩm:</Text>
            <Text style={styles.cardValue}>{itemCount}</Text>
          </View>

          {/* Description */}
          {item.description && (
            <View style={styles.cardNotes}>
              <Text style={styles.cardNotesText} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          )}

          {/* No status - returns are completed when created */}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="return-down-back-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyText}>Chưa có phiếu trả hàng</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleCreate}>
        <Text style={styles.emptyButtonText}>Tạo phiếu trả hàng đầu tiên</Text>
      </TouchableOpacity>
    </View>
  );

  const filteredReturns = getFilteredReturns();

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <RNTextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo mã phiếu, ghi chú..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Button */}
      <TouchableOpacity 
        style={styles.filterButtonContainer}
        onPress={() => setFilterModalVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="filter" size={20} color="#EF4444" />
        <Text style={styles.filterButtonLabel}>Lọc theo thời gian</Text>
        {dateFilter !== 'all' && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>1</Text>
          </View>
        )}
        <Ionicons name="chevron-down" size={20} color="#6B7280" style={styles.filterChevron} />
      </TouchableOpacity>

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{filteredReturns.length}</Text>
          <Text style={styles.statLabel}>Phiếu trả hàng</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredReturns}
        renderItem={renderReturnCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyList}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleCreate} activeOpacity={0.8}>
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lọc theo thời gian</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Filter Options */}
            <View style={styles.modalContent}>
              <FilterOption
                label="Tất cả"
                description="Hiển thị tất cả phiếu trả hàng"
                icon="calendar-outline"
                selected={dateFilter === 'all'}
                onPress={() => {
                  setDateFilter('all');
                  setFilterModalVisible(false);
                }}
              />

              <FilterOption
                label="Hôm nay"
                description="Phiếu trả hàng trong ngày hôm nay"
                icon="today-outline"
                selected={dateFilter === 'today'}
                onPress={() => {
                  setDateFilter('today');
                  setFilterModalVisible(false);
                }}
              />

              <FilterOption
                label="Tuần này"
                description="Phiếu trả hàng trong 7 ngày qua"
                icon="time-outline"
                selected={dateFilter === 'this_week'}
                onPress={() => {
                  setDateFilter('this_week');
                  setFilterModalVisible(false);
                }}
              />

              <FilterOption
                label="Tháng này"
                description="Phiếu trả hàng trong tháng hiện tại"
                icon="calendar"
                selected={dateFilter === 'this_month'}
                onPress={() => {
                  setDateFilter('this_month');
                  setFilterModalVisible(false);
                }}
              />

              <FilterOption
                label="Tháng trước"
                description="Phiếu trả hàng trong tháng trước"
                icon="calendar-outline"
                selected={dateFilter === 'last_month'}
                onPress={() => {
                  setDateFilter('last_month');
                  setFilterModalVisible(false);
                }}
              />
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalResetButton}
                onPress={() => {
                  setDateFilter('all');
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.modalResetButtonText}>Đặt lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={alertConfig.onClose}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
      />
    </View>
  );
}

// Filter Option Component
const FilterOption = ({ label, description, icon, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.filterOption, selected && styles.filterOptionSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.filterOptionLeft}>
      <View style={[styles.filterOptionIcon, selected && styles.filterOptionIconSelected]}>
        <Ionicons name={icon} size={24} color={selected ? '#EF4444' : '#6B7280'} />
      </View>
      <View style={styles.filterOptionText}>
        <Text style={[styles.filterOptionLabel, selected && styles.filterOptionLabelSelected]}>
          {label}
        </Text>
        <Text style={styles.filterOptionDescription}>{description}</Text>
      </View>
    </View>
    {selected && (
      <Ionicons name="checkmark-circle" size={24} color="#EF4444" />
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  cardNotes: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cardNotesText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cardActionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cardActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  cardActionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  approveButtonText: {
    color: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  completeButtonText: {
    color: '#10B981',
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 6,
    backgroundColor: '#D1FAE5',
    padding: 8,
    borderRadius: 6,
  },
  completedInfoText: {
    fontSize: 12,
    color: '#10B981',
    flex: 1,
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
    color: '#6B7280',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Filter Button Styles
  filterButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonLabel: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  filterBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  filterChevron: {
    marginLeft: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionSelected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  filterOptionIconSelected: {
    backgroundColor: '#FFFFFF',
  },
  filterOptionText: {
    flex: 1,
  },
  filterOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  filterOptionLabelSelected: {
    color: '#EF4444',
  },
  filterOptionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalResetButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalResetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});
