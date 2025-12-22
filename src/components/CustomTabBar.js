import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows, Typography } from '../theme';

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  const getIcon = (routeName, focused) => {
    let iconName;
    let size = 24;
    let label = '';

    switch (routeName) {
      case 'Attendance':
        iconName = focused ? 'time' : 'time-outline';
        label = 'Chấm công';
        break;
      case 'Products':
        iconName = focused ? 'cube' : 'cube-outline';
        label = 'Sản phẩm';
        break;
      case 'Chat':
        iconName = 'chatbubble-ellipses';
        size = 32; // Center button larger
        label = 'Chat';
        break;
      case 'Management':
        iconName = focused ? 'briefcase' : 'briefcase-outline';
        label = 'Quản lý';
        break;
      case 'System':
        iconName = focused ? 'settings' : 'settings-outline';
        label = 'Hệ thống';
        break;
      default:
        iconName = 'ellipse';
        label = '';
    }

    return { iconName, size, label };
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 8 }]}>
      {/* Shadow overlay */}
      <View style={styles.shadowOverlay} />
      
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isCenter = route.name === 'Chat';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const { iconName, size, label } = getIcon(route.name, isFocused);

          // Center button (Chat)
          if (isCenter) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.centerButtonContainer}
                activeOpacity={0.7}
              >
                <View style={[styles.centerButton, Shadows.colored(Colors.primary)]}>
                  <Ionicons
                    name={iconName}
                    size={size}
                    color={Colors.surface}
                  />
                </View>
                <Text style={[styles.tabLabel, styles.centerLabel]}>{label}</Text>
              </TouchableOpacity>
            );
          }

          // Regular tabs
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <Ionicons
                name={iconName}
                size={size}
                color={isFocused ? Colors.primary : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? Colors.primary : Colors.textSecondary }
                ]}
              >
                {label}
              </Text>
              {isFocused && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  shadowOverlay: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 20,
    ...Shadows.lg,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    ...Typography.caption,
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  centerLabel: {
    color: Colors.primary,
    marginTop: 6,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 2,
    position: 'absolute',
    bottom: 2,
  },
  centerButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.surface,
  },
});
