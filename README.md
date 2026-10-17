# MU H5 Full 2.8 — bộ game gốc

**Lưu ý:** Repository này **chưa chứa toàn bộ 613 MB file game**. Code ở `offline/index.html` trước đó chỉ là bản demo tự dựng, **không phải MU H5 Full 2.8 gốc** và đã ngừng giới thiệu như bản chính thức.

## Chơi đúng bản game gốc ở chế độ offline (Windows)

Tải `MU_H5_Full_2_8_ORIGINAL_OFFLINE.zip.001`, `.002`, `.003` do ChatGPT cung cấp trong cuộc trò chuyện, đặt cùng một thư mục rồi ghép 3 phần thành `MU_H5_Full_2_8_ORIGINAL_OFFLINE.zip`.

Giải nén ZIP và chạy `START_GAME_OFFLINE.cmd`. Máy phải cài Node.js 18 trở lên. Mở `http://localhost:18082/mu/` để chơi. Không phải đăng ký tài khoản; dữ liệu nhân vật lưu trong `OFFLINE_SAVE/accounts.json`. Toàn bộ giao diện, tài nguyên và gameplay sử dụng game gốc trong `game/`, chỉ có lớp đăng nhập được bỏ qua ở bản offline. **Không cần VPS**, nhưng máy tính của bạn phải chạy Node.js khi chơi.

Nếu đã có phiên bản `MU_H5_Full_2_8.zip` gốc, giải nén đè `MU_H5_2_8_OFFLINE_PATCH.zip` lên thư mục chứa `game` rồi chạy launcher mới.

### Tình trạng link web

Đường link Railway `https://mu-h5-offline-web-production.up.railway.app/` hiện chỉ hiển thị thông báo, không còn trình bày demo là game gốc. Để chơi game gốc qua link công khai cần tải toàn bộ mã nguồn/tài nguyên lên host có Node.js và dữ liệu lưu bền vững. Việc đó chưa hoàn tất.

**Bảo mật:** Không đưa `accounts.json`, khóa riêng, token, hay tệp `.env` lên repository PUBLIC.
