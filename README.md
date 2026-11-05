# 🔮 Đền Giáo Chủ Dobby • Sảnh Vườn Nắng 3D (`dobby-sanctuary`)

> Không gian 3D tương tác bằng **Three.js + Vite + Supabase Realtime + Vercel Serverless** mô phỏng sảnh vườn Đền Giáo Chủ Dobby Hắc Ám với hội phù thuỷ chibi, camera xoay tự do 360° bám theo người chơi, nghi thức **Gõ Mõ Hắc Hoả 108** và hệ thống **Xin Quẻ 3 chế độ** (*Hôm nay ăn gì*, *Hôm nay đi đâu*, *Lá số tử vi*).

🌐 **Chơi Trực Tiếp Trên Vercel**: [https://dobby-sanctuary.vercel.app](https://dobby-sanctuary.vercel.app)  
🌿 **Mã Nguồn GitHub (Nhánh Độc Lập `dobby-sanctuary`)**: [https://github.com/qkn202/dobby-sanctuary/tree/dobby-sanctuary](https://github.com/qkn202/dobby-sanctuary/tree/dobby-sanctuary)  

---

## ✨ Tính Năng Nổi Bật

- **Sảnh Vườn 3D & Camera 360° Tự Do**: Di chuyển nhân vật bằng `WASD` / chạm sàn, kéo chuột xoay 360° hoặc thu phóng quanh bệ thờ Giáo Chủ Dobby Hắc Ám.
- **Nghi Thức Mõ Hắc Hoả 108**: Gõ trực tiếp bằng chuột hoặc phím `M`, hiển thị sóng âm `CỐC! +1`, lời kệ xả bug và cộng **Phước Tự Do** toàn sảnh.
- **Xin Quẻ 3 Chế Độ**:
  1. **Hôm nay ăn gì** & **Hôm nay đi đâu**: Lọc theo *Ngân sách* và *Đi 1 mình hay tụ tập*, diễn hoạt tuần tự **Lắc Quẻ** → **Rớt Quẻ** xuống chiếu nhung đỏ → mở thẻ kết quả kèm xuất ảnh chia sẻ PNG.
  2. **Lá số tử vi tinh gọn**: Tính theo ngày sinh Dương lịch (`Temporal.PlainDate`) và giới tính, trả về **Chỉ số Tình Duyên**, **Chỉ số Tài Chính** và **Tối hậu thư của Dobby**.
- **Backend Đa Tầng (Supabase + Vercel Serverless `/api/sanctuary`)**:
  - Đồng bộ cùng dự án Supabase `fxucyrofcsuqtlkukcrx` với `7-Potters` & `Undercover Hogwarts` (xem schema tại `scripts/setup_dobby_database.sql`).
  - Tự động định tuyến qua `/api/sanctuary` khi chạy trên Vercel Serverless và kích hoạt kênh Supabase Realtime (`eventsPerSecond: 20`) ngay khi dự án Supabase hoạt động.

## 🚀 Chạy Cục Bộ & Build Production

```bash
npm install
npm run dev      # http://localhost:5179/
npm run build    # Xuất dist/ kèm nén tĩnh .gz mức 9
```
