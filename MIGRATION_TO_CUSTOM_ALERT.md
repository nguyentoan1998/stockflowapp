# Migration Guide: CustomDialog → CustomAlert

## Tổng quan

Đã xóa `CustomDialog` cũ và thay thế bằng `CustomAlert` mới với:
- ✅ Better animations
- ✅ Material Design
- ✅ Type-based icons & colors
- ✅ Easier API

---

## Files cần update

### Screens sử dụng CustomDialog (9 files):
1. WarehousesScreen.js
2. UnitsScreen.js
3. MaterialGroupsScreen.js
4. CustomersScreen.js
5. ProductCategoryScreen.js
6. TeamsScreen.js
7. StaffScreen.js
8. SuppliersScreen.js
9. PositionsScreen.js

### Screens sử dụng Alert.alert (12 files):
1. ProductFormScreen.js - 11 calls
2. StaffScreen.js - 2 calls
3. AttendanceScreen.js - 2 calls
4. StaffFormScreen.js - 6 calls
5. StaffDetailScreen.js - 2 calls
6. ProductsScreen.js - 8 calls
7. PlanningScreen.js - 3 calls
8. ProfileScreen.js - 6 calls
9. WarehouseManagementScreen.js - 7 calls

---

## Migration Steps

### Bước 1: Thay import

**CŨ:**
```javascript
import CustomDialog from '../../components/CustomDialog';
```

**MỚI:**
```javascript
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';
```

---

### Bước 2: Thêm state & helper

**Thêm vào component:**
```javascript
const [alertConfig, setAlertConfig] = useState({ visible: false });
const Alert = createAlertHelper(setAlertConfig);
```

---

### Bước 3: Thay thế CustomDialog

**CŨ:**
```javascript
<CustomDialog
  visible={successDialog}
  type="success"
  title="Thành công"
  message="Đã thêm thành công!"
  onClose={() => setSuccessDialog(false)}
/>
```

**MỚI:**
```javascript
// Thay state bằng Alert helper call
Alert.success('Thành công', 'Đã thêm thành công!');

// Xóa state:
// const [successDialog, setSuccessDialog] = useState(false);
```

---

### Bước 4: Render CustomAlert

**Thêm vào JSX:**
```javascript
return (
  <View style={styles.container}>
    <CustomAlert {...alertConfig} />
    {/* Rest of UI */}
  </View>
);
```

---

## Mapping Table

| Old CustomDialog | New CustomAlert |
|------------------|-----------------|
| `type="success"` | `Alert.success(title, msg)` |
| `type="error"` | `Alert.error(title, msg)` |
| `type="warning"` | `Alert.warning(title, msg)` |
| `type="confirm"` | `Alert.confirm(title, msg, onConfirm)` |

---

## Example Migration

### Before:
```javascript
import CustomDialog from '../../components/CustomDialog';

const MyScreen = () => {
  const [successDialog, setSuccessDialog] = useState(false);
  const [errorDialog, setErrorDialog] = useState(false);
  
  const handleSave = async () => {
    try {
      await api.save();
      setSuccessDialog(true);
    } catch (error) {
      setErrorDialog(true);
    }
  };
  
  return (
    <View>
      <CustomDialog
        visible={successDialog}
        type="success"
        title="Thành công"
        message="Đã lưu!"
        onClose={() => setSuccessDialog(false)}
      />
      <CustomDialog
        visible={errorDialog}
        type="error"
        title="Lỗi"
        message="Không thể lưu!"
        onClose={() => setErrorDialog(false)}
      />
    </View>
  );
};
```

### After:
```javascript
import CustomAlert from '../../components/CustomAlert';
import { createAlertHelper } from '../../utils/alertHelper';

const MyScreen = () => {
  const [alertConfig, setAlertConfig] = useState({ visible: false });
  const Alert = createAlertHelper(setAlertConfig);
  
  const handleSave = async () => {
    try {
      await api.save();
      Alert.success('Thành công', 'Đã lưu!');
    } catch (error) {
      Alert.error('Lỗi', 'Không thể lưu!');
    }
  };
  
  return (
    <View>
      <CustomAlert {...alertConfig} />
      {/* Rest of UI */}
    </View>
  );
};
```

---

## Benefits

✅ **Less code**: Không cần multiple state variables  
✅ **Easier**: Gọi như Alert.alert  
✅ **Beautiful**: Material Design với animations  
✅ **Consistent**: Cùng 1 style trong toàn app  

---

## Auto-migration Script

Tôi sẽ tự động migrate tất cả screens.

**Muốn tôi:**
- A. Auto-migrate từng screen một (review từng file)
- B. Auto-migrate tất cả cùng lúc (fast)
- C. Manual guide cho từng screen

---

**Chọn B để migrate nhanh nhất!** 🚀
