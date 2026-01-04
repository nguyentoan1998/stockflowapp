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

export default function AccountsReceivableScreen() {
  const navigation = useNavigation();
  const { api } = useApi();

  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useFocusEffect(
    useCallback(() => {
      fetchReceivables();
    }, [])
  );

  const fetchReceivables = async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual API endpoint /api/customers/receivables when available
      // For now, fetch customers and mock receivable data
      const response = await api.get('/api/customers');

      let customersData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);

      // Mock receivable data - TODO: Get real data from API
      const receivablesData = customersData.map(customer => ({
        customer_id: customer.id,
        customer_name: customer.name,
        customer_code: customer.code,
        total_sales: 0,      // TODO: Calculate from sales_deliveries
        total_received: 0,   // TODO: Calculate from receivables table
      }));

      setReceivables(receivablesData);
    } catch (error) {
      console.error('Error fetching receivables:', error);
      Alert.error('Lỗi', 'Không thể tải danh sách công nợ');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReceivables();
    setRefreshing(false);
  };

  const handleViewDetail = (customer) => {
    navigation.navigate('ReceivableDetail', { customerId: customer.customer_id });
  };

  const getFilteredReceivables = () => {
    if (!searchQuery) return receivables;

    const searchLower = searchQuery.toLowerCase();
    return receivables.filter(item =>
      item.customer_name?.toLowerCase().includes(searchLower) ||
      item.customer_code?.toLowerCase().includes(searchLower)
    );
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const renderReceivableCard = ({ item }) => {
    const balance = (item.total_sales || 0) - (item.total_received || 0);
    const receivedPercent = item.total_sales > 0
      ? ((item.total_received / item.total_sales) * 100).toFixed(1)
      : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleViewDetail(item)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#ffffff', '#f8f9fa']}
          style={styles.cardGradient}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.customerIcon}>
                <Ionicons name="people" size={24} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>{item.customer_name}</Text>
                {item.customer_code && (
                  <Text style={styles.customerCode}>{item.customer_code}</Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>

          {/* Balance Summary */}
          <View style={styles.balanceContainer}>
            <View style={[styles.balanceCard, styles.balanceCardCredit]}>
              <Text style={styles.balanceLabel}>Còn phải thu</Text>
              <Text style={[styles.balanceValue, styles.balanceValueCredit]}>
                {formatCurrency(balance)}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Ionicons name="cart" size={16} color="#6B7280" />
              <Text style={styles.detailLabel}>Tổng bán:</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.total_sales)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.detailLabel}>Đã thu:</Text>
              <Text style={[styles.detailValue, styles.detailValueReceived]}>
                {formatCurrency(item.total_received)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(receivedPercent, 100)}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{receivedPercent}% đã thu</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cash-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyText}>Không có công nợ phải thu</Text>
      <Text style={styles.emptySubtext}>
        Danh sách công nợ với khách hàng sẽ hiển thị ở đây
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const filteredReceivables = getFilteredReceivables();
  const totalBalance = filteredReceivables.reduce((sum, item) =>
    sum + ((item.total_sales || 0) - (item.total_received || 0)), 0
  );
  const totalSales = filteredReceivables.reduce((sum, item) =>
    sum + (item.total_sales || 0), 0
  );
  const totalReceived = filteredReceivables.reduce((sum, item) =>
    sum + (item.total_received || 0), 0
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <RNTextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm khách hàng..."
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

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.statCardCredit]}>
          <Ionicons name="trending-up" size={20} color="#10B981" />
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>Còn Phải Thu</Text>
            <Text style={[styles.statValue, styles.statValueCredit]}>
              {formatCurrency(totalBalance)}
            </Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cart" size={18} color="#6B7280" />
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>Tổng Bán</Text>
            <Text style={styles.statValue}>{formatCurrency(totalSales)}</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>Đã Thu</Text>
            <Text style={[styles.statValue, styles.statValueReceived]}>
              {formatCurrency(totalReceived)}
            </Text>
          </View>
        </View>
      </View>

      {/* Receivables List */}
      <FlatList
        data={filteredReceivables}
        renderItem={renderReceivableCard}
        keyExtractor={(item) => item.customer_id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10B981']}
          />
        }
      />

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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
    alignItems: 'center',
  },
  statCardCredit: {
    backgroundColor: '#F0FDF4',
    borderColor: '#D1FAE5',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  statValueCredit: {
    color: '#10B981',
  },
  statValueReceived: {
    color: '#10B981',
  },
  listContainer: {
    padding: 16,
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
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  customerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  customerCode: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  balanceContainer: {
    marginBottom: 12,
  },
  balanceCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  balanceCardCredit: {
    backgroundColor: '#F0FDF4',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  balanceValueCredit: {
    color: '#10B981',
  },
  detailsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  detailValueReceived: {
    color: '#10B981',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'right',
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
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
