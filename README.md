# Thiên Mệnh Tinh Đồ

Trang web tĩnh xem lá số tử vi/chiêm tinh theo phong cách fantasy, xây từ tài liệu `huong-dan-xay-dung-web-tu-vi.md`.

## Cấu trúc

```text
astro-tuvi/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── ephemeris.js
│   ├── lunar.js
│   ├── tuvi.js
│   ├── western.js
│   ├── gio-hoang-dao.js
│   └── privacy.js
├── data/
│   ├── stars.json
│   └── interpretations.json
└── README.md
```

Trong workspace hiện tại, `d:\Tu_vi` chính là thư mục gốc của `astro-tuvi`.

## Cách chạy

Vì trang dùng ES modules và `fetch()` để đọc JSON, hãy chạy bằng static server:

```bash
python -m http.server 8080
```

Sau đó truy cập `http://localhost:8080`.

## Tính năng

- Nhập họ tên, ngày sinh, giờ hoàng đạo, nơi sinh và trọng tâm luận giải.
- Người dùng chọn riêng `Bản đồ sao` hoặc `Tử vi` trước khi lập kết quả.
- `js/ephemeris.js`: Julian Day, kinh độ Mặt Trời/Mặt Trăng xấp xỉ, cung hoàng đạo.
- Bản đồ sao ưu tiên tải `astronomia@4` qua CDN để tính vị trí thiên thể chính xác hơn; nếu CDN lỗi thì tự dùng công thức fallback offline.
- `js/lunar.js`: chuyển đổi ngày dương sang âm lịch theo múi giờ Việt Nam.
- `js/western.js`: dựng lá số chiêm tinh Tây phương cơ bản gồm Cung Mặt Trời và Cung Mặt Trăng.
- `js/tuvi.js`: Can Chi, ngũ hành, Cung Mệnh dựa trên ngày/tháng/năm âm lịch.
- `js/gio-hoang-dao.js`: bảng 12 giờ hoàng đạo và ánh xạ giờ.
- `js/privacy.js`: xóa dữ liệu nhập sau khi render.
- Landing page đầu trang có mặt trăng lơ lửng, nền sao và đổi pha trăng mỗi 5 giây.
- Chế độ Bản đồ sao hiển thị vòng hoàng đạo và đủ 12 cung hoàng đạo.
- Chế độ Tử vi hiển thị lá số 12 cung với chính tinh, phụ tinh và sát tinh tham khảo.
- Cân bằng ngũ hành, hành vượng/yếu, cách bồi dưỡng hành thiếu, Cung Mệnh đơn giản hóa và luận giải theo 12 cung hoàng đạo.
- Vẽ bản đồ sao/lá số bằng canvas và tải xuống PNG.
- Không ghi dữ liệu người dùng vào localStorage, sessionStorage hoặc cookie.

## Ghi chú độ chính xác

Bản này ưu tiên không backend và không lưu dữ liệu cá nhân. Lịch âm đã được tính theo thuật toán âm lịch Việt Nam để cải thiện Can Chi năm/tháng và Cung Mệnh. Bản đồ sao ưu tiên dùng `astronomia@4` từ CDN cho vị trí thiên thể; khi không có mạng sẽ quay về công thức fallback. Tử vi hiện an 12 cung và phân bố sao theo bộ quy tắc nội bộ tham khảo; để đạt cấp chuyên nghiệp cần bổ sung đầy đủ hệ an sao truyền thống, cung Thân, Cục, vòng Tràng Sinh, Lộc Tồn, Thái Tuế và các sao theo can năm.
