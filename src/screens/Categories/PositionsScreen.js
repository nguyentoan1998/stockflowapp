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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../contexts/ApiContext';
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';
import ListCard from '../../components/ui/ListCard';

export default function PositionsScreen() {
  const navigation = useNavigation();
  const { api } = useApi();

  const [positions, setpositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedposition, setSelectedposition] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  });

  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useFocusEffect(
    useCallback(() => {
      fetchpositions();
    }, [])
  );

  const fetchpositions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/positions');
      const positionsData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);
      setpositions(positionsData);
    } catch (error) {
      console.error('Error fetching positions:', error);
      Alert.error('Lỗi', 'Không thể tải danh sách đơn vị tính');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchpositions();
    setRefreshing(false);
  };

  const handleAdd = () => {
    setFormData({ code: '', name: '', description: '' });
    setSelectedposition(null);
    setModalMode('create');
    setModalVisible(true);
  };

  const handleEdit = (position) => {
    setFormData({
      code: position.code || '',
      name: position.name || '',
      description: position.description || '',
    });
    setSelectedposition(position);
    setModalMode('edit');
    setModalVisible(true);
  };

  const handleView = (position) => {
    setFormData({
      code: position.code || '',
      name: position.name || '',
      description: position.description || '',
    });
    setSelectedposition(position);
    setModalMode('view');
    setModalVisible(true);
  };

  const handleDelete = (positionId) => {
    const position = positions.find(u => u.id === positionId);
    Alert.confirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa đơn vị "${position?.name}"?`,
      async () => {
        const positionToDelete = positions.find(u => u.id === positionId);
        setpositions(positions.filter(u => u.id !== positionId));

        try {
          await api.delete(`/api/positions/${positionId}`);
          Alert.success('Xóa thành công!', `Đơn vị "${positionToDelete?.name}" đã được xóa.`);
        } catch (error) {
          if (positionToDelete) {
            setpositions(prevpositions => [...prevpositions, positionToDelete]);
          }
          Alert.error('Lỗi', 'Không thể xóa đơn vị. Vui lòng thử lại.');
        }
      }
    );
  };

  const handleModalSubmit = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      Alert.error('Lỗi', 'Vui lòng nhập đầy đủ mã và Tên chức vụ');
      return;
    }

    setModalLoading(true);

    try {
      const dataToSend = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description || null,
      };

      if (modalMode === 'edit') {
        await api.put(`/api/positions/${selectedposition.id}`, dataToSend);
        setpositions(positions.map(u => u.id === selectedposition.id ? { ...u, ...dataToSend } : u));
        Alert.success('Cập nhật thành công!', 'Thông tin đơn vị đã được cập nhật.');
      } else {
        const response = await api.post('/api/positions', dataToSend);
        setpositions([response.data, ...positions]);
        Alert.success('Tạo thành công!', 'Đơn vị mới đã được thêm vào hệ thống.');
      }

      setModalVisible(false);
      await fetchpositions();
    } catch (error) {
      console.error('Error saving position:', error);
      Alert.error('Lỗi', error.response?.data?.message || 'Không thể lưu thông tin đơn vị');
    } finally {
      setModalLoading(false);
    }
  };

  const getFilteredpositions = () => {
    return positions.filter(position => {
      const searchLower = searchQuery.toLowerCase();
      return (
        position.name?.toLowerCase().includes(searchLower) ||
        position.code?.toLowerCase().includes(searchLower) ||
        position.description?.toLowerCase().includes(searchLower)
      );
    });
  };

  const renderpositionItem = ({ item: position }) => (
    <ListCard
      title={position.name}
      subtitle={position.code}
      imageIcon="briefcase-outline"
      details={[
        position.description && {
          label: 'Mô tả',
          value: position.description,
          icon: 'document-text-outline',
        },
      ].filter(Boolean)}
      actions={[
        { label: 'Xem', icon: 'eye', color: '#1976d2', onPress: () => handleView(position) },
        { label: 'Sửa', icon: 'pencil', color: '#4CAF50', onPress: () => handleEdit(position) },
        { label: 'Xóa', icon: 'delete', color: '#F44336', onPress: () => handleDelete(position.id) },
      ]}
    />
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const filteredpositions = getFilteredpositions();

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <RNTextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm đơn vị..."
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
        data={filteredpositions}
        renderItem={renderpositionItem}
        keyExtractor={item => item.id?.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có đơn vị tính nào'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <LinearGradient colors={['#1976d2', '#1565c0']} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={modalMode === 'create' ? ['#4CAF50', '#66BB6A'] : modalMode === 'edit' ? ['#2196F3', '#42A5F5'] : ['#9C27B0', '#BA68C8']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'Thêm đơn vị' : modalMode === 'edit' ? 'Sửa đơn vị' : 'Chi tiết đơn vị'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Mã chức vụ *</Text>
              <RNTextInput
                style={styles.input}
                value={formData.code}
                onChangeText={(text) => setFormData({ ...formData, code: text })}
                placeholder="VD: GD"
                
                editable={modalMode !== 'view'}
              />

              <Text style={styles.label}>Tên chức vụ *</Text>
              <RNTextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="VD: Giám đốc"
                editable={modalMode !== 'view'}
              />

              <Text style={styles.label}>Mô tả</Text>
              <RNTextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Mô tả chi tiết..."
                multiline
                numberOfLines={3}
                editable={modalMode !== 'view'}
              />
            </ScrollView>

            {modalMode !== 'view' && (
              <View style={styles.modalFooter}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)} disabled={modalLoading}>
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleModalSubmit} disabled={modalLoading}>
                  {modalLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>{modalMode === 'create' ? 'Tạo' : 'Lưu'}</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  searchContainer: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: '#333', fontFamily: 'System' },
  listContent: { padding: 15 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#999' },
  fab: { position: 'absolute', bottom: 20, right: 20, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  fabGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxWidth: 500, maxHeight: '70%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  modalBody: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, color: '#333', fontFamily: 'System', backgroundColor: '#fff', fontFamily: 'System' },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', marginRight: 10 },
  saveButton: { backgroundColor: '#1976d2' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});





