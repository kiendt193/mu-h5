# MU H5 Full 2.8 — Game gốc

✅ **Đã upload mã nguồn và tài nguyên game lên GitHub**, bao gồm `game/server.cjs`, `game/public/index.html`, `game/public/assets` (hơn 13.000 tệp đồ họa) và 36 bản cập nhật đã gộp. Dữ liệu `game/release.json` xác nhận phiên bản **2.8**, nền **12.17**.

## Triển khai MIỄN PHÍ bằng Render

1. Mở https://dashboard.render.com và đăng nhập GitHub.
2. Chọn **New → Web Service** và chọn repository `kiendt193/mu-h5`, nhánh `main`.
3. Chọn cấu hình `render.yaml` hoặc dùng: Runtime **Node**, Plan **Free**, Root Directory để trống, Build Command `cd game && npm install --omit=dev`, Start Command `node game/server.cjs`.
4. Cấu hình biến môi trường `HOST=0.0.0.0`, `MU_TRUST_PROXY=1` (các giá trị này đã có trong `render.yaml`), không bật `MU_OFFLINE=1` trên website công khai.
5. Khi triển khai Live, truy cập `https://<ten-service>.onrender.com/mu/`. API health: `/mu/api/health`.

**Lưu ý:** Render Free có thể tự ngừng khi không truy cập và hệ thống file của dịch vụ không lưu bền sau khi khởi động lại/triển khai lại. Game gốc dùng `accounts.json`, nên không dùng Render Free để lưu tài khoản/nhân vật quan trọng. Đây là phương án để thử nghiệm; muốn giữ dữ liệu không trả phí nên chạy game trên máy Windows với bản offline và tùy chọn Cloudflare Tunnel.

## Chơi offline trên máy tính Windows

Dùng gói `MU_H5_Full_2_8_ORIGINAL_OFFLINE` được chia thành 3 phần ZIP trong cuộc trò chuyện, hoặc áp dụng `MU_H5_2_8_OFFLINE_PATCH.zip` trên bộ Full 2.8 cũ. Cài Node.js 18+, chạy `START_GAME_OFFLINE.cmd`, mở `http://localhost:18082/mu/`. Nhân vật sẽ lưu ở `OFFLINE_SAVE` trên PC. Không cần VPS.

## Phân biệt bản demo

Đường link Railway `mu-h5-offline-web-production.up.railway.app` chỉ có trang thông báo, không phải game. Tệp `offline/index.html` là thông báo ngừng demo; để chơi game thật hãy dùng `/mu/` của server Node.js.

**Bảo mật:** Repository hiện **PUBLIC**. Tránh tải lên `accounts.json`, `.env`, mật khẩu, token, khóa bí mật hay dữ liệu người dùng.
