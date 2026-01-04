import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function ReceiptFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { api } = useApi();
  const { mode, receiptId, customerId, customerName, currentBalance } = route.params;

  const [formData, setFormData] = useState({
    amount: '',
    receipt_date: new Date().toISOString().split('T')[0],
    payment_method: 'Tiền mặt',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');

  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  const paymentMethods = ['Tiền mặt', 'Chuyển khoản'];

  // Load receipt data if in edit mode
  useEffect(() => {
    if (mode === 'edit' && receiptId) {
      fetchReceiptData();
    }
  }, [mode, receiptId]);

  const fetchReceiptData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/receipts/${receiptId}`);
      const receipt = response.data;

      setFormData({
        amount: receipt.amount?.toString() || '',
        receipt_date: receipt.receipt_date ? new Date(receipt.receipt_date).toISOString().split('T')[0] : '',
        payment_method: receipt.payment_method || 'Tiền mặt',
        notes: receipt.notes || '',
      });
    } catch (error) {
      console.error('Error fetching receipt:', error);
      Alert.error('Lỗi', 'Không thể tải thông tin phiếu thu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.error('Lỗi', 'Vui lòng nhập số tiền thu hợp lệ');
      return;
    }

    if (currentBalance && parseFloat(formData.amount) > currentBalance) {
      Alert.error('Lỗi', 'Số tiền thu không được lớn hơn công nợ hiện tại');
      return;
    }

    Alert.confirm(
      mode === 'edit' ? 'Xác nhận cập nhật' : 'Xác nhận thu tiền',
      mode === 'edit'
        ? `Bạn có chắc chắn muốn cập nhật phiếu thu này?`
        : `Bạn có chắc chắn muốn thu ${formatCurrency(parseFloat(formData.amount))} từ ${customerName}?`,
      async () => {
        try {
          setSaving(true);

          if (mode === 'edit') {
            // Update existing receipt
            await api.put(`/api/receipts/${receiptId}`, {
              amount: parseFloat(formData.amount),
              receipt_date: new Date(formData.receipt_date).toISOString(),
              payment_method: formData.payment_method,
              notes: formData.notes,
            });
          } else {
            // Create new receipt
            await api.post('/api/receipts', {
              code: `PT-${new Date().getFullYear()}-${Date.now()}`,
              customer_id: customerId,
              amount: parseFloat(formData.amount),
              receipt_date: new Date(formData.receipt_date).toISOString(),
              payment_method: formData.payment_method,
              notes: formData.notes,
              status: 'approved',
            });
          }

          Alert.success(
            'Thành công!',
            mode === 'edit' ? 'Phiếu thu đã được cập nhật' : 'Phiếu thu đã được ghi nhận',
            () => {
              navigation.goBack();
            }
          );
        } catch (error) {
          console.error('Error saving receipt:', error);
          Alert.error('Lỗi', mode === 'edit' ? 'Không thể cập nhật phiếu thu' : 'Không thể lưu phiếu thu');
        } finally {
          setSaving(false);
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Customer Info */}
        <View style={styles.customerCard}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.customerGradient}
          >
            <Ionicons name="people" size={24} color="#fff" />
            <Text style={styles.customerName}>{customerName}</Text>
          </LinearGradient>
        </View>

        {/* Current Balance */}
        {currentBalance !== undefined && (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Công nợ hiện tại</Text>
            <Text style={styles.balanceValue}>{formatCurrency(currentBalance)}</Text>
          </View>
        )}

        {/* Receipt Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Số tiền thu *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="cash" size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              placeholder="Nhập số tiền"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.inputSuffix}>₫</Text>
          </View>
          {formData.amount && parseFloat(formData.amount) > 0 && (
            <Text style={styles.helperText}>
              {formatCurrency(parseFloat(formData.amount))}
            </Text>
          )}
        </View>

        {/* Receipt Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ngày thu tiền *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar" size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              value={formData.receipt_date}
              onChangeText={(text) => setFormData({ ...formData, receipt_date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán *</Text>
          <View style={styles.methodsContainer}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.methodButton,
                  formData.payment_method === method && styles.methodButtonActive
                ]}
                onPress={() => setFormData({ ...formData, payment_method: method })}
              >
                <Text
                  style={[
                    styles.methodText,
                    formData.payment_method === method && styles.methodTextActive
                  ]}
                >
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <TextInput
            style={[styles.inputContainer, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Nhập ghi chú (không bắt buộc)"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.saveButtonGradient}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>
              {saving ? 'Đang lưu...' : mode === 'edit' ? 'Cập nhật' : 'Xác nhận thu'}
            </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  customerCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  customerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D1FAE5',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    padding: 0,
  },
  inputSuffix: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  helperText: {
    marginTop: 8,
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  textArea: {
    minHeight: 100,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  methodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  methodTextActive: {
    color: '#10B981',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
