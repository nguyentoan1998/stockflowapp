import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Typography, Spacing } from '../../theme';

export default function Chip({
  children,
  icon,
  onPress,
  onDelete,
  selected = false,
  disabled = false,
  variant = 'default', // default, primary, secondary
  style,
  textStyle,
}) {
  const getVariantStyle = () => {
    if (selected) {
      switch (variant) {
        case 'primary':
          return {
            backgroundColor: Colors.primary,
            borderColor: Colors.primary,
            textColor: Colors.surface,
          };
        case 'secondary':
          return {
            backgroundColor: Colors.secondary,
            borderColor: Colors.secondary,
            textColor: Colors.surface,
          };
        default:
          return {
            backgroundColor: Colors.primary,
            borderColor: Colors.primary,
            textColor: Colors.surface,
          };
      }
    }

    return {
      backgroundColor: Colors.surfaceVariant,
      borderColor: Colors.border,
      textColor: Colors.text,
    };
  };

  const variantStyle = getVariantStyle();

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={variantStyle.textColor}
          style={styles.icon}
        />
      )}
      
      <Text
        style={[
          styles.text,
          { color: variantStyle.textColor },
          textStyle,
        ]}
      >
        {children}
      </Text>

      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.deleteButton}
        >
          <Ionicons
            name="close-circle"
            size={16}
            color={variantStyle.textColor}
          />
        </TouchableOpacity>
      )}
    </Component>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: Spacing.xs,
  },
  text: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  deleteButton: {
    marginLeft: Spacing.xs,
  },
  disabled: {
    opacity: 0.5,
  },
});
