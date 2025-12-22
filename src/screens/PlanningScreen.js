import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Animated,
  Alert,
  Dimensions
} from 'react-native';
import { 
  Card, 
  Text, 
  Button, 
  FAB,
  Chip,
  ProgressBar,
  SegmentedButtons
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function PlanningScreen() {
  const [viewMode, setViewMode] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Mock data for planning
  const mockPlans = [
    {
      id: 1,
      title: 'Nhập kho quý 1',
      description: 'Lập kế hoạch nhập hàng cho quý đầu năm',
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      progress: 75,
      status: 'in_progress',
      priority: 'high',
      category: 'inventory'
    },
    {
      id: 2,
      title: 'Kiểm kê tháng 1',
      description: 'Thực hiện kiểm kê định kỳ hàng hóa',
      startDate: '2024-01-25',
      endDate: '2024-01-31',
      progress: 100,
      status: 'completed',
      priority: 'medium',
      category: 'audit'
    },
    {
      id: 3,
      title: 'Tối ưu quy trình',
      description: 'Cải thiện quy trình xuất nhập kho',
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      progress: 30,
      status: 'planning',
      priority: 'low',
      category: 'process'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#2196F3';
      case 'planning': return '#FF9800';
      case 'delayed': return '#f44336';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'in_progress': return 'Đang thực hiện';
      case 'planning': return 'Đang lên kế hoạch';
      case 'delayed': return 'Trễ hạn';
      default: return 'Không xác định';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return '';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'inventory': return 'package-variant';
      case 'audit': return 'clipboard-check';
      case 'process': return 'cog';
      default: return 'calendar';
    }
  };

  const renderStatsHeader = () => (
    <LinearGradient
      colors={['#9C27B0', '#BA68C8']}
      style={styles.headerCard}
    >
      <View style={styles.headerContent}>
        <MaterialCommunityIcons name="calendar-clock" size={40} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Kế hoạch & Lịch trình</Text>
        <Text style={styles.headerSubtitle}>
          {new Date().toLocaleDateString('vi-VN', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>
    </LinearGradient>
  );

  const renderProgressSummary = () => (
    <Card style={styles.summaryCard}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Tổng quan tiến độ
        </Text>
        
        <View style={styles.progressGrid}>
          <View style={styles.progressItem}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.progressNumber}>
              {mockPlans.filter(p => p.status === 'completed').length}
            </Text>
            <Text style={styles.progressLabel}>Hoàn thành</Text>
          </View>
          
          <View style={styles.progressItem}>
            <MaterialCommunityIcons name="progress-clock" size={24} color="#2196F3" />
            <Text style={styles.progressNumber}>
              {mockPlans.filter(p => p.status === 'in_progress').length}
            </Text>
            <Text style={styles.progressLabel}>Đang thực hiện</Text>
          </View>
          
          <View style={styles.progressItem}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#FF9800" />
            <Text style={styles.progressNumber}>
              {mockPlans.filter(p => p.status === 'planning').length}
            </Text>
            <Text style={styles.progressLabel}>Lên kế hoạch</Text>
          </View>
          
          <View style={styles.progressItem}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#f44336" />
            <Text style={styles.progressNumber}>0</Text>
            <Text style={styles.progressLabel}>Trễ hạn</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderPlanItem = (plan) => (
    <Animated.View
      key={plan.id}
      style={[
        styles.planItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Card style={styles.planCard} elevation={3}>
        <Card.Content style={styles.planContent}>
          <View style={styles.planHeader}>
            <View style={styles.planTitleRow}>
              <MaterialCommunityIcons 
                name={getCategoryIcon(plan.category)} 
                size={20} 
                color="#1976D2" 
              />
              <Text variant="titleMedium" style={styles.planTitle}>
                {plan.title}
              </Text>
            </View>
            
            <View style={styles.planBadges}>
              <Chip
                mode="flat"
                compact
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(plan.status) + '20' }
                ]}
                textStyle={{ color: getStatusColor(plan.status), fontSize: 10 }}
              >
                {getStatusText(plan.status)}
              </Chip>
              
              <Chip
                mode="flat"
                compact
                style={[
                  styles.priorityChip,
                  { backgroundColor: getPriorityColor(plan.priority) + '20' }
                ]}
                textStyle={{ color: getPriorityColor(plan.priority), fontSize: 10 }}
              >
                {getPriorityText(plan.priority)}
              </Chip>
            </View>
          </View>

          <Text style={styles.planDescription}>
            {plan.description}
          </Text>

          <View style={styles.planDates}>
            <View style={styles.dateItem}>
              <MaterialCommunityIcons name="calendar-start" size={16} color="#666" />
              <Text style={styles.dateText}>
                Bắt đầu: {new Date(plan.startDate).toLocaleDateString('vi-VN')}
              </Text>
            </View>
            <View style={styles.dateItem}>
              <MaterialCommunityIcons name="calendar-end" size={16} color="#666" />
              <Text style={styles.dateText}>
                Kết thúc: {new Date(plan.endDate).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Tiến độ</Text>
              <Text style={styles.progressPercent}>{plan.progress}%</Text>
            </View>
            <ProgressBar 
              progress={plan.progress / 100} 
              color={getStatusColor(plan.status)}
              style={styles.progressBar}
            />
          </View>

          <View style={styles.planActions}>
            <Button
              mode="outlined"
              compact
              onPress={() => Alert.alert('Chi tiết', `Xem chi tiết kế hoạch: ${plan.title}`)}
              style={styles.actionButton}
            >
              Chi tiết
            </Button>
            <Button
              mode="contained"
              compact
              onPress={() => Alert.alert('Cập nhật', `Cập nhật tiến độ: ${plan.title}`)}
              style={styles.actionButton}
              buttonColor="#1976D2"
            >
              Cập nhật
            </Button>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {renderStatsHeader()}

        <View style={styles.filtersContainer}>
          <SegmentedButtons
            value={viewMode}
            onValueChange={setViewMode}
            buttons={[
              { value: 'week', label: 'Tuần', icon: 'calendar-week' },
              { value: 'month', label: 'Tháng', icon: 'calendar-month' },
              { value: 'quarter', label: 'Quý', icon: 'calendar-range' },
            ]}
            style={styles.viewModeToggle}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {renderProgressSummary()}

          <View style={styles.plansSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Kế hoạch hiện tại
            </Text>
            
            {mockPlans.map(renderPlanItem)}
          </View>
        </ScrollView>

        <FAB
          icon="plus"
          label="Thêm KH"
          style={styles.fab}
          onPress={() => Alert.alert('Chức năng', 'Thêm kế hoạch đang phát triển')}
          color="#FFFFFF"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerContent: {
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  headerSubtitle: {
    color: '#F3E5F5',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  viewModeToggle: {
    backgroundColor: '#FFFFFF',
  },
  summaryCard: {
    margin: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  plansSection: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  planItem: {
    marginBottom: 12,
  },
  planCard: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  planContent: {
    padding: 16,
  },
  planHeader: {
    marginBottom: 12,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  planBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    borderRadius: 12,
  },
  priorityChip: {
    borderRadius: 12,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  planDates: {
    marginBottom: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  planActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#9C27B0',
  },
});