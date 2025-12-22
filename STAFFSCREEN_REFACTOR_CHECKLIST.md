# 📋 StaffScreen Refactor Checklist

## 🎯 Mục tiêu

Refactor StaffScreen từ Modal-based sang Navigation-based (giống ProductsScreen) để có UX tốt hơn và code dễ maintain hơn.

---

## 📊 Current State Analysis

### StaffScreen hiện tại (Modal-based)
- ✅ **Đã có CustomAlert** - Hoàn thành!
- ❌ **Sử dụng Modal** để add/edit nhân viên (~400 dòng code trong modal)
- ❌ **SwipeableCard component** với PanResponder (~150 dòng)
- ❌ **ScrollView** với nhiều logic phức tạp
- ⚠️ **Còn 2 Alert.alert** cho image picker action sheets (lines 774, 786)
- ✅ **Optimistic updates** hoạt động tốt
- ✅ **Form validation** đầy đủ (9 validations)

### Screens đã có sẵn
- ✅ **StaffFormScreen** - Đã tồn tại, đã dùng CustomAlert
- ❌ **StaffDetailScreen** - Chưa có, cần tạo mới

---

## 🚀 Refactor Plan

### Phase 1: Tạo StaffDetailScreen ⏳
**Mục đích:** Màn hình xem chi tiết nhân viên (read-only)

**Tasks:**
- [ ] Tạo file `StaffDetailScreen.js`
- [ ] Dựa trên ProductDetailScreen làm template
- [ ] Hiển thị đầy đủ thông tin: Avatar, Name, Email, Phone, CMND, DOB, Gender, Position, Team, Status
- [ ] Hiển thị ảnh CMND (nếu có)
- [ ] Thêm action buttons: Edit, Delete
- [ ] Navigate to StaffFormScreen khi edit
- [ ] Sử dụng CustomAlert
- [ ] Test hiển thị data

**Estimated time:** 1-2 sessions

---

### Phase 2: Refactor StaffScreen UI ⏳
**Mục đích:** Chuyển từ ScrollView + Swipeable → FlatList + Simple Cards

**Tasks:**
- [ ] **Xóa SwipeableStaffCard component** (~150 dòng)
  - Xóa PanResponder logic
  - Xóa swipe animations
  - Xóa handleDeleteSwipe function

- [ ] **Tạo renderStaffItem function**
  - Hiển thị Card đơn giản với avatar, name, position, status
  - Thêm action buttons trong card: View, Edit, Delete
  - Không có swipe, chỉ có buttons

- [ ] **Chuyển ScrollView → FlatList**
  ```javascript
  <FlatList
    data={filteredStaff}
    renderItem={renderStaffItem}
    keyExtractor={(item) => item.id.toString()}
    refreshControl={...}
    ListEmptyComponent={...}
  />
  ```

- [ ] **Cập nhật action handlers**
  - handleView(staff) → navigation.navigate('StaffDetail', { staff })
  - handleEdit(staff) → navigation.navigate('StaffForm', { mode: 'edit', staff })
  - handleDelete(staffId) → Giữ nguyên (đã dùng CustomAlert)

- [ ] **Xóa Modal add/edit** (~400 dòng)
  - Xóa showModal state
  - Xóa toàn bộ Modal component
  - Xóa form fields trong StaffScreen
  - Xóa validation logic (đã có trong StaffFormScreen)

- [ ] **Cập nhật FAB button**
  ```javascript
  onPress={() => navigation.navigate('StaffForm', { mode: 'add' })}
  ```

**Estimated time:** 2-3 sessions

---

### Phase 3: Cập nhật Navigation Routes ⏳
**Mục đích:** Thêm routes mới vào navigation

**Tasks:**
- [ ] Mở `ManagementStack.js` hoặc tương đương
- [ ] Thêm route cho StaffDetailScreen
- [ ] Thêm route cho StaffFormScreen (nếu chưa có)
- [ ] Test navigation flow: Staff → Detail → Form → Back

**File cần cập nhật:**
- `src/navigation/ManagementStack.js` (hoặc file navigation tương đương)

**Estimated time:** 1 session

---

### Phase 4: Cleanup & Polish ⏳
**Mục đích:** Dọn dẹp code và polish UX

**Tasks:**
- [ ] **Xóa code không dùng**
  - Unused imports
  - Unused states
  - Unused functions

- [ ] **Fix 2 Alert.alert còn lại** (image picker action sheets)
  - Option 1: Giữ nguyên (acceptable vì là action sheet)
  - Option 2: Chuyển sang custom Modal/BottomSheet
  - **Recommended:** Option 1 (giữ nguyên)

- [ ] **Cập nhật styles**
  - Remove swipeable-related styles
  - Add new card styles
  - Ensure responsive design

- [ ] **Test toàn bộ flow**
  - Add staff
  - View detail
  - Edit staff
  - Delete staff
  - Search & filter
  - Refresh

**Estimated time:** 1 session

---

## 📝 Code Snippets

### Simple StaffCard (renderItem)
```javascript
const renderStaffItem = ({ item: staff }) => (
  <Card style={styles.staffCard}>
    <Card.Content style={styles.cardContent}>
      <View style={styles.cardLeft}>
        <Avatar.Image 
          source={{ uri: staff.avatar_url || 'https://via.placeholder.com/150' }} 
          size={50}
        />
        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>{staff.full_name}</Text>
          <Text style={styles.staffPosition}>{staff.position || 'Chưa có chức vụ'}</Text>
        </View>
      </View>
      
      <View style={styles.cardRight}>
        <Chip 
          mode="flat" 
          style={getStatusStyle(staff.statuss)}
        >
          {getStatusLabel(staff.statuss)}
        </Chip>
        
        <View style={styles.actionButtons}>
          <IconButton 
            icon="eye" 
            size={20} 
            onPress={() => handleView(staff)}
          />
          <IconButton 
            icon="pencil" 
            size={20} 
            onPress={() => handleEdit(staff)}
          />
          <IconButton 
            icon="delete" 
            size={20} 
            onPress={() => handleDelete(staff.id)}
          />
        </View>
      </View>
    </Card.Content>
  </Card>
);
```

### Navigation Handlers
```javascript
const handleView = (staff) => {
  navigation.navigate('StaffDetail', { staff });
};

const handleEdit = (staff) => {
  navigation.navigate('StaffForm', { mode: 'edit', staff });
};

const handleAdd = () => {
  navigation.navigate('StaffForm', { mode: 'add' });
};
```

---

## 📊 Expected Improvements

### Code Quality
- **Lines of code:** ~1400 → ~600 (giảm 57%)
- **Complexity:** Cao → Trung bình
- **Maintainability:** Khó → Dễ
- **Testability:** Khó → Dễ

### User Experience
- ✅ **Rõ ràng hơn:** Separate screens cho từng chức năng
- ✅ **Nhiều không gian hơn:** Full screen cho form/detail
- ✅ **Dễ sử dụng hơn:** Buttons thay vì swipe
- ✅ **Nhất quán:** Giống ProductsScreen pattern

### Developer Experience
- ✅ **Dễ maintain:** Code tách biệt rõ ràng
- ✅ **Dễ extend:** Thêm features mới dễ dàng
- ✅ **Dễ debug:** Ít side effects, ít state
- ✅ **Dễ test:** Từng screen test riêng

---

## ⚠️ Potential Issues & Solutions

### Issue 1: Mất optimistic updates
**Solution:** Implement optimistic updates trong StaffFormScreen hoặc sử dụng React Query/SWR

### Issue 2: Navigation state management
**Solution:** Sử dụng navigation params để pass data, refresh list khi goBack

### Issue 3: Form state khi navigate back
**Solution:** Không lưu form state, mỗi lần mở form là fresh state

---

## 🎯 Success Criteria

Refactor được coi là thành công khi:
- ✅ StaffDetailScreen hoạt động đầy đủ
- ✅ StaffFormScreen integrate vào navigation
- ✅ StaffScreen chỉ hiển thị list + search/filter
- ✅ Không còn SwipeableCard component
- ✅ Không còn Modal add/edit
- ✅ Navigation flow mượt mà
- ✅ Tất cả features cũ vẫn hoạt động
- ✅ Code sạch hơn và dễ maintain hơn
- ✅ UX tốt hơn hoặc tương đương

---

## 📅 Estimated Timeline

| Phase | Tasks | Sessions | Status |
|-------|-------|----------|--------|
| Phase 1 | Tạo StaffDetailScreen | 1-2 | ⏳ Pending |
| Phase 2 | Refactor StaffScreen UI | 2-3 | ⏳ Pending |
| Phase 3 | Cập nhật Navigation | 1 | ⏳ Pending |
| Phase 4 | Cleanup & Polish | 1 | ⏳ Pending |
| **Total** | | **5-7 sessions** | |

---

## 🚦 Ready to Start?

**Prerequisites:**
- ✅ CustomAlert migration completed (9 screens)
- ✅ StaffFormScreen exists and uses CustomAlert
- ✅ Cleanup completed (temp files removed)
- ✅ Documentation created

**Next Step:**
Start with **Phase 1: Tạo StaffDetailScreen**

**Command to start:**
```
Tôi: "Bắt đầu Phase 1 - Tạo StaffDetailScreen"
```

---

## 📚 References

- ProductsScreen.js - List pattern reference
- ProductFormScreen.js - Form pattern reference  
- ProductDetailScreen.js - Detail pattern reference
- CustomAlert component - Alert pattern
- ManagementStack.js - Navigation setup

---

**Created:** 2024-12-19  
**Last Updated:** 2024-12-19  
**Status:** Ready to start Phase 1
