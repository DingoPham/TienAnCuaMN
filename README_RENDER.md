# Quản lý tiền ăn — Render

## Kiến trúc

Browser
  -> Render `/api/submit`
  -> Google Apps Script
  -> Google Sheets

Frontend không chứa URL Google Apps Script.

## Deploy lên Render

1. Đưa toàn bộ thư mục này lên một GitHub repository.
2. Trên Render chọn **New → Web Service**.
3. Kết nối repository.
4. Runtime: Node.
5. Build Command:
   `npm install`
6. Start Command:
   `npm start`
7. Trong Environment Variables thêm:
   - Key: `GOOGLE_SCRIPT_URL`
   - Value: URL Web App của Google Apps Script, dạng:
     `https://script.google.com/macros/s/xxxxx/exec`
8. Deploy.

Render sẽ cấp URL kiểu:
`https://ten-app.onrender.com`

Mở URL đó để sử dụng form.

## Vì sao URL Apps Script không lộ ở frontend?

`public/app.js` chỉ gọi:

`/api/submit`

Render server đọc:

`process.env.GOOGLE_SCRIPT_URL`

rồi server mới gọi Google Apps Script.

Do đó người dùng F12/Inspect chỉ thấy `/api/submit`, không thấy URL Google Apps Script.

## Lưu ý bảo mật

Đây là cách giấu URL Apps Script khỏi frontend, nhưng endpoint `/api/submit` vẫn có thể bị người khác gọi trực tiếp.

Nếu muốn chống spam, có thể bổ sung:
- API key/session
- rate limit
- Cloudflare Turnstile
- kiểm tra dữ liệu đầu vào
- giới hạn request/IP

## Google Apps Script

Dùng `Code.gs` trong bộ source trước đó. Google Apps Script vẫn cần deploy dạng Web App với quyền phù hợp để Render server gọi được.
