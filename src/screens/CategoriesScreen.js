import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Surface,
  FAB,
  Portal,
  Modal,
  Button,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function CategoriesScreen() {
  const navigation = useNavigation();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(width));
  const [cardAnimations] = useState(
    Array(10).fill(0).map(() => new Animated.Value(0))
  );

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    const cardDelays = cardAnimations.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );

    Animated.stagger(80, cardDelays).start();
  }, []);

  const categoryModules = [
    {
      id: 'organization',
      title: 'Teams',
      icon: 'account-group',
      color: '#E91E63',
      count: 12,
    },
    {
      id: 'positions',
      title: 'Chức vụ',
      icon: 'briefcase',
      color: '#9C27B0',
      count: 8,
    },
    {
      id: 'employees',
      title: 'Nhân viên',
      icon: 'account-multiple',
      color: '#673AB7',
      count: 156,
    },
    {
      id: 'customers',
      title: 'Khách hàng',
      icon: 'account-heart',
      color: '#3F51B5',
      count: 89,
    },
    {
      id: 'suppliers',
      title: 'Nhà cung cấp',
      icon: 'truck',
      color: '#2196F3',
      count: 45,
    },
    {
      id: 'units',
      title: 'Đơn vị tính',
      icon: 'scale-balance',
      color: '#00BCD4',
      count: 25,
    },
    {
      id: 'material_groups',
      title: 'Loại sản phẩm',
      icon: 'shape',
      color: '#4CAF50',
      count: 18,
    },
    {
      id: 'materials',
      title: 'Sản phẩm',
      icon: 'package-variant',
      color: '#FF9800',
      count: 234,
    },
    {
      id: 'warehouses',
      title: 'Kho hàng',
      icon: 'warehouse',
      color: '#FF5722',
      count: 6,
    },
    {
      id: 'inventory',
      title: 'Tồn kho',
      icon: 'package-check',
      color: '#00897B',
      count: 234,
    },
  ];

  const handleModulePress = (module) => {
    // Scale animation on press
    const scaleAnim = new Animated.Value(1);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate based on module
    setTimeout(() => {
      switch (module.id) {
        case 'organization':
          navigation.navigate('Organization');
          break;
        case 'positions':
          navigation.navigate('Positions');
          break;
        case 'customers':
          navigation.navigate('Customers');
          break;
        case 'suppliers':
          navigation.navigate('Suppliers');
          break;
        case 'units':
          navigation.navigate('Units');
          break;
        case 'material_groups':
          navigation.navigate('MaterialGroups');
          break;
        case 'warehouses':
          navigation.navigate('Warehouses');
          break;
        case 'inventory':
          navigation.navigate('Inventory');
          break;
        case 'employees':
          navigation.navigate('Staff');
          break;
        case 'materials' :
          navigation.navigate('Products');
          break;
        default:
      }
    }, 200);
  };

  const renderModuleCard = (module, index) => {
    const cardScale = cardAnimations[index]?.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    }) || 1;

    const cardOpacity = cardAnimations[index] || 1;

    return (
      <Animated.View
        key={module.id}
        style={[
          styles.cardWrapper,
          {
            opacity: cardOpacity,
            transform: [{ scale: cardScale }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleModulePress(module)}
        >
          <Card style={[styles.moduleCard, { backgroundColor: module.color }]}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Icon name={module.icon} size={48} color="#fff" />
              </View>
              
              <Text variant="titleMedium" style={styles.moduleTitle}>
                {module.title}
              </Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.headerContent}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Danh mục
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Quản lý thông tin cơ bản
          </Text>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.modulesGrid}>
            {categoryModules.map((module, index) => renderModuleCard(module, index))}
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  headerContent: {
    marginBottom: 0,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
    fontSize: 28,
  },
  headerSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  moduleCard: {
    elevation: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 16,
  },
  moduleTitle: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
  },
  summaryCard: {
    padding: 16,
    elevation: 6,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  summaryTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  summaryLabel: {
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#999',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
    elevation: 8,
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  input: {
    marginBottom: 12,
  },
});