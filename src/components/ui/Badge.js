import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, BorderRadius } from '../../theme';

export default function Badge({
  children,
  variant = 'primary', // primary, secondary, success, warning, error, info
  size = 'medium', // small, medium, large
  style,
  textStyle,
}) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: `${Colors.primary}15`, color: Colors.primary };
      case 'secondary':
        return { backgroundColor: `${Colors.secondary}15`, color: Colors.secondary };
      case 'success':
        return { backgroundColor: `${Colors.success}15`, color: Colors.success };
      case 'warning':
        return { backgroundColor: `${Colors.warning}15`, color: Colors.warning };
      case 'error':
        return { backgroundColor: `${Colors.error}15`, color: Colors.error };
      case 'info':
        return { backgroundColor: `${Colors.info}15`, color: Colors.info };
      default:
        return { backgroundColor: `${Colors.primary}15`, color: Colors.primary };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10 };
      case 'medium':
        return { paddingHorizontal: 10, paddingVertical: 4, fontSize: 12 };
      case 'large':
        return { paddingHorizontal: 14, paddingVertical: 6, fontSize: 14 };
      default:
        return { paddingHorizontal: 10, paddingVertical: 4, fontSize: 12 };
    }
  };

  const variantStyle = getVariantStyle();
  const sizeStyle = getSizeStyle();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: variantStyle.backgroundColor },
        { paddingHorizontal: sizeStyle.paddingHorizontal, paddingVertical: sizeStyle.paddingVertical },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: variantStyle.color, fontSize: sizeStyle.fontSize },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
