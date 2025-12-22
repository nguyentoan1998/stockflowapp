# 🎨 New Theme Implementation - Cream & Coral Design

## ✅ Hoàn thành

### 1. Theme System (✅ Done)
**File:** `src/theme/index.js`

**Màu sắc mới:**
- **Primary (Coral):** `#FF6B6B` - Màu nhấn chính
- **Secondary (Electric Blue):** `#4ECDC4` - Màu cho biểu đồ và highlights
- **Background (Cream):** `#FFF8F0` - Nền mềm mại
- **Accent (Yellow):** `#FFE66D` - Điểm nhấn phụ
- **Text:** `#2C3E50` - Chữ tối rõ ràng

**Đặc điểm:**
- Border radius lớn hơn (12-28px) - bo tròn nhiều
- Shadows với coral tint - bóng mờ tinh tế
- Gradients đa dạng cho cards và buttons

### 2. Shared Components (✅ Done)
**Files:**
- `src/components/ui/Card.js` - Card với bo tròn và shadow
- `src/components/ui/Button.js` - Button với variants (primary, secondary, outline, ghost)
- `src/components/ui/Input.js` - Input field với icon và validation

**Tính năng:**
- Tự động áp dụng theme colors
- Variants linh hoạt
- Animation và feedback

### 3. LoginScreen (✅ Done)
**File:** `src/screens/LoginScreen.js`

**Cải tiến:**
- ✅ Background với decorative circles (coral, blue, yellow)
- ✅ Logo trong circle với shadow
- ✅ Login card bo tròn với soft shadow
- ✅ Input fields mới với icons
- ✅ Primary coral button
- ✅ Entrance animations (fade + slide)
- ✅ Cream background

### 4. DashboardScreen (✅ Done)
**File:** `src/screens/DashboardScreen.js`

**Cải tiến:**
- ✅ Gradient header (coral to yellow)
- ✅ Stats cards với icons và colors
- ✅ Quick actions với gradient buttons
- ✅ Activity feed với timeline
- ✅ Pull to refresh
- ✅ Cream background
- ✅ Card-based layout

## 📋 Cần cập nhật

### Các screen còn lại cần update với theme mới:

**Categories:**
- `ProductsScreen.js` ⏳
- `ProductFormScreen.js` ⏳
- `ProductDetailScreen.js` ⏳
- `StaffScreen.js` ⏳
- `StaffFormScreen.js` ⏳
- `CustomersScreen.js` ⏳
- `SuppliersScreen.js` ⏳
- Và các screens khác...

## 🎯 Hướng dẫn áp dụng theme cho screen mới

### Bước 1: Import theme và components
```javascript
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '../theme';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
```

### Bước 2: Thay đổi màu sắc
```javascript
// Before
backgroundColor: '#007AFF',
color: '#333',

// After
backgroundColor: Colors.primary, // Coral
color: Colors.text, // Dark slate
```

### Bước 3: Áp dụng border radius
```javascript
// Before
borderRadius: 8,

// After
borderRadius: BorderRadius.md, // 16
```

### Bước 4: Áp dụng shadows
```javascript
// Before
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
elevation: 2,

// After
...Shadows.card, // Coral-tinted soft shadow
```

### Bước 5: Sử dụng components
```javascript
// Old button
<TouchableOpacity style={styles.button} onPress={handleSubmit}>
  <Text style={styles.buttonText}>Submit</Text>
</TouchableOpacity>

// New button
<Button variant="primary" onPress={handleSubmit}>
  Submit
</Button>

// Old card
<View style={styles.card}>
  {content}
</View>

// New card
<Card>
  {content}
</Card>
```

## 🎨 Design Principles

### 1. Color Usage
- **Primary (Coral):** Main actions, important buttons, highlights
- **Secondary (Electric Blue):** Charts, graphs, secondary actions
- **Accent (Yellow):** Badges, notifications, warnings
- **Background (Cream):** Main background, soft and warm
- **Surface (White):** Cards, modals, elevated surfaces

### 2. Spacing
- Use `Spacing` constants: xs(4), sm(8), md(16), lg(24), xl(32), xxl(48)
- Consistent padding trong cards: `Spacing.md` (16)
- Margin between sections: `Spacing.lg` (24)

### 3. Typography
- **Headers:** Use `Typography.h1`, `h2`, `h3`
- **Body:** Use `Typography.body` hoặc `bodySmall`
- **Captions:** Use `Typography.caption`
- **Buttons:** Use `Typography.button`
- Font family: Sans-serif (system default)

### 4. Shadows
- **Cards:** Use `Shadows.card` - subtle coral tint
- **Buttons:** Use `Shadows.colored(Colors.primary)` - pronounced shadow
- **Floating elements:** Use `Shadows.lg`

### 5. Border Radius
- **Small elements:** `BorderRadius.sm` (12)
- **Cards:** `BorderRadius.md` (16)
- **Large cards:** `BorderRadius.lg` (20)
- **Circular:** `BorderRadius.full` (9999)

## 📦 Component Library

### Button Variants
```javascript
<Button variant="primary">Primary</Button>     // Coral background
<Button variant="secondary">Secondary</Button> // Electric blue
<Button variant="outline">Outline</Button>     // Coral outline
<Button variant="ghost">Ghost</Button>         // Transparent
```

### Button Sizes
```javascript
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
<Button size="large">Large</Button>
```

### Input with Icons
```javascript
<Input
  label="Email"
  icon="mail-outline"
  placeholder="Enter email"
  value={email}
  onChangeText={setEmail}
/>

<Input
  label="Password"
  icon="lock-closed-outline"
  secureTextEntry
  value={password}
  onChangeText={setPassword}
/>
```

### Card Variants
```javascript
<Card>Basic card</Card>
<Card elevated={false}>Flat card</Card>
<Card style={{ padding: 24 }}>Custom padding</Card>
```

## 🎭 Gradients

### Available Gradients
```javascript
Colors.gradients.primary    // Coral gradient
Colors.gradients.secondary  // Blue gradient
Colors.gradients.sunset     // Coral to yellow
Colors.gradients.ocean      // Blue to mint
Colors.gradients.warm       // Yellow to coral
Colors.gradients.cool       // Mint to blue
Colors.gradients.card       // White to cream
```

### Usage with LinearGradient
```javascript
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={Colors.gradients.sunset}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.gradient}
>
  {content}
</LinearGradient>
```

## 🔄 Migration Checklist

Khi update một screen:

- [ ] Import theme constants
- [ ] Replace hardcoded colors với Colors.*
- [ ] Replace hardcoded spacing với Spacing.*
- [ ] Replace hardcoded border radius với BorderRadius.*
- [ ] Apply Shadows.* thay vì custom shadows
- [ ] Use Typography.* cho text styles
- [ ] Replace custom buttons với Button component
- [ ] Replace custom inputs với Input component
- [ ] Wrap content trong Card component
- [ ] Update background color thành Colors.background
- [ ] Test trên device để verify colors và shadows

## 🎯 Examples

### Before & After - Product Card

**Before:**
```javascript
<View style={{
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 15,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  elevation: 2,
}}>
  <Text style={{ fontSize: 16, color: '#333' }}>Product Name</Text>
  <TouchableOpacity style={{
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
  }}>
    <Text style={{ color: '#fff' }}>Add to Cart</Text>
  </TouchableOpacity>
</View>
```

**After:**
```javascript
<Card>
  <Text style={Typography.body}>Product Name</Text>
  <Button variant="primary">Add to Cart</Button>
</Card>
```

### Before & After - Header

**Before:**
```javascript
<View style={{
  backgroundColor: '#007AFF',
  padding: 20,
}}>
  <Text style={{ color: '#fff', fontSize: 24 }}>Dashboard</Text>
</View>
```

**After:**
```javascript
<LinearGradient
  colors={Colors.gradients.sunset}
  style={{ padding: Spacing.lg }}
>
  <Text style={[Typography.h2, { color: Colors.surface }]}>Dashboard</Text>
</LinearGradient>
```

## 📊 Color Reference Chart

| Usage | Color | Hex | Variable |
|-------|-------|-----|----------|
| Primary Button | Coral | #FF6B6B | Colors.primary |
| Secondary Button | Electric Blue | #4ECDC4 | Colors.secondary |
| Background | Cream | #FFF8F0 | Colors.background |
| Card Background | White | #FFFFFF | Colors.surface |
| Text | Dark Slate | #2C3E50 | Colors.text |
| Secondary Text | Gray | #7F8C8D | Colors.textSecondary |
| Success | Green | #51CF66 | Colors.success |
| Warning | Orange | #FFB84D | Colors.warning |
| Error | Coral | #FF6B6B | Colors.error |
| Charts Primary | Electric Blue | #4ECDC4 | Colors.chartPrimary |
| Charts Secondary | Coral | #FF6B6B | Colors.chartSecondary |

## 🚀 Next Steps

1. **Update ProductsScreen** - Áp dụng Card và Button components
2. **Update ProductFormScreen** - Sử dụng Input component
3. **Update StaffScreen** - Consistent với ProductsScreen
4. **Update Navigation** - Header colors và styles
5. **Add animations** - Smooth transitions giữa screens

## 💡 Tips

- **Consistency is key:** Sử dụng cùng patterns across toàn bộ app
- **Test on device:** Colors có thể khác trên simulator vs real device
- **Accessibility:** Ensure text contrast đủ với background
- **Performance:** Sử dụng `useMemo` cho gradient styles nếu cần
- **Dark mode:** Plan cho dark mode trong tương lai (optional)

---

**Đã hoàn thành:** 4/5 tasks (80%)  
**Còn lại:** Update các screens còn lại với theme mới

**Good luck! 🎨**
