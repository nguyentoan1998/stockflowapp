# 🛠️ Hướng dẫn Sử dụng Scripts

## 📁 Danh sách Scripts

### 1. `tmp_rovodev_update_key.js` - Cập nhật Supabase Key
**Mô tả:** Script tự động cập nhật SUPABASE_ANON_KEY trong code

**Cách dùng:**
```bash
# Interactive mode (hỏi key)
node tmp_rovodev_update_key.js

# Direct mode (paste key vào)
node tmp_rovodev_update_key.js "eyJhbGc..."
```

**Tính năng:**
- ✅ Validate JWT format
- ✅ Backup file cũ tự động
- ✅ Preview trước khi update
- ✅ Confirm trước khi thay đổi

---

### 2. `tmp_rovodev_test_supabase.js` - Test Kết nối Supabase
**Mô tả:** Kiểm tra kết nối và cấu hình Supabase Storage

**Cách dùng:**
```bash
node tmp_rovodev_test_supabase.js
```

**Kiểm tra:**
- ✅ Kết nối Supabase
- ✅ Bucket "images" có tồn tại không
- ✅ Bucket có public không
- ✅ Folders "employees" và "cmt"

**Kết quả mong đợi:**
```
✅ Connection successful!
📦 Available buckets:
  - images (public: true)
✅ Bucket "images" exists
✅ Bucket is PUBLIC
```

---

### 3. `tmp_rovodev_setup_env.js` - Setup Environment Variables
**Mô tả:** Interactive setup cho .env file

**Cách dùng:**
```bash
node tmp_rovodev_setup_env.js
```

**Tính năng:**
- ✅ Tạo/cập nhật .env file
- ✅ Hỏi Supabase credentials
- ✅ Validate JWT format
- ✅ Tạo .env.example tự động

---

### 4. `tmp_rovodev_migrate_to_env.js` - Migrate sang ENV
**Mô tả:** Chuyển đổi supabase.js để dùng environment variables

**Cách dùng:**
```bash
node tmp_rovodev_migrate_to_env.js
```

**Thay đổi:**
- ✅ Import expo-constants
- ✅ Đọc config từ .env
- ✅ Fallback nếu .env không có
- ✅ Backup file cũ

---

### 5. `tmp_rovodev_supabase_policies.sql` - SQL Policies
**Mô tả:** SQL script để setup policies cho Supabase Storage

**Cách dùng:**
1. Mở Supabase Dashboard
2. SQL Editor → New Query
3. Copy nội dung file này
4. Run SQL

**Policies tạo ra:**
- ✅ Allow public uploads
- ✅ Allow public reads
- ✅ Allow public updates
- ✅ Allow public deletes (optional)

---

## 🚀 Quick Start - Fix Upload Ảnh

### Option A: Cập nhật Key trực tiếp (Nhanh)

```bash
# Bước 1: Lấy key mới từ Supabase Dashboard
# Dashboard → Settings → API → Copy "anon/public" key

# Bước 2: Update key
node tmp_rovodev_update_key.js "PASTE_KEY_HERE"

# Bước 3: Test
node tmp_rovodev_test_supabase.js

# Bước 4: Restart app và test upload
```

### Option B: Migrate sang .env (Recommended)

```bash
# Bước 1: Setup environment variables
node tmp_rovodev_setup_env.js
# (Nhập Supabase URL và Key khi được hỏi)

# Bước 2: Migrate code để dùng .env
node tmp_rovodev_migrate_to_env.js

# Bước 3: Cập nhật app.json (xem bên dưới)

# Bước 4: Install dependencies
npx expo install expo-constants

# Bước 5: Test
node tmp_rovodev_test_supabase.js

# Bước 6: Restart app
# Stop app → Clear cache → Start
```

---

## 📝 Cấu hình app.json

Thêm vào file `app.json`:

```json
{
  "expo": {
    "name": "stockflow-app",
    "slug": "stockflow-app",
    "extra": {
      "supabaseUrl": process.env.EXPO_PUBLIC_SUPABASE_URL,
      "supabaseAnonKey": process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      "apiUrl": process.env.EXPO_PUBLIC_API_URL,
      "apiKey": process.env.EXPO_PUBLIC_API_KEY
    }
  }
}
```

**Lưu ý:** Expo sẽ tự động load `.env` khi start app.

---

## 🔐 Setup Supabase Policies

### Cách 1: Qua SQL (Recommended)
```bash
# Copy nội dung file tmp_rovodev_supabase_policies.sql
# Paste vào Supabase SQL Editor
# Run
```

### Cách 2: Qua UI
1. Dashboard → Storage → images → Policies
2. New Policy
3. Chọn "Insert" → For public → WITH CHECK: bucket_id = 'images'
4. Lặp lại cho SELECT, UPDATE, DELETE

---

## ✅ Checklist Hoàn chỉnh

### Supabase Setup
- [ ] Bucket "images" đã tạo
- [ ] Bucket là PUBLIC
- [ ] Policies đã setup (INSERT, SELECT)
- [ ] Key mới đã lấy từ Dashboard

### Code Setup
- [ ] .env file đã cập nhật với key mới
- [ ] supabase.js đã migrate (hoặc key đã update)
- [ ] app.json có extra fields
- [ ] expo-constants đã install

### Testing
- [ ] Script test_supabase.js chạy thành công
- [ ] App restart và load config đúng
- [ ] Upload ảnh thành công
- [ ] URL là https://... (không phải file://)

---

## 🐛 Troubleshooting

### Lỗi: "signature verification failed"
```bash
# Key đã hết hạn
node tmp_rovodev_update_key.js "NEW_KEY"
```

### Lỗi: "Bucket not found"
```bash
# Chưa tạo bucket
# → Vào Supabase Dashboard → Storage → New Bucket → Name: "images" → Public: Yes
```

### Lỗi: env variables không load
```bash
# 1. Kiểm tra .env file có đúng format
cat .env

# 2. Restart Expo với clear cache
npx expo start -c

# 3. Kiểm tra app.json có extra fields
```

### Upload chậm hoặc timeout
```bash
# Check internet connection
# Check Supabase status: status.supabase.com
# Giảm image quality trong ImagePicker options
```

---

## 📚 Tài liệu tham khảo

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [React Native Image Upload](https://reactnative.dev/docs/image)

---

## 🗑️ Dọn dẹp Scripts

Sau khi hoàn thành setup, bạn có thể xóa các file test:

```bash
rm tmp_rovodev_*.js
rm tmp_rovodev_*.sql
rm tmp_rovodev_*.md
```

**Lưu giữ:**
- ✅ `.env` - Credentials (đừng commit!)
- ✅ `.env.example` - Template
- ✅ `src/services/supabase.js` - Service code

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra console logs trong app
2. Chạy test script để xác định lỗi
3. Xem file HUONG_DAN_FIX_UPLOAD_ANH.md

**Common Issues:**
- Key hết hạn → Lấy key mới
- Bucket không public → Bật public
- .env không load → Restart với -c flag
- Upload fail → Check policies

---

**Good luck! 🚀**
