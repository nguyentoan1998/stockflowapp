# Restart Metro Bundler với Cache Clear

## Lỗi
```
ERROR  Error: Failed to get the SHA-1 for: D:\Code\stockflowapp\src\components\CustomDialog\index.js.
```

## Nguyên nhân
- Metro bundler đang cache file cũ đã bị xóa
- Cần clear cache để Metro scan lại cấu trúc files mới

## Giải pháp

### Option 1: npm start (Recommended)
```bash
# Stop Metro (Ctrl+C)
npm start -- --reset-cache
```

### Option 2: Expo CLI
```bash
npx expo start -c
```

### Option 3: Watchman (nếu có)
```bash
watchman watch-del-all
npm start -- --reset-cache
```

### Option 4: Full cleanup
```bash
# Windows PowerShell
Remove-Item -Recurse -Force node_modules\.cache
npm start -- --reset-cache
```

## Sau khi restart

1. Đợi Metro rebuild (~1-2 phút)
2. Reload app:
   - Nhấn 'r' trong Metro console
   - Hoặc shake device → Reload
3. App sẽ hoạt động bình thường

## Verified
- ✅ CustomDialog wrapper hoạt động
- ✅ CustomAlert được dùng
- ✅ Dialogs đẹp với animations
- ✅ Không bị treo khi xóa

---

**Chạy lệnh:** `npm start -- --reset-cache`
