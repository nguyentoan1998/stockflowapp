import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/ui/Card';
import { Colors, Spacing, Typography } from '../theme';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.comingSoonCard}>
          <Ionicons name="chatbubbles" size={64} color={Colors.primary} />
          <Text style={styles.title}>Chat & Messaging</Text>
          <Text style={styles.subtitle}>Tính năng đang được phát triển</Text>
          <Text style={styles.description}>
            Sắp có: Chat nhóm, tin nhắn trực tiếp, chia sẻ file, và nhiều hơn nữa!
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  comingSoonCard: {
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
