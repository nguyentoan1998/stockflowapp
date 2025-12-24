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

export default function SuppliersScreen() {
  const navigation = useNavigation();
  const { api } = useApi();

  const [suppliers, setsuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedsupplier, setSelectedsupplier] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    description: '',
  });

  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);

  useFocusEffect(
    useCallback(() => {
      fetchsuppliers();
    }, [])
  );

  const fetchsuppliers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/suppliers');
      const suppliersData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);
      setsuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      Alert.error('Lá»—i', 'KhÃ´ng thá»ƒ táº£i danh sÃ¡ch Ä‘Æ¡n vá»‹ tÃ­nh');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchsuppliers();
    setRefreshing(false);
  };

  const handleAdd = () => {
    setFormData({ code: '', name: '', description: '' });
    setSelectedsupplier(null);
    setModalMode('create');
    setModalVisible(true);
  };

  const handleEdit = (supplier) => {
    setFormData({
      code: supplier.code || '',
      name: supplier.name || '',
      description: supplier.description || '',
    });
    setSelectedsupplier(supplier);
    setModalMode('edit');
    setModalVisible(true);
  };

  const handleView = (supplier) => {
    setFormData({
      code: supplier.code || '',
      name: supplier.name || '',
      description: supplier.description || '',
    });
    setSelectedsupplier(supplier);
    setModalMode('view');
    setModalVisible(true);
  };

  const handleDelete = (supplierId) => {
    const supplier = suppliers.find(u => u.id === supplierId);
    Alert.confirm(
      'XÃ¡c nháº­n xÃ³a',
      `Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a Ä‘Æ¡n vá»‹ "${supplier?.name}"?`,
      async () => {
        const supplierToDelete = suppliers.find(u => u.id === supplierId);
        setsuppliers(suppliers.filter(u => u.id !== supplierId));

        try {
          await api.delete(`/api/suppliers/${supplierId}`);
          Alert.success('XÃ³a thÃ nh cÃ´ng!', `ÄÆ¡n vá»‹ "${supplierToDelete?.name}" Ä‘Ã£ Ä‘Æ°á»£c xÃ³a.`);
        } catch (error) {
          if (supplierToDelete) {
            setsuppliers(prevsuppliers => [...prevsuppliers, supplierToDelete]);
          }
          Alert.error('Lá»—i', 'KhÃ´ng thá»ƒ xÃ³a Ä‘Æ¡n vá»‹. Vui lÃ²ng thá»­ láº¡i.');
        }
      }
    );
  };

  const handleModalSubmit = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      Alert.error('Lá»—i', 'Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ mÃ£ vÃ  tÃªn Ä‘Æ¡n vá»‹');
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
        await api.put(`/api/suppliers/${selectedsupplier.id}`, dataToSend);
        setsuppliers(suppliers.map(u => u.id === selectedsupplier.id ? { ...u, ...dataToSend } : u));
        Alert.success('Cáº­p nháº­t thÃ nh cÃ´ng!', 'ThÃ´ng tin Ä‘Æ¡n vá»‹ Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t.');
      } else {
        const response = await api.post('/api/suppliers', dataToSend);
        setsuppliers([response.data, ...suppliers]);
        Alert.success('Táº¡o thÃ nh cÃ´ng!', 'ÄÆ¡n vá»‹ má»›i Ä‘Ã£ Ä‘Æ°á»£c thÃªm vÃ o há»‡ thá»‘ng.');
      }

      setModalVisible(false);
      await fetchsuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      Alert.error('Lá»—i', error.response?.data?.message || 'KhÃ´ng thá»ƒ lÆ°u thÃ´ng tin Ä‘Æ¡n vá»‹');
    } finally {
      setModalLoading(false);
    }
  };

  const getFilteredsuppliers = () => {
    return suppliers.filter(supplier => {
      const searchLower = searchQuery.toLowerCase();
      return (
        supplier.name?.toLowerCase().includes(searchLower) ||
        supplier.code?.toLowerCase().includes(searchLower) ||
        supplier.description?.toLowerCase().includes(searchLower)
      );
    });
  };

  const rendersupplierItem = ({ item: supplier }) => (
    <ListCard
      title={supplier.name}
      subtitle={supplier.code}
      imageIcon="business-outline"
      details={[
        supplier.description && {
          label: 'MÃ´ táº£',
          value: supplier.description,
          icon: 'document-text-outline',
        },
      ].filter(Boolean)}
      actions={[
        { label: 'Xem', icon: 'eye', color: '#1976d2', onPress: () => handleView(supplier) },
        { label: 'Sá»­a', icon: 'pencil', color: '#4CAF50', onPress: () => handleEdit(supplier) },
        { label: 'XÃ³a', icon: 'delete', color: '#F44336', onPress: () => handleDelete(supplier.id) },
      ]}
    />
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Äang táº£i...</Text>
      </View>
    );
  }

  const filteredsuppliers = getFilteredsuppliers();

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <RNTextInput
            style={styles.searchInput}
            placeholder="TÃ¬m kiáº¿m Ä‘Æ¡n vá»‹..."
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
        data={filteredsuppliers}
        renderItem={rendersupplierItem}
        keyExtractor={item => item.id?.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'KhÃ´ng tÃ¬m tháº¥y káº¿t quáº£' : 'ChÆ°a cÃ³ Ä‘Æ¡n vá»‹ tÃ­nh nÃ o'}
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
                {modalMode === 'create' ? 'ThÃªm Ä‘Æ¡n vá»‹' : modalMode === 'edit' ? 'Sá»­a Ä‘Æ¡n vá»‹' : 'Chi tiáº¿t Ä‘Æ¡n vá»‹'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>MÃ£ Ä‘Æ¡n vá»‹ *</Text>
              <RNTextInput
                style={styles.input}
                value={formData.code}
                onChangeText={(text) => setFormData({ ...formData, code: text })}
                placeholder="VD: NCC001"
                editable={modalMode !== 'view'}
              />

              <Text style={styles.label}>TÃªn Ä‘Æ¡n vá»‹ *</Text>
              <RNTextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="VD: Công ty XYZ"
                editable={modalMode !== 'view'}
              />

              <Text style={styles.label}>MÃ´ táº£</Text>
              <RNTextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="MÃ´ táº£ chi tiáº¿t..."
                multiline
                numberOfLines={3}
                editable={modalMode !== 'view'}
              />
            </ScrollView>

            {modalMode !== 'view' && (
              <View style={styles.modalFooter}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)} disabled={modalLoading}>
                  <Text style={styles.cancelButtonText}>Há»§y</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleModalSubmit} disabled={modalLoading}>
                  {modalLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>{modalMode === 'create' ? 'Táº¡o' : 'LÆ°u'}</Text>}
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
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: '#333' },
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
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, color: '#333', backgroundColor: '#fff' },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', marginRight: 10 },
  saveButton: { backgroundColor: '#1976d2' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});



