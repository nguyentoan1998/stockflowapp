# Hướng dẫn Fix Upload Ảnh Nhân Viên

## 🔴 Vấn đề
Khi add/edit nhân viên, ảnh không được upload lên Supabase Storage mà chỉ lưu URL local:
```
file:///var/mobile/Containers/Data/Application/.../ImagePicker/...png
```

## 🔍 Nguyên nhân
**SUPABASE_ANON_KEY đã HẾT HẠN** trong file `src/services/supabase.js`

Lỗi test: `signature verification failed` (403)

## ✅ Giải pháp - 3 Bước Đơn Giản

### Bước 1️⃣: Lấy Key Mới
1. Đăng nhập [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. **Settings** → **API**
4. Copy **"anon / public"** key

### Bước 2️⃣: Cập nhật Key
**Cách 1 - Tự động (Khuyến nghị):**
```bash
cd stockflowapp
node tmp_rovodev_update_supabase_key.js "PASTE_YOUR_NEW_KEY_HERE"
```

**Cách 2 - Thủ công:**
Mở file `src/services/supabase.js` và thay dòng 4:
```javascript
const SUPABASE_ANON_KEY = 'YOUR_NEW_KEY_HERE';
```

### Bước 3️⃣: Kiểm tra Bucket
```bash
node tmp_rovodev_test_image_upload.js
```

**Kết quả mong đợi:**
```
✅ Available buckets:
  - images (public: true)
✅ Bucket "images" exists
```

## 📦 Cấu hình Supabase Storage

### Tạo Bucket "images" (nếu chưa có)
1. Supabase Dashboard → **Storage**
2. **New bucket**
3. Name: `images`
4. ✅ **Public bucket** (BẬT LÊN!)
5. Create

### Cấu hình Policies (nếu cần)
Vào Storage → Policies → New policy:

**Policy 1 - Upload:**
```sql
CREATE POLICY "Allow public upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'images');
```

**Policy 2 - Read:**
```sql
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');
```

## 📂 Cấu trúc Lưu Trữ

Sau khi fix, ảnh sẽ được upload vào:

```
images/
├── employees/          # Ảnh đại diện nhân viên
│   └── employee_123_1234567890.jpg
└── cmt/               # Ảnh CMND/CCCD
    ├── cmt_123_1234567890_0.jpg
    └── cmt_123_1234567890_1.jpg
```

URL lưu trong database:
```
https://gstxothkjosohcqqcqyj.supabase.co/storage/v1/object/public/images/employees/employee_123_1234567890.jpg
```

## 🧪 Test trong App

1. **Restart app** (đóng và mở lại hoàn toàn)
2. Vào **Categories** → **Staff**
3. **Add/Edit** nhân viên
4. Chọn ảnh đại diện và ảnh CMND
5. Save
6. Kiểm tra console logs:
   ```
   Starting upload: { uri: 'file://...', bucket: 'images', folder: 'employees', ... }
   Upload successful: { path: 'employees/...' }
   Public URL generated: https://...
   ```

## 🔧 Cải tiến Code

### ✅ Đã cập nhật `src/services/supabase.js`:
- Logging chi tiết từng bước upload
- Auto-detect content type (PNG/JPG)
- Error messages rõ ràng hơn
- Better error handling

### ✅ Upload flow trong `StaffFormScreen.js`:
1. Check nếu URI bắt đầu với `file://`
2. Upload ảnh đại diện → `images/employees/`
3. Upload ảnh CMND → `images/cmt/`
4. Nhận public URLs
5. Lưu URLs vào database

## ❗ Troubleshooting

| Lỗi | Nguyên nhân | Giải pháp |
|-----|------------|-----------|
| `signature verification failed` | Token hết hạn | Lấy key mới từ Dashboard |
| `Bucket not found` | Chưa tạo bucket | Tạo bucket "images" |
| `Access denied (403)` | Bucket không public | Bật public trong settings |
| Ảnh vẫn lưu local URI | App đang cache | Restart app (kill & reopen) |
| Upload chậm | File quá lớn | App đã set quality: 0.8 |

## 📋 Checklist

Trước khi test, đảm bảo:
- [ ] SUPABASE_ANON_KEY đã cập nhật mới
- [ ] Bucket "images" đã tạo
- [ ] Bucket "images" là **PUBLIC**
- [ ] Policies cho phép INSERT và SELECT
- [ ] Test script chạy thành công
- [ ] App đã restart hoàn toàn

## 🎯 Expected Result

Sau khi fix thành công:
- ✅ Ảnh upload lên Supabase Storage
- ✅ URL công khai được lưu vào database
- ✅ Ảnh hiển thị được trong app và web
- ✅ Folder structure: `images/employees/` và `images/cmt/`

## 📞 Scripts Hỗ trợ

```bash
# Cập nhật key tự động
node tmp_rovodev_update_supabase_key.js "NEW_KEY"

# Test connection
node tmp_rovodev_test_image_upload.js
```

## 🔒 Lưu ý Bảo mật

⚠️ **Không commit SUPABASE_ANON_KEY vào Git!**

Nên dùng environment variables:
```javascript
// Tốt hơn là dùng:
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'fallback-key';
```

---

**Cần hỗ trợ thêm?** Check console logs trong app khi upload để xem lỗi chi tiết.
