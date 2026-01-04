import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function SalesDeliveryDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { api } = useApi();
  const { deliveryId } = route.params;

  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useEffect(() => {
    fetchDeliveryDetail();
  }, [deliveryId]);

  const fetchDeliveryDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/sales_deliveries/${deliveryId}?include={"customers":true,"warehouses":true,"sales_delivery_items":{"include":{"products":true,"product_specifications":true}}}`
      );
      setDelivery(response.data);
    } catch (error) {
      console.error('Error fetching delivery detail:', error);
      Alert.error('Lỗi', 'Không thể tải thông tin phiếu xuất');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (delivery.status !== 'draft') {
      Alert.error('Không thể sửa', 'Chỉ có thể sửa phiếu xuất ở trạng thái Nháp');
      return;
    }
    navigation.navigate('SalesDeliveryForm', { mode: 'edit', deliveryId: delivery.id });
  };

  const handleApprove = () => {
    Alert.confirm(
      'Xác nhận duyệt',
      `Bạn có chắc chắn muốn duyệt phiếu xuất "${delivery.code}"?`,
      async () => {
        try {
          await api.put(`/api/sales_deliveries/${delivery.id}`, {
            status: 'approved',
          });
          Alert.success('Thành công!', 'Phiếu xuất đã được duyệt');
          fetchDeliveryDetail();
        } catch (error) {
          console.error('Error approving delivery:', error);
          Alert.error('Lỗi', 'Không thể duyệt phiếu xuất');
        }
      }
    );
  };

  const handleCancel = () => {
    if (delivery.status === 'approved') {
      Alert.error('Không thể xóa', 'Không thể xóa phiếu xuất đã duyệt');
      return;
    }

    Alert.confirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa phiếu xuất "${delivery.code}" không?`,
      async () => {
        try {
          await api.delete(`/api/sales_deliveries/${delivery.id}`);
          Alert.success('Thành công!', 'Phiếu xuất đã được xóa');
          navigation.goBack();
        } catch (error) {
          console.error('Error deleting delivery:', error);
          Alert.error('Lỗi', 'Không thể xóa phiếu xuất');
        }
      }
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Nháp', color: '#6B7280', bgColor: '#F3F4F6' },
      approved: { label: 'Đã xác nhận', color: '#10B981', bgColor: '#D1FAE5' },
      cancelled: { label: 'Đã hủy', color: '#EF4444', bgColor: '#FEE2E2' },
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Không tìm thấy phiếu xuất</Text>
      </View>
    );
  }

  const items = delivery.sales_delivery_items || [];
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
    return sum + itemTotal;
  }, 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderCode}>{delivery.code}</Text>
            {getStatusBadge(delivery.status)}
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Ngày xuất:</Text>
            <Text style={styles.infoValue}>{formatDate(delivery.delivery_date)}</Text>
          </View>
        </View>

        {/* Customer Card */}
        {delivery.customers && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Khách hàng</Text>
            <View style={styles.customerInfo}>
              <Ionicons name="people" size={20} color="#10B981" />
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{delivery.customers.name || 'N/A'}</Text>
                <Text style={styles.customerCode}>Mã: {delivery.customers.code || 'N/A'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Warehouse Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Kho xuất</Text>
          <View style={styles.customerInfo}>
            <Ionicons name="home" size={20} color="#10B981" />
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{delivery.warehouses?.name || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Items Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Danh sách sản phẩm</Text>
          {items.map((item, index) => (
            <View key={item.id || index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.products?.name || 'N/A'}</Text>
                {item.product_specifications && (
                  <Text style={styles.itemSpec}>
                    {item.product_specifications.spec_name}: {item.product_specifications.spec_value}
                  </Text>
                )}
              </View>

              <View style={styles.itemDetails}>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemDetailLabel}>Số lượng:</Text>
                  <Text style={styles.itemDetailValue}>
                    {item.quantity}
                  </Text>
                </View>

                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemDetailLabel}>Đơn giá:</Text>
                  <Text style={styles.itemDetailValue}>
                    {formatCurrency(item.unit_price)}
                  </Text>
                </View>

                <View style={[styles.itemDetailRow, styles.itemTotalRow]}>
                  <Text style={styles.itemTotalLabel}>Thành tiền:</Text>
                  <Text style={styles.itemTotalValue}>
                    {formatCurrency((item.quantity || 0) * (item.unit_price || 0))}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(delivery.total_amount)}
            </Text>
          </View>
        </View>

        {/* Notes Card */}
        {delivery.notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ghi chú</Text>
            <Text style={styles.notesText}>{delivery.notes}</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        {delivery.status === 'draft' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleEdit}
            >
              <Ionicons name="pencil" size={20} color="#10B981" />
              <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                Sửa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleApprove}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Duyệt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleCancel}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Xóa</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
      />
    </View>
  );
}

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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
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
  orderCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  customerCode: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemHeader: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemSpec: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemDetails: {
    gap: 6,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemDetailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemDetailValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  itemTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  itemTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  itemTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 100,
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#10B981',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#10B981',
  },
});
