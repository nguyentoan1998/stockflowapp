import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function WarrantyReportsScreen() {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#F97316" />
            <Text style={styles.text}>Warranty Reports Screen</Text>
            <Text style={styles.subtext}>Coming soon - báo cáo bảo hành</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 20,
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 12,
    },
    subtext: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
    },
});
