# 🎯 Quick Start - Fix Upload Ảnh Nhân Viên

## ⚡ TÓM TẮT 30 GIÂY

**Vấn đề:** Ảnh lưu `file://...` thay vì upload lên Supabase  
**Nguyên nhân:** SUPABASE_ANON_KEY hết hạn  
**Fix:** Lấy key mới + Setup bucket

---

## 🚀 QUICK FIX (5 phút)

```bash
cd stockflowapp

# 1. Update key
node tmp_rovodev_update_key.js "YOUR_NEW_KEY"

# 2. Test
node tmp_rovodev_test_supabase.js

# 3. Restart app và test upload
```

**Lấy key ở đâu?**  
https://supabase.com/dashboard → Settings → API → Copy "anon/public" key

**Setup Supabase:**
1. Storage → New Bucket → Name: `images` → ✅ Public
2. SQL Editor → Paste từ `tmp_rovodev_supabase_policies.sql` → Run

✅ **DONE!**

---

## 📚 Chi tiết đầy đủ

Xem: `tmp_rovodev_COMPLETE_SETUP.md`

---

## 🛠️ Các Scripts Có Sẵn

| Script | Mô tả |
|--------|-------|
| `tmp_rovodev_update_key.js` | Cập nhật Supabase key |
| `tmp_rovodev_test_supabase.js` | Test connection |
| `tmp_rovodev_setup_env.js` | Setup .env file |
| `tmp_rovodev_migrate_to_env.js` | Migrate sang .env |
| `tmp_rovodev_supabase_policies.sql` | SQL policies |

---

## ✅ Verify Thành Công

Upload ảnh trong app và check:
- Console logs: `Upload successful` + `Public URL generated: https://...`
- Database: `image_url` = `https://...` (không phải `file://`)
- Storage: Files trong `images/employees/` và `images/cmt/`

---

## 🆘 Lỗi Thường Gặp

| Lỗi | Fix |
|-----|-----|
| "signature verification failed" | Lấy key mới |
| "Bucket not found" | Tạo bucket "images" |
| "Access denied" | Bật public + run SQL policies |
| Upload không báo lỗi | `npx expo start -c` |

---

**Need help?** Xem file `tmp_rovodev_COMPLETE_SETUP.md` hoặc `HUONG_DAN_FIX_UPLOAD_ANH.md`
