# Hướng dẫn sử dụng tính năng Quản lý Sản phẩm

## Tổng quan
Ứng dụng đã được cập nhật với các tính năng quản lý chi tiết cho sản phẩm, bao gồm:
- **Quy cách sản phẩm** (Product Specifications)
- **Đơn vị chuyển đổi** (Product Unit Conversions)
- **Định mức nguyên liệu** (Product BOM - Bill of Materials)

## 1. Quy cách sản phẩm (Product Specifications)

### Mục đích
Định nghĩa các thông số kỹ thuật, biến thể của sản phẩm (màu sắc, kích thước, chất liệu...).

### Các trường dữ liệu
- **Tên quy cách** (*): Tên thuộc tính (VD: Kích thước, Màu sắc, Chất liệu)
- **Giá trị** (*): Giá trị cụ thể (VD: 100x200cm, Xanh, Cotton)
- **Giá**: Giá riêng cho quy cách này (VNĐ)
- **Thời gian**: Thời gian gia công/sản xuất (giờ)
- **Quy cách cuối cùng**: Đánh dấu đây là quy cách cuối cùng trong quy trình
- **Kho hàng**: Kho lưu trữ cho quy cách này

### Validation
- Tên và giá trị là bắt buộc
- Giá phải là số và không âm
- Thời gian phải là số và không âm

### Cách sử dụng
1. Vào màn hình chi tiết sản phẩm
2. Chọn tab "Quy cách"
3. Nhấn nút "+" để thêm quy cách mới
4. Điền thông tin và nhấn "Lưu"
5. Để sửa/xóa, nhấn icon tương ứng trên từng quy cách

## 2. Đơn vị chuyển đổi (Product Unit Conversions)

### Mục đích
Định nghĩa quan hệ chuyển đổi giữa các đơn vị tính khác nhau của cùng một sản phẩm.

### Các trường dữ liệu
- **Từ đơn vị** (*): Đơn vị nguồn
- **Hệ số chuyển đổi** (*): Hệ số nhân để chuyển đổi
- **Đến đơn vị** (*): Đơn vị đích

### Công thức
```
Số lượng (đơn vị đích) = Số lượng (đơn vị nguồn) × Hệ số chuyển đổi
```

### Ví dụ
- 1 Thùng = 12 Chai → Hệ số = 12
- 1 Kg = 1000 Gram → Hệ số = 1000
- 1 Carton = 24 Hộp → Hệ số = 24

### Validation
- Cả hai đơn vị đều bắt buộc
- Đơn vị nguồn và đích phải khác nhau
- Hệ số chuyển đổi phải là số dương
- Không được trùng lặp chuyển đổi

### Cách sử dụng
1. Vào màn hình chi tiết sản phẩm
2. Chọn tab "Đơn vị"
3. Nhấn nút "+" để thêm chuyển đổi mới
4. Chọn đơn vị và nhập hệ số
5. Nhấn "Lưu"

## 3. Định mức nguyên liệu (Product BOM)

### Mục đích
Định nghĩa danh sách nguyên vật liệu và số lượng cần thiết để sản xuất 1 đơn vị sản phẩm.

### Điều kiện hiển thị
⚠️ **Quan trọng**: Tab "Định mức" chỉ hiển thị cho:
- Bán thành phẩm (semi_finished)
- Thành phẩm (finished_product)

### Các trường dữ liệu
- **Nguyên liệu** (*): Chọn từ danh sách sản phẩm loại "Nguyên vật liệu"
- **Số lượng** (*): Số lượng nguyên liệu cần thiết
- **Đơn vị** (*): Đơn vị tính của nguyên liệu

### Validation
- Nguyên liệu và đơn vị là bắt buộc
- Số lượng phải là số dương
- Không được trùng lặp nguyên liệu trong cùng BOM

### Cách sử dụng
1. Vào màn hình chi tiết sản phẩm (phải là bán thành phẩm hoặc thành phẩm)
2. Chọn tab "Định mức"
3. Nhấn nút "+" để thêm nguyên liệu
4. Chọn nguyên liệu, nhập số lượng và đơn vị
5. Nhấn "Lưu"

### Ví dụ
Sản phẩm: Bánh mì (Thành phẩm)
- Bột mì: 500 gram
- Đường: 50 gram
- Muối: 10 gram
- Men: 5 gram
- Nước: 300 ml

## 4. Workflow tổng quát

### Tạo sản phẩm mới
1. Vào màn hình "Sản phẩm"
2. Nhấn nút "+" để thêm sản phẩm mới
3. Điền thông tin cơ bản (mã, tên, loại, đơn vị...)
4. Nhấn "Thêm mới"

### Cấu hình chi tiết
1. Chọn sản phẩm vừa tạo để xem chi tiết
2. Cấu hình các tab theo thứ tự:
   - **Thông tin**: Xem/sửa thông tin cơ bản
   - **Quy cách**: Thêm các biến thể sản phẩm
   - **Đơn vị**: Định nghĩa chuyển đổi đơn vị
   - **Định mức**: (Chỉ với bán thành phẩm/thành phẩm) Thêm nguyên liệu

### Cập nhật thông tin
- Tất cả các thay đổi được lưu ngay lập tức vào database
- Sử dụng pull-to-refresh để tải lại dữ liệu mới nhất

## 5. API Endpoints

### Products
- `GET /api/products` - Danh sách sản phẩm
- `GET /api/products/:id` - Chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm mới
- `PUT /api/products/:id` - Cập nhật sản phẩm
- `DELETE /api/products/:id` - Xóa sản phẩm

### Product Specifications
- `GET /api/product_specifications?where={"product_id":1}` - Lấy quy cách của sản phẩm
- `POST /api/product_specifications` - Tạo quy cách
- `DELETE /api/product_specifications/:id` - Xóa quy cách

### Product Unit Conversions
- `GET /api/product_unit_conversions?where={"product_id":1}` - Lấy chuyển đổi đơn vị
- `POST /api/product_unit_conversions` - Tạo chuyển đổi
- `DELETE /api/product_unit_conversions/:id` - Xóa chuyển đổi

### Product BOM
- `GET /api/product_bom?where={"product_id":1}` - Lấy BOM của sản phẩm
- `POST /api/product_bom` - Tạo BOM item
- `DELETE /api/product_bom/:id` - Xóa BOM item

## 6. Lưu ý kỹ thuật

### Components
- **ProductSpecifications.js**: Component quản lý quy cách
- **ProductUnitConversions.js**: Component quản lý đơn vị
- **ProductBOM.js**: Component quản lý định mức
- **ProductDetailScreen.js**: Màn hình tích hợp tất cả

### State Management
- Các components sử dụng local state để quản lý dữ liệu
- Sử dụng `useEffect` để đồng bộ với props
- Callback `onUpdate` để thông báo thay đổi lên parent component

### Validation
- Validation được thực hiện ở client-side trước khi gửi API
- Sử dụng `Alert.alert` để thông báo lỗi cho người dùng
- Kiểm tra trùng lặp và tính hợp lệ của dữ liệu

## 7. Troubleshooting

### Không thấy tab "Định mức"
- Kiểm tra loại sản phẩm phải là "Bán thành phẩm" hoặc "Thành phẩm"
- Sửa loại sản phẩm bằng cách nhấn nút "Sửa" trên màn hình chi tiết

### Lỗi khi lưu dữ liệu
- Kiểm tra kết nối mạng
- Đảm bảo API server đang chạy
- Kiểm tra console log để xem chi tiết lỗi

### Dữ liệu không cập nhật
- Sử dụng pull-to-refresh để tải lại
- Kiểm tra xem dữ liệu đã được lưu vào database chưa

## 8. Best Practices

### Đặt tên quy cách
- Sử dụng tên ngắn gọn, dễ hiểu
- VD: "Kích thước", "Màu sắc", "Chất liệu"
- Tránh dùng ký tự đặc biệt

### Đơn vị chuyển đổi
- Luôn định nghĩa chuyển đổi từ đơn vị nhỏ nhất
- VD: Gram → Kg, Chai → Thùng
- Đảm bảo hệ số chính xác

### Định mức BOM
- Cập nhật định kỳ khi có thay đổi
- Kiểm tra tính khả thi trong sản xuất
- Document lý do thay đổi trong notes

## 9. Updates Log

### Version 1.0 (2025-01-18)
- ✅ Thêm component ProductSpecifications
- ✅ Thêm component ProductUnitConversions
- ✅ Thêm component ProductBOM
- ✅ Tích hợp vào ProductDetailScreen với tabs
- ✅ Thêm validation cho tất cả components
- ✅ Logic hiển thị BOM chỉ cho bán thành phẩm/thành phẩm
- ✅ Kết nối với API endpoints
- ✅ UI/UX improvements

---

**Liên hệ hỗ trợ**: Nếu gặp vấn đề, vui lòng tạo issue trên repository hoặc liên hệ team phát triển.
