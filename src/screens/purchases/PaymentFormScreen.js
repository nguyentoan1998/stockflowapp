import React, { useState } from 'react';
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

export default function PaymentFormScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { api } = useApi();
    const { supplierId, supplierName, currentBalance } = route.params;

    const [formData, setFormData] = useState({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Tiền mặt',
        notes: '',
    });
    const [saving, setSaving] = useState(false);

    const [alertConfig, setAlertConfig] = useState({ visible: false });
    const Alert = createAlertHelper(setAlertConfig);

    const paymentMethods = ['Tiền mặt', 'Chuyển khoản'];

    const handleSave = async () => {
        // Validation
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            Alert.error('Lỗi', 'Vui lòng nhập số tiền thanh toán hợp lệ');
            return;
        }

        if (currentBalance && parseFloat(formData.amount) > currentBalance) {
            Alert.error('Lỗi', 'Số tiền thanh toán không được lớn hơn số nợ hiện tại');
            return;
        }

        Alert.confirm(
            'Xác nhận thanh toán',
            `Bạn có chắc chắn muốn thanh toán ${formatCurrency(parseFloat(formData.amount))} cho ${supplierName}?`,
            async () => {
                try {
                    setSaving(true);

                    await api.post('/api/payments', {
                        supplier_id: supplierId,
                        amount: parseFloat(formData.amount),
                        payment_date: formData.payment_date,
                        payment_method: formData.payment_method,
                        notes: formData.notes,
                        status: 'approved', // approved by default
                    });

                    Alert.success('Thành công!', 'Thanh toán đã được ghi nhận', () => {
                        navigation.goBack();
                    });
                } catch (error) {
                    console.error('Error saving payment:', error);
                    Alert.error('Lỗi', 'Không thể lưu thanh toán');
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
                {/* Supplier Info */}
                <View style={styles.supplierCard}>
                    <LinearGradient
                        colors={['#EF4444', '#DC2626']}
                        style={styles.supplierGradient}
                    >
                        <Ionicons name="business" size={24} color="#fff" />
                        <Text style={styles.supplierName}>{supplierName}</Text>
                    </LinearGradient>
                </View>

                {/* Current Balance */}
                {currentBalance !== undefined && (
                    <View style={styles.balanceCard}>
                        <Text style={styles.balanceLabel}>Số nợ hiện tại</Text>
                        <Text style={styles.balanceValue}>{formatCurrency(currentBalance)}</Text>
                    </View>
                )}

                {/* Payment Amount */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Số tiền thanh toán *</Text>
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

                {/* Payment Date */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ngày thanh toán *</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="calendar" size={20} color="#6B7280" />
                        <TextInput
                            style={styles.input}
                            value={formData.payment_date}
                            onChangeText={(text) => setFormData({ ...formData, payment_date: text })}
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
                                    formData.payment_method === method && styles.methodButtonActive,
                                ]}
                                onPress={() => setFormData({ ...formData, payment_method: method })}
                            >
                                <Text
                                    style={[
                                        styles.methodButtonText,
                                        formData.payment_method === method && styles.methodButtonTextActive,
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
                        style={[styles.input, styles.textArea]}
                        value={formData.notes}
                        onChangeText={(text) => setFormData({ ...formData, notes: text })}
                        placeholder="Nhập ghi chú (không bắt buộc)"
                        multiline
                        numberOfLines={3}
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
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveButtonGradient}
                    >
                        {saving ? (
                            <Text style={styles.saveButtonText}>Đang lưu...</Text>
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                                <Text style={styles.saveButtonText}>Xác Nhận Thanh Toán</Text>
                            </>
                        )}
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
        padding: 16,
        paddingBottom: 100,
    },
    supplierCard: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    supplierGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    supplierName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    balanceCard: {
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        marginBottom: 24,
    },
    balanceLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 6,
    },
    balanceValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#EF4444',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingHorizontal: 12,
        gap: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: '#111827',
    },
    inputSuffix: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '500',
    },
    helperText: {
        fontSize: 13,
        color: '#10B981',
        marginTop: 6,
        fontWeight: '500',
    },
    textArea: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingHorizontal: 12,
        paddingVertical: 12,
        minHeight: 80,
    },
    methodsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    methodButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    methodButtonActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
    },
    methodButtonText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    methodButtonTextActive: {
        color: '#3B82F6',
    },
    footer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    button: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    saveButton: {
        flex: 2,
    },
    saveButtonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        letterSpacing: 0.3,
    },
});
