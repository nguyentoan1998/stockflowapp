import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

export default function WarehouseInputDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { api } = useApi();
  const { inputId } = route.params;

  const [input, setInput] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const AlertHelper = createAlertHelper(setAlertConfig);

  useEffect(() => {
    fetchInput();
  }, [inputId]);

  const fetchInput = async () => {
    try {
      setLoading(true);
      console.log('Fetching inventory transaction with ID:', inputId);
      const response = await api.get(
        `/api/inventory_transactions/${inputId}?include={"inventory_transaction_logs":{"include":{"products":true,"product_specifications":true}},"warehouses_inventory_transactions_source_warehouse_idTowarehouses":true,"warehouses_inventory_transactions_destination_warehouse_idTowarehouses":true}`
      );
      console.log('Fetched input:', response.data);
      setInput(response.data);
    } catch (error) {
      console.error('Error fetching input:', error);
      AlertHelper.error('Lỗi', 'Không thể tải chi tiết phiếu nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('WarehouseInputForm', { mode: 'edit', inputId: inputId });
  };

  const handleComplete = () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn hoàn thành phiếu nhập này?',
      [
        { text: 'Hủy', onPress: () => {}, style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              await api.put(`/api/inventory_transactions/${inputId}`, { status: 'completed' });
              AlertHelper.success('Thành công!', 'Phiếu nhập đã được hoàn thành');
              await fetchInput();
            } catch (error) {
              AlertHelper.error('Lỗi', 'Không thể hoàn thành phiếu nhập');
            }
          },
        },
      ]
    );
  };

  const getTotalAmount = () => {
    return (input?.inventory_transaction_logs || []).reduce((sum, item) => {
      const qty = parseFloat(item.quantity || 0);
      const cost = parseFloat(item.cost || 0);
      return sum + (qty * cost);
    }, 0);
  };

  const renderItemDetail = ({ item }) => (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.products?.name}
        </Text>
        <Text style={styles.itemCode}>
          Mã: {item.products?.code}
        </Text>
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>SL</Text>
          <Text style={styles.detailValue}>{parseFloat(item.quantity).toFixed(2)}</Text>
        </View>

        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>Giá</Text>
          <Text style={styles.detailValue}>
            {parseFloat(item.cost).toLocaleString('vi-VN')}₫
          </Text>
        </View>

        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>Tổng</Text>
          <Text style={[styles.detailValue, { fontWeight: '700', color: '#1976d2' }]}>
            {(parseFloat(item.quantity) * parseFloat(item.cost)).toLocaleString('vi-VN')}₫
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!input) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Không tìm thấy phiếu nhập</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <CustomAlert {...alertConfig} />

      <View style={styles.content}>
        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin phiếu nhập</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã phiếu:</Text>
            <Text style={styles.infoValue}>{input.code}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày nhập:</Text>
            <Text style={styles.infoValue}>
              {new Date(input.transaction_date).toLocaleDateString('vi-VN')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kho đi:</Text>
            <Text style={styles.infoValue}>
              {input.warehouses_inventory_transactions_source_warehouse_idTowarehouses?.name || 'Không chọn'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kho đến:</Text>
            <Text style={styles.infoValue}>{input.warehouses_inventory_transactions_destination_warehouse_idTowarehouses?.name}</Text>
          </View>

          {input.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ghi chú:</Text>
              <Text style={styles.infoValue}>{input.description}</Text>
            </View>
          )}
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết sản phẩm</Text>

          <FlatList
            data={input.inventory_transaction_logs}
            renderItem={renderItemDetail}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          />
        </View>

        {/* Total Section */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng số sản phẩm:</Text>
            <Text style={styles.totalValue}>
              {input.inventory_transaction_logs?.length} cái
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng số lượng:</Text>
            <Text style={styles.totalValue}>
              {(input.inventory_transaction_logs || []).reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0).toFixed(2)}
            </Text>
          </View>

          <View style={[styles.totalRow, styles.totalRowMain]}>
            <Text style={styles.totalLabelMain}>Tổng tiền:</Text>
            <Text style={styles.totalValueMain}>
              {getTotalAmount().toLocaleString('vi-VN')}₫
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {input.status === 'draft' && (
            <>
              <TouchableOpacity style={[styles.button, styles.buttonEdit]} onPress={handleEdit}>
                <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                <Text style={styles.buttonText}>Sửa</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, styles.buttonComplete]} onPress={handleComplete}>
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                <Text style={styles.buttonText}>Hoàn thành</Text>
              </TouchableOpacity>
            </>
          )}

          {input.status === 'completed' && (
            <TouchableOpacity style={[styles.button, styles.buttonDisabled]} disabled>
              <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
              <Text style={styles.buttonText}>Đã hoàn thành</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  content: {
    padding: 12,
    paddingBottom: 30,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    flex: 0.4,
  },
  infoValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    flex: 0.6,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  itemInfo: {
    flex: 0.5,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  itemCode: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  itemDetails: {
    flex: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCell: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    color: '#999',
  },
  detailValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  totalSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  totalRowMain: {
    borderBottomWidth: 0,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 4,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
  },
  totalLabelMain: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  totalValueMain: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976d2',
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonEdit: {
    backgroundColor: '#4CAF50',
  },
  buttonComplete: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
