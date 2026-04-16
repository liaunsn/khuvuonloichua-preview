# 📑 BẢN ĐẶC TẢ KỸ THUẬT (TECHNICAL SPECIFICATION) 
**DỰ ÁN: "KHU VƯỜN LỜI CHÚA" - TIKTOK TRACKING GAMIFICATION**

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
* **Mục tiêu:** Xây dựng một Landing Page nội bộ để theo dõi tiến độ đăng video TikTok của 3 nhóm (Pistis, Elpis, Agape) trong một cuộc thi thi đua. Giao diện thể hiện dưới dạng 3 cái cây lớn lên theo số lượng video.
* **Thời gian chạy sự kiện:** 15 ngày (16/04 - 30/04).
* **Lượng truy cập dự kiến:** ~380 pageviews/ngày (Tần suất F5 cao từ nội bộ).
* **Tiêu chí cốt lõi:** Load siêu nhanh, mượt mà, không tốn phí duy trì bên thứ 3, giao diện có tính tương tác cao (gamification).

---

## 2. KIẾN TRÚC HỆ THỐNG & NỀN TẢNG (ARCHITECTURE)
* **Domain:** Tạo Subdomain `samac.tntanviet.com` trực tiếp trên Hosting Control Panel (cPanel/DirectAdmin), thư mục root riêng biệt. **KHÔNG** chạy qua hệ thống WordPress của web chính để đảm bảo tốc độ và bảo mật.
* **Tech Stack:** HTML5, CSS3, Vanilla JavaScript (JS thuần) + 1 thư viện JS siêu nhẹ cho hiệu ứng pháo giấy. Không cài đặt Backend (Node/PHP) hay Database (SQL).
* **Kiến trúc trang:** **One-page Smooth Scrolling** — Toàn bộ nội dung nằm trên một trang HTML duy nhất, chia thành nhiều `<section>` có `id` riêng. Thanh điều hướng (Navbar) sử dụng Anchor Link (`#id`) kết hợp CSS `scroll-behavior: smooth` và `scroll-padding-top` để cuộn mượt mà mà không bị Navbar che khuất nội dung.
* **Responsive:** Grid 3 cột trên Desktop/Tablet. Xếp chồng theo chiều dọc (1 cột) trên Mobile.

---

## 3. QUẢN TRỊ DỮ LIỆU (DATABASE & ADMIN PANEL)
Thay vì làm trang Admin phức tạp, hệ thống sử dụng **Google Sheets** làm cơ sở dữ liệu.
* **Luồng dữ liệu:** Admin sửa số trên Google Sheets -> Google Sheets tự động xuất bản file `.csv` (Publish to Web) -> Code JS trên website dùng hàm `fetch()` để tải file `.csv` về, bóc tách chuỗi và lấy ra 3 biến số lượng video của 3 đội.
* **Bảo mật:** File Google Sheets cấp quyền "Hạn chế" (Chỉ Admin được xem/sửa). Website chỉ đọc file `.csv` public một chiều (Read-only).
* **Tần suất cập nhật:** Gọi `fetch()` mỗi khi người dùng load trang (Page Load).

---

## 4. TÍCH HỢP VIDEO TIKTOK (VIDEO EMBEDDING)
* **Quyết định:** **BỎ** các công cụ bên thứ 3 (như Tagembed) để tránh vượt giới hạn quota (500 views/tháng) và làm chậm web.
* **Triển khai:** Sử dụng **Native Embed Code của TikTok**. Dành ra 1 khu vực dưới mỗi cái cây để Admin dán mã nhúng iframe của 1-2 video đại diện (hay nhất/mới nhất) của đội đó. Đảm bảo 100% miễn phí và tốc độ load tối ưu từ CDN của TikTok.

---

## 5. LOGIC HIỂN THỊ "CÂY MỌC LÁ" (CORE LOGIC)
Design đã chuẩn bị **4 Asset hình ảnh 2D (Đuôi PNG trong suốt)** cho mỗi nhóm: 
1. `seed_tennhom.png` (Hạt mầm) 
2. `sprout_tennhom.png` (Nảy mầm)
3. `sapling_tennhom.png` (Cây con vững chãi - chưa có/có rất ít lá)
4. `leaf.png` (1 chiếc lá đơn lẻ, dùng chung cho cả 3 nhóm).

**Thuật toán hiển thị:**
* **Mốc 0 clip:** Hiển thị `seed_tennhom.png`.
* **Mốc 2 clips:** Hiển thị `sprout_tennhom.png`.
* **Mốc 3 clips:** Hiển thị `sapling_tennhom.png`.
* **Mốc > 3 clips (Ví dụ N clips):** * Lấy `sapling_tennhom.png` làm base (nền tĩnh).
    * JS tự động sinh ra `(N - 3)` thẻ `<img>` chứa `leaf.png`.
    * Các thẻ lá này được gán tọa độ (Top, Left) ngẫu nhiên (Random Positioning) nhưng bị giới hạn bằng code trong một "Bounding Box" (vùng an toàn) hình tròn ở nửa trên của cây, đảm bảo lá không mọc lộn xuống đất.

---

## 6. UI/UX & GAMIFICATION (HIỆU ỨNG & TƯƠNG TÁC)
Đây là phần quan trọng để web nhìn "xịn" dù chỉ dùng ảnh tĩnh 2D:

* **1. Nhận diện màu sắc nhóm:** Chậu cây/nền đất và Thanh tiến trình (Progress bar) của mỗi cột phải mang màu sắc chuẩn của nhóm (Pistis / Elpis / Agape).
* **2. Hiệu ứng Hover/Touch:** Khi user trỏ chuột hoặc chạm vào cây, ảnh cây sẽ Scale nhẹ (1.05) hoặc xoay (Rotate 2deg) mượt mà bằng CSS `transition`.
* **3. Thanh tiến trình (Progress Bar):** Nằm dưới cây, chạy phần trăm theo tiến độ đạt mốc tiếp theo.
* **4. Hiệu ứng mọc lá cá nhân hóa (LocalStorage):**
    * Web dùng `localStorage` lưu số lượng lá *lần cuối* user nhìn thấy.
    * Nếu lần truy cập mới có số lá cao hơn số trong `localStorage`, số lượng lá chênh lệch sẽ được áp dụng CSS Animation: Bắt đầu từ Scale(0) -> Scale(1.2) -> Scale(1) đồng thời Fade In (Opacity 0 -> 1) với độ trễ khoảng 0.5s sau khi load trang. Các lá cũ hiển thị bình thường.
* **5. Tôn vinh Top 1 (Dynamic Leaderboard):**
    * **Vương miện:** JS so sánh số clip, đội cao nhất sẽ được tự động chèn 1 icon Vương miện 👑 (có animation lấp lánh) lên ngọn cây.
    * **Hào quang (Glow):** Cột của đội Top 1 có CSS `box-shadow` phát sáng mờ đúng theo màu sắc của đội đó.
* **6. Pháo giấy vinh danh (Milestone Confetti):** Sử dụng thư viện JS siêu nhẹ (ví dụ: *canvas-confetti*). Khi logic `localStorage` phát hiện số video vừa vượt qua các mốc quan trọng (VD: 10, 20 clip), gọi hàm bắn pháo giấy full màn hình trong 3 giây.
* **7. Thanh điều hướng dính (Sticky Navbar - Glassmorphism):**
    * Dùng `position: sticky; top: 0; z-index: 999` với hiệu ứng kính mờ `backdrop-filter: blur()`.
    * Layout Flexbox chia 3 khu vực: [Trái] Tên chiến dịch in hoa, [Giữa] 3 Anchor Link cuộn đến section, [Phải] Logo tròn + 2 dòng text branding.
    * **Responsive Mobile:** Ẩn 2 dòng text branding bằng CSS Media Query `max-width: 768px`, chỉ giữ logo.
* **8. Section Giới Thiệu Các Nhóm (Horizontal Cards):**
    * 3 Card nằm ngang xếp chồng dọc. Mỗi card dùng Flexbox `row`: Ảnh nhóm (~1/3) | Text giới thiệu (~2/3).
    * **Responsive Mobile:** Chuyển thành `flex-direction: column` (Ảnh trên, Chữ dưới).
* **9. Section Hoạt Động Chính (Facebook Embed):**
    * Grid/Flex layout chứa 3-4 khối placeholder (border đứt đoạn) để Admin dán mã nhúng iframe Facebook Post.
    * Iframe responsive chiếm 100% width của khối chứa.

---

## 7. QUY TRÌNH VẬN HÀNH CỦA ADMIN (WORKFLOW)
Khi website đã release, đội ngũ quản trị chỉ cần làm 3 việc:
1.  **Chấm điểm:** Thấy clip mới trên TikTok hợp lệ -> Mở Google Sheets trên điện thoại/PC -> Tăng số đếm của nhóm đó lên 1. (Cây sẽ tự động mọc lá cho toàn bộ người xem).
2.  **Cập nhật Video TikTok:** Lấy mã Embed của clip mới -> Mở file `index.html` trên File Manager của Hosting -> Dán đè mã iframe mới vào khung TikTok của nhóm tương ứng (Section "Cây Lời Chúa").
3.  **Cập nhật bài Facebook:** Lấy mã Embed của bài Post Facebook -> Dán vào khung placeholder trong Section "Hoạt Động Chính" của file `index.html`.