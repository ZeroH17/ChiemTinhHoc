# Hướng dẫn xây dựng trang web Dự đoán Lá số & Tử vi

> Tài liệu kỹ thuật đầy đủ: kiến trúc, nguồn dữ liệu, luồng xử lý, và ghi chú pháp lý.

---

## 1. Tổng quan dự án

### Mục tiêu
Xây dựng một trang web:
- Nhận thông tin đầu vào: họ tên, ngày/tháng/năm sinh, giờ hoàng đạo (tùy chọn)
- Tính toán và hiển thị lá số chiêm tinh (Western Astrology) hoặc Tử Vi (Đông phương)
- **Không lưu trữ bất kỳ dữ liệu cá nhân nào** — xử lý phía client, xóa ngay sau khi hiển thị kết quả
- Sử dụng kiến thức từ sách chiêm tinh học và API công khai

### Công nghệ đề xuất
- **Frontend**: HTML + CSS + Vanilla JavaScript (không cần framework)
- **Tính toán**: Thư viện JS phía client (không cần backend)
- **Dữ liệu**: API bên ngoài hoặc bảng dữ liệu tĩnh nhúng vào JS
- **Lưu trữ**: Không có — toàn bộ xử lý trong RAM trình duyệt, xóa khi reload

---

## 2. Cấu trúc thư mục

```
astro-tuvi/
├── index.html          ← Trang chính (form nhập liệu + kết quả)
├── css/
│   └── style.css       ← Giao diện huyền bí/tinh tế
├── js/
│   ├── main.js         ← Điều phối luồng chính
│   ├── ephemeris.js    ← Tính vị trí thiên thể (Swiss Ephemeris JS port)
│   ├── tuvi.js         ← Luận giải Tử Vi Đông phương
│   ├── western.js      ← Luận giải Chiêm tinh Tây phương
│   ├── gio-hoang-dao.js← Bảng 12 giờ hoàng đạo + can chi
│   └── privacy.js      ← Xử lý xóa dữ liệu sau khi render
├── data/
│   ├── stars.json      ← Bảng sao cố định (tùy chọn, nhúng offline)
│   └── interpretations.json ← Bảng luận giải từ sách
└── README.md
```

---

## 3. Phần nhập liệu — Form & Giờ Hoàng Đạo

### 3.1 Các trường thông tin

```html
<!-- Thông tin cơ bản -->
<input type="text"   id="ho-ten"    placeholder="Họ và tên đầy đủ" required />
<input type="date"   id="ngay-sinh" required />

<!-- Giờ hoàng đạo — dropdown, không bắt buộc nhập chính xác -->
<select id="gio-hoang-dao">
  <option value="">-- Không rõ giờ sinh --</option>
  <option value="ty">Giờ Tý (23:00 – 01:00)</option>
  <option value="suu">Giờ Sửu (01:00 – 03:00)</option>
  <option value="dan">Giờ Dần (03:00 – 05:00)</option>
  <option value="mao">Giờ Mão (05:00 – 07:00)</option>
  <option value="thin">Giờ Thìn (07:00 – 09:00)</option>
  <option value="ty2">Giờ Tỵ (09:00 – 11:00)</option>
  <option value="ngo">Giờ Ngọ (11:00 – 13:00)</option>
  <option value="mui">Giờ Mùi (13:00 – 15:00)</option>
  <option value="than">Giờ Thân (15:00 – 17:00)</option>
  <option value="dau">Giờ Dậu (17:00 – 19:00)</option>
  <option value="tuat">Giờ Tuất (19:00 – 21:00)</option>
  <option value="hoi">Giờ Hợi (21:00 – 23:00)</option>
</select>

<!-- Nơi sinh (quan trọng cho Ascendant — tùy chọn) -->
<input type="text" id="noi-sinh" placeholder="Tỉnh/Thành phố (tùy chọn)" />
```

### 3.2 Ánh xạ giờ hoàng đạo sang giờ số

```javascript
// gio-hoang-dao.js
const GIO_HOANG_DAO = {
  ty:   { start: 23, mid: 0,  can: "Canh/Nhâm/Giáp", hanh: "Thủy" },
  suu:  { start: 1,  mid: 2,  can: "Tân/Quý/Ất",     hanh: "Thổ"  },
  dan:  { start: 3,  mid: 4,  can: "Nhâm/Giáp/Bính",  hanh: "Mộc"  },
  mao:  { start: 5,  mid: 6,  can: "Quý/Ất/Đinh",     hanh: "Mộc"  },
  thin: { start: 7,  mid: 8,  can: "Giáp/Bính/Mậu",   hanh: "Thổ"  },
  ty2:  { start: 9,  mid: 10, can: "Ất/Đinh/Kỷ",      hanh: "Hỏa"  },
  ngo:  { start: 11, mid: 12, can: "Bính/Mậu/Canh",   hanh: "Hỏa"  },
  mui:  { start: 13, mid: 14, can: "Đinh/Kỷ/Tân",     hanh: "Thổ"  },
  than: { start: 15, mid: 16, can: "Mậu/Canh/Nhâm",   hanh: "Kim"  },
  dau:  { start: 17, mid: 18, can: "Kỷ/Tân/Quý",      hanh: "Kim"  },
  tuat: { start: 19, mid: 20, can: "Canh/Nhâm/Giáp",  hanh: "Thổ"  },
  hoi:  { start: 21, mid: 22, can: "Tân/Quý/Ất",      hanh: "Thủy" },
};

// Khi không chọn giờ → dùng giữa ngày (12:00) để tính Mặt Trời, bỏ qua Ascendant
function getDecimalHour(gioKey) {
  if (!gioKey) return 12.0; // fallback
  return GIO_HOANG_DAO[gioKey].mid;
}
```

---

## 4. Nguồn dữ liệu & API

### 4.1 Tính toán vị trí thiên thể (Ephemeris)

#### Lựa chọn 1 — Thư viện JavaScript phía client (khuyên dùng)

**Astronomia.js** hoặc **Moshier Ephemeris JS**:

```bash
npm install astronomia
# hoặc tải file CDN:
# https://cdn.jsdelivr.net/npm/astronomia@4/dist/astronomia.min.js
```

```javascript
// Tính vị trí Mặt Trời (cung hoàng đạo)
import { solar } from 'astronomia';

function getSunSign(year, month, day, hour) {
  const jde = julianDay(year, month, day, hour);
  const lon = solar.apparentLongitude(jde); // 0–360 độ
  return longitudeToSign(lon);
}

function longitudeToSign(lon) {
  const signs = ["Bạch Dương","Kim Ngưu","Song Tử","Cự Giải",
                 "Sư Tử","Xử Nữ","Thiên Bình","Bọ Cạp",
                 "Nhân Mã","Ma Kết","Bảo Bình","Song Ngư"];
  return signs[Math.floor(lon / 30)];
}
```

#### Lựa chọn 2 — API từ Astro-Seek (miễn phí, có giới hạn)

Astro-Seek cung cấp các trang tính toán công khai. Bạn có thể dùng **web scraping** hoặc **URL parameters** để nhúng iframe:

```
https://horoscopes.astro-seek.com/birth-chart-horoscope-online?
  rok={YEAR}&mesic={MONTH}&den={DAY}&
  hodina={HOUR}&minuta=0&
  mesto=Ho+Chi+Minh&stat=VN&
  r_mesto=&r_stat=&
  house_system=placidus&
  hid_chiron=1
```

Nhúng dưới dạng `<iframe>` để hiển thị chart trực tiếp từ Astro-Seek — **không cần API key**.

#### Lựa chọn 3 — Astro.com (chỉ iframe, không có API công khai)

```html
<!-- Nhúng chart từ Astro.com qua URL động -->
<iframe 
  src="https://www.astro.com/cgi/chart.cgi?
       nhor=1&btyp=w2w&rs=3&
       nmonth={MONTH}&nday={DAY}&nyear={YEAR}&
       nh={HOUR}&nm=0"
  width="100%" height="600px">
</iframe>
```

> ⚠️ Astro.com không có API JSON công khai. Chỉ dùng được qua iframe embed.

#### Lựa chọn 4 — tracuubandosao.com (Vietnam-specific)

Website này tập trung vào **Tứ Trụ** và **Tử Vi** Đông phương. Không có API công khai, nhưng bạn có thể:

- Scrape kết quả bằng `fetch` + DOMParser (chú ý CORS)
- Hoặc redirect người dùng tới trang kết quả bằng cách điền URL có tham số

```javascript
function redirectToTracuu(ten, ngay, thang, nam, gio) {
  const url = `https://tracuubandosao.com/tu-vi?
    ten=${encodeURIComponent(ten)}&
    ngay=${ngay}&thang=${thang}&nam=${nam}&gio=${gio}`;
  window.open(url, '_blank');
}
```

---

### 4.2 Nguồn kiến thức luận giải (sách & dữ liệu tĩnh)

Không cần API — nhúng bảng luận giải thẳng vào file JSON:

#### Sách tham khảo để xây dựng bảng dữ liệu:

| Loại | Sách | Nội dung dùng |
|------|------|---------------|
| Chiêm tinh Tây | *The Only Astrology Book You'll Ever Need* – Joanna Martine Woolfolk | Đặc tính 12 cung, góc chiếu |
| Chiêm tinh Tây | *Astrology: Using the Wisdom of the Stars* – Carole Taylor | Hành tinh trong cung |
| Tử Vi | *Tử Vi Toàn Thư* – La Hồng Tiên (bản dịch) | An sao, giải đoán |
| Tứ Trụ | *Mệnh Lý Học* – Thiệu Vĩ Hoa | Can chi, ngũ hành |
| Tử Vi VN | *Tử Vi Đẩu Số* – Vân Đằng Thái Thứ Lang | Cung an, giải cung |

#### Ví dụ cấu trúc `interpretations.json`:

```json
{
  "sun_signs": {
    "Bạch Dương": {
      "element": "Lửa",
      "ruling_planet": "Sao Hỏa",
      "traits": ["năng động", "dũng cảm", "bốc đồng", "lãnh đạo"],
      "love": "Nhiệt huyết trong tình yêu, thích chinh phục. Cần người có thể bắt kịp nhịp sống nhanh.",
      "career": "Thích hợp với vai trò lãnh đạo, doanh nhân, thể thao, quân sự.",
      "health": "Chú ý vùng đầu và não, dễ bị đau đầu và tai nạn.",
      "lucky": { "numbers": [1, 9], "colors": ["Đỏ", "Cam"], "days": ["Thứ Ba"] }
    }
  },
  "gio_hoang_dao": {
    "ty": {
      "menh": "Kim",
      "description": "Người sinh giờ Tý thông minh, nhạy bén, có khả năng ứng biến tốt...",
      "tuong_hop": ["Sửu", "Thìn"],
      "ky_ki": ["Ngọ"]
    }
  },
  "can_chi": {
    "Giáp Tý": {
      "hanh": "Kim",
      "description": "Hải trung Kim — Vàng trong biển. Mạnh mẽ, kiên định..."
    }
  }
}
```

---

## 5. Luồng xử lý (Logic flow)

```
[Form nhập liệu]
       ↓
[Validate & Parse]
  - Tên: trim, không lưu
  - Ngày sinh → Julian Day Number (JDN)
  - Giờ hoàng đạo → giờ thập phân (hoặc null)
  - Nơi sinh → tọa độ (Google Geocoding API hoặc bảng tỉnh thành VN tĩnh)
       ↓
[Tính toán phía client]
  - Cung Mặt Trời (Sun Sign)              ← Ephemeris JS
  - Cung Mặt Trăng (Moon Sign)            ← Ephemeris JS (nếu có giờ)
  - Cung Mọc (Ascendant / Rising)         ← Cần giờ + tọa độ
  - Can Chi năm / tháng / ngày / giờ      ← Bảng can chi
  - Cung mệnh Tử Vi                       ← Thuật toán Tử Vi truyền thống
  - An sao (nếu đủ dữ liệu)               ← Bảng an sao
       ↓
[Tra cứu bảng luận giải]
  - Đọc interpretations.json (đã load)
  - Ghép kết quả tính toán với luận giải
       ↓
[Render kết quả]
  - Hiển thị báo cáo đẹp lên màn hình
  - Tùy chọn: link/iframe đến Astro-Seek, tracuubandosao.com
       ↓
[Xóa dữ liệu] ← privacy.js
  - Xóa tất cả biến JS chứa thông tin cá nhân
  - Không ghi vào localStorage, sessionStorage, cookie
  - Dữ liệu tự mất khi đóng tab hoặc reload
```

---

## 6. Bảo mật & Quyền riêng tư

### 6.1 File `privacy.js`

```javascript
// privacy.js — xóa dữ liệu ngay sau khi render xong
function clearUserData(dataObj) {
  // Xóa tất cả thuộc tính của object
  Object.keys(dataObj).forEach(k => {
    dataObj[k] = null;
    delete dataObj[k];
  });
}

function onResultRendered(userData) {
  // Gọi ngay sau khi DOM render xong
  setTimeout(() => {
    clearUserData(userData);
    console.log('[Privacy] Dữ liệu người dùng đã được xóa khỏi bộ nhớ.');
  }, 100);
}
```

### 6.2 Nguyên tắc không lưu trữ

```javascript
// ❌ KHÔNG làm
localStorage.setItem('user', JSON.stringify(data));
sessionStorage.setItem('birthdate', '1990-01-01');
document.cookie = "name=NguyenVanA";

// ✅ CHỈ dùng biến cục bộ trong hàm
function calculate(formData) {
  const result = compute(formData); // formData chỉ tồn tại trong scope này
  render(result);
  clearUserData(formData); // xóa ngay
  return null; // không trả về formData
}
```

### 6.3 Ghi chú pháp lý cần hiển thị trên web

```html
<p class="privacy-note">
  🔒 Chúng tôi không lưu trữ bất kỳ thông tin cá nhân nào.
  Toàn bộ tính toán diễn ra trực tiếp trên trình duyệt của bạn.
  Dữ liệu tự động xóa sau khi hiển thị kết quả.
</p>
```

---

## 7. Thuật toán cốt lõi

### 7.1 Tính Can Chi (Tứ Trụ)

```javascript
// Tính Can Năm
const CAN = ["Canh","Tân","Nhâm","Quý","Giáp","Ất","Bính","Đinh","Mậu","Kỷ"];
const CHI = ["Thân","Dậu","Tuất","Hợi","Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi"];

function getCanChiNam(year) {
  return CAN[year % 10] + " " + CHI[year % 12];
}

// Ví dụ: 1990 → Canh Ngọ, 2000 → Canh Thìn
```

### 7.2 Tính Cung Mệnh Tử Vi (đơn giản hóa)

```javascript
// Thuật toán an Cung Mệnh theo tháng và giờ sinh âm lịch
const CUNG_TU_VI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

function getCungMenh(thangAm, gioHoangDao) {
  // Công thức truyền thống: (tháng + giờ) mod 12
  const gioIndex = Object.keys(GIO_HOANG_DAO).indexOf(gioHoangDao);
  const index = (thangAm + gioIndex) % 12;
  return CUNG_TU_VI[index];
}
```

### 7.3 Tính Julian Day (cho Ephemeris)

```javascript
function julianDay(year, month, day, hour = 12) {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716))
       + Math.floor(30.6001 * (month + 1))
       + day + hour / 24 + B - 1524.5;
}
```

---

## 8. Giao diện đề xuất

### Màu sắc & phong cách

```css
/* Phong cách huyền bí — xanh đêm + vàng sao */
:root {
  --bg-deep:    #0d0d1a;
  --bg-card:    #1a1a2e;
  --accent:     #c9a84c;   /* vàng sao */
  --text-main:  #e8e0f0;
  --text-muted: #8888aa;
  --border:     rgba(201, 168, 76, 0.25);
  --glow:       rgba(201, 168, 76, 0.08);
}

body {
  background: var(--bg-deep);
  color: var(--text-main);
  font-family: 'Noto Serif', Georgia, serif;
  background-image: radial-gradient(ellipse at top, #1a1a3e 0%, #0d0d1a 70%);
}

.result-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem;
  margin: 1rem 0;
}

h1, h2 { color: var(--accent); letter-spacing: 0.05em; }
```

### Bố cục kết quả

```
┌────────────────────────────────────────────┐
│  ✦ Lá Số Chiêm Tinh của [Tên]             │
│  Sinh ngày [DD/MM/YYYY] • Giờ [Tên giờ]  │
├────────────────────────────────────────────┤
│  ☉ Cung Mặt Trời:  Bạch Dương            │
│  ☽ Cung Mặt Trăng: Thiên Bình            │
│  ↑ Cung Mọc:       Song Tử (nếu có giờ) │
├────────────────────────────────────────────┤
│  Tứ Trụ: Canh Ngọ | Ất Hợi | Giáp Dần  │
│  Cung Mệnh Tử Vi: Ngọ                   │
├────────────────────────────────────────────┤
│  [LUẬN GIẢI CHI TIẾT — từ bảng dữ liệu] │
├────────────────────────────────────────────┤
│  🔗 Xem thêm trên Astro-Seek             │
│  🔗 Tra cứu đầy đủ tại tracuubandosao   │
└────────────────────────────────────────────┘
```

---

## 9. Các thư viện JavaScript hữu ích

| Thư viện | Dùng cho | Link CDN |
|----------|----------|----------|
| `astronomia` | Tính vị trí hành tinh | npmjs.com/package/astronomia |
| `moment.js` | Xử lý ngày tháng | cdnjs.cloudflare.com |
| `lunar-calendar` | Chuyển đổi âm/dương lịch VN | npmjs.com/package/lunar-calendar |
| `chinese-calendar` | Can chi, tiết khí | npmjs.com/package/chinese-calendar |
| `d3.js` | Vẽ biểu đồ lá số dạng tròn | cdnjs.cloudflare.com |

---

## 10. Triển khai (Deployment)

### Tùy chọn miễn phí

| Nền tảng | Ưu điểm | Link |
|----------|---------|------|
| **GitHub Pages** | Miễn phí, HTTPS, CI/CD | pages.github.com |
| **Netlify** | Dễ dùng, form handling | netlify.com |
| **Vercel** | Nhanh, CDN toàn cầu | vercel.com |
| **Cloudflare Pages** | Bảo mật tốt, miễn phí | pages.cloudflare.com |

### Lệnh deploy GitHub Pages

```bash
# Khởi tạo
git init
git add .
git commit -m "Initial astro website"
git branch -M main
git remote add origin https://github.com/username/astro-tuvi.git
git push -u origin main

# Bật GitHub Pages trong Settings → Pages → Source: main branch
```

---

## 11. Lưu ý pháp lý & đạo đức

1. **Bản quyền dữ liệu**: Nội dung luận giải phải tự viết hoặc được cấp phép — không sao chép nguyên văn từ sách/website có bản quyền.

2. **Iframe nhúng**: Kiểm tra `robots.txt` và điều khoản dịch vụ của Astro-Seek, Astro.com trước khi nhúng. Astro-Seek cho phép nhúng chart; Astro.com hạn chế hơn.

3. **Tuyên bố miễn trừ**: Bắt buộc hiển thị trên trang:
   ```
   "Kết quả chỉ mang tính tham khảo và giải trí. 
   Không thay thế lời khuyên chuyên nghiệp về y tế, 
   tài chính hay pháp lý."
   ```

4. **GDPR / Luật PDPA VN**: Vì không lưu dữ liệu, trang web ít rủi ro. Vẫn nên có trang Chính sách quyền riêng tư ngắn gọn.

---

## 12. Bước tiếp theo (Checklist xây dựng)

- [ ] Tạo form HTML với 12 giờ hoàng đạo trong dropdown
- [ ] Tích hợp thư viện `lunar-calendar` để chuyển ngày âm lịch
- [ ] Xây dựng bảng `interpretations.json` từ sách tham khảo
- [ ] Viết `ephemeris.js` hoặc tích hợp `astronomia`
- [ ] Thiết kế UI theo phong cách huyền bí (tối + vàng)
- [ ] Viết `privacy.js` để xóa dữ liệu sau render
- [ ] Test với nhiều ngày sinh khác nhau
- [ ] Thêm link/iframe đến Astro-Seek cho chart đầy đủ
- [ ] Deploy lên GitHub Pages hoặc Netlify
- [ ] Thêm tuyên bố miễn trừ trách nhiệm

---

*Tài liệu này được viết để hướng dẫn xây dựng — không chứa dữ liệu người dùng và không yêu cầu backend.*
