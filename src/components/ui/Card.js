import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Shadows } from '../../theme';

export default function Card({ children, style, elevated = true, ...props }) {
  return (
    <View
      style={[
        styles.card,
        elevated && Shadows.card,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 16,
  },
});
