import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Reusable List Card Component
 * Based on Staff and Product screen designs
 * 
 * @param {string} title - Main title/name
 * @param {string} subtitle - Code or subtitle
 * @param {string} imageUrl - Optional image URL
 * @param {string} imageIcon - Icon to show if no image (default: 'cube')
 * @param {array} details - Array of detail items: [{ icon, text, color }]
 * @param {object} badge - Badge config: { text, color, bgColor, icon }
 * @param {array} actions - Action buttons: [{ label, icon, color, onPress }]
 * @param {function} onPress - Card press handler
 * @param {object} statusDot - Status dot: { color }
 */
const ListCard = ({
  title,
  subtitle,
  imageUrl,
  imageIcon = 'cube',
  details = [],
  badge,
  actions = [],
  onPress,
  statusDot,
  style,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      style={[styles.card, style]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA']}
        style={styles.cardGradient}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          {/* Image/Icon */}
          <View style={styles.imageWrapper}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
              />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <MaterialCommunityIcons name={imageIcon} size={32} color="#999" />
              </View>
            )}
            {statusDot && (
              <View style={[styles.statusDot, { backgroundColor: statusDot.color }]} />
            )}
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            {/* Title Row */}
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {badge && (
                <View style={[styles.badge, { backgroundColor: badge.bgColor }]}>
                  {badge.icon && (
                    <MaterialCommunityIcons name={badge.icon} size={10} color={badge.color} />
                  )}
                  <Text style={[styles.badgeText, { color: badge.color }]}>
                    {badge.text}
                  </Text>
                </View>
              )}
            </View>

            {/* Subtitle/Code */}
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}

            {/* Details */}
            {details.map((detail, index) => (
              <View key={index} style={styles.detailRow}>
                <MaterialCommunityIcons 
                  name={detail.icon} 
                  size={13} 
                  color={detail.color || '#666'} 
                />
                <Text style={[styles.detailText, detail.color && { color: detail.color }]} numberOfLines={1}>
                  {detail.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions Footer */}
        {actions.length > 0 && (
          <View style={styles.cardFooter}>
            {actions.map((action, index) => (
              <React.Fragment key={index}>
                {index > 0 && <View style={styles.actionDivider} />}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    action.onPress && action.onPress();
                  }}
                >
                  <MaterialCommunityIcons name={action.icon} size={18} color={action.color} />
                  <Text style={[styles.actionText, { color: action.color }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6200EE',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
});

export default ListCard;
