import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function ReceivableDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { api } = useApi();
  const { customerId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' or 'receipts'

  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [customerId])
  );

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch customer info
      const customerRes = await api.get(`/api/customers/${customerId}`);
      setCustomer(customerRes.data);

      // Fetch sales deliveries
      const salesRes = await api.get(`/api/sales_deliveries?where={\"customer_id\":${customerId}}&orderBy=[{\"delivery_date\":\"desc\"}]`);
      setSales(Array.isArray(salesRes.data) ? salesRes.data : (salesRes.data?.data || []));

      // Fetch receipts history (payments received from customer)
      // TODO: Update API endpoint when available
      const receiptsRes = await api.get(`/api/receipts?where={"customer_id":${customerId}}&orderBy=[{"receipt_date":"desc"}]`);
      setReceipts(Array.isArray(receiptsRes.data) ? receiptsRes.data : (receiptsRes.data?.data || []));

    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.error('Lỗi', 'Không thể tải thông tin chi tiết');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleReceipt = () => {
    navigation.navigate('ReceiptForm', { customerId, customerName: customer?.name });
  };

  const handleEditReceipt = (receipt) => {
    navigation.navigate('ReceiptForm', {
      mode: 'edit',
      receiptId: receipt.id,
      customerId,
      customerName: customer?.name,
    });
  };

  const handleDeleteReceipt = (receipt) => {
    Alert.confirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa phiếu thu "${receipt.code}" không?`,
      async () => {
        try {
          await api.delete(`/api/receipts/${receipt.id}`);
          Alert.success('Thành công!', 'Phiếu thu đã được xóa');
          await fetchData();
        } catch (error) {
          console.error('Error deleting receipt:', error);
          Alert.error('Lỗi', 'Không thể xóa phiếu thu');
        }
      }
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

  const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalReceipts = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  const balance = totalSales - totalReceipts;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
        }
      >
        {/* Customer Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.headerGradient}
          >
            <View style={styles.customerIcon}>
              <Ionicons name="people" size={32} color="#fff" />
            </View>
            <Text style={styles.customerName}>{customer?.name || 'N/A'}</Text>
            {customer?.code && (
              <Text style={styles.customerCode}>{customer.code}</Text>
            )}
          </LinearGradient>
        </View>

        {/* Balance Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="trending-up" size={20} color="#10B981" />
              <Text style={styles.summaryTitle}>Còn Phải Thu</Text>
            </View>
            <Text style={styles.summaryAmount}>{formatCurrency(balance)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="cart" size={18} color="#6B7280" />
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryLabel}>Tổng Bán</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalSales)}</Text>
              </View>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryLabel}>Đã Thu</Text>
                <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                  {formatCurrency(totalReceipts)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sales' && styles.tabActive]}
            onPress={() => setActiveTab('sales')}
          >
            <Ionicons
              name="cart"
              size={18}
              color={activeTab === 'sales' ? '#10B981' : '#6B7280'}
            />
            <Text style={[styles.tabText, activeTab === 'sales' && styles.tabTextActive]}>
              Phiếu Xuất ({sales.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'receipts' && styles.tabActive]}
            onPress={() => setActiveTab('receipts')}
          >
            <Ionicons
              name="cash"
              size={18}
              color={activeTab === 'receipts' ? '#10B981' : '#6B7280'}
            />
            <Text style={[styles.tabText, activeTab === 'receipts' && styles.tabTextActive]}>
              Phiếu Thu ({receipts.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {activeTab === 'sales' ? (
            sales.length > 0 ? (
              sales.map((sale) => (
                <View key={sale.id} style={styles.transactionCard}>
                  <View style={styles.transactionHeader}>
                    <View>
                      <Text style={styles.transactionCode}>{sale.code}</Text>
                      <Text style={styles.transactionDate}>{formatDate(sale.delivery_date)}</Text>
                    </View>
                    <Text style={styles.transactionAmount}>
                      {formatCurrency(sale.total_amount)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="cart-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Chưa có phiếu xuất nào</Text>
              </View>
            )
          ) : (
            receipts.length > 0 ? (
              receipts.map((receipt) => (
                <View key={receipt.id} style={styles.transactionCard}>
                  <View style={styles.transactionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.transactionCode}>{receipt.code || `PT${receipt.id}`}</Text>
                      <Text style={styles.transactionDate}>{formatDate(receipt.receipt_date)}</Text>
                    </View>
                    <View style={styles.transactionActions}>
                      <Text style={[styles.transactionAmount, { color: '#10B981' }]}>
                        +{formatCurrency(receipt.amount)}
                      </Text>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditReceipt(receipt)}
                        >
                          <Ionicons name="pencil" size={16} color="#10B981" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteReceipt(receipt)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  {receipt.notes && (
                    <Text style={styles.transactionNotes}>{receipt.notes}</Text>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="cash-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Chưa có phiếu thu nào</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.paymentButton} onPress={handleReceipt}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.paymentButtonGradient}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.paymentButtonText}>Thu Tiền</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

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
  header: {
    marginBottom: 16,
  },
  headerGradient: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  customerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  customerCode: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#F0FDF4',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#D1FAE5',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#10B981',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  transactionNotes: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    fontSize: 13,
    color: '#6B7280',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  paymentButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  paymentButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  transactionActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
