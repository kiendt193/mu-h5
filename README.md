# MU H5 Full 2.8

Game sử dụng Node.js >= 18 và tài nguyên trong `game/public/`. **Bộ mã nguồn/tài nguyên Full 2.8 chưa được upload hoàn chỉnh lên repository này.**

Sau khi upload đủ dữ liệu, máy chủ chạy bằng `node game/server.cjs`. Cần một dịch vụ Node.js chạy liên tục và lưu trữ bền vững cho MU_DATA để giữ dữ liệu nhân vật; GitHub Pages không chạy được backend.

Không đưa `accounts.json`, `.env`, token, khoá bí mật lên GitHub. Repository hiện PUBLIC: kiểm tra quyền phân phối các tài nguyên game trước khi upload.

Bạn có thể dùng gói công cụ `MU_H5_GitHub_Tools.zip` do ChatGPT tạo để upload nguồn từ Windows, rồi kết nối repository với Railway.
