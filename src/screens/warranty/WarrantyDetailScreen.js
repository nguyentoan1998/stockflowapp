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

export default function WarrantyDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { api } = useApi();
    const { warrantyId } = route.params;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [warranty, setWarranty] = useState(null);

    const [alertConfig, setAlertConfig] = useState({ visible: false });
    const Alert = createAlertHelper(setAlertConfig);

    useFocusEffect(
        useCallback(() => {
            fetchWarrantyDetail();
        }, [warrantyId])
    );

    const fetchWarrantyDetail = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/warranties/${warrantyId}?include={"customers":{"select":{"name":true,"code":true,"phone":true}},"products":{"select":{"name":true,"code":true}}}`);
            setWarranty(response.data);
        } catch (error) {
            console.error('Error fetching warranty detail:', error);
            Alert.error('Lỗi', 'Không thể tải thông tin phiếu bảo hành');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchWarrantyDetail();
        setRefreshing(false);
    };

    const handleEdit = () => {
        if (warranty.status === 'completed' || warranty.status === 'returned') {
            Alert.error('Không thể sửa', 'Chỉ có thể sửa phiếu chưa hoàn thành');
            return;
        }
        navigation.navigate('WarrantyForm', { mode: 'edit', warrantyId: warranty.id });
    };

    const handleUpdateStatus = async (newStatus) => {
        const statusLabels = {
            processing: 'chuyển sang Đang xử lý',
            completed: 'hoàn thành',
            returned: 'trả hàng',
            cancelled: 'hủy',
        };

        Alert.confirm(
            'Xác nhận',
            `Bạn có chắc chắn muốn ${statusLabels[newStatus]} phiếu bảo hành này?`,
            async () => {
                try {
                    await api.put(`/api/warranties/${warranty.id}`, {
                        status: newStatus,
                        ...(newStatus === 'completed' && { completed_date: new Date().toISOString() }),
                    });

                    Alert.success('Thành công!', 'Trạng thái đã được cập nhật');
                    await fetchWarrantyDetail();
                } catch (error) {
                    console.error('Error updating status:', error);
                    Alert.error('Lỗi', 'Không thể cập nhật trạng thái');
                }
            }
        );
    };

    const handleDelete = () => {
        if (warranty.status !== 'received') {
            Alert.error('Không thể xóa', 'Chỉ có thể xóa phiếu ở trạng thái Tiếp nhận');
            return;
        }

        Alert.confirm(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa phiếu bảo hành "${warranty.code}" không?`,
            async () => {
                try {
                    await api.delete(`/api/warranties/${warranty.id}`);
                    Alert.success('Thành công!', 'Phiếu bảo hành đã được xóa', () => {
                        navigation.goBack();
                    });
                } catch (error) {
                    console.error('Error deleting warranty:', error);
                    Alert.error('Lỗi', 'Không thể xóa phiếu bảo hành');
                }
            }
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const getStatusConfig = (status) => {
        const configs = {
            received: { label: 'Tiếp nhận', color: '#F97316', bgColor: '#FFEDD5', icon: 'receipt' },
            processing: { label: 'Đang xử lý', color: '#3B82F6', bgColor: '#DBEAFE', icon: 'construct' },
            completed: { label: 'Hoàn thành', color: '#10B981', bgColor: '#D1FAE5', icon: 'checkmark-circle' },
            returned: { label: 'Đã trả', color: '#6B7280', bgColor: '#F3F4F6', icon: 'arrow-undo' },
            cancelled: { label: 'Đã hủy', color: '#EF4444', bgColor: '#FEE2E2', icon: 'close-circle' },
        };
        return configs[status] || configs.received;
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    if (!warranty) {
        return (
            <View style={styles.loadingContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
                <Text style={styles.loadingText}>Không tìm thấy phiếu bảo hành</Text>
            </View>
        );
    }

    const statusConfig = getStatusConfig(warranty.status);

    return (
        <View style={styles.container}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />
                }
            >
                {/* Header Card */}
                <View style={styles.headerCard}>
                    <LinearGradient
                        colors={['#F97316', '#EA580C']}
                        style={styles.headerGradient}
                    >
                        <Ionicons name={statusConfig.icon} size={40} color="#fff" />
                        <Text style={styles.headerCode}>{warranty.code}</Text>
                        <View style={[styles.headerStatusBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                            <Text style={styles.headerStatusText}>{statusConfig.label}</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Customer Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông Tin Khách Hàng</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="person" size={20} color="#F97316" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Tên khách hàng</Text>
                                <Text style={styles.infoValue}>{warranty.customers?.name || 'N/A'}</Text>
                            </View>
                        </View>
                        {warranty.customers?.code && (
                            <View style={styles.infoRow}>
                                <Ionicons name="pricetag" size={20} color="#F97316" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Mã khách hàng</Text>
                                    <Text style={styles.infoValue}>{warranty.customers.code}</Text>
                                </View>
                            </View>
                        )}
                        {warranty.customers?.phone && (
                            <View style={styles.infoRow}>
                                <Ionicons name="call" size={20} color="#F97316" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Số điện thoại</Text>
                                    <Text style={styles.infoValue}>{warranty.customers.phone}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Product Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông Tin Sản Phẩm</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="cube" size={20} color="#F97316" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Sản phẩm</Text>
                                <Text style={styles.infoValue}>{warranty.products?.name || 'N/A'}</Text>
                            </View>
                        </View>
                        {warranty.serial_number && (
                            <View style={styles.infoRow}>
                                <Ionicons name="barcode" size={20} color="#F97316" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Serial Number</Text>
                                    <Text style={styles.infoValue}>{warranty.serial_number}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Warranty Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông Tin Bảo Hành</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar" size={20} color="#F97316" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Ngày tiếp nhận</Text>
                                <Text style={styles.infoValue}>{formatDate(warranty.received_date)}</Text>
                            </View>
                        </View>
                        {warranty.expected_date && (
                            <View style={styles.infoRow}>
                                <Ionicons name="time" size={20} color="#F97316" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Dự kiến hoàn thành</Text>
                                    <Text style={styles.infoValue}>{formatDate(warranty.expected_date)}</Text>
                                </View>
                            </View>
                        )}
                        {warranty.completed_date && (
                            <View style={styles.infoRow}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Ngày hoàn thành</Text>
                                    <Text style={[styles.infoValue, { color: '#10B981' }]}>
                                        {formatDate(warranty.completed_date)}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Problem Description */}
                {warranty.problem_description && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Mô Tả Lỗi</Text>
                        <View style={styles.descriptionCard}>
                            <Text style={styles.descriptionText}>{warranty.problem_description}</Text>
                        </View>
                    </View>
                )}

                {/* Notes */}
                {warranty.notes && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ghi Chú</Text>
                        <View style={styles.descriptionCard}>
                            <Text style={styles.descriptionText}>{warranty.notes}</Text>
                        </View>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionsSection}>
                    {warranty.status === 'received' && (
                        <>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleUpdateStatus('processing')}
                            >
                                <LinearGradient
                                    colors={['#3B82F6', '#2563EB']}
                                    style={styles.actionButtonGradient}
                                >
                                    <Ionicons name="construct" size={20} color="#fff" />
                                    <Text style={styles.actionButtonText}>Bắt đầu xử lý</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleEdit}
                            >
                                <Ionicons name="pencil" size={20} color="#F97316" />
                                <Text style={styles.secondaryButtonText}>Sửa phiếu</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.dangerButton}
                                onPress={handleDelete}
                            >
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                <Text style={styles.dangerButtonText}>Xóa phiếu</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {warranty.status === 'processing' && (
                        <>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleUpdateStatus('completed')}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    style={styles.actionButtonGradient}
                                >
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    <Text style={styles.actionButtonText}>Hoàn thành</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleEdit}
                            >
                                <Ionicons name="pencil" size={20} color="#F97316" />
                                <Text style={styles.secondaryButtonText}>Sửa phiếu</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {warranty.status === 'completed' && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleUpdateStatus('returned')}
                        >
                            <LinearGradient
                                colors={['#6B7280', '#4B5563']}
                                style={styles.actionButtonGradient}
                            >
                                <Ionicons name="arrow-undo" size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Đã trả hàng</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

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
    headerCard: {
        margin: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    headerGradient: {
        padding: 24,
        alignItems: 'center',
    },
    headerCode: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 12,
        marginBottom: 8,
    },
    headerStatusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    headerStatusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },
    descriptionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    descriptionText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    actionsSection: {
        padding: 16,
        gap: 12,
        paddingBottom: 32,
    },
    actionButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#F97316',
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F97316',
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#EF4444',
        gap: 8,
    },
    dangerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
    },
});
