import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme';

export default function Avatar({
  source,
  name,
  size = 'medium', // small, medium, large, xlarge
  rounded = true,
  showBadge = false,
  badgeColor = Colors.success,
  style,
}) {
  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return 32;
      case 'medium':
        return 48;
      case 'large':
        return 64;
      case 'xlarge':
        return 96;
      default:
        return 48;
    }
  };

  const getInitials = () => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const sizeValue = getSizeValue();
  const fontSize = sizeValue / 2.5;
  const badgeSize = sizeValue / 4;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.avatar,
          {
            width: sizeValue,
            height: sizeValue,
            borderRadius: rounded ? sizeValue / 2 : 12,
          },
          Shadows.card,
        ]}
      >
        {source ? (
          <Image
            source={typeof source === 'string' ? { uri: source } : source}
            style={[
              styles.image,
              {
                width: sizeValue,
                height: sizeValue,
                borderRadius: rounded ? sizeValue / 2 : 12,
              },
            ]}
          />
        ) : name ? (
          <Text style={[styles.initials, { fontSize }]}>{getInitials()}</Text>
        ) : (
          <Ionicons name="person" size={fontSize * 1.5} color={Colors.surface} />
        )}
      </View>

      {showBadge && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: badgeColor,
              right: rounded ? 0 : -badgeSize / 4,
              bottom: rounded ? 0 : -badgeSize / 4,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: Colors.surface,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
});
