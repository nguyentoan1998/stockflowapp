# 📋 StaffFormScreen UI/UX Update Plan

## 🎯 Mục tiêu
Cập nhật StaffFormScreen để có UI/UX giống ProductFormScreen - đơn giản, đẹp, dễ sử dụng.

---

## 📊 So sánh hiện tại:

### ProductFormScreen (Reference):
✅ Header đơn giản với back + title
✅ Sections rõ ràng (Ảnh, Thông tin cơ bản, Phân loại, Giá)
✅ Image picker đẹp với placeholder
✅ Input fields nhất quán
✅ Picker với modal đẹp
✅ Save button fixed ở bottom
✅ Loading states rõ ràng

### StaffFormScreen (Hiện tại):
❌ UI phức tạp với nhiều colors
❌ Sections không rõ ràng
❌ Input fields không nhất quán
❌ Image picker cần cải thiện
❌ Nhiều modals nested

---

## 🔄 Các thay đổi cần thực hiện:

### 1. **Header** (Lines ~280-320)
**Hiện tại:**
```javascript
<LinearGradient colors={['#1976d2', '#1565c0']}>
  {/* Complex header với nhiều màu */}
</LinearGradient>
```

**Cần đổi sang:**
```javascript
<View style={styles.header}>
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <Ionicons name="arrow-back" size={24} color="#000" />
  </TouchableOpacity>
  <Text style={styles.headerTitle}>
    {isEditMode ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
  </Text>
  <View style={{width: 24}} /> {/* Spacer */}
</View>
```

### 2. **Image Section** (Lines ~330-400)
**Cần đổi sang:**
```javascript
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Ảnh đại diện</Text>
  <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
    {formData.avatar_url ? (
      <Image source={{ uri: formData.avatar_url }} style={styles.avatar} />
    ) : (
      <View style={styles.imagePlaceholder}>
        <Ionicons name="person" size={60} color="#ccc" />
        <Text style={styles.imagePlaceholderText}>Chọn ảnh đại diện</Text>
      </View>
    )}
    {uploadProgress && (
      <View style={styles.imageOverlay}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.uploadingText}>{uploadProgress}</Text>
      </View>
    )}
  </TouchableOpacity>
</View>
```

### 3. **Form Sections** - Tổ chức lại thành các section rõ ràng:

**a. Thông tin cơ bản:**
```javascript
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
  
  <Text style={styles.label}>
    Họ và tên <Text style={styles.required}>*</Text>
  </Text>
  <TextInput
    style={styles.input}
    value={formData.full_name}
    onChangeText={(text) => setFormData({...formData, full_name: text})}
    placeholder="Nhập họ và tên"
  />
  
  {/* Email, Phone, Address... */}
</View>
```

**b. Thông tin cá nhân:**
```javascript
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
  
  <Text style={styles.label}>Giới tính</Text>
  <TouchableOpacity 
    style={styles.pickerButton}
    onPress={() => setShowGenderPicker(true)}
  >
    <Text style={styles.pickerButtonText}>
      {getGenderLabel(formData.sex)}
    </Text>
    <Ionicons name="chevron-down" size={20} color="#666" />
  </TouchableOpacity>
  
  {/* Ngày sinh, CMND... */}
</View>
```

**c. Thông tin công việc:**
```javascript
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Thông tin công việc</Text>
  
  <Text style={styles.label}>Chức vụ</Text>
  <TouchableOpacity 
    style={styles.pickerButton}
    onPress={() => setShowPositionPicker(true)}
  >
    <Text style={styles.pickerButtonText}>
      {getPositionName(formData.position_id)}
    </Text>
    <Ionicons name="chevron-down" size={20} color="#666" />
  </TouchableOpacity>
  
  {/* Team, Status... */}
</View>
```

### 4. **Pickers - Modal đơn giản hơn:**
```javascript
<Modal visible={showPositionPicker} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Chọn chức vụ</Text>
        <TouchableOpacity onPress={() => setShowPositionPicker(false)}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      <ScrollView>
        {positions.map(position => (
          <TouchableOpacity
            key={position.id}
            style={styles.modalItem}
            onPress={() => {
              setFormData({...formData, position_id: position.id});
              setShowPositionPicker(false);
            }}
          >
            <Text style={styles.modalItemText}>{position.name}</Text>
            {formData.position_id === position.id && (
              <Ionicons name="checkmark" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  </View>
</Modal>
```

### 5. **Save Button - Fixed ở bottom:**
```javascript
<View style={styles.footer}>
  <TouchableOpacity
    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
    onPress={handleSave}
    disabled={saving}
  >
    {saving ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <>
        <Ionicons name="checkmark" size={24} color="#fff" />
        <Text style={styles.saveButtonText}>
          {isEditMode ? 'Cập nhật' : 'Thêm mới'}
        </Text>
      </>
    )}
  </TouchableOpacity>
</View>
```

---

## 🎨 Styles cần cập nhật:

```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for footer
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  required: {
    color: '#f44336',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  imageContainer: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 8,
    color: '#fff',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
});
```

---

## ⚙️ Implementation Steps:

1. ✅ Backup file hiện tại
2. ⏳ Cập nhật Header
3. ⏳ Cập nhật Image Section
4. ⏳ Tổ chức lại Form Sections
5. ⏳ Đơn giản hóa Pickers
6. ⏳ Thêm Fixed Footer với Save Button
7. ⏳ Cập nhật Styles
8. ⏳ Test & Fix bugs

---

## 🎯 Kết quả mong đợi:

✅ UI sạch sẽ, đơn giản hơn
✅ Sections rõ ràng, dễ điều hướng
✅ Input fields nhất quán
✅ Pickers đẹp và dễ sử dụng
✅ Save button luôn hiển thị ở bottom
✅ Better UX như ProductFormScreen

---

**Ghi chú:** Do file quá lớn (~862 dòng), nên làm từng bước nhỏ và test kỹ sau mỗi thay đổi.

**Estimated time:** 10-15 iterations để hoàn thành toàn bộ.

**Next step:** Bắt đầu với Header và Image Section?
