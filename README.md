# WebNangCao

Đây là dự án Web Nâng Cao bao gồm server (API) và hai client (admin và customer).

## Cấu trúc dự án

- `server`: Backend API server sử dụng Node.js và Express
- `client-admin`: Frontend cho quản trị viên sử dụng React
- `client-customer`: Frontend cho khách hàng sử dụng React

## Hướng dẫn triển khai lên Render.com

### Bước 1: Tạo tài khoản và kết nối repository GitHub

1. Đăng ký tài khoản tại [Render.com](https://render.com)
2. Kết nối tài khoản GitHub của bạn với Render.com
3. Fork hoặc push code lên GitHub repository của bạn:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/quytai0402/WebNangCao.git
git push -u origin main
```

### Bước 2: Thiết lập biến môi trường

Trong Render.com Dashboard, bạn cần thiết lập các biến môi trường dựa trên file `.env.example`:

1. Thông tin MongoDB
2. Thông tin Cloudinary
3. JWT Secret
4. Email SMTP
5. OpenAI API Key
6. Các thông tin khác

### Bước 3: Tạo dịch vụ trên Render.com

#### Cách 1: Sử dụng Blueprint (Khuyến nghị)

1. Trong Render.com Dashboard, chọn "Blueprints"
2. Chọn "New Blueprint Instance"
3. Chọn repository GitHub của bạn
4. Render sẽ tự động đọc file `render.yaml` và tạo các dịch vụ

#### Cách 2: Tạo thủ công

Nếu không muốn sử dụng Blueprint, bạn có thể tạo thủ công 3 dịch vụ:

1. **API Server**:
   - Type: Web Service
   - Name: webnangcao-api
   - Environment: Node
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Thêm biến môi trường từ `.env.example`

2. **Admin Client**:
   - Type: Web Service
   - Name: webnangcao-admin
   - Environment: Node
   - Build Command: `cd client-admin && npm install && npm run build`
   - Start Command: `cd client-admin && npx serve -s build`
   - Thêm biến môi trường: 
     - `NODE_ENV=production`
     - `REACT_APP_API_URL=https://webnangcao-api.onrender.com`

3. **Customer Client**:
   - Type: Web Service
   - Name: webnangcao-customer
   - Environment: Node
   - Build Command: `cd client-customer && npm install && npm run build`
   - Start Command: `cd client-customer && npx serve -s build`
   - Thêm biến môi trường: 
     - `NODE_ENV=production`
     - `REACT_APP_API_URL=https://webnangcao-api.onrender.com`

### Bước 4: Triển khai

1. Sau khi tạo dịch vụ, Render sẽ tự động triển khai từ GitHub repository
2. Theo dõi tiến trình triển khai trong tab "Logs" của mỗi dịch vụ
3. Khi triển khai hoàn tất, bạn có thể truy cập các URL:
   - API: https://webnangcao-api.onrender.com
   - Admin: https://webnangcao-admin.onrender.com
   - Customer: https://webnangcao-customer.onrender.com

### Bước 5: Cấu hình CORS (Nếu cần)

Nếu gặp lỗi CORS, kiểm tra file `server/index.js` đã có các domain của Render.com trong danh sách CORS chưa.

### Lưu ý quan trọng

- Render.com cung cấp gói miễn phí nhưng có giới hạn về tài nguyên và thời gian
- Dịch vụ miễn phí sẽ tạm ngừng hoạt động khi không được sử dụng và khởi động lại khi có request
- Thời gian khởi động có thể mất từ 30 giây đến 1 phút
- Nếu cần dịch vụ liên tục, hãy xem xét nâng cấp lên gói trả phí 