# Project Cleanup Analysis

## Files cần XÓA (Unused Components)

### 1. CRUDModal Component (Không dùng nữa)
- ❌ `src/components/CRUDModal/CRUDModal.js`
- ❌ `src/components/CRUDModal/FormInputs.js`
- ❌ `src/components/CRUDModal/index.js`
- **Lý do:** Tất cả screens đã chuyển sang inline modal hoặc form screens riêng

### 2. Modal Components (Không dùng nữa)
- ❌ `src/components/ProductModal/ProductCRUDModal.js` 
- ❌ `src/components/ProductModal/index.js`
- ❌ `src/components/StaffModal/StaffCRUDModal.js`
- ❌ `src/components/StaffModal/index.js`
- **Lý do:** Products và Staff đã dùng form screens (ProductFormScreen, StaffFormScreen)

### 3. CustomDialog (Không dùng - có file trùng)
- ❌ `src/components/CustomDialog.js` (file root)
- ⚠️ Có folder `src/components/CustomDialog/` nhưng không có file bên trong
- **Lý do:** Không được sử dụng ở đâu cả

### 4. UI Components không sử dụng
- ❌ `src/components/ui/Avatar.js` - KHÔNG được import ở đâu
- ❌ `src/components/ui/ModernButton.js` - CHỈ dùng ở 1 vài màn hình cũ, có thể xóa

### 5. Product Feature Components (Chưa implement)
- ❌ `src/components/ProductBOM.js` - Không được sử dụng
- ❌ `src/components/ProductSpecifications.js` - Không được sử dụng  
- ❌ `src/components/ProductUnitConversions.js` - Không được sử dụng
- **Lý do:** Features này chưa được implement trong ProductDetailScreen

## Files GIỮ LẠI (Currently Used)

### Components đang dùng:
- ✅ `src/components/CustomAlert.js` - Dùng trong tất cả screens
- ✅ `src/components/CustomTabBar.js` - Navigation
- ✅ `src/components/LoadingSpinner/AnimatedLoadingSpinner.js` - Loading states
- ✅ `src/components/ui/ListCard.js` - Dùng trong tất cả category screens
- ✅ `src/components/ui/Badge.js` - Dùng trong ProductsScreen
- ✅ `src/components/ui/Chip.js` - Dùng nhiều nơi
- ✅ `src/components/ui/Card.js` / `GradientCard.js` - Dùng nhiều
- ✅ `src/components/ui/Button.js` - Dùng nhiều
- ✅ `src/components/ui/Input.js` - Login và các screens khác

### Error Boundary:
- ✅ `src/components/ErrorBoundary/ErrorBoundary.tsx` - Error handling

### Contexts:
- ✅ `src/contexts/ApiContext.js`
- ✅ `src/contexts/AuthContext.js`
- ✅ `src/contexts/ThemeContext.tsx`
- ✅ `src/contexts/UserContext.tsx`
- ✅ `src/contexts/providers.tsx`

## Cấu trúc mới đề xuất

### Sau khi cleanup:

```
src/
├── components/
│   ├── CustomAlert.js              ✅
│   ├── CustomTabBar.js             ✅
│   ├── ErrorBoundary/
│   │   └── ErrorBoundary.tsx       ✅
│   ├── LoadingSpinner/
│   │   ├── AnimatedLoadingSpinner.js ✅
│   │   └── index.js                ✅
│   └── ui/
│       ├── Badge.js                ✅
│       ├── Button.js               ✅
│       ├── Card.js                 ✅
│       ├── Chip.js                 ✅
│       ├── GradientCard.js         ✅
│       ├── Input.js                ✅
│       ├── ListCard.js             ✅
│       └── index.js                ✅
│
├── contexts/                        ✅ All
├── hooks/                           ✅ (empty but keep)
├── navigation/                      ✅ All
├── screens/                         ✅ All
├── services/                        ✅ All
├── theme/                           ✅
└── utils/                           ✅ All
```

## Tổng kết

### Files CẦN XÓA: 12 files
1. CRUDModal/* (3 files)
2. ProductModal/* (2 files)
3. StaffModal/* (2 files)
4. CustomDialog.js (1 file)
5. CustomDialog/ (empty folder)
6. ui/Avatar.js (1 file)
7. ui/ModernButton.js (1 file)
8. ProductBOM.js (1 file)
9. ProductSpecifications.js (1 file)
10. ProductUnitConversions.js (1 file)

### Files GIỮ LẠI: ~50+ files
- Tất cả đang được sử dụng actively

### Size giảm:
- **~3,000-4,000 lines** code không dùng
- **~200KB** file size
