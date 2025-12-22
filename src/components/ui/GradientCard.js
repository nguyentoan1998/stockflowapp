// Gradient Card Component with modern styling
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Shadows, BorderRadius } from '../../theme';

// Simple gradient simulation using layered views
// For true gradients, install expo-linear-gradient
export const GradientCard = memo(({ 
  children, 
  colors = Colors.gradients.primary,
  style,
  contentStyle,
}) => {
  return (
    <View style={[styles.container, { backgroundColor: colors[0] }, style]}>
      <View style={[styles.overlay, { backgroundColor: colors[1] }]} />
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
});

// Modern Card with shadow and animations
export const ModernCard = memo(({ 
  children, 
  style, 
  elevated = true,
  borderColor,
  onPress,
}) => {
  return (
    <View 
      style={[
        styles.modernCard, 
        elevated && Shadows.md,
        borderColor && { borderLeftWidth: 4, borderLeftColor: borderColor },
        style
      ]}
    >
      {children}
    </View>
  );
});

// Glass Card effect
export const GlassCard = memo(({ children, style }) => {
  return (
    <View style={[styles.glassCard, style]}>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  content: {
    padding: 20,
  },
  modernCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 16,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    padding: 16,
    ...Shadows.sm,
  },
});

export default { GradientCard, ModernCard, GlassCard };
