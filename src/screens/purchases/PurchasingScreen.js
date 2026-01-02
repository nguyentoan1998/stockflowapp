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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function PurchasingScreen() {
  const navigation = useNavigation();
  const { api } = useApi();

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, draft, pending, approved, completed

  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useFocusEffect(
    useCallback(() => {
      fetchPurchases();
    }, [])
  );

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/purchase_receives?include={"suppliers":{"select":{"name":true,"code":true}},"warehouses":{"select":{"name":true}}}&orderBy=[{"receive_date":"desc"}]');
      
      let purchasesData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);
      
      setPurchases(purchasesData);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      Alert.error('Lỗi', 'Không thể tải danh sách mua hàng');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPurchases();
    setRefreshing(false);
  };

  const handleCreate = () => {
    navigation.navigate('PurchasingForm', { mode: 'create' });
  };

  const handleView = (purchase) => {
    navigation.navigate('PurchasingDetail', { receiveId: purchase.id });
  };

  const handleEdit = (purchase) => {
    if (purchase.status !== 'draft') {
      Alert.error('Không thể sửa', 'Chỉ có thể sửa phiếu mua hàng ở trạng thái Nháp');
      return;
    }
    navigation.navigate('PurchasingForm', { mode: 'edit', receiveId: purchase.id });
  };

  const handleDelete = (purchase) => {
    if (purchase.status !== 'draft') {
      Alert.error('Không thể xóa', 'Chỉ có thể xóa phiếu mua hàng ở trạng thái Nháp');
      return;
    }

    Alert.confirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa phiếu mua hàng "${purchase.code}" không?`,
      async () => {
        try {
          await api.delete(`/api/purchase_receives/${purchase.id}`);
          Alert.success('Thành công!', 'Phiếu mua hàng đã được xóa');
          await fetchPurchases();
        } catch (error) {
          console.error('Error deleting purchase:', error);
          Alert.error('Lỗi', 'Không thể xóa phiếu mua hàng');
        }
      }
    );
  };

  const getFilteredPurchases = () => {
    let filtered = purchases.filter(purchase => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (
        purchase.code?.toLowerCase().includes(searchLower) ||
        purchase.suppliers?.name?.toLowerCase().includes(searchLower) ||
        purchase.warehouses?.name?.toLowerCase().includes(searchLower) ||
        purchase.notes?.toLowerCase().includes(searchLower)
      );

      const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return filtered;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Nháp', color: '#6B7280', bgColor: '#F3F4F6' },
      pending: { label: 'Chờ duyệt', color: '#F59E0B', bgColor: '#FEF3C7' },
      approved: { label: 'Đã duyệt', color: '#3B82F6', bgColor: '#DBEAFE' },
      completed: { label: 'Hoàn thành', color: '#10B981', bgColor: '#D1FAE5' },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
        <Text style={[styles.statusBadgeText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const renderPurchaseCard = ({ item: purchase }) => (
    <View style={styles.card}>
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.cardGradient}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardCode}>{purchase.code}</Text>
            {getStatusBadge(purchase.status)}
          </View>
          <View style={styles.cardActions}>
            {/* View Button - Always show */}
            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
                handleView(purchase);
              }}
              style={styles.iconButton}
              activeOpacity={0.6}
            >
              <Ionicons name="eye-outline" size={20} color="#10B981" />
            </TouchableOpacity>

            {/* Edit Button - Only for draft */}
            {purchase.status === 'draft' && (
              <TouchableOpacity
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleEdit(purchase);
                }}
                style={styles.iconButton}
                activeOpacity={0.6}
              >
                <Ionicons name="pencil" size={20} color="#3B82F6" />
              </TouchableOpacity>
            )}

            {/* Delete Button - Only for draft */}
            {purchase.status === 'draft' && (
              <TouchableOpacity
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleDelete(purchase);
                }}
                style={styles.iconButton}
                activeOpacity={0.6}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Supplier Info */}
        <View style={styles.cardRow}>
          <Ionicons name="business" size={16} color="#6B7280" />
          <Text style={styles.cardLabel}>Nhà cung cấp:</Text>
          <Text style={styles.cardValue}>{purchase.suppliers?.name || 'N/A'}</Text>
        </View>

        {/* Warehouse */}
        <View style={styles.cardRow}>
          <Ionicons name="home" size={16} color="#6B7280" />
          <Text style={styles.cardLabel}>Kho nhận:</Text>
          <Text style={styles.cardValue}>{purchase.warehouses?.name || 'N/A'}</Text>
        </View>

        {/* Receive Date */}
        <View style={styles.cardRow}>
          <Ionicons name="calendar" size={16} color="#6B7280" />
          <Text style={styles.cardLabel}>Ngày nhận:</Text>
          <Text style={styles.cardValue}>{formatDate(purchase.receive_date)}</Text>
        </View>

        {/* Inventory Status */}
        <View style={styles.cardRow}>
          <Ionicons 
            name={purchase.isinventory ? "checkmark-circle" : "time"} 
            size={16} 
            color={purchase.isinventory ? "#10B981" : "#F59E0B"} 
          />
          <Text style={styles.cardLabel}>Nhập kho:</Text>
          <Text style={[styles.cardValue, { color: purchase.isinventory ? '#10B981' : '#F59E0B' }]}>
            {purchase.isinventory ? 'Đã nhập' : 'Chưa nhập'}
          </Text>
        </View>

        {/* Total Amount */}
        <View style={[styles.cardRow, styles.cardTotalRow]}>
          <Ionicons name="cash" size={16} color="#10B981" />
          <Text style={styles.cardLabel}>Tổng tiền:</Text>
          <Text style={styles.cardTotalAmount}>{formatCurrency(purchase.total_amount)}</Text>
        </View>

        {/* Notes */}
        {purchase.notes && (
          <View style={styles.cardNotes}>
            <Text style={styles.cardNotesText} numberOfLines={2}>
              {purchase.notes}
            </Text>
          </View>
        )}

        {/* Status Action Buttons */}
        {purchase.status === 'draft' && (
          <View style={styles.cardActionButtons}>
            <TouchableOpacity
              style={[styles.cardActionButton, styles.pendingButton]}
              onPress={(e) => {
                e?.stopPropagation?.();
                handleUpdateStatus(purchase, 'pending');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="paper-plane-outline" size={16} color="#F59E0B" />
              <Text style={[styles.cardActionButtonText, styles.pendingButtonText]}>
                Gửi duyệt
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {purchase.status === 'pending' && (
          <View style={styles.cardActionButtons}>
            <TouchableOpacity
              style={[styles.cardActionButton, styles.approveButton]}
              onPress={(e) => {
                e?.stopPropagation?.();
                handleUpdateStatus(purchase, 'approved');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#3B82F6" />
              <Text style={[styles.cardActionButtonText, styles.approveButtonText]}>
                Duyệt
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cardActionButton, styles.draftButton]}
              onPress={(e) => {
                e?.stopPropagation?.();
                handleUpdateStatus(purchase, 'draft');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close-outline" size={16} color="#EF4444" />
              <Text style={[styles.cardActionButtonText, styles.draftButtonText]}>
                Từ chối
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {purchase.status === 'approved' && (
          <View style={styles.cardActionButtons}>
            <TouchableOpacity
              style={[styles.cardActionButton, styles.completeButton]}
              onPress={(e) => {
                e?.stopPropagation?.();
                handleUpdateStatus(purchase, 'completed');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-done-outline" size={16} color="#10B981" />
              <Text style={[styles.cardActionButtonText, styles.completeButtonText]}>
                Hoàn thành nhận hàng
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Completed status - no action buttons, only info */}
        {purchase.status === 'completed' && (
          <View style={styles.completedSection}>
            <View style={styles.completedInfo}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.completedInfoText}>
                Đã hoàn thành - Hàng đã được nhập kho
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.cardActionButton, styles.revertButton]}
              onPress={() => {
                Alert.confirm(
                  'Chuyển về nháp',
                  'Bạn có chắc muốn chuyển phiếu này về trạng thái nháp? Số lượng trong kho sẽ được hoàn tác.',
                  () => handleUpdateStatus(purchase, 'pending')
                );
              }}
            >
              <Ionicons name="arrow-undo" size={16} color="#6B7280" />
              <Text style={[styles.cardActionButtonText, styles.revertButtonText]}>
                Chuyển về nháp
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyText}>Chưa có phiếu mua hàng</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleCreate}>
        <Text style={styles.emptyButtonText}>Tạo phiếu mua hàng đầu tiên</Text>
      </TouchableOpacity>
    </View>
  );

  const handleUpdateStatus = (purchase, newStatus) => {
    const statusLabels = {
      draft: 'chuyển về nháp',
      pending: 'gửi duyệt',
      approved: 'duyệt',
      completed: 'hoàn thành',
    };

    const statusMessages = {
      draft: 'chuyển về nháp',
      pending: 'gửi duyệt',
      approved: 'duyệt',
      completed: 'hoàn thành và nhập kho',
    };

    Alert.confirm(
      'Cập nhật trạng thái',
      `Bạn có chắc chắn muốn ${statusLabels[newStatus]} phiếu mua hàng "${purchase.code}"?`,
      async () => {
        try {
          await api.put(`/api/purchase_receives/${purchase.id}`, {
            ...purchase,
            status: newStatus,
            // Don't set isinventory - let server manage it automatically
          });
          Alert.success('Thành công!', `Phiếu mua hàng đã được ${statusMessages[newStatus]}`);
          await fetchPurchases();
        } catch (error) {
          console.error('Error updating status:', error);
          Alert.error('Lỗi', 'Không thể cập nhật trạng thái');
        }
      }
    );
  };

  const StatusFilterButton = ({ status, label }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        statusFilter === status && styles.filterButtonActive,
      ]}
      onPress={() => setStatusFilter(status)}
    >
      <Text
        style={[
          styles.filterButtonText,
          statusFilter === status && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const filteredPurchases = getFilteredPurchases();

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <RNTextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo mã phiếu, NCC, kho..."
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

      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        <StatusFilterButton status="all" label="Tất cả" />
        <StatusFilterButton status="draft" label="Nháp" />
        <StatusFilterButton status="pending" label="Chờ duyệt" />
        <StatusFilterButton status="approved" label="Đã duyệt" />
        <StatusFilterButton status="completed" label="Hoàn thành" />
      </View>

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{filteredPurchases.length}</Text>
          <Text style={styles.statLabel}>Phiếu mua hàng</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {formatCurrency(
              filteredPurchases.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0)
            )}
          </Text>
          <Text style={styles.statLabel}>Tổng giá trị</Text>
        </View>
      </View>

      {/* Purchases List */}
      <FlatList
        data={filteredPurchases}
        renderItem={renderPurchaseCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
          />
        }
      />

      {/* FAB - Create Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreate}>
        <LinearGradient
          colors={['#66BB6A', '#4CAF50']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        onClose={alertConfig.onClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardGradient: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  cardCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  cardTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cardTotalAmount: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
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
  cardActionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  cardActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  pendingButton: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  pendingButtonText: {
    color: '#F59E0B',
  },
  approveButton: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  approveButtonText: {
    color: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  completeButtonText: {
    color: '#10B981',
  },
  draftButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  draftButtonText: {
    color: '#EF4444',
  },
  cardActionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  completedSection: {
    marginTop: 12,
    gap: 8,
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  revertButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  revertButtonText: {
    color: '#6B7280',
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
    backgroundColor: '#4CAF50',
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
    shadowColor: '#4CAF50',
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
});
