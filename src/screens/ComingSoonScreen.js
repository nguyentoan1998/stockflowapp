import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/ui/Card';
import { Colors, Spacing, Typography } from '../theme';

export default function ComingSoonScreen({ route }) {
  const { title = 'Chức năng', icon = 'construct' } = route.params || {};

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Ionicons name={icon} size={64} color={Colors.primary} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Đang phát triển</Text>
        <Text style={styles.description}>
          Tính năng này đang được xây dựng và sẽ sớm có mặt trong phiên bản tiếp theo.
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
