import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const AnimatedLoadingSpinner = ({ 
  visible = true, 
  message = "Đang tải...", 
  type = "default", // default, pulse, rotate, fade, bounce
  overlay = true 
}) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      startAnimations();
    } else {
      stopAnimations();
    }
  }, [visible]);

  const startAnimations = () => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Scale animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -20,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopAnimations = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const getRotation = () => {
    return rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
  };

  const renderLoadingContent = () => {
    switch (type) {
      case 'pulse':
        return (
          <Animated.View
            style={[
              styles.loadingContent,
              {
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            <MaterialCommunityIcons name="loading" size={50} color="#1976D2" />
            <Text style={styles.loadingText}>{message}</Text>
          </Animated.View>
        );

      case 'rotate':
        return (
          <Animated.View
            style={[
              styles.loadingContent,
              {
                transform: [{ rotate: getRotation() }]
              }
            ]}
          >
            <MaterialCommunityIcons name="sync" size={50} color="#1976D2" />
            <Text style={styles.loadingText}>{message}</Text>
          </Animated.View>
        );

      case 'bounce':
        return (
          <View style={styles.loadingContent}>
            <Animated.View
              style={[
                styles.bounceContainer,
                {
                  transform: [{ translateY: bounceAnim }]
                }
              ]}
            >
              <MaterialCommunityIcons name="package-variant" size={50} color="#1976D2" />
            </Animated.View>
            <Text style={styles.loadingText}>{message}</Text>
          </View>
        );

      case 'fade':
        return (
          <View style={styles.loadingContent}>
            <View style={styles.fadeDotsContainer}>
              {[0, 1, 2].map((index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.fadeDot,
                    {
                      opacity: fadeAnim,
                      transform: [{ scale: scaleAnim }]
                    }
                  ]}
                />
              ))}
            </View>
            <Text style={styles.loadingText}>{message}</Text>
          </View>
        );

      default:
        return (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#1976D2" />
            <Text style={styles.loadingText}>{message}</Text>
          </View>
        );
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim }
      ]}
    >
      {overlay && (
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)']}
          style={styles.overlay}
        />
      )}
      
      <Animated.View
        style={[
          styles.loadingContainer,
          {
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={styles.loadingCard}
        >
          {renderLoadingContent()}
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    minWidth: 150,
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  bounceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fadeDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fadeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1976D2',
    marginHorizontal: 4,
  },
});

export default AnimatedLoadingSpinner;