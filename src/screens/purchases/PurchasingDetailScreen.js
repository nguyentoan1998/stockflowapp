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

export default function PurchasingDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { api } = useApi();
  const { receiveId } = route.params;

  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useEffect(() => {
    fetchPurchaseDetail();
  }, [receiveId]);

  const fetchPurchaseDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/purchase_receives/${receiveId}?include={"suppliers":true,"warehouses":true,"purchase_receive_items":{"include":{"products":true,"product_specifications":true}}}`
      );
      setPurchase(response.data);
    } catch (error) {
      console.error('Error fetching purchase detail:', error);
      Alert.error('Lỗi', 'Không thể tải thông tin phiếu mua hàng');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (purchase.status !== 'draft') {
      Alert.error('Không thể sửa', 'Chỉ có thể sửa phiếu mua hàng ở trạng thái Nháp');
      return;
    }
    navigation.navigate('PurchasingForm', { mode: 'edit', receiveId: purchase.id });
  };

  const handleApprove = () => {
    Alert.confirm(
      'Xác nhận duyệt',
      `Bạn có chắc chắn muốn duyệt phiếu mua hàng "${purchase.code}"?`,
      async () => {
        try {
          await api.put(`/api/purchase_receives/${purchase.id}`, {
            ...purchase,
            status: 'approved',
          });
          Alert.success('Thành công!', 'Phiếu mua hàng đã được duyệt');
          fetchPurchaseDetail();
        } catch (error) {
          console.error('Error approving purchase:', error);
          Alert.error('Lỗi', 'Không thể duyệt phiếu mua hàng');
        }
      }
    );
  };

  const handleComplete = () => {
    Alert.confirm(
      'Xác nhận hoàn thành',
      `Bạn có chắc chắn muốn hoàn thành phiếu mua hàng "${purchase.code}"? Hàng sẽ được nhập kho.`,
      async () => {
        try {
          await api.put(`/api/purchase_receives/${purchase.id}`, {
            ...purchase,
            status: 'completed',
            // Don't set isinventory - let server manage it automatically
          });
          Alert.success('Thành công!', 'Phiếu mua hàng đã hoàn thành và hàng đã được nhập kho');
          fetchPurchaseDetail();
        } catch (error) {
          console.error('Error completing purchase:', error);
          Alert.error('Lỗi', 'Không thể hoàn thành phiếu mua hàng');
        }
      }
    );
  };

  const handleReject = () => {
    Alert.confirm(
      'Xác nhận từ chối',
      `Bạn có chắc chắn muốn từ chối và chuyển phiếu mua hàng "${purchase.code}" về nháp?`,
      async () => {
        try {
          await api.put(`/api/purchase_receives/${purchase.id}`, {
            ...purchase,
            status: 'draft',
          });
          Alert.success('Thành công!', 'Phiếu mua hàng đã được chuyển về nháp');
          fetchPurchaseDetail();
        } catch (error) {
          console.error('Error rejecting purchase:', error);
          Alert.error('Lỗi', 'Không thể từ chối phiếu mua hàng');
        }
      }
    );
  };

  const handleCancel = () => {
    if (purchase.status === 'completed') {
      Alert.error('Không thể xóa', 'Không thể xóa phiếu mua hàng đã hoàn thành');
      return;
    }

    Alert.confirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa phiếu mua hàng "${purchase.code}" không?`,
      async () => {
        try {
          await api.delete(`/api/purchase_receives/${purchase.id}`);
          Alert.success('Thành công!', 'Phiếu mua hàng đã được xóa');
          navigation.goBack();
        } catch (error) {
          console.error('Error deleting purchase:', error);
          Alert.error('Lỗi', 'Không thể xóa phiếu mua hàng');
        }
      }
    );
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!purchase) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Không tìm thấy phiếu mua hàng</Text>
      </View>
    );
  }

  const items = purchase.purchase_receive_items || [];
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
            <Text style={styles.orderCode}>{purchase.code}</Text>
            {getStatusBadge(purchase.status)}
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Ngày nhận:</Text>
            <Text style={styles.infoValue}>{formatDate(purchase.receive_date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons 
              name={purchase.isinventory ? "checkmark-circle" : "time"} 
              size={16} 
              color={purchase.isinventory ? "#10B981" : "#F59E0B"} 
            />
            <Text style={styles.infoLabel}>Trạng thái kho:</Text>
            <Text style={[styles.infoValue, { color: purchase.isinventory ? '#10B981' : '#F59E0B' }]}>
              {purchase.isinventory ? 'Đã nhập kho' : 'Chưa nhập kho'}
            </Text>
          </View>
        </View>

        {/* Supplier Card */}
        {purchase.suppliers && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Nhà cung cấp</Text>
            <View style={styles.supplierInfo}>
              <Ionicons name="business" size={20} color="#4CAF50" />
              <View style={styles.supplierDetails}>
                <Text style={styles.supplierName}>{purchase.suppliers.name || 'N/A'}</Text>
                <Text style={styles.supplierCode}>Mã: {purchase.suppliers.code || 'N/A'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Warehouse Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Kho nhận</Text>
          <View style={styles.supplierInfo}>
            <Ionicons name="home" size={20} color="#4CAF50" />
            <View style={styles.supplierDetails}>
              <Text style={styles.supplierName}>{purchase.warehouses?.name || 'N/A'}</Text>
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
            <Text style={styles.summaryLabel}>Tổng cộng:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(subtotal)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(purchase.total_amount)}
            </Text>
          </View>
        </View>

        {/* Notes Card */}
        {purchase.notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ghi chú</Text>
            <Text style={styles.notesText}>{purchase.notes}</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        {purchase.status === 'draft' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleEdit}
            >
              <Ionicons name="pencil" size={20} color="#4CAF50" />
              <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                Sửa
              </Text>
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

        {purchase.status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleApprove}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Duyệt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleReject}
            >
              <Ionicons name="close-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Từ chối</Text>
            </TouchableOpacity>
          </>
        )}

        {purchase.status === 'approved' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton, { flex: 1 }]}
            onPress={handleComplete}
          >
            <Ionicons name="cube" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Hoàn thành nhận hàng</Text>
          </TouchableOpacity>
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
  supplierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supplierDetails: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  supplierCode: {
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
    color: '#4CAF50',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
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
    backgroundColor: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4CAF50',
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
    color: '#4CAF50',
  },
});
