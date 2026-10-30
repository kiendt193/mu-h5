# MU H5 Full 2.8 — cài lên VPS, GIỮ NGUYÊN tài khoản/nhân vật Neon

Gói này lấy từ GitHub \`kiendt193/mu-h5\` (nhánh \`main\`), bao gồm **máy chủ Node.js + toàn bộ tài nguyên game**.
Không kèm mật khẩu, tài khoản, database dump hoặc \`DATABASE_URL\`.

## Nguyên tắc giữ dữ liệu

- **VPS:** chạy game Node.js, lưu mã và toàn bộ file hình ảnh/bản đồ/mô hình.
- **Neon PostgreSQL hiện tại:** tiếp tục giữ trạng thái tài khoản, nhân vật, trang bị, Zen và tiến trình.
- **Cloudflare Workers CDN:** \`https://mu-h5.kiendt193-fpt.workers.dev\` tiếp tục phục vụ tài nguyên khi mã phiên bản khớp; nếu không khớp, game dùng tài nguyên có sẵn trên VPS.
- **Cần cấu hình đúng cùng \`DATABASE_URL\` đang dùng ở Render.** Không cần nhập/xuất, tạo tài khoản hoặc sao chép bảng.
- **QUAN TRỌNG: chỉ cho phép MỘT máy chủ game ghi vào Neon tại một thời điểm.** VPS và Render không được cùng chạy server chính trên chung Neon do ứng dụng hiện lưu trạng thái game trong một hàng JSONB. Trước khi đưa VPS lên online, tắt server Render hoặc đổi Render sang redirect/chế độ không ghi; nếu hai máy cùng ghi, người chơi có thể bị mất tiến độ!

## 1. VPS cần gì?

- Ubuntu Server 22.04/24.04 hoặc Debian 12, Node.js 22, npm, unzip, nginx.
- Đề xuất để thử 100 người + 50 AI: từ 4 vCPU/8 GB RAM; cần kiểm thử hiệu năng thực tế. **Không bảo đảm 100 người mượt** chỉ bằng cấu hình.
- Dùng CentOS 7 rất dễ lỗi thư viện glibc với Node.js 22; khuyến nghị đổi sang Ubuntu/Debian thay vì cố ép cài Node hiện đại trên CentOS 7.

## 2. Giải nén vào VPS

Upload \`MU_H5_Full_2.8_VPS_Neon_20261030.zip\` bằng SFTP/WinSCP hoặc trình quản lý file VPS, sau đó SSH:

\`\`\`bash
sudo apt update
sudo apt install -y unzip nginx
sudo mkdir -p /opt/mu-h5
sudo unzip MU_H5_Full_2.8_VPS_Neon_20261030.zip -d /opt/mu-h5
cd /opt/mu-h5/MU_H5_VPS_Neon/game
node -v
npm install --omit=dev
\`\`\`

Nếu \`node -v\` chưa là v22.x thì cài Node.js 22 phù hợp cho Ubuntu/Debian trước khi \`npm install\`. Lệnh \`npm install\` cũng xây lại manifest SHA-256 của game; không cần chỉnh file ảnh.

## 3. Kết nối Neon CŨ (bắt buộc)

Lấy chuỗi \`DATABASE_URL\` **đang được cấu hình cho MU H5 ở Render/Neon**, không tạo Neon project mới.
**Không dán chuỗi mật khẩu vào GitHub, log công khai, hoặc trò chuyện.**

Tạo file \`/etc/mu-h5/env\` trên VPS, quyền đọc hạn chế, ví dụ:

\`\`\`ini
NODE_ENV=production
MU_REQUIRE_DATABASE=1
DATABASE_URL='postgresql://USER:PASSWORD@NEON_HOST/DATABASE?sslmode=require'
PORT=18082
HOST=127.0.0.1
MU_TRUST_PROXY=1
MU_PUBLIC_ORIGIN=https://TEN-MIEN-CUA-BAN
\`\`\`

Thay \`DATABASE_URL\` bằng giá trị **thật đang sử dụng**, thay \`MU_PUBLIC_ORIGIN\` bằng domain HTTPS của VPS. Không dùng chuỗi mẫu để kết nối.
\`MU_REQUIRE_DATABASE=1\` sẽ làm game từ chối khởi động nếu chưa cấu hình Neon, ngăn tạo tài khoản trên ổ đĩa local.

Nếu bạn chưa có HTTPS/domain, có thể thử ở \`http://127.0.0.1:18082\` cục bộ trước, nhưng cần cấu hình reverse proxy HTTPS để người chơi online an toàn.

## 4. Chạy server bằng systemd

\`\`\`bash
sudo useradd --system --user-group --home-dir /opt/mu-h5 --shell /usr/sbin/nologin mu-h5 || true
sudo chown -R mu-h5:mu-h5 /opt/mu-h5/MU_H5_VPS_Neon
sudo install -d -m 750 -o root -g mu-h5 /etc/mu-h5
sudo nano /etc/mu-h5/env
sudo chown root:mu-h5 /etc/mu-h5/env
sudo chmod 640 /etc/mu-h5/env
sudo nano /etc/systemd/system/mu-h5.service
\`\`\`

Nội dung \`/etc/systemd/system/mu-h5.service\`:

\`\`\`ini
[Unit]
Description=MU H5 Full 2.8 VPS (Neon PostgreSQL)
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=mu-h5
Group=mu-h5
WorkingDirectory=/opt/mu-h5/MU_H5_VPS_Neon/game
EnvironmentFile=/etc/mu-h5/env
ExecStart=/usr/bin/node server.cjs
Restart=on-failure
RestartSec=5
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
\`\`\`

Lệnh kiểm tra đường dẫn Node: \`command -v node\`. Nếu không phải \`/usr/bin/node\`, sửa \`ExecStart\` theo đường dẫn thực tế (ưu tiên cài Node hệ thống).
Chỉ thực hiện bước bật game **sau khi chắc chắn Render không chạy tiến trình ghi cùng Neon**:

\`\`\`bash
sudo systemctl daemon-reload
sudo systemctl enable --now mu-h5
sudo systemctl status mu-h5 --no-pager
journalctl -u mu-h5 -n 80 --no-pager
curl -fsS http://127.0.0.1:18082/mu/api/health
\`\`\`

Phản hồi health phải có \`"ok":true\` và \`"storage":"postgres"\`. Nếu là \`"storage":"local-ephemeral"\` thì KHÔNG mở cho người chơi; kiểm tra lại \`MU_REQUIRE_DATABASE\`/\`DATABASE_URL\`.

## 5. Reverse proxy Nginx và HTTPS

Nginx chuyển tiếp \`/mu/\` đến Node \`127.0.0.1:18082\`, hỗ trợ SSE không bị buffer:

\`\`\`nginx
server {
    listen 80;
    server_name TEN-MIEN-CUA-BAN;
    location /mu/ {
        proxy_pass http://127.0.0.1:18082;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 3600s;
        proxy_buffering off;
    }
}
\`\`\`

Thay domain, kích hoạt Nginx, sau đó cấp TLS HTTPS (ví dụ Certbot/Cloudflare). Đặt \`MU_PUBLIC_ORIGIN\` đúng với domain HTTPS thực tế.

## 6. Kiểm tra đồng bộ tài khoản cũ

1. Đảm bảo Render đã ngừng ghi vào cùng Neon.
2. Trước khi đổi máy chủ, sao lưu Neon theo cách an toàn.
3. Kiểm tra \`/mu/api/health\`: \`"storage":"postgres"\`.
4. Mở \`https://TEN-MIEN-CUA-BAN/mu/\`, đăng nhập **tài khoản và mật khẩu cũ**.
5. Kiểm tra nhân vật/trang bị/Zen còn nguyên, thử lưu và đăng nhập lại.
6. Chỉ khi xác nhận đúng mới công bố URL mới và chuyển người chơi sang VPS.

Nếu thấy tài khoản mới/trống, **dừng server ngay** và kiểm tra đúng Neon URL trước khi chơi tiếp. Không chạy đồng thời hai máy chủ ghi một trạng thái.

## 7. Cloudflare CDN đã tích hợp sẵn

Gói giữ nguyên toàn bộ \`game/public/assets\`, dù Cloudflare có sẵn, để vẫn chạy khi CDN tạm lỗi.
Trình duyệt chỉ sử dụng Cloudflare khi \`/mu/cdn-check.json\` xác nhận mã phiên bản tài nguyên trùng với máy chủ.
Không cần khóa Cloudflare hoặc mật khẩu Cloudflare trên VPS.

## Các vấn đề thường gặp

- \`MU_REQUIRE_DATABASE=1\`: thiếu \`DATABASE_URL\`.
- \`certificate verify failed\`: kiểm tra CA/cert hệ thống, kết nối Neon bằng TLS, không tắt xác minh chứng chỉ.
- \`EADDRINUSE\`: cổng 18082 đang có tiến trình dùng.
- \`502 Bad Gateway\`: Node chưa chạy, Nginx sai địa chỉ cổng.
- Lỗi phiên bản tài nguyên: Cloudflare và VPS có thể khác commit; mã nguồn có fallback về file VPS. Khi cập nhật game, xây lại manifest và đẩy lại Cloudflare tương ứng.
- Render khôi phục sau hết quota: không được để Render chạy server game đồng thời với VPS trên cùng Neon.
