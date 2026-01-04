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
import WarehouseInventoryScreen from '../screens/warehouse/WarehouseInventoryScreen';
import WarehouseInventoryDetailScreen from '../screens/warehouse/WarehouseInventoryDetailScreen';
import WarehouseInputScreen from '../screens/warehouse/WarehouseInputScreen';
import WarehouseInputFormScreen from '../screens/warehouse/WarehouseInputFormScreen';
import WarehouseInputDetailScreen from '../screens/warehouse/WarehouseInputDetailScreen';
import WarehouseOutputScreen from '../screens/warehouse/WarehouseOutputScreen';
import WarehouseOutputFormScreen from '../screens/warehouse/WarehouseOutputFormScreen';
import WarehouseOutputDetailScreen from '../screens/warehouse/WarehouseOutputDetailScreen';
import WarehouseTransferScreen from '../screens/warehouse/WarehouseTransferScreen';
import WarehouseTransferFormScreen from '../screens/warehouse/WarehouseTransferFormScreen';
import WarehouseTransferDetailScreen from '../screens/warehouse/WarehouseTransferDetailScreen';
import InventoryCheckScreen from '../screens/warehouse/InventoryCheckScreen';
import InventoryCheckFormScreen from '../screens/warehouse/InventoryCheckFormScreen';
import InventoryCheckDetailScreen from '../screens/warehouse/InventoryCheckDetailScreen';
import InventoryAdjustmentScreen from '../screens/warehouse/InventoryAdjustmentScreen';
import InventoryAdjustmentFormScreen from '../screens/warehouse/InventoryAdjustmentFormScreen';
import InventoryAdjustmentDetailScreen from '../screens/warehouse/InventoryAdjustmentDetailScreen';

// Purchase screens
import PurchaseOrdersScreen from '../screens/purchases/PurchaseOrdersScreen';
import PurchaseOrderDetailScreen from '../screens/purchases/PurchaseOrderDetailScreen';
import PurchaseOrderFormScreen from '../screens/purchases/PurchaseOrderFormScreen';
import PurchasingScreen from '../screens/purchases/PurchasingScreen';
import PurchasingDetailScreen from '../screens/purchases/PurchasingDetailScreen';
import PurchasingFormScreen from '../screens/purchases/PurchasingFormScreen';
import ReturnErrorScreen from '../screens/purchases/ReturnErrorScreen';
import ReturnErrorFormScreen from '../screens/purchases/ReturnErrorFormScreen';
import AccountsPayableScreen from '../screens/purchases/AccountsPayableScreen';
import PayableDetailScreen from '../screens/purchases/PayableDetailScreen';
import PaymentFormScreen from '../screens/purchases/PaymentFormScreen';
import PurchaseReportsScreen from '../screens/purchases/PurchaseReportsScreen';

// Sales screens
import SalesOrdersScreen from '../screens/sales/SalesOrdersScreen';
import SalesOrderDetailScreen from '../screens/sales/SalesOrderDetailScreen';
import SalesOrderFormScreen from '../screens/sales/SalesOrderFormScreen';
import SalesDeliveriesScreen from '../screens/sales/SalesDeliveriesScreen';
import SalesDeliveryDetailScreen from '../screens/sales/SalesDeliveryDetailScreen';
import SalesDeliveryFormScreen from '../screens/sales/SalesDeliveryFormScreen';
import AccountsReceivableScreen from '../screens/sales/AccountsReceivableScreen';
import ReceivableDetailScreen from '../screens/sales/ReceivableDetailScreen';
import ReceiptFormScreen from '../screens/sales/ReceiptFormScreen';
import SalesReportsScreen from '../screens/sales/SalesReportsScreen';

// Warranty screens
import WarrantyListScreen from '../screens/warranty/WarrantyListScreen';
import WarrantyDetailScreen from '../screens/warranty/WarrantyDetailScreen';
import WarrantyFormScreen from '../screens/warranty/WarrantyFormScreen';
import WarrantyReportsScreen from '../screens/warranty/WarrantyReportsScreen';

// Production screens
import ProductionPlansScreen from '../screens/production/ProductionPlansScreen';
import ProductionOrdersScreen from '../screens/production/ProductionOrdersScreen';
import MaterialRequestsScreen from '../screens/production/MaterialRequestsScreen';

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
      <Stack.Screen
        name="PurchaseOrders"
        component={PurchaseOrdersScreen}
        options={{
          title: 'Đơn hàng mua',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="PurchaseOrderDetail"
        component={PurchaseOrderDetailScreen}
        options={{
          title: 'Chi tiết đơn hàng',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="PurchaseOrderForm"
        component={PurchaseOrderFormScreen}
        options={({ route }) => ({
          title: route.params?.mode === 'edit' ? 'Sửa đơn hàng' : 'Tạo đơn hàng mới',
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen
        name="Purchasing"
        component={PurchasingScreen}
        options={{
          title: 'Mua hàng',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="PurchasingDetail"
        component={PurchasingDetailScreen}
        options={{
          title: 'Chi tiết phiếu mua hàng',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="PurchasingForm"
        component={PurchasingFormScreen}
        options={({ route }) => ({
          title: route.params?.receiveId ? 'Sửa phiếu mua hàng' : 'Tạo phiếu mua hàng',
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen name="ReturnError" component={ReturnErrorScreen} options={{ title: 'Trả hàng mua' }} />
      <Stack.Screen
        name="ReturnErrorForm"
        component={ReturnErrorFormScreen}
        options={({ route }) => ({
          title: route.params?.returnItem ? 'Sửa phiếu trả hàng' : 'Tạo phiếu trả hàng',
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen
        name="AccountsPayable"
        component={AccountsPayableScreen}
        options={{
          title: 'Công nợ phải trả',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="PayableDetail"
        component={PayableDetailScreen}
        options={{
          title: 'Chi tiết công nợ',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="PaymentForm"
        component={PaymentFormScreen}
        options={{
          title: 'Thanh toán',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen name="Report" component={PurchaseReportsScreen} options={{ title: 'Báo cáo mua hàng' }} />

      {/* Sales Orders */}
      <Stack.Screen
        name="SalesOrders"
        component={SalesOrdersScreen}
        options={{ title: 'Đơn đặt hàng', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="SalesOrderDetail"
        component={SalesOrderDetailScreen}
        options={{ title: 'Chi tiết đơn hàng', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="SalesOrderForm"
        component={SalesOrderFormScreen}
        options={({ route }) => ({
          title: route.params?.mode === 'edit' ? 'Sửa đơn hàng' : 'Tạo đơn hàng mới',
          headerBackTitleVisible: false,
        })}
      />

      {/* Sales Deliveries */}
      <Stack.Screen
        name="SalesDeliveries"
        component={SalesDeliveriesScreen}
        options={{ title: 'Bán hàng', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="SalesDeliveryDetail"
        component={SalesDeliveryDetailScreen}
        options={{ title: 'Chi tiết phiếu xuất', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="SalesDeliveryForm"
        component={SalesDeliveryFormScreen}
        options={{ title: 'Phiếu xuất bán', headerBackTitleVisible: false }}
      />

      <Stack.Screen name="Warranty" component={ComingSoonScreen} options={{ title: 'Hàng bảo hành' }} />

      {/* Accounts Receivable */}
      <Stack.Screen
        name="AccountsReceivable"
        component={AccountsReceivableScreen}
        options={{ title: 'Công nợ phải thu', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="ReceivableDetail"
        component={ReceivableDetailScreen}
        options={{ title: 'Chi tiết công nợ', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="ReceiptForm"
        component={ReceiptFormScreen}
        options={{ title: 'Phiếu thu tiền', headerBackTitleVisible: false }}
      />

      <Stack.Screen name="SalesReports" component={SalesReportsScreen} options={{ title: 'Báo cáo bán hàng' }} />
      <Stack.Screen
        name="Inventory"
        component={WarehouseInventoryScreen}
        options={{
          title: 'Tồn kho',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="WarehouseInventoryDetail"
        component={WarehouseInventoryDetailScreen}
        options={{
          title: 'Chi tiết kho hàng',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Input"
        component={WarehouseInputScreen}
        options={{
          title: 'Nhập kho',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="WarehouseInputDetail"
        component={WarehouseInputDetailScreen}
        options={{
          title: 'Chi tiết phiếu nhập',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="WarehouseInputForm"
        component={WarehouseInputFormScreen}
        options={{
          title: 'Phiếu nhập kho',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Output"
        component={WarehouseOutputScreen}
        options={{
          title: 'Xuất kho',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="WarehouseOutputDetail"
        component={WarehouseOutputDetailScreen}
        options={{
          title: 'Chi tiết phiếu xuất',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="WarehouseOutputForm"
        component={WarehouseOutputFormScreen}
        options={{
          title: 'Phiếu xuất kho',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Transfer"
        component={WarehouseTransferScreen}
        options={{
          title: 'Chuyển kho',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="WarehouseTransferDetail"
        component={WarehouseTransferDetailScreen}
        options={{
          title: 'Chi tiết phiếu chuyển kho',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="WarehouseTransferForm"
        component={WarehouseTransferFormScreen}
        options={{
          title: 'Phiếu chuyển kho',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="InventoryCheck"
        component={InventoryCheckScreen}
        options={{
          title: 'Kiểm kê',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="InventoryCheckDetail"
        component={InventoryCheckDetailScreen}
        options={{
          title: 'Chi tiết phiếu kiểm kê',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="InventoryCheckForm"
        component={InventoryCheckFormScreen}
        options={{
          title: 'Phiếu kiểm kê',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Adjustment"
        component={InventoryAdjustmentScreen}
        options={{
          title: 'Điều chỉnh kho',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="InventoryAdjustmentDetail"
        component={InventoryAdjustmentDetailScreen}
        options={{
          title: 'Chi tiết phiếu điều chỉnh',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="InventoryAdjustmentForm"
        component={InventoryAdjustmentFormScreen}
        options={{
          title: 'Phiếu điều chỉnh kho',
          headerBackTitleVisible: false,
        }}
      />

      {/* ========== PURCHASE SCREENS ========== */}
      <Stack.Screen name="PurchaseReports" component={PurchaseReportsScreen} options={{ title: 'Báo cáo mua hàng' }} />

      {/* ========== WARRANTY SCREENS ========== */}
      <Stack.Screen
        name="WarrantyList"
        component={WarrantyListScreen}
        options={{
          title: 'Quản lý bảo hành',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="WarrantyDetail"
        component={WarrantyDetailScreen}
        options={{
          title: 'Chi tiết bảo hành',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="WarrantyForm"
        component={WarrantyFormScreen}
        options={{
          title: 'Phiếu bảo hành',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="WarrantyReports"
        component={WarrantyReportsScreen}
        options={{
          title: 'Báo cáo bảo hành',
          headerBackTitleVisible: false,
        }}
      />

      {/* ========== PRODUCTION SCREENS ========== */}
      <Stack.Screen
        name="ProductionPlan"
        component={ProductionPlansScreen}
        options={{ title: 'Kế hoạch sản xuất', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="ProductionOrder"
        component={ProductionOrdersScreen}
        options={{ title: 'Lệnh sản xuất', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="MaterialRequest"
        component={MaterialRequestsScreen}
        options={{ title: 'Yêu cầu vật tư', headerBackTitleVisible: false }}
      />

      {/* ========== OTHER COMING SOON SCREENS ========== */}
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