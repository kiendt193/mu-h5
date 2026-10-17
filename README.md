# MU H5 Full 2.8

Game sử dụng Node.js >= 18 và tài nguyên trong `game/public/`. **Bộ mã nguồn/tài nguyên Full 2.8 chưa được upload hoàn chỉnh lên repository này.**

Sau khi upload đủ dữ liệu, máy chủ chạy bằng `node game/server.cjs`. Cần một dịch vụ Node.js chạy liên tục và lưu trữ bền vững cho MU_DATA để giữ dữ liệu nhân vật; GitHub Pages không chạy được backend.

Không đưa `accounts.json`, `.env`, token, khoá bí mật lên GitHub. Repository hiện PUBLIC: kiểm tra quyền phân phối các tài nguyên game trước khi upload.

Bạn có thể dùng gói công cụ `MU_H5_GitHub_Tools.zip` do ChatGPT tạo để upload nguồn từ Windows, rồi kết nối repository với Railway.


## Play offline — online link (lite version)

Open **https://mu-h5-offline-web-production.up.railway.app/** and choose one of 7 classes.
The offline browser source is at [offline/index.html](offline/index.html). Gameplay and progress are stored in your browser localStorage; no account, player server, or dedicated VPS is needed. This is a **reduced browser adaptation**, **not** the original full MU H5 2.8 client/assets.

## Play FULL MU H5 2.8 offline on Windows (original game)

The full source/assets package is distributed separately as `MU_H5_Full_2_8.zip` (not uploaded to this repo). Extract that package and place [START_MU_H5_OFFLINE.cmd](START_MU_H5_OFFLINE.cmd) next to the `game` folder.

Install Node.js >= 18 and double click the launcher. Open **http://localhost:18082/mu/**. Your local data is saved in `OFFLINE_SAVE/`. No VPS is used. Keep the CMD window open while playing.

**Never commit account saves or credentials to this public repository.**
