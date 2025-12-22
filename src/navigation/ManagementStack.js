import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Colors, Typography, Shadows } from '../theme';

// Screens
import ManagementScreen from '../screens/ManagementScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import TeamsScreen from '../screens/Categories/TeamsScreen';
import PositionsScreen from '../screens/Categories/PositionsScreen';
import CustomersScreen from '../screens/Categories/CustomersScreen';
import SuppliersScreen from '../screens/Categories/SuppliersScreen';
import UnitsScreen from '../screens/Categories/UnitsScreen';
import ProductCategoryScreen from '../screens/Categories/ProductCategoryScreen';
import MaterialGroupsScreen from '../screens/Categories/MaterialGroupsScreen';
import WarehousesScreen from '../screens/Categories/WarehousesScreen';
import StaffScreen from '../screens/Categories/StaffScreen';
import StaffDetailScreen from '../screens/Categories/StaffDetailScreen';
import StaffFormScreen from '../screens/Categories/StaffFormScreen';
import ProductsScreen from '../screens/Categories/ProductsScreen';
import ProductDetailScreen from '../screens/Categories/ProductDetailScreen';
import ProductFormScreen from '../screens/Categories/ProductFormScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';

const Stack = createStackNavigator();

export default function ManagementStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          ...Typography.h3,
          color: '#FFFFFF',
        },
        headerShadowVisible: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen 
        name="ManagementHome" 
        component={ManagementScreen}
        options={{ title: 'Quản lý', headerShown: false }}
      />
      <Stack.Screen 
        name="Categories" 
        component={CategoriesScreen}
        options={{ 
          title: 'Danh mục',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Organization" 
        component={TeamsScreen}
        options={{ 
          title: 'Cơ cấu tổ chức',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Teams" 
        component={TeamsScreen}
        options={{ 
          title: 'Phòng ban',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Positions" 
        component={PositionsScreen}
        options={{ 
          title: 'Chức vụ',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Customers" 
        component={CustomersScreen}
        options={{ 
          title: 'Khách hàng',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Suppliers" 
        component={SuppliersScreen}
        options={{ 
          title: 'Nhà cung cấp',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Units" 
        component={UnitsScreen}
        options={{ 
          title: 'Đơn vị',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="ProductCategory" 
        component={ProductCategoryScreen}
        options={{ 
          title: 'Danh mục sản phẩm',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="MaterialGroups" 
        component={MaterialGroupsScreen}
        options={{ 
          title: 'Nhóm vật tư',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Warehouses" 
        component={WarehousesScreen}
        options={{ 
          title: 'Kho hàng',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Staff" 
        component={StaffScreen}
        options={{ 
          title: 'Nhân viên',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="StaffDetail" 
        component={StaffDetailScreen}
        options={{ 
          title: 'Chi tiết nhân viên',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="StaffForm" 
        component={StaffFormScreen}
        options={{ 
          title: 'Nhân viên',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Products" 
        component={ProductsScreen}
        options={{ 
          title: 'Vật tư',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{ 
          title: 'Chi tiết vật tư',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ProductForm" 
        component={ProductFormScreen}
        options={{ 
          title: 'Vật tư',
          headerShown: false,
        }}
      />
      
      {/* Placeholder screens for other routes */}
      <Stack.Screen name="Expense" component={ComingSoonScreen} options={{ title: 'Chi' }} />
      <Stack.Screen name="Income" component={ComingSoonScreen} options={{ title: 'Thu' }} />
      <Stack.Screen name="FundReport" component={ComingSoonScreen} options={{ title: 'Báo cáo quỹ' }} />
      <Stack.Screen name="PurchaseOrders" component={ComingSoonScreen} options={{ title: 'Đơn mua hàng' }} />
      <Stack.Screen name="Purchasing" component={ComingSoonScreen} options={{ title: 'Mua hàng' }} />
      <Stack.Screen name="ReturnError" component={ComingSoonScreen} options={{ title: 'Trả hàng mua' }} />
      <Stack.Screen name="AccountsPayable" component={ComingSoonScreen} options={{ title: 'Công nợ phải trả' }} />
      <Stack.Screen name="Report" component={ComingSoonScreen} options={{ title: 'Báo cáo mua hàng' }} />
      <Stack.Screen name="SalesOrders" component={ComingSoonScreen} options={{ title: 'Đơn đặt hàng' }} />
      <Stack.Screen name="Sales" component={ComingSoonScreen} options={{ title: 'Bán hàng' }} />
      <Stack.Screen name="Warranty" component={ComingSoonScreen} options={{ title: 'Hàng bảo hành' }} />
      <Stack.Screen name="AccountsReceivable" component={ComingSoonScreen} options={{ title: 'Công nợ phải thu' }} />
      <Stack.Screen name="SalesReport" component={ComingSoonScreen} options={{ title: 'Báo cáo bán hàng' }} />
      <Stack.Screen name="Inventory" component={ComingSoonScreen} options={{ title: 'Tồn kho' }} />
      <Stack.Screen name="Input" component={ComingSoonScreen} options={{ title: 'Nhập kho' }} />
      <Stack.Screen name="Output" component={ComingSoonScreen} options={{ title: 'Xuất kho' }} />
      <Stack.Screen name="Transfer" component={ComingSoonScreen} options={{ title: 'Chuyển kho' }} />
      <Stack.Screen name="InventoryCheck" component={ComingSoonScreen} options={{ title: 'Kiểm kê' }} />
      <Stack.Screen name="Adjustment" component={ComingSoonScreen} options={{ title: 'Điều chỉnh' }} />
      <Stack.Screen name="ProductionOrder" component={ComingSoonScreen} options={{ title: 'Lệnh sản xuất' }} />
      <Stack.Screen name="ProductionPlan" component={ComingSoonScreen} options={{ title: 'Kế hoạch SX' }} />
      <Stack.Screen name="MaterialRequest" component={ComingSoonScreen} options={{ title: 'Yêu cầu vật tư' }} />
      <Stack.Screen name="ProductionReport" component={ComingSoonScreen} options={{ title: 'Báo cáo SX' }} />
      <Stack.Screen name="Attendance" component={ComingSoonScreen} options={{ title: 'Chấm công' }} />
      <Stack.Screen name="ProductSummary" component={ComingSoonScreen} options={{ title: 'Tổng hợp SP' }} />
      <Stack.Screen name="TeamSummary" component={ComingSoonScreen} options={{ title: 'Tổng hợp SP tổ' }} />
      <Stack.Screen name="Salary" component={ComingSoonScreen} options={{ title: 'Tính lương' }} />
      <Stack.Screen name="Insurance" component={ComingSoonScreen} options={{ title: 'Bảo hiểm' }} />
      <Stack.Screen name="SalaryReport" component={ComingSoonScreen} options={{ title: 'Báo cáo lương' }} />
      <Stack.Screen name="Users" component={ComingSoonScreen} options={{ title: 'Người dùng' }} />
      <Stack.Screen name="Roles" component={ComingSoonScreen} options={{ title: 'Phân quyền' }} />
      <Stack.Screen name="Backup" component={ComingSoonScreen} options={{ title: 'Sao lưu' }} />
    </Stack.Navigator>
  );
}