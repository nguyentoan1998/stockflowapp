# Setup Ngrok để test app từ xa

## Vấn đề
Khi dùng Expo tunnel, app không connect được server localhost vì:
- Server chạy trên `localhost:3001` 
- App chạy trên điện thoại/emulator không thể access localhost
- Timeout 15000ms khi login

## Giải pháp: Dùng Ngrok

### Bước 1: Cài đặt Ngrok
```bash
# Download từ: https://ngrok.com/download
# Hoặc dùng npm:
npm install -g ngrok
```

### Bước 2: Đăng ký tài khoản (Free)
- Truy cập: https://dashboard.ngrok.com/signup
- Lấy authtoken

### Bước 3: Setup Ngrok
```bash
# Xác thực
ngrok config add-authtoken YOUR_TOKEN

# Chạy ngrok cho server port 3001
ngrok http 3001
```

### Bước 4: Copy URL
Ngrok sẽ hiển thị:
```
Forwarding  https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:3001
```

### Bước 5: Cập nhật .env
```bash
# stockflowapp/.env
EXPO_PUBLIC_API_URL=https://xxxx-xx-xx-xx-xx.ngrok-free.app
```

### Bước 6: Restart Expo
```bash
# Stop server (Ctrl+C)
# Clear cache và restart
npm start --clear
```

## Các options khác

### Option 1: Local Network (Same WiFi) - Nhanh nhất
```bash
# .env
EXPO_PUBLIC_API_URL=http://192.168.1.139:3001
```
**Yêu cầu:** Điện thoại và máy tính cùng WiFi

### Option 2: Ngrok (Different Network) - Chậm hơn nhưng work everywhere
```bash
# .env
EXPO_PUBLIC_API_URL=https://xxxx-xx-xx-xx-xx.ngrok-free.app
```
**Yêu cầu:** Chạy ngrok, internet connection

### Option 3: Expo Tunnel (Không recommended cho API)
- Tunnel chỉ cho app, không expose server
- Vẫn cần ngrok cho server

## Troubleshooting

### Lỗi timeout
```
timeout of 15000ms exceeded
```
**Fix:** 
1. Check ngrok đang chạy: `curl https://your-ngrok-url.ngrok.io/health`
2. Check .env có đúng URL không
3. Restart expo: `npm start --clear`

### Lỗi 502 Bad Gateway
**Fix:** Check server đang chạy: `cd server && npm start`

### Ngrok free plan limits
- 40 requests/minute
- URL thay đổi mỗi lần restart
- Nên dùng paid plan ($8/month) để có fixed domain

## Testing

### 1. Test health endpoint
```bash
curl https://your-ngrok-url.ngrok.io/health
# Should return: {"status":"ok"}
```

### 2. Test login
```bash
curl -X POST https://your-ngrok-url.ngrok.io/auth/login \
  -H "Content-Type: application/json" \
  -H "X-API-Key: Domaytimduockeynaycuatao" \
  -d '{"user":"admin","password":"admin"}'
```

## Best Practice

### Development Workflow
1. **Same WiFi**: Dùng local IP (nhanh)
2. **Different location**: Dùng ngrok
3. **Production**: Deploy server lên cloud (Heroku, Railway, etc.)

### Script helpers
Thêm vào package.json:
```json
{
  "scripts": {
    "ngrok": "ngrok http 3001",
    "dev": "npm start --clear"
  }
}
```

## Notes
- Free ngrok URL thay đổi mỗi lần restart
- Phải update .env mỗi lần start ngrok mới
- Paid plan ($8/month) có fixed subdomain
- Latency cao hơn local network (200-500ms)
