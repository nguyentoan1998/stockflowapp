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
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function WarehouseInputScreen() {
  const navigation = useNavigation();
  const { api } = useApi();

  const [inputs, setInputs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useFocusEffect(
    useCallback(() => {
      fetchInputs();
    }, [])
  );

  const fetchInputs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/inventory_transactions?include={"inventory_transaction_logs":true}');
      
      let inputsData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);
      
      // Filter để chỉ lấy warehouse_input transactions
      inputsData = inputsData.filter(item => item.transaction_type === 'warehouse_input');
      
      setInputs(inputsData);
    } catch (error) {
      console.error('Error fetching inputs:', error);
      Alert.error('Lỗi', 'Không thể tải danh sách phiếu nhập');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInputs();
    setRefreshing(false);
  };

  const handleCreate = () => {
    navigation.navigate('WarehouseInputForm', { mode: 'create' });
  };

  const handleEdit = (input) => {
    navigation.navigate('WarehouseInputForm', { mode: 'edit', inputId: input.id });
  };

  const handleView = (input) => {
    navigation.navigate('WarehouseInputDetail', { inputId: input.id });
  };

  const handleDelete = (input) => {
    Alert.confirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa phiếu "${input.code}" không?`,
      async () => {
        try {
          await api.delete(`/api/inventory_transactions/${input.id}`);
          Alert.success('Thành công!', 'Phiếu nhập đã được xóa');
          await fetchInputs();
        } catch (error) {
          console.error('Error deleting input:', error);
          Alert.error('Lỗi', 'Không thể xóa phiếu nhập');
        }
      }
    );
  };

  const getFilteredInputs = () => {
    let filtered = inputs.filter(input => {
      const searchLower = searchQuery.toLowerCase();
      return (
        input.code?.toLowerCase().includes(searchLower) ||
        input.description?.toLowerCase().includes(searchLower)
      );
    });

    // Sắp xếp theo mã phiếu A-Z hoặc Z-A
    filtered.sort((a, b) => {
      const codeA = a.code?.toLowerCase() || '';
      const codeB = b.code?.toLowerCase() || '';
      
      if (sortOrder === 'asc') {
        return codeA.localeCompare(codeB);
      } else {
        return codeB.localeCompare(codeA);
      }
    });

    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return '#FFA726';
      case 'completed':
        return '#66BB6A';
      case 'cancelled':
        return '#EF5350';
      default:
        return '#90A4AE';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return 'Nháp';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Hủy';
      default:
        return 'Không xác định';
    }
  };

  const getTotalAmount = (items) => {
    return (items || []).reduce((sum, item) => {
      const qty = parseFloat(item.quantity || 0);
      const cost = parseFloat(item.cost || 0);
      return sum + (qty * cost);
    }, 0);
  };

  const renderInputItem = ({ item: input }) => (
    <TouchableOpacity
      style={styles.inputCard}
      onPress={() => handleView(input)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.codeInfo}>
          <Text style={styles.code}>{input.code}</Text>
          <Text style={styles.date}>
            {new Date(input.transaction_date).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="package" size={16} color="#666" />
          <Text style={styles.infoLabel}>Số SP:</Text>
          <Text style={styles.infoValue}>
            {input.inventory_transaction_logs?.length || 0}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="currency-usd" size={16} color="#1976d2" />
          <Text style={styles.infoLabel}>Tổng tiền:</Text>
          <Text style={[styles.infoValue, { color: '#1976d2', fontWeight: '700' }]}>
            {getTotalAmount(input.inventory_transaction_logs).toLocaleString('vi-VN')}₫
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleView(input)}
        >
          <MaterialCommunityIcons name="eye" size={16} color="#1976d2" />
          <Text style={styles.actionText}>Xem</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEdit(input)}
        >
          <MaterialCommunityIcons name="pencil" size={16} color="#4CAF50" />
          <Text style={styles.actionText}>Sửa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(input)}
        >
          <MaterialCommunityIcons name="trash-can" size={16} color="#EF5350" />
          <Text style={styles.actionText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const filteredInputs = getFilteredInputs();

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />

      {/* Sort Buttons */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterBtn, sortOrder === 'asc' && styles.filterBtnActive]}
            onPress={() => setSortOrder('asc')}
          >
            <Text style={[styles.filterBtnText, sortOrder === 'asc' && styles.filterBtnTextActive]}>
              A - Z
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, sortOrder === 'desc' && styles.filterBtnActive]}
            onPress={() => setSortOrder('desc')}
          >
            <Text style={[styles.filterBtnText, sortOrder === 'desc' && styles.filterBtnTextActive]}>
              Z - A
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <RNTextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm phiếu nhập..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredInputs}
        renderItem={renderInputItem}
        keyExtractor={item => item.id?.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="inbox" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có phiếu nhập nào'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleCreate}>
        <LinearGradient colors={['#1976d2', '#1565c0']} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },

  filterSection: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 8, backgroundColor: '#fff' },
  filterBtnActive: { backgroundColor: '#1976d2', borderColor: '#1976d2' },
  filterBtnText: { fontSize: 12, color: '#666', fontWeight: '500' },
  filterBtnTextActive: { color: '#fff' },

  searchContainer: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: '#333' },

  listContent: { paddingHorizontal: 12, paddingVertical: 12 },
  inputCard: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 12, overflow: 'hidden', elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  codeInfo: { flex: 1 },
  code: { fontSize: 14, fontWeight: '700', color: '#333' },
  date: { fontSize: 11, color: '#999', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 11, color: '#fff', fontWeight: '600' },

  cardBody: { paddingHorizontal: 12, paddingVertical: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoLabel: { fontSize: 11, color: '#666', marginLeft: 6, flex: 0.6 },
  infoValue: { fontSize: 11, color: '#333', fontWeight: '500', flex: 1, textAlign: 'right' },

  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee' },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  actionText: { fontSize: 12, color: '#1976d2', marginLeft: 6, fontWeight: '500' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#999' },

  fab: { position: 'absolute', bottom: 20, right: 20, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  fabGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
});
